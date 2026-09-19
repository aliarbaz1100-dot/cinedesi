import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";

const base=process.env.PREVIEW_URL;
assert.ok(base?.startsWith("https://"),"Use verified QA origin");
for(const device of [
  {name:"Android Chromium",engine:chromium,width:390,height:844},
  {name:"iPhone Safari/WebKit",engine:webkit,width:375,height:667}
]){
  const browser=await device.engine.launch({headless:true});
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},isMobile:true,hasTouch:true,serviceWorkers:"allow"});
  const page=await context.newPage();
  try{
    const response=await page.goto(base+"/app-preview.html",{waitUntil:"domcontentloaded",timeout:45000});
    assert.equal(response.status(),200,device.name+" QA app preview status");
    assert.match(response.headers()["content-type"]||"",/text\/html/,device.name+" preview must be HTML");
    await page.locator("h1").getByText("See your mobile app").waitFor({state:"visible",timeout:15000});
    assert.equal(await page.locator(".brand img").getAttribute("src"),"/cinedesi-apple-touch.png?v=3",device.name+" app icon not real CineDesi icon");
    assert.match(await page.locator(".qa-badge").innerText(),/TEST APP/);
    assert.equal(await page.locator("iframe[title='Live CineDesi QA home screen']").getAttribute("src"),"/?app-visual-preview=1&qa-app-preview=1");
    const frame=page.frameLocator("iframe[title='Live CineDesi QA home screen']");
    await frame.locator("#top-grid a.poster-link").first().waitFor({state:"visible",timeout:45000});
    assert.equal(await frame.locator("html.cd-app-installed").count(),1,device.name+" premium installed-app class missing from real home");
    const appHeader=await frame.locator(".catalog-header").evaluate(el=>getComputedStyle(el).position);
    assert.equal(appHeader,"sticky",device.name+" premium app header should stay visible");
    const appNav=await frame.locator(".mobile-bottom-nav").evaluate(el=>({
      radius:getComputedStyle(el).borderRadius,width:Math.round(el.getBoundingClientRect().width)
    }));
    assert.ok(appNav.width>=device.width-2,device.name+" app nav should span full mobile width: "+appNav.width);
    await page.locator("#screen-episodes").click();
    assert.equal(await page.locator("#screen-episodes").getAttribute("aria-pressed"),"true",device.name+" movie-screen tab should be active");
    const episodes=page.frameLocator("iframe[title='Live CineDesi QA movie and episodes']");
    await episodes.locator(".episode-browser .episode-card").first().waitFor({state:"visible",timeout:45000});
    assert.equal(await episodes.locator("html.cd-app-installed").count(),1,device.name+" premium movie screen not enabled");
    assert.equal(await episodes.locator("#watch .episode-grid").evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(" ").length),1,device.name+" movie episodes should render as vertical touch rows");
    assert.equal(await episodes.locator("#watch #official-player").count(),1,device.name+" original official player must remain present");
    assert.ok(await episodes.locator(".episode-browser .episode-card").count()>2,device.name+" real episode list not loaded");
    await page.locator("#screen-home").click();
    await page.frameLocator("iframe[title='Live CineDesi QA home screen']").locator("#top-grid a.poster-link").first().waitFor({state:"visible",timeout:45000});
    await page.locator("#replay").click();
    await page.locator("#demo").waitFor({state:"visible",timeout:1000});
    assert.match(await page.locator("#demo").innerText(),/CINE\s*DESI/i,device.name+" opening wordmark missing");
    assert.match(await page.locator("#demo").innerText(),/Powered by Arbaz Ali/i,device.name+" opening credit missing");
    await page.locator("#demo").waitFor({state:"hidden",timeout:5000});
    await page.locator('a[href="/?app-install=1"]').first().click();
    await page.waitForURL(url=>url.pathname==="/"&&url.searchParams.has("app-install"),{waitUntil:"domcontentloaded",timeout:30000});
    await page.locator("#top-grid a.poster-link").first().waitFor({state:"visible",timeout:45000});
    assert.equal(await page.locator("html.cd-app-installed").count(),0,device.name+" ordinary browser tab should retain original website appearance");
    const identity=await page.evaluate(()=>({
      iosTitle:document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content,
      manifest:document.querySelector('link[rel="manifest"]')?.getAttribute("href"),
      uaStandalone:navigator.standalone
    }));
    assert.equal(identity.iosTitle,"CineDesi QA",device.name+" iOS QA install label missing");
    console.log("QA INSTALL IDENTITY",device.name,JSON.stringify(identity));
    assert.ok(identity.manifest?.includes("qa-mobile-1"),device.name+" QA manifest not attached");
    const manifestResponse=await context.request.get(base+"/manifest.webmanifest");
    assert.equal(manifestResponse.status(),200);
    const manifest=await manifestResponse.json();
    assert.equal(manifest.short_name,"CineDesi QA");
    assert.equal(manifest.display,"standalone");
    assert.ok(manifest.start_url.includes("qa=1"),"Installed preview must start at QA app");
    assert.ok((manifest.icons||[]).some(x=>x.sizes==="192x192") && (manifest.icons||[]).some(x=>x.sizes==="512x512"),"Missing Android app icon sizes");
    console.log("PASS",device.name,"live install-preview, branded launch replay, real homepage, separate home-screen title and installable PWA manifest");
  }finally{await context.close();await browser.close();}
}
