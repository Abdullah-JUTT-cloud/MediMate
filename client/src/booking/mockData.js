/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MedAlerto Patient Portal — Mock Data
 * ─────────────────────────────────────────────────────────────────────────────
 *  Realistic, self-contained fixture data so the redesigned portal can be
 *  previewed end-to-end with no backend. The shapes intentionally mirror the
 *  live API responses (see the original booking pages) so re-wiring to the
 *  real endpoints is a drop-in swap at the data boundary.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const DAY = 24 * 60 * 60 * 1000;
const TODAY = new Date();

/** ISO date string `n` days from today (negative = past). */
export function dayOffset(n) {
  const d = new Date(TODAY.getTime() + n * DAY);
  return d.toISOString().slice(0, 10);
}

/** "Mon, 31 Aug" style short label. */
export function shortDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export const PATIENT = {
  name: "Abdullah Jutt",
  firstName: "Abdullah",
  email: "abdullah.jutt@example.com",
  phone: "+92 321 4194045",
};

/* ── Specializations ──────────────────────────────────────────────────────── */
export const SPECIALIZATIONS = [
  "Dermatology",
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Gynecology",
  "Orthopedics",
  "General Physician",
  "ENT",
  "Psychiatry",
];

/* ── Doctors ──────────────────────────────────────────────────────────────── */
export const DOCTORS = [
  {
    id: "doc-abdullah",
    title: "Dr.",
    fullName: "Muhammad Abdullah",
    specialization: "Dermatologist",
    yearsOfExperience: 1,
    primaryDegree: "MBBS",
    extraDegree: "PMDC Registered",
    avgRating: 5.0,
    reviewCount: 1,
    onlineBookingFee: 500,
    slotDuration: 20,
    initials: "MA",
    languages: ["English", "Urdu"],
    modes: ["Online Video", "In-Clinic"],
    bio: "Dr. Muhammad Abdullah is a dedicated dermatologist focused on skin, hair and nail health. He combines evidence-based dermatology with a calm, patient-first approach — listening carefully before building a treatment plan that fits your lifestyle and budget.",
    clinics: [
      {
        name: "Hajra Memorial Hospital",
        address: "Gazi Chownk, Lahore",
        phone: "0321 4194045",
        hours: "09:00 - 23:59",
        sessions: [
          { day: "Monday", startTime: "09:00", endTime: "12:00" },
          { day: "Tuesday", startTime: "09:00", endTime: "12:00" },
          { day: "Wednesday", startTime: "09:00", endTime: "12:00" },
          { day: "Thursday", startTime: "09:00", endTime: "12:00" },
        ],
      },
    ],
    hospitals: [
      {
        name: "Service Hospital",
        address: "Gulberg, Lahore",
        phone: "0321 4194045",
        hours: "14:00 - 20:00",
        sessions: [
          { day: "Monday", startTime: "14:00", endTime: "18:00" },
          { day: "Tuesday", startTime: "14:00", endTime: "18:00" },
          { day: "Wednesday", startTime: "14:00", endTime: "18:00" },
        ],
      },
    ],
    payment: {
      bank: "1111",
      accountTitle: "me",
      accountNumber: "zkcjnvjn4r4",
      iban: "jkbsajkj24rn",
    },
  },
  {
    id: "doc-fatima",
    title: "Dr.",
    fullName: "Fatima Noor",
    specialization: "Dermatologist",
    yearsOfExperience: 8,
    primaryDegree: "MBBS, FCPS",
    avgRating: 4.8,
    reviewCount: 24,
    onlineBookingFee: 800,
    slotDuration: 20,
    initials: "FN",
    languages: ["English", "Urdu", "Punjabi"],
    modes: ["Online Video", "In-Clinic"],
    bio: "Senior dermatologist specialising in medical and cosmetic dermatology, acne scarring and pigmentary disorders.",
    clinics: [
      { name: "Lahore Skin Clinic", address: "DHA Phase 5, Lahore", phone: "0300 1112223", hours: "10:00 - 18:00", sessions: [] },
    ],
    hospitals: [],
    payment: {
      bank: "Meezan Bank",
      accountTitle: "Fatima Noor",
      accountNumber: "PK88MEZN000012345",
      iban: "PK88MEZN0000123456789",
    },
  },
  {
    id: "doc-hassan",
    title: "Dr.",
    fullName: "Hassan Raza",
    specialization: "Dermatologist",
    yearsOfExperience: 5,
    primaryDegree: "MBBS, MD",
    avgRating: 4.9,
    reviewCount: 18,
    onlineBookingFee: 700,
    slotDuration: 20,
    initials: "HR",
    languages: ["English", "Urdu"],
    modes: ["Online Video"],
    bio: "Specialist in hair restoration, scalp health and laser dermatology with a modern, tech-forward practice.",
    clinics: [
      { name: "SkinRx Aesthetics", address: "Clifton, Karachi", phone: "0301 5556677", hours: "11:00 - 19:00", sessions: [] },
    ],
    hospitals: [],
    payment: {
      bank: "HBL",
      accountTitle: "Hassan Raza",
      accountNumber: "PK10HABB000012345",
      iban: "PK10HABB0000123456789",
    },
  },
  {
    id: "doc-ayesha",
    title: "Dr.",
    fullName: "Ayesha Khan",
    specialization: "Cardiologist",
    yearsOfExperience: 12,
    primaryDegree: "MBBS, FCPS",
    avgRating: 4.9,
    reviewCount: 52,
    onlineBookingFee: 1200,
    slotDuration: 20,
    initials: "AK",
    languages: ["English", "Urdu"],
    modes: ["Online Video", "In-Clinic"],
    bio: "Consultant cardiologist focused on preventive cardiology, hypertension and lifestyle-driven heart health.",
    clinics: [
      { name: "Punjab Institute of Cardiology", address: "Jail Road, Lahore", phone: "042 111 000 111", hours: "09:00 - 15:00", sessions: [] },
    ],
    hospitals: [],
    payment: {
      bank: "UBL",
      accountTitle: "Ayesha Khan",
      accountNumber: "PK20UNIL000012345",
      iban: "PK20UNIL0000123456789",
    },
  },
  {
    id: "doc-bilal",
    title: "Dr.",
    fullName: "Bilal Ahmed",
    specialization: "Neurologist",
    yearsOfExperience: 10,
    primaryDegree: "MBBS, FCPS",
    avgRating: 4.7,
    reviewCount: 31,
    onlineBookingFee: 1500,
    slotDuration: 20,
    initials: "BA",
    languages: ["English", "Urdu"],
    modes: ["Online Video", "In-Clinic"],
    bio: "Neurologist specialising in migraine, epilepsy and movement disorders, with a gentle, thorough consult style.",
    clinics: [
      { name: "Neuro Care Centre", address: "Gulberg III, Lahore", phone: "042 111 222 333", hours: "10:00 - 16:00", sessions: [] },
    ],
    hospitals: [],
    payment: {
      bank: "Alfalah",
      accountTitle: "Bilal Ahmed",
      accountNumber: "PK30ALFH000012345",
      iban: "PK30ALFH0000123456789",
    },
  },
  {
    id: "doc-sara",
    title: "Dr.",
    fullName: "Sara Malik",
    specialization: "Pediatrician",
    yearsOfExperience: 6,
    primaryDegree: "MBBS, DCH",
    avgRating: 4.8,
    reviewCount: 40,
    onlineBookingFee: 800,
    slotDuration: 20,
    initials: "SM",
    languages: ["English", "Urdu", "Punjabi"],
    modes: ["Online Video", "In-Clinic"],
    bio: "Child health specialist covering newborn care, vaccinations and childhood nutrition.",
    clinics: [
      { name: "Little Steps Clinic", address: "Model Town, Lahore", phone: "0321 777 8889", hours: "10:00 - 18:00", sessions: [] },
    ],
    hospitals: [],
    payment: {
      bank: "Bank Alfalah",
      accountTitle: "Sara Malik",
      accountNumber: "PK40ALFH000012345",
      iban: "PK40ALFH0000123456789",
    },
  },
];

