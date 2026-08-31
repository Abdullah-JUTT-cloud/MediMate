import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { surface, gradient, type, a11y } from "./theme";
import { cn } from "./cn";

/* ────────────────────────────────────────────────────────────────────────────
 * Button — primary (brand gradient + glow), outline, ghost, soft & danger.
 * ──────────────────────────────────────────────────────────────────────────── */
const BUTTON_VARIANTS = {
  primary: cn(
    "ma-btn-glow inline-flex items-center justify-center gap-2 rounded-full font-bold text-white",
    gradient.brand,
    "shadow-[0_8px_24px_-8px_rgba(124,58,237,0.7)]",
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:saturate-50"
  ),
  outline: cn(
    "inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white font-bold text-slate-700",
    "transition-colors duration-200 hover:border-violet-400 hover:text-violet-700",
    "dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-violet-400 dark:hover:text-violet-300"
  ),
  ghost: cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-bold text-slate-600",
    "transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900",
    "dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
  ),
  soft: cn(
    "inline-flex items-center justify-center gap-2 rounded-full bg-violet-100/80 font-bold text-violet-700",
    "transition-colors duration-200 hover:bg-violet-200/80",
    "dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/25"
  ),
  danger: cn(
    "inline-flex items-center justify-center gap-2 rounded-full border border-rose-300 bg-rose-50 font-bold text-rose-600",
    "transition-colors duration-200 hover:bg-rose-100",
    "dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
  ),
};

const BUTTON_SIZES = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={cn(
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        a11y.focusRing,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Badge — status / tone pills.
 * ──────────────────────────────────────────────────────────────────────────── */
const BADGE_TONES = {
  purple: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300",
};

export function Badge({ tone = "slate", className = "", children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
        BADGE_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Card
 * ──────────────────────────────────────────────────────────────────────────── */
export function Card({ interactive = false, className = "", children, ...props }) {
  return (
    <div
      className={cn(interactive ? surface.cardInteractive : surface.card, className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Section label + heading
 * ──────────────────────────────────────────────────────────────────────────── */
export function Eyebrow({ className = "", children }) {
  return <p className={cn(type.eyebrow, className)}>{children}</p>;
}

export function SectionHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <Eyebrow className="mb-1">{eyebrow}</Eyebrow>}
        <h2 className={type.h2}>{title}</h2>
        {subtitle && <p className={cn(type.body, "mt-1 max-w-xl")}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Star rating
 * ──────────────────────────────────────────────────────────────────────────── */
export function StarRating({ value = 0, size = 15, className = "" }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          aria-hidden="true"
          className={
            s <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
          }
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Avatar (initials fallback + optional online dot)
 * ──────────────────────────────────────────────────────────────────────────── */
const AVATAR_SIZES = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-3xl",
};

export function Avatar({ name = "", src, size = "md", online = false, className = "" }) {
  const [error, setError] = useState(false);
  const showImg = Boolean(src) && !error;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-100 to-indigo-100 font-extrabold text-violet-700 shadow-sm dark:border-slate-600 dark:from-violet-500/20 dark:to-indigo-500/20 dark:text-violet-300",
        AVATAR_SIZES[size],
        className
      )}
    >
      {showImg ? (
        <img
          src={src}
          alt={name || "Avatar"}
          onError={() => setError(true)}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">
          {(name || "?")
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase()}
        </span>
      )}
      {online && (
        <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-800" />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Sparkline — tiny inline trend SVG.
 * ──────────────────────────────────────────────────────────────────────────── */
export function Sparkline({ data = [2, 4, 3, 5, 4, 6, 7], stroke = "#7C3AED", className = "" }) {
  const w = 64;
  const h = 22;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - 3 - ((v - min) / range) * (h - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className={className}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Reveal — fade/slide in on first scroll into view.
 * ──────────────────────────────────────────────────────────────────────────── */
export function Reveal({ delay = 0, className = "", children }) {
  const ref = useRef(null);
  /* If IntersectionObserver is unavailable, reveal immediately. */
  const [visible, setVisible] = useState(
    () => typeof window === "undefined" || !("IntersectionObserver" in window)
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("ma-reveal", visible && "is-visible", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Skeleton primitives (themed shimmer).
 * ──────────────────────────────────────────────────────────────────────────── */
export function Skeleton({ className = "" }) {
  return <div className={cn("ma-skeleton rounded-xl", className)} aria-hidden="true" />;
}

export function DoctorCardSkeleton() {
  return (
    <div className={cn(surface.card, "flex flex-col justify-between p-6")}>
      <div className="flex gap-4">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <div className="flex-1 space-y-2 py-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="mt-6 h-11 w-full rounded-full" />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Empty state.
 * ──────────────────────────────────────────────────────────────────────────── */
export function EmptyState({ icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-800/30">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 text-3xl dark:from-violet-500/15 dark:to-indigo-500/15">
          <span aria-hidden="true">{icon}</span>
        </div>
      )}
      <h3 className={type.h3}>{title}</h3>
      {text && <p className={cn(type.body, "mx-auto mt-1 max-w-sm")}>{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
