import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  dosage: { type: String, required: true, trim: true, maxlength: 80 },
  frequency: { type: String, required: true, trim: true, maxlength: 80 },
  duration: { type: String, required: true, trim: true, maxlength: 80 },
  instructions: { type: String, default: "", trim: true, maxlength: 240 },
});

const visitedFacilitySchema = new mongoose.Schema(
  {
    locationType: { type: String, enum: ["Clinic", "Hospital"], required: true },
    locationName: { type: String, required: true, trim: true, maxlength: 160 },
    locationAddress: { type: String, default: "", trim: true, maxlength: 260 },
  },
  { _id: false },
);

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
    // Links the checkup back to the appointment it closed (set by
    // completeCheckup). Null for standalone history entries created via
    // addCheckup. Lets Payments-page edits upsert the linked Payment record.
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    diseases: {
      type: [{ type: String, trim: true, maxlength: 120 }],
      default: [],
      validate: {
        validator: (items) => Array.isArray(items) && items.length <= 25,
        message: "Diseases list is too long",
      },
    },
    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },
    prescription: {
      diagnosis: { type: String, default: "", trim: true, maxlength: 1000 },
      nextAppointment: { type: Date },
      medicines: {
        type: [medicineSchema],
        default: [],
        validate: {
          validator: (items) => Array.isArray(items) && items.length <= 50,
          message: "Medicines list is too long",
        },
      },
      labTests: {
        type: [{ type: String, trim: true, maxlength: 160 }],
        default: [],
        validate: {
          validator: (items) => Array.isArray(items) && items.length <= 50,
          message: "Lab tests list is too long",
        },
      },
      patientAdvice: { type: String, default: "", trim: true, maxlength: 2000 },
      pdfUrl: { type: String, default: "", trim: true, maxlength: 1000 },
    },
    visitedFacility: {
      type: visitedFacilitySchema,
      default: null,
    },
    payment: {
      amount: { type: Number, required: true, default: 0, min: 0, max: 1000000 },
      originalFee: { type: Number, default: 0, min: 0, max: 1000000 },
      discount: { type: Number, default: 0, min: 0, max: 1000000 },
      discountAmount: { type: Number, default: 0, min: 0, max: 1000000 },
      netAmount: { type: Number, default: 0, min: 0, max: 1000000 },
      ancillaryFee: { type: Number, default: 0, min: 0, max: 1000000 },
      description: { type: String, default: "Consultation", trim: true, maxlength: 200 },
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

// Compound indexes for all hot query paths
checkupSchema.index({ patient: 1, doctor: 1, createdAt: -1 });
checkupSchema.index({ appointmentId: 1 });
checkupSchema.index({ doctor: 1, createdAt: -1 });
checkupSchema.index({ doctor: 1, "prescription.pdfUrl": 1 });

export default mongoose.model("Checkup", checkupSchema);
