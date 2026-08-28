import jwt from "jsonwebtoken";
import PatientAccount from "../models/patientAccount.model.js";

/**
 * Middleware that verifies the `patientAccountToken` cookie set during
 * PatientAccount login/registration.
 *
 * On success, attaches:
 *   req.patientAccountId  — the PatientAccount _id string
 *   req.patientAccount    — the lean PatientAccount document (id, name, email)
 */
export const verifyPatientAccountToken = async (req, res, next) => {
  const token = req.cookies.patientAccountToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized — no patient token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "patientAccount") {
      return res.status(401).json({ message: "Unauthorized — invalid token role" });
    }

    const patient = await PatientAccount.findById(decoded.id).select("_id name email phone");
    if (!patient) {
      return res.status(401).json({ message: "Unauthorized — patient account not found" });
    }

    req.patientAccountId = String(decoded.id);
    req.patientAccount = patient;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized — invalid or expired token" });
  }
};

export const verifyOptionalPatientAccountToken = async (req, res, next) => {
  const token = req.cookies.patientAccountToken;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === "patientAccount") {
      const patient = await PatientAccount.findById(decoded.id).select("_id name email phone");
      if (patient) {
        req.patientAccountId = String(decoded.id);
        req.patientAccount = patient;
      }
    }
  } catch (error) {
    // continue as guest
  }
  next();
};
