import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import MetaTags from "./MetaTags.jsx";
import { SITE, ROUTE_SEO, NOINDEX_PATHS, clampTitle } from "../../seo/seoConfig.js";
import {
  organizationSchema,
  websiteSchema,
  webApplicationSchema,
  aboutPageSchema,
  contactPageSchema,
  blogSchema,
  breadcrumbSchema,
  faqSchema,
} from "../../seo/jsonLd.js";
import { trackPageView } from "../../lib/analytics.js";

const SCHEMA_BUILDERS = {
  organization: organizationSchema,
  website: websiteSchema,
  webapp: webApplicationSchema,
  about: aboutPageSchema,
  contact: contactPageSchema,
  blog: blogSchema,
  faq: () => faqSchema([]),
};

const NOINDEX_TITLES = {
  "/dashboard": "Clinic Dashboard | MedAlerto",
  "/queue": "Patient Queue | MedAlerto",
  "/patient-chat": "Patient Chat | MedAlerto",
  "/admin": "Admin | MedAlerto",
  "/payment": "Payment | MedAlerto",
  "/book/dashboard": "My Appointments | MedAlerto",
};

function prettify(value = "") {
  return String(value)
    .replace(/[_+]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function resolveRouteMeta(pathname, search) {
  // Internal / auth-only pages are never indexed.
  for (const prefix of NOINDEX_PATHS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const title = NOINDEX_TITLES[prefix] || `MedAlerto — ${prettify(prefix.replace(/^\//, ""))}`;
      return {
        title,
        description: SITE.description,
        keywords: SITE.keywords,
        path: pathname,
        noindex: true,
        schemas: {},
      };
    }
  }

  // Doctor profile: the page itself injects the Physician rich snippet.
  if (/^\/book\/doctors\/[^/]+$/.test(pathname)) {
    return {
      title: "Verified Doctor Profile & Online Booking | MedAlerto",
      description:
        "View a verified doctor's qualifications, clinic schedule and patient ratings, then book an appointment online with MedAlerto.",
      keywords: "verified doctors Pakistan, doctor profile, book doctor online, MedAlerto",
      path: pathname,
      schemas: {},
    };
  }

  // Public review submission (token-based, no auth). Single-use token URLs
  // must never enter search indexes.
  if (/^\/review\/[^/]+$/.test(pathname)) {
    return {
      title: "Share Your Clinic Visit Feedback | MedAlerto",
      description: "Rate your clinic visit and share feedback to help other patients choose verified doctors.",
      keywords: SITE.keywords,
      path: pathname,
      noindex: true,
      schemas: {},
    };
  }

  const exact = ROUTE_SEO[pathname];
  if (exact) {
    const schemas = {};
    if (pathname === "/book/doctors") {
      const params = new URLSearchParams(search);
      const specialization = prettify(params.get("specialization"));
      const name = prettify(params.get("name"));
      let title = exact.title;
      if (specialization) title = `Find ${specialization}s in Pakistan & Book Online | MedAlerto`;
      else if (name) title = `${name} — Verified Doctors in Pakistan | MedAlerto`;
      schemas.breadcrumb = breadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Find Doctors", path: "/book/doctors" },
      ]);
      return { ...exact, title: clampTitle(title, 62), schemas };
    }

    (exact.schemas || []).forEach((key) => {
      const build = SCHEMA_BUILDERS[key];
      if (build) schemas[key] = build();
    });

    if (exact.path !== "/") {
      schemas.breadcrumb = breadcrumbSchema([
        { name: "Home", path: "/" },
        { name: prettify(exact.path.replace("/", "").split("/")[0]), path: exact.path },
      ]);
    }
    return { ...exact, schemas };
  }

  // Unknown path → fall back to the homepage brand metadata.
  return { ...ROUTE_SEO["/"] };
}

/**
 * SeoRouteManager — mounts once at the app root, inside BrowserRouter.
 * Keeps the document head in sync with client-side navigation and reports
 * GA4 virtual pageviews for every route change.
 */
export default function SeoRouteManager() {
  const location = useLocation();
  const meta = resolveRouteMeta(location.pathname, location.search);

  useEffect(() => {
    trackPageView(location.pathname + location.search, meta.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  // Href-lang/alternates are not needed (single locale); canonical is key.
  return (
    <MetaTags
      title={meta.title}
      description={meta.description}
      keywords={meta.keywords}
      path={meta.path}
      ogType={meta.type || "website"}
      schemas={meta.schemas}
      noindex={meta.noindex}
    />
  );
}
