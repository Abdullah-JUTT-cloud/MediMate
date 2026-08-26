import { Doctor } from "../models/doctor.model.js";
import { uploadToR2, deleteFromR2, getFileUrl } from "../services/storage.service.js";
import { allowedImageMimeTypes } from "../middlewares/upload.middleware.js";
import Patient from "../models/patient.model.js";
import Appointment from "../models/appointment.model.js";
import Checkup from "../models/checkup.model.js";
export const getProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctorId).select(
      "-password -otp -otpExpiry -resetToken -resetTokenExpiry",
    );
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    const docObj = doctor.toObject();
    if (docObj.profilePicture) docObj.profilePicture = getFileUrl(docObj.profilePicture);
    if (docObj.pmdcCertificate) docObj.pmdcCertificate = getFileUrl(docObj.pmdcCertificate);
    res.status(200).json({ doctor: docObj });
  } catch (error) {
    console.error("[getProfile]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getVerificationStatus = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctorId).select(
      "profileVerificationStatus profileVerificationReviewedAt profileVerificationReviewedBy profileVerificationNotes subscriptionStatus subscriptionExpiresAt"
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    return res.status(200).json({
      profileVerificationStatus: doctor.profileVerificationStatus,
      profileVerificationReviewedAt: doctor.profileVerificationReviewedAt,
      profileVerificationReviewedBy: doctor.profileVerificationReviewedBy,
      profileVerificationNotes: doctor.profileVerificationNotes,
      subscriptionStatus: doctor.subscriptionStatus,
      subscriptionExpiresAt: doctor.subscriptionExpiresAt,
    });
  } catch (error) {
    console.error("[getVerificationStatus]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  const {
    firstName,
    lastName,
    fullName,
    gender,
    phone,
    title,
    specialization,
    primaryDegree,
    additionalDegrees,
    university,
    graduationYear,
    postgraduateTraining,
    yearsOfExperience,
    pmdcNumber,
    licenseStatus,
    licenseIssueDate,
    licenseExpiryDate,
    clinics,
    hospitals,
    slotDuration,
    profilePicture,
  } = req.body;
  try {
    // Validate and parse numeric / range-constrained fields
    const currentYear = new Date().getFullYear();
    if (typeof yearsOfExperience !== "undefined") {
      const parsed = Number(yearsOfExperience);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return res.status(400).json({ message: "yearsOfExperience must be a non-negative number" });
      }
    }
    if (typeof slotDuration !== "undefined") {
      const parsed = Number(slotDuration);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return res.status(400).json({ message: "slotDuration must be a positive number" });
      }
    }
    if (typeof graduationYear !== "undefined") {
      const parsed = Number(graduationYear);
      if (!Number.isFinite(parsed) || parsed > currentYear) {
        return res.status(400).json({ message: "graduationYear must be a valid year not in the future" });
      }
    }
    if (typeof clinics !== "undefined" && (!Array.isArray(clinics) || clinics.length > 20)) {
      return res.status(400).json({ message: "clinics must be an array with at most 20 entries" });
    }
    if (typeof hospitals !== "undefined" && (!Array.isArray(hospitals) || hospitals.length > 20)) {
      return res.status(400).json({ message: "hospitals must be an array with at most 20 entries" });
    }
    const doctor = await Doctor.findById(req.doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    if (typeof firstName !== "undefined") doctor.firstName = String(firstName).trim();
    if (typeof lastName !== "undefined") doctor.lastName = String(lastName).trim();
    if (typeof fullName !== "undefined") {
      const normalized = String(fullName).trim();
      doctor.fullName = normalized;
      if (typeof firstName === "undefined" || typeof lastName === "undefined") {
        const parts = normalized.split(/\s+/).filter(Boolean);
        doctor.firstName = typeof firstName === "undefined" ? (parts[0] || doctor.firstName || "") : doctor.firstName;
        doctor.lastName = typeof lastName === "undefined" ? (parts.slice(1).join(" ") || parts[0] || doctor.lastName || "") : doctor.lastName;
      }
    }
    if (typeof phone !== "undefined") doctor.phone = String(phone).trim();
    if (typeof specialization !== "undefined") doctor.specialization = String(specialization).trim();
    if (typeof clinics !== "undefined") doctor.clinics = clinics;
    if (typeof hospitals !== "undefined") doctor.hospitals = hospitals;
    if (typeof slotDuration !== "undefined") doctor.slotDuration = Number(slotDuration);
    if (typeof profilePicture !== "undefined") {
      doctor.profilePicture = profilePicture;
      doctor.profilePicUrl = profilePicture;
    }
    if (typeof primaryDegree !== "undefined") doctor.primaryDegree = String(primaryDegree).trim();
    if (typeof gender !== "undefined") doctor.gender = gender;
    if (typeof title !== "undefined") doctor.title = title;
    if (typeof additionalDegrees !== "undefined") doctor.additionalDegrees = additionalDegrees;
    if (typeof university !== "undefined") doctor.university = String(university).trim();
    if (typeof graduationYear !== "undefined") doctor.graduationYear = Number(graduationYear);
    if (typeof postgraduateTraining !== "undefined") doctor.postgraduateTraining = postgraduateTraining;
    if (typeof yearsOfExperience !== "undefined") doctor.yearsOfExperience = Number(yearsOfExperience);
    if (typeof pmdcNumber !== "undefined") doctor.pmdcNumber = String(pmdcNumber).trim();
    if (typeof licenseStatus !== "undefined") doctor.licenseStatus = licenseStatus;
    if (typeof licenseIssueDate !== "undefined") doctor.licenseIssueDate = licenseIssueDate;
    if (typeof licenseExpiryDate !== "undefined") doctor.licenseExpiryDate = licenseExpiryDate;
    await doctor.save();
    const updatedDoc = await Doctor.findById(req.doctorId).select(
      "-password -otp -otpExpiry -resetToken -resetTokenExpiry",
    );
    const docObj = updatedDoc?.toObject ? updatedDoc.toObject() : updatedDoc;
    if (docObj?.profilePicture) docObj.profilePicture = getFileUrl(docObj.profilePicture);
    if (docObj?.profilePicUrl) docObj.profilePicUrl = getFileUrl(docObj.profilePicUrl);
    if (docObj?.pmdcCertificate) docObj.pmdcCertificate = getFileUrl(docObj.pmdcCertificate);
    res
      .status(200)
      .json({ message: "Profile updated successfully", doctor: docObj });
  } catch (error) {
    console.error("[updateProfile]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileMimeType = req.file.detectedMimeType || req.file.mimetype;
    if (!fileMimeType || !allowedImageMimeTypes.has(fileMimeType)) {
      return res.status(400).json({
        message: "Invalid file type; only image files are allowed",
      });
    }

    const doctor = await Doctor.findById(req.doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    if (doctor.profilePicture) {
      await deleteFromR2(doctor.profilePicture);
    }

    const { key, url } = await uploadToR2(req.file, "profiles");

    doctor.profilePicture = key;
    doctor.profilePicUrl = key;
    await doctor.save();

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePicture: url,
      profilePicUrl: url,
      key,
    });
  } catch (error) {
    console.error("[uploadProfilePicture]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const uploadPmdcCertificate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const doctor = await Doctor.findById(req.doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    if (doctor.pmdcCertificate) {
      await deleteFromR2(doctor.pmdcCertificate);
    }

    const { key, url } = await uploadToR2(req.file, "pmdc");

    doctor.pmdcCertificate = key;
    await doctor.save();

    res.status(200).json({
      message: "PMDC certificate uploaded successfully",
      pmdcCertificate: url,
      key,
    });
  } catch (error) {
    console.error("[uploadPmdcCertificate]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const [appointmentsResult, checkupsResult, patientsResult] = await Promise.all([
      Appointment.deleteMany({ doctor: req.doctorId }),
      Checkup.deleteMany({ doctor: req.doctorId }),
      Patient.deleteMany({ doctor: req.doctorId }),
    ]);

    await doctor.deleteOne();
    res.clearCookie("token");

    return res.status(200).json({
      message: "Doctor account and all related data deleted successfully",
      deleted: {
        doctor: 1,
        patients: patientsResult.deletedCount || 0,
        appointments: appointmentsResult.deletedCount || 0,
        checkups: checkupsResult.deletedCount || 0,
      },
    });
  } catch (error) {
    console.error("[deleteAccount]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
  
