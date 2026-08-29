import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import PatientAccount from "../models/patientAccount.model.js";
import Appointment from "../models/appointment.model.js";
import BookingPaymentProof from "../models/bookingPaymentProof.model.js";
import { Doctor } from "../models/doctor.model.js";
import { generateOtp } from "../utils/generateOtp.js";
import { sendEmail } from "../utils/sendEmail.js";
import { getCookieOptions, getClearCookieOptions } from "../utils/security.js";
import { uploadToR2, getFileUrl } from "../services/storage.service.js";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

const PATIENT_ACCOUNT_COOKIE = "patientAccountToken";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const generatePatientToken = (id) => {
  return jwt.sign({ id, role: "patientAccount" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const getPatientCookieOptions = () => getCookieOptions(COOKIE_MAX_AGE);

const normalizeEmail = (email) =>
  typeof email === "string" ? email.toLowerCase().trim() : "";

const isStrongPassword = (pw) =>
  typeof pw === "string" &&
  pw.length >= 8 &&
  /[A-Z]/.test(pw) &&
  /[0-9]/.test(pw) &&
  /[^A-Za-z0-9]/.test(pw);

const buildPatientSessionPayload = (patient) => ({
  _id: patient._id,
  name: patient.name,
  email: patient.email,
  phone: patient.phone,
  gender: patient.gender,
  isVerified: patient.isVerified,
});

const registrationEmailTemplate = (name, otp) => `
<div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
  <h2 style="color:#4F46E5;">Verify your MedAlerto account</h2>
  <p>Hello <strong>${name}</strong>,</p>
  <p>Use the OTP below to verify your account. It expires in <strong>30 minutes</strong>.</p>
  <div style="background:#F5F3FF;border-radius:8px;padding:20px 32px;text-align:center;font-size:2rem;letter-spacing:0.3em;font-weight:bold;color:#4F46E5;">${otp}</div>
  <p style="margin-top:24px;font-size:0.85rem;color:#6B7280;">If you didn't create a MedAlerto account, you can safely ignore this email.</p>
</div>
`;

// ─────────────────────────────────────────────────────────
// Registration
// ─────────────────────────────────────────────────────────

export const registerPatientAccount = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include an uppercase letter, a number, and a special character",
      });
    }

    const emailExists = await PatientAccount.exists({ email: normalizedEmail });
    if (emailExists) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const phoneExists = await PatientAccount.exists({ phone: phone.trim() });
    if (phoneExists) {
      return res.status(409).json({ message: "Phone number is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 30 * 60 * 1000);

    const patient = new PatientAccount({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      otp,
      otpExpiry,
    });

    await patient.save();

    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Verify your MedAlerto patient account",
        html: registrationEmailTemplate(patient.name, otp),
      });
    } catch (emailErr) {
      console.error("[registerPatientAccount] email failed:", emailErr.message);
      return res.status(500).json({ message: "Account created but verification email failed. Please try again." });
    }

    res.status(201).json({ message: "Account created — check your email for the OTP" });
  } catch (error) {
    console.error("[registerPatientAccount]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────
// Email Verification (OTP)
// ─────────────────────────────────────────────────────────

export const verifyPatientEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const patient = await PatientAccount.findOne({ email: normalizedEmail }).select("+otp +otpExpiry");
    if (!patient) {
      return res.status(404).json({ message: "Account not found" });
    }
    if (patient.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }
    if (patient.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (new Date(patient.otpExpiry) < new Date()) {
      return res.status(400).json({ message: "OTP has expired — please request a new one" });
    }

    patient.isVerified = true;
    patient.otp = null;
    patient.otpExpiry = null;
    await patient.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("[verifyPatientEmail]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────
// Resend OTP
// ─────────────────────────────────────────────────────────

export const resendPatientOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalizedEmail = normalizeEmail(email);
    const patient = await PatientAccount.findOne({ email: normalizedEmail }).select("+otp +otpExpiry");

    // Generic response to prevent enumeration
    if (!patient || patient.isVerified) {
      return res.status(200).json({ message: "If that email is registered and unverified, a new OTP has been sent" });
    }

    const otp = generateOtp();
    patient.otp = otp;
    patient.otpExpiry = new Date(Date.now() + 30 * 60 * 1000);
    await patient.save();

    await sendEmail({
      to: normalizedEmail,
      subject: "MedAlerto — New Verification OTP",
      html: registrationEmailTemplate(patient.name, otp),
    }).catch((e) => console.error("[resendPatientOtp] email error:", e.message));

    res.status(200).json({ message: "If that email is registered and unverified, a new OTP has been sent" });
  } catch (error) {
    console.error("[resendPatientOtp]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────

export const loginPatientAccount = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const patient = await PatientAccount.findOne({ email: normalizedEmail }).select("+password");

    const isMatch = patient ? await bcrypt.compare(password, patient.password) : false;
    if (!patient || !isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!patient.isVerified) {
      return res.status(400).json({ message: "Please verify your email before logging in" });
    }

    const token = generatePatientToken(patient._id);
    res.cookie(PATIENT_ACCOUNT_COOKIE, token, getPatientCookieOptions());

    res.status(200).json({
      message: "Login successful",
      patient: buildPatientSessionPayload(patient),
    });
  } catch (error) {
    console.error("[loginPatientAccount]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────
// Session Check
// ─────────────────────────────────────────────────────────

export const checkPatientSession = async (req, res) => {
  try {
    // req.patientAccount is populated by the auth middleware
    res.status(200).json({ patient: buildPatientSessionPayload(req.patientAccount) });
  } catch (error) {
    console.error("[checkPatientSession]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────────────────

export const logoutPatientAccount = async (req, res) => {
  try {
    res.clearCookie(PATIENT_ACCOUNT_COOKIE, getClearCookieOptions());
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("[logoutPatientAccount]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────
// Book Appointment (Online Request)
// ─────────────────────────────────────────────────────────

/**
 * POST /api/patient-account/book
 *
 * Creates an Appointment with awaitingOnlineApproval: true.
 * The capacity check is intentionally skipped — online pending bookings
 * are excluded from slot counts (see slotService.js) and will be
 * re-validated at approval time.
 *
 * Body (multipart/form-data):
 *   doctorId, date, slot, type, notes?
 *   screenshot (file) — uploaded to R2
 *
 * The doctor's advanceBookingFee is used to record the expected amount.
 */
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, slot, type, notes } = req.body;

    if (!doctorId || !date || !slot || !type) {
      return res.status(400).json({ message: "doctorId, date, slot, and type are required" });
    }
    if (!mongoose.isValidObjectId(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    const doctor = await Doctor.findOne({
      _id: doctorId,
      verificationStatus: "APPROVED",
    }).select("_id fullName advanceBookingFee");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found or not verified" });
    }

    const VALID_TYPES = ["Consultation", "Follow-up", "Check-up"];
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: `type must be one of: ${VALID_TYPES.join(", ")}` });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (parsedDate < todayStart) {
      return res.status(400).json({ message: "Cannot book an appointment in the past" });
    }

    const patientAccountId = req.patientAccountId;
    if (!patientAccountId) {
      return res.status(401).json({ message: "Authentication required. Please sign in to book an appointment." });
    }

    // Check for an existing pending booking by this patient for the same doctor+slot+date
    const duplicate = await Appointment.exists({
      patientAccount: patientAccountId,
      doctor: doctorId,
      date: parsedDate,
      slot,
      awaitingOnlineApproval: true,
    });
    if (duplicate) {
      return res.status(409).json({ message: "You already have a pending request for this slot" });
    }

    // Validate screenshot upload if advanceBookingFee > 0
    const feeAmount = doctor.onlineBookingFee || doctor.advanceBookingFee || 0;
    const requiresProof = feeAmount > 0;
    if (requiresProof && !req.file) {
      return res.status(400).json({
        message: `This doctor requires an online booking fee of Rs ${feeAmount}. Please upload a payment screenshot.`,
      });
    }

    // Create the appointment in "pending approval" state
    const appointment = new Appointment({
      doctor: doctorId,
      patientAccount: patientAccountId,
      date: parsedDate,
      slot,
      type,
      notes: notes || "",
      status: "Pending",
      queueStatus: "WAITING",
      awaitingOnlineApproval: true,
      advancePaid: false,
      isWalkIn: false,
      // The seeded fee is the online booking advance the patient paid (not the
      // doctor's final price) — the approval step overwrites these fields.
      consultationFee: feeAmount,
      standardFee: feeAmount,
      originalFee: feeAmount,
      netAmount: feeAmount,
      // Recorded up front so the approvals page can show "Rs X already paid,
      // collect Rs Y more" before the booking is even approved.
      advanceAmountPaid: feeAmount,
    });

    await appointment.save();

    // Upload proof screenshot to R2 if provided
    if (req.file) {
      let screenshotUrl = "";
      let screenshotKey = "";
      try {
        const { key } = await uploadToR2(req.file, "booking-proofs");
        screenshotKey = key;
        screenshotUrl = getFileUrl(key);
      } catch (uploadErr) {
        console.error("[bookAppointment] R2 upload failed:", uploadErr.message);
        // Delete the appointment so state is not left inconsistent
        await Appointment.findByIdAndDelete(appointment._id);
        return res.status(500).json({ message: "Failed to upload payment proof. Please try again." });
      }

      await BookingPaymentProof.create({
        appointmentId: appointment._id,
        patientAccountId: patientAccountId,
        doctorId,
        screenshotUrl,
        screenshotKey,
        amount: feeAmount,
        status: "PENDING",
      });

      appointment.advancePaid = false; // still pending verification
      await appointment.save();
    }

    res.status(201).json({
      message: "Booking request submitted — the clinic will confirm shortly",
      appointmentId: appointment._id,
    });
  } catch (error) {
    console.error("[bookAppointment]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────
// My Appointments (patient-facing list)
// ─────────────────────────────────────────────────────────

export const getMyAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = { patientAccount: req.patientAccountId };

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate("doctor", "fullName specialization title profilePicUrl clinics hospitals")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Appointment.countDocuments(query),
    ]);

    const enrichedAppointments = appointments.map((a) => {
      if (a.doctor?.profilePicUrl) {
        a.doctor.profilePicUrl = getFileUrl(a.doctor.profilePicUrl);
      }
      return a;
    });

    res.status(200).json({
      appointments: enrichedAppointments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("[getMyAppointments]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────
// Cancel My Appointment
// ─────────────────────────────────────────────────────────

export const cancelMyAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      patientAccount: req.patientAccountId,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const NON_CANCELLABLE = ["Cancelled", "Completed", "No-show"];
    if (NON_CANCELLABLE.includes(appointment.status)) {
      return res.status(400).json({ message: `Cannot cancel an appointment with status "${appointment.status}"` });
    }

    appointment.status = "Cancelled";
    appointment.cancellationReason = "Patient";
    appointment.cancelledAt = new Date();
    await appointment.save();

    res.status(200).json({ message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error("[cancelMyAppointment]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
