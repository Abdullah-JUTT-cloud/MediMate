import express from "express";
import { registerDoctor } from "../controllers/auth.controller.js";

const router=express.Router();

router.post("/register",registerDoctor)

router.post("/verify-email",(req,res)=>{
    res.send("verify email");
})

router.post("/forgot-password",(req,res)=>{
    res.send("forgot password");
})

router.post("/login",(req,res)=>{
    res.send("login");
})

router.post("/logout",(req,res)=>{
    res.send("logout");
})



export default router;