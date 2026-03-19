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
      pdfUrl: { type: String, default: "" },
    },
    payment: {
      amount: { type: Number, required: true, default: 0 },
      method: {
        type: String,
        enum: ["Cash", "Card", "Online Transfer"],
        default: "Cash",
      },
      isPaid: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Checkup", checkupSchema);