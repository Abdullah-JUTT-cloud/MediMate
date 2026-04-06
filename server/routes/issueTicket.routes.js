import express from "express";
import {
  addTicketMessage,
  createTicket,
  getTicketById,
  listTickets,
  updateTicketStatus,
} from "../controllers/issueTicket.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { verifyAdminToken } from "../middlewares/admin.middleware.js";
import upload, { verifyUploadedFilesSignature } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/doctor", verifyToken, createTicket);
router.get("/doctor", verifyToken, listTickets);
router.get("/doctor/:id", verifyToken, getTicketById);
router.post("/doctor/:id/messages", verifyToken, upload.array("attachments", 5), verifyUploadedFilesSignature, addTicketMessage);
router.patch("/doctor/:id/status", verifyToken, updateTicketStatus);

router.get("/admin", verifyAdminToken, listTickets);
router.get("/admin/:id", verifyAdminToken, getTicketById);
router.post("/admin/:id/messages", verifyAdminToken, upload.array("attachments", 5), verifyUploadedFilesSignature, addTicketMessage);
router.patch("/admin/:id/status", verifyAdminToken, updateTicketStatus);

export default router;