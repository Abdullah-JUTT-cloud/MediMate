/**
 * MedAlerto — head-manipulation primitives for SPA SEO.
 *
 * All functions are idempotent and safe under React StrictMode (mount →
 * cleanup → mount). Managed tags are tagged `data-seo-managed="true"` so
 * cleanup only removes what this session created; tags that already existed
 * statically in index.html are updated in place and restored on cleanup.
 */

const MANAGED_ATTR = "data-seo-managed";
const JSONLD_ATTR = "data-seo-jsonld";

/** Original textContent of static JSON-LD blocks, keyed by schema key. */
const jsonLdOriginals = new Map();
const titleOriginals = new Map();

function head() {
  return document.head;
}

function findMeta(nameOrProp, value) {
  return head().querySelector(`meta[${nameOrProp}="${value}"]`);
}

function upsertMeta(attr, key, content) {
  const existed = Boolean(findMeta(attr, key));
  let el = findMeta(attr, key);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    head().appendChild(el);
  }
  el.setAttribute("content", content || "");
  // Only tags this module created are cleaned up on unmount; tags already
  // present in index.html are updated in place and persist.
  if (!existed) el.setAttribute(MANAGED_ATTR, "true");
  return el;
}

function upsertLink(rel, href) {
  let el = head().querySelector(`link[rel="${rel}"]`);
  const existed = Boolean(el);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    head().appendChild(el);
  }
  el.setAttribute("href", href || "");
  if (!existed) el.setAttribute(MANAGED_ATTR, "true");
  return el;
}

/**
 * Apply the page title + core meta tags. Pass `noindex: true` for auth-only
 * or internal pages that must never be crawled.
 */
export function applyHeadMeta({
  title,
  description,
  keywords,
  canonical,
  image,
  ogType = "website",
  ogTitle,
  ogDescription,
  twitterTitle,
  twitterDescription,
  noindex = false,
} = {}) {
  if (!titleOriginals.has("title")) titleOriginals.set("title", document.title);
  document.title = title || document.title;

  if (description) upsertMeta("name", "description", description);
  if (keywords) upsertMeta("name", "keywords", keywords);

  if (canonical) upsertLink("canonical", canonical);
  if (noindex) {
    upsertMeta("name", "robots", "noindex, nofollow, noarchive");
  } else {
    upsertMeta(
      "name",
      "robots",
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    );
  }

  if (ogType) upsertMeta("property", "og:type", ogType);
  if (ogTitle ?? title) upsertMeta("property", "og:title", ogTitle ?? title);
  if (ogDescription ?? description) upsertMeta("property", "og:description", ogDescription ?? description);
  if (canonical) upsertMeta("property", "og:url", canonical);
  if (image) {
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:image:secure_url", image);
    upsertMeta("property", "og:image:alt", `MedAlerto — ${title || "clinic workflow & doctor discovery"}`);
    upsertMeta("property", "og:image:width", "1200");
    upsertMeta("property", "og:image:height", "630");
  }
  upsertMeta("name", "twitter:card", "summary_large_image");
  if (twitterTitle ?? title) upsertMeta("name", "twitter:title", twitterTitle ?? title);
  if (twitterDescription ?? description) upsertMeta("name", "twitter:description", twitterDescription ?? description);
  if (image) {
    upsertMeta("name", "twitter:image", image);
    upsertMeta("name", "twitter:image:alt", `MedAlerto — ${title || "clinic workflow & doctor discovery"}`);
  }
}

/**
 * Upsert a JSON-LD block keyed by `key`. Static blocks shipped in index.html
 * (organization, website, webapp) are updated in place and restored on
 * cleanup; dynamic blocks are created and removed with the component.
 */
export function applyJsonLd(key, data) {
  if (!key || !data) return;
  const id = `seo-jsonld-${key}`;
  let script = head().querySelector(`script[${JSONLD_ATTR}="${key}"]`);
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute(JSONLD_ATTR, key);
    script.setAttribute(MANAGED_ATTR, "true");
    head().appendChild(script);
  }
  if (!jsonLdOriginals.has(key)) {
    jsonLdOriginals.set(key, script.textContent || "");
  }
  script.id = id;
  script.textContent = JSON.stringify(data);
}

/** Remove managed tags created by MetaTags (mount cleanup). */
export function cleanupManagedMeta() {
  head().querySelectorAll(`[${MANAGED_ATTR}="true"]`).forEach((el) => el.remove());

  // Restore static JSON-LD blocks that were updated in place.
  jsonLdOriginals.forEach((original, key) => {
    const script = head().querySelector(`script[${JSONLD_ATTR}="${key}"]`);
    if (script && !script.hasAttribute(MANAGED_ATTR)) {
      script.textContent = original;
    }
  });

  const originalTitle = titleOriginals.get("title");
  if (originalTitle) document.title = originalTitle;
}
