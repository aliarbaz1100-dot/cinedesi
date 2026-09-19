import assert from "node:assert/strict";
import { chromium } from "playwright";

// Isolated mock catalog: no writes to production Supabase and no changes
// to the real published movies, episodes, or embeds.
const base = "https://cinedesi-qa-launch-review-20260919.aliarbaz1100-93b.workers.dev";
const playable = (id, title, region, genre = "Action") => ({
  id, slug: "qa-fixture-" + id, title, region, genre, content_type: "movie",
  release_year: 2026, full_video_verified: true,
  full_video_embed_url: "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",
  watch_verified: true, watch_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  poster_url: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
  poster_source_url: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
  poster_license: "rights-holder promotional art"
});
const discovery = (id, title, release_year, note = "") => ({
  id, slug: "qa-fixture-" + id, title, region: "Bollywood", genre: "Action",
  content_type: "movie", release_year,
  full_video_verified: false, full_video_embed_url: null,
  watch_verified: true, watch_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  trailer_verified: true, trailer_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  availability_note: note,
  poster_url: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg"
});
const fixture = [
  discovery(99001, "QA Discovery Older Film", 2005),
  discovery(99002, "QA Discovery Latest Film", 2026),
  discovery(99003, "QA Discovery Upcoming Film", 2027, "Coming soon"),
  playable(99004, "QA Watch Bollywood", "Bollywood"),
  playable(99005, "QA Watch Hollywood", "Hollywood"),
  playable(99006, "QA Watch Cartoon", "Hollywood", "Animation"),
  { ...discovery(99007, "QA Discovery Series", 2026), content_type: "series", region: "Turkey" }
];
const unplayable = new Set([99001,99002,99003,99007]);
const playableIds = new Set([99004,99005,99006]);
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.route("**/rest/v1/**", async route => {
    const request = route.request();
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "apikey,authorization,content-type,accept-profile,content-profile",
      "content-type": "application/json"
    };
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers, body: "" });
      return;
    }
    const url = new URL(request.url());
    if (url.pathname.endsWith("/movies")) {
      const offset = Number(url.searchParams.get("offset") || 0);
      const limit = Number(url.searchParams.get("limit") || 1000);
      await route.fulfill({ status: 200, headers, body: JSON.stringify(fixture.slice(offset,offset+limit)) });
    } else {
      await route.fulfill({ status: 200, headers, body: "[]" });
    }
  });
  const page = await context.newPage();
  const response = await page.goto(base+"/?qa=1&source=pwa", {waitUntil:"domcontentloaded", timeout:30000});
  assert.equal(response?.status(),200);
  await page.waitForFunction(() => document.querySelector("#status")?.textContent?.includes("7 published titles"), null, {timeout:16000});
  await page.waitForFunction(() => document.querySelectorAll("#new-grid .card").length === 3, null, {timeout:6000});
  const ids = async selector => page.locator(selector+" .card[data-id]").evaluateAll(cards =>
    cards.map(card => Number(card.dataset.id))
  );
  const newIds = await ids("#new-grid");
  assert.deepEqual(new Set(newIds),new Set([99001,99002,99003]),"New & Trending must include every non-Watch movie, even older and upcoming movies");
  assert.ok(!newIds.some(id=>playableIds.has(id)), "New & Trending must exclude all Watch on CineDesi movies");
  const topIds = await ids("#top-grid");
  assert.ok(topIds.length>0 && topIds.every(id=>playableIds.has(id)), "Top category must show ONLY Watch on CineDesi");
  const hero = await page.locator("#hero-title").textContent();
  assert.ok(fixture.filter(m=>playableIds.has(m.id)).some(m=>m.title===hero),"Featured hero must be Watch on CineDesi");
  await page.locator("#discover").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector("#grid .card[data-id]"),null,{timeout:6000});
  const discoverIds = await ids("#grid");
  assert.deepEqual(new Set(discoverIds),playableIds,"All Titles / Discover must exclude non-Watch movies");
  await page.locator("#series").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector("#series-grid .card[data-id]"),null,{timeout:6000});
  assert.ok((await ids("#series-grid")).every(id=>playableIds.has(id)),"Hollywood category must exclude non-Watch movies");
  await page.locator("#new-releases [data-new-all]").click();
  await page.waitForFunction(() => document.querySelector("#discover-title")?.textContent==="New & trending releases",null,{timeout:5000});
  const newSeeAll = await ids("#grid");
  assert.deepEqual(new Set(newSeeAll),new Set([99001,99002,99003]),"New & Trending See All must contain all and ONLY non-Watch movies");
  await page.locator("#series [data-hollywood-all]").click();
  await page.waitForFunction(() => document.querySelector("#discover-title")?.textContent==="Hollywood",null,{timeout:5000});
  const hollywoodSeeAll = await ids("#grid");
  assert.ok(hollywoodSeeAll.length>0 && hollywoodSeeAll.every(id=>playableIds.has(id)),"Other category See All must only display Watch on CineDesi");
  console.log("PASS: New & Trending shows every non-Watch movie; its See All is exclusive; all other tested category rails, hero, Discover and See All show Watch on CineDesi only.");
  await context.close();
} finally {await browser.close();}
