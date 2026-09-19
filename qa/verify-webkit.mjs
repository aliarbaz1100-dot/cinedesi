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
    if (name === "webkit-modern-iphone") {
      // Use the real featured Play link and movie Back button: the app must
      // return to its previous home, without behaving like a fresh installation.
      await page.waitForFunction(() => document.querySelector("#hero-play")?.getAttribute("href")?.includes("/movie?slug="), null, { timeout: 15000 });
      await page.locator("#hero-play").click();
      await page.waitForURL(url => url.pathname === "/movie", { timeout: 12000 });
      await page.locator("#movie-back").click();
      await page.waitForURL(url => url.pathname === "/", { timeout: 15000 });
      const state = await page.evaluate(() => ({
        launched: document.documentElement.classList.contains("cd-qa-standalone"),
        logo: !!document.querySelector("#app-splash")
      }));
      assert.ok(!state.launched && !state.logo, name + " returning from a real movie reopened the launch logo");
      console.log("PASS", name, "real Home → Play movie → Back to Home does not relaunch app");
    }
    const movie = await page.goto(base + "/movie?slug=bigg-boss-20", { waitUntil: "domcontentloaded", timeout: 30000 });
    assert.equal(movie?.status(), 200);
    const episodes = page.locator(".qa-netflix-episode-list");
    await episodes.waitFor({ state: "visible", timeout: 25000 });
    assert.ok(await episodes.locator("[data-episode]").count() >= 2);
    const firstEpisodeMeta = await episodes.locator("[data-episode='0'] .episode-copy small").textContent();
    assert.match(String(firstEpisodeMeta), /Season 20/, name + " Bigg Boss 20 must NOT show Season 5 metadata");
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
    const episodeAfterBack = await page.evaluate(() => ({
      active: Array.from(document.querySelectorAll(".qa-episode-deck [data-episode].active")).map(x => x.dataset.episode),
      provider: document.querySelector(".qa-episode-deck [data-episode='0']")?.dataset.playlistKind,
      player: document.querySelector("#official-player")?.getAttribute("src")?.slice(0,180),
      label: document.querySelector(".qa-episode-now strong")?.textContent
    }));
    console.log("QA episode-back diagnostic", name, JSON.stringify(episodeAfterBack));
    await page.waitForFunction(() => document.querySelector(".qa-netflix-episode-list [data-episode='0']")?.classList.contains("active"), null, { timeout: 6000 });
    await episodes.screenshot({ path: "qa-review-screenshots/" + name + "-episodes.png", animations: "disabled" });
    console.log("PASS", name, "Netflix-style episode list, actual Previous/Next taps");
    // The CI runner's WebKit sandbox can block cross-origin Supabase RPCs
    // and YouTube telemetry with "due to access control checks". They are
    // external provider failures, not first-party app exceptions. Log them
    // rather than falsely claiming the actual player was tested or hiding
    // any first-party JavaScript exception.
    const crossOriginBlocks = errors.filter(message =>
      /due to access control checks/i.test(message) &&
      (String(message).includes("supabase.co") || String(message).includes("youtube-nocookie.com") || String(message).includes("youtube.com"))
    );
    const genericNetworkErrors = errors.filter(message => /^NetworkError:\s+A network error occurred\.?$/.test(String(message)));
    const appErrors = errors.filter(message => !crossOriginBlocks.includes(message) && !genericNetworkErrors.includes(message));
    if (crossOriginBlocks.length) console.log("LIMITATION", name, crossOriginBlocks.length, "cross-origin provider requests blocked in CI (not playback verified)");
    if (genericNetworkErrors.length) console.log("LIMITATION", name, genericNetworkErrors.length, "unattributed WebKit network error (real-device player and API checks still required)");
    assert.deepEqual(appErrors, [], name + " non-network uncaught app errors");
    await context.close();
  }
} finally { await browser.close(); }
console.log("PASS: WebKit browser review; this is NOT testing an actual iPhone 6 or native iOS Home Screen lifecycle.");
