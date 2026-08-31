import BrandLogo, { BrandLogoMark } from "../components/BrandLogo";

/**
 * Compatibility wrapper for the older booking module. It delegates to the
 * canonical BrandLogo component, which imports the official PNG assets:
 * black.png / white.png / fullblue.png.
 */
export function MedalertoMark({
  variant = "doctors",
  onDark = false,
  size = 40,
  className = "",
  alt = "MedAlerto logo",
}) {
  return (
    <BrandLogoMark
      variant={variant}
      onDark={onDark}
      size={size}
      alt={alt}
      className={`select-none object-contain ${className}`}
    />
  );
}

export default function MedalertoLogo({
  onDark = false,
  markSize = 40,
  variant = "doctors",
  subtitle,
  className = "",
}) {
  const resolvedSubtitle =
    subtitle ?? (variant === "patient" ? "PATIENT PORTAL" : "VERIFIED DOCTORS");

  return (
    <BrandLogo
      variant={variant}
      onDark={onDark}
      markSize={markSize}
      subtitle={resolvedSubtitle}
      className={className}
    />
  );
}
