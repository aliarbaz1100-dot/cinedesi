const CACHE='cinedesi-shell-v13';
const SHELL=['./index.html','./src/styles.css','./src/main.ts','./cinedesi-icon.svg','./cinedesi-launch-1170x2532.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;

  if(e.request.mode==='navigate'){
    e.respondWith((async()=>{
      const url=new URL(e.request.url);
      const cached=(await caches.match(e.request)) || (url.pathname.startsWith('/movie') ? await caches.match('/movie') : await caches.match('./index.html'));
      const refresh=fetch(e.request).then(async r=>{
        if(r.ok){
          const copy=r.clone();
          const c=await caches.open(CACHE);
          await c.put(e.request,copy);
          if(url.pathname.startsWith('/movie')) await c.put('/movie',r.clone());
        }
        return r;
      }).catch(()=>null);

      if(cached){
        e.waitUntil(refresh);
        return cached;
      }
      const live=await refresh;
      return live || Response.error();
    })());
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(r=>{
        if(!r.ok) throw new Error('asset_failed');
        const copy=r.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy));
        return r;
      })
      .catch(()=>caches.match(e.request))
  );
});
