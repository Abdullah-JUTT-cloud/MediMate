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
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
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
    profilePicUrl: {
      type: String,
      default: "",
    },
    verificationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    subscriptionStatus: {
      type: String,
      enum: ["TRIAL", "PENDING_VERIFICATION", "ACTIVE", "MONTHLY", "YEARLY", "BLOCKED", "INACTIVE"],
      default: "TRIAL",
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
    profileVerificationStatus: {
      type: String,
      enum: ["Pending", "In Review", "Needs Changes", "Verified", "Approved"],
      default: "Pending",
    },
    profileVerificationReviewedAt: {
      type: Date,
      default: null,
    },
    profileVerificationReviewedBy: {
      type: String,
      default: "",
      trim: true,
    },
    profileVerificationNotes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

doctorSchema.pre("validate", async function() {
  if ((!this.firstName || !this.lastName) && this.fullName) {
    const parts = String(this.fullName).trim().split(/\s+/).filter(Boolean);
    this.firstName = this.firstName || parts[0] || "";
    this.lastName = this.lastName || parts.slice(1).join(" ") || parts[0] || "";
  }

  if ((this.firstName || this.lastName) && !this.fullName) {
    this.fullName = `${this.firstName || ""} ${this.lastName || ""}`.trim();
  }

  if (this.firstName && this.lastName) {
    this.fullName = `${this.firstName} ${this.lastName}`.trim();
  }
});

export const Doctor = mongoose.model("Doctor", doctorSchema);
