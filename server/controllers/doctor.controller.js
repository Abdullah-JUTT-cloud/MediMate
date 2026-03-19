import { Doctor } from "../models/doctor.model.js";
import cloudinary from "../config/cloudinary.js";
import { allowedImageMimeTypes } from "../middlewares/upload.middleware.js";
export const getProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctorId).select(
      "-password -otp -otpExpiry -resetToken -resetTokenExpiry",
    );
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.status(200).json({ doctor });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting profile", error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  const {
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
    if (typeof fullName !== "undefined") doctor.fullName = String(fullName).trim();
    if (typeof phone !== "undefined") doctor.phone = String(phone).trim();
    if (typeof specialization !== "undefined") doctor.specialization = String(specialization).trim();
    if (typeof clinics !== "undefined") doctor.clinics = clinics;
    if (typeof hospitals !== "undefined") doctor.hospitals = hospitals;
    if (typeof slotDuration !== "undefined") doctor.slotDuration = Number(slotDuration);
    if (typeof profilePicture !== "undefined") doctor.profilePicture = profilePicture;
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
    res
      .status(200)
      .json({ message: "Profile updated successfully", doctor: updatedDoc });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
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

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "medimate/profiles", resource_type: "image" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const doctor = await Doctor.findById(req.doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    doctor.profilePicture = uploadResult.secure_url;
    await doctor.save();

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePicture: uploadResult.secure_url,
    });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

export const uploadPmdcCertificate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "medimate/pmdc", resource_type: "raw" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    const doctor = await Doctor.findById(req.doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    doctor.pmdcCertificate = uploadResult.secure_url;
    await doctor.save();
    res.status(200).json({
      message: "PMDC certificate uploaded successfully",
      pmdcCertificate: uploadResult.secure_url,
    });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
}
  