import { writeFile } from 'node:fs/promises';

const SUPABASE_URL='https://ewtgkjcmnwjoqfldrtuw.supabase.co';
const KEY=process.env.SUPABASE_PUBLISHABLE_KEY||'sb_publishable_ZEAZWO-Q-_rvMsy6krr_nw_JDRmP_kI';
const SITE='https://cinedesi.online';
const staticPages=['/','/about.html','/partner.html','/licensing.html','/editorial.html','/guides.html','/disclosure.html','/privacy.html','/terms.html','/copyright.html','/rights.html','/unsubscribe.html'];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const today=new Date().toISOString().slice(0,10);

async function main(){
  try{
    const endpoint=`${SUPABASE_URL}/rest/v1/movies?select=slug,updated_at&status=eq.published&order=updated_at.desc`;
    const res=await fetch(endpoint,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Accept-Profile':'public'}});
    if(!res.ok) throw new Error(`Supabase sitemap fetch failed: ${res.status}`);
    const rows=await res.json();
    const urls=[
      ...staticPages.map(path=>({loc:`${SITE}${path}`,lastmod:today})),
      ...rows.filter(x=>x.slug).map(x=>({loc:`${SITE}/movie.html?slug=${encodeURIComponent(x.slug)}`,lastmod:String(x.updated_at||today).slice(0,10)}))
    ];
    const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${esc(u.loc)}</loc><lastmod>${esc(u.lastmod)}</lastmod></url>`).join('\n')}\n</urlset>\n`;
    await writeFile('sitemap.xml',xml,'utf8');
    console.log(`Generated sitemap with ${urls.length} URLs (${rows.length} published titles).`);
  }catch(error){
    console.warn('Sitemap generation skipped; keeping existing sitemap.',error?.message||error);
  }
}

await main();
