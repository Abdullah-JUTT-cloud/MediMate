/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MedAlerto Patient Portal — Design Tokens
 * ─────────────────────────────────────────────────────────────────────────────
 *  Single source of truth for the portal's visual language, derived from the
 *  MedAlerto brand (see client/src/assets/* for the official logo assets) and
 *  the existing patient-portal screens:
 *
 *    Primary Purple   #7C3AED      Deep Purple  #5B21B6 / #4C1D95
 *    Accent Indigo    #818CF8      Indigo       #6366F1 / #4338CA
 *    Accent Teal      #2DD4BF
 *    Brand gradient   135deg  #4C1D95 → #5B21B6 → #4338CA
 *    Status           Amber #F59E0B · Green #10B981 · Rose #F43F5E
 *
 *  Tailwind JIT only scans literal class strings — so every reusable class
 *  below is a full, static literal (never built from string concatenation).
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const colors = {
  brand: "#7C3AED",
  brandStrong: "#6D28D9",
  deep: "#5B21B6",
  deepest: "#4C1D95",
  indigo: "#818CF8",
  indigoStrong: "#6366F1",
  indigoDeep: "#4338CA",
  teal: "#2DD4BF",
  amber: "#F59E0B",
  green: "#10B981",
  rose: "#F43F5E",
};

/* ── Layout ───────────────────────────────────────────────────────────────── */
export const layout = {
  /* 1280px centered container for wide screens (spec) */
  container: "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8",
};

/* ── Surfaces & cards ─────────────────────────────────────────────────────── */
export const surface = {
  card: "rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(124,58,237,0.06)] dark:border-slate-700/60 dark:bg-slate-800/50",
  cardInteractive:
    "rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(124,58,237,0.06)] dark:border-slate-700/60 dark:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1 hover:border-violet-300/70 hover:shadow-[0_18px_40px_-12px_rgba(124,58,237,0.22)] dark:hover:border-violet-500/40",
  inset:
    "rounded-xl border border-slate-200/70 bg-slate-50/80 dark:border-slate-700/60 dark:bg-slate-900/40",
};

/* ── Gradients ────────────────────────────────────────────────────────────── */
export const gradient = {
  /* Primary brand gradient (hero, primary buttons) */
  brand: "bg-[linear-gradient(135deg,#4C1D95_0%,#5B21B6_45%,#4338CA_100%)]",
  /* Bright "energy" gradient for small accents */
  accent:
    "bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-500",
  /* Gradient text (headline keywords) */
  text: "bg-gradient-to-r from-violet-600 via-indigo-500 to-teal-400 bg-clip-text text-transparent dark:from-violet-300 dark:via-indigo-300 dark:to-teal-300",
  /* Dark glass card gradient (payment card) */
  dark:
    "bg-[linear-gradient(135deg,#1E1B4B_0%,#312E81_50%,#3730A3_100%)]",
};

/* ── Typography ───────────────────────────────────────────────────────────── */
export const type = {
  h1: "text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15] dark:text-white",
  h2: "text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white",
  h3: "text-base font-bold text-slate-900 dark:text-white",
  eyebrow:
    "text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500",
  body: "text-sm leading-relaxed text-slate-600 dark:text-slate-300",
  caption: "text-xs font-medium text-slate-500 dark:text-slate-400",
};

/* ── Accessibility ────────────────────────────────────────────────────────── */
export const a11y = {
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900",
};
