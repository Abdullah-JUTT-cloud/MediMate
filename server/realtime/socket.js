import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import Patient from "../models/patient.model.js";
import PatientChat from "../models/patientChat.model.js";
import IssueTicket from "../models/issueTicket.model.js";
import { Doctor } from "../models/doctor.model.js";

let ioInstance = null;

const parseCookies = (cookieHeader = "") =>
  cookieHeader
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, cookie) => {
      const separatorIndex = cookie.indexOf("=");
      if (separatorIndex === -1) return acc;
      const key = cookie.slice(0, separatorIndex).trim();
      const value = cookie.slice(separatorIndex + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});

const getSocketAuth = (socket) => {
  const cookies = parseCookies(socket.handshake.headers?.cookie || "");

  const identities = {};

  if (cookies.admin_token) {
    try {
      const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
      const decoded = jwt.verify(cookies.admin_token, secret);
      if (decoded?.role === "admin") {
        identities.admin = {
          role: "admin",
          id: decoded.email || "admin",
          name: decoded.name || process.env.ADMIN_NAME || "Admin",
        };
      }
    } catch {
      // Ignore invalid admin token and continue checking other identities.
    }
  }

  if (cookies.patientToken) {
    try {
      const decoded = jwt.verify(cookies.patientToken, process.env.JWT_SECRET);
      if (decoded?.role === "patient" && decoded?.id) {
        identities.patient = {
          role: "patient",
          id: String(decoded.id),
        };
      }
    } catch {
      // Ignore invalid patient token and continue checking other identities.
    }
  }

  if (cookies.token) {
    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
      if (decoded?.id) {
        identities.doctor = {
          role: "doctor",
          id: String(decoded.id),
        };
      }
    } catch {
      // Ignore invalid doctor token and continue checking other identities.
    }
  }

  const preferredRole = String(socket.handshake.auth?.preferredRole || "").toLowerCase();
  if (preferredRole && identities[preferredRole]) {
    return identities[preferredRole];
  }

  const availableIdentities = Object.values(identities);
  if (availableIdentities.length === 1) {
    return availableIdentities[0];
  }

  if (identities.doctor) return identities.doctor;
  if (identities.patient) return identities.patient;
  if (identities.admin) return identities.admin;

  return null;
};

const getDoctorRoom = (doctorId) => `doctor:${doctorId}`;
const getPatientRoom = (patientId) => `patient:${patientId}`;
const getAdminRoom = () => "admin";
const getPatientChatThreadRoom = (doctorId, patientId) => `patient-chat:${doctorId}:${patientId}`;
const getIssueTicketRoom = (ticketId) => `issue-ticket:${ticketId}`;

