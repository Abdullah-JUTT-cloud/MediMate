import express from "express";
import {
  createAppointment,
  getAppointments,
  getAppointment,
  deleteAppointment,
  updateAppointment,
  emergencyCancel,
  sendRescheduleWhatsApp,
  getTodayQueue,
  startConsultation,
  sendOverdueReminder,
} from "../controllers/appointment.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.post("/emergency-cancel", verifyToken, emergencyCancel);
router.post("/:id/reschedule-whatsapp", verifyToken, sendRescheduleWhatsApp);
router.get("/today", verifyToken, getTodayQueue);
router.post("/:id/start", verifyToken, startConsultation);
router.post("/:id/remind", verifyToken, sendOverdueReminder);
router.post("/", verifyToken, createAppointment);
router.get("/", verifyToken, getAppointments);
router.put("/:id", verifyToken, updateAppointment);
router.delete("/:id", verifyToken, deleteAppointment);
router.get("/:id", verifyToken, getAppointment);

export default router;
