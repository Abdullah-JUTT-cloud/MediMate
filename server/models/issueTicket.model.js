import mongoose, { Schema } from "mongoose";

const ticketMessageSchema = new Schema(
  {
    senderRole: {
      type: String,
      enum: ["doctor", "admin"],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    attachments: {
      type: [
        {
          url: { type: String, required: true, trim: true },
          name: { type: String, required: true, trim: true },
          mimeType: { type: String, default: "", trim: true },
          size: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const issueTicketSchema = new Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "General Feedback",
        "Technical Issue",
        "Billing/Subscription",
        "Verification/Profile",
        "Other",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Reopened", "Closed"],
      default: "Open",
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: String,
      default: "",
      trim: true,
    },
    messages: {
      type: [ticketMessageSchema],
      default: [],
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

issueTicketSchema.index({ doctor: 1, status: 1, updatedAt: -1 });
issueTicketSchema.index({ status: 1, lastMessageAt: -1 });

const IssueTicket = mongoose.model("IssueTicket", issueTicketSchema);

export default IssueTicket;