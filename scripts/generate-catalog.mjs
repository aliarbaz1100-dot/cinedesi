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
    endpoint.searchParams.set('select', 'slug,title,region,genre,release_year,content_type,watch_verified,full_video_verified,trailer_verified');
    endpoint.searchParams.set('status', 'eq.published');
    endpoint.searchParams.set('order', 'release_year.desc.nullslast,title.asc');
    endpoint.searchParams.set('limit', String(pageSize));
    endpoint.searchParams.set('offset', String(offset));

    const response = await fetch(endpoint, {
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Accept-Profile': 'public'
      }
    });
    if (!response.ok) throw new Error(`Catalog fetch failed: ${response.status}`);
    const batch = await response.json();
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

const statusLabel = (row) => {
  if (row.full_video_verified) return 'Watch on CineDesi';
  if (row.watch_verified) return 'Legal watch';
  if (row.trailer_verified) return 'Official trailer';
  return 'Discover';
};

const itemHtml = (row) => {
  const slug = clean(row.slug);
  const region = clean(row.region);
  const genre = clean(row.genre);
  const type = clean(row.content_type) || 'movie';
  const year = Number(row.release_year) || '';
  const status = statusLabel(row);
  const search = [row.title, region, genre, year, type, status].filter(Boolean).join(' ').toLowerCase();
  const href = `/title-${encodeURIComponent(slug)}.html`;
  const meta = [region, type ? type[0].toUpperCase() + type.slice(1) : '', year, genre].filter(Boolean).join(' · ');
  return `<a class="item" data-search="${esc(search)}" href="${href}"><strong>${esc(row.title)}</strong><span>${esc(meta)}</span><em>${esc(status)}</em></a>`;
};

async function main() {
  const rows = await fetchPublished();
  const published = rows.length;
  const series = rows.filter((row) => row.content_type === 'series').length;
  const cineDesi = rows.filter((row) => row.full_video_verified).length;
  const legal = rows.filter((row) => row.watch_verified).length;
  const trailers = rows.filter((row) => row.trailer_verified).length;

  const groups = new Map();
  for (const row of rows) {
    const year = Number(row.release_year);
    const key = Number.isFinite(year) && year > 0 ? String(year) : 'Other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const orderedKeys = [...groups.keys()].sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return Number(b) - Number(a);
  });

  const sections = orderedKeys.map((key) =>
    `<section class="year-group"><h2>${esc(key)}</h2><div class="grid">${groups.get(key).map(itemHtml).join('')}</div></section>`
  ).join('');

  const description = `Browse ${published} published CineDesi movie and series pages with official trailers, verified legal watch destinations and Watch on CineDesi playback where available.`;

  const html = `<!doctype html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CineDesi Movie & Series Catalog — ${published} Published Titles</title>
<meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow">
<link rel="canonical" href="${SITE}/catalog.html">
<meta name="theme-color" content="#08090b"><meta property="og:site_name" content="CineDesi">
<meta property="og:type" content="website"><meta property="og:title" content="CineDesi Movie & Series Catalog">
<meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${SITE}/catalog.html">
<meta property="og:image" content="${SITE}/cinedesi-icon-512.png">
<meta name="twitter:card" content="summary"><meta name="twitter:image" content="${SITE}/cinedesi-icon-512.png">
<link rel="icon" type="image/png" sizes="192x192" href="/cinedesi-icon-192.png">
<link rel="icon" type="image/svg+xml" href="/cinedesi-icon.svg"><link rel="apple-touch-icon" sizes="180x180" href="/cinedesi-apple-touch.png">
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'CineDesi Movie & Series Catalog',
  url: `${SITE}/catalog.html`,
  description,
  isPartOf: { '@type': 'WebSite', name: 'CineDesi', url: `${SITE}/` },
  mainEntity: { '@type': 'ItemList', numberOfItems: published }
})}</script>
<style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#070707;color:#f5f5f5;font-family:Arial,sans-serif}main{max-width:1200px;margin:auto;padding:34px 20px 70px}.logo{font-weight:950;font-size:28px;color:#fff;text-decoration:none}.logo span{color:#e50914}.top{display:flex;justify-content:space-between;align-items:center;gap:16px}.top nav{display:flex;gap:14px;flex-wrap:wrap}.top a{color:#bbb;text-decoration:none}.top .logo{color:#fff}h1{font-size:clamp(34px,5vw,64px);line-height:.95;margin:42px 0 12px}.lead{color:#a8abb2;max-width:860px;line-height:1.6}.stats{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}.stats span{padding:7px 10px;border:1px solid #292929;border-radius:999px;background:#111;font-size:12px}.search{position:sticky;top:10px;z-index:5;margin:28px 0 26px;padding:10px;border:1px solid #2b2b2b;border-radius:13px;background:#0d0e10e8;backdrop-filter:blur(18px)}.search input{width:100%;height:46px;padding:0 14px;border:1px solid #34363c;border-radius:9px;background:#17181c;color:#fff}.year-group{margin:34px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:10px}.item{display:flex;min-height:116px;flex-direction:column;padding:15px;border:1px solid #24262b;border-radius:12px;background:#111317;color:#fff;text-decoration:none}.item:hover{border-color:#474a52;transform:translateY(-1px)}.item span{margin-top:7px;color:#969aa3;font-size:12px;line-height:1.45}.item em{margin-top:auto;padding-top:10px;color:#ef4550;font-size:10px;font-style:normal;font-weight:800}.empty{display:none;color:#aaa;padding:20px 0}footer{max-width:1200px;margin:auto;padding:0 20px 50px;color:#8c9098}footer a{color:#b9bcc3;margin-right:14px}@media(max-width:620px){main{padding:22px 14px 80px}.top{align-items:flex-start}.top nav{justify-content:flex-end}.grid{grid-template-columns:1fr 1fr}.item{min-height:132px;padding:12px}.item strong{font-size:13px}.item span{font-size:10px}}</style>
</head><body><main><div class="top"><a class="logo" href="/">CINE<span>DESI</span></a><nav><a href="/">Home</a><a href="/about.html">About</a><a href="/contact.html">Contact</a></nav></div>
<h1>Full Movies & Series Catalog</h1><p class="lead">${esc(description)}</p>
<div class="stats"><span>${published} published</span><span>${series} series</span><span>${cineDesi} Watch on CineDesi</span><span>${legal} legal watch</span><span>${trailers} official trailers</span></div>
<div class="search"><input id="catalog-search" type="search" placeholder="Search titles, genres, regions or years…" aria-label="Search catalog"></div><div id="empty" class="empty">No titles match.</div>
<div id="catalog">${sections}</div></main>
<footer><p>CineDesi — independent movie and series discovery with verified legal watch destinations.</p><p><a href="/editorial.html">Editorial standards</a><a href="/rights.html">Rights</a><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a></p></footer>
<script>const i=document.querySelector("#catalog-search"),a=[...document.querySelectorAll(".item")],g=[...document.querySelectorAll(".year-group")],e=document.querySelector("#empty");i.addEventListener("input",()=>{const q=i.value.trim().toLowerCase();let n=0;a.forEach(x=>{const s=!q||x.dataset.search.includes(q);x.hidden=!s;if(s)n++});g.forEach(x=>x.hidden=![...x.querySelectorAll(".item")].some(y=>!y.hidden));e.style.display=n?"none":"block"});</script>
</body></html>`;

  await writeFile('catalog.html', html, 'utf8');
  console.log(`Generated catalog.html with ${published} current published titles, ${cineDesi} Watch on CineDesi, ${legal} legal-watch verified.`);
}

await main();
