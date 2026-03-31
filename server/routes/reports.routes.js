import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { getFinancialReport, getTaxSummaryReport } from "../controllers/reports.controller.js";

const router = express.Router();

router.get("/financial", verifyToken, getFinancialReport);
router.get("/tax-summary", verifyToken, getTaxSummaryReport);

export default router;