const getUnreadIncomingCount = (messages = []) => {
  let unreadCount = 0;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
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

const buildDoctorPatientListEntry = async (doctorId, patientId, chatOverride = null) => {
  const [patient, chat] = await Promise.all([
    Patient.findOne({ _id: patientId, doctor: doctorId })
      .select("name phone locations chatUsername chatAccessEnabled chatInviteStatus chatInviteSentAt chatLastLoginAt createdAt")
      .lean(),
    chatOverride
      ? Promise.resolve(chatOverride.toObject ? chatOverride.toObject() : chatOverride)
      : PatientChat.findOne({ doctor: doctorId, patient: patientId }).select("patient lastMessageAt messages").lean(),
  ]);

  if (!patient) return null;

  const messages = Array.isArray(chat?.messages) ? chat.messages : [];
  const lastMessage = messages[messages.length - 1] || null;

  return {
    ...patient,
    lastMessageAt: chat?.lastMessageAt || null,
    lastMessage,
    messageCount: messages.length,
    unreadIncomingCount: getUnreadIncomingCount(messages),
  };
};

const buildDoctorPatientDetailPayload = async (doctorId, patientId, chatOverride = null) => {
  const [patient, doctor, chat] = await Promise.all([
    Patient.findOne({ _id: patientId, doctor: doctorId })
      .select("name phone locations chatUsername chatAccessEnabled chatInviteStatus chatInviteSentAt chatLastLoginAt createdAt")
      .lean(),
    Doctor.findById(doctorId).select("fullName").lean(),
    chatOverride
      ? Promise.resolve(chatOverride.toObject ? chatOverride.toObject() : chatOverride)
      : PatientChat.findOne({ doctor: doctorId, patient: patientId }).lean(),
  ]);

  if (!patient || !chat) return null;

  return {
    patientId: String(patientId),
    payload: {
      patient,
      chat,
      senderName: doctor?.fullName || "Doctor",
    },
  };
};

const buildPatientChatDetailPayload = async (doctorId, patientId, chatOverride = null) => {
  const [patient, doctor, chat] = await Promise.all([
    Patient.findById(patientId)
      .select("doctor name phone locations chatUsername chatAccessEnabled chatInviteStatus chatInviteSentAt chatLastLoginAt")
      .lean(),
    Doctor.findById(doctorId).select("fullName specialization profilePicture clinics hospitals").lean(),
    chatOverride
      ? Promise.resolve(chatOverride.toObject ? chatOverride.toObject() : chatOverride)
      : PatientChat.findOne({ doctor: doctorId, patient: patientId }).lean(),
  ]);

  if (!patient || !chat) return null;

  return {
    patientId: String(patientId),
    payload: {
      patient,
      doctor,
      chat,
    },
  };
};

const emitPatientChatUpdated = async ({ doctorId, patientId, chat }) => {
  if (!ioInstance) return;

  const [listEntry, doctorDetail, patientDetail] = await Promise.all([
    buildDoctorPatientListEntry(doctorId, patientId, chat),
    buildDoctorPatientDetailPayload(doctorId, patientId, chat),
    buildPatientChatDetailPayload(doctorId, patientId, chat),
  ]);

  if (listEntry) {
    ioInstance.to(getDoctorRoom(doctorId)).emit("patient-chat:list-updated", { entry: listEntry });
  }

  if (doctorDetail) {
    ioInstance.to(getDoctorRoom(doctorId)).emit("patient-chat:detail-updated", doctorDetail);
    ioInstance.to(getPatientChatThreadRoom(doctorId, patientId)).emit("patient-chat:detail-updated", doctorDetail);
  }

  if (patientDetail) {
    ioInstance.to(getPatientRoom(patientId)).emit("patient-chat:self-updated", patientDetail);
  }
};

const emitIssueTicketUpdated = async (ticketInput) => {
  if (!ioInstance) return;

  const ticketId = String(ticketInput?._id || ticketInput);
  if (!ticketId) return;

  const ticket = await IssueTicket.findById(ticketId).populate(
    "doctor",
    "fullName email specialization profilePicture",
  );
  if (!ticket) return;

  const doctorId = String(ticket.doctor?._id || ticket.doctor);
  const serializedTicket = ticket.toObject ? ticket.toObject() : ticket;

  ioInstance.to(getAdminRoom()).emit("issue-ticket:list-updated", { ticket: serializedTicket });
  ioInstance.to(getIssueTicketRoom(ticketId)).emit("issue-ticket:detail-updated", { ticketId, ticket: serializedTicket });

  if (doctorId) {
    ioInstance.to(getDoctorRoom(doctorId)).emit("issue-ticket:list-updated", { ticket: serializedTicket });
  }
};

export const initSocketServer = (httpServer, allowedOrigins = []) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    try {
      const auth = getSocketAuth(socket);
      if (!auth) {
        return next(new Error("Unauthorized"));
      }
      socket.data.auth = auth;
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    const auth = socket.data.auth;

    if (auth.role === "doctor") {
      socket.join(getDoctorRoom(auth.id));
    }
    if (auth.role === "patient") {
      socket.join(getPatientRoom(auth.id));
    }
    if (auth.role === "admin") {
      socket.join(getAdminRoom());
    }

    socket.on("patient-chat:join", async ({ patientId } = {}) => {
      try {
        if (auth.role === "doctor") {
          const patient = await Patient.findOne({ _id: patientId, doctor: auth.id }).select("_id doctor").lean();
          if (!patient) return;
          socket.join(getPatientChatThreadRoom(auth.id, String(patient._id)));
          return;
        }

        if (auth.role === "patient") {
          const patient = await Patient.findById(auth.id).select("_id doctor").lean();
          if (!patient?.doctor) return;
          socket.join(getPatientChatThreadRoom(String(patient.doctor), String(patient._id)));
        }
      } catch (error) {
        console.error("[socket][patient-chat:join]", error);
      }
    });

    socket.on("patient-chat:leave", async ({ patientId } = {}) => {
      try {
        if (auth.role === "doctor" && patientId) {
          socket.leave(getPatientChatThreadRoom(auth.id, String(patientId)));
          return;
        }

        if (auth.role === "patient") {
          const patient = await Patient.findById(auth.id).select("_id doctor").lean();
          if (!patient?.doctor) return;
          socket.leave(getPatientChatThreadRoom(String(patient.doctor), String(patient._id)));
        }
      } catch (error) {
        console.error("[socket][patient-chat:leave]", error);
      }
    });

    socket.on("issue-ticket:join", async ({ ticketId } = {}) => {
      try {
        if (!ticketId) return;
        const ticket = await IssueTicket.findById(ticketId).select("doctor").lean();
        if (!ticket) return;

        if (auth.role === "admin" || (auth.role === "doctor" && String(ticket.doctor) === auth.id)) {
          socket.join(getIssueTicketRoom(ticketId));
        }
      } catch (error) {
        console.error("[socket][issue-ticket:join]", error);
      }
    });

    socket.on("issue-ticket:leave", ({ ticketId } = {}) => {
      if (!ticketId) return;
      socket.leave(getIssueTicketRoom(ticketId));
    });
  });

  return ioInstance;
};

export const emitPatientChatUpdate = emitPatientChatUpdated;
export const emitIssueTicketUpdate = emitIssueTicketUpdated;
