import mongoose from "mongoose";


const locationSchema = new mongoose.Schema({
  locationType:{
    enum:["Clinic", "Hospital"],
    type: String,
    required: true,
  },
  locationId:{
    type: String,
    required: true,
  },
  locationName:{
    type: String,
    required: true,
  }
})

const patientSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    phone: { type: String, required: true, trim: true },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"],
      default: "Unknown",
    },
    medicalHistory: {
      type: [String],
      default: [],
    },
    locations:{
      type:[locationSchema],
      default: []
    }
  },
  { timestamps: true }
);

// Indexes for doctor-scoped queries and search
patientSchema.index({ doctor: 1, createdAt: -1 });
patientSchema.index({ doctor: 1, name: 1 });
patientSchema.index({ doctor: 1, phone: 1 });

export default mongoose.model("Patient", patientSchema);
