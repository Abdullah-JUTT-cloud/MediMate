import cron from "node-cron";
import { Doctor } from "../models/doctor.model.js";

export const blockExpiredSubscriptions = async () => {
  const now = new Date();
  const result = await Doctor.updateMany(
    {
      subscriptionStatus: { $in: ["TRIAL", "ACTIVE"] },
      subscriptionExpiresAt: { $lte: now },
    },
    {
      $set: { subscriptionStatus: "BLOCKED" },
    },
  );

};

export const startSubscriptionExpiryJob = () => {
  blockExpiredSubscriptions().catch((error) => {
    console.error("[subscriptionJob] Initial expiry check failed", error);
  });

  cron.schedule("*/15 * * * *", () => {
    blockExpiredSubscriptions().catch((error) => {
      console.error("[subscriptionJob] Scheduled expiry check failed", error);
    });
  });
};
