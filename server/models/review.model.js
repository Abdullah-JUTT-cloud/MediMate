import mongoose, { Schema } from "mongoose";
import crypto from "crypto";

/**
 * Review — star rating + comment left by a PatientAccount after a completed appointment.
 *
 * Flow:
 *  1. `completeCheckup` generates a single-use token and creates a Review record
 *     with `isSubmitted: false`.
 *  2. A WhatsApp message is sent to the patient with a link containing the token.
 *  3. The patient opens the public review page, POSTs their rating/comment.
 *  4. `isSubmitted` flips to true; the token is nulled so it cannot be reused.
 *
 * Only Reviews with `isSubmitted: true` and `isVisible: true` are exposed in the
 * public doctor profile API.
 */
const reviewSchema = new Schema(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    patientAccountId: {
      type: Schema.Types.ObjectId,
      ref: "PatientAccount",
      default: null,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true, // one review per appointment
    },
    // Single-use token sent via WhatsApp. Nulled after submission.
    token: {
      type: String,
      default: null,
      select: false,
    },
    tokenExpiry: {
      type: Date,
      default: null,
      select: false,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    isSubmitted: {
      type: Boolean,
      default: false,
    },
    isVisible: {
      // Admins can hide reviews flagged as inappropriate
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ doctorId: 1, isSubmitted: 1, isVisible: 1, createdAt: -1 });
reviewSchema.index({ token: 1 }, { sparse: true });

/**
 * Static helper: generate a cryptographically random 48-char hex token.
 */
reviewSchema.statics.generateToken = function () {
  return crypto.randomBytes(24).toString("hex");
};

const Review = mongoose.model("Review", reviewSchema);
export default Review;
