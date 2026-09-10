declare const supabase:any;
const URL='https://ewtgkjcmnwjoqfldrtuw.supabase.co';
const KEY='sb_publishable_ZEAZWO-Q-_rvMsy6krr_nw_JDRmP_kI';
const esc=(s:any)=>String(s??'').replace(/[&<>"']/g,(c:string)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} as any)[c]);

document.head.insertAdjacentHTML('beforeend',`<style>.series-browser{margin:28px 0;padding:22px;border:1px solid #272a30;border-radius:18px;background:#0d0f12}.series-browser-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:16px}.season-tabs{display:flex;gap:8px;overflow:auto;padding-bottom:8px}.season-tab{white-space:nowrap;border:1px solid #343840;background:#17191e;color:#fff;padding:9px 13px;border-radius:999px;text-decoration:none;font-weight:800}.season-tab.active{background:#fff;color:#08090b}.episode-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(135px,1fr));gap:10px;margin-top:16px}.episode-btn{border:1px solid #2c3037;background:#15171b;color:#fff;border-radius:12px;padding:14px;text-align:left;cursor:pointer}.episode-btn.active{border-color:#e50914;background:#201013}.episode-btn strong,.episode-btn span{display:block}.episode-btn span{color:#9b9fa8;font-size:.78rem;margin-top:4px}@media(max-width:640px){.series-browser{padding:16px}.episode-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}</style>`);

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
  const currentSeason=seasonNo(m.title), episodes=Math.max(0,Number(m.episode_count)||0), playlist=String(m.full_video_embed_url||''), canIndex=episodes>0&&/videoseries\?list=/i.test(playlist);
  const section=document.createElement('section');section.className='series-browser';
  section.innerHTML=`<div class='series-browser-head'><div><small>SERIES & EPISODES</small><h2>${esc(base)}</h2></div><span class='badge'>${episodes?`${episodes} episodes`:'Series'}</span></div>${seasonRows.length?`<div class='season-tabs'>${seasonRows.map((s:any)=>`<a class='season-tab ${s.slug===m.slug?'active':''}' href='./movie.html?slug=${encodeURIComponent(s.slug)}'>Season ${seasonNo(s.title)}</a>`).join('')}</div>`:''}${canIndex?`<div class='episode-grid'>${Array.from({length:episodes},(_,i)=>`<button class='episode-btn ${i===0?'active':''}' data-episode='${i}' type='button'><strong>Episode ${i+1}</strong><span>Season ${currentSeason}</span></button>`).join('')}</div>`:`<p class='muted'>Episode list will appear when episode-level playback is available.</p>`}`;
  const playerSection=document.querySelector('.legal-player-section');if(playerSection)playerSection.insertAdjacentElement('afterend',section);else root.appendChild(section);
  if(canIndex){const iframe=document.querySelector<HTMLIFrameElement>('.legal-player iframe');section.querySelectorAll<HTMLButtonElement>('[data-episode]').forEach(btn=>btn.addEventListener('click',()=>{const idx=Number(btn.dataset.episode||0);section.querySelectorAll('.episode-btn').forEach(x=>x.classList.remove('active'));btn.classList.add('active');if(iframe){iframe.src=`${playlist}&index=${idx}`;document.querySelector('#watch')?.scrollIntoView({behavior:'smooth',block:'start'});}}));}
}
boot();
