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
const PUBLIC_DOCTOR_FIELDS = [
  "fullName",
  "title",
  "specialization",
  "primaryDegree",
  "additionalDegrees",
  "university",
  "graduationYear",
  "postgraduateTraining",
  "yearsOfExperience",
  "gender",
  "clinics",
  "hospitals",
  "slotDuration",
  "profilePicUrl",
  "advanceBookingFee",
  "onlineBookingFee",
  "verificationStatus",
  // Payment / bank account details (shown when advanceBookingFee > 0)
  "paymentAccountTitle",
  "paymentBankName",
  "paymentAccountNumber",
  "paymentIBAN",
].join(" ");


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

    const filter = { verificationStatus: "APPROVED" };

    if (specialization) {
      filter.specialization = { $regex: specialization.trim(), $options: "i" };
    }
    if (name && name.trim()) {
      const regex = new RegExp(name.trim(), "i");
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

    const enriched = doctors.map((doc) => ({
      ...doc,
      profilePicUrl: doc.profilePicUrl ? getFileUrl(doc.profilePicUrl) : "",
      avgRating: statsMap[String(doc._id)]?.avgRating?.toFixed(1) ?? null,
      reviewCount: statsMap[String(doc._id)]?.reviewCount ?? 0,
    }));

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

    res.status(200).json({
      doctor: {
        ...doctor,
        profilePicUrl: doctor.profilePicUrl ? getFileUrl(doctor.profilePicUrl) : "",
        avgRating: statsResult?.avgRating?.toFixed(1) ?? null,
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

    const review = await Review.findOne({ token, isSubmitted: false })
      .select("+token +tokenExpiry")
      .populate("doctorId", "fullName title specialization profilePicUrl");

    if (!review) {
      return res.status(404).json({ message: "Review link is invalid or has already been used" });
    }
    if (review.tokenExpiry && new Date(review.tokenExpiry) < new Date()) {
      return res.status(410).json({ message: "This review link has expired" });
    }

    res.status(200).json({
      doctor: review.doctorId,
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
