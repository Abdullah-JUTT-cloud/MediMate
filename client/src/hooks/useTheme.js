import { useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "medimate-theme";

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function useTheme() {
  const initialSavedTheme = useMemo(
    () => localStorage.getItem(THEME_STORAGE_KEY),
    [],
  );

  const [theme, setTheme] = useState(initialSavedTheme || getSystemTheme());
  const [isSystemControlled, setIsSystemControlled] =
    useState(!initialSavedTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    if (!isSystemControlled) {
      return undefined;
    }

    const handleChange = (event) => {
      setTheme(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [isSystemControlled]);

  const toggleTheme = () => {
    setIsSystemControlled(false);
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === "light" ? "dark" : "light";
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      return nextTheme;
    });
  };

  return { theme, toggleTheme };
}
