#!/usr/bin/env node
/**
 * MedAlerto — static sitemap generator.
 *
 * Fetches the dynamic sitemap feed from the API origin
 * (server/routes/sitemap.routes.js → GET /api/public/sitemap) and regenerates
 * client/public/sitemap.xml so Cloudflare Pages always deploys a fresh
 * sitemap that includes verified doctor profiles.
 *
 * If the API is unreachable (local builds, offline CI), the committed static
 * fallback is left untouched and the build continues.
 *
 * Config (optional):
 *   SITEMAP_SOURCE  — default https://api.medalerto.me/api/public/sitemap
 *   SITE_URL        — fallback site base URL (default https://medalerto.me)
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "../public");
const OUTPUT = path.join(PUBLIC_DIR, "sitemap.xml");

const SITE_URL = (process.env.SITE_URL || "https://medalerto.me").replace(/\/$/, "");
const SOURCE = process.env.SITEMAP_SOURCE || "https://api.medalerto.me/api/public/sitemap";

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toXml(urls) {
  const entries = urls
    .map((u) => {
      const lines = ["  <url>", `    <loc>${escapeXml(u.loc)}</loc>`];
      if (u.lastmod) lines.push(`    <lastmod>${escapeXml(u.lastmod)}</lastmod>`);
      if (u.changefreq) lines.push(`    <changefreq>${escapeXml(u.changefreq)}</changefreq>`);
      if (u.priority) lines.push(`    <priority>${escapeXml(String(u.priority))}</priority>`);
      lines.push("  </url>");
      return lines.join("\n");
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

async function main() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(SOURCE, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "MedAlerto-Sitemap-Generator/1.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    const urls = (payload.urls || []).filter((u) => u?.loc);

    // Normalise API-relative URLs to absolute for the static file.
    const absolute = urls.map((u) => ({
      ...u,
      loc: u.loc.startsWith("http") ? u.loc : `${SITE_URL}${u.loc}`,
    }));

    if (!absolute.length) throw new Error("Empty sitemap feed");
    await writeFile(OUTPUT, toXml(absolute), "utf8");
    console.log(`[sitemap] Generated ${absolute.length} URLs → ${path.relative(process.cwd(), OUTPUT)}`);
  } catch (error) {
    console.warn(
      `[sitemap] Could not refresh from ${SOURCE} (${error.message || error}). Keeping static fallback — build continues.`,
    );
  } finally {
    clearTimeout(timer);
  }
}

main();
