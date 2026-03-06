import express from "express"
import { verifyToken } from "../middlewares/auth.middleware.js";
import { getProfile,updateProfile } from "../controllers/doctor.controller.js";


const router=express.Router();

router.get("/profile", verifyToken, getProfile)

router.put("/update-profile",verifyToken,updateProfile)

export default router;