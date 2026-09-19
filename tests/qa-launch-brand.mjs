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
} finally {
 await context.close();
 await browser.close();
}
