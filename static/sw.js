const CACHE = "cinedesi-shell-v14";
const SHELL = [
  "./index.html",
  "./cinedesi-icon.svg",
  "./cinedesi-icon-192.png",
  "./manifest.webmanifest",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const requestUrl = new URL(e.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          if (!r.ok) throw new Error("navigation_failed");
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return r;
        })
        .catch(async () => (await caches.match(e.request)) || (await caches.match("./index.html")) || Response.error()),
    );
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (!r.ok) throw new Error("asset_failed");
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return r;
      })
      .catch(() => caches.match(e.request)),
  );
});
