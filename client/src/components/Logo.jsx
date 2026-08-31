/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Unified MedAlerto SVG brand logo
 * ─────────────────────────────────────────────────────────────────────────────
 *  Single source of truth for the brand mark + wordmark lockup used in the
 *  public headers (homepage navbar, doctors directory, doctor profile).
 *
 *  The mark is a crisp inline SVG rebuilt from the official
 *  `medalerto-wordmark-*.svg` assets shipped in `client/src/assets`, so it
 *  stays sharp at every size and recolours itself for light / dark mode via
 *  the app's `[data-theme]` attribute (Tailwind's `dark:` variant is bound to
 *  that attribute in src/index.css). It intentionally replaces the legacy PNG
 *  rasters (black.png / white.png) in headers and any ad-hoc placeholder
 *  marks (e.g. a lone "M" tile).
 *
 *  Variants:
 *    "auto"  (default)  follows the active theme
 *    "light"            forces the light-surface palette (dark monogram)
 *    "dark"             forces the dark-surface palette (white monogram,
 *                       e.g. on a gradient hero)
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Official "M" monogram path from the shipped brand SVG (viewBox 0 0 108 108). */
const MARK_MONOGRAM =
  "M24 77V30.5C24 27.4624 26.4624 25 29.5 25H36.5L54 60.5L71.5 25H78.5C81.5376 25 84 27.4624 84 30.5V77H72V42.6L58.7 68.3C57.3634 70.5267 54.6318 71.7834 52.0694 71.6403C49.507 71.4972 46.9286 69.9729 45.8 67.5L31.4 42.2V77H24Z";

/** Sky accent bar under the monogram — the brand's constant accent colour. */
const MARK_ACCENT =
  "M18 83H90C91.6569 83 93 84.3431 93 86V91C93 92.6569 91.6569 94 90 94H18C16.3431 94 15 92.6569 15 91V86C15 84.3431 16.3431 83 18 83Z";

/* Theme-aware fills — full literal class strings so Tailwind's scanner finds
   every utility (never built via concatenation). */
const MARK_FILLS = {
  auto: {
    tile: "fill-slate-200 dark:fill-slate-900",
    mono: "fill-slate-900 dark:fill-slate-50",
  },
  light: {
    tile: "fill-slate-200",
    mono: "fill-slate-900",
  },
  dark: {
    tile: "fill-slate-900",
    mono: "fill-slate-50",
  },
};

const WORDMARK_TEXT = {
  auto: "text-slate-900 dark:text-white",
  light: "text-slate-900",
  dark: "text-white",
};

const SUBTITLE_TEXT = {
  auto: "text-slate-400 dark:text-slate-500",
  light: "text-slate-400",
  dark: "text-slate-300",
};

/**
 * Square logomark only (rounded tile + "M" monogram + sky accent bar).
 *
 * @param {object} props
 * @param {"auto" | "light" | "dark"} [props.variant="auto"] Theme variant.
 * @param {number} [props.size=40] Mark width/height in pixels.
 * @param {string} [props.className] Extra classes applied to the <svg>.
 * @param {string} [props.alt="MedAlerto logo"] Accessible label ("" = decorative).
 */
export function LogoMark({
  variant = "auto",
  size = 40,
  className = "",
  alt = "MedAlerto logo",
}) {
  const fills = MARK_FILLS[variant] ?? MARK_FILLS.auto;
  const decorative = !alt;

  return (
    <svg
      viewBox="0 0 108 108"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : alt}
      className={`shrink-0 select-none ${className}`}
    >
      {!decorative && <title>{alt}</title>}
      <rect x="0" y="0" width="108" height="108" rx="28" className={fills.tile} />
      <path d={MARK_MONOGRAM} className={fills.mono} />
      <path d={MARK_ACCENT} className="fill-sky-500" />
    </svg>
  );
}

/**
 * Full brand lockup: logomark + "MedAlerto" wordmark + optional subtitle
 * (e.g. "Verified Doctors").
 *
 * @param {object} props
 * @param {"auto" | "light" | "dark"} [props.variant="auto"] Theme variant.
 * @param {number} [props.markSize=40] Logomark width/height in pixels.
 * @param {string} [props.wordmark="MedAlerto"] Wordmark text.
 * @param {string} [props.subtitle=""] Optional tiny uppercase caption under the wordmark.
 * @param {string} [props.className] Extra classes for the lockup row.
 * @param {string} [props.markClassName] Extra classes for the logomark.
 * @param {string} [props.wordmarkClassName] Extra classes for the wordmark text.
 * @param {string} [props.subtitleClassName] Extra classes for the subtitle text.
 */
export default function Logo({
  variant = "auto",
  markSize = 40,
  wordmark = "MedAlerto",
  subtitle = "",
  className = "",
  markClassName = "",
  wordmarkClassName = "",
  subtitleClassName = "",
}) {
  const text = WORDMARK_TEXT[variant] ?? WORDMARK_TEXT.auto;
  const sub = SUBTITLE_TEXT[variant] ?? SUBTITLE_TEXT.auto;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark
        variant={variant}
        size={markSize}
        className={`drop-shadow-[0_4px_10px_rgba(0,0,0,0.10)] ${markClassName}`}
      />
      <div className="flex min-w-0 flex-col leading-none">
        <span
          className={`font-heading text-lg font-extrabold tracking-tight ${text} ${wordmarkClassName}`}
        >
          {wordmark}
        </span>
        {subtitle ? (
          <span
            className={`mt-1 text-[9px] font-bold uppercase tracking-[0.22em] ${sub} ${subtitleClassName}`}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}
