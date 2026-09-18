(() => {
  const KEY = "cinedesi-consent-v1";
  const existing = localStorage.getItem(KEY);
  const updateConsent = (choice) => {
    const analyticsGranted = choice === "analytics";
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: analyticsGranted ? "granted" : "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied"
      });
    }
    window.dispatchEvent(new CustomEvent("cinedesi:consent", { detail: { choice } }));
  };
  const removeBanner = () => document.querySelector("#cinedesi-consent-banner")?.remove();
  const saveChoice = (choice) => {
    localStorage.setItem(KEY, choice);
    updateConsent(choice);
    removeBanner();
  };
  const showBanner = () => {
    removeBanner();
    const banner = document.createElement("aside");
    banner.id = "cinedesi-consent-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Privacy choices");
    banner.innerHTML = `
      <div class="cc-copy"><strong>Privacy choices</strong><span>CineDesi uses essential storage for site features. You can also allow Google Analytics to help us improve performance. Advertising storage stays off until CineDesi launches ads with the required consent controls.</span><a href="/privacy.html">Privacy policy</a></div>
      <div class="cc-actions"><button type="button" data-consent="essential">Essential only</button><button type="button" class="primary" data-consent="analytics">Allow analytics</button></div>
    `;
    const style = document.createElement("style");
    style.id = "cinedesi-consent-style";
    style.textContent = `
      #cinedesi-consent-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:10050;display:flex;gap:18px;align-items:center;justify-content:space-between;max-width:980px;margin:auto;padding:16px 18px;border:1px solid #303239;border-radius:16px;background:#111216f2;color:#f4f4f5;box-shadow:0 18px 60px #000a;backdrop-filter:blur(18px);font:500 13px/1.45 Arial,sans-serif}
      #cinedesi-consent-banner .cc-copy{display:grid;gap:5px;max-width:700px}#cinedesi-consent-banner strong{font-size:14px}#cinedesi-consent-banner span{color:#b4b7bf}#cinedesi-consent-banner a{color:#e6e7eb}
      #cinedesi-consent-banner .cc-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}#cinedesi-consent-banner button{border:1px solid #42454d;border-radius:999px;background:#1b1d22;color:#fff;padding:9px 13px;font-weight:800;cursor:pointer}#cinedesi-consent-banner button.primary{background:#e50914;border-color:#e50914}
      @media(max-width:720px){#cinedesi-consent-banner{left:10px;right:10px;bottom:10px;align-items:stretch;flex-direction:column}#cinedesi-consent-banner .cc-actions{justify-content:stretch}#cinedesi-consent-banner button{flex:1}}
    `;
    if (!document.querySelector("#cinedesi-consent-style")) document.head.appendChild(style);
    banner.addEventListener("click", (event) => {
      const button = event.target.closest("[data-consent]");
      if (!button) return;
      saveChoice(button.dataset.consent);
    });
    document.body.appendChild(banner);
  };

  window.cinedesiPrivacyChoices = () => {
    localStorage.removeItem(KEY);
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied"
      });
    }
    showBanner();
  };

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-privacy-choices]")) {
      event.preventDefault();
      window.cinedesiPrivacyChoices();
    }
  });

  if (existing) updateConsent(existing);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", showBanner, { once: true });
  else showBanner();
})();
