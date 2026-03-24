import express from "express";
import {
  getInsights,
} from "../controllers/insights.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", verifyToken, getInsights);

export default router;