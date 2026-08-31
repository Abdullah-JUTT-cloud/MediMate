import blackLogo from "../assets/black.png";
import whiteLogo from "../assets/white.png";
import fullBlueLogo from "../assets/fullblue.png";
import useDataTheme from "../hooks/useDataTheme";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  <BrandLogo /> — single reusable MedAlerto logo component
 * ─────────────────────────────────────────────────────────────────────────────
 *  All header/brand surfaces must use the official PNG files shipped in
 *  client/src/assets (no generic square "M" placeholders):
 *    • home / marketing headers (light): black.png
 *    • home / marketing headers (dark):  white.png
 *    • ALL /book/* patient-portal pages (dashboard, doctors directory,
 *      doctor profile, …):                fullblue.png
 *
 *  SINGLE-LOGO GUARANTEE: this component renders exactly ONE <img> — never
 *  two side-by-side copies hidden/shown with CSS. The theme swap for the
 *  marketing logo is done by switching the `src` (via useDataTheme), which
 *  cannot break regardless of Tailwind utility ordering in the compiled CSS.
 *
 *  The source PNGs include transparent padding. The helper below keeps the
 *  rendered visual mark near the requested 32–40px header height by cropping
 *  that padding in an overflow-hidden wrapper while still loading the exact
 *  repository asset via <img>.
 */

const BRAND_LOGO_ASSETS = {
  black: blackLogo,
  white: whiteLogo,
  fullblue: fullBlueLogo,
};

const WORDMARK_TEXT = {
  auto: "text-slate-900 dark:text-white",
  home: "text-slate-900 dark:text-white",
  light: "text-slate-900",
  dark: "text-white",
  portal: "text-[#0f4f95] dark:text-sky-200",
};

const SUBTITLE_TEXT = {
  auto: "text-slate-400 dark:text-slate-500",
  home: "text-slate-400 dark:text-slate-500",
  light: "text-slate-400",
  dark: "text-slate-300",
  portal: "text-[#0f4f95] dark:text-sky-200",
};

const LOGO_CROP = {
  // black.png / white.png: visible glyph bbox is ~276px inside a 500px canvas.
  mark: {
    canvasScale: 500 / 276,
    widthRatio: 1,
  },
  // fullblue.png: visible lockup bbox is ~420×82px inside a 500×500 canvas.
  // Use a little horizontal breathing room so antialiased edges never clip.
  full: {
    canvasScale: 500 / 82,
    widthRatio: 440 / 82,
  },
};

/**
 * Resolve a variant to one of three render modes:
 *   "portal"  → fullblue.png lockup (every /book/* patient-portal page)
 *   "light"   → black.png
 *   "dark"    → white.png
 *   "auto"/"home" → light or dark, following the live data-theme attribute.
 *
 * Note: "doctors" is folded into "portal" on purpose — per the branding
 * rules, every route under /book/* (including /book/doctors and doctor
 * profiles) shows the fullblue MedAlerto lockup.
 */
function normalizeVariant(variant, onDark = false) {
  if (onDark) return "dark";

  switch (variant) {
    case "dark":
    case "white":
      return "dark";
    case "light":
    case "black":
      return "light";
    case "patient":
    case "portal":
    case "doctors":
      return "portal";
    case "home":
    case "auto":
    default:
      return "auto";
  }
}

function LogoImage({ src, assetName, size, full = false, imageClassName = "" }) {
  const crop = full ? LOGO_CROP.full : LOGO_CROP.mark;
  const wrapperWidth = Math.round(size * crop.widthRatio);
  const canvasSize = Math.ceil(size * crop.canvasScale);

  return (
    <span
      className="relative inline-flex shrink-0 overflow-hidden align-middle"
      style={{ width: `${wrapperWidth}px`, height: `${size}px` }}
      data-medalerto-logo-wrapper={assetName}
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        draggable={false}
        decoding="async"
        data-medalerto-logo={assetName}
        className={`absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 select-none object-contain ${imageClassName}`}
        style={{ width: `${canvasSize}px`, height: `${canvasSize}px` }}
      />
    </span>
  );
}

