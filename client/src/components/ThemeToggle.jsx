import { useEffect, useRef, useState } from "react";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M21 13.2A9 9 0 1 1 10.8 3a7 7 0 1 0 10.2 10.2Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export default function ThemeToggle({ theme, onToggle }) {
  const [showHint, setShowHint] = useState(true);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!showHint) return undefined;

    const closeHintOnAnyClick = () => {
      setShowHint(false);
    };

    document.addEventListener("pointerdown", closeHintOnAnyClick, true);
    return () => {
      document.removeEventListener("pointerdown", closeHintOnAnyClick, true);
    };
  }, [showHint]);

  return (
    <div ref={rootRef} className="fixed bottom-4 right-4 z-40 md:bottom-6 md:right-6">
      {showHint && (
        <div className="absolute bottom-12 right-0 w-64 rounded-xl border bg-[var(--color-card)] p-3 text-xs text-[var(--color-text-secondary)] shadow-lg">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setShowHint(false);
            }}
            // Fix the plain-text close glyph so the dismiss control renders as a consistent icon in every font stack.
            className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-md text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg)]"
            aria-label="Close theme tip"
          >
            <CloseIcon />
          </button>

          <p className="pr-6 font-semibold text-[var(--color-text-primary)]">Theme Switch</p>
          <p className="mt-1 leading-relaxed">Use this switch to change between light and dark theme.</p>

          <span className="absolute -bottom-2 right-3 h-3 w-3 rotate-45 border-b border-r bg-[var(--color-card)]" />
        </div>
      )}

      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-[var(--color-card)] text-[var(--color-text-primary)] shadow-sm transition hover:border-[var(--color-primary)]"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  );
}
