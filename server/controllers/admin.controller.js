import jwt from "jsonwebtoken";
import { Doctor } from "../models/doctor.model.js";
import Notification from "../models/notification.model.js";

const ADMIN_COOKIE = "admin_token";
const PROFILE_STATUSES = ["Pending", "In Review", "Needs Changes", "Verified", "Approved"];

const normalizeProfileStatus = (status) => {
  if (status === "Approved") return "Verified";
  return status;
};

const buildAdminToken = () => {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
  return jwt.sign(
    {
      role: "admin",
      email: process.env.ADMIN_EMAIL,
      name: process.env.ADMIN_NAME || "Admin",
    },
    secret,
    { expiresIn: "15d" }
  );
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const envEmail = process.env.ADMIN_EMAIL;
    const envPassword = process.env.ADMIN_PASSWORD;

    if (!envEmail || !envPassword) {
      return res.status(500).json({ message: "Admin credentials are not configured" });
    }

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const isValid = email === envEmail && password === envPassword;
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = buildAdminToken();

    res.cookie(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Admin login successful",
      admin: {
        email: envEmail,
        name: process.env.ADMIN_NAME || "Admin",
      },
    });
  } catch (error) {
    console.error("[adminLogin]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const adminLogout = async (_req, res) => {
  try {
    res.clearCookie(ADMIN_COOKIE);
    return res.status(200).json({ message: "Admin logout successful" });
  } catch (error) {
    console.error("[adminLogout]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const adminMe = async (_req, res) => {
  return res.status(200).json({
    admin: {
      email: process.env.ADMIN_EMAIL,
      name: process.env.ADMIN_NAME || "Admin",
    },
  });
};

export const listDoctorsForVerification = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const status = req.query.status;
    const search = (req.query.search || "").trim();

    const query = {};
    const normalizedStatus = normalizeProfileStatus(status);
    if (normalizedStatus && PROFILE_STATUSES.includes(normalizedStatus)) {
      if (normalizedStatus === "Verified") {
        query.profileVerificationStatus = { $in: ["Verified", "Approved"] };
      } else {
        query.profileVerificationStatus = normalizedStatus;
      }
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { pmdcNumber: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }

    const [total, doctors] = await Promise.all([
      Doctor.countDocuments(query),
      Doctor.find(query)
        .select("fullName email specialization pmdcNumber licenseStatus profilePicture profileVerificationStatus profileVerificationReviewedAt profileVerificationReviewedBy")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    return res.status(200).json({
      doctors,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[listDoctorsForVerification]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getDoctorVerificationDetail = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select(
      "-password -otp -otpExpiry -resetToken -resetTokenExpiry"
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    return res.status(200).json({ doctor });
  } catch (error) {
    console.error("[getDoctorVerificationDetail]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateDoctorVerificationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const normalizedStatus = normalizeProfileStatus(status);

    if (!PROFILE_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid verification status" });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.profileVerificationStatus = normalizedStatus;
    doctor.profileVerificationReviewedAt = new Date();
    doctor.profileVerificationReviewedBy = req.admin?.email || process.env.ADMIN_EMAIL || "admin";
    doctor.profileVerificationNotes = (notes || "").trim();

    await doctor.save();

    await Notification.create({
      doctor: doctor._id,
      type: "profile-status",
      title: "Profile verification updated",
      message: `Admin changed your profile status to ${normalizedStatus}.`,
      metadata: {
        status: normalizedStatus,
        notes: doctor.profileVerificationNotes,
      },
    });

    return res.status(200).json({
      message: "Verification status updated successfully",
      doctor: {
        _id: doctor._id,
        fullName: doctor.fullName,
        profileVerificationStatus: doctor.profileVerificationStatus,
        profileVerificationReviewedAt: doctor.profileVerificationReviewedAt,
        profileVerificationReviewedBy: doctor.profileVerificationReviewedBy,
        profileVerificationNotes: doctor.profileVerificationNotes,
      },
    });
  } catch (error) {
    console.error("[updateDoctorVerificationStatus]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};