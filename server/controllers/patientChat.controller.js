import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import Patient from "../models/patient.model.js";
import PatientChat from "../models/patientChat.model.js";
import { Doctor } from "../models/doctor.model.js";
import Notification from "../models/notification.model.js";
import { allowedImageMimeTypes } from "../middlewares/upload.middleware.js";
import { emitPatientChatUpdate } from "../realtime/socket.js";

const uploadAttachmentToCloudinary = async (file) => {
  const mimeType = file.detectedMimeType || file.mimetype;
  const isImage = allowedImageMimeTypes.has(mimeType);
  const resourceType = isImage ? "image" : "raw";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "medimate/patient-chats",
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );

    stream.end(file.buffer);
  });
};

const buildMessagePayload = async ({ senderRole, senderId, senderName, text, files }) => {
  const attachments = [];

  for (const file of files || []) {
    const uploadResult = await uploadAttachmentToCloudinary(file);
    attachments.push({
      url: uploadResult.secure_url,
      name: file.originalname,
      mimeType: file.detectedMimeType || file.mimetype,
      size: file.size || 0,
    });
  }

  return {
    senderRole,
    senderId,
    senderRoleRef: senderRole === "doctor" ? "Doctor" : "Patient",
    senderName,
    text: String(text || "").trim(),
    attachments,
  };
};

const getOrCreateChat = async ({ doctorId, patientId }) => {
  let chat = await PatientChat.findOne({ doctor: doctorId, patient: patientId });
  if (!chat) {
    chat = await PatientChat.create({ doctor: doctorId, patient: patientId, messages: [] });
  }
  return chat;
};

const getUnreadIncomingCount = (messages = []) => {
  let unreadCount = 0;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.senderRole === "patient") {
      unreadCount += 1;
      continue;
    }
    if (message?.senderRole === "doctor") {
      break;
    }
  }
  return unreadCount;
};

export const listDoctorPatientChats = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = String(req.query.search || "").trim();

    const query = { doctor: req.doctorId, chatAccessEnabled: true };
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { chatUsername: { $regex: escaped, $options: "i" } },
        { phone: { $regex: escaped, $options: "i" } },
      ];
    }

    const [total, patients] = await Promise.all([
      Patient.countDocuments(query),
      Patient.find(query)
        .select("name phone locations chatUsername chatAccessEnabled chatInviteStatus chatInviteSentAt chatLastLoginAt createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const chatMap = await PatientChat.find({ doctor: req.doctorId, patient: { $in: patients.map((p) => p._id) } })
      .select("patient lastMessageAt messages")
      .lean();

    const byPatientId = new Map(chatMap.map((chat) => [String(chat.patient), chat]));
    const enrichedPatients = patients.map((patient) => {
      const chat = byPatientId.get(String(patient._id));
      const chatMessages = chat?.messages || [];
      const lastMessage = chatMessages[chatMessages.length - 1] || null;
      const unreadIncomingCount = getUnreadIncomingCount(chatMessages);

      return {
        ...patient,
        lastMessageAt: chat?.lastMessageAt || null,
        lastMessage,
        messageCount: chatMessages.length,
        unreadIncomingCount,
      };
    });

    return res.status(200).json({
      patients: enrichedPatients,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[listDoctorPatientChats]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getDoctorPatientChat = async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!mongoose.isValidObjectId(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    const patient = await Patient.findOne({ _id: patientId, doctor: req.doctorId })
      .select("name phone locations chatUsername chatAccessEnabled chatInviteStatus chatInviteSentAt chatLastLoginAt createdAt")
      .lean();
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const doctor = await Doctor.findById(req.doctorId).select("fullName").lean();
    const chat = await getOrCreateChat({ doctorId: req.doctorId, patientId });

    return res.status(200).json({
      patient,
      chat,
      senderName: doctor?.fullName || "Doctor",
    });
  } catch (error) {
    console.error("[getDoctorPatientChat]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendDoctorPatientChatMessage = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { text } = req.body;

    if (!mongoose.isValidObjectId(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    const patient = await Patient.findOne({ _id: patientId, doctor: req.doctorId }).select("name doctor chatAccessEnabled");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    if (!patient.chatAccessEnabled) {
      return res.status(400).json({ message: "Chat access is disabled for this patient" });
    }

    const doctor = await Doctor.findById(req.doctorId).select("fullName");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const messageText = String(text || "").trim();
    if (!messageText && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: "Message text or attachment is required" });
    }

    const chat = await getOrCreateChat({ doctorId: req.doctorId, patientId });
    const message = await buildMessagePayload({
      senderRole: "doctor",
      senderId: req.doctorId,
      senderName: doctor.fullName,
      text: messageText,
      files: req.files || [],
    });

    chat.messages.push(message);
    chat.lastMessageAt = new Date();
    await chat.save();
    await emitPatientChatUpdate({ doctorId: req.doctorId, patientId, chat });

    return res.status(201).json({ message: "Message sent", chat });
  } catch (error) {
    console.error("[sendDoctorPatientChatMessage]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getPatientChat = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patientId).select("doctor name phone locations chatUsername chatAccessEnabled chatInviteStatus chatInviteSentAt chatLastLoginAt");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const doctor = await Doctor.findById(patient.doctor).select("fullName specialization profilePicture clinics hospitals").lean();
    const chat = await getOrCreateChat({ doctorId: patient.doctor, patientId: patient._id });

    return res.status(200).json({
      patient,
      doctor,
      chat,
    });
  } catch (error) {
    console.error("[getPatientChat]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendPatientChatMessage = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patientId).select("doctor name chatAccessEnabled");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    if (!patient.chatAccessEnabled) {
      return res.status(400).json({ message: "Chat access is disabled for this patient" });
    }

    const doctor = await Doctor.findById(patient.doctor).select("fullName");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const messageText = String(req.body?.text || "").trim();
    if (!messageText && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: "Message text or attachment is required" });
    }

    const chat = await getOrCreateChat({ doctorId: patient.doctor, patientId: patient._id });
    const message = await buildMessagePayload({
      senderRole: "patient",
      senderId: patient._id,
      senderName: patient.name,
      text: messageText,
      files: req.files || [],
    });

    chat.messages.push(message);
    chat.lastMessageAt = new Date();
    await chat.save();
    await emitPatientChatUpdate({ doctorId: patient.doctor, patientId: patient._id, chat });

    try {
      await Notification.create({
        doctor: patient.doctor,
        type: "patient-message",
        title: `New message from ${patient.name}`,
        message: messageText ? messageText.slice(0, 140) : "Patient sent an attachment",
        metadata: {
          patientId: patient._id,
          patientName: patient.name,
        },
      });
    } catch (notificationError) {
      console.error("[sendPatientChatMessage][notification]", notificationError);
    }

    return res.status(201).json({ message: "Message sent", chat });
  } catch (error) {
    console.error("[sendPatientChatMessage]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
