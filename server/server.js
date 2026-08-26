import dotenv from "dotenv";
dotenv.config();

// ─── Process-level error handlers (ERR-2) ────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
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
import reportsRoutes from "./routes/reports.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import {startReminderJob} from "./utils/reminderJob.js";
import insightsRoutes from "./routes/insights.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import issueTicketRoutes from "./routes/issueTicket.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import patientAuthRoutes from "./routes/patientAuth.routes.js";
import patientChatRoutes from "./routes/patientChat.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import { startSubscriptionExpiryJob } from "./utils/subscriptionJob.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import http from "http";
import { initSocketServer } from "./realtime/socket.js";
import { createUnsafeRequestOriginGuard } from "./utils/security.js";

const app=express();
const server = http.createServer(app);
app.disable("x-powered-by");

// ─── Public health check (uptime monitoring) ─────────────────────────────────
// Registered BEFORE auth, rate-limiting, and other middleware so it stays
// lightweight and always reachable, with no external dependencies.
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(helmet());

const PORT=process.env.PORT || 3000;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",").map(o => o.trim());

if (process.env.NODE_ENV === 'production' && ALLOWED_ORIGINS.some(o => o.includes('localhost'))) {
  console.warn('WARNING: ALLOWED_ORIGINS contains localhost while running in production. Set ALLOWED_ORIGINS environment variable to your client origin(s) to avoid CORS issues.');
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}))
app.use(createUnsafeRequestOriginGuard(ALLOWED_ORIGINS));
app.use(express.json({ limit: "128kb" }))
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
app.use("/api/patient-auth", authLimiter);
app.use("/api/patient-auth", patientAuthRoutes);

// Apply rate limiting to data mutation routes to prevent abuse
const dataLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: "Too many requests to this endpoint, please try again later" },
  skip: (req) => req.method === "GET",
});
const prescriptionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: "Too many prescription requests, please try again later" },
});

app.use("/api/doctor", dataLimiter, doctorRoutes);
app.use("/api/patients", dataLimiter, patientRoutes);
app.use("/api/checkups", dataLimiter, checkupRoutes);
app.use("/api/appointments", dataLimiter, appointmentRoutes);
app.use("/api/prescriptions", prescriptionLimiter, dataLimiter, prescriptionRoutes);
app.use("/api/reports", dataLimiter, reportsRoutes);
app.use("/api/billing", dataLimiter, billingRoutes);
app.use("/api/admin", dataLimiter, adminRoutes);
app.use("/api/issues", dataLimiter, issueTicketRoutes);
app.use("/api/notifications", dataLimiter, notificationRoutes);
app.use("/api/patient-chats", dataLimiter, patientChatRoutes);
app.use("/api/subscriptions", dataLimiter, subscriptionRoutes);

 app.use("/api/insights", dataLimiter, insightsRoutes)

connectDB()
.then(()=>{
    initSocketServer(server, ALLOWED_ORIGINS);
    server.listen(PORT,async()=>{
        console.log(`Server is running on port ${PORT}`);
    })
    startReminderJob();
    startSubscriptionExpiryJob();
})
.catch((error)=>{
    console.log("Error connecting to MongoDB: ",error.message);
    process.exit(1);
})

// Global error handler for Express (catches async errors from middleware/handlers) - ERR-3
app.use((err, req, res, next) => {
  console.error("[Error]", err.message, err.stack);
  
  // Multer errors
  if (err.message && err.message.includes("file")) {
    return res.status(400).json({ message: err.message });
  }
  
  // CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "CORS policy violation" });
  }
  
  // Default 500 error
  res.status(500).json({ message: "Internal server error" });
});
