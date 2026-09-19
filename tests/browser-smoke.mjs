import { chromium, devices } from "playwright";
import assert from "node:assert/strict";

const base = "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
let failures = 0;
for (const [name, configuration] of [
  ["desktop", { viewport: { width: 1440, height: 900 } }],
  ["mobile-emulation", { ...devices["iPhone 13"], browserName: undefined }]
]) {
  const context = await browser.newContext({ ...configuration, serviceWorkers: "allow" });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  try {
    const response = await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
    assert.equal(response.status(), 200, name + " homepage status");
    assert.match(response.headers()["content-type"] || "", /text\/html/i, name + " homepage MIME");
    await page.locator("#app-splash").waitFor({ state: "detached", timeout: 9000 });
    const install = page.locator("#install-banner");
    assert.equal(await install.isVisible(), false, name + " must not auto-block browsing with install prompt");
    await page.locator('a.poster-link[href^="/movie.html?slug="]').first().waitFor({ timeout: 45000 });
    const firstMovie = page.locator('a.poster-link[href^="/movie.html?slug="]').first();
    const href = await firstMovie.getAttribute("href");
    assert.ok(href && href.includes("slug="), name + " has clickable movie detail link");
    await firstMovie.click();
    await page.waitForURL(/\/movie(?:\.html)?\?slug=/, { waitUntil: "domcontentloaded", timeout: 12000 });
    await page.waitForFunction(() => {
      const body = document.querySelector("#movie-page")?.innerText || "";
      return body.length > 35 && !body.includes("Loading verified movie details");
    }, null, { timeout: 45000 });
    const detail = await page.locator("#movie-page").innerText();
    assert.doesNotMatch(detail, /could not be found|could not load movie details|unable to open this title/i, name + " movie details");
    assert.match(await page.locator("body").innerText(), /CineDesi/i);
    const type = await page.evaluate(() => document.contentType);
    assert.match(type, /text\/html/i, name + " detail must be HTML not a file download");
    await page.goto(base + "/movie?slug=" + encodeURIComponent(new URL(base + href).searchParams.get("slug")), { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/movie(?:\.html)?\?slug=/, { waitUntil: "domcontentloaded", timeout: 12000 });
    assert.deepEqual(pageErrors, [], name + " uncaught errors");
    console.log("PASS " + name + ": homepage, install-popup, movie detail, legacy route, content MIME");
  } catch (error) {
    failures++;
    console.error("FAIL " + name + ": " + error.stack);
  } finally {
    await context.close();
  }
}
await browser.close();
if (failures) process.exitCode = 1;
