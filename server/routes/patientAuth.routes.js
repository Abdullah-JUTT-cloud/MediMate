import express from "express";
import { getPatientSession, loginPatient, logoutPatient } from "../controllers/patientAuth.controller.js";
import { verifyPatientToken } from "../middlewares/patientAuth.middleware.js";

const router = express.Router();

router.post("/login", loginPatient);
router.post("/logout", logoutPatient);
router.get("/me", verifyPatientToken, getPatientSession);

export default router;