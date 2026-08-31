/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  BACK-COMPAT SHIM — do not add new code here.
 * ─────────────────────────────────────────────────────────────────────────────
 *  The canonical MedAlerto brand logo now lives in `src/components/BrandLogo.jsx`
 *  (<BrandLogo /> + <BrandLogoMark />). New headers must import from there.
 *
 *  This module only keeps the legacy `Logo` / `LogoMark` names alive for
 *  existing imports (e.g. src/booking/Logo.jsx).
 */
export { BrandLogoMark as LogoMark, BrandLogo as default } from "./BrandLogo";
