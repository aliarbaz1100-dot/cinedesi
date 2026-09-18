import { writeFile } from 'node:fs/promises';

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

async function fetchPublished() {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const endpoint = new URL(`${SUPABASE_URL}/rest/v1/movies`);
    endpoint.searchParams.set('select', 'slug,title,region,genre,release_year,content_type,score,watch_verified,full_video_verified,trailer_verified,poster_url');
    endpoint.searchParams.set('status', 'eq.published');
    endpoint.searchParams.set('limit', String(pageSize));
    endpoint.searchParams.set('offset', String(offset));
    const response = await fetch(endpoint, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Accept-Profile': 'public' }
    });
    if (!response.ok) throw new Error(`Collection fetch failed: ${response.status}`);
    const batch = await response.json();
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

const configs = [
  {
    file: 'bollywood.html',
    name: 'Bollywood Movies',
    short: 'Bollywood',
    description: 'Explore Hindi-language Bollywood movies on CineDesi with official trailers, verified legal watch destinations and Watch on CineDesi playback where available.',
    about: 'Bollywood cinema',
    match: (r) => r.region === 'Bollywood'
  },
  {
    file: 'hollywood.html',
    name: 'Hollywood Movies',
    short: 'Hollywood',
    description: 'Explore Hollywood movies on CineDesi with official trailers, verified legal watch destinations and Watch on CineDesi playback where available.',
    about: 'Hollywood cinema',
    match: (r) => r.region === 'Hollywood' || r.region === 'USA' || String(r.region || '').startsWith('Hollywood /')
  },
  {
    file: 'pakistani.html',
    name: 'Pakistani Movies & Series',
    short: 'Pakistani',
    description: 'Explore Pakistani movies and series on CineDesi with official trailers, verified legal watch destinations and Watch on CineDesi playback where available.',
    about: 'Pakistani cinema and television',
    match: (r) => r.region === 'Pakistan' || r.region === 'Pakistani'
  },
  {
    file: 'south-indian.html',
    name: 'South Indian & Hindi Dubbed',
    short: 'South Indian',
    description: 'Explore South Indian and Hindi-dubbed movies on CineDesi with official trailers, verified legal watch destinations and Watch on CineDesi playback where available.',
    about: 'South Indian cinema',
    match: (r) => ['South','South Indian','South Indian Dubbed','India / South Indian'].includes(r.region)
  },
  {
    file: 'turkish.html',
    name: 'Turkish Movies & Series',
    short: 'Turkish',
    description: 'Explore Turkish movies and series on CineDesi with official trailers, verified legal watch destinations and Watch on CineDesi playback where available.',
    about: 'Turkish cinema and television',
    match: (r) => r.region === 'Turkish' || r.region === 'Turkey'
  },
  {
    file: 'cartoons.html',
    name: 'Cartoons & Animation',
    short: 'Cartoons',
    description: 'Explore cartoons and animation on CineDesi with official trailers, verified legal watch destinations and Watch on CineDesi playback where available.',
    about: 'Animation and cartoons',
    match: (r) => /cartoon|animation|anime/i.test(String(r.genre || ''))
  }
];

const status = (row) => row.full_video_verified ? 'Watch on CineDesi' : row.watch_verified ? 'Legal watch' : row.trailer_verified ? 'Official trailer' : 'Discover';

const score = (row) => {
  const release = Number(row.release_year) || 0;
  const rating = Number(row.score) || 0;
  const availability = row.full_video_verified ? 300 : row.watch_verified ? 180 : row.trailer_verified ? 80 : 0;
  return release * 1000 + availability + Math.min(100, rating);
};

const card = (row) => {
  const meta = [row.release_year, row.content_type === 'series' ? 'Series' : 'Movie', row.genre].filter(Boolean).join(' · ');
  const href = `/title-${encodeURIComponent(clean(row.slug))}.html`;
  return `<a class="collection-card" href="${href}"><span class="collection-art"${row.poster_url ? ` style="background-image:url('${esc(row.poster_url)}')"` : ''}></span><span class="collection-copy"><strong>${esc(row.title)}</strong><small>${esc(meta)}</small><em>${esc(status(row))}</em></span></a>`;
};