export function getDoctor(id) {
  return DOCTORS.find((d) => d.id === id) || DOCTORS[0];
}

/* Dermatologists for the "Similar Doctors" cross-sell carousel. */
export function getSimilarDoctors(id) {
  return DOCTORS.filter(
    (d) => d.id !== id && d.specialization === "Dermatologist"
  );
}

/* ── Reviews ──────────────────────────────────────────────────────────────── */
export const REVIEWS = {
  "doc-abdullah": [
    {
      id: "r1",
      rating: 5,
      comment: "Great doctor",
      author: "Abdullah Jutt",
      date: "29 Aug 2026",
    },
  ],
  "doc-fatima": [
    { id: "r2", rating: 5, comment: "Very thorough and kind.", author: "Hina S.", date: "12 Aug 2026" },
    { id: "r3", rating: 4, comment: "Explained my treatment clearly.", author: "Usman T.", date: "02 Aug 2026" },
  ],
};

/* ── Bookings (6 total → 1 pending, 3 confirmed, 1 rejected, 1 completed) ── */
export const BOOKINGS = [
  {
    id: "ap-rejected",
    doctorId: "doc-abdullah",
    doctorName: "Dr. Muhammad Abdullah",
    specialization: "Dermatologist",
    initials: "MA",
    status: "Rejected",
    awaitingApproval: false,
    rejectionReason: "Payment screenshot could not be verified by clinic staff",
    date: dayOffset(0),
    slot: "09:00 AM",
    type: "Consultation",
    fee: 500,
    refId: "MA-8F3K2XQ1",
  },
  {
    id: "ap-pending",
    doctorId: "doc-ayesha",
    doctorName: "Dr. Ayesha Khan",
    specialization: "Cardiologist",
    initials: "AK",
    status: "Pending",
    awaitingApproval: true,
    rejectionReason: null,
    date: dayOffset(2),
    slot: "11:00 AM",
    type: "Follow-up",
    fee: 1200,
    refId: "MA-4T7N9ZB5",
  },
  {
    id: "ap-conf-1",
    doctorId: "doc-abdullah",
    doctorName: "Dr. Muhammad Abdullah",
    specialization: "Dermatologist",
    initials: "MA",
    status: "Confirmed",
    awaitingApproval: false,
    rejectionReason: null,
    date: dayOffset(5),
    slot: "10:20 AM",
    type: "Consultation",
    fee: 500,
    refId: "MA-9H2R6LM4",
  },
  {
    id: "ap-conf-2",
    doctorId: "doc-bilal",
    doctorName: "Dr. Bilal Ahmed",
    specialization: "Neurologist",
    initials: "BA",
    status: "Confirmed",
    awaitingApproval: false,
    rejectionReason: null,
    date: dayOffset(12),
    slot: "03:00 PM",
    type: "Check-up",
    fee: 1500,
    refId: "MA-2Q8W1VC7",
  },
  {
    id: "ap-conf-3",
    doctorId: "doc-sara",
    doctorName: "Dr. Sara Malik",
    specialization: "Pediatrician",
    initials: "SM",
    status: "Confirmed",
    awaitingApproval: false,
    rejectionReason: null,
    date: dayOffset(18),
    slot: "04:20 PM",
    type: "Consultation",
    fee: 800,
    refId: "MA-6P3D5YJ9",
  },
  {
    id: "ap-done",
    doctorId: "doc-fatima",
    doctorName: "Dr. Fatima Noor",
    specialization: "Dermatologist",
    initials: "FN",
    status: "Completed",
    awaitingApproval: false,
    rejectionReason: null,
    date: dayOffset(-9),
    slot: "02:00 PM",
    type: "Consultation",
    fee: 500,
    refId: "MA-1Z5C8KQ2",
  },
];

export const bookingStats = {
  total: BOOKINGS.length,
  pending: BOOKINGS.filter((b) => b.status === "Pending").length,
  confirmed: BOOKINGS.filter((b) => b.status === "Confirmed").length,
  rejected: BOOKINGS.filter((b) => b.status === "Rejected").length,
  completed: BOOKINGS.filter((b) => b.status === "Completed").length,
};

/* ── Dashboard widgets ────────────────────────────────────────────────────── */
export const HEALTH_TIPS = [
  {
    id: "tip-1",
    emoji: "💧",
    title: "Stay Hydrated",
    text: "Drink 8–10 glasses of water daily to keep skin healthy and energy steady through the day.",
    tone: "teal",
  },
  {
    id: "tip-2",
    emoji: "😴",
    title: "Prioritise Sleep",
    text: "Aim for 7–8 hours of uninterrupted sleep — it is when your body repairs and recharges.",
    tone: "indigo",
  },
  {
    id: "tip-3",
    emoji: "🏃",
    title: "Move Every Day",
    text: "Just 30 minutes of brisk walking lowers stress, boosts immunity and sharpens focus.",
    tone: "violet",
  },
];
