const CACHE = "cinedesi-shell-v28";
const SHELL = [
  "/",
  "/index.html",
  "/cinedesi-icon.svg",
  "/cinedesi-icon-192.png",
  "/manifest.webmanifest",
];

const cacheSafe = async (request, response) => {
  if (!response || !response.ok || response.redirected || response.type === "opaque") return;
  try {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  } catch {
  }
};

const cleanRedirectedResponse = async (response) => {
  if (!response?.redirected) return response;

  // Fetch the final URL once more so the Response returned through the
  // service worker is a direct 200 response rather than a redirect-tainted
  // navigation response (important for mobile Safari/Chrome PWAs).
  try {
    const direct = await fetch(response.url, {
      redirect: "follow",
      cache: "no-store",
      credentials: "same-origin",
    });
    if (direct?.ok && !direct.redirected) return direct;
  } catch {
  }

  // Last-resort normalization: preserve the final body/status/headers while
  // stripping redirect state from the Response object.
  try {
    const headers = new Headers(response.headers);
    headers.delete("location");
    return new Response(await response.blob(), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch {
    return response;
  }
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => undefined)
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

    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        if (preload?.ok) {
          const safePreload = await cleanRedirectedResponse(preload);
          if (safePreload?.ok && !safePreload.redirected) {
            await cacheSafe(request, safePreload);
            return safePreload;
          }
        }

        const network = await fetch(request, {
          redirect: "follow",
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!network.ok) throw new Error("navigation_failed");

        const safe = await cleanRedirectedResponse(network);
        if (!safe?.ok || safe.redirected) throw new Error("navigation_redirect_failed");

        await cacheSafe(request, safe);
        return safe;
      } catch {
        const cached = await caches.match(request, { ignoreSearch: false });
        if (cached && !cached.redirected) return cached;

        const shell = await caches.match("/index.html");
        if (shell && !shell.redirected) return shell;

        return new Response(
          "<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>CineDesi</title></head><body style=\"margin:0;background:#08090b;color:#fff;font-family:Arial,sans-serif;display:grid;place-items:center;min-height:100vh\"><main style=\"text-align:center;padding:24px\"><h1>CineDesi</h1><p>Connection unavailable. Please try again.</p><button onclick=\"location.reload()\" style=\"padding:10px 16px\">Retry</button></main></body></html>",
          { status: 503, headers: { "content-type": "text/html; charset=utf-8" } }
        );
      }
    })());
    return;
  }

  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/rest/") ||
    url.pathname === "/sw.js"
  ) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached && !cached.redirected) return cached;

    try {
      const response = await fetch(request);
      if (response?.ok && !response.redirected && response.type !== "opaque") {
        await cacheSafe(request, response);
      }
      return response;
    } catch {
      return cached || Response.error();
    }
  })());
});
