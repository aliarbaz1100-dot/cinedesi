/* Stable offline shell for existing CineDesi installations. */
const CACHE = "cinedesi-shell-v27";
const DOCUMENTS = ["/", "/index.html", "/movie.html"];
const CORE = ["/index.html", "/movie.html", "/manifest.webmanifest", "/cinedesi-icon.svg"];
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // A missing optional icon must never block installation or updating.
    await Promise.allSettled(CORE.map(async (url) => {
      const response = await fetch(url, {cache: "no-store"});
      if (response.ok) await cache.put(url, response);
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith("cinedesi-shell-") && name !== CACHE).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (!response.ok || !(response.headers.get("content-type") || "").includes("text/html")) throw new Error("invalid_document");
        const cache = await caches.open(CACHE);
        // Cache only known documents, never a homepage response under a movie URL.
        if (DOCUMENTS.includes(url.pathname)) {
          const key = url.pathname === "/" ? "/index.html" : url.pathname;
          await cache.put(key, response.clone()).catch(() => {});
        }
        return response;
      } catch {
        const cache = await caches.open(CACHE);
        const key = url.pathname === "/movie" || url.pathname === "/movie.html" ? "/movie.html" : "/index.html";
        const fallback = await cache.match(key);
        if (fallback) return fallback;
        return new Response("CineDesi is temporarily unavailable. Please reconnect and reload.", {status: 503, headers: {"Content-Type":"text/plain; charset=utf-8", "Cache-Control":"no-store"}});
      }
    })());
    return;
  }
  // Do not cache API, video streams, or unversioned scripts/styles: stale assets break installed apps.
  event.respondWith(fetch(request).catch(async () => (await caches.match(request)) || Response.error()));
});
