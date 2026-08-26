import mongoose from "mongoose";
import { uploadToR2 } from "../services/storage.service.js";
import IssueTicket from "../models/issueTicket.model.js";
import { Doctor } from "../models/doctor.model.js";
import PaymentProof from "../models/PaymentProof.js";
import Notification from "../models/notification.model.js";
import { allowedImageMimeTypes } from "../middlewares/upload.middleware.js";
import { emitIssueTicketUpdate } from "../realtime/socket.js";

const validCategories = [
  "General Feedback",
  "Technical Issue",
  "Billing/Subscription",
  "Billing / Subscription Issue",
  "Verification/Profile",
  "Other",
];

const validStatuses = ["Open", "In Progress", "Resolved", "Reopened", "Closed"];

const sanitizeIssueText = (value, maxLength = 5000) => {
  const safeText = String(value ?? "")
    .replace(/<script[\s\S]*?(?:<\/script>|$)/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return safeText.slice(0, maxLength);
};

const isAdminRequest = (req) => Boolean(req.admin?.role === "admin");

const isBillingCategory = (category = "") =>
  ["Billing/Subscription", "Billing / Subscription Issue"].includes(category);

const uploadAttachmentToR2 = async (file, folder = "issue-chats") => {
  return await uploadToR2(file, folder);
};

const getMessageType = ({ text = "", attachments = [] }) => {
  const normalizedAttachments = Array.isArray(attachments) ? attachments : [];
  if (normalizedAttachments.length === 0) {
    return text ? "text" : "text";
  }

  const allImages = normalizedAttachments.every((attachment) =>
    allowedImageMimeTypes.has(attachment.detectedMimeType || attachment.mimetype || attachment.mimeType)
  );

  if (allImages && !text) return "image";
  if (allImages) return "image";
  return "mixed";
};

const buildTicketMessagePayload = async ({ senderRole, senderName, text, files, folder }) => {
  const attachments = [];

  for (const file of files || []) {
    const uploadResult = await uploadAttachmentToR2(file, folder);
    attachments.push({
      url: uploadResult.url,
      key: uploadResult.key,
      name: file.originalname,
      mimeType: file.detectedMimeType || file.mimetype,
      size: file.size || 0,
    });
  }

  return {
    senderRole,
    senderName: sanitizeIssueText(senderName, 120),
    text: sanitizeIssueText(text, 5000),
    type: getMessageType({ text: sanitizeIssueText(text, 5000), attachments }),
    status: "sent",
    deliveredAt: null,
    seenAt: null,
    attachments,
  };
};

export const createTicket = async (req, res) => {
  try {
    const { category, title, description } = req.body;
    const sanitizedCategory = sanitizeIssueText(category, 80);
    const sanitizedTitle = sanitizeIssueText(title, 160);
    const sanitizedDescription = sanitizeIssueText(description, 5000);

    if (!sanitizedCategory || !sanitizedTitle || !sanitizedDescription) {
      return res.status(400).json({ message: "Category, title and description are required" });
    }

    if (!validCategories.includes(sanitizedCategory)) {
      return res.status(400).json({ message: "Invalid issue category" });
    }

    const doctor = await Doctor.findById(req.doctorId).select("fullName");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const ticket = await IssueTicket.create({
      doctor: req.doctorId,
      category: sanitizedCategory,
      title: sanitizedTitle,
      description: sanitizedDescription,
      status: "Open",
      messages: [
        {
          senderRole: "doctor",
          senderName: sanitizeIssueText(doctor.fullName, 120),
          text: sanitizedDescription,
          type: "text",
          status: "sent",
          deliveredAt: null,
          seenAt: null,
        },
      ],
      lastMessageAt: new Date(),
    });
    await emitIssueTicketUpdate(ticket);

    return res.status(201).json({ message: "Issue created successfully", ticket });
  } catch (error) {
    console.error("[createTicket]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listTickets = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const status = req.query.status;
    const history = req.query.history === "true";
    const doctorId = req.query.doctorId;

    const query = {};

    if (!isAdminRequest(req)) {
      query.doctor = req.doctorId;
    } else if (doctorId) {
      if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        return res.status(400).json({ message: "Invalid doctor id" });
      }
      query.doctor = doctorId;
    }

    if (status && validStatuses.includes(status)) {
      query.status = status;
    } else if (history) {
      query.status = { $in: ["Resolved", "Closed"] };
    } else {
      query.status = { $nin: ["Resolved", "Closed"] };
    }

    const [total, tickets] = await Promise.all([
      IssueTicket.countDocuments(query),
      IssueTicket.find(query)
        .populate("doctor", "fullName email specialization profilePicture")
        .sort({ lastMessageAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    return res.status(200).json({
      tickets,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[listTickets]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTicketById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ticket id" });
    }

    const ticket = await IssueTicket.findById(req.params.id).populate(
      "doctor",
      "fullName email specialization profilePicture"
    );

    if (!ticket) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (!isAdminRequest(req) && String(ticket.doctor._id) !== String(req.doctorId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json({ ticket });
  } catch (error) {
    console.error("[getTicketById]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addTicketMessage = async (req, res) => {
  try {
    const { text } = req.body;

    const messageText = sanitizeIssueText(text, 5000);
    if (!messageText && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: "Message text or attachment is required" });
    }

    const ticket = await IssueTicket.findById(req.params.id).populate("doctor", "fullName email phone");
    if (!ticket) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const adminRequest = isAdminRequest(req);

    if (!adminRequest && String(ticket.doctor._id) !== String(req.doctorId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const senderRole = adminRequest ? "admin" : "doctor";
    const senderName = adminRequest ? (req.admin?.name || "Admin") : ticket.doctor.fullName;

    const messagePayload = await buildTicketMessagePayload({
      senderRole,
      senderName,
      text: messageText,
      files: req.files || [],
      folder: isBillingCategory(ticket.category) ? "support-attachments" : "issue-chats",
    });

    ticket.messages.push(messagePayload);
    ticket.lastMessageAt = new Date();

    if (adminRequest && ["Open", "Reopened"].includes(ticket.status)) {
      ticket.status = "In Progress";
    }

    await ticket.save();

    if (!adminRequest && isBillingCategory(ticket.category)) {
      const imageAttachments = messagePayload.attachments.filter((attachment) =>
        allowedImageMimeTypes.has(String(attachment.mimeType || "").toLowerCase())
      );

      for (const attachment of imageAttachments) {
        await PaymentProof.create({
          doctorId: ticket.doctor._id,
          supportTicketId: ticket._id,
          doctorName: ticket.doctor.fullName,
          doctorEmail: ticket.doctor.email,
          doctorPhone: ticket.doctor.phone,
          screenshotUrl: attachment.url,
          amount: 2499,
          billingCycle: "monthly",
          status: "PENDING",
          rejectionReason: "",
        });
      }

      if (imageAttachments.length > 0) {
        await Doctor.findByIdAndUpdate(ticket.doctor._id, {
          subscriptionStatus: "PENDING_VERIFICATION",
        });
      }
    }

    await emitIssueTicketUpdate(ticket);

    if (adminRequest) {
      await Notification.create({
        doctor: ticket.doctor._id,
        type: "issue-message",
        title: "New admin reply",
        message: messageText ? `Admin replied: ${messageText.slice(0, 140)}` : "Admin sent an attachment",
        metadata: {
          issueId: ticket._id,
          issueTitle: ticket.title,
        },
      });
    }

    return res.status(201).json({ message: "Message sent", ticket });
  } catch (error) {
    console.error("[addTicketMessage]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const ticket = await IssueTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const adminRequest = isAdminRequest(req);

    if (!adminRequest && String(ticket.doctor) !== String(req.doctorId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!adminRequest && status !== "Reopened") {
      return res.status(403).json({ message: "Only admin can set this status" });
    }

    if (!adminRequest && ticket.status !== "Resolved") {
      return res.status(400).json({ message: "Only resolved issues can be reopened" });
    }

    ticket.status = status;
    ticket.lastMessageAt = new Date();

    if (status === "Resolved") {
      ticket.resolvedAt = new Date();
      ticket.resolvedBy = req.admin?.email || process.env.ADMIN_EMAIL || "admin";
    }

    if (status === "Reopened") {
      ticket.resolvedAt = null;
      ticket.resolvedBy = "";
    }

    await ticket.save();
    await emitIssueTicketUpdate(ticket);

    if (adminRequest) {
      await Notification.create({
        doctor: ticket.doctor,
        type: "issue-status",
        title: "Issue status changed",
        message: `Admin marked issue \"${ticket.title}\" as ${status}.`,
        metadata: {
          issueId: ticket._id,
          status,
        },
      });
    }

    return res.status(200).json({ message: "Issue status updated", ticket });
  } catch (error) {
    console.error("[updateTicketStatus]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
