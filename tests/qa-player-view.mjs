import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";

const base = process.env.PREVIEW_URL;
assert.ok(base?.startsWith("https://"), "Expected secure QA preview");
const cases = [
  { name:"Android-sized Chrome", browser:chromium, width:360, height:800, mobile:true },
  { name:"iPhone 5-sized WebKit layout", browser:webkit, width:320, height:568, mobile:true },
  { name:"iPhone 6-sized WebKit layout", browser:webkit, width:375, height:667, mobile:true },
  { name:"Desktop Chrome", browser:chromium, width:1440, height:900, mobile:false },
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
    assert.equal(response.status(),200,device.name+" movie document status");
    assert.match(response.headers()["content-type"]||"",/text\/html/,device.name+" must receive HTML, not a download");
    const stage=page.locator("#player-stage");
    await stage.waitFor({state:"visible",timeout:45000});
    const before=await stage.evaluate(el=>({
      width:el.getBoundingClientRect().width,
      playerWidth:el.querySelector(".legal-player")?.getBoundingClientRect().width,
      playerHeight:el.querySelector(".legal-player")?.getBoundingClientRect().height,
      iframe:el.querySelector("#official-player")?.getAttribute("src"),
      supportsPip:el.querySelector("#official-player")?.getAttribute("allow"),
    }));
    assert.ok(before.iframe && before.supportsPip?.includes("picture-in-picture"),device.name+" official embed/PiP permission missing");
    console.log("QA PLAYER SIZE",device.name,JSON.stringify(before),await page.evaluate(()=>{
      const stage=document.querySelector("#player-stage");
      const section=document.querySelector("#watch");
      return {viewport:window.innerWidth,cssMobile:matchMedia("(max-width:760px)").matches,
        stageStyle:getComputedStyle(stage).width,stageMargin:getComputedStyle(stage).marginLeft,
        sectionWidth:section?.getBoundingClientRect().width,sectionPadding:getComputedStyle(section).padding,
        documentWidth:document.documentElement.scrollWidth};
    }));
    assert.ok(before.width>=device.width*(device.mobile?.91:.50),device.name+" player too narrow: "+JSON.stringify(before));
    assert.ok(before.playerHeight>=140,device.name+" player unexpectedly short: "+JSON.stringify(before));
    await page.locator("#player-wide").click({timeout:12000});
    await page.waitForFunction(()=> {
      const el=document.querySelector("#player-stage");
      return !!el && (el.classList.contains("cd-theater")||document.fullscreenElement===el);
    },null,{timeout:12000});
    const active=await stage.evaluate(el=>({
      width:el.getBoundingClientRect().width,
      height:el.getBoundingClientRect().height,
      sameVideo:el.querySelector("#official-player")?.getAttribute("src"),
      exitVisible:!el.querySelector("#player-exit-wide")?.hidden
    }));
    assert.ok(active.exitVisible && active.width>=device.width*.95,device.name+" theater not filling viewport: "+JSON.stringify(active));
    assert.equal(active.sameVideo,before.iframe,device.name+" entering wide view restarted the video");
    await page.locator("#player-exit-wide").click({timeout:12000});
    await page.waitForFunction(()=>{
      const el=document.querySelector("#player-stage");
      return !el.classList.contains("cd-theater")&&document.fullscreenElement!==el;
    },null,{timeout:12000});
    const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-window.innerWidth));
    // Record existing document overflow; player-only CSS may not change unrelated catalogue layout.
    console.log("PASS "+device.name+" player "+Math.round(before.width)+"x"+Math.round(before.playerHeight)+
      ", wide "+Math.round(active.width)+"x"+Math.round(active.height)+
      ", same iframe source, exit works; horizontal overflow "+overflow+"px");
  } finally {
    await context.close();
    await browser.close();
  }
}
