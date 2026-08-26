import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../db/connectDB.js";
import { Doctor } from "../models/doctor.model.js";

dotenv.config();

async function run() {
  await connectDB();

  const result = await Doctor.updateMany(
    { profileVerificationStatus: { $exists: false } },
    {
      $set: {
        profileVerificationStatus: "Pending",
        profileVerificationReviewedAt: null,
        profileVerificationReviewedBy: "",
        profileVerificationNotes: "",
      },
    }
  );

  const normalized = await Doctor.updateMany(
    { profileVerificationStatus: "Approved" },
    { $set: { profileVerificationStatus: "Verified" } }
  );

  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error("Migration failed", error);
  await mongoose.connection.close();
  process.exit(1);
});
