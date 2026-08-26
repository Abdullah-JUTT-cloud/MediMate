import "dotenv/config";
import mongoose from "mongoose";
import { Doctor } from "../models/doctor.model.js";

const splitName = (fullName = "") => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || firstName;
  return { firstName, lastName };
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const doctors = await Doctor.find(
    {
      $or: [
        { firstName: { $exists: false } },
        { lastName: { $exists: false } },
        { firstName: "" },
        { lastName: "" },
      ],
    },
    { _id: 1, fullName: 1, firstName: 1, lastName: 1 }
  ).lean();

  if (!doctors.length) {
    await mongoose.connection.close();
    return;
  }

  const ops = doctors.map((doctor) => {
    const fromFull = splitName(doctor.fullName);
    const firstName = String(doctor.firstName || "").trim() || fromFull.firstName;
    const lastName = String(doctor.lastName || "").trim() || fromFull.lastName;
    const fullName = `${firstName} ${lastName}`.trim() || String(doctor.fullName || "").trim();

    return {
      updateOne: {
        filter: { _id: doctor._id },
        update: {
          $set: {
            firstName,
            lastName,
            fullName,
          },
        },
      },
    };
  });

  await Doctor.bulkWrite(ops);

  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error("Doctor name migration failed:", error);
  await mongoose.connection.close();
  process.exit(1);
});
