import express from "express";
import { Doctor } from "../models/doctor.model.js";

const router = express.Router();

const SITE_URL = (process.env.SITE_URL || "https://medalerto.me").replace(/\/$/, "");

/** Static public pages — kept in sync with client/public/sitemap.xml. */
const STATIC_PAGES = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/book/doctors", changefreq: "daily", priority: "0.9" },
  { loc: "/features", changefreq: "monthly", priority: "0.8" },
  { loc: "/how-it-works", changefreq: "monthly", priority: "0.8" },
  { loc: "/pricing", changefreq: "monthly", priority: "0.8" },
  { loc: "/about-us", changefreq: "yearly", priority: "0.6" },
  { loc: "/contact", changefreq: "yearly", priority: "0.6" },
  { loc: "/faq", changefreq: "monthly", priority: "0.7" },
  { loc: "/blog", changefreq: "weekly", priority: "0.8" },
  { loc: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { loc: "/terms-of-service", changefreq: "yearly", priority: "0.3" },
  { loc: "/cookie-policy", changefreq: "yearly", priority: "0.3" },
];

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function lastmodISO(date) {
  if (!date) return null;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Approved doctors only — unverified/pending profiles must never be crawled. */
async function fetchApprovedDoctors() {
  try {
    const doctors = await Doctor.find({ verificationStatus: "APPROVED" })
      .select("_id fullName updatedAt")
      .lean();
    return doctors.map((d) => ({
      loc: `/book/doctors/${d._id}`,
      changefreq: "weekly",
      priority: "0.8",
      lastmod: lastmodISO(d.updatedAt) || undefined,
      name: d.fullName,
    }));
  } catch (error) {
    console.error("[sitemap] Failed to load doctors:", error.message);
    return [];
  }
}

function toXml(urls) {
  const entries = urls
    .map((u) => {
      const lines = [
        "  <url>",
        `    <loc>${escapeXml(`${SITE_URL}${u.loc}`)}</loc>`,
      ];
      if (u.lastmod) lines.push(`    <lastmod>${escapeXml(u.lastmod)}</lastmod>`);
      if (u.changefreq) lines.push(`    <changefreq>${escapeXml(u.changefreq)}</changefreq>`);
      if (u.priority) lines.push(`    <priority>${escapeXml(String(u.priority))}</priority>`);
      lines.push("  </url>");
      return lines.join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries}
</urlset>`;
}

/**
 * GET /sitemap.xml — dynamic XML sitemap (static pages + approved doctors).
 * Served with a short cache so new doctors appear in the sitemap quickly
 * without hammering MongoDB on every request.
 */
router.get("/sitemap.xml", async (req, res) => {
  const doctors = await fetchApprovedDoctors();
  const urls = [...STATIC_PAGES, ...doctors];
  res
    .status(200)
    .type("application/xml")
    .set("Cache-Control", "public, max-age=3600, s-maxage=3600")
    .send(toXml(urls));
});

/**
 * GET /api/public/sitemap — JSON feed consumed by client/scripts/generate-sitemap.mjs
 * to refresh the static public/sitemap.xml deployed with Cloudflare Pages.
 */
router.get("/api/public/sitemap", async (req, res) => {
  const doctors = await fetchApprovedDoctors();
  res.status(200).json({
    siteUrl: SITE_URL,
    generatedAt: new Date().toISOString(),
    count: STATIC_PAGES.length + doctors.length,
    urls: [
      ...STATIC_PAGES.map((u) => ({ ...u, loc: `${SITE_URL}${u.loc}` })),
      ...doctors.map((u) => ({ ...u, loc: `${SITE_URL}${u.loc}` })),
    ],
  });
});

/**
 * GET /robots.txt — mirrored on the API origin so crawlers pointed at the
 * domain (or api subdomain) always get valid directives.
 */
router.get("/robots.txt", (req, res) => {
  res
    .status(200)
    .type("text/plain")
    .set("Cache-Control", "public, max-age=3600")
    .send(`User-agent: *
Allow: /
Allow: /book
Allow: /book/doctors
Disallow: /dashboard
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`);
});

export default router;
