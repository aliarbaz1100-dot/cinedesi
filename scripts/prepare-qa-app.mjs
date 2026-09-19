// QA-only mobile app installation preview; never run for the production build.
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const dir = "dist/";
let home = readFileSync(dir+"index.html","utf8");
const manifest = JSON.parse(readFileSync(dir+"manifest.webmanifest","utf8"));
assert.ok(home.includes('name="apple-mobile-web-app-title" content="CineDesi"'),"Expected original app identity");
assert.equal(manifest.short_name,"CineDesi","Expected original manifest");
assert.ok(home.includes('noindex,nofollow,noarchive'),"QA indexing guard must run first");
home = home.replace('name="apple-mobile-web-app-title" content="CineDesi"',
  'name="apple-mobile-web-app-title" content="CineDesi QA"');
home = home.replace('name="application-name" content="CineDesi"',
  'name="application-name" content="CineDesi QA"');
home = home.replace('href="/manifest.webmanifest?v=9"','href="/manifest.webmanifest?v=qa-mobile-1"');
writeFileSync(dir+"index.html",home);
manifest.id="/?cinedesi-qa-app=1";
manifest.name="CineDesi QA — Test Mobile App";
manifest.short_name="CineDesi QA";
manifest.start_url="/?source=pwa&qa=1";
writeFileSync(dir+"manifest.webmanifest",JSON.stringify(manifest,null,2));

