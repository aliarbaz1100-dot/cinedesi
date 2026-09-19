/* CineDesi v28: browser-native navigation prevents iOS Safari service-worker redirect failures.
   This worker keeps a small offline shell for future improvements but NEVER intercepts
   page navigations, movies, assets or media. The browser owns redirects and MIME. */
const CACHE = "cinedesi-shell-v28";
const CORE = ["/index.html", "/movie.html", "/manifest.webmanifest", "/cinedesi-icon.svg"];
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // iPhone 6 / iOS 12 does not provide Promise.allSettled.
    const tasks = CORE.map(async (url) => {
      const response = await fetch(url, { cache: "no-store", redirect: "follow" });
      if (response.ok && !response.redirected) await cache.put(url, response);
    });
    await Promise.all(tasks.map((task) => task.catch(() => null)));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("cinedesi-shell-") && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});
// Deliberately no fetch event handler: navigation, downloads and media are
// handled by the browser itself. Never return Response.redirect() from a SW.
