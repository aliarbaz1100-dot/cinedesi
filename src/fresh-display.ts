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

let observer: MutationObserver | null = null;
let scheduled = false;

const applyFreshDisplay = () => {
  scheduled = false;
  observer?.disconnect();
  updateHeadings();
  promote(document.querySelector<HTMLElement>("#top-grid"), freshPriority, 10, true);
  promote(document.querySelector<HTMLElement>("#new-grid"), allFreshPriority, 12, true);
  normalizeRailStyles();
  reorderUpcoming(document.querySelector<HTMLElement>("#coming-grid"));
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
