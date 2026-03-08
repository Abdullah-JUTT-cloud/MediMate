import express from "express";
import { registerDoctor, verifyEmail,login,logout,forgotPassword,verifyResetOtp,resetPassword,resendOtp} from "../controllers/auth.controller.js";



const router=express.Router();

router.post("/register",registerDoctor)

router.post("/verify-email",verifyEmail);

router.post("/forgot-password",forgotPassword)

router.post("/login",login);

router.post("/logout",logout)
router.post("/resend-otp", resendOtp)

router.post("/verify-reset-otp", verifyResetOtp)
router.post("/reset-password", resetPassword)




export default router;