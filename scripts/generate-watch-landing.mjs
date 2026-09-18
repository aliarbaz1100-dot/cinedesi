import { writeFile } from 'node:fs/promises';

const SUPABASE_URL='https://ewtgkjcmnwjoqfldrtuw.supabase.co';
const KEY=process.env.SUPABASE_PUBLISHABLE_KEY||'sb_publishable_ZEAZWO-Q-_rvMsy6krr_nw_JDRmP_kI';
const SITE='https://cinedesi.online';

const esc=(v)=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const clean=(v)=>String(v??'').replace(/\s+/g,' ').trim();

async function fetchRows(){
  const rows=[]; const pageSize=1000;
  for(let offset=0;;offset+=pageSize){
    const url=new URL(`${SUPABASE_URL}/rest/v1/movies`);
    url.searchParams.set('select','slug,title,region,genre,release_year,content_type,full_video_source,full_video_language,full_video_checked_at');
    url.searchParams.set('status','eq.published');
    url.searchParams.set('full_video_verified','eq.true');
    url.searchParams.set('order','full_video_checked_at.desc.nullslast,release_year.desc,title.asc');
    url.searchParams.set('limit',String(pageSize));
    url.searchParams.set('offset',String(offset));
    const r=await fetch(url,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Accept-Profile':'public'}});
    if(!r.ok) throw new Error(`Watch landing fetch failed: ${r.status}`);
    const batch=await r.json(); rows.push(...batch); if(batch.length<pageSize) break;
  }
  return rows;
}

async function main(){
  const rows=await fetchRows();
  const visible=rows.slice(0,160);
  const desc=`Browse ${rows.length} published CineDesi titles with verified in-site full-play sources. Availability is source-checked and may change when providers update or remove videos.`;
  const cards=visible.map(row=>{
    const meta=[row.release_year,row.region,row.content_type==='series'?'Series':'Movie',row.genre].filter(Boolean).join(' · ');
    const source=clean(row.full_video_source);
    return `<a class="watch-card" href="/title-${encodeURIComponent(clean(row.slug))}.html"><strong>${esc(row.title)}</strong><span>${esc(meta)}</span><em>Watch on CineDesi${source?` · ${esc(source)}`:''}</em></a>`;
  }).join('');
  const schema={
    '@context':'https://schema.org','@type':'CollectionPage',name:'Watch on CineDesi',
    url:`${SITE}/watch-on-cinedesi.html`,description:desc,isPartOf:{'@id':`${SITE}/#website`},
    mainEntity:{'@type':'ItemList',numberOfItems:rows.length,itemListElement:visible.slice(0,50).map((r,i)=>({
      '@type':'ListItem',position:i+1,name:r.title,url:`${SITE}/title-${encodeURIComponent(clean(r.slug))}.html`
    }))}
  };
  const html=`<!doctype html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Watch on CineDesi | Verified Full Movies & Series</title>
<meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow">
<link rel="canonical" href="${SITE}/watch-on-cinedesi.html"><meta name="theme-color" content="#08090b">
<meta property="og:site_name" content="CineDesi"><meta property="og:type" content="website">
<meta property="og:title" content="Watch on CineDesi"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}/watch-on-cinedesi.html"><meta property="og:image" content="${SITE}/cinedesi-icon-512.png">
<meta name="twitter:card" content="summary"><meta name="twitter:image" content="${SITE}/cinedesi-icon-512.png">
<link rel="icon" type="image/png" sizes="192x192" href="/cinedesi-icon-192.png"><link rel="icon" type="image/svg+xml" href="/cinedesi-icon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="/cinedesi-apple-touch.png"><link rel="stylesheet" href="./src/styles.css">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<style>.watch-summary{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0 28px}.watch-summary span{border:1px solid #2c2e34;border-radius:999px;padding:7px 10px;background:#111317;color:#babdc5;font-size:12px}.watch-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(245px,1fr));gap:10px}.watch-card{display:flex;min-height:120px;flex-direction:column;padding:15px;border:1px solid #24262b;border-radius:13px;background:#101216;color:#fff;text-decoration:none}.watch-card:hover{border-color:#4a4d56;transform:translateY(-1px)}.watch-card span{margin-top:7px;color:#979aa3;font-size:12px;line-height:1.45}.watch-card em{margin-top:auto;padding-top:12px;color:#ef4550;font-style:normal;font-size:10px;font-weight:800}.watch-note{max-width:850px;color:#a7abb4;line-height:1.65}</style>
</head><body><header><a class="logo" href="./">CINE<span>DESI</span></a><nav><a href="./">Discover</a><a href="./catalog.html">Catalog</a><a href="./guides.html">Guides</a><a href="./about.html">About</a></nav></header>
<main class="legal-page"><small>VERIFIED IN-SITE PLAYBACK</small><h1>Watch on CineDesi</h1><p class="lead">${esc(desc)}</p>
<div class="watch-summary"><span>${rows.length} current full-play titles</span><span>Source checked</span><span>Playback availability reviewed</span></div>
<p class="watch-note">“Watch on CineDesi” means CineDesi currently has a verified source configured for in-site playback. It does not mean CineDesi owns the underlying movie or series. Source availability can change, and unavailable playback is reviewed or removed.</p>
<h2>Recently verified full-play titles</h2><div class="watch-grid">${cards}</div>
<p class="watch-note">Showing the most recently verified ${visible.length} titles on this page. Use the full catalog and filters to explore the complete CineDesi library.</p>
<div class="legal-nav"><a class="btn" href="./catalog.html">Open full catalog</a><a class="btn secondary" href="./editorial.html">Editorial standards</a><a class="btn secondary" href="./rights.html">Rights-holder requests</a></div>
</main><footer><div class="logo">CINE<span>DESI</span></div><p>Verified discovery, official sources and legal watch destinations.</p><div><a href="./contact.html">Contact</a><a href="./privacy.html">Privacy</a><a href="#" data-privacy-choices>Privacy choices</a></div></footer></body></html>`;
  await writeFile('watch-on-cinedesi.html',html,'utf8');
  console.log(`Generated Watch on CineDesi landing page with ${rows.length} verified full-play titles.`);
}
await main();
