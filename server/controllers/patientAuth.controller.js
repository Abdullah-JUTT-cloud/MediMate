import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Patient from "../models/patient.model.js";
import { getClearCookieOptions, getCookieOptions } from "../utils/security.js";

const buildPatientToken = (patient) =>
  jwt.sign({ id: patient._id, role: "patient" }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });

const clearPatientCookie = (res) => {
  res.clearCookie("patientToken", getClearCookieOptions());
};

export const loginPatient = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    const patient = await Patient.findOne({ chatUsername: normalizedUsername });
    if (!patient || !patient.chatAccessEnabled || !patient.chatPasswordHash) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(String(password), patient.chatPasswordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    patient.chatLastLoginAt = new Date();
    await patient.save();

    const token = buildPatientToken(patient);
    res.cookie("patientToken", token, getCookieOptions());

    return res.status(200).json({
      message: "Login successful",
      patient: {
        _id: patient._id,
        name: patient.name,
        doctor: patient.doctor,
        chatUsername: patient.chatUsername,
      },
    });
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
    const patient = await Patient.findById(req.patientId).select("name doctor chatUsername chatAccessEnabled chatLastLoginAt locations");
    if (!patient) {
      clearPatientCookie(res);
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.status(200).json({ patient });
  } catch (error) {
    console.error("[getPatientSession]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
