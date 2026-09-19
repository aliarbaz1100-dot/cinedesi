import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";

const base=process.env.PREVIEW_URL;
assert.ok(base?.startsWith("https://"));
for(const d of [
  {name:"Android-sized Chrome", browser:chromium, width:360, height:800},
  {name:"iPhone 5-sized WebKit", browser:webkit, width:320, height:568},
  {name:"iPhone 6-sized WebKit", browser:webkit, width:375, height:667},
]){
  const browser=await d.browser.launch({headless:true});
  const context=await browser.newContext({viewport:{width:d.width,height:d.height},isMobile:true,hasTouch:true,serviceWorkers:"allow"});
  const page=await context.newPage();
  try{
    const response=await page.goto(base+"/",{waitUntil:"domcontentloaded",timeout:45000});
    assert.equal(response.status(),200,d.name+" homepage");
    await page.locator("#top-grid .card").first().waitFor({state:"visible",timeout:45000});
    const nav=page.locator(".mobile-bottom-nav");
    await nav.waitFor({state:"visible",timeout:7000});
    const selected=()=>nav.locator('[aria-current="page"]');
    assert.equal(await selected().count(),1,d.name+" initial tab count");
    assert.equal(await selected().first().getAttribute("href"),"#home",d.name+" home tab missing");
    await page.locator("#bottom-search").click();
    await page.locator(".catalog-header.search-mode #search").waitFor({state:"visible",timeout:5000});
    assert.equal(await selected().first().getAttribute("id"),"bottom-search",d.name+" search tab not active");
    await page.locator("#search-close").click();
    assert.equal(await selected().first().getAttribute("href"),"#home",d.name+" home tab did not restore");
    await nav.locator('a[href="#top-today"]').click();
    await page.waitForFunction(()=>document.querySelector(".mobile-bottom-nav [aria-current='page']")?.getAttribute("href")==="#top-today",null,{timeout:5000});
    await nav.locator('a[href="#watchlist"]').click();
    await page.waitForFunction(()=>document.querySelector(".mobile-bottom-nav [aria-current='page']")?.getAttribute("href")==="#watchlist",null,{timeout:5000});
    await nav.locator('a[href="#home"]').click();
    await page.waitForFunction(()=>document.querySelector(".mobile-bottom-nav [aria-current='page']")?.getAttribute("href")==="#home",null,{timeout:5000});
    const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-window.innerWidth));
    assert.ok(overflow<=2,d.name+" horizontal overflow "+overflow);
    console.log("PASS",d.name,"Home / New / Search / My List active nav, tap behavior and no horizontal overflow");
  }finally{await context.close();await browser.close();}
}
