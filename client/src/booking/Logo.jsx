import { BrandLogoMark as LogoMark } from "../components/BrandLogo";

/**
 * Official MedAlerto mark for the booking portal — rendered from the unified
 * SVG brand logo (src/components/BrandLogo.jsx) instead of the legacy PNG rasters.
 * `variant="auto"` follows the app theme; "light" / "dark" force a specific
 * surface palette (e.g. a white mark on a gradient hero).
 */
export function MedalertoMark({
  variant = "auto",
  size = 40,
  className = "",
  alt = "MedAlerto logo",
}) {
  const resolvedVariant =
    variant === "dark" ? "dark" : variant === "light" ? "light" : "auto";

  return (
    <LogoMark
      variant={resolvedVariant}
      size={size}
      alt={alt}
      className={`h-auto w-auto select-none object-contain ${className}`}
    />
  );
}

/**
 * Full portal lockup: unified SVG mark + "MedAlerto" wordmark + a
 * "PATIENT PORTAL" badge. `onDark` flips the wordmark/badge colours for dark
 * or gradient bars.
 */
export default function MedalertoLogo({
  onDark = false,
  markSize = 40,
  badge = "Patient Portal",
  subtitle = "Verified Doctors",
  className = "",
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <MedalertoMark
        variant={onDark ? "dark" : "auto"}
        size={markSize}
        className="shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.10)]"
      />
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-2">
          <span
            className={`font-extrabold tracking-tight ${
              onDark ? "text-white" : "text-slate-900 dark:text-white"
            } text-lg`}
          >
            MedAlerto
          </span>
          {badge && (
            <span className="hidden min-[400px]:inline-flex items-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-sm shadow-violet-500/30">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <span
            className={`mt-1 hidden text-[9px] font-bold uppercase tracking-[0.22em] sm:block ${
              onDark ? "text-indigo-200/90" : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