/**
 * Official MedAlerto image mark/lockup — always exactly ONE <img>.
 *
 * @param {object} props
 * @param {"auto" | "home" | "doctors" | "patient" | "light" | "dark"} [props.variant="home"]
 * @param {boolean} [props.onDark=false] Force the white logo, useful on dark/gradient sections.
 * @param {number} [props.size=40] Desired visible logo height in pixels.
 * @param {string} [props.className] Extra classes for the cropped logo wrapper.
 * @param {string} [props.imageClassName] Extra classes for the underlying <img>.
 * @param {string} [props.alt="MedAlerto logo"] Accessible label ("" = decorative).
 */
export function BrandLogoMark({
  variant = "home",
  onDark = false,
  size = 40,
  className = "",
  imageClassName = "",
  alt = "MedAlerto logo",
}) {
  // "auto"/"home" follow the live data-theme attribute; the other variants
  // are static, but the hook is cheap and keeps every instance consistent.
  const theme = useDataTheme();
  const resolvedVariant = normalizeVariant(variant, onDark);

  const assetName =
    resolvedVariant === "portal"
      ? "fullblue"
      : resolvedVariant === "dark" || (resolvedVariant === "auto" && theme === "dark")
        ? "white"
        : "black";

  const accessibilityProps = alt
    ? { role: "img", "aria-label": alt }
    : { "aria-hidden": "true" };

  return (
    <span className={`inline-flex shrink-0 ${className}`} {...accessibilityProps}>
      <LogoImage
        src={BRAND_LOGO_ASSETS[assetName]}
        assetName={assetName}
        size={size}
        full={resolvedVariant === "portal"}
        imageClassName={imageClassName}
      />
    </span>
  );
}

/**
 * Full brand lockup: official image + optional text/subtitle.
 *
 * Portal variant (all /book/* pages) intentionally uses fullblue.png as the
 * visible lockup and does not duplicate the MedAlerto wordmark in text by
 * default. Pass showWordmark={true} only for special layouts that need
 * additional text.
 */
export default function BrandLogo({
  variant = "home",
  onDark = false,
  markSize = 40,
  wordmark = "MedAlerto",
  subtitle = "",
  showWordmark,
  className = "",
  markClassName = "",
  imageClassName = "",
  wordmarkClassName = "",
  subtitleClassName = "",
}) {
  const resolvedVariant = normalizeVariant(variant, onDark);
  const text = WORDMARK_TEXT[resolvedVariant] ?? WORDMARK_TEXT.auto;
  const sub = SUBTITLE_TEXT[resolvedVariant] ?? SUBTITLE_TEXT.auto;
  const shouldShowWordmark = showWordmark ?? resolvedVariant !== "portal";
  const hasTextColumn = shouldShowWordmark || Boolean(subtitle);
  const markAlt = shouldShowWordmark ? "" : `${wordmark} logo`;

  if (resolvedVariant === "portal" && !shouldShowWordmark) {
    return (
      <div className={`flex min-w-0 items-center ${className}`}>
        <div className="flex min-w-0 flex-col items-start leading-none">
          <BrandLogoMark
            variant="patient"
            size={markSize}
            alt={markAlt}
            className={`drop-shadow-[0_4px_10px_rgba(15,79,149,0.18)] ${markClassName}`}
            imageClassName={imageClassName}
          />
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

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <BrandLogoMark
        variant={resolvedVariant}
        size={markSize}
        alt={shouldShowWordmark ? "" : markAlt}
        className={`drop-shadow-[0_4px_10px_rgba(0,0,0,0.10)] ${markClassName}`}
        imageClassName={imageClassName}
      />
      {hasTextColumn ? (
        <div className="flex min-w-0 flex-col leading-none">
          {shouldShowWordmark ? (
            <span
              className={`font-heading text-lg font-extrabold tracking-tight ${text} ${wordmarkClassName}`}
            >
              {wordmark}
            </span>
          ) : null}
          {subtitle ? (
            <span
              className={`mt-1 text-[9px] font-bold uppercase tracking-[0.22em] ${sub} ${subtitleClassName}`}
            >
              {subtitle}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
