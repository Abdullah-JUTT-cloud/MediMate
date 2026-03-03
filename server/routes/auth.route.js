import express from "express";

const router=express.Router();

router.post("/register",(req,res)=>{
    res.send("register");
})

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