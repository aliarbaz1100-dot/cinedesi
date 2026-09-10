declare const supabase:any;
const URL='https://ewtgkjcmnwjoqfldrtuw.supabase.co';
const KEY='sb_publishable_ZEAZWO-Q-_rvMsy6krr_nw_JDRmP_kI';
const esc=(s:any)=>String(s??'').replace(/[&<>"']/g,(c:string)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} as any)[c]);

if('scrollRestoration' in history) history.scrollRestoration='manual';
window.addEventListener('pageshow',()=>{if(!location.hash) requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'auto'}));});

type Movie={id:number;slug:string;title:string;region:string;genre:string;release_year:number;content_type:string;original_language:string;poster_url:string;full_video_verified:boolean;full_video_embed_url:string;watch_verified:boolean;watch_url:string;trailer_verified:boolean;trailer_url:string;rights_status:string};

const categoryMatch=(m:Movie,cat:string)=>{
  const g=String(m.genre||'').toLowerCase();
  if(cat==='Cartoons') return /cartoon|animation|animated|anime|kids|preschool/.test(g);
  if(cat==='Action') return /(^|\W)action(\W|$)|martial arts|superhero/.test(g);
  if(cat==='Comedy') return /comedy|satirical|black comedy/.test(g);
  if(cat==='Horror') return /horror|supernatural|slasher|zombie|monster/.test(g);
  if(cat==='Drama') return /drama/.test(g);
  if(cat==='Romance') return /romance|romantic|love/.test(g);
  if(cat==='Thriller') return /thriller|mystery|suspense/.test(g);
  return false;
};

const card=(m:Movie)=>`<article class='card'><a class='poster-link' href='./movie.html?slug=${encodeURIComponent(m.slug)}'><div class='poster' ${m.poster_url?`style="background-image:linear-gradient(180deg,#0000 55%,#000c),url('${esc(m.poster_url)}')"`:''}><span class='poster-region'>${esc(m.region||'Global')}</span>${m.full_video_verified&&m.full_video_embed_url?"<span class='poster-ribbon'>▶ Watch here</span>":''}</div></a><div class='info'><div class='card-title-row'><h3>${esc(m.title)}</h3></div><p class='muted'>${esc(m.content_type==='series'?'Series':m.genre||'Film')} • ${esc(m.release_year||'')}</p><div class='badges'>${m.full_video_verified&&m.full_video_embed_url?"<span class='badge watch-now'>Watch here</span>":m.watch_verified&&m.watch_url?"<span class='badge'>Legal watch</span>":m.trailer_verified?"<span class='badge'>Official trailer</span>":''}</div><div class='card-actions streaming-actions'><a class='btn play-mini' href='./movie.html?slug=${encodeURIComponent(m.slug)}'>▶ Details</a></div></div></article>`;

async function boot(){
  while(typeof supabase==='undefined') await new Promise(r=>setTimeout(r,80));
  const db=supabase.createClient(URL,KEY);
  const {data}=await db.from('movies').select('id,slug,title,region,genre,release_year,content_type,original_language,poster_url,full_video_verified,full_video_embed_url,watch_verified,watch_url,trailer_verified,trailer_url,rights_status').eq('status','published').order('rights_checked_at',{ascending:false});
  const movies:Movie[]=data||[];
  const cats=['Cartoons','Action','Comedy','Horror','Drama','Romance','Thriller'];
  const rails=document.querySelector<HTMLElement>('#genre-rails');
  const chips=document.querySelector<HTMLElement>('#genre-chips');
  const quick=document.querySelector<HTMLElement>('#quick-browse');
  if(!rails||!chips) return;

  if(quick&&!quick.querySelector('[data-quick="Cartoons"]')){
    const b=document.createElement('button');b.type='button';b.dataset.quick='Cartoons';b.textContent='Cartoons';quick.appendChild(b);
  }

  const cartoonMovies=movies.filter(m=>categoryMatch(m,'Cartoons'));
  if(cartoonMovies.length&&!document.querySelector('#genre-cartoons')){
    const block=document.createElement('div');block.className='rail-block genre-block';block.id='genre-cartoons';
    block.innerHTML=`<div class='rail-heading'><h3>Cartoons</h3><button type='button' data-enhanced-category='Cartoons'>See all →</button></div><div class='grid rail genre-rail'>${cartoonMovies.slice(0,12).map(card).join('')}</div>`;
    rails.prepend(block);
    const chip=document.createElement('button');chip.className='genre-chip';chip.dataset.enhancedCategory='Cartoons';chip.textContent='Cartoons';chips.prepend(chip);
  }

  const showCategory=(cat:string)=>{
    const list=movies.filter(m=>categoryMatch(m,cat));
    const grid=document.querySelector<HTMLElement>('#grid');
    const title=document.querySelector<HTMLElement>('#discover-title');
    const status=document.querySelector<HTMLElement>('#status');
    if(!grid||!title||!status)return;
    title.textContent=`${cat} — all titles`;
    status.textContent=`${list.length} ${cat.toLowerCase()} titles`;
    grid.innerHTML=list.length?list.map(card).join(''):`<div class='empty'>No ${esc(cat)} titles found.</div>`;
    const load=document.querySelector<HTMLButtonElement>('#load-more');if(load)load.hidden=true;
    document.querySelectorAll('.genre-chip').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll<HTMLElement>('[data-enhanced-category]').forEach(x=>{if(x.dataset.enhancedCategory===cat)x.classList.add('active')});
    document.querySelector('#discover')?.scrollIntoView({behavior:'smooth',block:'start'});
  };

  document.addEventListener('click',e=>{
    const el=(e.target as Element).closest<HTMLElement>('[data-genre-see],[data-enhanced-category],[data-quick]');
    if(!el)return;
    const cat=el.dataset.enhancedCategory||el.dataset.genreSee||el.dataset.quick||'';
    if(!cats.includes(cat))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showCategory(cat);
  },true);
}
boot();
