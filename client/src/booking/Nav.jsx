import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";

/**
 * Sticky glass-morphism top bar shared by all three portal pages.
 * Children are laid out as left / center / right zones.
 */
export function GlassBar({ children, className = "" }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-slate-200/70 ma-glass",
        className
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </header>
  );
}

/**
 * Slide-in navigation drawer for mobile. Renders a dimmed overlay + right-side
 * panel; closes on Escape, overlay click, or the explicit close button.
 */
export function MobileDrawer({ open, onClose, children, label = "Menu" }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={cn("fixed inset-0 z-50 lg:hidden", !open && "pointer-events-none")}
      aria-hidden={!open}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          "absolute right-0 top-0 flex h-full w-[82%] max-w-sm flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-slate-700 dark:bg-slate-900",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {label}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </aside>
    </div>
  );
}
