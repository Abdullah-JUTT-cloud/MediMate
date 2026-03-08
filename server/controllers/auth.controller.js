import { Doctor } from "../models/doctor.model.js";
import bcrypt from "bcryptjs";
import { generateOtp } from "../utils/generateOtp.js";
import { sendEmail,verificationEmailTemplate,resetPasswordEmailTemplate } from "../utils/sendEmail.js";
import { generateToken } from "../utils/generateToken.js";
import crypto from "crypto";

export const registerDoctor = async (req, res) => {
  const {
    fullName,
    email,
    password,
    phoneNumber,
    specialization,
    clinicName,
    clinicAddress,
    licenseNumber,
    workingHours,
  } = req.body;
  try {
    if (
      !fullName ||
      !email ||
      !password ||
      !phoneNumber ||
      !specialization ||
      !clinicName ||
      !clinicAddress ||
      !licenseNumber ||
      !workingHours
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // const doctorExisted=await Doctor.findOne({
    //     $and:[
    //         {email:email},
    //         {licenseNumber:licenseNumber}
    //     ]
    // })

    const emailExists = await Doctor.findOne({ email });
    if (emailExists)
      return res.status(409).json({ message: "Email already registered" });

    const licenseExists = await Doctor.findOne({ licenseNumber });
    if (licenseExists)
      return res
        .status(409)
        .json({ message: "License number already registered" });

    // if (doctorExisted) {
    //   return res.status(409).json({ message: "Doctor already exists" });
    // }

    //! IMPORTANT

    for (const day of workingHours) {
      if (day.isWorking === true) {
        if (!day.timeRanges || day.timeRanges.length === 0) {
          return res.status(400).json({
            message: `Please add time ranges for ${day.day}`,
          });
        }
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOtp();

    console.log(otp);

    const otpExpiry = Date.now() + 30 * 60 * 1000;

    const doctor = new Doctor({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      specialization,
      clinicName,
      clinicAddress,
      licenseNumber,
      workingHours,
      otp,
      otpExpiry,
    });
    await doctor.save();

    await sendEmail({
      to: email,
      subject: "Verify your MediMate account",
      html: verificationEmailTemplate(fullName, otp),
    });
    res.status(201).json({ message: "Doctor registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
    if (doctor.otp !== otp) {
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
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    if (!doctor.isVerified) {
      return res.status(400).json({ message: "Email not verified" });
    }
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = generateToken(doctor._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      message: "Login successful",
      fullName: doctor.fullName,
      email: doctor.email,
      specialization: doctor.specialization,
      clinicName: doctor.clinicName,
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error logging out", error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    const otp = generateOtp();
    const otpExpiry = Date.now() + 30 * 60 * 1000;
    doctor.otp = otp;
    doctor.otpExpiry = otpExpiry;
    await doctor.save();
    await sendEmail({
      to: email,
      subject: "Reset your MediMate password",
      html: resetPasswordEmailTemplate(doctor.fullName, otp),
    });
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sending OTP", error: error.message });
  }
};

export const verifyResetOtp = async (req, res) => {
    const {email,otp}=req.body;
    try {
        if(!email || !otp){
            return res.status(400).json({message:"Email and OTP are required"})
        }
        const doctor=await Doctor.findOne({email})
        if(!doctor){
            return res.status(404).json({message:"Doctor not found"})
        }
        if(doctor.otp!==otp){
            return res.status(400).json({message:"Invalid OTP"})
        }
        if(doctor.otpExpiry<Date.now()){
            return res.status(400).json({message:"OTP expired"})
        }
        const resetToken=crypto.randomBytes(32).toString("hex")
        const resetTokenExpiry=Date.now()+30*60*1000
        doctor.resetToken=resetToken
        doctor.resetTokenExpiry=resetTokenExpiry
        doctor.otp=null;
        doctor.otpExpiry=null;
        await doctor.save();
        res.status(200).json({message:"OTP verified successfully",resetToken})
    } catch (error) {
        res.status(500).json({message:"Error verifying OTP",error:error.message})
    }
}

export const resetPassword = async (req, res) => {
    const {resetToken,newPassword}=req.body;
    try {
        if(!resetToken || !newPassword){
            return res.status(400).json({message:"Reset token and password are required"})
        }
        const doctor=await Doctor.findOne({resetToken})
        if(!doctor){
            return res.status(404).json({message:"Doctor not found"})
        }
        
        if(doctor.resetTokenExpiry<Date.now()){
            return res.status(400).json({message:"Reset token expired"})
        }
        const hashedPassword=await bcrypt.hash(newPassword,10)
        doctor.password=hashedPassword
        doctor.resetToken=null
        doctor.resetTokenExpiry=null
        await doctor.save()
        res.status(200).json({message:"Password reset successful"})
    } catch (error) {
        res.status(500).json({message:"Error resetting password",error:error.message})
    }
}

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const doctor = await Doctor.findOne({ email });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    if (doctor.isVerified) return res.status(400).json({ message: "Email is already verified" });

    const otp = generateOtp();
    doctor.otp = otp;
    doctor.otpExpiry = new Date(Date.now() + 30 * 60 * 1000);
    await doctor.save();

    await sendEmail({
      to: email,
      subject: "MediMate - New Verification OTP",
      html: verificationEmailTemplate(doctor.fullName, otp),
    });

    res.status(200).json({ message: "New OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
