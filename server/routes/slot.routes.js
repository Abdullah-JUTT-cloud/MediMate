import express from "express";
import { getSlots } from "../controllers/appointment.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

/**
 * GET /api/slots?date=YYYY-MM-DD
 *
 * Slot availability aggregation: per-slot standardCount / emergencyCount /
 * isFull. Shared by the Patient booking modal and the Appointments booking
 * form so both render identical capacity data and emergency badges.
 */
const router = express.Router();

router.get("/", verifyToken, getSlots);

export default router;
