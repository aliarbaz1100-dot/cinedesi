import { writeFile } from 'node:fs/promises';

const SUPABASE_URL = 'https://ewtgkjcmnwjoqfldrtuw.supabase.co';
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ZEAZWO-Q-_rvMsy6krr_nw_JDRmP_kI';
const SITE = 'https://cinedesi.online';
const STATIC_PAGES = [
  '/',
  '/catalog.html',
  '/guides.html',
  '/about.html',
  '/contact.html',
  '/editorial.html',
  '/rights.html',
  '/licensing.html',
  '/partner.html',
  '/disclosure.html',
  '/privacy.html',
  '/terms.html',
  '/copyright.html',
  '/bollywood.html',
  '/hollywood.html',
  '/pakistani.html',
  '/south-indian.html',
  '/turkish.html',
  '/cartoons.html'
];

const esc = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const today = new Date().toISOString().slice(0, 10);

async function fetchAllPublished() {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const endpoint = new URL(`${SUPABASE_URL}/rest/v1/movies`);
    endpoint.searchParams.set('select', 'slug,updated_at,synopsis,editorial');
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
    if (!res.ok) throw new Error(`Supabase sitemap fetch failed: ${res.status}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

async function main() {
  try {
    const rows = await fetchAllPublished();
    const indexableRows = rows.filter((row) => {
      if (!row.slug) return false;
      const synopsis = String(row.synopsis || '').trim();
      const editorial = String(row.editorial || '').trim();
      return synopsis.length >= 120 || editorial.length >= 120;
    });

    const urls = [
      ...STATIC_PAGES.map((path) => ({ loc: `${SITE}${path}`, lastmod: today })),
      ...indexableRows.map((row) => ({
        loc: `${SITE}/movie?slug=${encodeURIComponent(row.slug)}`,
        lastmod: String(row.updated_at || today).slice(0, 10)
      }))
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(u.loc)}</loc><lastmod>${esc(u.lastmod)}</lastmod></url>`).join('\n')}\n</urlset>\n`;
    await Promise.all([
      writeFile('sitemap.xml', xml, 'utf8'),
      writeFile('static/sitemap.xml', xml, 'utf8')
    ]);
    console.log(`Generated sitemap with ${urls.length} URLs (${indexableRows.length}/${rows.length} published titles indexable) for source and deployed static output.`);
  } catch (error) {
    console.warn('Sitemap generation skipped; keeping existing sitemap.', error?.message || error);
  }
}

await main();
