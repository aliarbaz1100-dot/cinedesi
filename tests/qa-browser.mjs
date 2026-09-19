import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.PREVIEW_URL;
assert.ok(base?.startsWith("https://"), "Missing secure preview URL");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  serviceWorkers: "allow",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
try {
  const response = await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 40000 });
  assert.equal(response.status(), 200, "Home must load");
  assert.ok((await response.headerValue("content-type"))?.includes("text/html"), "Homepage must render as HTML");
  await page.locator("#top-grid a.poster-link[href*='/movie.html?slug=']").first().waitFor({ state: "visible", timeout: 40000 }).catch(async error => {
    const status = await page.locator("#status").innerText().catch(() => "");
    throw new Error("No clickable movie card loaded: " + status + " / " + error.message);
  });
  assert.equal(await page.locator("#install-banner").isVisible(), false, "Install prompt must not obstruct home");
  console.log("PASS mobile homepage: real movie cards visible, install popup hidden");
  await page.locator("#top-grid a.poster-link[href*='/movie.html?slug=']").first().click();
  await page.waitForURL(/\/movie\.html\?slug=/, { timeout: 30000 });
  await page.waitForFunction(() => {
    const text = document.querySelector("#movie-page")?.textContent || "";
    return text.length > 100 && !text.includes("Loading verified movie details");
  }, { timeout: 40000 });
  const movieText = await page.locator("#movie-page").innerText();
  assert.ok(!/could not load movie details|unable to open this title|could not be found/i.test(movieText), "Movie failed: " + movieText.slice(0, 400));
  console.log("PASS mobile movie: detail page loads at explicit HTML URL");
  await page.locator("#movie-back").click();
  await page.waitForURL(url => url.pathname === "/" || url.pathname === "/index.html", { timeout: 30000 });
  await page.locator("#top-grid a.poster-link").first().waitFor({ state: "visible", timeout: 20000 });
  console.log("PASS mobile back navigation and restored catalog");
  const sw = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return "unsupported";
    const ready = await Promise.race([
      navigator.serviceWorker.ready.then(reg => ({ scope: reg.scope, active: !!reg.active })),
      new Promise(resolve => setTimeout(() => resolve("timeout"), 12000)),
    ]);
    return ready;
  });
  assert.ok(sw && sw !== "unsupported" && sw !== "timeout" && sw.active, "PWA service worker not active: " + JSON.stringify(sw));
  console.log("PASS service worker installed on preview origin");
  const criticalErrors = errors.filter(message => /syntaxerror|referenceerror|cannot read properties|failed to fetch dynamically imported module/i.test(message));
  assert.deepEqual(criticalErrors, [], "Browser JavaScript errors: " + criticalErrors.join("; "));
  console.log("PASS no critical JavaScript page errors");
} finally {
  await browser.close();
}
