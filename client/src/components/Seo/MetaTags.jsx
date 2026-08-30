import { useEffect } from "react";
import { applyHeadMeta, applyJsonLd, cleanupManagedMeta } from "../../seo/head.js";
import { SITE, canonicalUrl } from "../../seo/seoConfig.js";

/**
 * MetaTags — SPA head manager.
 *
 * Renders no visible DOM. On mount / prop change it hydrates the <head> with:
 *   • title, description, keywords, robots, canonical
 *   • Open Graph + Twitter Card overrides (defaults from index.html)
 *   • JSON-LD schemas passed via `schemas` ({ key: object })
 *
 * Usage:
 *   <MetaTags title="..." description="..." path="/features" schemas={{ faq: faqSchema(...) }} />
 *
 * The component is intentionally idempotent so it is safe under React
 * StrictMode and when multiple pages mount/unmount during navigation.
 */
export default function MetaTags({
  title,
  description,
  keywords,
  path = "/",
  image = SITE.image,
  ogType = "website",
  schemas = {},
  noindex = false,
}) {
  useEffect(() => {
    const finalTitle = title || SITE.title;
    const finalDescription = description || SITE.description;
    const finalKeywords = keywords || SITE.keywords;

    applyHeadMeta({
      title: finalTitle,
      description: finalDescription,
      keywords: finalKeywords,
      canonical: canonicalUrl(path),
      image,
      ogType,
      ogTitle: finalTitle,
      ogDescription: finalDescription,
      noindex,
    });

    Object.entries(schemas || {}).forEach(([key, data]) => {
      if (data) applyJsonLd(key, data);
    });

    return () => cleanupManagedMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, keywords, path, image, ogType, noindex, JSON.stringify(schemas ?? {})]);

  return null;
}
