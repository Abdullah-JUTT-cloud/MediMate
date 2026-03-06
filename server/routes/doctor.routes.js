import express from "express"
import { verifyToken } from "../middlewares/auth.middleware.js";
import { getProfile } from "../controllers/doctor.controller.js";


const router=express.Router();

router.get("/profile", verifyToken, getProfile)

export default router;