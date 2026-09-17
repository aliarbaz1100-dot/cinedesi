const freshPriority = [
  "bigg-boss-20",
  "tamasha-season-5",
  "pakistan-idol-season-2-2025-2026",
  "pakistans-got-talent-2026",
  "ekaki-ashish-chanchlani",
  "indias-got-latent-season-2-2026"
];

const extraFreshPriority = [
  "dhurandhar-the-revenge-2026",
  "the-boys-season-5-2026",
  "the-night-agent-season-3-2026",
  "bridgerton-season-4-2026",
  "mirzapur-the-movie-2026",
  "dhamaal-4-2026"
];

const allFreshPriority = [...freshPriority, ...extraFreshPriority];

const slugFromCard = (card: Element | null) => {
  const link = card?.querySelector<HTMLAnchorElement>("a[href*='movie?slug=']");
  if (!link) return "";
  try {
    return new URL(link.href, location.href).searchParams.get("slug") || "";
  } catch {
    return "";
  }
};

const cardsIn = (root: Element | null) =>
  root ? Array.from(root.querySelectorAll<HTMLElement>(":scope > .card")) : [];

const cardMetaText = (card: Element | null) =>
  String(card?.querySelector(".info .muted")?.textContent || "").trim();

const cardReleaseYear = (card: Element | null) => {
  const match = cardMetaText(card).match(/\b(?:19|20)\d{2}\b/);
  return match ? Number(match[0]) : 0;
};

const isSeriesCard = (card: Element | null) => /^Series\b/i.test(cardMetaText(card));

const isWatchOnCinedesiCard = (card: Element | null) =>
  Boolean(card?.querySelector(".badge.watch-now")) ||
  Array.from(card?.querySelectorAll(".badge") || []).some((badge) => /watch here|watch on cinedesi/i.test(String(badge.textContent || "")));

const isUpcomingCard = (card: Element | null) =>
  Array.from(card?.querySelectorAll(".badge,.poster-ribbon") || []).some((node) => /coming soon|upcoming/i.test(String(node.textContent || "")));

const isExclusiveNewMovieCard = (card: Element | null) => {
  const currentYear = new Date().getFullYear();
  return Boolean(card) &&
    !isSeriesCard(card) &&
    cardReleaseYear(card) >= currentYear - 1 &&
    !isWatchOnCinedesiCard(card) &&
    !isUpcomingCard(card);
};

const findSourceCard = (slug: string, except?: Element | null) =>
  Array.from(document.querySelectorAll<HTMLElement>(".card"))
    .find((card) => card !== except && card.dataset.freshDisplayClone !== "1" && slugFromCard(card) === slug) || null;

const bridgeCloneActions = (clone: HTMLElement, slug: string) => {
  clone.dataset.freshDisplayClone = "1";
  clone.querySelectorAll<HTMLElement>("[data-save],[data-open]").forEach((control) => {
    control.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const attr = control.hasAttribute("data-save") ? "data-save" : "data-open";
      const value = control.getAttribute(attr);
      const source = findSourceCard(slug, clone);
      const target = source?.querySelector<HTMLElement>(`[${attr}='${CSS.escape(String(value || ""))}']`);
      target?.click();
    };
  });
};

const cloneCardForRail = (source: HTMLElement, slug: string) => {
  const clone = source.cloneNode(true) as HTMLElement;
  bridgeCloneActions(clone, slug);
  return clone;
};

const trimRail = (grid: HTMLElement, limit: number, protectedSlugs: Set<string>) => {
  let cards = cardsIn(grid);
  while (cards.length > limit) {
    const removable = [...cards].reverse().find((card) => !protectedSlugs.has(slugFromCard(card)));
    if (!removable) break;
    removable.remove();
    cards = cardsIn(grid);
  }
};

