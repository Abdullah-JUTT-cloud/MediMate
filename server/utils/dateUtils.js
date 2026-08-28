/**
 * Shared date/timezone utilities for clinic-local date handling.
 *
 * The clinic operates in Pakistan Standard Time (Asia/Karachi, UTC+5, no DST).
 * All "YYYY-MM-DD" calendar dates must be converted to clinic-local day
 * boundaries before being used as MongoDB instant-range filters.
 */

export const CLINIC_TIMEZONE = "Asia/Karachi";
export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Formats an instant as "YYYY-MM-DD" in the clinic's timezone. */
export const toClinicDateString = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: CLINIC_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toLocaleDateString("en-CA");
  }
};

/** UTC offset of the clinic timezone (in minutes) for the given instant. */
export const getClinicOffsetMinutes = (date) => {
  try {
    const values = {};
    for (const part of new Intl.DateTimeFormat("en-US", {
      timeZone: CLINIC_TIMEZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(date)) {
      if (part.type !== "literal") values[part.type] = part.value;
    }
    const asUTC = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );
    return Math.round((asUTC - date.getTime()) / 60000);
  } catch {
    return 5 * 60; // PKT fallback: UTC+5
  }
};

/**
 * Converts "YYYY-MM-DD" into clinic-local day boundaries as UTC instants.
 * Returns { startOfDay, endOfDay } or null when the input is not a valid date.
 */
export const getClinicDayRange = (dateStr) => {
  const value = String(dateStr || "").trim();
  if (!DATE_ONLY_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const utcMidnight = Date.UTC(year, month - 1, day);
  const startOfDay = new Date(utcMidnight - getClinicOffsetMinutes(new Date(utcMidnight)) * 60000);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { startOfDay, endOfDay };
};
