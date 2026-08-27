import { Toaster, ToastIcon, resolveValue } from "react-hot-toast";

/**
 * Global toast system — theme-aware, high-contrast in Light & Dark mode.
 *
 * react-hot-toast's default toast bar ships a white background with inline
 * styles, which made toasts unreadable in dark mode. This component takes
 * full ownership of the toast markup via the <Toaster> render-prop so every
 * variant is styled with explicit Tailwind classes that react to the app's
 * dark-mode selector (`[data-theme="dark"]` on <html>, bound to `dark:` via
 * the @custom-variant rule in index.css).
 *
 * Variant contract:
 *  - error    → red surface,     bg-red-50     / dark:bg-red-950/90
 *  - success  → emerald surface, bg-emerald-50 / dark:bg-emerald-950/90
 *  - info     → slate surface (blank/loading/custom toasts), always dark
 *               with light text so it reads as "neutral notice" in both themes
 *
 * Wrapper guard: the toast container is forced to z-[9999] and each card uses
 * backdrop-blur-md. No parent background (no bg-white) wraps the toasts — the
 * container itself is fully transparent.
 */

const VARIANT_STYLES = {
  error: {
    container:
      "bg-red-50 dark:bg-red-950/90 border border-red-200 dark:border-red-800 shadow-xl",
    text: "text-red-900 dark:text-red-100 font-medium",
    icon: "text-red-600 dark:text-red-400",
  },
  success: {
    container:
      "bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-200 dark:border-emerald-800 shadow-xl",
    text: "text-emerald-900 dark:text-emerald-100 font-medium",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  // blank / loading / custom toasts all resolve to the info treatment.
  info: {
    container:
      "bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 border border-slate-700 shadow-xl",
    text: "text-slate-100 font-medium",
    icon: "text-slate-100",
  },
};

function variantFor(type) {
  if (type === "error") return VARIANT_STYLES.error;
  if (type === "success") return VARIANT_STYLES.success;
  return VARIANT_STYLES.info; // blank | loading | custom → info/warning look
}

function ToastCard({ t }) {
  const variant = variantFor(t.type);

  return (
    <div
      {...t.ariaProps}
      data-toast-type={t.type}
      className={[
        "pointer-events-auto flex w-full items-center gap-3 rounded-xl px-4 py-3",
        "backdrop-blur-md transition-all duration-200 ease-out",
        t.visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-2 scale-95 opacity-0",
        variant.container,
      ].join(" ")}
      style={{ maxWidth: "min(28rem, calc(100vw - 1.5rem))", width: "100%" }}
    >
      {/* ToastIcon renders the animated check/error/spinner (or a custom
          `icon` option); tinted per-variant for contrast in both themes. */}
      <span className={`shrink-0 ${variant.icon}`}>
        <ToastIcon toast={t} />
      </span>
      <div className={`min-w-0 flex-1 text-[0.8125rem] leading-snug ${variant.text}`}>
        {resolveValue(t.message, t)}
      </div>
    </div>
  );
}

export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      gutter={10}
      /* Z-index & positioning guard: transparent wrapper, no bg-white, sits
         above every sticky header/modal at z-[9999]. Top offset keeps toasts
         below sticky headers (safe-area + header height). */
      containerClassName="z-[9999]!"
      containerStyle={{
        top: "calc(env(safe-area-inset-top, 0px) + 6rem)",
        zIndex: 9999,
        background: "transparent",
      }}
      toastOptions={{
        duration: 2600,
        // Icon colors for the built-in animated icons (light/dark safe).
        success: {
          iconTheme: { primary: "currentColor", secondary: "#ecfdf5" },
        },
        error: {
          duration: 4000,
          iconTheme: { primary: "currentColor", secondary: "#fef2f2" },
        },
      }}
    >
      {(t) => <ToastCard t={t} />}
    </Toaster>
  );
}
