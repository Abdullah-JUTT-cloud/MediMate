import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  dosage: { type: String, required: true, trim: true },
  frequency: { type: String, required: true, trim: true },
  duration: { type: String, required: true, trim: true },
  instructions: { type: String, default: "", trim: true },
});

const checkupSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    diseases: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: "",
    },
    prescription: {
      diagnosis: { type: String, default: "" },
      nextAppointment: { type: Date },
      medicines: { type: [medicineSchema], default: [] },
      labTests: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Checkup", checkupSchema);