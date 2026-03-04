import { Doctor } from "../models/doctor.model.js";
import bcrypt from "bcryptjs";
import { generateOtp } from "../utils/generateOtp.js";


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
    //TODO: send email to doctor with otp
    res.status(201).json({ message: "Doctor registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
