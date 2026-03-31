import express from "express";
import {
  getInsights,
  getRevenueLab,
} from "../controllers/insights.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", verifyToken, getInsights);
router.get("/revenue-lab", verifyToken, getRevenueLab);

export default router;