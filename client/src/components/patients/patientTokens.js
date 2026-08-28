/**
 * Design tokens + pure helpers for the Patients module.
 *
 * Everything here is intentionally plain Tailwind palette tokens (slate for
 * neutrals, teal for actions, rose/blue/amber for semantics) with explicit
 * `dark:` counterparts so clinic staff get the same high-contrast reading
 * experience in both themes. No inline `style` objects, no opacity-diluted
 * text colours.
 */

// ─── Reference data ──────────────────────────────────────────────────────────

export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown",
];

export const GENDERS = ["Male", "Female", "Other"];

export const APPOINTMENT_TYPES = [
  "Consultation",
  "Follow-up",
  "Check-up",
  "Emergency",
];

export const PAYMENT_METHODS = ["Cash", "Card", "Online Transfer"];

export const FREQUENCIES = [
  "Once a day",
  "Twice a day",
  "Three times a day",
  "Four times a day",
  "Every 8 hours",
  "Every 12 hours",
  "As needed",
];

export const DURATIONS = [
  "3 days",
  "5 days",
  "7 days",
  "10 days",
  "14 days",
  "1 month",
  "3 months",
  "Ongoing",
];

/** Server-side cap on active appointments per slot (appointment.controller.js). */
export const MAX_APPOINTMENTS_PER_SLOT = 3;

// ─── Shared class tokens ─────────────────────────────────────────────────────

export const cls = {
  pageTitle: "text-2xl font-bold text-slate-900 dark:text-white",
  pageSubtitle: "text-sm font-semibold text-slate-600 dark:text-slate-300",
  sectionTitle: "text-lg font-bold text-slate-900 dark:text-white",
  cardTitle: "text-base font-bold text-slate-900 dark:text-white",
  strongText: "text-sm font-bold text-slate-900 dark:text-slate-100",
  bodyText: "text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed",
  metaText: "text-sm font-medium text-slate-700 dark:text-slate-300",
  mutedText: "text-xs font-semibold text-slate-500 dark:text-slate-400",

  card:
    "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm",
  profileCard:
    "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-6",
  visitCard:
    "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-5 shadow-sm",
  infoCard:
    "bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-4 rounded-xl",
  contentBlock:
    "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl mb-3",

  fieldLabel:
    "text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block",
  blockLabel:
    "text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-2 block",
  tableHead:
    "bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 p-4",

  input:
    "w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25",
  searchInput:
    "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25 outline-none transition w-full shadow-sm",

  btnPrimary:
    "inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-bold px-4 py-2.5 rounded-xl transition-colors hover:border-teal-500 hover:text-teal-700 dark:hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-60",
  btnGhostDanger:
    "inline-flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 font-bold px-3 py-2 rounded-xl transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-300",
  pdfLink:
    "text-teal-700 dark:text-teal-300 font-bold text-sm hover:underline transition-colors",

  badgeNeutral:
    "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold px-3 py-1 rounded-lg text-xs",
};

// ─── Formatting helpers ──────────────────────────────────────────────────────

export const getInitials = (name) =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "P";

/** "26 August 2026" — used on visit cards and profile metadata. */
export const formatLongDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/** "26 Aug 2026" — used in dense table rows. */
export const formatShortDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/** "Rs. 3,900" */
export const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Rs. 0";
  return `Rs. ${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};

export const pluralize = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : plural || `${singular}s`}`;

export const getTodayDateInput = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
};

export const emptyMedicine = () => ({
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
});

// ─── Scheduling helpers ──────────────────────────────────────────────────────

export const DAY_NAME_TO_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export const DAY_ORDER = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const parseDateInputLocal = (value) => {
  const [year, month, day] = String(value || "")
    .split("-")
    .map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

export const getDayName = (dateValue) => {
  const parsed = parseDateInputLocal(dateValue);
  return DAY_ORDER[parsed.getDay()];
};

const toMinutes = (time) => {
  const [hours, minutes] = String(time || "0:0").split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const toClockTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export const generateSlots = (startTime, endTime, slotDuration) => {
  const slots = [];
  const duration = Number(slotDuration) > 0 ? Number(slotDuration) : 20;
  let current = toMinutes(startTime);
  const end = toMinutes(endTime);
  while (current + duration <= end) {
    slots.push(toClockTime(current));
    current += duration;
  }
  return slots;
};

/**
 * Normalises the doctor profile into a flat facility list that both the
 * checkup form and the booking modal can consume.
 */
export const buildDoctorLocations = (doctor) => [
  ...(doctor?.clinics || []).map((clinic, index) => ({
    locationType: "Clinic",
    locationId: clinic._id || `clinic_${index}`,
    locationName: clinic.name,
    locationAddress: clinic.address,
    sessions: Array.isArray(clinic.sessions) ? clinic.sessions : [],
  })),
  ...(doctor?.hospitals || []).map((hospital, index) => ({
    locationType: "Hospital",
    locationId: hospital._id || `hospital_${index}`,
    locationName: hospital.name,
    locationAddress: hospital.address,
    sessions: Array.isArray(hospital.sessions) ? hospital.sessions : [],
  })),
];

/**
 * Composite `<option>` value for the facility selector on the Edit Profile
 * form, e.g. "Clinic:665f…c1". Prefixing with the type keeps a clinic id from
 * ever colliding with a hospital id.
 */
export const toLocationValue = (location) =>
  location?.locationId ? `${location.locationType}:${location.locationId}` : "";

/**
 * Matches a location already stored on a patient against the doctor's current
 * facility list (by type + id first, then by type + name) and returns the
 * canonical facility, or null when the patient's facility no longer exists in
 * the doctor's settings.
 */
export const matchFacility = (facilities = [], location) => {
  if (!location) return null;
  return (
    facilities.find(
      (facility) =>
        facility.locationType === location.locationType &&
        String(facility.locationId) === String(location.locationId),
    ) ||
    facilities.find(
      (facility) =>
        facility.locationType === location.locationType &&
        facility.locationName === location.locationName,
    ) ||
    null
  );
};

/**
 * Returns every bookable slot for a patient on a given date, derived from the
 * sessions configured at the facilities that patient is attached to.
 */
export const buildSlotsForDate = ({ doctor, patient, date }) => {
  if (!date || !patient) return [];

  const dayName = getDayName(date);
  const slotDuration = Number(doctor?.slotDuration) > 0 ? Number(doctor.slotDuration) : 20;
  const doctorLocations = buildDoctorLocations(doctor);
  const patientLocations = Array.isArray(patient.locations) ? patient.locations : [];
  const slots = [];

  for (const location of patientLocations) {
    const matched = doctorLocations.find(
      (entry) =>
        entry.locationType === location.locationType &&
        (String(entry.locationId) === String(location.locationId) ||
          entry.locationName === location.locationName),
    );
    if (!matched) continue;

    for (const session of matched.sessions) {
      if (session?.day !== dayName) continue;
      for (const time of generateSlots(session.startTime, session.endTime, slotDuration)) {
        if (!slots.some((slot) => slot.time === time)) {
          slots.push({
            time,
            locationName: location.locationName,
            locationType: location.locationType,
          });
        }
      }
    }
  }

  return slots.sort((a, b) => a.time.localeCompare(b.time));
};