function renderPage(config, rows) {
  const selected = rows.filter(config.match).sort((a, b) => score(b) - score(a) || String(a.title).localeCompare(String(b.title)));
  const featured = selected.slice(0, 60);
  const full = selected.filter((r) => r.full_video_verified).length;
  const legal = selected.filter((r) => r.watch_verified).length;
  const trailers = selected.filter((r) => r.trailer_verified).length;
  const url = `${SITE}/${config.file}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${config.name} on CineDesi`,
    url,
    description: config.description,
    isPartOf: { '@id': `${SITE}/#website` },
    about: { '@type': 'Thing', name: config.about },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: selected.length,
      itemListElement: featured.slice(0, 25).map((row, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: row.title,
        url: `${SITE}/title-${encodeURIComponent(clean(row.slug))}.html`
      }))
    }
  };
  return `<!doctype html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(config.name)} on CineDesi | Legal Watch Discovery</title>
<meta name="description" content="${esc(config.description)}"><meta name="robots" content="index,follow">
<link rel="canonical" href="${url}"><meta name="theme-color" content="#08090b">
<meta property="og:site_name" content="CineDesi"><meta property="og:type" content="website">
<meta property="og:title" content="${esc(config.name)} on CineDesi"><meta property="og:description" content="${esc(config.description)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/cinedesi-icon-512.png">
<meta name="twitter:card" content="summary"><meta name="twitter:image" content="${SITE}/cinedesi-icon-512.png">
<link rel="icon" type="image/png" sizes="192x192" href="/cinedesi-icon-192.png">
<link rel="icon" type="image/svg+xml" href="/cinedesi-icon.svg"><link rel="apple-touch-icon" sizes="180x180" href="/cinedesi-apple-touch.png">
<link rel="stylesheet" href="./src/styles.css"><link rel="stylesheet" href="./src/premium.css">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<style>.collection-stats{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 28px}.collection-stats span{border:1px solid #2b2d31;border-radius:999px;padding:7px 10px;background:#111317;color:#b7bac2;font-size:12px}.collection-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}.collection-card{display:grid;grid-template-columns:76px 1fr;min-height:112px;border:1px solid #24262b;border-radius:14px;overflow:hidden;background:#101216;color:#fff;text-decoration:none}.collection-card:hover{border-color:#494c54;transform:translateY(-1px)}.collection-art{background:#17191e center/cover no-repeat}.collection-copy{display:flex;flex-direction:column;gap:6px;padding:13px}.collection-copy strong{line-height:1.25}.collection-copy small{color:#92969f;line-height:1.35}.collection-copy em{margin-top:auto;color:#ef4550;font-style:normal;font-size:10px;font-weight:800}.collection-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:28px}@media(max-width:620px){.collection-grid{grid-template-columns:1fr}.collection-card{grid-template-columns:88px 1fr}}</style>
</head><body><header class="catalog-header"><a class="logo" href="./">CINE<span>DESI</span></a><nav><a href="./">Home</a><a href="./catalog.html">Catalog</a><a href="./guides.html">Guides</a><a href="./about.html">About</a></nav></header>
<main class="section"><small>CINEDESI COLLECTION</small><h1>${esc(config.name)}</h1><p class="lead">${esc(config.description)}</p>
<div class="collection-stats"><span>${selected.length} published titles</span><span>${full} Watch on CineDesi</span><span>${legal} legal-watch verified</span><span>${trailers} official trailers</span></div>
<h2>Featured ${esc(config.short)} titles</h2><div class="collection-grid">${featured.map(card).join('')}</div>
<div class="collection-links"><a class="btn" href="./catalog.html">Open full catalog</a><a class="btn secondary" href="./#discover">Search CineDesi</a></div>
<section><h2>Explore more CineDesi collections</h2><p><a href="./bollywood.html">Bollywood</a> · <a href="./pakistani.html">Pakistani</a> · <a href="./hollywood.html">Hollywood</a> · <a href="./south-indian.html">South Indian</a> · <a href="./turkish.html">Turkish</a> · <a href="./cartoons.html">Cartoons & animation</a></p></section>
</main><footer><div class="logo">CINE<span>DESI</span></div><p>Movie and series discovery with verified official sources and legal watch destinations.</p><div><a href="./contact.html">Contact</a><a href="./editorial.html">Editorial standards</a><a href="./rights.html">Rights</a><a href="./privacy.html">Privacy</a><a href="#" data-privacy-choices>Privacy choices</a></div></footer></body></html>`;
}

async function main() {
  const rows = await fetchPublished();
  for (const config of configs) {
    const html = renderPage(config, rows);
    await writeFile(config.file, html, 'utf8');
    const count = rows.filter(config.match).length;
    console.log(`Generated ${config.file} with ${count} current published titles.`);
  }
}

await main();
