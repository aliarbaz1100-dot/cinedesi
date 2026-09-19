/* True mobile app tabs, isolated from the regular CineDesi website.
   Each tab shows the existing live catalog sections; no mock catalog or copies. */
const initInstalledAppTabs = () => {
  if (!document.documentElement.classList.contains("cd-app-installed") ||
      !window.matchMedia("(max-width: 760px)").matches) return;
  const body = document.body;
  const header = document.querySelector(".catalog-header");
  const nav = document.querySelector(".mobile-bottom-nav");
  if (!body?.classList.contains("home-body") || !header || !nav) return;

  const currentView = () => {
    if (header.classList.contains("search-mode")) return "search";
    if (location.hash === "#watchlist") return "list";
    if (location.hash === "#top-today" || location.hash === "#new-releases") return "new";
    return "home";
  };
  const updateView = (resetScroll = false) => {
    const view = currentView();
    if (body.dataset.cdAppView !== view) {
      body.dataset.cdAppView = view;
      if (resetScroll) window.requestAnimationFrame(() => window.scrollTo(0, 0));
    }
  };
  const closeSearch = () => {
    const close = document.querySelector("#search-close");
    if (header.classList.contains("search-mode") && close) close.click();
  };

  nav.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener("click", () => {
      closeSearch();
      // Even tapping the currently selected tab returns to its top.
      window.requestAnimationFrame(() => {
        updateView(true);
        window.scrollTo(0, 0);
      });
    });
  });
  nav.querySelector("#bottom-search")?.addEventListener("click", () => {
    window.requestAnimationFrame(() => updateView(true));
  });
  document.querySelector("#search-close")?.addEventListener("click", () => {
    window.requestAnimationFrame(() => updateView(true));
  });
  window.addEventListener("hashchange", () => updateView(true), { passive: true });
  window.addEventListener("pageshow", () => updateView(false), { passive: true });
  updateView(false);
};
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initInstalledAppTabs, { once: true });
} else initInstalledAppTabs();
