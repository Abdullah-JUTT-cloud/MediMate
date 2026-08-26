import { useEffect, useRef, useState } from "react";

/**
 * Resolves — before the first paint — whether the reveal animation should be
 * skipped entirely. Content must never be trapped behind an animation that
 * cannot run, so both reduced-motion users and environments without
 * IntersectionObserver start out visible.
 */
function shouldSkipReveal() {
  if (typeof window === "undefined") return true;
  if (typeof IntersectionObserver === "undefined") return true;
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Reveals a section once it scrolls into the viewport.
 *
 * Returns a ref to attach to the section root plus an `isVisible` flag so the
 * caller can drive a purely CSS-based entrance (no layout thrash, no JS
 * animation loop). The observer disconnects after the first intersection, so
 * the animation never replays on scroll-back.
 */
export default function useRevealOnScroll({
  threshold = 0.15,
  rootMargin = "0px 0px -10% 0px",
} = {}) {
  const ref = useRef(null);
  // Lazy initialiser: the skip decision is made during the first render rather
  // than in an effect, which keeps this to a single render pass.
  const [isVisible, setIsVisible] = useState(shouldSkipReveal);

  useEffect(() => {
    const node = ref.current;
    if (!node || isVisible) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, isVisible]);

  return [ref, isVisible];
}
