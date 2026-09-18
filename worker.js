const RECOVERY_COOKIE = "cinedesi_pwa_recovered=1";

const safeWorker = `
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
`;

const recoveryHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#08090b">
  <title>CineDesi</title>
  <style>
    html,body{margin:0;min-height:100%;background:#08090b;color:#fff;font-family:Arial,sans-serif}
    body{display:grid;place-items:center;min-height:100vh}
    main{text-align:center;padding:24px}
    h1{margin:0 0 10px;font-size:34px;letter-spacing:-1.5px}
    h1 span{color:#e50914}
    p{margin:0;color:#a8abb2;font-size:14px}
  </style>
</head>
<body>
  <main>
    <h1>CINE<span>DESI</span></h1>
    <p>Restoring your app…</p>
  </main>
  <script>
    (async () => {
      try {
        document.cookie = "cinedesi_pwa_recovered=1; Path=/; Max-Age=31536000; SameSite=Lax; Secure";
      } catch {}

      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
      } catch {}

      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.filter((k) => k.startsWith("cinedesi-")).map((k) => caches.delete(k)));
        }
      } catch {}

      const target = new URL(location.origin + "/");
      target.searchParams.set("source", "pwa");
      target.searchParams.set("pwa_recovered", "1");
      location.replace(target.href);
    })();
  </script>
</body>
</html>`;

function hasRecoveryCookie(request) {
  const cookie = request.headers.get("cookie") || "";
  return cookie.split(";").some((part) => part.trim() === RECOVERY_COOKIE);
}

async function serveAppShell(request, env) {
  const rootUrl = new URL("/", request.url);
  const assetResponse = await env.ASSETS.fetch(new Request(rootUrl, request));
  const headers = new Headers(assetResponse.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  headers.delete("Location");
  return new Response(assetResponse.body, {
    status: 200,
    statusText: "OK",
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/sw.js") {
      return new Response(safeWorker, {
        status: 200,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Service-Worker-Allowed": "/",
        },
      });
    }

    if (url.pathname === "/" && url.searchParams.get("source") === "pwa") {
      const alreadyRecovered =
        url.searchParams.get("pwa_recovered") === "1" ||
        hasRecoveryCookie(request);

      if (!alreadyRecovered) {
        return new Response(recoveryHtml, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store, max-age=0",
            "Set-Cookie": "cinedesi_pwa_recovered=1; Path=/; Max-Age=31536000; SameSite=Lax; Secure",
          },
        });
      }

      return serveAppShell(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
