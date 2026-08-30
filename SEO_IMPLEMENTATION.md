# MedAlerto — Comprehensive SEO Implementation

Audit + refactor of the MedAlerto codebase to add SEO optimization, Open Graph,
Google Search Console verification, GA4 tracking, dynamic sitemaps and
rich-snippet JSON-LD schema.

> Canonical production origin: `https://medalerto.me` · API origin: `https://api.medalerto.me`
> Frontend: React + Vite (Cloudflare Pages) · Backend: Express + MongoDB

---

## 1. What was implemented

### Master head metadata & Open Graph — `client/index.html`
- Title: **`MedAlerto — Premier Clinic Workflow & Doctor Discovery Platform`**
- Canonical: `https://medalerto.me/`
- Meta description, keywords, author, robots (max-image-preview:large), googlebot
- Full Open Graph set (`og:type/site_name/title/description/url/image/image:width/height/alt/locale`)
- Full Twitter Card set (`summary_large_image`)
- Per-route hydration handled by `client/src/components/Seo/MetaTags.jsx` +
  `SeoRouteManager.jsx` (SPA titles/canonicals/OG overrides on every route change)

### Google Search Console verification
- `client/index.html` ships `<meta name="google-site-verification" content="%VITE_GOOGLE_SITE_VERIFICATION%" />`
- Vite replaces `%VITE_*%` at build time from `client/.env` (see `client/.env.example`)
- If the variable is not configured, the placeholder meta is removed at runtime

### Google Analytics 4
- Boot snippet in `client/index.html`, gated on a valid `G-XXXXXXX` measurement ID
  (no-op in dev / when unset)
- Consent defaults (`analytics_storage: granted`, ad storage denied)
- `client/src/lib/analytics.js`: `trackPageView`, `trackEvent`, `updateConsent`
- `SeoRouteManager` fires GA4 **virtual pageviews** on every SPA route change
- Funnel events already instrumented: `doctor_search`, `doctor_profile_view`
- Configure via `VITE_GA4_MEASUREMENT_ID` in `client/.env`

### Crawler directives — `client/public/robots.txt`
Exactly the requested rules (+ `Sitemap:` line), deployed at `https://medalerto.me/robots.txt`.

### Dynamic XML sitemap
- **Server (dynamic):** `server/routes/sitemap.routes.js`
  - `GET /sitemap.xml` — static pages + **approved doctor profile URLs** with
    `lastmod`, `changefreq`, `priority`; cached 1 hour
  - `GET /api/public/sitemap` — JSON feed consumed by the static generator
  - `GET /robots.txt` — mirrored directives on the API origin
  - Mounted in `server/server.js`; configurable via `SITE_URL` (see `server/.env.example`)
- **Client (static fallback):** `client/public/sitemap.xml` — 12 core URLs
- **Generator:** `client/scripts/generate-sitemap.mjs` syncs the static file
  with the API feed; runs automatically at the start of `npm run build`
  (also available standalone as `npm run sitemap`); failures never break the
  build — the committed static fallback is kept

### Rich snippets (JSON-LD) — `client/src/seo/jsonLd.js`
| Schema | Where |
|---|---|
| `Organization` | `index.html` + every page |
| `WebSite` (+ `SearchAction`) | `index.html` + every page |
| `WebApplication` | `index.html` + landing |
| `FAQPage` | `/faq` (all 50+ questions) |
| `Physician` (rating, hours, address) | `/book/doctors/:id` |
| `BreadcrumbList` | static pages + doctor profiles |
| `Blog` / `BlogPosting` | `/blog` (+ article reader modal) |
| `ContactPage` / `AboutPage` | `/contact`, `/about-us` |

### Route metadata matrix — `client/src/seo/seoConfig.js`
Every public route has a unique title/description/keywords/canonical.
Auth-only and internal routes (`/dashboard`, `/queue`, `/admin`, `/payment`,
`/book/dashboard`, auth flows) are marked `noindex, nofollow`.

### Social image — `client/public/og-image.png`
1200×630 branded card generated and referenced by OG/Twitter/JSON-LD.

---

## 2. Post-deploy checklist

1. **Client env** — create `client/.env` from `client/.env.example`:
   - `VITE_GOOGLE_SITE_VERIFICATION=<token from GSC HTML tag>`
   - `VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX`
2. **Server env** — set `SITE_URL=https://medalerto.me` in the API server env.
3. **Build & deploy** frontend to Cloudflare Pages (`npm run build`); deploy API.
4. **Verify (live):**
   - `curl -I https://medalerto.me/robots.txt` → `200`
   - `curl -I https://medalerto.me/sitemap.xml` → `200`
   - `curl https://api.medalerto.me/sitemap.xml` → XML includes doctor URLs
   - `curl https://medalerto.me/` → titles, canonical, OG, JSON-LD present
5. **Google Search Console:** add property `https://medalerto.me` → verification
   auto-detects the HTML tag; submit `https://medalerto.me/sitemap.xml`.
6. **GA4:** confirm realtime traffic after a `npm run sitemap`-independent page
   view; check `page_view` events include `page_path` for SPA routes.
7. **Rich results test:** run
   <https://search.google.com/test/rich-results> against `/`, `/faq`, a doctor
   profile and a blog article URL.

---

## 3. Notes for future work

- Doctor profile `lastmod` uses the doctor document's `updatedAt` — profiles
  are re-crawled as they change.
- If blog article detail pages get their own routes, add them to
  `STATIC_PAGES` (server) and the sitemap generator feed — the
  `blogPostingSchema` builder is already route-agnostic.
- Publish time-based pages (e.g. `BlogPosting`) only after HTTPS + canonical
  are confirmed live — duplicated canonical URLs will split crawl signals.
