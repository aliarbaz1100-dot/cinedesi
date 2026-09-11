import "./styles.css";
const launchSplash = document.querySelector("#app-splash");
if (launchSplash && (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true)) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => {
    launchSplash.classList.add("splash-exit");
    setTimeout(() => launchSplash.remove(), reduceMotion ? 0 : 420);
  }, 2600)));
} else launchSplash?.remove();
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js?v=8").catch(() => {
}));
let deferredInstall = null;
const installBar = document.querySelector("#install-banner"), installButton = document.querySelector("#install-app"), installClose = document.querySelector("#install-close"), installCopy = document.querySelector("#install-copy");
const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const installDismissedAt = Number(localStorage.getItem("cinedesi-install-dismissed") || 0);
const installDismissed = installDismissedAt > Date.now() - 7 * 24 * 60 * 60 * 1000;
const showInstall = () => {
  if (installBar && !isStandalone && !installDismissed) installBar.hidden = false;
};
const hideInstall = (remember = false) => {
  if (installBar) installBar.hidden = true;
  if (remember) localStorage.setItem("cinedesi-install-dismissed", String(Date.now()));
};
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstall = event;
  showInstall();
});
window.addEventListener("appinstalled", () => {
  localStorage.setItem("cinedesi-installed", "1");
  hideInstall();
});
installButton?.addEventListener("click", async () => {
  if (deferredInstall) {
    deferredInstall.prompt();
    const choice = await deferredInstall.userChoice;
    deferredInstall = null;
    if (choice.outcome === "accepted") hideInstall();
    return;
  }
  if (isIOS && installCopy) {
    installCopy.textContent = "Safari: tap Share, then Add to Home Screen.";
    installButton.textContent = "Got it";
    installButton.onclick = () => hideInstall(true);
  }
});
installClose?.addEventListener("click", () => hideInstall(true));
if (isIOS && !isStandalone && !installDismissed) setTimeout(showInstall, 1400);
const URL = "https://ewtgkjcmnwjoqfldrtuw.supabase.co";
const KEY = "sb_publishable_ZEAZWO-Q-_rvMsy6krr_nw_JDRmP_kI";
const sdk = document.createElement("script");
sdk.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.115.0/dist/umd/supabase.min.js";
sdk.onload = () => init();
document.head.appendChild(sdk);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const xml = (s) => String(s ?? "").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const posterArt = (m) => {
  const t = String(m.title || "CineDesi"), g = String(m.genre || "Cinema"), r = String(m.region || "Global"), y = String(m.release_year || "");
  let h = 2166136261;
  for (const c of t + r) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const accents = ["#6f1822", "#17304f", "#3a1f38", "#20352f"], a = accents[h % accents.length], short = t.length > 34 ? t.slice(0, 32) + "\u2026" : t;
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'><defs><linearGradient id='bg' x2='1' y2='1'><stop stop-color='#050608'/><stop offset='.55' stop-color='" + a + "'/><stop offset='1' stop-color='#030405'/></linearGradient><linearGradient id='fade' x2='0' y2='1'><stop stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.94'/></linearGradient><filter id='grain'><feTurbulence baseFrequency='.75' numOctaves='3' seed='" + h % 97 + "'/><feColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 .07 0'/></filter></defs><rect width='1200' height='675' fill='url(#bg)'/><path d='M0 485 C260 390 470 530 720 410 S1030 320 1200 380 V675 H0Z' fill='#050608' opacity='.72'/><rect width='1200' height='675' filter='url(#grain)' opacity='.42'/><rect y='260' width='1200' height='415' fill='url(#fade)'/><line x1='58' y1='74' x2='160' y2='74' stroke='#e50914' stroke-width='7'/><text x='58' y='118' fill='#d9d9db' font-family='Arial,sans-serif' font-size='18' font-weight='700' letter-spacing='5'>CINEDESI</text><text x='58' y='500' fill='white' font-family='Arial,sans-serif' font-size='64' font-weight='900' letter-spacing='-2'>" + xml(short) + "</text><text x='60' y='548' fill='#c0c1c5' font-family='Arial,sans-serif' font-size='21' font-weight='700' letter-spacing='2'>" + xml(r.toUpperCase()) + " \xB7 " + xml(g.toUpperCase()) + "</text><text x='60' y='610' fill='#999ca3' font-family='Arial,sans-serif' font-size='19' letter-spacing='3'>" + xml(y || "CINEMA") + "</text></svg>";
  return `data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, "%27")}`;
};
const videoThumb = (m) => {
  if (m.slug === "tamasha-season-5") return "https://i.ytimg.com/vi/QhmbXMnsfl4/hqdefault.jpg";
  const urls = [];
  if (m.full_video_verified) urls.push(m.full_video_url, m.full_video_embed_url);
  if (m.trailer_verified) urls.push(m.trailer_url);
  for (const value of urls.filter(Boolean)) {
    const match = String(value).match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/))([\w-]{11})/i);
    if (match) return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return "";
};
const licensedPoster = (m) => Boolean(m.poster_source_url && m.poster_license && !/cinedesi original|generated cover/i.test(String(m.poster_license)));
function init() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("pageshow", () => {
    if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  });
  const db = supabase.createClient(URL, KEY);
  const track = async (event, slug = null) => {
    const { error } = await db.rpc("track_cinedesi_event", { p_event_type: event, p_movie_slug: slug });
    if (error) console.warn("CineDesi analytics event failed", error.message);
  };
  void track("page_view");
  let movies = [];
  let visibleLimit = 30;
  let activeCollection = "all";
  let activeCollectionValue = "";
  let saved = JSON.parse(localStorage.getItem("cinedesi-watchlist") || "[]");
  const q = (s) => document.querySelector(s);
  const search = q("#search"), suggestions = q("#search-suggestions"), searchClose = q("#search-close"), menuToggle = q("#menu-toggle"), catalogHeader = q(".catalog-header"), quickBrowse = q("#quick-browse"), region = q("#region"), availability = q("#availability"), sort = q("#sort"), grid = q("#grid"), loadMore = q("#load-more"), heroShowcase = q("#hero-showcase"), heroTitle = q("#hero-title"), heroMeta = q("#hero-meta"), heroLead = q("#hero-lead"), heroPlay = q("#hero-play"), heroInfo = q("#hero-info"), heroList = q("#hero-list"), topGrid = q("#top-grid"), newGrid = q("#new-grid"), continueGrid = q("#continue-grid"), recentGrid = q("#recent-grid"), becauseGrid = q("#because-grid"), verifiedGrid = q("#verified-grid"), watchNowGrid = q("#watch-now-grid"), watchGrid = q("#watch-grid"), pakistanGrid = q("#pakistan-grid"), bollywoodGrid = q("#bollywood-grid"), southGrid = q("#south-grid"), seriesGrid = q("#series-grid"), contentType = q("#content-type"), discoverTitle = q("#discover-title"), genreRails = q("#genre-rails"), genreChips = q("#genre-chips"), status = q("#status"), modal = q("#modal"), count = q("#watch-count"), newsletter = q("#newsletter-form"), newsletterMsg = q("#newsletter-msg"), statPublished = q("#stat-published"), statTrailers = q("#stat-trailers"), statWatch = q("#stat-watch"), statRegions = q("#stat-regions");
  function persist() {
    localStorage.setItem("cinedesi-watchlist", JSON.stringify(saved));
    renderWatchlist();
    render();
    count.textContent = String(saved.length);
  }
  function toggle(id) {
    const adding = !saved.includes(id);
    saved = adding ? [...saved, id] : saved.filter((x) => x !== id);
    if (adding) {
      const movie = movies.find((x) => x.id === id);
      track("watchlist_add", movie?.slug || null);
    }
    persist();
  }
  function updateSchema() {
    const node = document.querySelector("#catalog-schema");
    if (!node) return;
    node.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", numberOfItems: movies.length, itemListElement: movies.slice(0, 100).map((m, i) => ({ "@type": "ListItem", position: i + 1, url: `https://cinedesi.online/movie?slug=${encodeURIComponent(m.slug)}`, name: m.title })) });
  }
  async function load() {
    const selectColumns = "id,slug,title,region,genre,release_year,score,trailer_url,trailer_source,trailer_verified,watch_url,watch_verified,full_video_url,full_video_embed_url,full_video_verified,full_video_source,full_video_label,full_video_language,content_type,season_count,episode_count,original_language,availability_note,cast_names,poster_url,poster_source_url,poster_license,poster_attribution,rights_status,rights_checked_at,source_name,source_url,source_license,created_at,updated_at";
    let data = [];
    let error = null;
    for (let start = 0; ; start += 1e3) {
      const batch = await db.from("movies").select(selectColumns).eq("status", "published").order("rights_checked_at", { ascending: false }).range(start, start + 999);
      if (batch.error) {
        error = batch.error;
        break;
      }
      const rows = batch.data || [];
      data.push(...rows);
      if (rows.length < 1e3) break;
    }
    movies = (data || []).map((m) => {
      const thumb = videoThumb(m);
      return { ...m, _trend_score: 0, _cover_kind: m.poster_url ? "poster" : thumb ? "youtube" : "original", poster_url: m.poster_url || thumb || posterArt(m) };
    });
    const { data: trendingRows } = await db.rpc("get_cinedesi_trending", { p_days: 7, p_limit: 100 });
    const trendMap = new Map((trendingRows || []).map((row) => [row.movie_slug, Number(row.trend_score) || 0]));
    movies = movies.map((m) => ({ ...m, _trend_score: trendMap.get(m.slug) || 0 }));
    status.textContent = error ? "Catalog temporarily unavailable" : `${movies.length} published titles \u2022 live Supabase catalog`;
    statPublished.textContent = String(movies.length);
    statTrailers.textContent = String(movies.filter((m) => m.trailer_verified && m.trailer_url).length);
    statWatch.textContent = String(movies.filter((m) => m.watch_verified && m.watch_url).length);
    statRegions.textContent = String(new Set(movies.map((m) => m.region).filter(Boolean)).size);
    updateSchema();
    render();
    renderPersonalized();
    renderTop();
    renderNew();
    renderWatchNow();
    renderVerified();
    renderSeries();
    renderGenres();
    renderRegions();
    renderHero();
    renderWatchlist();
    count.textContent = String(saved.length);
  }
  function card(m) {
    const image = m.poster_url ? `<img src='${esc(m.poster_url)}' alt='${esc(m.title)} cover' loading='lazy' decoding='async'>` : "";
    const availabilityBadge = m.full_video_verified && m.full_video_embed_url ? "<span class='badge watch-now'>Watch here</span>" : m.watch_verified && m.watch_url ? "<span class='badge'>Legal watch</span>" : m.trailer_verified ? "<span class='badge'>Official trailer</span>" : "<span class='badge'>Editorial</span>";
    return `<article class='card' data-id='${m.id}'><a class='poster-link' href='/movie?slug=${encodeURIComponent(m.slug)}' aria-label='Open ${esc(m.title)}'><div class='poster'>${image}<span class='poster-region'>${esc(m.region)}</span>${m.full_video_verified && m.full_video_embed_url ? "<span class='poster-ribbon'>\u25B6 Watch here</span>" : Number(m.release_year) >= 2025 ? "<span class='poster-ribbon new'>New</span>" : ""}</div></a><div class='info'><div class='card-title-row'><h3>${esc(m.title)}</h3>${m.score ? `<strong class='match-score'>${esc(m.score)}%</strong>` : ""}</div><p class='muted'>${esc(m.content_type === "series" ? "Series" : m.genre || "Film")} \u2022 ${esc(m.release_year || "")}${m.original_language ? ` \u2022 ${esc(m.original_language)}` : ""}</p><div class='badges'>${availabilityBadge}${m.rights_status === "official_link" || m.rights_status === "cleared" ? "<span class='badge verified-badge'>\u2713 Source checked</span>" : ""}</div><div class='card-actions streaming-actions'><a class='btn play-mini' href='/movie?slug=${encodeURIComponent(m.slug)}'>\u25B6 Details</a><button class='circle-action' data-save='${m.id}' aria-label='${saved.includes(m.id) ? "Remove from My List" : "Add to My List"}'>${saved.includes(m.id) ? "\u2713" : "\uFF0B"}</button><button class='circle-action info-action' data-open='${m.id}' aria-label='More information'>i</button></div></div></article>`;
  }
  function wire(root) {
    root.querySelectorAll("[data-open]").forEach((el) => el.onclick = (e) => {
      e.stopPropagation();
      openMovie(Number(el.dataset.open));
    });
    root.querySelectorAll("[data-save]").forEach((el) => el.onclick = (e) => {
      e.stopPropagation();
      toggle(Number(el.dataset.save));
    });
  }
  function fillRail(root, name) {
    const all = movies.filter((m) => m.region === name);
    const list = all.slice(0, 8);
    root.innerHTML = list.length ? list.map((m) => card(m)).join("") + (all.length > 8 ? `<a class='see-all-card' href='#discover' data-region-see='${esc(name)}'><span>See all</span><strong>\u2192</strong></a>` : "") : `<div class='empty'>No ${esc(name)} title is published yet.</div>`;
    wire(root);
    root.querySelectorAll("[data-region-see]").forEach((el) => el.onclick = () => showCollection("region", name));
  }
  function showCollection(kind, value = "") {
    activeCollection = kind;
    activeCollectionValue = value;
    search.value = "";
    region.value = "All";
    availability.value = "all";
    contentType.value = "all";
    sort.value = "verified";
    visibleLimit = 30;
    let label = "All titles";
    if (kind === "watch") {
      availability.value = "cinedesi";
      label = "All Watch on CineDesi";
    } else if (kind === "series") {
      contentType.value = "series";
      label = "All series & seasons";
    } else if (kind === "genre") {
      label = `All ${value}`;
    } else if (kind === "region") {
      region.value = value;
      label = `All ${value} titles`;
    } else if (kind === "verified") {
      label = "All verified picks";
    } else if (kind === "top") {
      label = "Top titles on CineDesi";
    } else if (kind === "new") {
      sort.value = "newest";
      label = "New & trending releases";
    }
    discoverTitle.textContent = label;
    render();
    q("#discover").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function renderSeries() {
    const all = movies.filter((m) => m.content_type === "series").sort((a, b) => (Number(b.release_year) || 0) - (Number(a.release_year) || 0) || (Number(b.score) || 0) - (Number(a.score) || 0)), list = all.slice(0, 8);
    seriesGrid.innerHTML = list.length ? list.map((m) => card(m)).join("") + (all.length > 8 ? `<a class='see-all-card' href='#discover' data-series-see='true'><span>See all series</span><strong>\u2192</strong></a>` : "") : `<div class='empty'>Verified series are being prepared.</div>`;
    wire(seriesGrid);
    document.querySelectorAll("[data-series-see],[data-series-all]").forEach((el) => el.onclick = () => showCollection("series"));
  }
  function renderRegions() {
    fillRail(pakistanGrid, "Pakistan");
    fillRail(bollywoodGrid, "Bollywood");
    const all = movies.filter((m) => ["South", "South Indian", "India / South Indian"].includes(String(m.region))), list = all.slice(0, 8);
    southGrid.innerHTML = list.length ? list.map((m) => card(m)).join("") + (all.length > 8 ? `<a class='see-all-card' href='#discover' data-region-see='South'><span>See all</span><strong>\u2192</strong></a>` : "") : `<div class='empty'>No South Indian title is published yet.</div>`;
    wire(southGrid);
    southGrid.querySelectorAll("[data-region-see]").forEach((el) => el.onclick = () => showCollection("region", "South"));
  }
  function genreMatch(m, g) {
    const x = String(m.genre || "").toLowerCase();
    if (g === "Action") return /\baction\b/.test(x);
    if (g === "Comedy") return /comedy/.test(x);
    if (g === "Horror") return /horror/.test(x);
    if (g === "Drama") return /\bdrama\b/.test(x);
    if (g === "Romance") return /romance/.test(x);
    if (g === "Thriller") return /thriller/.test(x);
    if (g === "Cartoons") return /animation|animated|cartoon|anime|kids/.test(x);
    return false;
  }
  function renderGenres() {
    const gs = ["Action", "Comedy", "Horror", "Drama", "Romance", "Thriller", "Cartoons"];
    genreChips.innerHTML = gs.map((g) => `<button class='genre-chip' data-genre='${g}'>${g}</button>`).join("");
    genreRails.innerHTML = gs.map((g) => {
      const all = movies.filter((m) => genreMatch(m, g)), list = all.slice(0, 8);
      if (!list.length) return "";
      return `<div class='rail-block genre-block' id='genre-${g.toLowerCase()}'><div class='rail-heading'><h3>${g}</h3><button type='button' data-genre-see='${g}'>See all \u2192</button></div><div class='grid rail genre-rail'>${list.map((m) => card(m)).join("")}</div></div>`;
    }).join("");
    wire(genreRails);
    genreChips.querySelectorAll("[data-genre]").forEach((el) => el.onclick = () => document.querySelector(`#genre-${String(el.dataset.genre).toLowerCase()}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    genreRails.querySelectorAll("[data-genre-see]").forEach((el) => el.onclick = () => showCollection("genre", String(el.dataset.genreSee || "")));
  }
  function renderWatchNow() {
    const all = movies.filter((m) => m.full_video_verified && m.full_video_embed_url), pakistani = all.filter((m) => m.region === "Pakistan"), others = all.filter((m) => m.region !== "Pakistan"), list = [...pakistani, ...others].slice(0, 12);
    watchNowGrid.innerHTML = list.length ? list.map((m) => card(m)).join("") + (all.length > 12 ? `<a class='see-all-card' href='#discover' data-watch-see='true'><span>See all ${all.length}</span><strong>\u2192</strong></a>` : "") : `<div class='empty'>Official full titles are being verified.</div>`;
    wire(watchNowGrid);
    document.querySelectorAll("[data-watch-see],[data-watch-all]").forEach((el) => el.onclick = () => showCollection("watch"));
  }
  function renderVerified() {
    const all = movies.filter((m) => (m.rights_status === "official_link" || m.rights_status === "cleared") && m.source_name && m.source_url && m.source_license);
    const list = all.slice(0, 8);
    verifiedGrid.innerHTML = list.length ? list.map((m) => card(m)).join("") + (all.length > 8 ? `<a class='see-all-card' href='#discover'><span>See all verified</span><strong>\u2192</strong></a>` : "") : `<div class='empty'>Verified picks are being prepared.</div>`;
    wire(verifiedGrid);
    document.querySelectorAll("[data-verified-all]").forEach((el) => el.onclick = () => showCollection("verified"));
  }
  function renderPersonalized() {
    const continueSection = q("#continue-watching");
    const recentSection = q("#recently-viewed");
    const becauseSection = q("#because-you-watched");

    let recentItems = [];
    let continueItems = [];
    try {
      recentItems = JSON.parse(localStorage.getItem("cinedesi_recent") || "[]");
      continueItems = JSON.parse(localStorage.getItem("cinedesi_continue") || "[]");
    } catch {}

    const bySlug = new Map(movies.map((m) => [m.slug, m]));
    const recentMovies = recentItems.map((x) => bySlug.get(x.slug)).filter(Boolean).slice(0, 12);
    const continueMovies = continueItems.map((x) => bySlug.get(x.slug)).filter((m) => m && m.full_video_verified && m.full_video_embed_url).slice(0, 12);

    if (continueGrid && continueSection) {
      continueSection.hidden = continueMovies.length === 0;
      continueGrid.innerHTML = continueMovies.map((m) => card(m)).join("");
      wire(continueGrid);
    }

    if (recentGrid && recentSection) {
      recentSection.hidden = recentMovies.length === 0;
      recentGrid.innerHTML = recentMovies.map((m) => card(m)).join("");
      wire(recentGrid);
    }

    if (becauseGrid && becauseSection) {
      const seed = recentMovies[0];
      if (!seed) {
        becauseSection.hidden = true;
      } else {
        const seedGenre = String(seed.genre || "").split(/[ ,/]/)[0];
        const recommendations = movies
          .filter((m) => m.id !== seed.id && !recentMovies.some((x) => x.id === m.id) && (m.region === seed.region || genreMatch(m, seedGenre)))
          .sort((a,b) => (Number(b._trend_score)||0) - (Number(a._trend_score)||0) || (Number(b.score)||0) - (Number(a.score)||0))
          .slice(0, 12);
        becauseSection.hidden = recommendations.length === 0;
        const title = q("#because-title");
        if (title) title.textContent = `Because you watched ${seed.title}`;
        becauseGrid.innerHTML = recommendations.map((m) => card(m)).join("");
        wire(becauseGrid);
      }
    }
  }

  function renderNew() {
    if (!newGrid) return;
    const currentYear = new Date().getFullYear();
    const all = [...movies]
      .filter((m) => Number(m.release_year) >= currentYear - 1)
      .sort((a, b) => (Number(b.release_year) || 0) - (Number(a.release_year) || 0) || String(b.created_at || "").localeCompare(String(a.created_at || "")) || (Number(b.score) || 0) - (Number(a.score) || 0));
    const list = all.slice(0, 12);
    newGrid.innerHTML = list.length ? list.map((m) => card(m)).join("") + (all.length > 12 ? `<a class='see-all-card' href='#discover' data-new-see='true'><span>See all new releases</span><strong>→</strong></a>` : "") : `<div class='empty'>New releases are being prepared.</div>`;
    wire(newGrid);
    document.querySelectorAll("[data-new-see],[data-new-all]").forEach((el) => el.onclick = () => showCollection("new"));
  }
  function renderTop() {
    const list = [...movies].sort((a, b) => (Number(b._trend_score) || 0) - (Number(a._trend_score) || 0) || (Number(b.score) || 0) - (Number(a.score) || 0) || (Number(b.release_year) || 0) - (Number(a.release_year) || 0)).slice(0, 10);
    topGrid.innerHTML = list.map((m, i) => card(m).replace("class='card'", `class='card top-card' data-rank='${i + 1}'`)).join("");
    wire(topGrid);
    document.querySelectorAll("[data-top-all]").forEach((el) => el.onclick = () => showCollection("top"));
  }
  function renderHero() {
    const preferred = [
      "drishyam-the-conclusion-2026",
      "lust-stories-3-2026",
      "the-gentlemen-series",
      "stranger-things-tales-from-85",
      "stranger-things-series",
      "the-umbrella-academy-series",
      "lockwood-and-co-series",
      "dhamaal-4-2026",
      "dhoom-dhaam-2025",
      "wednesday-series-2022",
      "one-piece-live-action-japan-cinedesi"
    ];
    const heroPool = preferred.map((slug) => movies.find((x) => x.slug === slug)).filter((m) => m && m.poster_url && (licensedPoster(m) || m._cover_kind === "youtube"));
    if (!heroPool.length) {
      heroPool.push(...movies.filter((m) => m.poster_url && (licensedPoster(m) || m._cover_kind === "youtube")).sort((a,b) => (Number(b.release_year)||0)-(Number(a.release_year)||0)).slice(0,8));
    }
    if (!heroPool.length) return;
    let heroIndex = 0;
    const paintHero = () => {
      const m = heroPool[heroIndex % heroPool.length];
      const url = `/movie?slug=${encodeURIComponent(m.slug)}`;
      heroTitle.textContent = m.title;
      heroMeta.textContent = `${m.release_year || "Featured"} • ${m.content_type === "series" ? (m.season_count ? `${m.season_count} Season${Number(m.season_count) === 1 ? "" : "s"}` : "Series") : (m.genre || "Movie")}${m.original_language ? ` • ${m.original_language}` : ""}`;
      heroLead.textContent = String(m.synopsis || m.editorial || "Open this verified CineDesi title for official trailers and legal viewing information.").slice(0, 190);
      heroPlay.href = url + (m.full_video_verified ? "#watch" : "");
      heroPlay.textContent = m.full_video_verified ? "▶ Play" : m.trailer_verified ? "▶ Trailer" : "▶ Details";
      heroInfo.href = url;
      heroList.textContent = saved.includes(m.id) ? "✓ In My List" : "＋ My List";
      heroList.onclick = () => {
        toggle(m.id);
        heroList.textContent = saved.includes(m.id) ? "✓ In My List" : "＋ My List";
      };
      const badge = m.full_video_verified ? "WATCH ON CINEDESI" : m.watch_verified ? "LEGAL WATCH VERIFIED" : "OFFICIAL TRAILER";
      const eyebrow = q("#hero-eyebrow");
      if (eyebrow) eyebrow.textContent = `TRENDING NOW • ${badge}`;
      const shown = Math.min(heroPool.length, 7);
      heroShowcase.innerHTML = `<a class='hero-feature hero-feature-live' href='${url}' style="background-image:url('${esc(m.poster_url)}')" aria-label='Open ${esc(m.title)}'></a><div class='hero-dots' aria-label='Featured titles'>${heroPool.slice(0,shown).map((_,i)=>`<button type='button' class='${i === heroIndex % shown ? "active" : ""}' data-hero-dot='${i}' aria-label='Featured title ${i+1}'></button>`).join("")}</div>`;
      heroShowcase.querySelectorAll("[data-hero-dot]").forEach((el) => el.onclick = (e) => {
        e.preventDefault();
        heroIndex = Number(el.dataset.heroDot || 0);
        paintHero();
      });
    };
    paintHero();
    if (heroPool.length > 1) {
      window.clearInterval(window.__cinedesiHeroTimer);
      window.__cinedesiHeroTimer = window.setInterval(() => {
        heroIndex = (heroIndex + 1) % Math.min(heroPool.length, 7);
        paintHero();
      }, 7000);
    }
  }
  function searchText(m) {
    return `${m.title || ""} ${m.genre || ""} ${m.region || ""} ${m.content_type || ""} ${m.original_language || ""} ${m.cast_names || ""} ${m.release_year || ""} ${m.synopsis || ""} ${m.editorial || ""} ${m.source_name || ""} ${m.attribution_text || ""}`.toLowerCase();
  }
  function rankMatch(m, term) {
    const title = String(m.title || "").toLowerCase();
    if (title === term) return 0;
    if (title.startsWith(term)) return 1;
    if (title.split(/\s+/).some((w) => w.startsWith(term))) return 2;
    if (title.includes(term)) return 3;
    return 4;
  }
  function renderSuggestions() {
    const term = search.value.trim().toLowerCase();
    if (!term) {
      suggestions.innerHTML = "";
      suggestions.classList.remove("on");
      return;
    }
    const matched = movies.filter((m) => searchText(m).includes(term)).sort((a, b) => rankMatch(a, term) - rankMatch(b, term) || String(a.title).localeCompare(String(b.title))), exact = matched.slice(0, 8), seed = exact[0], related = movies.filter((m) => !exact.some((x) => x.id === m.id) && (seed ? m.region === seed.region || genreMatch(m, String(seed.genre || "").split(/[ ,/]/)[0]) : true)).slice(0, 8);
    const resultCard = (m) => `<a class='search-result-card' role='option' href='/movie?slug=${encodeURIComponent(m.slug)}'><div class='search-thumb' ${m.poster_url ? `style="background-image:url('${esc(m.poster_url)}')"` : ""}></div><div><strong>${esc(m.title)}</strong><span>${esc(m.region || "")} ${m.release_year ? `\u2022 ${esc(m.release_year)}` : ""}${m.genre ? ` \u2022 ${esc(m.genre)}` : ""}</span>${m.full_video_verified ? `<em>\u25B6 Watch here</em>` : ""}</div></a>`;
    suggestions.innerHTML = `<div class='search-panel-head'><strong>${exact.length ? "Search results" : "No exact result"}</strong><span>${matched.length} found</span></div>${exact.length ? `<div class='search-result-grid'>${exact.map(resultCard).join("")}</div>` : `<div class='suggestion-empty'>Try another title, genre or region.</div>`}${matched.length ? `<button id='search-all' class='search-see-all' type='button'>See all ${matched.length} results \u2192</button>` : ""}<div class='search-panel-head more'><strong>You may also like</strong></div><div class='search-related-rail'>${related.map(resultCard).join("")}</div>`;
    q("#search-all")?.addEventListener("click", () => {
      suggestions.classList.remove("on");
      q("#discover").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    suggestions.classList.add("on");
  }
  function render() {
    const term = search.value.trim().toLowerCase(), r = region.value, a = availability.value, s = sort.value, t = contentType.value;
    const south = (v) => ["South", "South Indian", "India / South Indian"].includes(String(v));
    const list = movies.filter((m) => (activeCollection !== "new" || Number(m.release_year) >= new Date().getFullYear() - 1) && (activeCollection !== "verified" || (m.rights_status === "official_link" || m.rights_status === "cleared")) && (activeCollection !== "genre" || genreMatch(m, activeCollectionValue)) && (t === "all" || m.content_type === t) && (r === "All" || m.region === r || r === "South" && south(m.region)) && (a === "all" || a === "watch" && m.watch_verified && m.watch_url || a === "trailer" && m.trailer_verified && m.trailer_url || a === "cinedesi" && m.full_video_verified && m.full_video_embed_url) && searchText(m).includes(term)).sort((x, y) => activeCollection === "top" ? (Number(y.score) || 0) - (Number(x.score) || 0) || (Number(y.release_year) || 0) - (Number(x.release_year) || 0) : s === "title" ? String(x.title).localeCompare(String(y.title)) : s === "newest" ? (Number(y.release_year) || 0) - (Number(x.release_year) || 0) : 0), shown = list.slice(0, visibleLimit);
    grid.innerHTML = shown.length ? shown.map((m) => card(m)).join("") : `<div class='empty'>No published titles match these filters yet.</div>`;
    status.textContent = list.length ? `Showing ${shown.length} of ${list.length} matching titles` : "No matching published titles";
    loadMore.hidden = shown.length >= list.length;
    wire(grid);
  }
  function renderWatchlist() {
    const list = movies.filter((m) => saved.includes(m.id));
    watchGrid.innerHTML = list.length ? list.map((m) => card(m)).join("") : `<div class='empty'>Your watchlist is empty. Save a movie from Discover and it will stay here on this device.</div>`;
    wire(watchGrid);
  }
  function openMovie(id) {
    const m = movies.find((x) => x.id === id);
    if (!m) return;
    const trailer = m.trailer_verified && m.trailer_url ? `<a class='btn' target='_blank' rel='noopener' href='${esc(m.trailer_url)}'>Watch official trailer</a>` : `<a class='btn secondary' href='/movie?slug=${encodeURIComponent(m.slug)}'>Discover title</a>`;
    const watch = m.watch_verified && m.watch_url ? `<a class='btn secondary' target='_blank' rel='noopener' href='${esc(m.watch_url)}'>Open legal watch destination</a>` : ``;
    modal.innerHTML = `<div class='box'><div class='modal-top'><div><small>${esc(m.region)}</small><h2>${esc(m.title)}</h2></div><button class='close' id='close-modal'>\xD7</button></div><div class='modal-meta'><span>${esc(m.genre || "Film")}</span><span>${esc(m.release_year || "")}</span>${m.score ? `<span>CineDesi score ${esc(m.score)}</span>` : ""}</div><div class='badges'>${m.editorial ? "<span class='badge'>CineDesi editorial</span>" : ""}<span class='badge'>Rights checked</span>${m.trailer_verified ? "<span class='badge'>Official trailer</span>" : ""}${m.watch_verified ? "<span class='badge'>Legal watch</span>" : ""}</div><p class='modal-summary'>${esc(m.editorial || m.synopsis || "CineDesi editorial coming soon.")}</p><div class='actions'>${trailer}${watch}${m.full_video_verified && m.full_video_embed_url ? `<a class='btn' href='/movie?slug=${encodeURIComponent(m.slug)}#watch'>Watch on CineDesi</a>` : ""}<a class='btn secondary' href='/movie?slug=${encodeURIComponent(m.slug)}'>Open full movie page</a><button class='ghost' id='modal-save'>${saved.includes(id) ? "Remove from watchlist" : "Save to watchlist"}</button></div><div class='source-card'><strong>Source transparency</strong><br>Metadata: ${esc(m.source_name || "Verified source")}${m.source_license ? ` \u2022 ${esc(m.source_license)}` : ""}${m.trailer_source ? `<br>Trailer source: ${esc(m.trailer_source)}` : ""}<br>Poster: ${licensedPoster(m) ? esc(m.poster_license) : m._cover_kind === "youtube" ? `Official video thumbnail supplied by ${esc(m.full_video_source || m.trailer_source || "YouTube")}; linked to the verified upload.` : "CineDesi dark original fallback; no third-party poster reused."}</div></div>`;
    modal.classList.add("on");
    modal.setAttribute("aria-hidden", "false");
    q("#close-modal").addEventListener("click", closeModal);
    q("#modal-save").addEventListener("click", () => {
      toggle(id);
      openMovie(id);
    });
  }
  function closeModal() {
    modal.classList.remove("on");
    modal.setAttribute("aria-hidden", "true");
  }
  search.oninput = () => {
    activeCollection = "all";
    activeCollectionValue = "";
    discoverTitle.textContent = "Search results";
    visibleLimit = 30;
    render();
    renderSuggestions();
  };
  search.onfocus = renderSuggestions;
  search.onkeydown = (e) => {
    if (e.key === "Enter") {
      suggestions.classList.remove("on");
      q("#discover").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-shell")) suggestions.classList.remove("on");
  });
  menuToggle.onclick = () => {
    const open = catalogHeader.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(open));
  };
  catalogHeader.querySelectorAll("nav a").forEach((a) => a.addEventListener("click", () => {
    catalogHeader.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));
  quickBrowse.querySelectorAll("[data-quick]").forEach((el) => el.onclick = () => {
    const key = String(el.dataset.quick || "");
    if (["Action", "Comedy", "Horror", "Romance", "Thriller", "Cartoons"].includes(key)) {
      showCollection("genre", key);
      return;
    }
    activeCollection = "all";
    activeCollectionValue = "";
    search.value = "";
    region.value = "All";
    availability.value = key === "watch" ? "cinedesi" : "all";
    sort.value = key === "new" ? "newest" : "verified";
    visibleLimit = 30;
    render();
    q("#discover").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelectorAll("[data-star]").forEach((el) => el.onclick = () => {
    search.value = String(el.dataset.star || "");
    region.value = "Pakistan";
    contentType.value = "all";
    availability.value = "all";
    visibleLimit = 30;
    render();
    renderSuggestions();
    q("#discover").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelectorAll("[data-region-top]").forEach((el) => el.onclick = () => showCollection("region", String(el.dataset.regionTop || "All")));
  contentType.onchange = () => {
    activeCollection = "all";
    visibleLimit = 30;
    render();
  };
  region.onchange = () => {
    activeCollection = "all";
    visibleLimit = 30;
    render();
  };
  availability.onchange = () => {
    activeCollection = "all";
    visibleLimit = 30;
    render();
  };
  sort.onchange = () => {
    visibleLimit = 30;
    render();
  };
  loadMore.onclick = () => {
    visibleLimit += 30;
    render();
  };
  q("#clear-watchlist").addEventListener("click", () => {
    saved = [];
    persist();
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
  newsletter.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(newsletter), email = String(form.get("email") || "").trim().toLowerCase(), consent = form.get("consent") === "on";
    newsletterMsg.textContent = "";
    newsletterMsg.className = "form-msg";
    if (!email || !consent) {
      newsletterMsg.textContent = "Enter your email and confirm consent first.";
      newsletterMsg.classList.add("error");
      return;
    }
    const { error } = await db.from("subscribers").insert({ email, consent: true });
    if (error?.code === "23505") {
      newsletterMsg.textContent = "You are already subscribed.";
      return;
    }
    if (error) {
      newsletterMsg.textContent = "Subscription could not be saved. Please try again.";
      newsletterMsg.classList.add("error");
      return;
    }
    newsletter.reset();
    newsletterMsg.textContent = "Subscribed. Welcome to CineDesi.";
  });
  q("#bottom-search").onclick = () => {
    catalogHeader.classList.add("search-mode");
    setTimeout(() => search.focus(), 0);
    renderSuggestions();
  };
  searchClose.onclick = () => {
    catalogHeader.classList.remove("search-mode");
    suggestions.classList.remove("on");
    search.blur();
  };
  load();
}
