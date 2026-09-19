import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";

const base = process.env.PREVIEW_URL;
assert.ok(base?.startsWith("https://"),"Use isolated HTTPS preview");
const devices=[
  { label:"Android mobile", type:chromium, width:360,height:800, mobile:true },
  { label:"iPhone 5-size WebKit",type:webkit,width:320,height:568,mobile:true },
  { label:"iPhone 6-size WebKit",type:webkit,width:375,height:667,mobile:true },
  { label:"Desktop",type:chromium,width:1440,height:900,mobile:false }
];
for(const device of devices){
 const browser=await device.type.launch({headless:true});
 const context=await browser.newContext({viewport:{width:device.width,height:device.height},isMobile:device.mobile,hasTouch:device.mobile,serviceWorkers:"allow"});
 const page=await context.newPage();
 try{
   const response=await page.goto(base+"/movie?slug=tamasha-season-5",{waitUntil:"domcontentloaded",timeout:45000});
   assert.equal(response.status(),200,device.label+" movie status");
   const first=page.locator(".episode-browser .episode-card").first();
   await first.waitFor({state:"visible",timeout:45000});
   assert.ok((await page.locator(".episode-browser .episode-card").count())>2,device.label+" series episodes missing");
   const iframe=page.locator("#official-player");
   await iframe.waitFor({state:"visible",timeout:15000});
   const original=await iframe.getAttribute("src");
   assert.match(original||"",/QhmbXMnsfl4/,device.label+" unexpected first official episode");
   const previous=page.locator("#cd-prev-episode"),next=page.locator("#cd-next-episode"),position=page.locator("#cd-episode-position");
   assert.equal(await previous.isDisabled(),true,device.label+" previous should be disabled at first episode");
   assert.equal(await next.isEnabled(),true,device.label+" next episode missing");
   await next.click();
   await page.waitForFunction(()=>document.querySelector(".episode-card.active")?.dataset.episode==="1",null,{timeout:12000});
   await page.waitForFunction(()=>document.querySelector("#official-player")?.getAttribute("src")?.includes("f0bO82jO4hk"),null,{timeout:12000});
   assert.match(await position.innerText(),/Episode 2 of/,device.label+" episode counter not updated");
   assert.equal(await previous.isEnabled(),true,device.label+" previous disabled on episode 2");
   await previous.click();
   await page.waitForFunction(()=>document.querySelector(".episode-card.active")?.dataset.episode==="0",null,{timeout:12000}).catch(async(error)=>{
     const debug=await page.evaluate(()=>({
       active:[...document.querySelectorAll(".episode-card.active")].map(el=>el.dataset.episode),
       firstDisabled:document.querySelector(".episode-card")?.disabled,
       previousDisabled:document.querySelector("#cd-prev-episode")?.disabled,
       nextDisabled:document.querySelector("#cd-next-episode")?.disabled,
       videoUrl:document.querySelector("#official-player")?.getAttribute("src"),
       pathname:location.pathname,
       position:document.querySelector("#cd-episode-position")?.textContent
     })).catch(e=>({inspectionFailed:String(e)}));
     console.log("EPISODE PREVIOUS DEBUG",device.name,JSON.stringify(debug));
     throw error;
   });
   assert.match(await iframe.getAttribute("src")||"",/QhmbXMnsfl4/,device.label+" previous episode did not load correct source");
   assert.equal(await previous.isDisabled(),true,device.label+" previous should disable again on first");
   assert.equal(await page.locator("#player-wide, .cd-player-source-link").count(),0,device.label+" discarded player toolbar reappeared");
   const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth));
   assert.ok(overflow<=2,device.label+" horizontal overflow: "+overflow);
   console.log("PASS",device.label,"next/previous actual episode selection and verified embed URLs, responsive controls, no clutter");
 }finally{await context.close();await browser.close();}
}
