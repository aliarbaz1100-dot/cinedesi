import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SUPABASE_URL = 'https://ewtgkjcmnwjoqfldrtuw.supabase.co';
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ZEAZWO-Q-_rvMsy6krr_nw_JDRmP_kI';
const SITE = 'https://cinedesi.online';

const esc = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const truncate = (value, max = 158) => {
  const text = clean(value);
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const safe = cut.includes(' ') ? cut.slice(0, cut.lastIndexOf(' ')) : cut;
  return safe.replace(/[,:;\-\s]+$/g, '') + '…';
};

const titleFor = (row) => {
  const custom = clean(row.seo_title);
  if (custom) return truncate(custom, 65);
  const year = row.release_year ? ` (${row.release_year})` : '';
  return truncate(`${row.title}${year} – Where to Watch | CineDesi`, 65);
};

const descriptionFor = (row) => {
  const custom = clean(row.seo_description);
  if (custom) return truncate(custom, 158);
  const source = clean(row.synopsis) || clean(row.editorial);
  if (source) return truncate(source, 158);
  return truncate(`Discover ${row.title} on CineDesi with official trailers and verified legal watch destinations where available.`, 158);
};

async function fetchAllPublished() {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const endpoint = new URL(`${SUPABASE_URL}/rest/v1/movies`);
    endpoint.searchParams.set('select', 'slug,title,release_year,genre,region,content_type,seo_title,seo_description,synopsis,editorial,poster_url,original_language,updated_at');
    endpoint.searchParams.set('status', 'eq.published');
    endpoint.searchParams.set('order', 'updated_at.desc');
    endpoint.searchParams.set('limit', String(pageSize));
    endpoint.searchParams.set('offset', String(offset));

    const res = await fetch(endpoint, {
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Accept-Profile': 'public'
      }
    });
    if (!res.ok) throw new Error(`Supabase SEO page fetch failed: ${res.status}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

function injectMeta(template, row) {
  const slug = row.slug;
  const pageUrl = `${SITE}/title-${encodeURIComponent(slug)}.html`;
  const title = titleFor(row);
  const description = descriptionFor(row);
  const type = row.content_type === 'series' ? 'video.tv_show' : 'video.movie';
  const schemaType = row.content_type === 'series' ? 'TVSeries' : 'Movie';
  const image = clean(row.poster_url) || `${SITE}/cinedesi-icon-512.png`;
  const visibleSummary = descriptionFor(row);
  const metaLine = [row.release_year, row.genre, row.region].filter(Boolean).map(esc).join(' · ');

  let html = template
    .replace(/<title>[^<]*<\/title>/i, `<title>${esc(title)}</title>`)
    .replace(/<meta\s+name=['"]description['"]\s+content=['"][^'"]*['"]\s*\/?\s*>/i, `<meta name="description" content="${esc(description)}">`)
    .replace(/<meta\s+name=['"]robots['"]\s+content=['"][^'"]*['"]\s*\/?\s*>/i, `<meta name="robots" content="${row._indexable ? 'index,follow' : 'noindex,follow'}">`)
    .replace(/<meta\s+property=['"]og:type['"]\s+content=['"][^'"]*['"]\s*\/?\s*>/i, `<meta property="og:type" content="${type}">`);

  html = html.replace('</head>', [
    `<link rel="canonical" href="${pageUrl}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${pageUrl}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${esc(image)}">`,
    `<script id="movie-schema" type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': schemaType,
      '@id': `${pageUrl}#title`,
      name: row.title,
      url: pageUrl,
      mainEntityOfPage: pageUrl,
      description,
      image,
      dateCreated: row.release_year ? String(row.release_year) : undefined,
      dateModified: row.updated_at ? String(row.updated_at) : undefined,
      genre: row.genre || undefined,
      inLanguage: row.original_language || undefined,
      publisher: { '@id': `${SITE}/#organization` },
      isPartOf: { '@id': `${SITE}/#website` }
    })}</script>`,
    `<script id="breadcrumb-schema" type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'CineDesi', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Catalog', item: `${SITE}/catalog.html` },
        { '@type': 'ListItem', position: 3, name: row.title, item: pageUrl }
      ]
    })}</script>`,
    '</head>'
  ].join(''));

  html = html.replace(
    /<main id=['"]movie-page['"] class=['"]movie-page['"]>[\s\S]*?<\/main>/i,
    `<main id="movie-page" class="movie-page"><section class="detail-prerender"><small>CINEDESI TITLE</small><h1>${esc(row.title)}</h1>${metaLine ? `<p class="muted">${metaLine}</p>` : ''}<p>${esc(visibleSummary)}</p><p class="muted">Loading verified playback and source details…</p></section></main>`
  );

  return html;
}

async function main() {
  const template = await readFile('dist/movie.html', 'utf8');
  const rows = await fetchAllPublished();
  let written = 0;
  let indexable = 0;

  for (const row of rows) {
    const slug = clean(row.slug);
    const depth = Math.max(clean(row.synopsis).length, clean(row.editorial).length);
    if (!/^[a-z0-9][a-z0-9-]{0,180}$/i.test(slug)) continue;
    const isIndexable = depth >= 120;
    const html = injectMeta(template, { ...row, slug, _indexable: isIndexable });
    await writeFile(join('dist', `title-${slug}.html`), html, 'utf8');
    written += 1;
    if (isIndexable) indexable += 1;
  }

  console.log(`Generated ${written} functional CineDesi title pages; ${indexable} are search-indexable.`);
}

await main();
