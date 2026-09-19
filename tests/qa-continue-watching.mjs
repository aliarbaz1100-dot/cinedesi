import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
const base=process.env.PREVIEW_URL;
assert.ok(base?.startsWith("https://"));
for(const [label,type,width,height] of [
  ["Android-sized Chromium",chromium,360,800],
  ["iPhone 6-sized Safari/WebKit",webkit,375,667]
]){
 const browser=await type.launch({headless:true});
 const context=await browser.newContext({
   viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:"allow"
 });
 await context.addInitScript(()=>{
   localStorage.setItem("cinedesi_continue",JSON.stringify([
     {slug:"tamasha-season-5",title:"Tamasha Season 5",episode_index:1,episode_number:2,updated_at:Date.now()}
   ]));
 });
 const page=await context.newPage();
 try{
   const home=await page.goto(base+"/",{waitUntil:"domcontentloaded",timeout:45000});
   assert.equal(home.status(),200,label+" home");
   const resume=page.locator("#continue-grid a.poster-link[href*='tamasha-season-5']");
   await resume.first().waitFor({state:"visible",timeout:45000});
   const href=await resume.first().getAttribute("href");
   assert.ok(href?.includes("#watch"),label+" Continue Watching missing direct video destination");
   const resumeCaption=page.locator("#continue-grid article.card:has(a.poster-link[href*=\'tamasha-season-5\']) .cd-resume-label");
   assert.match(await resumeCaption.innerText(),/Resume episode 2/i,label+" resume state not visible in mobile card");
   const action=page.locator("#continue-grid a.play-mini[href*='tamasha-season-5']");
   assert.match(await action.first().textContent()||"",/Resume E2/i,label+" correct episode resume action missing");
   await resume.first().click();
   await page.waitForURL(url=>url.pathname==="/movie" && url.hash==="#watch",{waitUntil:"domcontentloaded",timeout:30000});
   await page.locator(".episode-card.active[data-episode='1']").waitFor({state:"visible",timeout:35000});
   const iframe=page.locator("#official-player");
   await iframe.waitFor({state:"visible",timeout:15000});
   await page.waitForFunction(()=>document.querySelector("#official-player")?.getAttribute("src")?.includes("f0bO82jO4hk"),null,{timeout:15000});
   console.log("PASS",label,"Continue Watching resumed exact official episode 2 without a second install or custom player");
 } finally {await context.close();await browser.close();}
}
