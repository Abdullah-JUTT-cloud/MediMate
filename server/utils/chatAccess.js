import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendTextWhatsApp } from "./whatsapp.js";

const normalizeNameSlug = (name) => {
  const slug = String(name || "patient")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);

  return slug || "patient";
};

export const generatePatientChatUsername = async (Patient, doctorId, patientName) => {
  const base = normalizeNameSlug(patientName);
  const existingUsernames = await Patient.find({
    doctor: doctorId,
    chatUsername: { $ne: "" },
  })
    .select("chatUsername")
    .lean();

  const usedUsernames = new Set(existingUsernames.map((entry) => String(entry.chatUsername || "").toLowerCase()));
  const maxSuffix = existingUsernames.reduce((max, entry) => {
    const suffix = Number(String(entry.chatUsername || "").match(/(\d{4})$/)?.[1] || 0);
    return Number.isFinite(suffix) && suffix > max ? suffix : max;
  }, 0);

  for (let number = maxSuffix + 1; number < 10000; number += 1) {
    const suffix = String(number).padStart(4, "0");
    const candidate = `${base}${suffix}`;
    if (!usedUsernames.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique chat username");
};

export const generatePatientChatPassword = () => String(crypto.randomInt(0, 1000000)).padStart(6, "0");

export const hashPatientChatPassword = async (password) => bcrypt.hash(password, 10);

export const buildPatientChatInviteMessage = ({ patientName, username, password, portalUrl }) => {
  const safePortalUrl = portalUrl || "";
  return [
    `Hello ${patientName},`,
    "",
    "Your doctor has enabled secure chat access.",
    `Username: ${username}`,
    `Temporary password: ${password}`,
    safePortalUrl ? `Login here: ${safePortalUrl}` : "",
    "",
    "Please sign in and change your password after the first login.",
    "",
    "- MedMate",
  ].filter(Boolean).join("\n");
};

export const sendPatientChatInvite = async ({ phone, patientName, username, password, portalUrl }) => {
  const message = buildPatientChatInviteMessage({ patientName, username, password, portalUrl });
  await sendTextWhatsApp(phone, message);
};

export const createPatientChatCredentials = async (Patient, doctorId, patientName) => {
  const username = await generatePatientChatUsername(Patient, doctorId, patientName);
  const password = generatePatientChatPassword();
  const passwordHash = await hashPatientChatPassword(password);

  return { username, password, passwordHash };
};
