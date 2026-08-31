/** Tiny class-name joiner (drops falsy values). */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