const promote = (grid: HTMLElement | null, slugs: string[], limit: number, allowClone: boolean) => {
  if (!grid) return;
  const protectedSlugs = new Set(slugs);
  const promoted: HTMLElement[] = [];

  for (const slug of slugs) {
    const existing = cardsIn(grid).find((card) => slugFromCard(card) === slug);
    if (existing) {
      promoted.push(existing);
      continue;
    }
    if (!allowClone) continue;
    const source = findSourceCard(slug, grid);
    if (source) promoted.push(cloneCardForRail(source, slug));
  }

  for (let index = promoted.length - 1; index >= 0; index -= 1) {
    grid.prepend(promoted[index]);
  }
  trimRail(grid, limit, protectedSlugs);
};

const discoverAllowsExclusiveNewMovies = () => {
  const heading = String(document.querySelector("#discover-title")?.textContent || "");
  const searchTerm = String((document.querySelector("#search") as HTMLInputElement | null)?.value || "").trim();
  return Boolean(searchTerm) || /new.*(?:release|movie|season|trend)|(?:release|movie|season|trend).*new/i.test(heading);
};

const removeExclusiveNewMovieCards = (root: Element | null) => {
  cardsIn(root).forEach((card) => {
    if (isExclusiveNewMovieCard(card)) card.remove();
  });
};

const pruneExclusiveNewMoviesFromHome = () => {
  [
    "#top-grid",
    "#binge-grid",
    "#verified-grid",
    "#series-grid",
    "#pakistan-grid",
    "#bollywood-grid",
    "#south-grid"
  ].forEach((selector) => removeExclusiveNewMovieCards(document.querySelector(selector)));

  document.querySelectorAll("#genre-rails .genre-rail").forEach((rail) => removeExclusiveNewMovieCards(rail));

  const discoverGrid = document.querySelector("#grid");
  if (!discoverAllowsExclusiveNewMovies()) removeExclusiveNewMovieCards(discoverGrid);
};

const isSouthCard = (card: Element | null) => {
  const region = String(card?.querySelector(".poster-region")?.textContent || "").trim();
  return /^(?:South|South Indian|India\s*\/\s*South Indian)$/i.test(region);
};

const fillSouthRail = () => {
  const southGrid = document.querySelector<HTMLElement>("#south-grid");
  if (!southGrid || cardsIn(southGrid).length >= 8) return;

  const existingSlugs = new Set(cardsIn(southGrid).map(slugFromCard).filter(Boolean));
  const candidateGroups = [
    Array.from(document.querySelectorAll<HTMLElement>("#genre-rails .genre-rail > .card")),
    Array.from(document.querySelectorAll<HTMLElement>("#top-grid > .card")),
    Array.from(document.querySelectorAll<HTMLElement>("#grid > .card"))
  ];
  const candidates = candidateGroups.flat().filter((card) => {
    const slug = slugFromCard(card);
    return slug &&
      !existingSlugs.has(slug) &&
      isSouthCard(card) &&
      isWatchOnCinedesiCard(card) &&
      !isUpcomingCard(card) &&
      !isExclusiveNewMovieCard(card);
  });

  for (const card of candidates) {
    if (cardsIn(southGrid).length >= 8) break;
    const slug = slugFromCard(card);
    if (!slug || existingSlugs.has(slug)) continue;
    existingSlugs.add(slug);
    card.classList.remove("top-card");
    card.removeAttribute("data-rank");
    const seeAll = southGrid.querySelector(":scope > .see-all-card");
    if (seeAll) southGrid.insertBefore(card, seeAll);
    else southGrid.append(card);
  }
};

const normalizeRailStyles = () => {
  const topGrid = document.querySelector<HTMLElement>("#top-grid");
  const newGrid = document.querySelector<HTMLElement>("#new-grid");
  cardsIn(topGrid).forEach((card, index) => {
    card.classList.add("top-card");
    card.dataset.rank = String(index + 1);
  });
  cardsIn(newGrid).forEach((card) => {
    card.classList.remove("top-card");
    card.removeAttribute("data-rank");
  });
};

