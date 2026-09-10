declare const supabase:any;
const URL='https://ewtgkjcmnwjoqfldrtuw.supabase.co';
const KEY='sb_publishable_ZEAZWO-Q-_rvMsy6krr_nw_JDRmP_kI';
const esc=(s:any)=>String(s??'').replace(/[&<>"']/g,(c:string)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} as any)[c]);

document.head.insertAdjacentHTML('beforeend',`<style>
.series-browser{margin:32px 0;padding:0;border-top:1px solid #25282e;background:#0b0d10;border-radius:18px;overflow:hidden}.series-browser-head{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:22px 22px 14px}.series-browser-head h2{margin:2px 0 0}.series-browser-head small{color:#9da1aa;font-weight:800;letter-spacing:.12em}.season-tabs{display:flex;gap:10px;overflow:auto;padding:0 22px 16px;scrollbar-width:none}.season-tabs::-webkit-scrollbar{display:none}.season-tab{white-space:nowrap;border:1px solid #343840;background:#17191e;color:#fff;padding:10px 15px;border-radius:8px;text-decoration:none;font-weight:800}.season-tab.active{background:#fff;color:#08090b;border-color:#fff}.episode-list{display:flex;flex-direction:column}.episode-btn{display:grid;grid-template-columns:62px minmax(120px,190px) 1fr auto;align-items:center;gap:16px;width:100%;border:0;border-top:1px solid #23262c;background:#101216;color:#fff;padding:14px 18px;text-align:left;cursor:pointer;transition:.18s ease}.episode-btn:hover{background:#181b20}.episode-btn.active{background:#1b1d22}.episode-number{font-size:1.25rem;font-weight:900;text-align:center;color:#c9cbd0}.episode-thumb{aspect-ratio:16/9;border-radius:8px;background:linear-gradient(135deg,#2a2d33,#111318);display:flex;align-items:center;justify-content:center;font-size:1.35rem}.episode-copy strong{display:block;font-size:.98rem}.episode-copy span{display:block;color:#9da1aa;font-size:.82rem;margin-top:5px}.episode-play{font-size:1.1rem;color:#fff}.episode-btn.active .episode-number,.episode-btn.active .episode-play{color:#e50914}@media(max-width:700px){.series-browser-head{padding:18px 16px 12px}.season-tabs{padding:0 16px 14px}.episode-btn{grid-template-columns:38px 108px 1fr;gap:10px;padding:12px}.episode-play{display:none}.episode-number{font-size:1rem}.episode-copy strong{font-size:.9rem}.episode-copy span{font-size:.75rem}}
</style>`);

async function boot(){
  while(typeof supabase==='undefined') await new Promise(r=>setTimeout(r,80));
  const slug=new URLSearchParams(location.search).get('slug');if(!slug)return;
  const db=supabase.createClient(URL,KEY);
  const {data:m}=await db.from('movies').select('slug,title,content_type,episode_count,full_video_embed_url').eq('slug',slug).eq('status','published').maybeSingle();
  if(!m||m.content_type!=='series')return;
  for(let i=0;i<80&&!document.querySelector('.movie-hero');i++) await new Promise(r=>setTimeout(r,75));
  const root=document.querySelector<HTMLElement>('#movie-page');if(!root)return;
  const base=String(m.title).replace(/\s+season\s*\d+.*$/i,'').trim();
  const {data:seasons}=await db.from('movies').select('slug,title,episode_count,full_video_embed_url').eq('status','published').eq('content_type','series').ilike('title',`${base}%`);
  const seasonNo=(t:string)=>{const v=String(t).match(/season\s*(\d+)/i);return v?Number(v[1]):1};
  const seasonRows=(seasons||[]).filter((x:any)=>String(x.title).toLowerCase().startsWith(base.toLowerCase())).sort((a:any,b:any)=>seasonNo(a.title)-seasonNo(b.title));
  const currentSeason=seasonNo(m.title),episodes=Math.max(0,Number(m.episode_count)||0),playlist=String(m.full_video_embed_url||''),canIndex=episodes>0&&/videoseries\?list=/i.test(playlist);
  const section=document.createElement('section');section.className='series-browser';
  section.innerHTML=`<div class='series-browser-head'><div><small>SERIES & EPISODES</small><h2>${esc(base)}</h2></div><span class='badge'>${episodes?`${episodes} episodes`:'Series'}</span></div>${seasonRows.length?`<div class='season-tabs'>${seasonRows.map((s:any)=>`<a class='season-tab ${s.slug===m.slug?'active':''}' href='./movie.html?slug=${encodeURIComponent(s.slug)}'>Season ${seasonNo(s.title)}</a>`).join('')}</div>`:''}${canIndex?`<div class='episode-list'>${Array.from({length:episodes},(_,i)=>`<button class='episode-btn ${i===0?'active':''}' data-episode='${i}' type='button'><span class='episode-number'>${i+1}</span><span class='episode-thumb'>▶</span><span class='episode-copy'><strong>Episode ${i+1}</strong><span>Season ${currentSeason} • Play official episode</span></span><span class='episode-play'>▶</span></button>`).join('')}</div>`:`<p class='muted' style='padding:0 22px 22px'>Episode list will appear when episode-level playback is available.</p>`}`;
  const playerSection=document.querySelector('.legal-player-section');if(playerSection)playerSection.insertAdjacentElement('afterend',section);else root.appendChild(section);
  if(canIndex){
    const iframe=document.querySelector<HTMLIFrameElement>('.legal-player iframe');
    if(iframe&&!iframe.src.includes('enablejsapi=1')) iframe.src=iframe.src+(iframe.src.includes('?')?'&':'?')+'enablejsapi=1';
    const playAt=(idx:number)=>{if(!iframe)return;try{iframe.contentWindow?.postMessage(JSON.stringify({event:'command',func:'playVideoAt',args:[idx]}),'*')}catch{}setTimeout(()=>{try{iframe.contentWindow?.postMessage(JSON.stringify({event:'command',func:'playVideoAt',args:[idx]}),'*')}catch{}},350)};
    section.querySelectorAll<HTMLButtonElement>('[data-episode]').forEach(btn=>btn.addEventListener('click',()=>{const idx=Number(btn.dataset.episode||0);section.querySelectorAll('.episode-btn').forEach(x=>x.classList.remove('active'));btn.classList.add('active');playAt(idx);document.querySelector('#watch')?.scrollIntoView({behavior:'smooth',block:'start'});}));
  }
}
boot();
