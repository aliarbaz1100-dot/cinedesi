import { readFile } from 'node:fs/promises';

const HOST='cinedesi.online';
const KEY='7f3a2c91d8e64b0f9a5c3e2176d4b8f1';
const KEY_LOCATION=`https://${HOST}/${KEY}.txt`;
const ENDPOINT='https://api.indexnow.org/indexnow';

const xml=await readFile('dist/sitemap.xml','utf8');
const entries=[...xml.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g)]
  .map(([,loc,lastmod])=>({loc:loc.replace(/&amp;/g,'&'),lastmod}));

const cutoff=Date.now()-2*24*60*60*1000;
const always=new Set([
  `https://${HOST}/`,
  `https://${HOST}/catalog.html`,
  `https://${HOST}/watch-on-cinedesi.html`,
  `https://${HOST}/bollywood.html`,
  `https://${HOST}/pakistani.html`,
  `https://${HOST}/hollywood.html`,
  `https://${HOST}/south-indian.html`,
  `https://${HOST}/turkish.html`,
  `https://${HOST}/cartoons.html`,
  `https://${HOST}/about.html`,
  `https://${HOST}/media-kit.html`
]);

const urls=[...new Set(entries
  .filter(({loc,lastmod})=>{
    const t=Date.parse(lastmod+'T00:00:00Z');
    return always.has(loc)||(Number.isFinite(t)&&t>=cutoff);
  })
  .map(({loc})=>loc))]
  .filter((url)=>url.startsWith(`https://${HOST}/`));

if(!urls.length){
  console.log('IndexNow: no recent CineDesi URLs to submit.');
  process.exit(0);
}

for(let i=0;i<urls.length;i+=500){
  const batch=urls.slice(i,i+500);
  const response=await fetch(ENDPOINT,{
    method:'POST',
    headers:{'content-type':'application/json; charset=utf-8','user-agent':'CineDesi-IndexNow/1.0'},
    body:JSON.stringify({host:HOST,key:KEY,keyLocation:KEY_LOCATION,urlList:batch})
  });
  const body=await response.text();
  if(!response.ok){
    if(response.status===403 && /SiteVerificationNotCompleted/i.test(body)){
      console.warn('IndexNow ownership verification is still propagating; CineDesi will retry on a later run.');
      process.exit(0);
    }
    throw new Error(`IndexNow submission failed: HTTP ${response.status} ${body.slice(0,300)}`);
  }
  console.log(`IndexNow accepted ${batch.length} CineDesi URLs (HTTP ${response.status}).`);
}
