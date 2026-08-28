import express from "express";
import {
  listDoctors,
  getDoctorProfile,
  getDoctorSlots,
  getDoctorReviews,
  getReviewByToken,
  submitReview,
} from "../controllers/public.controller.js";

const router = express.Router();

// Doctor discovery
router.get("/doctors", listDoctors);
router.get("/doctors/:id", getDoctorProfile);
router.get("/doctors/:id/slots", getDoctorSlots);
router.get("/doctors/:id/reviews", getDoctorReviews);

// Review submission (token-based, no auth)
router.get("/reviews/:token", getReviewByToken);
router.post("/reviews/:token", submitReview);

export default router;
