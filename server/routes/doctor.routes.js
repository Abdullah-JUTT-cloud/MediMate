import express from "express"
import { verifyToken } from "../middlewares/auth.middleware.js";
import { getProfile,updateProfile } from "../controllers/doctor.controller.js";
import upload from "../middlewares/upload.middleware.js";
import { uploadProfilePicture } from "../controllers/doctor.controller.js";


const router=express.Router();

router.get("/profile", verifyToken, getProfile)

router.put("/update-profile",verifyToken,updateProfile)

router.post("/upload-profile-picture", verifyToken, upload.single("profilePicture"), uploadProfilePicture);

export default router;