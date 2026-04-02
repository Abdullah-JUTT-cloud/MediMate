import mongoose from "mongoose";
import IssueTicket from "../models/issueTicket.model.js";
import { Doctor } from "../models/doctor.model.js";
import Notification from "../models/notification.model.js";

const validCategories = [
  "General Feedback",
  "Technical Issue",
  "Billing/Subscription",
  "Verification/Profile",
  "Other",
];

const validStatuses = ["Open", "In Progress", "Resolved", "Reopened", "Closed"];

const isAdminRequest = (req) => Boolean(req.admin?.role === "admin");

export const createTicket = async (req, res) => {
  try {
    const { category, title, description } = req.body;

    if (!category || !title || !description) {
      return res.status(400).json({ message: "Category, title and description are required" });
    }

    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid issue category" });
    }

    const doctor = await Doctor.findById(req.doctorId).select("fullName");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const ticket = await IssueTicket.create({
      doctor: req.doctorId,
      category,
      title,
      description,
      status: "Open",
      messages: [
        {
          senderRole: "doctor",
          senderName: doctor.fullName,
          text: description,
        },
      ],
      lastMessageAt: new Date(),
    });

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

    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const ticket = await IssueTicket.findById(req.params.id).populate("doctor", "fullName");
    if (!ticket) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const adminRequest = isAdminRequest(req);

    if (!adminRequest && String(ticket.doctor._id) !== String(req.doctorId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const senderRole = adminRequest ? "admin" : "doctor";
    const senderName = adminRequest ? (req.admin?.name || "Admin") : ticket.doctor.fullName;

    ticket.messages.push({ senderRole, senderName, text: String(text).trim() });
    ticket.lastMessageAt = new Date();

    if (adminRequest && ["Open", "Reopened"].includes(ticket.status)) {
      ticket.status = "In Progress";
    }

    await ticket.save();

    if (adminRequest) {
      await Notification.create({
        doctor: ticket.doctor._id,
        type: "issue-message",
        title: "New admin reply",
        message: `Admin replied to your issue: ${ticket.title}`,
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