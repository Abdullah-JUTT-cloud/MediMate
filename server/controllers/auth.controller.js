import { Doctor } from "../models/doctor.model.js";
import bcrypt from "bcryptjs";
import { generateOtp } from "../utils/generateOtp.js";
import {
  sendEmail,
  verificationEmailTemplate,
  resetPasswordEmailTemplate,
} from "../utils/sendEmail.js";
import { generateToken } from "../utils/generateToken.js";
import crypto from "crypto";

const isStrongPassword = (password) => {
  if (typeof password !== "string") return false;
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
};

export const registerDoctor = async (req, res) => {
  const {
    firstName,
    lastName,
    fullName,
    gender,
    email,
    phone,
    password,
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
  } = req.body;
  try {
    const resolvedFirstName = String(firstName || "").trim();
    const resolvedLastName = String(lastName || "").trim();
    const resolvedFullName = String(fullName || "").trim();

    if (
      !email ||
      !gender ||
      !phone ||
      !title ||
      !password ||
      !specialization ||
      !primaryDegree ||
      !university ||
      !graduationYear ||
      !yearsOfExperience ||
      !pmdcNumber ||
      !licenseStatus ||
      !licenseIssueDate
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const hasNames =
      (resolvedFirstName && resolvedLastName) || resolvedFullName;

    if (!hasNames) {
      return res
        .status(400)
        .json({ message: "First and last name are required" });
    }

    if (!isStrongPassword(password)) {
      return res
        .status(400)
        .json({
          message:
            "Password must be at least 8 characters and include uppercase, number, and special character",
        });
    }

    const normalizedFullName =
      `${resolvedFirstName} ${resolvedLastName}`.trim() || resolvedFullName;
    const [fallbackFirstName = ""] = normalizedFullName.split(/\s+/);
    const fallbackLastName = normalizedFullName
      .split(/\s+/)
      .slice(1)
      .join(" ");

    const normalizedFirstName = resolvedFirstName || fallbackFirstName;
    const normalizedLastName =
      resolvedLastName || fallbackLastName || fallbackFirstName;

    // const doctorExisted=await Doctor.findOne({
    //     $and:[
    //         {email:email},
    //         {licenseNumber:licenseNumber}
    //     ]
    // })

    const emailExists = await Doctor.findOne({ email });
    if (emailExists)
      return res.status(409).json({ message: "Email already registered" });

    const pmdcNumberExists = await Doctor.findOne({ pmdcNumber });
    if (pmdcNumberExists)
      return res
        .status(409)
        .json({ message: "PMDC number already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOtp();
    const otpExpiry = Date.now() + 30 * 60 * 1000;

    const doctor = new Doctor({
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      fullName: normalizedFullName,
      email,
      password: hashedPassword,
      phone,
      specialization,
      title,
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
      otp,
      otpExpiry,
      gender,
    });
    await doctor.save();

    try {
      await sendEmail({
        to: email,
        subject: "Verify your MedAlerto account",
        html: verificationEmailTemplate(normalizedFullName, otp),
      });
    } catch (emailError) {
      console.error("Verification email failed: ", emailError.message);
      return res.status(500).json({ message: "Failed to send verification email. Please try again." });
    }
    res.status(201).json({ message: "Doctor registered successfully" });
  } catch (error) {
    console.error("[registerDoctor]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    if (doctor.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }
    if (
      doctor.otp.length !== otp.length ||
      !crypto.timingSafeEqual(Buffer.from(doctor.otp), Buffer.from(otp))
    ) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (doctor.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    doctor.isVerified = true;
    doctor.otp = null;
    doctor.otpExpiry = null;
    await doctor.save();
    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("[verifyEmail]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const doctor = await Doctor.findOne({ email });
    const isMatch = doctor ? await bcrypt.compare(password, doctor.password) : false;
    if (!doctor || !isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!doctor.isVerified) {
      return res.status(400).json({ message: "Email not verified" });
    }
    const token = generateToken(doctor._id);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // For cross-site deployments (client and API on different origins)
      // browsers require SameSite=None and Secure to send cookies. Use
      // strict locally to retain stronger defaults in development.
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      path: "/",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    };

    // Optional domain override for multi-subdomain setups (set COOKIE_DOMAIN env var)
    if (process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }

    res.cookie("token", token, cookieOptions);
    res.status(200).json({
      message: "Login successful",
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      fullName: doctor.fullName,
      email: doctor.email,
      gender: doctor.gender,
      title: doctor.title,
      specialization: doctor.specialization,
      primaryDegree: doctor.primaryDegree,
      additionalDegrees: doctor.additionalDegrees,
      university: doctor.university,
      yearsOfExperience: doctor.yearsOfExperience,
      pmdcNumber: doctor.pmdcNumber,
      licenseStatus: doctor.licenseStatus,
      clinics: doctor.clinics,
      hospitals: doctor.hospitals,
      slotDuration: doctor.slotDuration,
      profilePicture: doctor.profilePicture,
      profileVerificationStatus: doctor.profileVerificationStatus,
      profileVerificationReviewedAt: doctor.profileVerificationReviewedAt,
      profileVerificationReviewedBy: doctor.profileVerificationReviewedBy,
      profileVerificationNotes: doctor.profileVerificationNotes,
    });
  } catch (error) {
    console.error("[login]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("[logout]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const doctor = await Doctor.findOne({ email });
    // Generic response to prevent email enumeration
    if (!doctor) {
      return res.status(200).json({ message: "If this email is registered, an OTP has been sent" });
    }
    const otp = generateOtp();
    const otpExpiry = Date.now() + 30 * 60 * 1000;
    doctor.otp = otp;
    doctor.otpExpiry = otpExpiry;
    await doctor.save();
    try {
      await sendEmail({
        to: email,
        subject: "Reset your MedAlerto password",
        html: resetPasswordEmailTemplate(doctor.fullName, otp),
      });
    } catch (emailError) {
      console.error("Password reset email failed: ", emailError.message);
      return res.status(500).json({ message: "Failed to send password reset email. Please try again." });
    }
    res.status(200).json({ message: "If this email is registered, an OTP has been sent" });
  } catch (error) {
    console.error("[forgotPassword]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    if (
      !doctor.otp ||
      doctor.otp.length !== otp.length ||
      !crypto.timingSafeEqual(Buffer.from(doctor.otp), Buffer.from(otp))
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    if (doctor.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    const rawToken = crypto.randomBytes(32).toString("hex");
    // Store only the hash — never store the raw token in the DB
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const resetTokenExpiry = Date.now() + 30 * 60 * 1000;
    doctor.resetToken = hashedToken;
    doctor.resetTokenExpiry = resetTokenExpiry;
    doctor.otp = null;
    doctor.otpExpiry = null;
    await doctor.save();
    // Return the raw (unhashed) token to the client
    res.status(200).json({ message: "OTP verified successfully", resetToken: rawToken });
  } catch (error) {
    console.error("[verifyResetOtp]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;
  try {
    if (!resetToken || !newPassword) {
      return res
        .status(400)
        .json({ message: "Reset token and password are required" });
    }
    if (!isStrongPassword(newPassword)) {
      return res
        .status(400)
        .json({
          message:
            "Password must be at least 8 characters and include uppercase, number, and special character",
        });
    }
    // Hash the submitted token to compare against the stored hash
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const doctor = await Doctor.findOne({ resetToken: hashedToken });
    if (!doctor) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    if (doctor.resetTokenExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    doctor.password = hashedPassword;
    doctor.resetToken = null;
    doctor.resetTokenExpiry = null;
    await doctor.save();
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("[resetPassword]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const doctor = await Doctor.findOne({ email });
    // Generic response to prevent email enumeration
    if (!doctor || doctor.isVerified) {
      return res.status(200).json({ message: "If this email is registered and unverified, a new OTP has been sent" });
    }

    const otp = generateOtp();
    doctor.otp = otp;
    doctor.otpExpiry = new Date(Date.now() + 30 * 60 * 1000);
    await doctor.save();

    try {
      await sendEmail({
        to: email,
        subject: "MedAlerto - New Verification OTP",
        html: verificationEmailTemplate(doctor.fullName, otp),
      });
    } catch (emailError) {
      console.error("Resend OTP email failed: ", emailError.message);
      return res.status(500).json({ message: "Failed to send OTP. Please try again." });
    }

    res.status(200).json({ message: "New OTP sent to your email" });
  } catch (error) {
    console.error("[resendOtp]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
