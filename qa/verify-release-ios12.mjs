import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";

const address = "http://cinedesi.online:4173";
const fixture = [
  {id:92001,slug:"ios12-discovery-older",title:"Discovery older movie",region:"Bollywood",genre:"Action",content_type:"movie",release_year:2005,full_video_verified:false,full_video_embed_url:null,poster_url:"https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg"},
  {id:92002,slug:"ios12-discovery-newer",title:"Discovery new movie",region:"Bollywood",genre:"Action",content_type:"movie",release_year:2026,full_video_verified:false,full_video_embed_url:null,poster_url:"https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg"},
  {id:92003,slug:"ios12-watch-movie",title:"Verified playable movie",region:"Hollywood",genre:"Action",content_type:"movie",release_year:2026,full_video_verified:true,full_video_embed_url:"https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",poster_url:"https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",poster_source_url:"https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",poster_license:"rights-holder promotional art"},
  {id:92004,slug:"ios12-watch-series",title:"Verified playable series",region:"Turkey",genre:"Drama",content_type:"series",release_year:2026,full_video_verified:true,full_video_embed_url:"https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",poster_url:"https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",poster_source_url:"https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",poster_license:"rights-holder promotional art"}
];
const ids = (selector) => document.querySelectorAll(selector);
const head = fs.readFileSync("dist/index.html","utf8");
const movie = fs.readFileSync("dist/movie.html","utf8");
const worker = fs.readFileSync("dist/sw.js","utf8");
const compat = fs.readFileSync("dist/qa-compat.js","utf8");
assert.match(head,/apple-mobile-web-app-title" content="CineDesi"/);
assert.match(head,/qa-compat\.js/);
assert.match(movie,/qa-compat\.js/);
assert.match(worker,/Promise\.all\(/);
assert.ok(!worker.includes("Promise.allSettled("),"iOS 12 Service Worker must not use Promise.allSettled");
assert.ok(compat.includes("Object.fromEntries")&&compat.includes("replaceAll")&&compat.includes("queueMicrotask"));
console.log("PASS production Safari 12 build contains first-load polyfills and compatible service worker");
const browser = await chromium.launch({headless:true,args:["--no-proxy-server"]});
try {
  const ctx = await browser.newContext({
    viewport:{width:375,height:667},deviceScaleFactor:2,isMobile:true,hasTouch:true,
    userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 12_5_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1",
    bypassCSP:true
  });
  await ctx.addInitScript(()=>{
    Object.defineProperty(navigator,"standalone",{configurable:true,get:()=>true});
    Object.defineProperty(String.prototype,"replaceAll",{configurable:true,writable:true,value:undefined});
    Object.fromEntries=undefined;
    window.queueMicrotask=undefined;
    window.requestIdleCallback=undefined;
  });
  await ctx.route("**/rest/v1/**",async route=>{
    const url=new URL(route.request().url());
    const headers={"access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"*","content-type":"application/json"};
    if(route.request().method()==="OPTIONS")return route.fulfill({status:204,headers,body:""});
    if(url.pathname.endsWith("/movies")){
      const offset=Number(url.searchParams.get("offset")||0);
      const limit=Number(url.searchParams.get("limit")||1000);
      return route.fulfill({status:200,headers,body:JSON.stringify(fixture.slice(offset,offset+limit))});
    }
    return route.fulfill({status:200,headers,body:"[]"});
  });
  const page=await ctx.newPage();
  const errors=[];
  page.on("pageerror",err=>errors.push(err.message));
  const resp=await page.goto(address+"/?source=pwa",{waitUntil:"domcontentloaded",timeout:30000});
  assert.equal(resp?.status(),200);
  await page.waitForFunction(()=>document.documentElement.getAttribute("data-qa-intro-started")==="1",null,{timeout:3000});
  const introPlayed=await page.evaluate(()=>document.documentElement.getAttribute("data-qa-intro-started")==="1");
  await page.waitForFunction(()=>document.querySelector("#new-grid .card"),null,{timeout:20000});
  const state=await page.evaluate(()=>({
    host:location.hostname,
    class:document.documentElement.classList.contains("cd-qa-mode"),
    installed:navigator.standalone===true,
    source:document.querySelector("#new-grid .card")?.dataset.id,
    newIds:Array.from(document.querySelectorAll("#new-grid .card[data-id]")).map(el=>Number(el.dataset.id)),
    topIds:Array.from(document.querySelectorAll("#top-grid .card[data-id]")).map(el=>Number(el.dataset.id)),
    shimmed:typeof "".replaceAll==="function"&&typeof Object.fromEntries==="function"&&typeof queueMicrotask==="function",
    diagnostic:!!document.getElementById("qa-launch-check-panel")
  }));
  assert.equal(state.host,"cinedesi.online");
  assert.ok(state.class&&state.installed&&state.shimmed&&introPlayed,"Live origin should use approved UI, real standalone intro, and Safari 12 shims");
  assert.deepEqual(new Set(state.newIds),new Set([92001,92002]),"Only non-Watch movies in New & Trending");
  assert.ok(state.topIds.length&&state.topIds.every(id=>id===92003),"Other rails only Watch on CineDesi");
  assert.equal(state.diagnostic,false,"Private QA debug controls must stay out of production");
  await page.locator("#app-splash").waitFor({state:"detached",timeout:6000});
  await page.locator("#bottom-search").click();
  await page.waitForFunction(()=>document.querySelector(".catalog-header")?.classList.contains("search-mode"),null,{timeout:3500});
  await page.locator("#search-close").click();
  await page.locator("#new-releases [data-new-all]").click();
  await page.waitForFunction(()=>document.querySelector("#discover-title")?.textContent==="New & trending releases",null,{timeout:3500});
  const newAll=await page.locator("#grid .card[data-id]").evaluateAll(nodes=>nodes.map(el=>Number(el.dataset.id)));
  assert.deepEqual(new Set(newAll),new Set([92001,92002]));
  await page.locator("#series [data-hollywood-all]").click();
  await page.waitForFunction(()=>document.querySelector("#discover-title")?.textContent==="Hollywood",null,{timeout:3500});
  const hollywood=await page.locator("#grid .card[data-id]").evaluateAll(nodes=>nodes.map(el=>Number(el.dataset.id)));
  assert.deepEqual(new Set(hollywood),new Set([92003]));
  assert.deepEqual(errors,[],"First-party JavaScript must run with iOS 12 missing APIs");
  console.log("PASS production-domain legacy-feature iPhone 6-size smoke: approved UI, launch, search, categories, See All, old-Safari shims and no first-party JS errors");
  await ctx.close();
} finally {await browser.close();}
console.log("LIMITATION: Chromium UA emulation and safari12 build target are not a physical iPhone 6 running the original iOS 12 Safari/WebKit engine.");
