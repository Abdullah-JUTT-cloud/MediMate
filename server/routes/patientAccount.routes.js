import express from "express";
import multer from "multer";
import {
  registerPatientAccount,
  verifyPatientEmail,
  resendPatientOtp,
  loginPatientAccount,
  logoutPatientAccount,
  checkPatientSession,
  bookAppointment,
  getMyAppointments,
  cancelMyAppointment,
  submitMyReview,
  patientForgotPassword,
  patientVerifyResetOtp,
  patientResetPassword,
  rescheduleAppointment,
} from "../controllers/patientAccount.controller.js";
import {
  verifyPatientAccountToken,
  verifyOptionalPatientAccountToken,
} from "../middlewares/patientAccountAuth.middleware.js";

const router = express.Router();

// Multer: memory storage for R2 upload (screenshots ≤ 10 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for payment proof"));
    }
  },
});

// ── Public (no auth) ────────────────────────────────────
router.post("/register", registerPatientAccount);
router.post("/verify-email", verifyPatientEmail);
router.post("/resend-otp", resendPatientOtp);
router.post("/login", loginPatientAccount);
router.post("/forgot-password", patientForgotPassword);
router.post("/verify-reset-otp", patientVerifyResetOtp);
router.post("/reset-password", patientResetPassword);

// ── Protected (patientAccountToken cookie required) ─────
router.post("/logout", verifyPatientAccountToken, logoutPatientAccount);
router.get("/me", verifyPatientAccountToken, checkPatientSession);

// Appointments
router.post(
  "/book",
  verifyPatientAccountToken,
  upload.single("screenshot"),
  bookAppointment
);
router.get("/bookings", verifyPatientAccountToken, getMyAppointments);
router.get("/appointments", verifyPatientAccountToken, getMyAppointments);
router.patch("/appointments/:id/cancel", verifyPatientAccountToken, cancelMyAppointment);
router.patch("/appointments/:id/reschedule", verifyPatientAccountToken, rescheduleAppointment);

// Patient reviews (authenticated — "Leave Feedback" from the Patient Dashboard)
router.post("/reviews", verifyPatientAccountToken, submitMyReview);

export default router;
