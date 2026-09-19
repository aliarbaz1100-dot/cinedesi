// CineDesi review-only Worker. This file is never used by production cinedesi.online.
// Existing catalog and video URLs remain authoritative; no backend writes occur here.
const QA_MANIFEST = {
  id: "/?cinedesi-qa-app=20260919",
  name: "CineDesi QA — Test App",
  short_name: "CineDesi QA",
  description: "Private review of CineDesi mobile app before launch.",
  start_url: "/?qa=1&source=pwa",
  scope: "/",
  display: "standalone",
  orientation: "any",
  background_color: "#08090b",
  theme_color: "#08090b",
  icons: [
    { src: "/cinedesi-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/cinedesi-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/cinedesi-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
  ]
};
const noIndex = (res) => {
  const headers = new Headers(res.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.delete("Content-Length");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
};
const getAsset = (request, env, path) => {
  const url = new URL(request.url);
  url.pathname = path;
  return env.ASSETS.fetch(new Request(url.toString(), request));
};
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }
    if (url.pathname === "/manifest.webmanifest") {
      return new Response(JSON.stringify(QA_MANIFEST), {
        headers: {
          "Content-Type": "application/manifest+json; charset=utf-8",
          "Cache-Control": "no-cache, must-revalidate",
          "X-Robots-Tag": "noindex, nofollow, noarchive"
        }
      });
    }
    const path = url.pathname === "/app-preview" || url.pathname === "/app-preview/"
      ? "/app-preview.html"
      : url.pathname === "/movie" || url.pathname === "/movie/"
        ? "/movie.html"
        : url.pathname;
    const result = await getAsset(request, env, path);
    if (/\.html$|^\/$/.test(path) && result.ok && request.method === "GET") {
      let html = await result.text();
      // QA search indexing and traffic must never be mixed with real launches.
      html = html.replace(/<meta\s+name=['"]robots['"]\s+content=['"][^'"]*['"]\s*\/?\s*>/gi, "");
      html = html.replace(/<head>/i, '<head><meta name="robots" content="noindex,nofollow,noarchive">');
      html = html.replace(/(<meta\s+name=['"](?:apple-mobile-web-app-title|application-name)['"]\s+content=['"])[^'"]*(['"])/gi, "$1CineDesi QA$2");
      html = html.replace(/<script\s+async\s+src=['"]https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=[^'"]+['"]><\/script>/gi, "");
      const headers = new Headers(result.headers);
      headers.set("Content-Type", "text/html; charset=utf-8");
      headers.set("Cache-Control", "no-cache, must-revalidate");
      return noIndex(new Response(html, { status: result.status, headers }));
    }
    return noIndex(result);
  }
};
