import express from "express";
import {verifyToken} from "../middlewares/auth.middleware.js";
import {generatePrescription,savePrescription,sendWhatsApp} from "../controllers/prescription.controller.js";

const router = express.Router();

router.post("/generate/:checkupId",verifyToken,generatePrescription);
router.post("/save/:checkupId",verifyToken,savePrescription);
router.post("/send-whatsapp/:checkupId", verifyToken, sendWhatsApp);

export default router;