const reorderUpcoming = (grid: HTMLElement | null) => {
  if (!grid) return;
  const current = cardsIn(grid);
  const priority = new Map(allFreshPriority.map((slug, index) => [slug, index]));
  current
    .sort((a, b) => (priority.get(slugFromCard(a)) ?? 999) - (priority.get(slugFromCard(b)) ?? 999))
    .forEach((card) => grid.append(card));
};

const updateHeadings = () => {
  const newHeading = document.querySelector<HTMLElement>("#new-releases h2");
  const newEyebrow = document.querySelector<HTMLElement>("#new-releases small");
  const comingHeading = document.querySelector<HTMLElement>("#coming-soon h2");
  const comingEyebrow = document.querySelector<HTMLElement>("#coming-soon small");
  if (newHeading) newHeading.textContent = "New Movies & Seasons";
  if (newEyebrow) newEyebrow.textContent = "FRESH & TRENDING";
  if (comingHeading) comingHeading.textContent = "Upcoming Movies & Seasons";
  if (comingEyebrow) comingEyebrow.textContent = "COMING NEXT";
};

let heroSkipHops = 0;
const skipExclusiveNewMovieHero = () => {
  const heroLink = document.querySelector<HTMLAnchorElement>("#hero-showcase a[href*='movie?slug=']");
  if (!heroLink) return;
  const meta = String(document.querySelector("#hero-meta")?.textContent || "");
  const eyebrow = String(document.querySelector("#hero-eyebrow")?.textContent || "");
  const yearMatch = meta.match(/\b(?:19|20)\d{2}\b/);
  const year = yearMatch ? Number(yearMatch[0]) : 0;
  const currentYear = new Date().getFullYear();
  const isSeries = /\bSeries\b|\bSeason\s*\d+\b|\d+\s+Seasons?\b/i.test(meta);
  const isWatchOnCinedesi = /WATCH ON CINEDESI/i.test(eyebrow);
  const isExclusive = !isSeries && year >= currentYear - 1 && !isWatchOnCinedesi;

  if (!isExclusive) {
    heroSkipHops = 0;
    return;
  }

  const dots = Array.from(document.querySelectorAll<HTMLButtonElement>("#hero-showcase [data-hero-dot]"));
  if (dots.length <= 1 || heroSkipHops >= dots.length) return;
  const activeIndex = Math.max(0, dots.findIndex((dot) => dot.classList.contains("active")));
  heroSkipHops += 1;
  dots[(activeIndex + 1) % dots.length]?.click();
};

let observer: MutationObserver | null = null;
let scheduled = false;

const applyFreshDisplay = () => {
  scheduled = false;
  observer?.disconnect();
  updateHeadings();
  promote(document.querySelector<HTMLElement>("#top-grid"), freshPriority, 10, true);
  promote(document.querySelector<HTMLElement>("#new-grid"), allFreshPriority, 12, true);
  pruneExclusiveNewMoviesFromHome();
  fillSouthRail();
  normalizeRailStyles();
  reorderUpcoming(document.querySelector<HTMLElement>("#coming-grid"));
  skipExclusiveNewMovieHero();
  if (observer) {
    const app = document.querySelector("#app");
    if (app) observer.observe(app, { childList: true, subtree: true });
  }
};

const scheduleFreshDisplay = () => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => requestAnimationFrame(applyFreshDisplay));
};

const startFreshDisplay = () => {
  const app = document.querySelector("#app");
  if (!app) return;
  observer = new MutationObserver(scheduleFreshDisplay);
  observer.observe(app, { childList: true, subtree: true });
  scheduleFreshDisplay();
  setTimeout(scheduleFreshDisplay, 1800);
  setTimeout(scheduleFreshDisplay, 4500);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startFreshDisplay, { once: true });
} else {
  startFreshDisplay();
}
