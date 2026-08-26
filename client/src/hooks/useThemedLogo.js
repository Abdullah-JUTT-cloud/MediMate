import { useEffect, useState } from "react";
import blackLogo from "../assets/black.png";
import whiteLogo from "../assets/white.png";

/**
 * Returns the correct MedAlerto logo based on the active theme.
 */
export default function useThemedLogo() {
  const [logo, setLogo] = useState(() => {
    const theme = document.documentElement.getAttribute("data-theme");
    return theme === "dark" ? whiteLogo : blackLogo;
  });

  useEffect(() => {
    const root = document.documentElement;

    const observer = new MutationObserver(() => {
      const theme = root.getAttribute("data-theme");
      setLogo(theme === "dark" ? whiteLogo : blackLogo);
    });

    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    const theme = root.getAttribute("data-theme");
    setLogo(theme === "dark" ? whiteLogo : blackLogo);

    return () => observer.disconnect();
  }, []);

  return logo;
}
