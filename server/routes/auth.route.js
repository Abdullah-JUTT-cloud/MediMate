import express from "express";
import { registerDoctor, verifyEmail,login} from "../controllers/auth.controller.js";

const router=express.Router();

router.post("/register",registerDoctor)

router.post("/verify-email",verifyEmail);

router.post("/forgot-password",(req,res)=>{
    res.send("forgot password");
})

router.post("/login",login);

router.post("/logout",(req,res)=>{
    res.send("logout");
})



export default router;