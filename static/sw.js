// CineDesi emergency recovery worker.
// Purpose: release existing installed apps from stale/broken cache state.
// It intentionally has no fetch handler.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("cinedesi-"))
          .map((key) => caches.delete(key))
      );
    } catch {}

    try { await self.clients.claim(); } catch {}

    try {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windows) {
        try {
          const url = new URL(client.url);
          if (url.origin !== self.location.origin) continue;
          if (url.searchParams.get("pwa_recovered") === "1") continue;
          url.pathname = "/";
          url.search = "?source=pwa&pwa_recovered=1";
          url.hash = "";
          await client.navigate(url.href);
        } catch {}
      }
    } catch {}

    try { await self.registration.unregister(); } catch {}
  })());
});
