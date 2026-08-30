/**
 * MedAlerto — central SEO configuration.
 *
 * Single source of truth for the brand name, canonical site URL, default
 * Open Graph image and per-route metadata. Both `MetaTags.jsx` (DOM) and
 * `SeoRouteManager.jsx` (router) read from here so titles, descriptions,
 * canonicals and schemas stay consistent across the SPA.
 */

export const SITE = {
  name: "MedAlerto",
  altName: "MedAlert",
  careName: "MedAlerto Care",
  url: "https://medalerto.me",
  title: "MedAlerto — Premier Clinic Workflow & Doctor Discovery Platform",
  shortTitle: "MedAlerto — Clinic Workflow & Doctor Discovery",
  description:
    "MedAlerto unifies digital prescriptions, queue management, live patient tracking, and verified doctor appointment bookings into a single, seamless clinic platform.",
  keywords:
    "MedAlerto, MedAlert, MedAlerto Care, doctor booking Pakistan, online clinic software, patient queue management, electronic digital prescriptions",
  image: "https://medalerto.me/og-image.png",
  email: "hello@medalerto.me",
  supportEmail: "support@medalerto.me",
  phone: "+923214194045",
  locale: "en_US",
};

const base = SITE.url.replace(/\/$/, "");

/** Build an absolute canonical URL for an app path. */
export function canonicalUrl(path = "/") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath === "/" ? "/" : cleanPath}`;
}

/** Trim a title to Google's ~60 character display limit without breaking mid-word. */
export function clampTitle(title, max = 60) {
  if (!title || title.length <= max) return title;
  const cut = title.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Per-route route metadata. Every public route is intentionally mapped so no
 * SPA page is served with a generic title. Dynamic patterns (doctor profile,
 * review submission) are resolved by `SeoRouteManager`.
 */
export const ROUTE_SEO = {
  "/": {
    title: SITE.title,
    description: SITE.description,
    keywords: SITE.keywords,
    path: "/",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website", "webapp"],
  },
  "/home": {
    title: SITE.title,
    description: SITE.description,
    keywords: SITE.keywords,
    path: "/",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website", "webapp"],
  },
  "/features": {
    title: "Clinic Software Features — Digital Prescriptions & Queue Management | MedAlerto",
    description:
      "Explore MedAlerto's clinic platform features: digital prescriptions, live queue management, patient tracking, appointments, WhatsApp delivery and more.",
    keywords: SITE.keywords,
    path: "/features",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website"],
  },
  "/how-it-works": {
    title: "How MedAlerto Works — Clinic Workflow in 3 Steps | MedAlerto",
    description:
      "From consultation to digital prescription and patient queue — see how MedAlerto streamlines the entire clinic workflow for doctors and front-desk staff.",
    keywords: SITE.keywords,
    path: "/how-it-works",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website"],
  },
  "/pricing": {
    title: "Clinic Software Pricing — Simple Monthly & Annual Plans | MedAlerto",
    description:
      "Transparent MedAlerto pricing for clinics. No setup fee, no hidden charges — monthly and annual plans with free onboarding for your clinic team.",
    keywords: "MedAlerto pricing, clinic software price Pakistan, doctor clinic software monthly plan, MedAlert",
    path: "/pricing",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website"],
  },
  "/about-us": {
    title: "About MedAlerto — The Clinic Workflow & Doctor Discovery Platform",
    description:
      "MedAlerto is built for Pakistani clinics: unified prescriptions, queue management, live patient tracking and verified doctor discovery in one platform.",
    keywords: SITE.keywords,
    path: "/about-us",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website", "about"],
  },
  "/contact": {
    title: "Contact MedAlerto — Support, Sales & Clinic Onboarding",
    description:
      "Contact the MedAlerto team for support, pricing or clinic onboarding. Reach us by email, phone or WhatsApp — we respond during clinic business hours.",
    keywords: "MedAlerto contact, MedAlert support, clinic software help Pakistan",
    path: "/contact",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website", "contact"],
  },
  "/faq": {
    title: "MedAlerto FAQ — Clinic Workflow, Prescriptions & Support Answers",
    description:
      "Answers to the most common MedAlerto questions: setup, pricing, digital prescriptions, queue management, patient records, security and support.",
    keywords: "MedAlerto FAQ, MedAlert help, clinic software questions Pakistan",
    path: "/faq",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website", "faq"],
  },
  "/blog": {
    title: "MedAlerto Blog — Clinic Engineering, Queue Architecture & Practice Insights",
    description:
      "Engineering deep-dives and practice insights from the MedAlerto team: queue architecture, WhatsApp APIs, clinic billing, security and patient flow.",
    keywords: "MedAlerto blog, clinic engineering, queue architecture, digital prescription engineering",
    path: "/blog",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website", "blog"],
  },
  "/privacy-policy": {
    title: "Privacy Policy | MedAlerto",
    description: "How MedAlerto collects, uses and protects clinic and patient data under its privacy policy.",
    keywords: SITE.keywords,
    path: "/privacy-policy",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website"],
  },
  "/terms-of-service": {
    title: "Terms of Service | MedAlerto",
    description: "MedAlerto terms of service governing clinic accounts, subscriptions, bookings and platform use.",
    keywords: SITE.keywords,
    path: "/terms-of-service",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website"],
  },
  "/cookie-policy": {
    title: "Cookie Policy | MedAlerto",
    description: "How MedAlerto uses cookies and analytics to improve the clinic platform experience.",
    keywords: SITE.keywords,
    path: "/cookie-policy",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website"],
  },
  "/book/doctors": {
    title: "Find Verified Doctors & Book Appointments Online | MedAlerto",
    description:
      "Search verified doctors in Pakistan, compare specializations and ratings, check live clinic schedules and book appointments online with MedAlerto.",
    keywords: "doctor booking Pakistan, find doctor online, verified doctors Pakistan, book appointment clinic, MedAlerto doctors",
    path: "/book/doctors",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website"],
  },
  "/book/login": {
    title: "Patient Login — Manage Appointments | MedAlerto",
    description: "Log in to your MedAlerto patient account to manage bookings, queue status and appointment history.",
    keywords: SITE.keywords,
    path: "/book/login",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website"],
  },
  "/book/register": {
    title: "Create Patient Account — Book Clinics Online | MedAlerto",
    description: "Create a free MedAlerto patient account to book verified doctors and receive digital prescriptions.",
    keywords: SITE.keywords,
    path: "/book/register",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website"],
  },
  "/book/verify-email": {
    title: "Verify Email | MedAlerto",
    description: "Verify your email address to activate your MedAlerto patient account.",
    keywords: SITE.keywords,
    path: "/book/verify-email",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website"],
  },
  "/review": {
    title: "Share Your Visit Feedback | MedAlerto",
    description: "Rate your clinic visit and share feedback to help other patients choose verified doctors.",
    keywords: SITE.keywords,
    path: "/review/:token",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website"],
  },
  "/login": {
    title: "Doctor Login | MedAlerto",
    description: "Secure login for MedAlerto doctors and clinic staff.",
    keywords: SITE.keywords,
    path: "/login",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website"],
  },
  "/signup": {
    title: "Create Clinic Account | MedAlerto",
    description: "Register your clinic on MedAlerto and start managing prescriptions, queues and appointments.",
    keywords: SITE.keywords,
    path: "/signup",
    type: "website",
    image: SITE.image,
    schemas: ["organization", "website"],
  },
};

/** Private/internal pages: crawlable paths get `noindex` via the router. */
export const NOINDEX_PATHS = [
  "/dashboard",
  "/queue",
  "/patient-chat",
  "/admin",
  "/payment",
  "/settings",
  "/book/dashboard",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/verify-reset-otp",
  "/patient-login",
];
