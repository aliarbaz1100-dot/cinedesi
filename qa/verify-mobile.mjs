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
    name: "iphone-modern",
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3
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
    // The browser test emulates an already INSTALLED PWA, rather than a
    // Safari/Chrome website. Android supports display-mode: standalone; the
    // iPhone shim emulates the corresponding iOS navigator.standalone signal.
    // Neither emulation is a physical iPhone or Android installation.
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "standalone", { configurable: true, get: () => true });
    });
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
    const firstPaintLogo = await page.locator("#app-splash .splash-logo").evaluate(el => {
      const css = getComputedStyle(el);
      return { opacity: Number(css.opacity), filter: css.filter };
    });
    assert.ok(firstPaintLogo.opacity >= .95 && firstPaintLogo.filter === "none",
      device.name + " brand must be readable at first web paint without waiting for animation");

    await page.waitForFunction(() => document.querySelector("#app-splash")?.classList.contains("qa-intro-play") || document.documentElement.getAttribute("data-qa-intro-started") === "1", null, { timeout: 3200 });
    const launchArt = await page.evaluate(() => {
      const logo = document.querySelector("#app-splash .splash-logo span");
      const brand = document.querySelector("#app-splash .splash-brand");
      return { red: getComputedStyle(logo).color, animation: getComputedStyle(logo.parentElement).animationName };
    });
    assert.match(launchArt.red, /229,\s*9,\s*20/, device.name + " launch logo must have CineDesi red");
    assert.match(launchArt.animation, /qa-icon-brand-in/, device.name + " launch branding must animate");
    const cinematic = await page.locator("#app-splash .splash-logo").evaluate(el => ({
      duration: parseFloat(getComputedStyle(el).animationDuration),
      keyframe: Array.from(document.styleSheets).filter(sheet => {
        try { return Array.from(sheet.cssRules).some(rule => rule.name === "qa-icon-brand-in"); }
        catch { return false; }
      }).length > 0
    }));
    assert.ok(cinematic.duration >= .6 && cinematic.duration <= .85 && cinematic.keyframe, device.name + " installed logo must animate promptly, not hold on a black screen");
    console.log("PASS", device.name, "first-frame branded launch", Date.now() - start, "ms");
    await overlay.waitFor({ state: "detached", timeout: 7200 });
    await page.locator("#home").waitFor({ state: "visible", timeout: 7000 });
    // The same hidden diagnostic can be opened on the REAL QA Home Screen
    // without modifying the app UI, making iOS icon-route failures diagnosable.
    await page.locator(".catalog-header a.logo").dispatchEvent("touchstart");
    await page.locator("#qa-launch-check-panel").waitFor({ state: "visible", timeout: 2700 });
    const report = await page.locator("#qa-launch-check-text").innerText();
    assert.match(report, /early-launch=mode=installed/, device.name + " launch-mode diagnosis missing");
    assert.match(report, /navigator.standalone=true/, device.name + " installed launch report missing");
    await page.locator(".catalog-header a.logo").dispatchEvent("touchend");
    await page.getByRole("button", { name: "Back to CineDesi" }).click();
    assert.equal(await page.locator("#qa-launch-check-panel").count(), 0);
    console.log("PASS", device.name, "hidden real-icon launch diagnostic, no persistent UI changes");
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
    if (device.name === "iphone-modern") {
      // The user installed an older preview shortcut in Safari bookmark mode.
      // It may NOT report standalone=true, but the QA preview must still route
      // to the real app where the launch animation exists.
      const bookmarkContext = await browser.newContext({ ...browserDevice });
      const bookmarkPage = await bookmarkContext.newPage();
      await bookmarkPage.goto(base + "/app-preview", { waitUntil: "domcontentloaded", timeout: 30000 });
      await bookmarkPage.waitForURL(url => url.pathname === "/" && url.searchParams.get("install-launch") === "1", { timeout: 8000 });
      await bookmarkPage.waitForFunction(() => document.querySelector("#app-splash") === null, null, { timeout: 4500 });
      assert.equal(await bookmarkPage.locator("#intro").count(), 0, "Browser shortcut must open real QA app, not decorative mock preview");
      assert.equal(await bookmarkPage.evaluate(() => document.documentElement.classList.contains("cd-qa-standalone")), false, "Safari browser shortcut must NOT show the installed-icon-only animation");
      console.log("PASS", device.name, "old browser bookmark shortcut redirects to real app without triggering installed-only intro");
      await bookmarkContext.close();
    }
    if (device.name === "iphone-modern") {
      const ordinary = await browser.newContext(browserDevice);
      const browserTab = await ordinary.newPage();
      await browserTab.goto(base + "/?qa=1&source=pwa", { waitUntil: "domcontentloaded", timeout: 30000 });
      const browserState = await browserTab.evaluate(() => ({
        installed: document.documentElement.classList.contains("cd-qa-standalone"),
        splash: !!document.querySelector("#app-splash")
      }));
      assert.deepEqual(browserState, { installed: false, splash: false }, "QA browser must never play the app-icon-only animation");
      console.log("PASS", device.name, "installed-only animation is absent from ordinary Safari/Chrome browser");
      await ordinary.close();
    }
    const preview = await page.goto(base + "/app-preview?inspect=1", { waitUntil: "domcontentloaded", timeout: 30000 });
    assert.equal(preview?.status(), 200);
    await page.locator("#replay").click();
    assert.ok(await page.locator("#intro").isVisible(), device.name + " replay control failed");
    assert.ok((await page.locator("iframe[title*='Interactive CineDesi QA']").count()) === 1, device.name + " preview must render real app");
    console.log("PASS", device.name, "interactive preview and replay");
    // Real catalog title from the user's screenshot: check that episode deck is
    // usable, not merely styled. Do not autoplay unlicensed or unsupported media.
    if (device.name === "iphone-modern") {
      const movie = await page.goto(base + "/movie?slug=bigg-boss-20", { waitUntil: "domcontentloaded", timeout: 30000 });
      assert.equal(movie?.status(), 200);
      const episodeDeck = page.locator(".qa-episode-deck");
      await episodeDeck.waitFor({ state: "visible", timeout: 25000 });
      const cards = episodeDeck.locator("[data-episode]");
      const count = await cards.count();
      assert.ok(count >= 2, "Real Bigg Boss 20 episode deck should contain at least two episodes");
      const next = episodeDeck.locator('[data-qa-step="1"]');
      const prev = episodeDeck.locator('[data-qa-step="-1"]');
      assert.ok(await next.isEnabled(), "Next should start enabled");
      assert.ok(await prev.isDisabled(), "Previous should start disabled on Episode 1");
      await next.click();
      await page.waitForFunction(() => document.querySelector(".qa-episode-deck [data-episode='1']")?.classList.contains("active"), null, { timeout: 6000 });
      assert.ok(await prev.isEnabled(), "Previous should enable on Episode 2");
      const current = await episodeDeck.locator(".qa-episode-now strong").textContent();
      assert.match(String(current), /Episode 2/i);
      await prev.click();
      await page.waitForFunction(() => document.querySelector(".qa-episode-deck [data-episode='0']")?.classList.contains("active"), null, { timeout: 6000 });
      assert.ok(await prev.isDisabled(), "Previous should disable again on Episode 1");
      const geometry = await episodeDeck.evaluate(el => {
        const rail = el.querySelector(".episode-grid");
        const first = el.querySelectorAll(".episode-card")[0]?.getBoundingClientRect();
        const second = el.querySelectorAll(".episode-card")[1]?.getBoundingClientRect();
        const image = el.querySelector(".episode-thumb img")?.getBoundingClientRect();
        const episodeCopy = el.querySelector(".episode-copy")?.getBoundingClientRect();
        return {
          layout: getComputedStyle(rail).flexDirection,
          railWidth: rail.clientWidth,
          cardWidth: first?.width || 0,
          cardCount: rail.children.length,
          rowsStacked: !!first && !!second && second.top > first.top + first.height - 2,
          rowSameLeft: !!first && !!second && Math.abs(first.left - second.left) < 2,
          imageWidth: image?.width || 0,
          copyWidth: episodeCopy?.width || 0
        };
      });
      assert.ok(
        geometry.layout === "column" && geometry.cardWidth >= geometry.railWidth * .94 &&
        geometry.cardCount > 1 && geometry.rowsStacked && geometry.rowSameLeft &&
        geometry.imageWidth > 95 && geometry.copyWidth > 85,
        "Episodes should use the earlier Netflix-style full-width image + metadata rows: " + JSON.stringify(geometry)
      );
      const movieOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(movieOverflow <= 2, device.name + " movie detail viewport must not have horizontal overflow: " + movieOverflow);
      console.log("PASS", device.name, "real Bigg Boss 20 Episode 1 > Next > Previous, original Netflix-style full-width episode rows, no horizontal overflow");
    }
    assert.deepEqual(errors, [], device.name + " uncaught page errors");
    await context.close();
    total += 1;
  }
} finally {
  await browser.close();
}
assert.equal(total, 3);
console.log("PASS: QA responsive/launch/tab smoke on iPhone 6-size, current-iPhone-size and Android emulations; real iOS WebKit device still requires manual verification.");
