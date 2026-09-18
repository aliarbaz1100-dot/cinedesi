import { writeFile } from 'node:fs/promises';

const SUPABASE_URL = 'https://ewtgkjcmnwjoqfldrtuw.supabase.co';
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ZEAZWO-Q-_rvMsy6krr_nw_JDRmP_kI';
const SITE = 'https://cinedesi.online';

const esc = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const summary = (row) => {
  const raw = clean(row.seo_description) || clean(row.synopsis) || clean(row.editorial) ||
    `Discover ${row.title} on CineDesi with official trailers and verified legal watch destinations where available.`;
  return raw.length <= 240 ? raw : raw.slice(0, 237).replace(/\s+\S*$/, '') + '…';
};

async function fetchRecent() {
  const endpoint = new URL(`${SUPABASE_URL}/rest/v1/movies`);
  endpoint.searchParams.set('select', 'slug,title,updated_at,release_year,genre,region,seo_description,synopsis,editorial');
  endpoint.searchParams.set('status', 'eq.published');
  endpoint.searchParams.set('order', 'updated_at.desc');
  endpoint.searchParams.set('limit', '50');

  const response = await fetch(endpoint, {
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Accept-Profile': 'public'
    }
  });
  if (!response.ok) throw new Error(`CineDesi feed fetch failed: ${response.status}`);
  return response.json();
}

async function main() {
  const rows = await fetchRecent();
  const items = rows
    .filter((row) => /^[a-z0-9][a-z0-9-]{0,180}$/i.test(clean(row.slug)))
    .map((row) => {
      const url = `${SITE}/title-${encodeURIComponent(clean(row.slug))}.html`;
      const updated = row.updated_at ? new Date(row.updated_at).toUTCString() : new Date().toUTCString();
      const meta = [row.release_year, row.region, row.genre].filter(Boolean).join(' · ');
      return `  <item>
    <title>${esc(row.title)}</title>
    <link>${esc(url)}</link>
    <guid isPermaLink="true">${esc(url)}</guid>
    <pubDate>${esc(updated)}</pubDate>
    <description>${esc([meta, summary(row)].filter(Boolean).join(' — '))}</description>
  </item>`;
    }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>CineDesi — Latest Movies & Series Discovery</title>
  <link>${SITE}/</link>
  <description>Latest CineDesi movie and series pages with official trailers and verified legal watch destinations.</description>
  <language>en</language>
  <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>
`;

  await Promise.all([
    writeFile('feed.xml', xml, 'utf8'),
    writeFile('static/feed.xml', xml, 'utf8')
  ]);
  console.log(`Generated CineDesi RSS feed with ${rows.length} latest published titles.`);
}

await main();
