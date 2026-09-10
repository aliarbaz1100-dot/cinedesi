import "./styles.css";
import { tamashaSeason5Episodes } from "./tamashaSeason5";
const URL = "https://ewtgkjcmnwjoqfldrtuw.supabase.co", KEY = "sb_publishable_ZEAZWO-Q-_rvMsy6krr_nw_JDRmP_kI";
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
const sdk = document.createElement("script");
sdk.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.115.0/dist/umd/supabase.min.js";
sdk.onload = () => load();
document.head.appendChild(sdk);
async function load() {
  const root = document.querySelector("#movie-page"), slug = new URLSearchParams(location.search).get("slug");
  if (!slug) {
    root.innerHTML = `<div class='empty'>Movie not specified. <a href='./'>Return to CineDesi</a></div>`;
    return;
  }
  const db = supabase.createClient(URL, KEY);
  const track = async (event) => {
    const { error: error2 } = await db.rpc("track_cinedesi_event", { p_event_type: event, p_movie_slug: slug });
    if (error2) console.warn("CineDesi analytics event failed", error2.message);
  };
  const trackDestination = async (provider, url) => {
    const { error: error2 } = await db.from("monetization_clicks").insert({ movie_id: m?.id || null, provider_name: provider, destination_url: url, click_type: "watch" });
    if (error2) console.warn("CineDesi destination tracking failed", error2.message);
  };
  const { data: m, error } = await db.from("movies").select("id,slug,title,region,genre,release_year,score,synopsis,editorial,trailer_url,trailer_source,trailer_verified,watch_url,watch_verified,full_video_url,full_video_embed_url,full_video_verified,full_video_source,full_video_label,full_video_language,full_video_checked_at,poster_url,poster_source_url,poster_license,poster_attribution,rights_status,rights_checked_at,source_name,source_url,source_license,attribution_text,seo_title,seo_description,content_type,season_count,episode_count,availability_note").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error || !m) {
    root.innerHTML = `<div class='empty'>This movie is not published or could not be found. <a href='./'>Return to CineDesi</a></div>`;
    return;
  }
  const thumb = videoThumb(m);
  m._cover_kind = m.poster_url ? "poster" : thumb ? "youtube" : "original";
  if (!m.poster_url) m.poster_url = thumb || posterArt(m);
  track("movie_view");
  const [{ data: providers }, { data: related }] = await Promise.all([db.from("watch_sources").select("provider_name,destination_url,access_type,country_code,language,dub_language,subtitle_language,verified_at").eq("movie_id", m.id).eq("verification_status", "verified").order("provider_name").limit(8), db.from("movies").select("slug,title,region,genre,release_year").eq("status", "published").eq("region", m.region).neq("id", m.id).limit(6)]);
  document.title = m.seo_title || `${m.title} | CineDesi`;
  const desc = document.querySelector("meta[name=description]");
  if (desc) desc.content = m.seo_description || m.synopsis || "CineDesi movie details";
  let og = document.querySelector('meta[property="og:title"]');
  if (!og) {
    og = document.createElement("meta");
    og.setAttribute("property", "og:title");
    document.head.appendChild(og);
  }
  og.content = m.seo_title || m.title;
  let ogd = document.querySelector('meta[property="og:description"]');
  if (!ogd) {
    ogd = document.createElement("meta");
    ogd.setAttribute("property", "og:description");
    document.head.appendChild(ogd);
  }
  ogd.content = m.seo_description || m.synopsis || "";
  const pageUrl = `https://cinedesi.online/movie?slug=${encodeURIComponent(m.slug)}`;
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = pageUrl;
  let robots = document.querySelector('meta[name="robots"]');
  if (!robots) {
    robots = document.createElement("meta");
    robots.name = "robots";
    document.head.appendChild(robots);
  }
  const hasIndexableDepth = String(m.editorial || "").trim().length >= 120 || String(m.synopsis || "").trim().length >= 120;
  robots.content = hasIndexableDepth ? "index,follow" : "noindex,follow";
  let ogu = document.querySelector('meta[property="og:url"]');
  if (!ogu) {
    ogu = document.createElement("meta");
    ogu.setAttribute("property", "og:url");
    document.head.appendChild(ogu);
  }
  ogu.content = pageUrl;
  const schema = document.createElement("script");
  schema.type = "application/ld+json";
  schema.id = "movie-schema";
  const movieSchema = { "@context": "https://schema.org", "@type": "Movie", "name": m.title, "url": pageUrl, "description": m.seo_description || m.synopsis || m.editorial || void 0, "dateCreated": m.release_year ? String(m.release_year) : void 0, "genre": m.genre || void 0, "sameAs": m.source_url || void 0 };
  if (m.trailer_verified && m.trailer_url) movieSchema.trailer = { "@type": "VideoObject", "name": `${m.title} official trailer`, "url": m.trailer_url };
  if (licensedPoster(m)) movieSchema.image = m.poster_url;
  schema.textContent = JSON.stringify(movieSchema);
  document.querySelector("#movie-schema")?.remove();
  document.head.appendChild(schema);
  const trailer = m.trailer_verified && m.trailer_url ? `<a id='trailer-link' class='btn' target='_blank' rel='noopener' href='${esc(m.trailer_url)}'>Watch official trailer</a>` : ``;
  const watch = m.watch_verified && m.watch_url ? `<a id='watch-link' class='btn secondary' target='_blank' rel='noopener' href='${esc(m.watch_url)}'>Where to watch legally</a>` : ``;
  const checked = m.rights_checked_at ? new Date(m.rights_checked_at).toLocaleDateString(void 0, { year: "numeric", month: "short", day: "numeric" }) : "Not recorded";
  const seasonNumber = String(m.title || "").match(/season\s*(\d+)/i)?.[1] || (Number(m.season_count) === 1 ? "1" : "");
  const episodeItems = m.slug === "tamasha-season-5" ? tamashaSeason5Episodes : [];
  const episodeLabel = (title, position) => {
    const launch = title.match(/LAUNCH EPISODE.*PART\s*(\d+)/i);
    if (launch) return `Launch Episode · Part ${launch[1]}`;
    const numbered = title.match(/EPISODE\s*(\d+)/i);
    return numbered ? `Episode ${numbered[1]}` : `Episode ${position + 1}`;
  };
  const episodeMeta = (title) => {
    const date = title.match(/\b\d{1,2}\s+(?:AUG|SEP)\s+2026\b/i)?.[0] || "Season 5";
    return `${/elimination/i.test(title) ? "Elimination Special" : "Official full episode"} · ${date}`;
  };
  const episodeList = episodeItems.length ? `<div class='episode-browser'><div class='episode-browser-head'><div><small>${seasonNumber ? `SEASON ${esc(seasonNumber)}` : "EPISODES"}</small><h3>${episodeItems.length} official videos</h3></div><span class='muted'>Launch + Episodes 2–33</span></div><div class='episode-grid'>${episodeItems.map((episode, i) => `<button type='button' class='episode-card${i === 0 ? " active" : ""}' data-episode='${i}' data-video-id='${esc(episode.id)}'><span class='episode-thumb'><img src='https://i.ytimg.com/vi/${esc(episode.id)}/mqdefault.jpg' alt='' loading='lazy' decoding='async'><b>${i + 1}</b></span><span class='episode-copy'><strong>${esc(episodeLabel(episode.title, i))}</strong><small>${esc(episodeMeta(episode.title))}</small></span><span class='episode-play'>▶</span></button>`).join("")}</div>${m.availability_note ? `<p class='muted episode-note'>${esc(m.availability_note)}</p>` : ""}</div>` : "";
  const initialPlayerUrl = episodeItems.length ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(episodeItems[0].id)}?rel=0` : m.full_video_embed_url;
  const fullVideo = m.full_video_verified && m.full_video_embed_url ? `<section id='watch' class='legal-player-section'><div class='legal-player-head'><div><small>WATCH ON CINEDESI</small><h2>${esc(m.full_video_label || "Official full video")}</h2><p>${esc(m.full_video_language || "Official source")}</p></div><span class='badge'>Rights-holder source verified</span></div><div class='legal-player'><iframe id='official-player' src='${esc(initialPlayerUrl)}' title='${esc(m.title)} official video' loading='lazy' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share' allowfullscreen></iframe></div>${episodeList}<div class='source-card'><strong>Playback source</strong><br>${esc(m.full_video_source || "Official rights-holder source")} \u2022 Playback, ads and regional availability remain controlled by the source platform/rights-holder.${m.full_video_url ? ` <a target='_blank' rel='noopener' href='${esc(m.full_video_url)}'>Open official source</a>` : ""}</div></section>` : "";
  const providerSection = providers?.length ? `<section class='engage-section'><div class='engage-head'><div><small>VERIFIED DESTINATIONS</small><h2>Where to watch</h2></div><span class='badge'>Only verified links shown</span></div><div class='provider-grid'>${providers.map((p) => `<a class='provider-card' data-track-watch='1' data-provider='${esc(p.provider_name)}' data-destination='${esc(p.destination_url)}' target='_blank' rel='noopener' href='${esc(p.destination_url)}'><strong>${esc(p.provider_name)}</strong><span>${esc(String(p.access_type || "official_platform").replaceAll("_", " "))}${p.country_code ? ` \u2022 ${esc(p.country_code)}` : ""}</span>${p.dub_language ? `<small>Dub: ${esc(p.dub_language)}</small>` : ""}${p.subtitle_language ? `<small>Subs: ${esc(p.subtitle_language)}</small>` : ""}</a>`).join("")}</div></section>` : `<section class='engage-section compact-engage'><small>WHERE TO WATCH</small><h2>Verification in progress</h2><p class='muted'>CineDesi will show a platform here only after the exact destination and availability evidence pass review.</p></section>`;
  const relatedSection = related?.length ? `<section class='engage-section'><div class='engage-head'><div><small>KEEP DISCOVERING</small><h2>More from ${esc(m.region)}</h2></div><a class='muted' href='./#discover'>Browse all \u2192</a></div><div class='related-grid'>${related.map((r) => `<a class='related-card' href='/movie?slug=${encodeURIComponent(r.slug)}'><span>${esc(r.region)}</span><strong>${esc(r.title)}</strong><small>${esc(r.genre || "Title")}${r.release_year ? ` \u2022 ${esc(r.release_year)}` : ""}</small></a>`).join("")}</div></section>` : "";
  const posterLine = licensedPoster(m) ? `${esc(m.poster_license)}${m.poster_attribution ? ` \u2022 ${esc(m.poster_attribution)}` : ""}${m.poster_source_url ? ` \u2022 <a target='_blank' rel='noopener' href='${esc(m.poster_source_url)}'>poster source</a>` : ""}` : m._cover_kind === "youtube" ? `Official video thumbnail supplied by ${esc(m.full_video_source || m.trailer_source || "YouTube")}; linked to the verified upload.` : "CineDesi dark original fallback; no third-party poster reused.";
  root.innerHTML = `<section class='movie-hero'><div class='movie-art' ${m.poster_url ? `style="background-image:linear-gradient(#0003,#0008),url('${esc(m.poster_url)}'),url('${esc(posterArt(m))}')"` : ""}><span>${licensedPoster(m) ? "Licensed image" : m._cover_kind === "youtube" ? "Official video thumbnail" : "CineDesi dark cover"}</span></div><div class='movie-copy'><small>${esc(m.region)}</small><h1>${esc(m.title)}</h1><div class='modal-meta'><span>${esc(m.genre || "Film")}</span><span>${esc(m.release_year || "")}</span>${m.score ? `<span>CineDesi score ${esc(m.score)}</span>` : ""}</div><div class='badges'><span class='badge'>${m.rights_status === "cleared" ? "Rights cleared" : "Official links checked"}</span>${m.trailer_verified ? "<span class='badge'>Official trailer verified</span>" : ""}${m.watch_verified ? "<span class='badge'>Legal watch verified</span>" : ""}${m.full_video_verified && m.full_video_embed_url ? "<span class='badge'>Official full video on CineDesi</span>" : ""}${licensedPoster(m) ? "<span class='badge'>Licensed image</span>" : "<span class='badge'>CineDesi original cover</span>"}</div><p class='lead'>${esc(m.editorial || m.synopsis || "Editorial coming soon.")}</p><div class='actions'>${trailer}${watch}<button id='share' class='ghost'>Share page</button></div><div class='source-card'><strong>Verification & source transparency</strong><br>Metadata: ${esc(m.source_name || "Verified source")}${m.source_license ? ` \u2022 ${esc(m.source_license)}` : ""}${m.source_url ? ` \u2022 <a target='_blank' rel='noopener' href='${esc(m.source_url)}'>source page</a>` : ""}${m.attribution_text ? `<br>Attribution: ${esc(m.attribution_text)}` : ""}${m.trailer_source ? `<br>Trailer source: ${esc(m.trailer_source)}` : ""}<br>Poster: ${posterLine}<br>Rights checked: ${esc(checked)}</div></div></section>${fullVideo}${providerSection}${relatedSection}`;
  document.querySelector("#trailer-link")?.addEventListener("click", () => track("trailer_click"));
  document.querySelector("#watch-link")?.addEventListener("click", () => track("watch_click"));
  document.querySelectorAll("[data-episode]").forEach((el) => el.addEventListener("click", () => {
    const videoId = String(el.dataset.videoId || "");
    const player = document.querySelector("#official-player");
    if (player && videoId) {
      player.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
      document.querySelectorAll("[data-episode]").forEach((item) => item.classList.toggle("active", item === el));
      document.querySelector("#watch")?.scrollIntoView({ behavior: "smooth", block: "start" });
      track("episode_play");
    }
  }));
  document.querySelectorAll("[data-track-watch]").forEach((el) => el.addEventListener("click", () => {
    track("watch_click");
    trackDestination(el.dataset.provider || "Verified provider", el.dataset.destination || "");
  }));
  document.querySelector("#share")?.addEventListener("click", async () => {
    track("share");
    const data = { title: document.title, text: m.seo_description || m.synopsis || "", url: pageUrl };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(pageUrl);
        const b = document.querySelector("#share");
        if (b) b.textContent = "Link copied \u2713";
      }
    } catch {
    }
  });
  try {
    const recent = JSON.parse(localStorage.getItem("cinedesi_recent") || "[]").filter((x) => x.slug !== m.slug);
    recent.unshift({ slug: m.slug, title: m.title, region: m.region });
    localStorage.setItem("cinedesi_recent", JSON.stringify(recent.slice(0, 12)));
  } catch {
  }
}
