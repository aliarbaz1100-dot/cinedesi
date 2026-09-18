(() => {
  if (!("serviceWorker" in navigator)) return;

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js?v=28", {
        scope: "/",
        updateViaCache: "none",
      });
      await registration.update();
    } catch {
    }
  };

  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
})();
