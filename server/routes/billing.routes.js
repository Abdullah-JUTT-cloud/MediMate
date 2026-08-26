import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { getBillingLog, createExtraPayment, updateBillingStatus } from "../controllers/billing.controller.js";

const router = express.Router();

router.get("/log", verifyToken, getBillingLog);
router.post("/extra-payment", verifyToken, createExtraPayment);
router.patch("/:id/status", verifyToken, updateBillingStatus);

export default router;
