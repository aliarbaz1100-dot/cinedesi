import "./cinematic-v2.css";
import "./mobile-navigation.css";
import "./top-ten.css";
import "./launch-polish.css";
import "./installed-app-qa.css";
const homeReturnKey = "cinedesi-home-return-v1";
const rememberHomeReturn = (link) => {
  const section = link.closest("section[id]");
  try {
    const returnState = {
      y: Math.round(window.scrollY),
      sectionId: section?.id || "",
      sectionOffset: section ? Math.round(window.scrollY - section.offsetTop) : 0,
      at: Date.now()
    };
    sessionStorage.setItem(homeReturnKey, JSON.stringify(returnState));
    const destination = new URL(link.href, location.href);
    destination.searchParams.set("returnY", String(returnState.y));
    destination.searchParams.set("returnSection", returnState.sectionId);
    destination.searchParams.set("returnOffset", String(returnState.sectionOffset));
    link.href = destination.href;
  } catch {}
};
document.addEventListener("click", (event) => {
  const link = event.target?.closest?.("a[href*='movie?slug=']");
  if (link) rememberHomeReturn(link);
}, { capture: true });
window.addEventListener("pageshow", (event) => {
  let savedReturn = null;
  try { savedReturn = JSON.parse(sessionStorage.getItem(homeReturnKey) || "null"); } catch {}
  const returnParams = new URLSearchParams(location.search);
  if (returnParams.has("returnY")) savedReturn = {
    y: Number(returnParams.get("returnY") || 0),
    sectionId: returnParams.get("returnSection") || "",
    sectionOffset: Number(returnParams.get("returnOffset") || 0),
    at: Date.now()
  };
  if (!savedReturn || Date.now() - Number(savedReturn.at || 0) > 30 * 60 * 1000) return;
  let fromDetail = false;
  try { fromDetail = new URL(document.referrer).pathname.replace(/\/$/, "") === "/movie"; } catch {}
  const navigation = performance.getEntriesByType?.("navigation")?.[0];
  if (!returnParams.has("returnY") && !fromDetail && !event.persisted && navigation?.type !== "back_forward") return;
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const html = document.documentElement;
  const previousBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  const restore = () => {
    const section = savedReturn.sectionId ? document.getElementById(savedReturn.sectionId) : null;
    const target = section ? section.offsetTop + Number(savedReturn.sectionOffset || 0) : Number(savedReturn.y || 0);
    window.scrollTo(0, Math.max(0, target));
  };
  restore();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    restore();
    html.style.scrollBehavior = previousBehavior;
    if ("scrollRestoration" in history) history.scrollRestoration = "auto";
    try { sessionStorage.removeItem(homeReturnKey); } catch {}
    if (returnParams.has("returnY")) {
      const cleanUrl = new URL(location.href);
      ["returnY", "returnSection", "returnOffset"].forEach((key) => cleanUrl.searchParams.delete(key));
      history.replaceState(history.state, "", cleanUrl.href);
    }
  }));
});
const launchSplash = document.querySelector("#app-splash");
if (launchSplash && (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true)) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => {
    launchSplash.classList.add("splash-exit");
    setTimeout(() => launchSplash.remove(), reduceMotion ? 0 : 320);
  }, document.documentElement.classList.contains("cd-qa-standalone") ? 1650 : 1050)));
} else launchSplash?.remove();
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js?v=28").catch(() => {
}));
let deferredInstall = null;
const installBar = document.querySelector("#install-banner"), installButton = document.querySelector("#install-app"), installClose = document.querySelector("#install-close"), installCopy = document.querySelector("#install-copy");
const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isCompactInstall = window.matchMedia("(max-width: 620px)").matches;
const installDismissedAt = Number(localStorage.getItem("cinedesi-install-dismissed") || 0);
const installDismissed = installDismissedAt > Date.now() - 7 * 24 * 60 * 60 * 1000;
const showInstall = () => {
  if (installBar && isCompactInstall && !isStandalone && !installDismissed) installBar.hidden = false;
};
const hideInstall = (remember = false) => {
  if (installBar) installBar.hidden = true;
  if (remember) localStorage.setItem("cinedesi-install-dismissed", String(Date.now()));
};
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstall = event;
  // Installation is user initiated: never overlay the browsing experience.
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
// iOS users can install via Safari Share > Add to Home Screen; no automatic popup.
const skeletonMarkup = Array.from({ length: 6 }, () => `<article class="card skeleton-card" aria-hidden="true"><div class="poster"></div><div class="info"></div></article>`).join("");
["watch-now-grid", "top-grid", "new-grid"].forEach((id) => {
  const rail = document.getElementById(id);
  if (rail && !rail.children.length) rail.innerHTML = skeletonMarkup;
});
const URL = "https://ewtgkjcmnwjoqfldrtuw.supabase.co";
const KEY = "sb_publishable_ZEAZWO-Q-_rvMsy6krr_nw_JDRmP_kI";
const apiHeaders = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
  "Accept-Profile": "public",
  "Content-Profile": "public"
};
const apiFetch = (path, options = {}) => fetch(`${URL}/rest/v1/${path}`, {
  ...options,
  headers: { ...apiHeaders, ...(options.headers || {}) }
});
queueMicrotask(() => init());
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
    if (match) return `https://i.ytimg.com/vi/${match[1]}/maxresdefault.jpg`;
  }
  return "";
};
const licensedPoster = (m) => Boolean(m.poster_source_url && m.poster_license && !/cinedesi original|generated cover/i.test(String(m.poster_license)));
const scoreLabel = (score) => {
  const value = Number(score);
  if (!Number.isFinite(value) || value <= 0) return "";
  return value <= 10 ? `${value.toFixed(value % 1 ? 1 : 0)}/10` : `${Math.round(value)}%`;
};
const heroPosterUrl = (value) => String(value || "").replace(/\/hqdefault\.jpg(?:\?.*)?$/i, "/maxresdefault.jpg");
function init() {
  const desktopFastPath = window.matchMedia("(min-width: 900px)").matches;
  const scheduleBackgroundWork = (fn, timeout = 650) => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(fn, { timeout });
    else setTimeout(fn, desktopFastPath ? 120 : 180);
  };
  if ("scrollRestoration" in history) history.scrollRestoration = "auto";
  const track = async (event, slug = null) => {
    try {
      const response = await apiFetch("rpc/track_cinedesi_event", {
        method: "POST",
        body: JSON.stringify({ p_event_type: event, p_movie_slug: slug })
      });
      if (!response.ok) console.warn("CineDesi analytics event failed", response.status);
    } catch {}
  };
  void track("page_view");
  let movies = [];
  let visibleLimit = 30;
  let activeCollection = "all";
  let activeCollectionValue = "";
  let homeRailClaims = new Set();
  let saved = JSON.parse(localStorage.getItem("cinedesi-watchlist") || "[]");
  const q = (s) => document.querySelector(s);
  const search = q("#search"), suggestions = q("#search-suggestions"), searchClose = q("#search-close"), menuToggle = q("#menu-toggle"), catalogHeader = q(".catalog-header"), quickBrowse = q("#quick-browse"), region = q("#region"), availability = q("#availability"), sort = q("#sort"), grid = q("#grid"), loadMore = q("#load-more"), heroShowcase = q("#hero-showcase"), heroTitle = q("#hero-title"), heroMeta = q("#hero-meta"), heroLead = q("#hero-lead"), heroPlay = q("#hero-play"), heroInfo = q("#hero-info"), heroList = q("#hero-list"), topGrid = q("#top-grid"), newGrid = q("#new-grid"), comingGrid = q("#coming-grid"), continueGrid = q("#continue-grid"), recentGrid = q("#recent-grid"), verifiedGrid = q("#verified-grid"), bingeGrid = q("#binge-grid"), watchGrid = q("#watch-grid"), pakistanGrid = q("#pakistan-grid"), bollywoodGrid = q("#bollywood-grid"), southGrid = q("#south-grid"), seriesGrid = q("#series-grid"), contentType = q("#content-type"), discoverTitle = q("#discover-title"), genreRails = q("#genre-rails"), genreChips = q("#genre-chips"), status = q("#status"), modal = q("#modal"), count = q("#watch-count"), newsletter = q("#newsletter-form"), newsletterMsg = q("#newsletter-msg"), statPublished = q("#stat-published"), statTrailers = q("#stat-trailers"), statWatch = q("#stat-watch"), statRegions = q("#stat-regions");
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
  const claimRail = (items, limit) => {
    const list = items.filter((m) => !homeRailClaims.has(m.id)).slice(0, limit);
    list.forEach((m) => homeRailClaims.add(m.id));
    return list;
  };
  const hydrateMovies = (rows) => (rows || []).map((m) => {
    const thumb = videoThumb(m);
    return { ...m, _trend_score: Number(m._trend_score) || 0, _cover_kind: m.poster_url ? "poster" : thumb ? "youtube" : "original", poster_url: m.poster_url || thumb || posterArt(m) };
  });
  const paintPrimaryRails = () => {
    homeRailClaims = new Set();
    renderHero();
    renderTop();
    renderNew();
  };
  async function load() {
    try {
      const cached = JSON.parse(localStorage.getItem("cinedesi-home-cache-v1") || "null");
      if (cached?.savedAt > Date.now() - 12 * 60 * 60 * 1000 && Array.isArray(cached.items) && cached.items.length) {
        movies = hydrateMovies(cached.items);
        paintPrimaryRails();
      }
    } catch {}
    const hadCachedPaint = movies.length > 0;
    const selectColumns = "id,slug,title,region,genre,release_year,score,trailer_url,trailer_source,trailer_verified,watch_url,watch_verified,full_video_url,full_video_embed_url,full_video_verified,full_video_source,full_video_label,full_video_language,content_type,season_count,episode_count,original_language,availability_note,cast_names,poster_url,poster_source_url,poster_license,poster_attribution,rights_status,rights_checked_at,source_name,source_url,source_license,created_at,updated_at";
    let data = [];
    let error = null;
    let start = 0;
    while (true) {
      const pageSize = start === 0 ? (desktopFastPath ? 140 : 80) : 1000;
      const query = new URLSearchParams({
        select: selectColumns,
        status: "eq.published",
        order: "rights_checked_at.desc",
        offset: String(start),
        limit: String(pageSize)
      });
      let rows = [];
      try {
        const response = await apiFetch(`movies?${query.toString()}`, { method: "GET" });
        if (!response.ok) {
          error = new Error(`Catalog request failed: ${response.status}`);
          break;
        }
        rows = await response.json();
      } catch (requestError) {
        error = requestError;
        break;
      }
      data.push(...rows);
      if (start === 0 && !hadCachedPaint && rows.length) {
        movies = hydrateMovies(rows);
        paintPrimaryRails();
      }
      if (rows.length < pageSize) break;
      start += pageSize;
    }
    if (error && !data.length) {
      if (status) {
        status.textContent = hadCachedPaint
          ? "Showing your previously loaded titles. Live catalog is temporarily unavailable."
          : "Could not load the CineDesi catalog. Check your connection and retry.";
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "btn secondary";
        retry.textContent = "Retry catalog";
        retry.addEventListener("click", () => {
          retry.disabled = true;
          status.textContent = "Reconnecting to CineDesi…";
          void load();
        }, { once: true });
        status.append(" ", retry);
      }
      if (!hadCachedPaint) {
        ["watch-now-grid", "top-grid", "new-grid"].forEach((id) => {
          const rail = document.getElementById(id);
          if (rail) rail.replaceChildren();
        });
      }
      return;
    }
    movies = hydrateMovies(data);
    let trendingRows = [];
    try {
      const trendingResponse = await apiFetch("rpc/get_cinedesi_trending", {
        method: "POST",
        body: JSON.stringify({ p_days: 7, p_limit: 100 })
      });
      if (trendingResponse.ok) trendingRows = await trendingResponse.json();
    } catch {}
    const trendMap = new Map((trendingRows || []).map((row) => [row.movie_slug, Number(row.trend_score) || 0]));
    movies = movies.map((m) => ({ ...m, _trend_score: trendMap.get(m.slug) || 0 }));
    try {
      const homeItems = [...movies.filter((m) => isHomeDisplayTitle(m)).slice(0, 140), ...movies.filter((m) => m.full_video_verified && m.full_video_embed_url).slice(0, 80)];
      const uniqueItems = [...new Map(homeItems.map((m) => [m.id, m])).values()];
      localStorage.setItem("cinedesi-home-cache-v1", JSON.stringify({ savedAt: Date.now(), items: uniqueItems }));
    } catch {}
    status.textContent = error ? "Catalog temporarily unavailable" : `${movies.length} published titles \u2022 live Supabase catalog`;
    statPublished.textContent = String(movies.length);
    statTrailers.textContent = String(movies.filter((m) => m.trailer_verified && m.trailer_url).length);
    statWatch.textContent = String(movies.filter((m) => m.watch_verified && m.watch_url).length);
    statRegions.textContent = String(new Set(movies.map((m) => m.region).filter(Boolean)).size);
    updateSchema();
    paintPrimaryRails();
    renderPersonalized();
    renderComingSoon();
    renderBingeSeries();
    const deferredSections = [
      [document.querySelector("#verified"), renderVerified],
      [document.querySelector("#series"), renderSeries],
      [document.querySelector("#genres"), renderGenres],
      [document.querySelector("#regions"), renderRegions],
      [document.querySelector("#discover"), render],
      [document.querySelector("#watchlist"), renderWatchlist]
    ].filter(([node]) => node);
    const rendered = new WeakSet();
    const paintSection = (node, fn) => {
      if (!node || rendered.has(node)) return;
      rendered.add(node);
      fn();
    };
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const pair = deferredSections.find(([node]) => node === entry.target);
          if (pair) paintSection(pair[0], pair[1]);
          observer.unobserve(entry.target);
        }
      }, { rootMargin: desktopFastPath ? "1000px 0px" : "650px 0px", threshold: 0.01 });
      deferredSections.forEach(([node]) => observer.observe(node));
    } else {
      deferredSections.forEach(([node, fn], index) => scheduleBackgroundWork(() => paintSection(node, fn), 700 + index * 120));
    }
    count.textContent = String(saved.length);
  }
  function card(m) {
    const preserveFullThumb = ["cid-official-series", "crime-patrol-city-crimes-2026"].includes(String(m.slug || ""));
    const fallbackCover = posterArt(m);
    const image = m.poster_url ? `<img src='${esc(m.poster_url)}' data-poster-fallback='${esc(fallbackCover)}' alt='${esc(m.title)} cover' loading='lazy' decoding='async'${preserveFullThumb ? " style='object-fit:contain;background:#050506'" : ""}>` : "";
    const upcoming = typeof isUpcomingTitle === "function" && isUpcomingTitle(m);
    const availabilityBadge = upcoming ? "<span class='badge'>Coming soon</span>" : m.full_video_verified && m.full_video_embed_url ? "<span class='badge watch-now'>Watch here</span>" : m.watch_verified && m.watch_url ? "<span class='badge'>Legal watch</span>" : m.trailer_verified ? "<span class='badge'>Official trailer</span>" : "<span class='badge'>Editorial</span>";
    const ribbon = upcoming ? "<span class='poster-ribbon new'>Upcoming</span>" : m.full_video_verified && m.full_video_embed_url ? "<span class='poster-ribbon'>\u25B6 Watch here</span>" : Number(m.release_year) >= 2025 ? "<span class='poster-ribbon new'>New</span>" : "";
    return `<article class='card' data-id='${m.id}'><a class='poster-link' href='/movie?slug=${encodeURIComponent(m.slug)}' aria-label='Open ${esc(m.title)}'><div class='poster'>${image}<span class='poster-region'>${esc(m.region)}</span>${ribbon}</div></a><div class='info'><div class='card-title-row'><h3>${esc(m.title)}</h3>${scoreLabel(m.score) ? `<strong class='match-score'>${esc(scoreLabel(m.score))}</strong>` : ""}</div><p class='muted'>${esc(m.content_type === "series" ? "Series" : m.genre || "Film")} \u2022 ${esc(m.release_year || "")}${m.original_language ? ` \u2022 ${esc(m.original_language)}` : ""}</p><div class='badges'>${availabilityBadge}${m.rights_status === "official_link" || m.rights_status === "cleared" ? "<span class='badge verified-badge'>\u2713 Source checked</span>" : ""}</div><div class='card-actions streaming-actions'><a class='btn play-mini' href='/movie?slug=${encodeURIComponent(m.slug)}'>\u25B6 Details</a><button class='circle-action' data-save='${m.id}' aria-label='${saved.includes(m.id) ? "Remove from My List" : "Add to My List"}'>${saved.includes(m.id) ? "\u2713" : "\uFF0B"}</button><button class='circle-action info-action' data-open='${m.id}' aria-label='More information'>i</button></div></div></article>`;
  }
  function enhanceRails(root) {
    const rails = [
      ...(root.matches?.(".grid.rail,#verified-grid") ? [root] : []),
      ...root.querySelectorAll(".grid.rail,#verified-grid")
    ];
    rails.forEach((rail) => {
      if (rail.parentElement?.classList.contains("rail-shell")) return;
      const shell = document.createElement("div");
      shell.className = "rail-shell";
      rail.before(shell);
      shell.appendChild(rail);
      const previous = document.createElement("button");
      const next = document.createElement("button");
      previous.type = next.type = "button";
      previous.className = "rail-control prev";
      next.className = "rail-control next";
      previous.setAttribute("aria-label", "Scroll titles left");
      next.setAttribute("aria-label", "Scroll titles right");
      previous.textContent = "‹";
      next.textContent = "›";
      shell.append(previous, next);
      const update = () => {
        previous.disabled = rail.scrollLeft <= 4;
        next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
      };
      const move = (direction) => rail.scrollBy({ left: direction * Math.max(rail.clientWidth * .86, 260), behavior: "smooth" });
      previous.onclick = () => move(-1);
      next.onclick = () => move(1);
      rail.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update, { passive: true });
      requestAnimationFrame(update);
    });
  }
  function wire(root) {
    root.querySelectorAll("a[href*='movie?slug=']").forEach((link) => {
      if (link.dataset.returnReady === "1") return;
      link.dataset.returnReady = "1";
      link.addEventListener("click", () => rememberHomeReturn(link), { capture: true });
    });
    root.querySelectorAll("img[data-poster-fallback]").forEach((img) => {
      const reveal = () => img.classList.add("poster-ready");
      if (img.complete && img.naturalWidth) reveal();
      else img.addEventListener("load", reveal, { passive: true });
      img.addEventListener("error", () => {
        const current = String(img.currentSrc || img.src || "");
        const maxres = current.match(/i\.ytimg\.com\/vi\/([\w-]{11})\/maxresdefault\.jpg/i);
        if (maxres && img.dataset.youtubeFallbackApplied !== "1") {
          img.dataset.youtubeFallbackApplied = "1";
          img.src = `https://i.ytimg.com/vi/${maxres[1]}/hqdefault.jpg`;
          return;
        }
        const fallback = String(img.dataset.posterFallback || "");
        if (!fallback || img.dataset.fallbackApplied === "1") return;
        img.dataset.fallbackApplied = "1";
        img.src = fallback;
        img.classList.add("poster-fallback");
      });
    });
    root.querySelectorAll("[data-open]").forEach((el) => el.onclick = (e) => {
      e.stopPropagation();
      openMovie(Number(el.dataset.open));
    });
    root.querySelectorAll("[data-save]").forEach((el) => el.onclick = (e) => {
      e.stopPropagation();
      toggle(Number(el.dataset.save));
    });
    enhanceRails(root);
  }
  const isUpcomingTitle = (m) => {
    const note = String(m.availability_note || "");
    return /\b(?:premieres|coming|scheduled|arrives)\b/i.test(note) && !/\b(?:premiered|streaming now|available now)\b/i.test(note);
  };
  const isHomeDisplayTitle = (m) => {
    const currentYear = new Date().getFullYear();
    if (isUpcomingTitle(m)) return false;
    return Number(m._trend_score || 0) > 0 || Number(m.release_year || 0) >= currentYear - 1;
  };
  const rankRail = (list) => [...list].sort((a,b) =>
    (Number(b._trend_score)||0) - (Number(a._trend_score)||0) ||
    (Number(b.score)||0) - (Number(a.score)||0) ||
    (Number(b.release_year)||0) - (Number(a.release_year)||0) ||
    String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || ""))
  );
  function fillRail(root, name) {
    const all = rankRail(movies.filter((m) => m.region === name && isHomeDisplayTitle(m)));
    const list = claimRail(all, 8);
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
    if (kind === "hollywood") {
      contentType.value = "movie";
      region.value = "Hollywood";
      availability.value = "cinedesi";
      label = "Hollywood";
    } else if (kind === "binge") {
      contentType.value = "series";
      availability.value = "cinedesi";
      label = "Complete series on CineDesi";
    } else if (kind === "genre") {
      label = `All ${value}`;
    } else if (kind === "region") {
      region.value = value;
      label = `All ${value} titles`;
    } else if (kind === "turkish") {
      contentType.value = "series";
      label = "Turkish";
    } else if (kind === "top") {
      label = "Top titles on CineDesi";
    } else if (kind === "new") {
      contentType.value = "movie";
      sort.value = "newest";
      label = "New & trending releases";
    } else if (kind === "upcoming") {
      label = "Coming Soon";
    }
    discoverTitle.textContent = label;
    render();
    q("#discover").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const isHollywoodMovie = (m) =>
    m.content_type === "movie" &&
    String(m.region || "").trim().toLowerCase() === "hollywood" &&
    m.full_video_verified &&
    Boolean(m.full_video_embed_url) &&
    !isUpcomingTitle(m);

  const isCartoonTitle = (m) => {
    const genre = String(m.genre || "").toLowerCase();
    return ["movie", "series"].includes(String(m.content_type || "").toLowerCase()) &&
      /(^|[\s,\/|;-])(cartoons?|animation|animated|anime)([\s,\/|;-]|$)/i.test(genre) &&
      !isUpcomingTitle(m);
  };

  const isNewNonCinedesiMovie = (m) => {
    const currentYear = new Date().getFullYear();
    return m.content_type === "movie" &&
      Number(m.release_year || 0) >= currentYear - 1 &&
      !(m.full_video_verified && m.full_video_embed_url) &&
      !isUpcomingTitle(m);
  };

  function renderSeries() {
    const all = rankRail(movies.filter(isHollywoodMovie));
    const list = all.slice(0, 8);
    seriesGrid.innerHTML = list.length
      ? list.map((m) => card(m)).join("") + (all.length > 8 ? `<a class='see-all-card' href='#discover' data-hollywood-see='true'><span>See all Hollywood</span><strong>\u2192</strong></a>` : "")
      : `<div class='empty'>Hollywood movies are being prepared.</div>`;
    wire(seriesGrid);
    document.querySelectorAll("[data-hollywood-see],[data-hollywood-all]").forEach((el) => el.onclick = () => showCollection("hollywood"));
  }
  function renderRegions() {
    fillRail(pakistanGrid, "Pakistan");
    fillRail(bollywoodGrid, "Bollywood");
    const all = rankRail(movies.filter((m) => ["South", "South Indian", "India / South Indian"].includes(String(m.region)) && isHomeDisplayTitle(m))), list = claimRail(all, 8);
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
    if (g === "Cartoons") return isCartoonTitle(m);
    return false;
  }
  function renderGenres() {
    const gs = ["Action", "Comedy", "Horror", "Drama", "Romance", "Thriller", "Cartoons"];
    genreChips.innerHTML = gs.map((g) => `<button class='genre-chip' data-genre='${g}'>${g}</button>`).join("");
    genreRails.innerHTML = gs.map((g) => {
      const all = rankRail(movies.filter((m) => genreMatch(m, g) && (g === "Cartoons" || isHomeDisplayTitle(m))));
      const list = g === "Cartoons" ? all.slice(0, 8) : claimRail(all, 8);
      if (!list.length) return "";
      return `<div class='rail-block genre-block' id='genre-${g.toLowerCase()}'><div class='rail-heading'><h3>${g}</h3><button type='button' data-genre-see='${g}'>See all \u2192</button></div><div class='grid rail genre-rail'>${list.map((m) => card(m)).join("")}</div></div>`;
    }).join("");
    wire(genreRails);
    genreChips.querySelectorAll("[data-genre]").forEach((el) => el.onclick = () => document.querySelector(`#genre-${String(el.dataset.genre).toLowerCase()}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    genreRails.querySelectorAll("[data-genre-see]").forEach((el) => el.onclick = () => showCollection("genre", String(el.dataset.genreSee || "")));
  }
  function renderBingeSeries() {
    const section = q("#binge-series");
    if (!bingeGrid || !section) return;
    const all = rankRail(movies.filter((m) =>
      m.content_type === "series" &&
      isHomeDisplayTitle(m) &&
      m.full_video_verified &&
      m.full_video_embed_url &&
      Number(m.episode_count || 0) >= 5
    ));
    section.hidden = all.length === 0;
    const list = claimRail(all, 12);
    bingeGrid.innerHTML = list.length
      ? list.map((m) => card(m)).join("") + (all.length > 12 ? `<a class='see-all-card' href='#discover' data-binge-see='true'><span>See all complete series</span><strong>→</strong></a>` : "")
      : "";
    wire(bingeGrid);
    document.querySelectorAll("[data-binge-see],[data-binge-all]").forEach((el) => el.onclick = () => showCollection("binge"));
  }

  function renderVerified() {
    const isTurkish = (m) =>
      m.content_type === "series" &&
      String(m.region || "").toLowerCase() === "turkey" &&
      String(m.original_language || "").toLowerCase() === "turkish" &&
      m.full_video_verified &&
      Boolean(m.full_video_embed_url) &&
      !isUpcomingTitle(m);
    const all = rankRail(movies.filter(isTurkish));
    const list = all.slice(0, 8);
    verifiedGrid.innerHTML = list.length
      ? list.map((m) => card(m)).join("") + (all.length > 8 ? `<a class='see-all-card' href='#discover' data-turkish-see='true'><span>See all Turkish</span><strong>\u2192</strong></a>` : "")
      : `<div class='empty'>Turkish titles are being prepared.</div>`;
    wire(verifiedGrid);
    document.querySelectorAll("[data-turkish-see],[data-turkish-all]").forEach((el) => el.onclick = () => showCollection("turkish"));
  }
  function renderPersonalized() {
    const continueSection = q("#continue-watching");
    const recentSection = q("#recently-viewed");

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
      const continueBySlug = new Map(continueItems.map((x) => [x.slug, x]));
      continueGrid.innerHTML = continueMovies.map((m) => {
        const url = `/movie?slug=${encodeURIComponent(m.slug)}`;
        const resume = continueBySlug.get(m.slug);
        const episodeNumber = Number(resume?.episode_number);
        let html = card(m).replaceAll(url, url + "#watch");
        if (Number.isInteger(episodeNumber) && episodeNumber > 0) {
          html = html.replace("▶ Details", `▶ Resume E${episodeNumber}`);
        } else {
          html = html.replace("▶ Details", "▶ Resume");
        }
        const qaPreview = /(^|[.-])qa([.-]|$)/i.test(location.hostname) || new URLSearchParams(location.search).get("qa") === "1";
        if (qaPreview) {
          const rawSeconds = Number(resume?.position_seconds);
          const rawDuration = Number(resume?.duration_seconds);
          const validTime = Number.isFinite(rawSeconds) && Number.isFinite(rawDuration) && rawSeconds >= 3 && rawDuration > rawSeconds;
          const percent = validTime ? Math.max(1, Math.min(99, Math.round(100 * rawSeconds / rawDuration))) : 0;
          const minutes = validTime ? Math.floor(rawSeconds / 60) : 0;
          const seconds = validTime ? Math.floor(rawSeconds % 60) : 0;
          const watched = validTime ? `${minutes}:${String(seconds).padStart(2, "0")} watched` : "";
          const label = m.content_type === "series"
            ? (Number.isInteger(episodeNumber) && episodeNumber > 0 ? `Continue · Episode ${episodeNumber}` : "Continue series")
            : "Continue movie";
          const progress = validTime
            ? `<div class='qa-resume-track' role='progressbar' aria-label='${esc(label)}' aria-valuemin='0' aria-valuemax='100' aria-valuenow='${percent}'><i style='width:${percent}%'></i></div>`
            : "";
          const detail = `<div class='qa-resume-meta'><span>${esc(label)}</span><small>${esc(watched)}</small>${progress}</div>`;
          html = html.replace("</article>", detail + "</article>");
        }
        return html;
      }).join("");
      wire(continueGrid);
    }

    if (recentGrid && recentSection) {
      recentSection.hidden = recentMovies.length === 0;
      recentGrid.innerHTML = recentMovies.map((m) => card(m)).join("");
      wire(recentGrid);
    }
  }

  function renderNew() {
    if (!newGrid) return;
    const featuredLatestSlugs = new Set(["bigg-boss-20", "pakistan-idol-season-2-2025-2026", "pakistans-got-talent-2026", "ekaki-ashish-chanchlani", "indias-got-latent-season-2-2026"]);
    const all = [...movies]
      .filter(isNewNonCinedesiMovie)
      .sort((a, b) =>
        Number(featuredLatestSlugs.has(b.slug)) - Number(featuredLatestSlugs.has(a.slug)) ||
        (Number(b._trend_score) || 0) - (Number(a._trend_score) || 0) ||
        (Number(b.release_year) || 0) - (Number(a.release_year) || 0) ||
        String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")) ||
        (Number(b.score) || 0) - (Number(a.score) || 0)
      );
    const list = all.slice(0, 12);
    newGrid.innerHTML = list.length ? list.map((m) => card(m)).join("") + (all.length > 12 ? `<a class='see-all-card' href='#discover' data-new-see='true'><span>See all new releases</span><strong>→</strong></a>` : "") : `<div class='empty'>New releases are being prepared.</div>`;
    wire(newGrid);
    document.querySelectorAll("[data-new-see],[data-new-all]").forEach((el) => el.onclick = () => showCollection("new"));
  }
  function renderComingSoon() {
    const section = q("#coming-soon");
    if (!comingGrid || !section) return;
    const all = [...movies]
      .filter(isUpcomingTitle)
      .sort((a,b) => (Number(b.score)||0) - (Number(a.score)||0) || String(b.updated_at || "").localeCompare(String(a.updated_at || "")));
    section.hidden = all.length === 0;
    const list = all.slice(0,12);
    comingGrid.innerHTML = list.map((m) => card(m).replace("<span class='poster-ribbon new'>New</span>", "<span class='poster-ribbon new'>Upcoming</span>")).join("") + (all.length > 12 ? `<a class='see-all-card' href='#discover' data-upcoming-see='true'><span>See all upcoming</span><strong>→</strong></a>` : "");
    wire(comingGrid);
    document.querySelectorAll("[data-upcoming-see],[data-upcoming-all]").forEach((el) => el.onclick = () => showCollection("upcoming"));
  }

  function renderTop() {
    const trendingPriority = [
      "jolly-llb-3-2025",
      "welcome-to-the-jungle-2026-official",
      "bigg-boss-20",
      "pakistan-idol-season-2-2025-2026",
      "pakistans-got-talent-2026",
      "ekaki-ashish-chanchlani",
      "indias-got-latent-season-2-2026"
    ];
    const eligible = [...movies].filter(isHomeDisplayTitle);
    const pinned = trendingPriority.map((slug) => eligible.find((m) => m.slug === slug)).filter(Boolean);
    const pinnedIds = new Set(pinned.map((m) => m.id));
    const rest = eligible
      .filter((m) => !pinnedIds.has(m.id))
      .sort((a, b) =>
        (Number(b._trend_score) || 0) - (Number(a._trend_score) || 0) ||
        (Number(b.release_year) || 0) - (Number(a.release_year) || 0) ||
        String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")) ||
        (Number(b.score) || 0) - (Number(a.score) || 0)
      );
    const list = claimRail([...pinned, ...rest], 10);
    topGrid.innerHTML = list.map((m, i) => card(m).replace("class='card'", `class='card top-card' data-rank='${i + 1}'`)).join("");
    wire(topGrid);
    document.querySelectorAll("[data-top-all]").forEach((el) => el.onclick = () => showCollection("top"));
  }
  const seriesSeasonLabel = (m) => {
    const title = String(m?.title || "");
    const explicit = title.match(/\bseason\s*(\d+)\b/i)?.[1] || title.match(/\bbigg\s+boss\s+(\d+)\b/i)?.[1];
    if (explicit) return `Season ${explicit}`;
    const count = Number(m?.season_count || 0);
    return count ? `${count} Season${count === 1 ? "" : "s"}` : "Series";
  };

  function renderHero() {
    const preferred = [
      "jolly-llb-3-2025","welcome-to-the-jungle-2026-official","bigg-boss-20","pakistan-idol-season-2-2025-2026","pakistans-got-talent-2026","ekaki-ashish-chanchlani","indias-got-latent-season-2-2026","tamasha-season-5","raid-2-2025","dhurandhar-2025","son-of-sardaar-2-2025","war-2-q124852530","saiyaara-q135393743","housefull-5-q125918989","coolie-q127118132","sikandar-q125861557","chhaava-q127012906","dhurandhar-the-revenge-2026","de-de-pyaar-de-2-2025","jaat-2025","paatal-lok-season-2-2025","kesari-chapter-2-2025","criminal-justice-a-family-matter-2025","black-mirror-season-7-2025","severance-season-2-2025","foundation-season-3-2025","cobra-kai-season-6-2025","fallout-season-2-2025","the-boys-season-5-2026","the-family-man-season-3-2025","panchayat-season-4-2025","the-night-agent-season-3-2026","bridgerton-season-4-2026","one-piece-live-action-japan-cinedesi","the-umbrella-academy-series","lockwood-and-co-series","mirzapur-series-2018","mirzapur-the-movie-2026","dhamaal-4-2026","the-love-hypothesis-2026","drawn-together-2026","the-whisper-man-2026","best-of-the-best-2026","a-different-world-2026","stranger-things-tales-from-85","monster-the-lizzie-borden-story-2026","avatar-the-last-airbender-season-2-2026","enola-holmes-3-2026","mardaani-3-2026","bhooth-bangla-2026","i-will-find-you-2026","kaisi-teri-khudgharzi-full-movie","mayi-ri-full-movie","doctor-bahu-series-2026","mahnoor-series-2026","fraud-full-movie","taqdeer-series-2022","sar-e-rah-series-2023","jhooti-series-2020","habs-series-2022","awarapan-2-2026-official","outer-banks-season-5-2026","the-gentlemen-series","wednesday-series-2022"
    ];
    const eligibleHero = (m) => Boolean(m && isHomeDisplayTitle(m) && m.poster_url && (licensedPoster(m) || m._cover_kind === "youtube"));
    const curated = preferred.map((slug) => movies.find((x) => x.slug === slug)).filter(eligibleHero);
    const liveTrending = [...movies]
      .filter((m) => eligibleHero(m) && Number(m.release_year || 0) >= new Date().getFullYear() - 1)
      .sort((a, b) => (Number(b._trend_score) || 0) - (Number(a._trend_score) || 0) || (Number(b.score) || 0) - (Number(a.score) || 0) || (Number(b.release_year) || 0) - (Number(a.release_year) || 0));
    const seenHero = new Set();
    const heroPool = [...curated, ...liveTrending].filter((m) => {
      if (!m || seenHero.has(m.id)) return false;
      seenHero.add(m.id);
      return true;
    }).slice(0, 14);
    if (!heroPool.length) return;
    const preloadHero = (m, priority = "low") => {
      const image = new Image();
      image.decoding = "async";
      image.fetchPriority = priority;
      image.src = heroPosterUrl(videoThumb(m) || m.poster_url);
    };
    preloadHero(heroPool[0], "high");
    const warmNextHeroes = () => heroPool.slice(1, 4).forEach((m) => preloadHero(m));
    if ("requestIdleCallback" in window) window.requestIdleCallback(warmNextHeroes, { timeout: 1200 });
    else setTimeout(warmNextHeroes, 600);
    let heroIndex = 0;
    const paintHero = () => {
      const m = heroPool[heroIndex % heroPool.length];
      const url = `/movie?slug=${encodeURIComponent(m.slug)}`;
      heroTitle.textContent = m.title;
      heroMeta.textContent = `${m.release_year || "Featured"} • ${m.content_type === "series" ? seriesSeasonLabel(m) : (m.genre || "Movie")}${m.original_language ? ` • ${m.original_language}` : ""}`;
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
      const isLiveTrending = Number(m._trend_score || 0) > 0;
      const heroState = isLiveTrending ? "TRENDING NOW" : Number(m.release_year || 0) >= new Date().getFullYear() ? "NEW RELEASE" : "FEATURED";
      const eyebrow = q("#hero-eyebrow");
      if (eyebrow) eyebrow.textContent = `${heroState} • ${badge}`;
      const shown = Math.min(heroPool.length, 9);
      const heroImage = heroPosterUrl(videoThumb(m) || m.poster_url);
      heroShowcase.innerHTML = `<a class='hero-feature hero-feature-live' href='${url}' style="background-image:url('${esc(heroImage)}')" aria-label='Open ${esc(m.title)}'></a><div class='hero-dots' aria-label='Featured titles'>${heroPool.slice(0,shown).map((_,i)=>`<button type='button' class='${i === heroIndex % shown ? "active" : ""}' data-hero-dot='${i}' aria-label='Featured title ${i+1}'></button>`).join("")}</div>`;
      const heroFeature = heroShowcase.querySelector(".hero-feature");
      if (heroFeature && m.poster_url) {
        const probe = new Image();
        probe.onerror = () => {
          const candidates = [heroImage.replace(/\/maxresdefault\.jpg(?:\?.*)?$/i, "/hqdefault.jpg"), m.poster_url].filter((value, index, list) => value && value !== heroImage && list.indexOf(value) === index);
          const tryFallback = (index = 0) => {
            const value = candidates[index];
            if (!value) {
              heroFeature.style.backgroundImage = `url("${posterArt(m)}")`;
              return;
            }
            const fallbackProbe = new Image();
            fallbackProbe.onload = () => { heroFeature.style.backgroundImage = `url("${value}")`; };
            fallbackProbe.onerror = () => tryFallback(index + 1);
            fallbackProbe.src = value;
          };
          tryFallback();
        };
        probe.src = heroImage;
      }
      heroShowcase.querySelectorAll("[data-hero-dot]").forEach((el) => el.onclick = (e) => {
        e.preventDefault();
        heroIndex = Number(el.dataset.heroDot || 0);
        paintHero();
      });
    };
    paintHero();
    const startHeroTimer = () => {
      window.clearInterval(window.__cinedesiHeroTimer);
      if (heroPool.length <= 1 || document.hidden) return;
      window.__cinedesiHeroTimer = window.setInterval(() => {
        heroIndex = (heroIndex + 1) % Math.min(heroPool.length, 9);
        paintHero();
      }, 5000);
    };
    startHeroTimer();
    if (!window.__cinedesiHeroVisibilityBound) {
      window.__cinedesiHeroVisibilityBound = true;
      document.addEventListener("visibilitychange", startHeroTimer, { passive: true });
    }
  }
  function searchText(m) {
    if (m._search_text) return m._search_text;
    m._search_text = `${m.title || ""} ${m.genre || ""} ${m.region || ""} ${m.content_type || ""} ${m.original_language || ""} ${m.cast_names || ""} ${m.release_year || ""} ${m.synopsis || ""} ${m.editorial || ""} ${m.source_name || ""} ${m.attribution_text || ""}`.toLowerCase();
    return m._search_text;
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
    const list = movies.filter((m) => (activeCollection !== "new" || isNewNonCinedesiMovie(m)) && (activeCollection !== "upcoming" || isUpcomingTitle(m)) && (activeCollection !== "binge" || (m.content_type === "series" && isHomeDisplayTitle(m) && m.full_video_verified && m.full_video_embed_url && Number(m.episode_count || 0) >= 5)) && (activeCollection !== "turkish" || (m.content_type === "series" && String(m.region || "").toLowerCase() === "turkey" && String(m.original_language || "").toLowerCase() === "turkish" && m.full_video_verified && Boolean(m.full_video_embed_url) && !isUpcomingTitle(m))) && (activeCollection !== "hollywood" || isHollywoodMovie(m)) && (activeCollection !== "genre" || genreMatch(m, activeCollectionValue)) && (t === "all" || m.content_type === t) && (r === "All" || m.region === r || r === "South" && south(m.region)) && (a === "all" || a === "watch" && m.watch_verified && m.watch_url || a === "trailer" && m.trailer_verified && m.trailer_url || a === "cinedesi" && m.full_video_verified && m.full_video_embed_url) && searchText(m).includes(term)).sort((x, y) => activeCollection === "top" ? (Number(y._trend_score) || 0) - (Number(x._trend_score) || 0) || (Number(y.score) || 0) - (Number(x.score) || 0) : activeCollection === "upcoming" ? (Number(y.score) || 0) - (Number(x.score) || 0) || String(y.updated_at || "").localeCompare(String(x.updated_at || "")) : s === "title" ? String(x.title).localeCompare(String(y.title)) : s === "newest" ? (Number(y.release_year) || 0) - (Number(x.release_year) || 0) : 0), shown = list.slice(0, visibleLimit);
    grid.innerHTML = shown.length ? shown.map((m) => card(m)).join("") : `<div class='empty'>No published titles match these filters yet.</div>`;
    status.textContent = list.length ? `Showing ${shown.length} of ${list.length} matching titles` : "No matching published titles";
    loadMore.hidden = shown.length >= list.length;
    wire(grid);
  }
  function renderWatchlist() {
    const byId = new Map(movies.map((m) => [m.id, m]));
    const list = saved.map((id) => byId.get(id)).filter(Boolean);
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
    document.body.classList.add("modal-open");
    const closeButton = q("#close-modal");
    closeButton.addEventListener("click", closeModal);
    closeButton.focus({ preventScroll: true });
    q("#modal-save").addEventListener("click", () => {
      toggle(id);
      openMovie(id);
    });
  }
  function closeModal() {
    modal.classList.remove("on");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("on")) closeModal();
  });
  let searchRenderTimer = 0;
  search.oninput = () => {
    activeCollection = "all";
    activeCollectionValue = "";
    discoverTitle.textContent = "Search results";
    visibleLimit = 30;
    window.clearTimeout(searchRenderTimer);
    searchRenderTimer = window.setTimeout(() => {
      render();
      renderSuggestions();
    }, desktopFastPath ? 90 : 140);
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
  const syncHeader = () => catalogHeader.classList.toggle("is-scrolled", window.scrollY > 18);
  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();
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
    if (key === "upcoming") {
      showCollection("upcoming");
      return;
    }
    if (key === "binge") {
      showCollection("binge");
      return;
    }
    if (key === "new") {
      showCollection("new");
      return;
    }
    availability.value = "all";
    sort.value = "verified";
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
    let subscribeResponse;
    let subscribeError = null;
    try {
      subscribeResponse = await apiFetch("subscribers", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ email, consent: true })
      });
      if (!subscribeResponse.ok) subscribeError = await subscribeResponse.json().catch(() => ({}));
    } catch {
      subscribeError = {};
    }
    if (subscribeError?.code === "23505") {
      newsletterMsg.textContent = "You are already subscribed.";
      return;
    }
    if (!subscribeResponse?.ok) {
      newsletterMsg.textContent = "Subscription could not be saved. Please try again.";
      newsletterMsg.classList.add("error");
      return;
    }
    newsletter.reset();
    newsletterMsg.textContent = "Subscribed. Welcome to CineDesi.";
  });
  // QA-only installed app tabs: use real catalog sections, not mock screens.
  // Browser visitors and the existing desktop experience keep their navigation.
  const installedApp = (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true) && (/(^|[.-])qa([.-]|$)/i.test(location.hostname) || new URLSearchParams(location.search).get("qa") === "1");
  const mobileTabs = q(".mobile-bottom-nav");
  if (installedApp && mobileTabs) {
    document.documentElement.classList.add("cd-installed");
    const tabs = Array.from(mobileTabs.querySelectorAll("a,button"));
    const newTab = mobileTabs.querySelector('a[href="#top-today"]');
    if (newTab) newTab.setAttribute("href", "#new-releases");
    const selectTab = (tab) => {
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("active", active);
        if (item.tagName === "A") {
          if (active) item.setAttribute("aria-current", "page");
          else item.removeAttribute("aria-current");
        } else {
          item.setAttribute("aria-pressed", String(active));
        }
      });
    };
    const tabFromHash = () => mobileTabs.querySelector(
      location.hash === "#watchlist" ? 'a[href="#watchlist"]' :
      location.hash === "#new-releases" ? 'a[href="#new-releases"]' :
      'a[href="#home"]'
    );
    const leaveSearch = () => {
      catalogHeader.classList.remove("search-mode");
      suggestions.classList.remove("on");
      search.blur();
    };
    mobileTabs.addEventListener("click", (event) => {
      const tab = event.target.closest("a,button");
      if (!tab || !mobileTabs.contains(tab)) return;
      if (tab.id !== "bottom-search") leaveSearch();
      selectTab(tab);
    });
    searchClose.addEventListener("click", () => selectTab(tabFromHash()));
    window.addEventListener("hashchange", () => {
      if (!catalogHeader.classList.contains("search-mode")) selectTab(tabFromHash());
    });
    window.addEventListener("pageshow", () => {
      if (!catalogHeader.classList.contains("search-mode")) selectTab(tabFromHash());
    });
    selectTab(tabFromHash());
  }
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
