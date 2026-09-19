import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
const base=process.env.PREVIEW_URL;
assert.ok(base?.startsWith("https://"),"Use isolated QA URL");
for(const config of [
 {label:"Android mobile search",browser:chromium,width:360,height:800,mobile:true},
 {label:"iPhone 6-size search",browser:webkit,width:375,height:667,mobile:true},
 {label:"Desktop keyboard search",browser:chromium,width:1440,height:900,mobile:false},
]){
 const browser=await config.browser.launch({headless:true});
 const context=await browser.newContext({viewport:{width:config.width,height:config.height},isMobile:config.mobile,hasTouch:config.mobile,serviceWorkers:"allow"});
 const page=await context.newPage();
 try{
   const response=await page.goto(base+"/",{waitUntil:"domcontentloaded",timeout:45000});
   assert.equal(response.status(),200,config.label+" homepage");
   await page.locator("#top-grid a.poster-link").first().waitFor({state:"visible",timeout:45000});
   if(config.mobile) await page.locator("#bottom-search").click();
   const input=page.locator("#search");
   await input.fill("tamasha");
   const first=page.locator("#search-suggestions a.search-result-card").first();
   await first.waitFor({state:"visible",timeout:15000});
   const target=await first.getAttribute("href");
   assert.match(target||"",/^\/movie\?slug=/);
   await input.press("ArrowDown");
   assert.equal(await input.getAttribute("aria-activedescendant"),"cd-search-option-0",config.label+" first suggestion not selected");
   assert.ok(await first.evaluate(el=>el.classList.contains("cd-search-selected")),config.label+" visible selection absent");
   await input.press("Enter");
   await page.waitForURL(url=>url.pathname==="/movie" && url.searchParams.has("slug"),{waitUntil:"domcontentloaded",timeout:25000});
   assert.equal(new URL(page.url()).searchParams.get("slug"),new URL(target,base).searchParams.get("slug"),config.label+" opened incorrect result");
   console.log("PASS",config.label,"suggestions navigate to exact verified title using ArrowDown + Enter");
 } finally {await context.close();await browser.close();}
}
