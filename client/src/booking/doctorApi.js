/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Patient portal — live doctor-directory data helpers
 * ─────────────────────────────────────────────────────────────────────────────
 *  The doctor directory (src/booking/DoctorsPage.jsx) renders REAL registered
 *  doctors fetched from `GET /api/public/doctors`. These helpers own the
 *  boundary between the raw API document (Mongo/Mongoose shape) and the shape
 *  the directory cards expect, so the page itself stays presentational.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Resolves a doctor's uploaded profile picture to an `<img>` src.
 *
 * Doctors in the database may expose their picture under:
 *   • `profilePicUrl`   — absolute URL, already resolved by the backend
 *   • `profilePicture`  — raw R2/storage key (legacy accounts)
 *   • `avatarUrl` / `avatar` / `image` — aliases used by other payloads
 *
 * ANY non-empty string wins: the card renders the real picture. An empty
 * string (null / undefined / blank) means "no picture uploaded", and the card
 * falls back to the doctor's initials.
 */
export function getDoctorImageUrl(doctor) {
  const raw =
    doctor?.profilePicUrl ||
    doctor?.profilePicture ||
    doctor?.avatarUrl ||
    doctor?.avatar ||
    doctor?.image ||
    "";
  return typeof raw === "string" ? raw.trim() : "";
}

/**
 * Maps an API doctor document onto the shape a directory card renders.
 *
 * Every field is guarded: the public endpoint only projects approved,
 * non-sensitive fields, and older accounts can be missing optional ones
 * (degree, rating, clinics/hospitals, fees).
 */
export function mapApiDoctor(doc) {
  const avgRating =
    typeof doc?.avgRating === "number" && Number.isFinite(doc.avgRating) ? doc.avgRating : 0;

  return {
    // Mongo `_id` → the `id` the card navigates with (`/book/doctors/:id`).
    id: doc?._id || doc?.id || "",
    title: doc?.title || "Dr.",
    fullName: doc?.fullName || "Unnamed Doctor",
    specialization: doc?.specialization || "General Physician",
    yearsOfExperience: Number(doc?.yearsOfExperience) || 0,
    primaryDegree: doc?.primaryDegree || "",
    onlineBookingFee: Number(doc?.onlineBookingFee) || 0,
    avgRating,
    reviewCount: Number(doc?.reviewCount) || 0,
    clinics: Array.isArray(doc?.clinics) ? doc.clinics : [],
    hospitals: Array.isArray(doc?.hospitals) ? doc.hospitals : [],
    profilePicUrl: getDoctorImageUrl(doc),
  };
}
