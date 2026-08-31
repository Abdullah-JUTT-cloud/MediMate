import { useEffect, useState } from "react";

/**
 * Returns the active app theme ("light" | "dark") by watching the
 * `data-theme` attribute on <html> (set by the app-level useTheme hook).
 *
 * Shared by every component that must swap a single asset with the theme
 * (e.g. the one-<img> MedAlerto logo) instead of rendering duplicates and
 * hiding one with CSS.
 */
const THEME_STORAGE_KEY = "medimate-theme";

function readStoredTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* localStorage unavailable — fall through */
  }
  return null;
}

function resolveTheme() {
  if (typeof document === "undefined") return "light";

  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;

  // Attribute not applied yet (e.g. before useTheme's mount effect).
  // Mirror useTheme's initial resolution so the very first paint already
  // picks the right asset: saved preference → OS preference → light.
  const stored = readStoredTheme();
  if (stored) return stored;
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

export default function useDataTheme() {
  const [theme, setTheme] = useState(resolveTheme);

  useEffect(() => {
    const root = document.documentElement;

    const observer = new MutationObserver(() => setTheme(resolveTheme()));
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}
