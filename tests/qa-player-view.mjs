import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";

const base = process.env.PREVIEW_URL;
assert.ok(base?.startsWith("https://"), "Expected secure QA preview");
const cases = [
  {name:"Android-sized Chrome", browser:chromium, width:360, height:800, mobile:true},
  {name:"iPhone 5-size WebKit", browser:webkit, width:320, height:568, mobile:true},
  {name:"iPhone 6-size WebKit", browser:webkit, width:375, height:667, mobile:true},
  {name:"Desktop Chrome", browser:chromium, width:1440, height:900, mobile:false},
];
for (const device of cases) {
  const browser = await device.browser.launch({headless:true});
  const context = await browser.newContext({
    viewport:{width:device.width,height:device.height},isMobile:device.mobile,
    hasTouch:device.mobile,deviceScaleFactor:device.mobile?2:1,serviceWorkers:"allow",
  });
  const page = await context.newPage();
  try {
    const response = await page.goto(base+"/movie?slug=tamasha-season-5",{waitUntil:"domcontentloaded",timeout:45000});
    assert.equal(response.status(),200,device.name+" movie document");
    assert.match(response.headers()["content-type"]||"",/text\/html/,device.name+" movie HTML");
    const iframe=page.locator("#official-player");
    await iframe.waitFor({state:"visible",timeout:45000});
    const sourceBefore=await iframe.getAttribute("src");
    assert.ok(sourceBefore?.startsWith("https://"),device.name+" official player missing");
    assert.equal(await page.locator("#player-wide, #player-stage, #player-view-note, .cd-player-source-link").count(),0,device.name+" unwanted Wide view toolbar returned");
    assert.equal(await page.locator(".legal-player").count(),1,device.name+" duplicated player");
    const allow=await iframe.getAttribute("allow");
    assert.ok(allow?.includes("picture-in-picture"),device.name+" native provider PiP permission missing");
    assert.ok(await iframe.evaluate(el=>el.hasAttribute("allowfullscreen")),device.name+" native fullscreen permission missing");
    const width=await iframe.evaluate(el=>el.getBoundingClientRect().width);
    assert.ok(width>Math.min(device.width*.70,250),device.name+" player too narrow "+width);
    const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-window.innerWidth));
    assert.ok(overflow<=2,device.name+" horizontal overflow "+overflow);
    const sourceAfter=await iframe.getAttribute("src");
    assert.equal(sourceAfter,sourceBefore,device.name+" player unexpectedly reloaded");
    console.log("PASS "+device.name+": original single player; no Wide view; native fullscreen/PiP permitted; no horizontal overflow");
  } finally { await context.close(); await browser.close(); }
}
