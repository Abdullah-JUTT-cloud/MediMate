import mongoose, { Schema } from "mongoose";

const sessionSchema = new Schema({
  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
});

const locationSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  sessions: {
    type: [sessionSchema],
    default: [],
  },
});

const doctorSchema = new Schema(
  {
    // Step 1 - Personal Info
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },

    // Step 2 - Professional Info
    title: {
      type: String,
      enum: ["Dr.", "Prof.", "Consultant"],
      required: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    primaryDegree: {
      type: String,
      required: true,
      trim: true,
    },
    additionalDegrees: {
      type: [String],
      default: [],
    },
    university: {
      type: String,
      required: true,
      trim: true,
    },
    graduationYear: {
      type: Number,
      required: true,
    },
    postgraduateTraining: {
      type: [String],
      default: [],
    },
    yearsOfExperience: {
      type: Number,
      required: true,
    },

    // Step 3 - Licensing fields
    pmdcNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    licenseStatus: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },
    licenseIssueDate: {
      type: Date,
      required: true,
    },
    licenseExpiryDate: {
      type: Date,
    },
    pmdcCertificate: {
      type: String,
      default: "",
    },

    // Step 4 - Clinics & Hospitals
    clinics: {
      type: [locationSchema],
      default: [],
    },
    hospitals: {
      type: [locationSchema],
      default: [],
    },

    // Step 5 - Other fields
    slotDuration: {
      type: Number,
      default: 20,
    },
    profilePicture: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const Doctor = mongoose.model("Doctor", doctorSchema);
