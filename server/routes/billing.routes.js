import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { getBillingLog, updateBillingStatus } from "../controllers/billing.controller.js";

const router = express.Router();

router.get("/log", verifyToken, getBillingLog);
router.patch("/:id/status", verifyToken, updateBillingStatus);

export default router;
