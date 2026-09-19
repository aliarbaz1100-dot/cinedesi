import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = "https://cinedesi-qa-launch-review-20260919.aliarbaz1100-93b.workers.dev";
const browser = await chromium.launch({ headless: true });
const devices = [
  {
    name: "iphone6-ios12-size",
    viewport: { width: 375, height: 667 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 12_5_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1",
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  },
  {
    name: "android-compact",
    viewport: { width: 360, height: 740 },
    userAgent: "Mozilla/5.0 (Linux; Android 11; Pixel 4a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36",
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  }
];

let total = 0;
try {
  for (const device of devices) {
    const { name, ...browserDevice } = device;
    const context = await browser.newContext(browserDevice);
    if (device.name.startsWith("iphone")) {
      // The emulation is Chromium with Safari-12 UA and iPhone 6 geometry,
      // not actual iOS 12/WebKit hardware. This test cannot certify hardware playback.
      await context.addInitScript(() => {
        Object.defineProperty(navigator, "standalone", { configurable: true, get: () => true });
      });
    }
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const start = Date.now();
    const response = await page.goto(base + "/?qa=1&source=pwa", { waitUntil: "commit", timeout: 30000 });
    assert.equal(response?.status(), 200, device.name + " initial HTTP");
    const overlay = page.locator("#app-splash");
    await overlay.waitFor({ state: "visible", timeout: 1800 });
    const launch = await page.evaluate(() => ({
      qa: document.documentElement.classList.contains("cd-qa-standalone"),
      logo: document.querySelector("#app-splash .splash-logo")?.textContent,
      poweredBy: document.querySelector("#app-splash .splash-brand p")?.textContent,
      display: getComputedStyle(document.querySelector("#app-splash")).display
    }));
    assert.ok(launch.qa && launch.display !== "none", device.name + " QA logo must be visible on launch");
    assert.match(String(launch.logo), /CINEDESI/);
    assert.match(String(launch.poweredBy), /Arbaz Ali/i);
    const launchArt = await page.evaluate(() => {
      const logo = document.querySelector("#app-splash .splash-logo span");
      const brand = document.querySelector("#app-splash .splash-brand");
      return { red: getComputedStyle(logo).color, animation: getComputedStyle(brand).animationName };
    });
    assert.match(launchArt.red, /229,\s*9,\s*20/, device.name + " launch logo must have CineDesi red");
    assert.match(launchArt.animation, /qa-brand-in/, device.name + " launch branding must animate");
    console.log("PASS", device.name, "first-frame branded launch", Date.now() - start, "ms");
    await overlay.waitFor({ state: "detached", timeout: 6100 });
    await page.locator("#home").waitFor({ state: "visible", timeout: 7000 });
    const top = await page.evaluate(() => {
      const header = document.querySelector(".catalog-header");
      const hero = document.querySelector("#home");
      const title = document.querySelector("#hero-title");
      const details = document.querySelector("#hero-info");
      const before = {
        header: getComputedStyle(header).backgroundColor,
        heroHeight: getComputedStyle(hero).minHeight,
        heroPadding: getComputedStyle(hero).paddingTop,
        titleFont: getComputedStyle(title).fontSize,
        detailDisplay: getComputedStyle(details).display
      };
      document.documentElement.classList.remove("cd-qa-mode");
      const liveLayer = {
        header: getComputedStyle(header).backgroundColor,
        heroHeight: getComputedStyle(hero).minHeight,
        heroPadding: getComputedStyle(hero).paddingTop,
        titleFont: getComputedStyle(title).fontSize,
        detailDisplay: getComputedStyle(details).display
      };
      document.documentElement.classList.add("cd-qa-mode");
      return { before, liveLayer, width: document.documentElement.scrollWidth, screen: innerWidth };
    });
    assert.deepEqual(top.before, top.liveLayer, device.name + " featured viewport MUST match live CineDesi visual CSS");
    assert.ok(top.width <= top.screen + 2, device.name + " horizontal overflow " + JSON.stringify(top));
    const navParity = await page.evaluate(() => {
      const nav = document.querySelector(".mobile-bottom-nav");
      const read = () => ({
        radius: getComputedStyle(nav).borderRadius,
        background: getComputedStyle(nav).backgroundColor,
        width: getComputedStyle(nav).width,
        icon: getComputedStyle(nav.querySelector("svg")).width
      });
      const qa = read();
      document.documentElement.classList.remove("cd-qa-mode");
      const original = read();
      document.documentElement.classList.add("cd-qa-mode");
      return { qa, original };
    });
    assert.deepEqual(navParity.qa, navParity.original, device.name + " must restore original premium bottom bar");
    console.log("PASS", device.name, "featured display and original premium bottom nav match live CSS");
    const search = page.locator("#bottom-search");
    await search.waitFor({ state: "visible", timeout: 9000 });
    await search.click();
    await page.waitForFunction(() => document.querySelector(".catalog-header")?.classList.contains("search-mode"), null, { timeout: 3000 });
    assert.ok(await page.locator("#search").isVisible(), device.name + " search must open");
    await page.locator("#search-close").click();
    const newTab = page.locator(".mobile-bottom-nav a[href='#new-releases']");
    await newTab.click();
    await page.waitForFunction(() => location.hash === "#new-releases", null, { timeout: 3000 });
    assert.ok(await newTab.getAttribute("aria-current") === "page", device.name + " New tab not selected");
    console.log("PASS", device.name, "search and real New Releases navigation");
    // Simulate returning home after opening an actual title in the installed app.
    // A new HTML document must never paint the brand as if the app launched.
    await page.evaluate(() => sessionStorage.setItem("cinedesi-qa-internal-nav", String(Date.now())));
    const returning = await page.goto(base + "/?qa=1&source=pwa", { waitUntil: "domcontentloaded", timeout: 30000 });
    assert.equal(returning?.status(), 200);
    const returnState = await page.evaluate(() => ({
      freshLaunch: document.documentElement.classList.contains("cd-qa-standalone"),
      splashVisible: (() => { const el=document.querySelector("#app-splash"); return !!el && getComputedStyle(el).display !== "none"; })(),
      savedNav: Number(sessionStorage.getItem("cinedesi-qa-internal-nav") || 0)
    }));
    assert.ok(returnState.savedNav === 0 && !returnState.freshLaunch && !returnState.splashVisible, device.name + " movie-return app must not display a launch logo");
    await page.waitForTimeout(350);
    assert.equal(await page.locator("#app-splash").count(), 0, device.name + " movie-return splash should be removed without ever appearing");
    // Explicit return params also protect late returns when the timestamp expires.
    const saved = Date.now() - 180000;
    await page.evaluate(value => sessionStorage.setItem("cinedesi-qa-internal-nav", String(value)), saved);
    await page.goto(base + "/?qa=1&source=pwa&returnY=0", { waitUntil: "domcontentloaded", timeout: 30000 });
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("cd-qa-standalone")), false, device.name + " returnY must suppress launch");
    console.log("PASS", device.name, "movie to home navigation does not show a false splash");
    if (device.name.startsWith("iphone")) {
      // Installed shortcuts created from the OLD /app-preview route should
      // enter the actual app, not stay on the desktop preview illustration.
      await page.goto(base + "/app-preview", { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForURL(/\/\?qa=1&source=pwa&install-launch=1/, { timeout: 6000 });
      await page.locator("#app-splash").waitFor({ state: "visible", timeout: 1700 });
      assert.equal(await page.locator("#intro").count(), 0, device.name + " installed shortcut must open REAL app");
      await page.locator("#app-splash").waitFor({ state: "detached", timeout: 6000 });
      console.log("PASS", device.name, "old installed /app-preview shortcut opens real CineDesi animation");
    }
    const preview = await page.goto(base + "/app-preview?inspect=1", { waitUntil: "domcontentloaded", timeout: 30000 });
    assert.equal(preview?.status(), 200);
    await page.locator("#replay").click();
    assert.ok(await page.locator("#intro").isVisible(), device.name + " replay control failed");
    assert.ok((await page.locator("iframe[title*='Interactive CineDesi QA']").count()) === 1, device.name + " preview must render real app");
    console.log("PASS", device.name, "interactive preview and replay");
    assert.deepEqual(errors, [], device.name + " uncaught page errors");
    await context.close();
    total += 1;
  }
} finally {
  await browser.close();
}
assert.equal(total, 2);
console.log("PASS: QA responsive/launch/tab smoke on compact iPhone 6 and Android emulations; real iOS WebKit device still requires manual verification.");
