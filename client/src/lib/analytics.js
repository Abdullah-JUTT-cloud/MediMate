/**
 * MedAlerto — Google Analytics 4 helpers.
 *
 * GA4 is booted from client/index.html only when VITE_GA4_MEASUREMENT_ID is set
 * to a real G-XXXXXXX ID. All calls in this module are no-ops when GA4 is not
 * configured, so the SPA never throws or leaks data outside of production.
 */

function gaId() {
  return typeof window !== "undefined" ? window.__MEDALERTO_GA4_ID__ : null;
}

function ready() {
  return typeof window !== "undefined" && typeof window.gtag === "function" && Boolean(gaId());
}

/**
 * Track a virtual page view for SPA route changes. Called by SeoRouteManager
 * after each navigation so GA4 reports the real destination (not just /).
 */
export function trackPageView(path, title) {
  if (!ready()) return;
  window.gtag("event", "page_view", {
    page_path: path || window.location.pathname,
    page_title: title || document.title || window.location.pathname,
    page_location: window.location.href,
    send_page_view: true,
  });
}

/** Track a custom event (CTA click, doctor-search, booking funnel, etc.). */
export function trackEvent(name, params = {}) {
  if (!ready()) return;
  window.gtag("event", name, { page_path: window.location.pathname, ...params });
}

/** Grant/deny analytics storage (call from a consent banner when added). */
export function updateConsent({ analyticsStorage = "granted", adStorage = "denied" } = {}) {
  if (!ready()) return;
  window.gtag("consent", "update", {
    analytics_storage: analyticsStorage,
    ad_storage: adStorage,
  });
}

export function isAnalyticsEnabled() {
  return ready();
}
