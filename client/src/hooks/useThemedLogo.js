import blackLogo from "../assets/black.png";
import whiteLogo from "../assets/white.png";
import useDataTheme from "./useDataTheme";

/**
 * Returns the correct MedAlerto logo based on the active theme:
 * white.png in dark mode, black.png in light mode.
 */
export default function useThemedLogo() {
  const theme = useDataTheme();
  return theme === "dark" ? whiteLogo : blackLogo;
}
