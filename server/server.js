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
import insightsRoutes from "./routes/insights.routes.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

const app=express();
app.use(helmet());

const PORT=process.env.PORT || 3000;

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))
app.use(express.json())
app.use((req, res, next) => {
    // Express 5 has a read-only req.query, so sanitize mutable objects only.
    if (req.body) req.body = mongoSanitize.sanitize(req.body);
    if (req.params) req.params = mongoSanitize.sanitize(req.params);
    next();
});
app.use(cookieParser())

app.get("/",(req,res)=>{
    res.send("landing page");
})
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests, please try again later" },
});
app.use("/api/auth", authLimiter);
app.use("/api/auth",authRoutes);

app.use("/api/doctor",doctorRoutes)

app.use("/api/patients",patientRoutes)

app.use("/api/checkups", checkupRoutes);

app.use("/api/appointments", appointmentRoutes);

app.use("/api/prescriptions", prescriptionRoutes);

 app.use("/api/insights", insightsRoutes)

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
