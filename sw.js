const CACHE = "cinedesi-static-v29";
const STATIC = [
  "/cinedesi-icon.svg",
  "/cinedesi-icon-192.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith("cinedesi-") && key !== CACHE)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Documents/navigation always go directly to the network.
  // This keeps installed CineDesi apps fresh and avoids redirect-tainted
  // navigation Responses being served by a service worker.
  if (request.mode === "navigate" || request.destination === "document") return;

  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/rest/") ||
    url.pathname === "/sw.js"
  ) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response && response.ok && !response.redirected && response.type !== "opaque") {
        caches.open(CACHE).then((cache) => cache.put(request, response.clone())).catch(() => undefined);
      }
      return response;
    } catch {
      return cached || Response.error();
    }
  })());
});
