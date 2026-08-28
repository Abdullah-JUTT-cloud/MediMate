import mongoose from "mongoose";
import { toLocationArray } from "../utils/patientLocation.js";


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

/**
 * `location` — the single facility the Edit Profile dropdown assigns.
 *
 * It is a *virtual* alias over `locations[0]` so there is only ever one source
 * of truth in MongoDB: assignment writes land in `locations` (which slot
 * generation, booking, checkups and prescriptions already read), and every read
 * gets a convenient singular `location` field back from the API.
 *
 * Accepted values mirror the client selector: `null` / "" / "unassigned" to
 * clear the assignment, or a fully described `{ locationType, locationId,
 * locationName }` object. Facility *references* (the "Clinic:<id>" value the
 * dropdown posts, a bare id or a name) need the doctor's facility list to be
 * resolved — the patient controller does that via
 * `resolveLocationSelection(value, doctor)` before writing `locations`.
 */
patientSchema
  .virtual("location")
  .get(function () {
    return Array.isArray(this.locations) && this.locations.length > 0 ? this.locations[0] : null;
  })
  .set(function (value) {
    this.locations = toLocationArray(value, null);
  });

// Expose the `location` virtual in every JSON/API response and in `.toObject()`.
patientSchema.set("toJSON", { virtuals: true });
patientSchema.set("toObject", { virtuals: true });

export default mongoose.model("Patient", patientSchema);
