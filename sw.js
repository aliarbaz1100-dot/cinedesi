const CACHE='cinedesi-shell-v10';
const SHELL=['./index.html','./manifest.webmanifest','./cinedesi-icon.svg'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);

  // Never cache third-party/API media. Always let Supabase/YouTube/CDN responses stay fresh.
  if(url.origin!==self.location.origin) return;

  // Navigations: network first, cached page only as offline fallback.
  if(req.mode==='navigate'){
    event.respondWith(fetch(req,{cache:'no-store'}).then(res=>{
      if(!res.ok) throw new Error('navigation_failed');
      const copy=res.clone();
      caches.open(CACHE).then(cache=>cache.put(req,copy));
      return res;
    }).catch(async()=>await caches.match(req)||await caches.match('./index.html')));
    return;
  }

  // Hashed Vite assets can be cached aggressively; app shell/config stays network-first.
  const immutable=/\/assets\/.*\.[a-z0-9]{8,}\.(js|css|woff2?|png|jpe?g|webp|svg)$/i.test(url.pathname);
  if(immutable){
    event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{
      if(res.ok){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}
      return res;
    })));
    return;
  }

  event.respondWith(fetch(req,{cache:'no-store'}).then(res=>{
    if(res.ok){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}
    return res;
  }).catch(()=>caches.match(req)));
});
