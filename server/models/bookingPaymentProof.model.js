import mongoose, { Schema } from "mongoose";

/**
 * BookingPaymentProof — screenshot of advance payment uploaded by a PatientAccount
 * when requesting an online appointment.
 *
 * Lifecycle:
 *   PENDING  → receptionist reviews the proof
 *   APPROVED → appointment is confirmed, `awaitingOnlineApproval` is flipped false
 *   REJECTED → appointment is cancelled with reason "Payment Rejected"
 */
const bookingPaymentProofSchema = new Schema(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    patientAccountId: {
      type: Schema.Types.ObjectId,
      ref: "PatientAccount",
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    screenshotUrl: {
      type: String,
      required: [true, "Screenshot URL is required"],
      trim: true,
    },
    screenshotKey: {
      // R2 object key for future deletion / signed-URL generation
      type: String,
      trim: true,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

bookingPaymentProofSchema.index({ appointmentId: 1 });
bookingPaymentProofSchema.index({ patientAccountId: 1, status: 1, createdAt: -1 });
bookingPaymentProofSchema.index({ doctorId: 1, status: 1, createdAt: -1 });

const BookingPaymentProof = mongoose.model("BookingPaymentProof", bookingPaymentProofSchema);
export default BookingPaymentProof;
