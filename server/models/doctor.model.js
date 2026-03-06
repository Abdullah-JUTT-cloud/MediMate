import mongoose, { Schema } from "mongoose";

const doctorSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    clinicName: {
      type: String,
      required: true,
      trim: true,
    },
    clinicAddress: {
      type: String,
      required: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      trim: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    slotDuration: {
      type: Number,
      required: true,
      default: 20,
    },
    workingHours: [
      {
        day: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          required: true,
        },
        isWorking: {
          type: Boolean,
          default: false,
        },
        timeRanges: [
          {
            startTime: { type: String },
            endTime: { type: String },
          },
        ],
      },
    ],
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
  },
  { timestamps: true },
);

export const Doctor = mongoose.model("Doctor", doctorSchema);
