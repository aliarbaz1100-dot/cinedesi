import { writeFile } from 'node:fs/promises';

const SUPABASE_URL='https://ewtgkjcmnwjoqfldrtuw.supabase.co';
const KEY=process.env.SUPABASE_PUBLISHABLE_KEY||'sb_publishable_ZEAZWO-Q-_rvMsy6krr_nw_JDRmP_kI';
const SITE='https://cinedesi.online';

async function stats(){
  const url=new URL(`${SUPABASE_URL}/rest/v1/movies`);
  url.searchParams.set('select','status,content_type,full_video_verified,watch_verified');
  url.searchParams.set('status','eq.published');
  url.searchParams.set('limit','2000');
  const r=await fetch(url,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Accept-Profile':'public'}});
  if(!r.ok) throw new Error(`Media kit stats fetch failed: ${r.status}`);
  const rows=await r.json();
  return {
    published:rows.length,
    series:rows.filter(x=>x.content_type==='series').length,
    full:rows.filter(x=>x.full_video_verified).length,
    legal:rows.filter(x=>x.watch_verified).length
  };
}

async function main(){
  const s=await stats();
  const desc='CineDesi media kit for sponsors, studios, streaming services and press, with current platform scale, partnership principles and brand information.';
  const html=`<!doctype html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CineDesi Media Kit | Sponsors, Studios & Press</title>
<meta name="description" content="${desc}"><meta name="robots" content="index,follow">
<link rel="canonical" href="${SITE}/media-kit.html"><meta name="theme-color" content="#08090b">
<meta property="og:site_name" content="CineDesi"><meta property="og:type" content="website">
<meta property="og:title" content="CineDesi Media Kit"><meta property="og:description" content="${desc}">
<meta property="og:url" content="${SITE}/media-kit.html"><meta property="og:image" content="${SITE}/cinedesi-icon-512.png">
<meta name="twitter:card" content="summary"><meta name="twitter:image" content="${SITE}/cinedesi-icon-512.png">
<link rel="icon" type="image/png" sizes="192x192" href="/cinedesi-icon-192.png"><link rel="icon" type="image/svg+xml" href="/cinedesi-icon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="/cinedesi-apple-touch.png">
<link rel="stylesheet" href="./src/styles.css">
<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'WebPage',name:'CineDesi Media Kit',url:`${SITE}/media-kit.html`,description:desc,isPartOf:{'@id':`${SITE}/#website`},about:{'@id':`${SITE}/#organization`}})}</script>
</head><body>
<header><a class="logo" href="./">CINE<span>DESI</span></a><nav><a href="./">Discover</a><a href="./about.html">About</a><a href="./partner.html">Partner</a><a href="./contact.html">Contact</a></nav></header>
<main class="legal-page"><small>MEDIA KIT</small><h1>Partner with a cleaner movie-discovery experience.</h1>
<p>CineDesi is an independent, student-built entertainment discovery platform focused on official sources, verified legal watch destinations and rights-aware publishing. This page reflects current platform scale without inflating audience claims.</p>
<div class="guide-grid"><article><span>${s.published}</span><h3>Published titles</h3><p>Movies and series currently available in the live CineDesi catalog.</p></article><article><span>${s.full}</span><h3>Watch on CineDesi</h3><p>Published titles with verified in-site full-play sources.</p></article><article><span>${s.legal}</span><h3>Legal watch verified</h3><p>Published titles with verified legal viewing destinations.</p></article></div>
<h2>Who CineDesi is built for</h2><p>Audiences discovering Bollywood, Pakistani cinema, Hollywood, South Indian entertainment, Turkish titles, animation and other global movies and series.</p>
<h2>Partnership formats</h2><div class="guide-grid"><article><span>01</span><h3>Clearly labeled sponsorship</h3><p>Homepage, title-page or editorial-adjacent visibility that stays visually distinct from CineDesi recommendations and verification.</p></article><article><span>02</span><h3>Streaming & affiliate partnerships</h3><p>Qualified outbound destinations to legitimate services, subject to source verification and transparent disclosure.</p></article><article><span>03</span><h3>Studio, distributor & press support</h3><p>Official release information, assets, licensing discussions and press coordination from authorized representatives.</p></article></div>
<h2>What CineDesi does not sell</h2><p>Editorial ratings, rights verification, fake play buttons, forced redirects, hidden sponsorships or guaranteed rankings are not for sale.</p>
<h2>Brand identity</h2><p>The official CineDesi identity for cinedesi.online uses the red <strong>C</strong> brand mark. Brand assets should not be altered or presented as implying an endorsement without approval.</p>
<p class="muted">Audience and traffic claims are intentionally omitted here until they can be supported by stable first-party analytics.</p>
<div class="legal-nav"><a class="btn" href="./partner.html">Send a partnership inquiry</a><a class="btn secondary" href="./licensing.html">Content licensing</a><a class="btn secondary" href="./disclosure.html">Advertising disclosure</a><a class="btn secondary" href="./editorial.html">Editorial standards</a></div>
</main></body></html>`;
  await writeFile('media-kit.html',html,'utf8');
  console.log(`Generated CineDesi media kit: ${s.published} published, ${s.full} full-play, ${s.legal} legal-watch verified.`);
}
await main();
