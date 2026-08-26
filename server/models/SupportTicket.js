import mongoose, { Schema } from "mongoose";

const supportTicketMessageSchema = new Schema(
  {
    sender: {
      type: String,
      enum: ["DOCTOR", "ADMIN"],
      required: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
    },
    attachmentUrl: {
      type: String,
      default: "",
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const supportTicketSchema = new Schema(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },
    category: {
      type: String,
      enum: ["BILLING", "TECHNICAL", "GENERAL"],
      default: "GENERAL",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "RESOLVED", "CLOSED"],
      default: "OPEN",
    },
    messages: {
      type: [supportTicketMessageSchema],
      default: [],
    },
  },
  { timestamps: true },
);

supportTicketSchema.index({ doctorId: 1, status: 1, createdAt: -1 });

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

export default SupportTicket;
