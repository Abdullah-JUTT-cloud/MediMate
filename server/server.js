import dotenv from "dotenv";
dotenv.config();
// import "./utils/whatsapp.js";
import express from "express";
import { connectDB } from "./db/connectDB.js";
import authRoutes from "./routes/auth.routes.js";
import cors from "cors";    
import cookieParser from "cookie-parser";
import doctorRoutes from "./routes/doctor.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import checkupRoutes from "./routes/checkup.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import prescriptionRoutes from "./routes/prescription.routes.js";
import {startReminderJob} from "./utils/reminderJob.js";

const app=express();

const PORT=process.env.PORT || 3000;

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))
app.use(express.json())
app.use(cookieParser())

app.get("/",(req,res)=>{
    res.send("landing page");
})

app.use("/api/auth",authRoutes);

app.use("/api/doctor",doctorRoutes)

app.use("/api/patients",patientRoutes)

app.use("/api/checkups", checkupRoutes);

app.use("/api/appointments", appointmentRoutes);

app.use("/api/prescriptions", prescriptionRoutes);

connectDB()
.then(()=>{
    app.listen(PORT,async()=>{
        console.log(`Server is running on port ${PORT}`);
        const { default: _ } = await import("./utils/whatsapp.js");
    })
    startReminderJob();
})
.catch((error)=>{
    console.log("Error connecting to MongoDB: ",error.message);
    process.exit(1);
})
