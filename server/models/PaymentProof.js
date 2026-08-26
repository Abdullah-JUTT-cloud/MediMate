import mongoose, { Schema } from "mongoose";

const paymentProofSchema = new Schema(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },
    supportTicketId: {
      type: Schema.Types.ObjectId,
      ref: "IssueTicket",
      default: null,
    },
    doctorName: {
      type: String,
      default: "",
      trim: true,
    },
    doctorEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    doctorPhone: {
      type: String,
      default: "",
      trim: true,
    },
    screenshotUrl: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      default: 2499,
      min: 0,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "annual"],
      default: "monthly",
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
  { timestamps: true },
);

paymentProofSchema.index({ doctorId: 1, status: 1, createdAt: -1 });

const PaymentProof = mongoose.model("PaymentProof", paymentProofSchema);

export default PaymentProof;
