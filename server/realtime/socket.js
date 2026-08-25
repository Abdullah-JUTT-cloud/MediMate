import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import IssueTicket from "../models/issueTicket.model.js";

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
const getAdminRoom = () => "admin";
const getIssueTicketRoom = (ticketId) => `issue-ticket:${ticketId}`;

const isRoomActive = (room) => {
  if (!ioInstance || !room) return false;
  const socketsInRoom = ioInstance.sockets.adapter.rooms.get(room);
  return Boolean(socketsInRoom && socketsInRoom.size > 0);
};

const applyIssueOutgoingDeliveryState = async ({ ticket, senderRole }) => {
  if (!ticket || !senderRole) return { ticket, deliveredMessageIds: [] };

  const doctorId = String(ticket.doctor?._id || ticket.doctor || "");
  if (!doctorId) return { ticket, deliveredMessageIds: [] };

  const recipientRoom = senderRole === "doctor" ? getAdminRoom() : getDoctorRoom(doctorId);
  if (!isRoomActive(recipientRoom)) {
    return { ticket, deliveredMessageIds: [] };
  }

  const deliveredAt = new Date();
  const deliveredMessageIds = [];

  for (const message of ticket.messages || []) {
    if (message?.senderRole !== senderRole) continue;
    if (message?.status && message.status !== "sent") continue;
    message.status = "delivered";
    message.deliveredAt = message.deliveredAt || deliveredAt;
    deliveredMessageIds.push(String(message._id));
  }

  if (deliveredMessageIds.length > 0) {
    ticket.markModified("messages");
    await ticket.save();
  }

  return { ticket, deliveredMessageIds };
};

const applyIssueIncomingSeenState = async ({ ticket, viewerRole, messageIds = [] }) => {
  if (!ticket || !viewerRole) return { ticket, seenMessageIds: [] };

  const normalizedMessageIds = new Set((messageIds || []).map(String));
  const seenAt = new Date();
  const seenMessageIds = [];

  for (const message of ticket.messages || []) {
    if (message?.senderRole === viewerRole) continue;
    if (normalizedMessageIds.size > 0 && !normalizedMessageIds.has(String(message._id))) continue;
    if (message?.status === "seen") continue;
    message.status = "seen";
    message.seenAt = seenAt;
    message.deliveredAt = message.deliveredAt || seenAt;
    seenMessageIds.push(String(message._id));
  }

  if (seenMessageIds.length > 0) {
    ticket.markModified("messages");
    await ticket.save();
  }

  return { ticket, seenMessageIds };
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

  const senderRole = ticket?.messages?.[ticket.messages.length - 1]?.senderRole || null;
  const deliveryResult = senderRole
    ? await applyIssueOutgoingDeliveryState({ ticket, senderRole })
    : { ticket, deliveredMessageIds: [] };
  const hydratedTicket = deliveryResult.ticket || ticket;

  const doctorId = String(hydratedTicket.doctor?._id || hydratedTicket.doctor);
  const serializedTicket = hydratedTicket.toObject ? hydratedTicket.toObject() : hydratedTicket;

  ioInstance.to(getAdminRoom()).emit("issue-ticket:list-updated", { ticket: serializedTicket });
  ioInstance.to(getIssueTicketRoom(ticketId)).emit("issue-ticket:detail-updated", { ticketId, ticket: serializedTicket });

  if (doctorId) {
    ioInstance.to(getDoctorRoom(doctorId)).emit("issue-ticket:list-updated", { ticket: serializedTicket });
  }

  if (deliveryResult.deliveredMessageIds.length > 0) {
    const payload = {
      ticketId,
      doctorId,
      messageIds: deliveryResult.deliveredMessageIds,
      status: "delivered",
    };
    ioInstance.to(getAdminRoom()).emit("issue-message_delivered", payload);
    ioInstance.to(getDoctorRoom(doctorId)).emit("issue-message_delivered", payload);
    ioInstance.to(getIssueTicketRoom(ticketId)).emit("issue-message_delivered", payload);
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
    if (auth.role === "admin") {
      socket.join(getAdminRoom());
    }

    socket.on("issue-ticket:join", async ({ ticketId } = {}) => {
      try {
        if (!ticketId) return;
        const ticket = await IssueTicket.findById(ticketId);
        if (!ticket) return;

        if (auth.role === "admin" || (auth.role === "doctor" && String(ticket.doctor) === auth.id)) {
          socket.join(getIssueTicketRoom(ticketId));
          const senderRole = auth.role === "admin" ? "doctor" : "admin";
          const deliveryResult = await applyIssueOutgoingDeliveryState({ ticket, senderRole });
          if (deliveryResult.deliveredMessageIds.length > 0) {
            await emitIssueTicketUpdated(deliveryResult.ticket);
          }
        }
      } catch (error) {
        console.error("[socket][issue-ticket:join]", error);
      }
    });

    socket.on("issue-ticket:leave", ({ ticketId } = {}) => {
      if (!ticketId) return;
      socket.leave(getIssueTicketRoom(ticketId));
    });

    socket.on("issue-message_seen", async ({ ticketId, messageIds = [] } = {}) => {
      try {
        if (!ticketId) return;
        const ticket = await IssueTicket.findById(ticketId).populate(
          "doctor",
          "fullName email specialization profilePicture",
        );
        if (!ticket) return;

        const doctorId = String(ticket.doctor?._id || ticket.doctor || "");
        if (!doctorId) return;

        if (auth.role !== "admin" && (auth.role !== "doctor" || doctorId !== auth.id)) {
          return;
        }

        const result = await applyIssueIncomingSeenState({
          ticket,
          viewerRole: auth.role,
          messageIds,
        });
        if (result.seenMessageIds.length === 0) return;

        const payload = {
          ticketId: String(ticket._id),
          doctorId,
          messageIds: result.seenMessageIds,
          status: "seen",
        };
        ioInstance.to(getAdminRoom()).emit("issue-message_seen", payload);
        ioInstance.to(getDoctorRoom(doctorId)).emit("issue-message_seen", payload);
        ioInstance.to(getIssueTicketRoom(String(ticket._id))).emit("issue-message_seen", payload);

        await emitIssueTicketUpdated(result.ticket);
      } catch (error) {
        console.error("[socket][issue-message_seen]", error);
      }
    });
  });

  return ioInstance;
};

export const emitIssueTicketUpdate = emitIssueTicketUpdated;