const preview = String.raw<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="theme-color" content="#08090b"><title>CineDesi QA — Mobile App Preview</title>
<style>
*{box-sizing:border-box}html{background:#08090b;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
body{margin:0;padding:25px max(17px,env(safe-area-inset-left)) 45px;min-height:100dvh;background:radial-gradient(ellipse at 45% -25%,#262128,#08090b 57%);}
main{max-width:920px;margin:auto}.brand{display:flex;align-items:center;gap:12px}.brand img{width:53px;height:53px;border-radius:13px;object-fit:cover}
.brand strong{font-size:1.25rem;letter-spacing:-.04em}.qa-badge{font-size:.7rem;background:#3b2025;color:#ffb7bc;padding:5px 8px;border:1px solid #6c2831;border-radius:8px;margin-left:7px}
.lead{color:#b1b3bd;line-height:1.6;font-size:.96rem}h1{font-size:clamp(1.9rem,5vw,3rem);margin:22px 0 4px;letter-spacing:-.055em}h2{font-size:1.1rem;margin:0 0 10px;letter-spacing:-.02em}
.grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:30px;margin-top:27px}.panel{border:1px solid #ffffff1a;background:#121318;border-radius:18px;padding:20px}
.button{display:inline-flex;justify-content:center;align-items:center;min-height:48px;padding:12px 17px;border-radius:9px;background:#f4f4f6;color:#0b0b0d;text-decoration:none;font-weight:800;cursor:pointer;border:0;font:inherit}
.button.secondary{background:#25262c;color:#fff;border:1px solid #ffffff2a}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.guide{line-height:1.7;color:#d7d7de}.guide b{color:#fff}.guide li{margin:8px 0}
.device{position:relative;aspect-ratio:390/738;width:min(100%,350px);max-height:675px;overflow:hidden;background:#060606;border:7px solid #2b2b30;border-radius:37px;box-shadow:0 32px 90px #000a;margin:0 auto;isolation:isolate}
.device iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#050505}
.demo{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#050507;z-index:6;pointer-events:none;transition:opacity .28s ease}
.demo[hidden]{display:none}.mark{text-align:center;padding:8px}.wordmark{font-weight:950;letter-spacing:-.075em;font-size:clamp(2.15rem,10vw,3rem);white-space:nowrap;display:flex;justify-content:center}
.wordmark .cine{color:white;animation:slide-left .65s ease both}.wordmark .desi{color:#e50914;animation:slide-right .68s ease .08s both}
.line{width:34px;height:2px;background:#e50914;margin:17px auto 13px}.credit{font-size:.65rem;letter-spacing:.14em;color:#b3b3bb;text-transform:uppercase}.credit strong{color:#fff}
@keyframes slide-left{from{opacity:0;transform:translateX(-15px)}to{opacity:1;transform:none}}
@keyframes slide-right{from{opacity:0;transform:translateX(15px)}to{opacity:1;transform:none}}
.note{font-size:.8rem;color:#abaeb8;line-height:1.55}
a{color:inherit}footer{margin-top:24px;color:#8f919a;font-size:.78rem;text-align:center}
@media(max-width:730px){.grid{grid-template-columns:1fr;gap:19px}.panel{padding:16px}h1{margin-top:20px}.device{max-width:350px}.actions .button{flex:1 1 175px;text-align:center}}
@media(prefers-reduced-motion:reduce){.cine,.desi{animation:none!important}.demo{transition:none!important}}
</style>
</head>
<body><main>
<div class="brand"><img src="/cinedesi-apple-touch.png?v=3" alt="Actual CineDesi app icon">
<div><strong>CineDesi</strong><span class="qa-badge">TEST APP</span><div class="note">Powered by Arbaz Ali</div></div></div>
<h1>See your mobile app</h1>
<p class="lead">This is the current CineDesi QA app, not a redesign mockup. The live home screen below loads the real test website. The opening animation is a visual preview of the installed-app launch.</p>
<div class="actions"><a class="button" href="/?app-install=1">Open app to install ↗</a><button class="button secondary" type="button" id="replay">Replay opening animation</button></div>
<div class="grid">
<section class="panel"><h2>App opening &amp; home screen</h2>
<div class="device"><iframe title="Live CineDesi QA home screen" src="/?app-visual-preview=1" loading="eager"></iframe>
<div class="demo" id="demo"><div class="mark"><div class="wordmark"><span class="cine">CINE</span><span class="desi">DESI</span></div><div class="line"></div><div class="credit">Powered by <strong>Arbaz Ali</strong></div></div></div></div>
<p class="note">Actual home-screen icon is shown above. The installed QA app is named <b>CineDesi QA</b>, so it remains distinguishable from your existing CineDesi app.</p></section>
<section class="panel"><h2>Put the test app on your Home Screen</h2>
<ol class="guide">
<li><b>On iPhone:</b> tap “Open app to install”, open that link in <b>Safari</b>, tap Safari’s <b>Share</b> icon, then <b>Add to Home Screen</b>. Enable “Open as Web App” if offered; tap Add.</li>
<li><b>On Android:</b> open the same link in <b>Chrome</b>, tap the browser menu, then <b>Install app</b> or <b>Add to Home screen</b>.</li>
<li>Open the new <b>CineDesi QA</b> icon: you’ll see the branded launch followed by the real movie catalog. Open any working movie to test its player, and use the bottom navigation to browse.</li>
</ol>
<p class="note">QA uses its own secure website origin. It will not replace or update an existing CineDesi app installed from cinedesi.online. Real device PiP and playback remain subject to publisher and operating-system support.</p>
<a class="button secondary" href="/?app-install=1">Open real app →</a></section>
</div>
<footer>QA preview • Live catalog and movie sources are unchanged • Production app is unaffected</footer>
</main>
<script>
const demo=document.querySelector("#demo");
const play=()=>{demo.hidden=false;const nodes=[...demo.querySelectorAll(".cine,.desi")];nodes.forEach(n=>{n.style.animation="none";void n.offsetWidth;n.style.animation="";});setTimeout(()=>{demo.hidden=true;},1650);};
document.querySelector("#replay").addEventListener("click",play);
setTimeout(()=>{demo.hidden=true;},1650);
</script>
</body></html>;
writeFileSync(dir+"app-preview.html",preview);
console.log("PASS: QA-only install identity, manifest, preview page and distinct home-screen label");
