import Patient from "../models/patient.model.js";
import { getClearCookieOptions } from "../utils/security.js";

const PATIENT_CHAT_DISABLED_MESSAGE =
  "Patient-doctor chat is currently disabled. We are building it and it is coming soon.";

const clearPatientCookie = (res) => {
  res.clearCookie("patientToken", getClearCookieOptions());
};

export const loginPatient = async (req, res) => {
  try {
    clearPatientCookie(res);
    return res.status(503).json({ message: PATIENT_CHAT_DISABLED_MESSAGE });
  } catch (error) {
    console.error("[loginPatient]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logoutPatient = async (req, res) => {
  try {
    clearPatientCookie(res);
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("[logoutPatient]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getPatientSession = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patientId).select("name doctor locations");
    if (!patient) {
      clearPatientCookie(res);
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.status(503).json({ message: PATIENT_CHAT_DISABLED_MESSAGE, patient });
  } catch (error) {
    console.error("[getPatientSession]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
