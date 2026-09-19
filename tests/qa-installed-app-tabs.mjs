import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
const base=process.env.PREVIEW_URL;
assert.ok(base?.startsWith("https://"));
const devices=[
 {name:"Android installed app",type:chromium,width:390,height:844},
 {name:"Compact iPhone installed app",type:webkit,width:320,height:568},
 {name:"iPhone installed app",type:webkit,width:375,height:667}
];
for(const d of devices){
 const browser=await d.type.launch({headless:true});
 const context=await browser.newContext({viewport:{width:d.width,height:d.height},isMobile:true,hasTouch:true,serviceWorkers:"allow"});
 // Test the actual standalone navigator capability, not a sample HTML mockup.
 await context.addInitScript(()=>Object.defineProperty(navigator,"standalone",{configurable:true,value:true}));
 const page=await context.newPage();
 try{
   const response=await page.goto(base+"/?qa=1",{waitUntil:"domcontentloaded",timeout:45000});
   assert.equal(response.status(),200,d.name+" installed app route");
   await page.locator("#app-splash").waitFor({state:"detached",timeout:7000});
   await page.locator("#top-grid a.poster-link").first().waitFor({state:"visible",timeout:45000});
   assert.equal(await page.locator("html.cd-app-installed").count(),1,d.name+" installed mode missing");
   assert.equal(await page.locator("body[data-cd-app-view='home']").count(),1,d.name+" Home tab did not initialize");
   const nav=page.locator(".mobile-bottom-nav");
   const navMetrics=await nav.evaluate(el=>({
     width:Math.round(el.getBoundingClientRect().width),
     viewport:window.innerWidth,
     bottom:Math.round(el.getBoundingClientRect().bottom)
   }));
   assert.ok(Math.abs(navMetrics.width-navMetrics.viewport)<=2,d.name+" nav not app-width "+JSON.stringify(navMetrics));
   await nav.locator('a[href="#top-today"]').click();
   await page.locator("body[data-cd-app-view='new']").waitFor({state:"attached",timeout:7000});
   await page.locator("#new-releases").waitFor({state:"visible",timeout:7000});
   await page.locator("#home").waitFor({state:"hidden",timeout:7000});
   await nav.locator('a[href="#watchlist"]').click();
   await page.locator("body[data-cd-app-view='list']").waitFor({state:"attached",timeout:7000});
   await page.locator("#watchlist").waitFor({state:"visible",timeout:7000});
   await page.locator("#top-today").waitFor({state:"hidden",timeout:7000});
   await nav.locator("#bottom-search").click();
   await page.locator("body[data-cd-app-view='search']").waitFor({state:"attached",timeout:7000});
   await page.locator(".catalog-header.search-mode #search").waitFor({state:"visible",timeout:7000});
   await page.locator("#search-close").click();
   await page.locator("body[data-cd-app-view='list']").waitFor({state:"attached",timeout:7000});
   await nav.locator('a[href="#home"]').click();
   await page.locator("body[data-cd-app-view='home']").waitFor({state:"attached",timeout:7000});
   await page.locator("#top-grid a.poster-link").first().waitFor({state:"visible",timeout:7000});
   const movie=await page.goto(base+"/movie?slug=tamasha-season-5",{waitUntil:"domcontentloaded",timeout:45000});
   assert.equal(movie.status(),200,d.name+" movie route");
   await page.locator("#watch .episode-card").first().waitFor({state:"visible",timeout:45000});
   assert.equal(await page.locator("html.cd-app-installed").count(),1,d.name+" movie premium style missing");
   const cols=await page.locator("#watch .episode-grid").evaluate(el=>getComputedStyle(el).gridTemplateColumns);
   assert.equal(cols.split(" ").length,1,d.name+" episodes not one-column touch rows: "+cols);
   assert.equal(await page.locator("#official-player").count(),1,d.name+" official video iframe missing");
   const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth));
   assert.ok(overflow<=2,d.name+" installed app horizontal overflow "+overflow);
   console.log("PASS",d.name,"genuine app tab taps, live catalog, branded launch exit, vertical episode list and original official player");
 }finally{await context.close();await browser.close();}
}
