import mongoose from "mongoose";
import { Doctor } from "../models/doctor.model.js";
import Appointment from "../models/appointment.model.js";
import Review from "../models/review.model.js";
import { getSlotAvailability, MAX_STANDARD_APPOINTMENTS_PER_SLOT } from "../services/slotService.js";
import { getClinicDayRange } from "../utils/dateUtils.js";
import { getFileUrl } from "../services/storage.service.js";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

/**
 * Fields exposed on a doctor's public profile.
 * Never includes OTP, reset tokens, password, or subscription details.
 */
const PUBLIC_DOCTOR_BASE_FIELDS = [
  // Identity
  "fullName",
  "title",
  "gender",
  // Professional details (rendered on the directory card)
  "specialization",
  "primaryDegree",
  "additionalDegrees",
  "university",
  "graduationYear",
  "postgraduateTraining",
  "yearsOfExperience",
  // Practice locations — clinics/hospitals sub-documents (name, address,
  // phone, hours, sessions) shown on the card and the profile page.
  "clinics",
  "hospitals",
  "slotDuration",
  // Fees
  "advanceBookingFee",
  "onlineBookingFee",
  // Approval state (let the client render the "verified" badge honestly)
  "verificationStatus",
  // Payment / bank account details (shown when advanceBookingFee > 0)
  "paymentAccountTitle",
  "paymentBankName",
  "paymentAccountNumber",
  "paymentIBAN",
];

/**
 * Profile image fields.
 *
 * Doctors may have the R2 key in `profilePicture`, `profilePicUrl`, or both
 * (legacy accounts only populated one of the two). BOTH are always selected so
 * the response can normalize whichever one is populated — otherwise doctors
 * whose image key lives only in `profilePicture` render fallback initials in
 * the directory even though they uploaded a picture.
 */
const PROFILE_IMAGE_FIELDS = ["profilePicture", "profilePicUrl"];

/** Final projection: base fields + guaranteed profile-image fields. */
const PUBLIC_DOCTOR_FIELDS = [
  ...new Set([...PUBLIC_DOCTOR_BASE_FIELDS, ...PROFILE_IMAGE_FIELDS]),
].join(" ");

/**
 * Escapes user-supplied text so it is treated as a literal string inside a
 * MongoDB `$regex` (a raw "." / "(" / "[" in a search box would otherwise
 * change the meaning of the query or throw on an unbalanced pattern).
 */
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Resolves a doctor's profile image to a public URL.
 *
 * The profile image key may live in either `profilePicture` or `profilePicUrl`
 * (legacy accounts set only one). Returns a fully-qualified URL when a key is
 * present, otherwise "" so the client falls back to initials.
 */
const getDoctorProfileImageUrl = (doctor) => {
  const raw =
    (typeof doctor?.profilePicUrl === "string" ? doctor.profilePicUrl.trim() : "") ||
    (typeof doctor?.profilePicture === "string" ? doctor.profilePicture.trim() : "");
  return raw ? getFileUrl(raw) : "";
};


// ─────────────────────────────────────────────────────────
// List Verified Doctors
// ─────────────────────────────────────────────────────────

/**
 * GET /api/public/doctors
 *
 * Query params:
 *   specialization  — partial case-insensitive match
 *   name            — partial case-insensitive match on fullName
 *   page            — default 1
 *   limit           — default 20, max 100
 */
