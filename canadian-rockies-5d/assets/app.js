/**
 * Tab switching & day accordion (TripPWA static shell).
 */
(function () {
  const tabs = Array.from(document.querySelectorAll("[data-trip-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-trip-section]"));

  function showTab(slug, trigger) {
    panels.forEach((p) => {
      p.hidden = p.getAttribute("data-trip-section") !== slug;
      p.classList.toggle("section--active", !p.hidden);
    });
    tabs.forEach((t) => {
      const on = t.getAttribute("data-trip-tab") === slug;
      t.classList.toggle("nav-tab--active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (trigger && history.replaceState) {
      history.replaceState(null, "", `#${slug}`);
    }
    try {
      localStorage.setItem("trip-pwa-last-tab", slug);
    } catch (_) {
      /* ignore */
    }
    if (trigger) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  tabs.forEach((t) =>
    t.addEventListener("click", () => showTab(t.getAttribute("data-trip-tab"), t))
  );

  const hash = window.location.hash.slice(1);
  const stored = (() => {
    try {
      return localStorage.getItem("trip-pwa-last-tab");
    } catch (_) {
      return null;
    }
  })();

  let initial =
    tabs.find((x) => x.getAttribute("data-trip-tab") === hash) ? hash : null;
  initial = initial || (tabs.find((x) => x.getAttribute("data-trip-tab") === stored) ? stored : null);
  if (!initial && tabs.length) initial = tabs[0].getAttribute("data-trip-tab");
  if (initial) showTab(initial, null);

  document.querySelectorAll("[data-toggle-day]").forEach((hdr) => {
    hdr.addEventListener("click", () => {
      const id = hdr.getAttribute("data-toggle-day");
      const card = id && document.getElementById(id);
      if (!card) return;
      card.classList.toggle("day-card--open");
      hdr.setAttribute("aria-expanded", card.classList.contains("day-card--open") ? "true" : "false");
    });
  });

  /* Service worker — only when served over http(s), not file:// */
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(new URL("./sw.js", window.location.href), {
        scope: new URL("./", window.location.href).pathname,
      });
    });
  }
})();
