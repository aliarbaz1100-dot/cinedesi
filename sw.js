const CACHE = "cinedesi-shell-v27";
const SHELL = [
  "/cinedesi-icon.svg",
  "/cinedesi-icon-192.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("cinedesi-") && key !== CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept document navigations. Let the browser/Cloudflare follow
  // redirects normally so mobile Safari/Chrome never receives a redirected
  // Response object from the service worker.
  if (request.mode === "navigate" || request.destination === "document") return;

  // Avoid caching dynamic API/data responses.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/rest/") ||
    url.pathname === "/sw.js"
  ) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (!response || !response.ok || response.type === "opaque" || response.redirected) {
          return response;
        }

        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
        return response;
      });
    })
  );
});
