import express from "express";
import {
  adminLogin,
  adminLogout,
  adminMe,
  getDoctorVerificationDetail,
  listDoctorsForVerification,
  updateDoctorSubscriptionStatus,
  updateDoctorVerificationStatus,
} from "../controllers/admin.controller.js";
import { verifyAdminToken } from "../middlewares/admin.middleware.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/logout", verifyAdminToken, adminLogout);
router.get("/me", verifyAdminToken, adminMe);

router.get("/doctors", verifyAdminToken, listDoctorsForVerification);
router.get("/doctors/:id", verifyAdminToken, getDoctorVerificationDetail);
router.patch("/doctors/:id/verification-status", verifyAdminToken, updateDoctorVerificationStatus);
router.patch("/doctors/:id/subscription-status", verifyAdminToken, updateDoctorSubscriptionStatus);

export default router;
