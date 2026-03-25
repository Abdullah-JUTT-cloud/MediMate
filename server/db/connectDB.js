import mongoose from "mongoose";
import Appointment from "../models/appointment.model.js";

const removeObsoleteUniqueSlotIndex = async () => {
    try {
        const collection = Appointment.collection;
        const indexes = await collection.indexes();

        for (const index of indexes) {
            const isExactLegacyIndex =
                index.unique === true &&
                JSON.stringify(index.key) === JSON.stringify({
                    doctor: 1,
                    date: 1,
                    slot: 1,
                });

            const isLegacyName = index.name === "doctor_1_date_1_slot_1";

            if ((isExactLegacyIndex || isLegacyName) && index.name) {
                await collection.dropIndex(index.name);
                console.log(`Dropped obsolete index: ${index.name}`);
            }
        }
    } catch (error) {
        console.error("Index migration failed:", error);
    }
};

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        // Run only in controlled environments
        if (process.env.RUN_INDEX_MIGRATION === "true") {
            await removeObsoleteUniqueSlotIndex();
        }

        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
        process.exit(1);
    }
};