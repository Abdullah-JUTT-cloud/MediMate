import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { connectDB } from "./db/connectDB.js";
import authRoutes from "./routes/auth.route.js";

const app=express();

const PORT=process.env.PORT || 3000;

app.get("/",(req,res)=>{
    res.send("landing page");
})

app.use("/api/auth",authRoutes);

connectDB()
.then(()=>{
    app.listen(PORT,()=>{
        console.log(`Server is running on port ${PORT}`);
    })
})
.catch((error)=>{
    console.log("Error connecting to MongoDB: ",error.message);
    process.exit(1);
})