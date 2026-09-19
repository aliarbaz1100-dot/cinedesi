import { webkit } from "playwright";
import assert from "node:assert/strict";

const base = process.env.PREVIEW_URL;
assert.ok(base?.startsWith("https://"), "Missing preview URL");
const browser = await webkit.launch({headless:true});
try {
  for (const device of [
    { label: "iPhone-sized Safari/WebKit", viewport: {width:390,height:844}, isMobile:true, hasTouch:true },
    { label: "Desktop Safari/WebKit", viewport: {width:1440,height:900}, isMobile:false, hasTouch:false },
  ]) {
    const context = await browser.newContext({
      viewport:device.viewport,
      isMobile:device.isMobile,
      hasTouch:device.hasTouch,
      serviceWorkers:"allow",
    });
    const page = await context.newPage();
    const problems = [];
    page.on("pageerror", error => problems.push(error.message));
    try {
      const response = await page.goto(base+"/", {waitUntil:"domcontentloaded",timeout:40000});
      assert.equal(response.status(),200,device.label+" homepage status");
      assert.ok((await response.headerValue("content-type"))?.includes("text/html"),device.label+" HTML MIME");
      const first = page.locator("#top-grid a.poster-link[href*='/movie?slug=']").first();
      await first.waitFor({state:"visible",timeout:45000});
      assert.equal(await page.locator("#install-banner").isVisible(),false,device.label+" popup must remain hidden");
      const homeDesign = await page.evaluate(() => {
        const hero=document.querySelector(".streaming-hero");
        const heading=document.querySelector("#hero-title");
        const nav=document.querySelector(".mobile-bottom-nav");
        const style=getComputedStyle(hero);
        return {
          brandedColor:getComputedStyle(document.documentElement).getPropertyValue("--cd-red").trim(),
          heroHeight:Math.round(hero.getBoundingClientRect().height),
          heroBackground:style.backgroundColor,
          titleSize:parseFloat(getComputedStyle(heading).fontSize),
          bottomNavRadius:getComputedStyle(nav).borderTopLeftRadius,
        };
      });
      assert.equal(homeDesign.brandedColor,"#ed1734",device.label+" new cinema stylesheet missing");
      assert.ok(homeDesign.heroHeight>=(device.isMobile?550:540),device.label+" cinematic hero not rendered: "+JSON.stringify(homeDesign));
      assert.ok(homeDesign.titleSize>=(device.isMobile?35:45),device.label+" hero typography not applied: "+JSON.stringify(homeDesign));
      if(device.isMobile) assert.equal(homeDesign.bottomNavRadius,"0px",device.label+" old floating bottom navigation still overrides redesign");
      console.log("PASS",device.label,"visible visual refresh",JSON.stringify(homeDesign));
      const movieHref = await first.getAttribute("href");
      await first.click();
      await page.waitForURL(/\/movie\?slug=/,{waitUntil:"domcontentloaded",timeout:20000});
      await page.waitForFunction(() => {
        const s=document.querySelector("#movie-page")?.textContent||"";
        return s.length>100 && !s.includes("Loading verified movie details");
      }, {timeout:30000});
      const detail = await page.locator("#movie-page").innerText();
      assert.ok(!/could not load movie details|unable to open this title|could not be found/i.test(detail),device.label+" detail error");
      await page.locator("#movie-back").click();
      await page.waitForURL(url=>url.pathname==="/"||url.pathname==="/index.html",{waitUntil:"domcontentloaded",timeout:20000});
      await page.locator("#top-grid a.poster-link").first().waitFor({state:"visible",timeout:30000});
      const sw = await page.evaluate(async () => {
        if (!("serviceWorker" in navigator)) return "unsupported";
        return Promise.race([
          navigator.serviceWorker.ready.then(reg=>Boolean(reg.active)),
          new Promise(resolve=>setTimeout(()=>resolve(false),12000))
        ]);
      });
      assert.equal(sw,true,device.label+" app worker inactive");
      assert.deepEqual(problems.filter(x=>/syntaxerror|referenceerror|failed to fetch dynamically imported module/i.test(x)),[],device.label+" JS errors");
      console.log("PASS",device.label,"home, movie",movieHref,"back, SW, no automatic popup");
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