export const listDoctors = async (req, res) => {
  try {
    const { specialization, name, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Strictly APPROVED doctors only.
    //
    // NOTE on `isVerified`: that flag tracks email/OTP verification during
    // signup — it is NOT an alias for admin approval, so it is deliberately
    // NOT used here. An account can have a verified email and still be
    // PENDING/REJECTED by the admin; only `verificationStatus: "APPROVED"`
    // means the doctor is cleared to appear in the public directory.
    const filter = { verificationStatus: "APPROVED" };

    if (specialization && specialization.trim()) {
      filter.specialization = { $regex: escapeRegex(specialization.trim()), $options: "i" };
    }
    if (name && name.trim()) {
      const regex = new RegExp(escapeRegex(name.trim()), "i");
      filter.$or = [
        { fullName: regex },
        { "clinics.name": regex },
        { "hospitals.name": regex },
      ];
    }

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .select(PUBLIC_DOCTOR_FIELDS)
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Doctor.countDocuments(filter),
    ]);

    // Attach aggregate review stats to each doctor
    const doctorIds = doctors.map((d) => d._id);
    const reviewStats = await Review.aggregate([
      {
        $match: {
          doctorId: { $in: doctorIds },
          isSubmitted: true,
          isVisible: true,
        },
      },
      {
        $group: {
          _id: "$doctorId",
          avgRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const statsMap = Object.fromEntries(
      reviewStats.map((s) => [String(s._id), s])
    );

    const enriched = doctors.map((doc) => {
      // Same normalized URL on both image fields: whichever one the client
      // reads, it gets a renderable absolute URL (or "" → initials fallback).
      const imageUrl = getDoctorProfileImageUrl(doc);
      return {
        ...doc,
        profilePicUrl: imageUrl,
        profilePicture: imageUrl,
        avgRating:
          statsMap[String(doc._id)]?.avgRating != null
            ? Math.round(statsMap[String(doc._id)].avgRating * 10) / 10
            : null,
        reviewCount: statsMap[String(doc._id)]?.reviewCount ?? 0,
      };
    });

    res.status(200).json({
      doctors: enriched,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error("[listDoctors]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────
// Get Single Doctor Profile
// ─────────────────────────────────────────────────────────

/**
 * GET /api/public/doctors/:id
 */
export const getDoctorProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    const doctor = await Doctor.findOne({
      _id: id,
      verificationStatus: "APPROVED",
    })
      .select(PUBLIC_DOCTOR_FIELDS)
      .lean();

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Aggregate review stats
    const [statsResult] = await Review.aggregate([
      { $match: { doctorId: new mongoose.Types.ObjectId(id), isSubmitted: true, isVisible: true } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
    ]);

    const imageUrl = getDoctorProfileImageUrl(doctor);

    res.status(200).json({
      doctor: {
        ...doctor,
        profilePicUrl: imageUrl,
        profilePicture: imageUrl,
        avgRating: statsResult?.avgRating != null
          ? Math.round(statsResult.avgRating * 10) / 10
          : null,
        reviewCount: statsResult?.reviewCount ?? 0,
      },
    });
  } catch (error) {
    console.error("[getDoctorProfile]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────
// Get Doctor Slot Availability (Public)
// ─────────────────────────────────────────────────────────

/**
 * GET /api/public/doctors/:id/slots?date=YYYY-MM-DD
 *
 * Returns the same slot shape as the authenticated /api/slots endpoint,
 * but scoped to the requested doctor. Excludes awaitingOnlineApproval
 * bookings from capacity counts (handled inside slotService).
 */
export const getDoctorSlots = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    const doctorExists = await Doctor.exists({ _id: id, verificationStatus: "APPROVED" });
    if (!doctorExists) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const requestedDate = String(req.query.date || "").trim();
    const range = getClinicDayRange(requestedDate);
    if (!range) {
      return res.status(400).json({ message: "Invalid date parameter. Expected YYYY-MM-DD." });
    }

    const slots = await getSlotAvailability({ doctorId: id, dayRange: range });

    res.status(200).json({
      date: requestedDate,
      maxPerSlot: MAX_STANDARD_APPOINTMENTS_PER_SLOT,
      slots,
    });
  } catch (error) {
    console.error("[getDoctorSlots]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────
// List Doctor Reviews
// ─────────────────────────────────────────────────────────

/**
 * GET /api/public/doctors/:id/reviews
 */
export const getDoctorReviews = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      doctorId: new mongoose.Types.ObjectId(id),
      isSubmitted: true,
      isVisible: true,
    };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("patientAccountId", "name")
        .select("rating comment createdAt patientAccountId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(filter),
    ]);

    res.status(200).json({
      reviews,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error("[getDoctorReviews]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────
// Review Submission via Token
// ─────────────────────────────────────────────────────────

/**
 * GET /api/public/reviews/:token
 * Verify a review token and return context (doctor name etc.) so the page
 * can be pre-populated.
 */
export const getReviewByToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 20) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Both profile-image fields are populated: legacy accounts only stored the
    // key in one of them, and the raw value is an R2 key that must be resolved
    // to a public URL before the client can render it.
    const review = await Review.findOne({ token, isSubmitted: false })
      .select("+token +tokenExpiry")
      .populate("doctorId", "fullName title specialization profilePicture profilePicUrl");

    if (!review) {
      return res.status(404).json({ message: "Review link is invalid or has already been used" });
    }
    if (review.tokenExpiry && new Date(review.tokenExpiry) < new Date()) {
      return res.status(410).json({ message: "This review link has expired" });
    }

    res.status(200).json({
      doctor: {
        ...(review.doctorId?.toObject?.() ?? review.doctorId),
        profilePicUrl: getDoctorProfileImageUrl(review.doctorId),
      },
      reviewId: review._id,
    });
  } catch (error) {
    console.error("[getReviewByToken]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /api/public/reviews/:token
 * Body: { rating: 1-5, comment?: string }
 */
export const submitReview = async (req, res) => {
  try {
    const { token } = req.params;
    const { rating, comment } = req.body;

    if (!token || token.length < 20) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
    }

    const review = await Review.findOne({ token, isSubmitted: false }).select("+token +tokenExpiry");
    if (!review) {
      return res.status(404).json({ message: "Review link is invalid or has already been used" });
    }
    if (review.tokenExpiry && new Date(review.tokenExpiry) < new Date()) {
      return res.status(410).json({ message: "This review link has expired" });
    }

    review.rating = ratingNum;
    review.comment = typeof comment === "string" ? comment.trim().slice(0, 1000) : "";
    review.isSubmitted = true;
    review.token = null;         // single-use: consume the token
    review.tokenExpiry = null;
    await review.save();

    res.status(200).json({ message: "Thank you for your review!" });
  } catch (error) {
    console.error("[submitReview]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
