import express from "express";
import upload, { verifyUploadedFilesSignature } from "../middlewares/upload.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { verifyPatientToken } from "../middlewares/patientAuth.middleware.js";
import {
  getDoctorPatientChat,
  getPatientChat,
  listDoctorPatientChats,
  sendDoctorPatientChatMessage,
  sendPatientChatMessage,
} from "../controllers/patientChat.controller.js";

const router = express.Router();

router.get("/doctor", verifyToken, listDoctorPatientChats);
router.get("/doctor/:patientId", verifyToken, getDoctorPatientChat);
router.post(
  "/doctor/:patientId/messages",
  verifyToken,
  upload.array("attachments", 5),
  verifyUploadedFilesSignature,
  sendDoctorPatientChatMessage,
);

router.get("/patient/me", verifyPatientToken, getPatientChat);
router.post(
  "/patient/me/messages",
  verifyPatientToken,
  upload.array("attachments", 5),
  verifyUploadedFilesSignature,
  sendPatientChatMessage,
);

export default router;