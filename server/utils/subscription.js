export const TRIAL_DAYS = 15;

export const SUBSCRIPTION_STATUSES = [
  "TRIAL",
  "PENDING_VERIFICATION",
  "ACTIVE",
  "MONTHLY",
  "YEARLY",
  "BLOCKED",
  "INACTIVE",
];

export const getTrialExpiryDate = (fromDate = new Date()) =>
  new Date(new Date(fromDate).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

export const getSubscriptionExpiryDate = (status, fromDate = new Date()) => {
  const value = String(status || "").toUpperCase();
  if (value === "MONTHLY") return new Date(new Date(fromDate).getTime() + 30 * 24 * 60 * 60 * 1000);
  if (value === "YEARLY") return new Date(new Date(fromDate).getTime() + 365 * 24 * 60 * 60 * 1000);
  if (value === "ACTIVE") return new Date(new Date(fromDate).getTime() + 30 * 24 * 60 * 60 * 1000);
  if (value === "TRIAL") return getTrialExpiryDate(fromDate);
  return null;
};

export const isSubscriptionExpired = (doctor, now = new Date()) => {
  if (!doctor?.subscriptionExpiresAt) return false;
  return new Date(doctor.subscriptionExpiresAt).getTime() <= now.getTime();
};

export const refreshDoctorSubscriptionStatus = async (doctor, now = new Date()) => {
  if (!doctor) return doctor;

  const canExpire = ["TRIAL", "ACTIVE", "MONTHLY", "YEARLY"].includes(doctor.subscriptionStatus);
  if (!canExpire || !isSubscriptionExpired(doctor, now)) return doctor;

  doctor.subscriptionStatus = "BLOCKED";
  await doctor.updateOne({ $set: { subscriptionStatus: "BLOCKED" } });
  return doctor;
};

export const hasFullSiteAccess = (doctor) =>
  ["TRIAL", "ACTIVE", "MONTHLY", "YEARLY"].includes(doctor?.subscriptionStatus) &&
  !isSubscriptionExpired(doctor);
