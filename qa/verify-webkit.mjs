import assert from "node:assert/strict";
import fs from "node:fs";
import { webkit } from "playwright";

const base = "https://cinedesi-qa-launch-review-20260919.aliarbaz1100-93b.workers.dev";
const browser = await webkit.launch({ headless: true });
const devices = [
  {
    name: "webkit-iphone6-geometry",
    viewport: { width: 375, height: 667 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 12_5_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1",
    deviceScaleFactor: 2,
    isMobile: true, hasTouch: true
  },
  {
    name: "webkit-modern-iphone",
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    deviceScaleFactor: 3,
    isMobile: true, hasTouch: true
  }
];
fs.mkdirSync("qa-review-screenshots", { recursive: true });
try {
  for (const device of devices) {
    const { name, ...opts } = device;
    const context = await browser.newContext(opts);
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "standalone", { configurable: true, get: () => true });
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", err => errors.push(err.message));
    const response = await page.goto(base + "/?qa=1&source=pwa", { waitUntil: "domcontentloaded", timeout: 30000 });
    assert.equal(response?.status(), 200);
    await page.locator("#app-splash").waitFor({ state: "visible", timeout: 1800 });
    const splash = await page.evaluate(() => ({
      logo: document.querySelector("#app-splash .splash-logo")?.textContent,
      label: document.querySelector("#app-splash .splash-brand p")?.textContent,
      animation: getComputedStyle(document.querySelector("#app-splash .splash-brand")).animationName
    }));
    assert.match(String(splash.logo), /CINEDESI/);
    assert.match(String(splash.label), /Arbaz Ali/);
    assert.ok(String(splash.animation).includes("qa-brand-in"), name + " WebKit animated logo missing");
    console.log("PASS", name, "branded iOS-like WebKit opening");
    await page.locator("#app-splash").waitFor({ state: "detached", timeout: 6500 });
    await page.locator("#home").waitFor({ state: "visible", timeout: 14000 });
    const sizes = await page.evaluate(() => {
      const title = document.querySelector("#hero-title")?.getBoundingClientRect();
      const hero = document.querySelector("#home")?.getBoundingClientRect();
      const nav = document.querySelector(".mobile-bottom-nav")?.getBoundingClientRect();
      return {
        outer: document.documentElement.scrollWidth,
        viewport: innerWidth,
        titleWidth: title?.width,
        heroWidth: hero?.width,
        navWidth: nav?.width
      };
    });
    assert.ok(sizes.outer <= sizes.viewport + 2, name + " homepage horizontal overflow " + JSON.stringify(sizes));
    assert.ok(sizes.titleWidth > 100 && sizes.heroWidth > 300 && sizes.navWidth > 230, name + " homepage UI clipped");
    await page.screenshot({ path: "qa-review-screenshots/" + name + "-home.png", animations: "disabled" });
    console.log("PASS", name, "homepage, nav and title fit iPhone viewport");
    const movie = await page.goto(base + "/movie?slug=bigg-boss-20", { waitUntil: "domcontentloaded", timeout: 30000 });
    assert.equal(movie?.status(), 200);
    const episodes = page.locator(".qa-netflix-episode-list");
    await episodes.waitFor({ state: "visible", timeout: 25000 });
    assert.ok(await episodes.locator("[data-episode]").count() >= 2);
    const columns = await episodes.evaluate(el => {
      const rail = el.querySelector(".episode-grid");
      const cards = Array.from(el.querySelectorAll(".episode-card"));
      const a = cards[0].getBoundingClientRect();
      const b = cards[1].getBoundingClientRect();
      return { direction: getComputedStyle(rail).flexDirection, sameLeft: Math.abs(a.left - b.left) < 2, stacked: b.top > a.bottom - 2 };
    });
    assert.deepEqual(columns, { direction: "column", sameLeft: true, stacked: true });
    const next = episodes.locator('[data-qa-step="1"]');
    const prev = episodes.locator('[data-qa-step="-1"]');
    await next.click();
    await page.waitForFunction(() => document.querySelector(".qa-netflix-episode-list [data-episode='1']")?.classList.contains("active"), null, { timeout: 5000 });
    assert.ok(await prev.isEnabled());
    await prev.click();
    await page.waitForFunction(() => document.querySelector(".qa-netflix-episode-list [data-episode='0']")?.classList.contains("active"), null, { timeout: 5000 });
    await episodes.screenshot({ path: "qa-review-screenshots/" + name + "-episodes.png", animations: "disabled" });
    console.log("PASS", name, "Netflix-style episode list, actual Previous/Next taps");
    assert.deepEqual(errors, [], name + " uncaught errors");
    await context.close();
  }
} finally { await browser.close(); }
console.log("PASS: WebKit browser review; this is NOT testing an actual iPhone 6 or native iOS Home Screen lifecycle.");
