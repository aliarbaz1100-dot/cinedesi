(() => {
  const ID = "G-J9HJVSKXVD";
  const CONSENT_KEY = "cinedesi-consent-v1";
  let loaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  const isQaTraffic = () => {
    try {
      if (location.hostname !== "cinedesi.online" && location.hostname !== "www.cinedesi.online") return true;
      const params = new URLSearchParams(location.search);
      const qaKeys = ["audit", "launch-audit", "qa", "test", "replacement", "r50"];
      return qaKeys.some((key) => params.has(key));
    } catch {
      return false;
    }
  };

  const allowed = () => {
    if (isQaTraffic()) return false;
    try { return localStorage.getItem(CONSENT_KEY) === "analytics"; }
    catch { return false; }
  };

  const load = () => {
    if (loaded || !allowed()) return;
    loaded = true;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ID)}`;
    script.dataset.cinedesiAnalytics = "1";
    document.head.appendChild(script);

    window.gtag("js", new Date());
    window.gtag("config", ID, {
      send_page_view: true,
      allow_google_signals: false
    });
  };

  const schedule = () => {
    if (!allowed()) return;
    if ("requestIdleCallback" in window) window.requestIdleCallback(load, { timeout: 2200 });
    else setTimeout(load, 900);
  };

  window.addEventListener("cinedesi:consent", (event) => {
    if (event.detail?.choice === "analytics") load();
  });

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
})();
