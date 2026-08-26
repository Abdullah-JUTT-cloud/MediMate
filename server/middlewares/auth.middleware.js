import jwt from "jsonwebtoken";
import { Doctor } from "../models/doctor.model.js";
import { hasFullSiteAccess, refreshDoctorSubscriptionStatus } from "../utils/subscription.js";

const SUPPORT_ONLY_PATHS = [
  { baseUrl: "/api/issues" },
  { baseUrl: "/api/doctor", path: "/verification-status" },
];

const isSupportOnlyAllowedPath = (req) =>
  SUPPORT_ONLY_PATHS.some((item) => {
    if (req.baseUrl !== item.baseUrl) return false;
    return !item.path || req.path === item.path;
  });

export const verifyToken = async (req, res, next) => {
  const token = req.cookies.token
  
  if(!token) {
    return res.status(401).json({ message: "Unauthorized - no token provided" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const doctor = await Doctor.findById(decoded.id).select(
      "_id subscriptionStatus subscriptionExpiresAt",
    );

    if (!doctor) {
      return res.status(401).json({ message: "Unauthorized - doctor not found" });
    }

    await refreshDoctorSubscriptionStatus(doctor);

    req.doctorId = decoded.id;
    req.doctor = doctor;

    if (!hasFullSiteAccess(doctor) && !isSupportOnlyAllowedPath(req)) {
      return res.status(402).json({
        message: "Your free trial has ended. Please contact support or submit payment for admin approval.",
        subscriptionStatus: doctor.subscriptionStatus,
        subscriptionExpiresAt: doctor.subscriptionExpiresAt,
      });
    }

    next()
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized - invalid token" })
  }
}
