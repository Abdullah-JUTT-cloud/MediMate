// Small shared helpers for the doctor dashboard.
// Kept plain and dependency-free so every dashboard component can use them.

/** "PKR 5,900" */
export const formatPKR = (amount) => `PKR ${Number(amount || 0).toLocaleString()}`;

/** First letters of a name, e.g. "Ayesha Khan" -> "AK". */
export const getInitials = (name) =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "P";

/** Turns a "14:30" slot into a friendlier "2:30 PM". */
export const formatSlotTime = (slot) => {
  const [hours, minutes] = String(slot || "").split(":").map(Number);
  if (!Number.isFinite(hours)) return slot || "--:--";
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = Number.isFinite(minutes) ? String(minutes).padStart(2, "0") : "00";
  return `${displayHours}:${displayMinutes} ${period}`;
};

/** "Wednesday, 26 August 2026" */
export const getTodayLabel = () =>
  new Date().toLocaleDateString("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/** Today's date as "YYYY-MM-DD", used by the appointments API. */
export const getTodayDateInput = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

/**
 * Builds the name shown in the greeting, e.g. "Dr. Abdullah".
 * Avoids a double "Dr." when the stored name already contains it.
 */
export const getGreetingName = (fullName) => {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  const namePart = parts.length > 1 && /^dr\.?$/i.test(parts[0]) ? parts[1] : parts[0];
  if (!namePart) return "Doctor";
  return /^dr/i.test(namePart) ? namePart : `Dr. ${namePart}`;
};
