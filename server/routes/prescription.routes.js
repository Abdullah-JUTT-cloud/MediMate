import express from "express";
import {verifyToken} from "../middlewares/auth.middleware.js";
import {generatePrescription,savePrescription,downloadPrescription,sendWhatsApp,getPrescriptionDownloadUrl} from "../controllers/prescription.controller.js";

const router = express.Router();

router.post("/generate/:checkupId",verifyToken,generatePrescription);
router.post("/save/:checkupId",verifyToken,savePrescription);
// `view` serves the PDF inline (Content-Disposition: inline) so it opens in a new tab.
router.get("/view/:checkupId",verifyToken,downloadPrescription);
// `download` serves the PDF as an attachment when `?download=true` is passed.
router.get("/download/:checkupId",verifyToken,downloadPrescription);
router.get("/download-url/:checkupId",verifyToken,getPrescriptionDownloadUrl);
router.post("/send-whatsapp/:checkupId", verifyToken, sendWhatsApp);

export default router;