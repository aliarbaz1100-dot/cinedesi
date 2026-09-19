import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.PREVIEW_URL;
assert.ok(base?.startsWith("https://"), "A secure isolated QA URL is required");
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({
  viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,
  serviceWorkers:"allow"
});
const page = await context.newPage();
try {
  const client=await context.newCDPSession(page);
  await client.send("Emulation.setEmulatedMedia",{
    media:"screen",features:[{name:"display-mode",value:"standalone"}]
  });
  const pwaEmulated=await page.evaluate(()=>matchMedia("(display-mode: standalone)").matches);
  if (!pwaEmulated) {
    console.log("SKIP browser visual splash emulation: Chromium did not emulate standalone display-mode");
  } else {
    const response=await page.goto(base+"/",{waitUntil:"domcontentloaded",timeout:40000});
    assert.equal(response.status(),200,"Installed app entrypoint failed");
    const splash=page.locator("#app-splash");
    const html=await splash.innerText().catch(()=>"");
    assert.ok(/CINE\s*DESI/.test(html),"CineDesi logo missing from app launch");
    assert.ok(html.includes("Powered by Arbaz Ali"),"Arbaz Ali credit missing");
    const animation=await page.locator(".splash-desi").evaluate(el=>getComputedStyle(el).animationName);
    assert.ok(animation.includes("cdRevealDesi"),"Branded CineDesi animation missing: "+animation);
    await splash.waitFor({state:"detached",timeout:7000});
    await page.locator("#top-grid a.poster-link").first().waitFor({state:"visible",timeout:45000});
    console.log("PASS installed-app style launch: original CineDesi wordmark animation + Arbaz Ali credit + no stuck splash");
  }
  // Simulate older iOS installed-app navigator.standalone support separately from
  // Chromium's display-mode emulation (which isn't supported on this runner).
  const legacyContext=await browser.newContext({
    viewport:{width:320,height:568},isMobile:true,hasTouch:true,serviceWorkers:"allow"
  });
  await legacyContext.addInitScript(()=>{
    Object.defineProperty(navigator,"standalone",{configurable:true,value:true});
  });
  try {
    const legacyPage=await legacyContext.newPage();
    const response=await legacyPage.goto(base+"/",{waitUntil:"domcontentloaded",timeout:40000});
    assert.equal(response.status(),200,"Older iOS standalone homepage failed");
    assert.equal(await legacyPage.evaluate(()=>document.documentElement.classList.contains("cd-ios-standalone")),true,"Older iOS standalone splash CSS class missing");
    const splash=legacyPage.locator("#app-splash");
    await splash.waitFor({state:"visible",timeout:2500});
    const state=await splash.evaluate(el=>({
      logo:el.querySelector(".splash-logo")?.textContent||"",
      credit:el.querySelector(".splash-brand p")?.textContent||"",
      animation:getComputedStyle(el.querySelector(".splash-desi")).animationName,
      display:getComputedStyle(el).display
    }));
    assert.match(state.logo,/CINEDESI/,"CineDesi wordmark missing");
    assert.match(state.credit,/Powered by Arbaz Ali/,"Brand credit missing");
    assert.equal(state.display,"flex","Older iOS standalone splash not shown");
    assert.ok(state.animation.includes("cdRevealDesi"),"Older iOS wordmark animation missing");
    await splash.waitFor({state:"detached",timeout:7000});
    await legacyPage.locator("#top-grid a.poster-link").first().waitFor({state:"visible",timeout:45000});
    console.log("PASS older-iOS standalone simulation: animated CineDesi logo + Arbaz Ali credit + clean launch exit");
  } finally {await legacyContext.close();}
} finally {
 await context.close();
 await browser.close();
}
