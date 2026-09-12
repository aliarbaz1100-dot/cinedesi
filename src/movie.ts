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
  const backButton = document.querySelector("#movie-back");
  backButton?.addEventListener("click", () => {
    const sameSiteReferrer = document.referrer && new URL(document.referrer, location.href).origin === location.origin;
    if (sameSiteReferrer && history.length > 1) history.back();
    else location.href = "./";
  });
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
  const { data: m, error } = await db.from("movies").select("id,slug,title,region,genre,release_year,score,synopsis,editorial,trailer_url,trailer_source,trailer_verified,watch_url,watch_verified,full_video_url,full_video_embed_url,full_video_verified,full_video_source,full_video_label,full_video_language,full_video_checked_at,poster_url,poster_source_url,poster_license,poster_attribution,rights_status,rights_checked_at,source_name,source_url,source_license,attribution_text,seo_title,seo_description,content_type,season_count,episode_count,original_language,availability_note,cast_names").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error || !m) {
    root.innerHTML = `<div class='empty'>This movie is not published or could not be found. <a href='./'>Return to CineDesi</a></div>`;
    return;
  }
  const thumb = videoThumb(m);
  m._cover_kind = m.poster_url ? "poster" : thumb ? "youtube" : "original";
  if (!m.poster_url) m.poster_url = thumb || posterArt(m);
  track("movie_view");
  const [{ data: providers }, { data: relatedCandidates }, { data: dbEpisodes }, { data: trendingRows }] = await Promise.all([
    db.from("watch_sources").select("provider_name,destination_url,access_type,country_code,language,dub_language,subtitle_language,verified_at").eq("movie_id", m.id).eq("verification_status", "verified").order("provider_name").limit(8),
    db.from("movies").select("id,slug,title,region,genre,release_year,score,content_type,cast_names,poster_url,poster_source_url,poster_license,trailer_url,trailer_verified,watch_url,watch_verified,full_video_url,full_video_embed_url,full_video_verified").eq("status", "published").eq("region", m.region).neq("id", m.id).order("score", { ascending: false }).limit(80),
    db.from("series_episodes").select("season_number,episode_number,title,video_id,source_name").eq("movie_id", m.id).eq("verified", true).order("season_number").order("episode_number"),
    db.rpc("get_cinedesi_trending", { p_days: 7, p_limit: 100 })
  ]);

  const trendMap = new Map((trendingRows || []).map((row) => [row.movie_slug, Number(row.trend_score) || 0]));
  const genreTokens = String(m.genre || "").toLowerCase().split(/[,/]/).map((x) => x.trim()).filter(Boolean);
  const castTokens = String(m.cast_names || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 6);
  const related = (relatedCandidates || []).map((r) => {
    const rGenres = String(r.genre || "").toLowerCase();
    const rCast = String(r.cast_names || "").toLowerCase();
    const actorMatches = castTokens.filter((actor) => actor && rCast.includes(actor)).length;
    const genreMatches = genreTokens.filter((g) => g && rGenres.includes(g)).length;
    const sameType = r.content_type === m.content_type ? 1 : 0;
    const sameRegion = r.region === m.region ? 1 : 0;
    const freshness = Math.max(0, 4 - Math.abs(Number(r.release_year || 0) - Number(m.release_year || 0)));
    const availability = r.full_video_verified && r.full_video_embed_url ? 5 : r.watch_verified && r.watch_url ? 3 : r.trailer_verified ? 1 : 0;
    const trend = Math.min(12, Number(trendMap.get(r.slug) || 0));
    const relevance = actorMatches * 18 + genreMatches * 8 + sameType * 5 + sameRegion * 4 + freshness + availability + trend + Math.min(10, Number(r.score || 0) / 10);
    const thumb = r.poster_url || videoThumb(r) || posterArt(r);
    return { ...r, _relevance: relevance, _thumb: thumb, _actor_matches: actorMatches, _genre_matches: genreMatches };
  }).sort((a, b) => b._relevance - a._relevance || (Number(b.score) || 0) - (Number(a.score) || 0) || (Number(b.release_year) || 0) - (Number(a.release_year) || 0)).slice(0, 8);
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
  const ensureMeta = (selector, attrName, attrValue, value) => {
    let node = document.querySelector(selector);
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute(attrName, attrValue);
      document.head.appendChild(node);
    }
    node.content = value;
  };
  ensureMeta('meta[property="og:type"]', "property", "og:type", m.content_type === "series" ? "video.tv_show" : "video.movie");
  if (m.poster_url) {
    ensureMeta('meta[property="og:image"]', "property", "og:image", m.poster_url);
    ensureMeta('meta[name="twitter:image"]', "name", "twitter:image", m.poster_url);
  }
  ensureMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
  ensureMeta('meta[name="twitter:title"]', "name", "twitter:title", m.seo_title || m.title);
  ensureMeta('meta[name="twitter:description"]', "name", "twitter:description", m.seo_description || m.synopsis || "");
  const schema = document.createElement("script");
  schema.type = "application/ld+json";
  schema.id = "movie-schema";
  const castPeople = String(m.cast_names || "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 12).map((name) => ({ "@type": "Person", name }));
  const movieSchema = {
    "@context": "https://schema.org",
    "@type": m.content_type === "series" ? "TVSeries" : "Movie",
    "name": m.title,
    "url": pageUrl,
    "description": m.seo_description || m.synopsis || m.editorial || void 0,
    "dateCreated": m.release_year ? String(m.release_year) : void 0,
    "genre": m.genre || void 0,
    "sameAs": m.source_url || void 0,
    "inLanguage": m.original_language || m.full_video_language || void 0,
    "actor": castPeople.length ? castPeople : void 0
  };
  if (m.content_type === "series") {
    if (Number(m.season_count) > 0) movieSchema.numberOfSeasons = Number(m.season_count);
    if (Number(m.episode_count) > 0) movieSchema.numberOfEpisodes = Number(m.episode_count);
  }
  if (m.trailer_verified && m.trailer_url) movieSchema.trailer = { "@type": "VideoObject", "name": `${m.title} official trailer`, "url": m.trailer_url };
  if (m.poster_url && (licensedPoster(m) || m._cover_kind === "youtube")) movieSchema.image = m.poster_url;
  const actionTarget = m.full_video_verified && m.full_video_embed_url ? `${pageUrl}#watch` : m.watch_verified && m.watch_url ? m.watch_url : "";
  if (actionTarget) movieSchema.potentialAction = { "@type": "WatchAction", "target": actionTarget };
  schema.textContent = JSON.stringify(movieSchema);
  document.querySelector("#movie-schema")?.remove();
  document.head.appendChild(schema);
  const trailer = m.trailer_verified && m.trailer_url ? `<a id='trailer-link' class='btn' target='_blank' rel='noopener' href='${esc(m.trailer_url)}'>Watch official trailer</a>` : ``;
  const watch = m.watch_verified && m.watch_url ? `<a id='watch-link' class='btn secondary' target='_blank' rel='noopener' href='${esc(m.watch_url)}'>Where to watch legally</a>` : ``;
  const checked = m.rights_checked_at ? new Date(m.rights_checked_at).toLocaleDateString(void 0, { year: "numeric", month: "short", day: "numeric" }) : "Not recorded";
  const seasonNumber = String(m.title || "").match(/season\s*(\d+)/i)?.[1] || (Number(m.season_count) === 1 ? "1" : "");
  const ytPlaylistId = String(m.full_video_embed_url || "").match(/youtube(?:-nocookie)?\.com\/embed\/videoseries\?[^#]*\blist=([^&]+)/i)?.[1] || "";
  const dmEmbed = String(m.full_video_embed_url || "");
  const dmPlaylistId =
    dmEmbed.match(/dailymotion\.com\/embed\/playlist\/([^?&#/]+)/i)?.[1] ||
    dmEmbed.match(/[?&]playlist=([^&#]+)/i)?.[1] ||
    String(m.full_video_url || "").match(/dailymotion\.com\/playlist\/([^?&#/]+)/i)?.[1] ||
    "";
  const playlistEpisodeCount = Math.max(0, Math.min(Number(m.episode_count || 0), 200));
  const playlistItems = !(dbEpisodes || []).length && playlistEpisodeCount && (ytPlaylistId || dmPlaylistId)
    ? Array.from({ length: playlistEpisodeCount }, (_, i) => ({
        id: "",
        title: `Episode ${i + 1}`,
        season_number: Number(seasonNumber || 1),
        episode_number: i + 1,
        playlist_index: i,
        playlist_id: ytPlaylistId || dmPlaylistId,
        playlist_kind: ytPlaylistId ? "youtube" : "dailymotion"
      }))
    : [];
  const episodeItems = (dbEpisodes || []).length ? (dbEpisodes || []).map((e) => ({ id: e.video_id, title: `S${e.season_number}E${e.episode_number} · ${e.title}`, season_number: e.season_number, episode_number: e.episode_number })) : m.slug === "tamasha-season-5" ? tamashaSeason5Episodes : playlistItems;
  const episodeLabel = (title, position) => {
    const launch = title.match(/LAUNCH EPISODE.*PART\s*(\d+)/i);
    if (launch) return `Launch Episode · Part ${launch[1]}`;
    const numbered = title.match(/EPISODE\s*(\d+)/i);
    const seasonEpisode = title.match(/S\d+E(\d+)/i);
    return numbered ? `Episode ${numbered[1]}` : seasonEpisode ? `Episode ${seasonEpisode[1]}` : `Episode ${position + 1}`;
  };
  const episodeMeta = (title) => {
    const date = title.match(/\b\d{1,2}\s+(?:AUG|SEP)\s+2026\b/i)?.[0] || "Season 5";
    return `${/elimination/i.test(title) ? "Elimination Special" : "Official full episode"} · ${date}`;
  };
  const playlistGenerated = episodeItems.length && !episodeItems[0]?.id && Boolean(episodeItems[0]?.playlist_id);
  const episodeList = episodeItems.length ? `<div class='episode-browser'><div class='episode-browser-head'><div><small>${seasonNumber ? `SEASON ${esc(seasonNumber)}` : "EPISODES"}</small><h3>${episodeItems.length} official episodes</h3></div><span class='muted'>${m.slug === "tamasha-season-5" ? "Launch + Episodes 2–33" : `${episodeItems.length} episodes`}</span></div><div class='episode-grid'>${episodeItems.map((episode, i) => {
    const isPlaylistEpisode = Boolean(episode.playlist_id);
    const thumb = episode.id ? `https://i.ytimg.com/vi/${esc(episode.id)}/mqdefault.jpg` : esc(m.poster_url || posterArt(m));
    const disabled = episode.playlist_kind === "dailymotion" ? " data-dm-playlist='1'" : "";
    return `<button type='button' class='episode-card${i === 0 ? " active" : ""}' data-episode='${i}' data-video-id='${esc(episode.id || "")}' data-playlist-index='${Number(episode.playlist_index ?? -1)}' data-playlist-id='${esc(episode.playlist_id || "")}' data-playlist-kind='${esc(episode.playlist_kind || "")}'${disabled}><span class='episode-thumb'><img src='${thumb}' alt='' loading='lazy' decoding='async'><b>${i + 1}</b></span><span class='episode-copy'><strong>${esc(episodeLabel(episode.title, i))}</strong><small>${isPlaylistEpisode ? (episode.playlist_kind === "dailymotion" ? "Official playlist episode · use player queue" : "Official playlist episode") : esc(episodeMeta(episode.title))}</small></span><span class='episode-play'>▶</span></button>`;
  }).join("")}</div>${playlistGenerated && dmPlaylistId ? `<p class='muted episode-note'>Episodes are listed below. This ARY Digital/Dailymotion source exposes episode selection through the player’s playlist/queue control.</p>` : (m.availability_note ? `<p class='muted episode-note'>${esc(m.availability_note)}</p>` : "")}</div>` : "";
  const individualEpisode = episodeItems.length && episodeItems[0]?.id;
  const playlistPlayerUrl = playlistGenerated && ytPlaylistId
    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(ytPlaylistId)}&enablejsapi=1&origin=${encodeURIComponent(location.origin)}&rel=0`
    : playlistGenerated && dmPlaylistId
      ? `https://geo.dailymotion.com/player.html?playlist=${encodeURIComponent(dmPlaylistId)}`
      : m.full_video_embed_url;
  const initialPlayerUrl = individualEpisode ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(episodeItems[0].id)}?rel=0` : playlistPlayerUrl;
  const fullVideo = m.full_video_verified && m.full_video_embed_url ? `<section id='watch' class='legal-player-section'><div class='legal-player-head'><div><small>WATCH ON CINEDESI</small><h2>${esc(m.full_video_label || "Official full video")}</h2><p>${esc(m.full_video_language || "Official source")}</p></div><span class='badge'>Rights-holder source verified</span></div><div class='legal-player'><iframe id='official-player' src='${esc(initialPlayerUrl)}' title='${esc(m.title)} official video' loading='lazy' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share' allowfullscreen></iframe></div>${episodeList}<div class='source-card'><strong>Playback source</strong><br>${esc(m.full_video_source || "Official rights-holder source")} \u2022 Playback, ads and regional availability remain controlled by the source platform/rights-holder.${m.full_video_url ? ` <a target='_blank' rel='noopener' href='${esc(m.full_video_url)}'>Open official source</a>` : ""}</div></section>` : "";
  const providerSection = providers?.length ? `<section class='engage-section'><div class='engage-head'><div><small>VERIFIED DESTINATIONS</small><h2>Where to watch</h2></div><span class='badge'>Only verified links shown</span></div><div class='provider-grid'>${providers.map((p) => `<a class='provider-card' data-track-watch='1' data-provider='${esc(p.provider_name)}' data-destination='${esc(p.destination_url)}' target='_blank' rel='noopener' href='${esc(p.destination_url)}'><strong>${esc(p.provider_name)}</strong><span>${esc(String(p.access_type || "official_platform").replaceAll("_", " "))}${p.country_code ? ` \u2022 ${esc(p.country_code)}` : ""}</span>${p.dub_language ? `<small>Dub: ${esc(p.dub_language)}</small>` : ""}${p.subtitle_language ? `<small>Subs: ${esc(p.subtitle_language)}</small>` : ""}</a>`).join("")}</div></section>` : `<section class='engage-section compact-engage'><small>WHERE TO WATCH</small><h2>Verification in progress</h2><p class='muted'>CineDesi will show a platform here only after the exact destination and availability evidence pass review.</p></section>`;
  const upNext = related?.[0];
  const moreLikeThis = (related || []).slice(1, 7);
  const recommendationReason = (r) => r?._actor_matches ? "Same cast" : r?._genre_matches ? "Similar genre" : r?.content_type === m.content_type ? "Same format" : "Recommended";
  const upNextSection = upNext ? `<section class='up-next-section'><div class='up-next-art' style="background-image:linear-gradient(90deg,#08090bee 0%,#08090b99 48%,#08090b22 100%),url('${esc(upNext._thumb)}')"></div><div class='up-next-copy'><small>UP NEXT FOR YOU</small><h2>${esc(upNext.title)}</h2><p>${esc(recommendationReason(upNext))} · ${esc(upNext.genre || "Title")}${upNext.release_year ? ` · ${esc(upNext.release_year)}` : ""}</p><div class='actions'><a class='btn' data-rec-click='up_next' href='/movie?slug=${encodeURIComponent(upNext.slug)}'>▶ Open next</a>${upNext.full_video_verified && upNext.full_video_embed_url ? `<a class='btn secondary' data-rec-click='up_next_watch' href='/movie?slug=${encodeURIComponent(upNext.slug)}#watch'>Watch here</a>` : ""}</div></div></section>` : "";
  const relatedSection = moreLikeThis.length ? `<section class='engage-section recommendation-section'><div class='engage-head'><div><small>PERSONALIZED DISCOVERY</small><h2>More Like This</h2></div><a class='muted' href='./#discover'>Browse all →</a></div><div class='recommendation-grid'>${moreLikeThis.map((r) => `<a class='recommendation-card' data-rec-click='more_like_this' href='/movie?slug=${encodeURIComponent(r.slug)}'><span class='recommendation-art' style="background-image:url('${esc(r._thumb)}')"></span><span class='recommendation-copy'><small>${esc(recommendationReason(r))}</small><strong>${esc(r.title)}</strong><em>${esc(r.content_type === "series" ? "Series" : r.genre || "Movie")}${r.release_year ? ` · ${esc(r.release_year)}` : ""}</em></span></a>`).join("")}</div></section>` : "";
  const detailFacts = [
    m.content_type === "series" && Number(m.season_count) > 0 ? `${Number(m.season_count)} Season${Number(m.season_count) === 1 ? "" : "s"}` : "",
    m.content_type === "series" && Number(m.episode_count) > 0 ? `${Number(m.episode_count)} Episodes` : "",
    m.original_language ? String(m.original_language) : "",
    m.full_video_language && m.full_video_language !== m.original_language ? String(m.full_video_language) : ""
  ].filter(Boolean);
  const titleFacts = detailFacts.length ? `<div class='title-facts'>${detailFacts.map((x) => `<span>${esc(x)}</span>`).join("")}</div>` : "";
  const castList = String(m.cast_names || "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 7);
  const castSection = castList.length ? `<div class='cast-strip'><small>CAST</small><div>${castList.map((name) => `<span>${esc(name)}</span>`).join("")}</div></div>` : "";
  const availabilityCallout = m.availability_note ? `<div class='availability-callout'><strong>Availability</strong><span>${esc(m.availability_note)}</span></div>` : "";
  const posterLine = licensedPoster(m) ? `${esc(m.poster_license)}${m.poster_attribution ? ` \u2022 ${esc(m.poster_attribution)}` : ""}${m.poster_source_url ? ` \u2022 <a target='_blank' rel='noopener' href='${esc(m.poster_source_url)}'>poster source</a>` : ""}` : m._cover_kind === "youtube" ? `Official video thumbnail supplied by ${esc(m.full_video_source || m.trailer_source || "YouTube")}; linked to the verified upload.` : "CineDesi dark original fallback; no third-party poster reused.";
  const preserveFullPoster = ["cid-official-series", "crime-patrol-city-crimes-2026"].includes(String(m.slug || ""));
  root.innerHTML = `<section class='movie-hero'><div class='movie-art' ${m.poster_url ? `style="background-image:linear-gradient(#0003,#0008),url('${esc(m.poster_url)}'),url('${esc(posterArt(m))}');background-size:${preserveFullPoster ? "contain" : "cover"};background-repeat:no-repeat;background-position:center;background-color:#050506"` : ""}><span>${licensedPoster(m) ? "Licensed image" : m._cover_kind === "youtube" ? "Official video thumbnail" : "CineDesi dark cover"}</span></div><div class='movie-copy'><small>${esc(m.region)}</small><h1>${esc(m.title)}</h1><div class='modal-meta'><span>${esc(m.genre || "Film")}</span><span>${esc(m.release_year || "")}</span>${m.score ? `<span>CineDesi score ${esc(m.score)}</span>` : ""}</div>${titleFacts}<div class='badges'><span class='badge'>${m.rights_status === "cleared" ? "Rights cleared" : "Official links checked"}</span>${m.trailer_verified ? "<span class='badge'>Official trailer verified</span>" : ""}${m.watch_verified ? "<span class='badge'>Legal watch verified</span>" : ""}${m.full_video_verified && m.full_video_embed_url ? "<span class='badge'>Official full video on CineDesi</span>" : ""}${licensedPoster(m) ? "<span class='badge'>Licensed image</span>" : "<span class='badge'>CineDesi original cover</span>"}</div><p class='lead'>${esc(m.editorial || m.synopsis || "Editorial coming soon.")}</p>${castSection}${availabilityCallout}<div class='actions'>${trailer}${watch}<button id='share' class='ghost'>Share page</button></div><div class='source-card'><strong>Verification & source transparency</strong><br>Metadata: ${esc(m.source_name || "Verified source")}${m.source_license ? ` \u2022 ${esc(m.source_license)}` : ""}${m.source_url ? ` \u2022 <a target='_blank' rel='noopener' href='${esc(m.source_url)}'>source page</a>` : ""}${m.attribution_text ? `<br>Attribution: ${esc(m.attribution_text)}` : ""}${m.trailer_source ? `<br>Trailer source: ${esc(m.trailer_source)}` : ""}<br>Poster: ${posterLine}<br>Rights checked: ${esc(checked)}</div></div></section>${fullVideo}${providerSection}${upNextSection}${relatedSection}`;
  let youtubePlaylistPlayer = null;
  let pendingYoutubePlaylistIndex = null;

  const markEpisodeActive = (el) => {
    document.querySelectorAll("[data-episode]").forEach((item) => item.classList.toggle("active", item === el));
    document.querySelector("#watch")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const reverseYoutubePlaylistOrder =
    playlistGenerated &&
    Boolean(ytPlaylistId) &&
    /ARY\s+Digital/i.test(String(m.full_video_source || m.source_name || ""));

  const hydrateYoutubePlaylistCards = (videoIds) => {
    if (!Array.isArray(videoIds) || !videoIds.length) return [];
    const indexed = videoIds
      .map((videoId, sourceIndex) => ({ videoId: String(videoId || ""), sourceIndex }))
      .filter((item) => item.videoId);
    const ordered = reverseYoutubePlaylistOrder ? [...indexed].reverse() : indexed;
    document.querySelectorAll("[data-playlist-kind='youtube']").forEach((el, i) => {
      const item = ordered[i];
      const videoId = String(item?.videoId || "");
      if (!videoId) return;
      el.dataset.videoId = videoId;
      el.dataset.playlistIndex = String(Number(item.sourceIndex));
      el.dataset.episodeNumber = String(i + 1);
      const img = el.querySelector("img");
      if (img) img.src = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/mqdefault.jpg`;
      const strong = el.querySelector(".episode-copy strong");
      if (strong) strong.textContent = `Episode ${i + 1}`;
      const small = el.querySelector(".episode-copy small");
      if (small) small.textContent = "Official full episode";
    });
    return ordered;
  };

  const initYoutubePlaylistApi = () => {
    if (!playlistGenerated || !ytPlaylistId || !document.querySelector("#official-player")) return;
    const YT = window.YT;
    if (!YT?.Player) return;
    try {
      youtubePlaylistPlayer = new YT.Player("official-player", {
        events: {
          onReady: (event) => {
            const ids = event.target.getPlaylist?.() || [];
            const ordered = hydrateYoutubePlaylistCards(ids);
            if (pendingYoutubePlaylistIndex !== null) {
              event.target.playVideoAt?.(pendingYoutubePlaylistIndex);
              pendingYoutubePlaylistIndex = null;
            } else if (ordered.length) {
              const firstSourceIndex = Number(ordered[0].sourceIndex);
              const firstCard = document.querySelector("[data-playlist-kind='youtube'][data-episode='0']");
              if (firstCard) document.querySelectorAll("[data-episode]").forEach((item) => item.classList.toggle("active", item === firstCard));
              if (Number.isInteger(firstSourceIndex) && firstSourceIndex >= 0 && firstSourceIndex !== 0) {
                try {
                  event.target.cuePlaylist?.({
                    listType: "playlist",
                    list: ytPlaylistId,
                    index: firstSourceIndex
                  });
                } catch {}
              }
            }
          },
          onStateChange: (event) => {
            const idx = event.target.getPlaylistIndex?.();
            if (Number.isInteger(idx) && idx >= 0) {
              const card = document.querySelector(`[data-playlist-kind='youtube'][data-playlist-index='${idx}']`);
              if (card) document.querySelectorAll("[data-episode]").forEach((item) => item.classList.toggle("active", item === card));
            }
          }
        }
      });
    } catch {
    }
  };

  if (playlistGenerated && ytPlaylistId) {
    if (window.YT?.Player) {
      initYoutubePlaylistApi();
    } else {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        try { previousReady?.(); } catch {}
        initYoutubePlaylistApi();
      };
      if (!document.querySelector("script[data-cinedesi-youtube-api]")) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        script.dataset.cinedesiYoutubeApi = "1";
        document.head.appendChild(script);
      }
    }
  }

  if (playlistGenerated && dmPlaylistId) {
    const parseDailymotionEpisodeNumber = (title, total) => {
      const value = String(title || "").trim();
      const numbered =
        value.match(/\b(?:episode|ep)\s*[-_.:]?\s*(\d{1,3})\b/i) ||
        value.match(/\bS\d+\s*E(\d{1,3})\b/i);
      if (numbered) return Number(numbered[1]);
      if (/\b(?:2nd|second)\s+last\s+(?:episode|ep)\b/i.test(value)) return Math.max(1, total - 1);
      if (/\b(?:last|final)\s+(?:episode|ep)\b/i.test(value) || /\b(?:episode|ep)\s+(?:finale|final)\b/i.test(value)) return total;
      return null;
    };

    fetch(`https://api.dailymotion.com/playlist/${encodeURIComponent(dmPlaylistId)}/videos?fields=id,title,thumbnail_480_url&limit=100`)
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("Dailymotion playlist fetch failed")))
      .then((payload) => {
        const rawVideos = Array.isArray(payload?.list) ? payload.list.filter((video) => video?.id) : [];
        const total = Math.max(playlistEpisodeCount, rawVideos.length);
        const numbered = rawVideos.map((video, sourceIndex) => ({
          ...video,
          _sourceIndex: sourceIndex,
          _episodeNumber: parseDailymotionEpisodeNumber(video.title, total)
        }));

        const byEpisode = new Map();
        numbered.forEach((video) => {
          const n = Number(video._episodeNumber);
          if (Number.isInteger(n) && n > 0 && n <= total && !byEpisode.has(n)) byEpisode.set(n, video);
        });

        const orderedFallback = [...numbered].sort((a, b) => {
          const an = Number(a._episodeNumber);
          const bn = Number(b._episodeNumber);
          const aValid = Number.isInteger(an) && an > 0;
          const bValid = Number.isInteger(bn) && bn > 0;
          if (aValid && bValid) return an - bn;
          if (aValid) return -1;
          if (bValid) return 1;
          return a._sourceIndex - b._sourceIndex;
        });

        const cards = [...document.querySelectorAll("[data-playlist-kind='dailymotion']")];
        cards.forEach((el, i) => {
          const desiredEpisode = i + 1;
          const video = byEpisode.get(desiredEpisode) || orderedFallback[i];
          if (!video?.id) return;
          el.dataset.videoId = String(video.id);
          el.dataset.episodeNumber = String(desiredEpisode);
          const img = el.querySelector("img");
          if (img && video.thumbnail_480_url) img.src = String(video.thumbnail_480_url);
          const strong = el.querySelector(".episode-copy strong");
          if (strong) strong.textContent = `Episode ${desiredEpisode}`;
          const small = el.querySelector(".episode-copy small");
          if (small) small.textContent = "Official ARY Digital full episode";
        });

        const firstCard = cards[0];
        const player = document.querySelector("#official-player");
        const savedContinue = (() => {
          try {
            return JSON.parse(localStorage.getItem("cinedesi_continue") || "[]").find((x) => x.slug === m.slug);
          } catch {
            return null;
          }
        })();
        const resumeIndex = Number(savedContinue?.episode_index);
        const resumeCard = Number.isInteger(resumeIndex) && resumeIndex >= 0 ? cards[resumeIndex] : null;

        if (resumeCard?.dataset.videoId) {
          resumeCard.click();
        } else if (firstCard?.dataset.videoId && player) {
          player.src = `https://geo.dailymotion.com/player.html?video=${encodeURIComponent(firstCard.dataset.videoId)}&playlist=${encodeURIComponent(dmPlaylistId)}`;
          document.querySelectorAll("[data-episode]").forEach((item) => item.classList.toggle("active", item === firstCard));
        }
      })
      .catch(() => {});
  }

  document.querySelector("#trailer-link")?.addEventListener("click", () => track("trailer_click"));
  document.querySelector("#watch-link")?.addEventListener("click", () => track("watch_click"));
  document.querySelectorAll("[data-episode]").forEach((el) => el.addEventListener("click", () => {
    const videoId = String(el.dataset.videoId || "");
    const playlistId = String(el.dataset.playlistId || "");
    const playlistKind = String(el.dataset.playlistKind || "");
    const playlistIndex = Math.max(0, Number(el.dataset.playlistIndex || "0"));
    const player = document.querySelector("#official-player");

    if (playlistKind === "youtube" && playlistId) {
      if (youtubePlaylistPlayer?.playVideoAt) {
        youtubePlaylistPlayer.playVideoAt(playlistIndex);
      } else {
        pendingYoutubePlaylistIndex = playlistIndex;
        if (player) player.src = `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlistId)}&enablejsapi=1&origin=${encodeURIComponent(location.origin)}&index=${playlistIndex}&autoplay=1&rel=0`;
      }
    } else if (playlistKind === "dailymotion" && playlistId && videoId) {
      if (player) player.src = `https://geo.dailymotion.com/player.html?video=${encodeURIComponent(videoId)}&playlist=${encodeURIComponent(playlistId)}&autoplay=true`;
    } else if (player && videoId) {
      player.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
    } else {
      return;
    }

    markEpisodeActive(el);
    track("episode_play");
  }));
  document.querySelectorAll("[data-track-watch]").forEach((el) => el.addEventListener("click", () => {
    track("watch_click");
    trackDestination(el.dataset.provider || "Verified provider", el.dataset.destination || "");
  }));
  document.querySelectorAll("[data-rec-click]").forEach((el) => el.addEventListener("click", () => {
    track(String(el.dataset.recClick || "recommendation_click"));
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
    recent.unshift({ slug: m.slug, title: m.title, region: m.region, genre: m.genre, viewed_at: Date.now() });
    localStorage.setItem("cinedesi_recent", JSON.stringify(recent.slice(0, 12)));

    const savedContinue = JSON.parse(localStorage.getItem("cinedesi_continue") || "[]");
    const savedResume = savedContinue.find((x) => x.slug === m.slug);

    const markContinue = (episodeEl = null) => {
      if (!(m.full_video_verified && m.full_video_embed_url)) return;
      const activeEpisode = episodeEl?.dataset ? episodeEl : document.querySelector("[data-episode].active");
      const rawIndex = activeEpisode?.dataset?.episode;
      const rawNumber = activeEpisode?.querySelector?.(".episode-copy strong")?.textContent?.match(/Episode\s+(\d+)/i)?.[1];
      const episodeIndex = rawIndex === undefined ? null : Number(rawIndex);
      const episodeNumber = rawNumber ? Number(rawNumber) : episodeIndex !== null && Number.isFinite(episodeIndex) ? episodeIndex + 1 : null;
      const list = JSON.parse(localStorage.getItem("cinedesi_continue") || "[]").filter((x) => x.slug !== m.slug);
      list.unshift({
        slug: m.slug,
        title: m.title,
        region: m.region,
        genre: m.genre,
        episode_index: Number.isFinite(episodeIndex) ? episodeIndex : null,
        episode_number: Number.isFinite(episodeNumber) ? episodeNumber : null,
        updated_at: Date.now()
      });
      localStorage.setItem("cinedesi_continue", JSON.stringify(list.slice(0, 12)));
    };

    if (location.hash === "#watch") {
      const resumeIndex = Number(savedResume?.episode_index);
      if (dmPlaylistId) {
        if (!Number.isInteger(resumeIndex) || resumeIndex < 0) markContinue();
      } else if (Number.isInteger(resumeIndex) && resumeIndex >= 0) {
        setTimeout(() => {
          const resumeCard = document.querySelector(`[data-episode='${resumeIndex}']`);
          if (resumeCard) resumeCard.click();
          else markContinue();
        }, 250);
      } else {
        markContinue();
      }
    }
    document.querySelector("#official-player")?.addEventListener("load", () => {
      if (location.hash === "#watch" && !savedResume?.episode_index) markContinue();
    });
    document.querySelectorAll("[data-episode]").forEach((el) => el.addEventListener("click", () => markContinue(el)));
  } catch {
  }
}
