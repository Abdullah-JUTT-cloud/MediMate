import mongoose from "mongoose";
import Appointment from "../models/appointment.model.js";
import Patient from "../models/patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import { sendWhatsAppTextMessage } from "../services/whatsapp.service.js";
import Payment from "../models/payment.model.js";
import Checkup from "../models/checkup.model.js";
import {
  getSlotAvailability,
  MAX_STANDARD_APPOINTMENTS_PER_SLOT,
} from "../services/slotService.js";

const MAX_APPOINTMENTS_PER_SLOT = MAX_STANDARD_APPOINTMENTS_PER_SLOT;
const INACTIVE_STATUSES = ["Cancelled", "No-show", "Completed"];

// The clinic operates in Pakistan Standard Time (Asia/Karachi, UTC+5, no DST).
// Mongoose stores date-only strings like "2026-08-27" as UTC midnight, so
// filtering with server-local (usually UTC) day bounds lets PKT appointments
// leak into the previous calendar day. These helpers convert a "YYYY-MM-DD"
// calendar date into the clinic-local [startOfDay, endOfDay] instant range and
// format instants back into clinic-local date strings — never the server's tz.
const CLINIC_TIMEZONE = "Asia/Karachi";
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Formats an instant as "YYYY-MM-DD" in the clinic's timezone. */
const toClinicDateString = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: CLINIC_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toLocaleDateString("en-CA");
  }
};

/** UTC offset of the clinic timezone (in minutes) for the given instant. */
const getClinicOffsetMinutes = (date) => {
  try {
    const values = {};
    for (const part of new Intl.DateTimeFormat("en-US", {
      timeZone: CLINIC_TIMEZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(date)) {
      if (part.type !== "literal") values[part.type] = part.value;
    }
    const asUTC = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );
    return Math.round((asUTC - date.getTime()) / 60000);
  } catch {
    return 5 * 60; // PKT fallback: UTC+5
  }
};

/**
 * Converts "YYYY-MM-DD" into clinic-local day boundaries as UTC instants.
 * Returns { startOfDay, endOfDay } or null when the input is not a valid date.
 */
const getClinicDayRange = (dateStr) => {
  const value = String(dateStr || "").trim();
  if (!DATE_ONLY_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const utcMidnight = Date.UTC(year, month - 1, day);
  const startOfDay = new Date(utcMidnight - getClinicOffsetMinutes(new Date(utcMidnight)) * 60000);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { startOfDay, endOfDay };
};

const sendAppointmentWhatsApp = async (patient, appointment, message) => {
  try {
    await sendWhatsAppTextMessage(patient.phone, message);
  } catch (err) {
    console.error(
      `Appointment WhatsApp error for appointment ${appointment?._id || "N/A"}:`,
      err.message,
    );
  }
};

const formatAppointmentMessage = (
  patientName,
  date,
  slot,
  type,
  doctorName,
  facilityName,
  facilityType,
) => {
  const formattedDate = new Date(date).toLocaleDateString("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const facility = facilityName
    ? `${facilityType === "Clinic" || facilityType === "Hospital" ? facilityType : "Location"}: ${facilityName}`
    : "";
  return `Dear ${patientName},\n\nYour appointment is confirmed with Dr. ${doctorName}\nDate: ${formattedDate}\nTime: ${slot}\nType: ${type}\n${facility}\n\nSee you soon! - MedAlerto`;
};

const resolveFacilityForPatient = (patient, doctor) => {
  const locations = Array.isArray(patient?.locations) ? patient.locations : [];
  if (locations.length === 0) {
    return { facilityName: "", facilityType: "" };
  }

  // Keep fallback deterministic when patient has multiple saved locations.
  const location = locations[0];
  if (location.locationType === "Clinic") {
    return {
      facilityName: location.locationName || doctor?.clinics?.[0]?.name || "",
      facilityType: "Clinic",
    };
  }
  if (location.locationType === "Hospital") {
    return {
      facilityName: location.locationName || doctor?.hospitals?.[0]?.name || "",
      facilityType: "Hospital",
    };
  }
  return { facilityName: location.locationName || "", facilityType: "" };
};

/**
 * GET /api/slots?date=YYYY-MM-DD
 *
 * Aggregates live slot occupancy for the authenticated doctor's appointments
 * on the requested clinic-local date. Each slot exposes:
 *   - standardCount  (non-emergency active bookings)
 *   - emergencyCount (isEmergency === true active bookings)
 *   - totalCount
 *   - isFull         (true when standardCount >= 3)
 *
 * The booking modals use this endpoint so Patient and Appointments pages
 * render EXACTLY the same capacity data and emergency badges.
 */
export const getSlots = async (req, res) => {
  try {
    const requestedDate = String(req.query.date || "").trim();
    const range = getClinicDayRange(requestedDate);
    if (!range) {
      return res
        .status(400)
        .json({ message: "Invalid date parameter. Expected YYYY-MM-DD." });
    }

    const slots = await getSlotAvailability({
      doctorId: req.doctorId,
      dayRange: range,
    });

    res.status(200).json({
      date: requestedDate,
      maxPerSlot: MAX_STANDARD_APPOINTMENTS_PER_SLOT,
      slots,
    });
  } catch (error) {
    console.error("[getSlots]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const { date, status, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const query = { doctor: req.doctorId };

    if (date) {
      const range = getClinicDayRange(String(date).trim());
      if (!range) {
        return res.status(400).json({ message: "Invalid date parameter. Expected YYYY-MM-DD." });
      }
      query.date = { $gte: range.startOfDay, $lte: range.endOfDay };
    }

    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate("patient", "name phone age")
      .sort({ date: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      appointments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findOne({
      doctor: req.doctorId,
      _id: id,
    }).populate("patient", "name phone age");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json({ appointment });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { patientId, date, slot, type, notes } = req.body;
    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }
    if (!slot) {
      return res.status(400).json({ message: "Slot is required" });
    }
    if (!type) {
      return res.status(400).json({ message: "Type is required" });
    }

    // Emergency Mode override: emergency bookings bypass the standard
    // 3-per-slot capacity check entirely (unlimited emergency bookings).
    const isEmergency = req.body.isEmergency === true || req.body.isEmergency === "true";

    // Standardized payload contract: the frontend must always send the RAW
    // base price as `standardFee` and the RAW discount as `discount`. It must
    // NOT pre-subtract the discount before dispatching the request — doing so
    // previously caused a double-discount bug because this controller also
    // subtracted the discount, e.g. 500 fee - 50 discount (frontend) = 450
    // sent as `consultationFee`, then 450 - 50 (backend) = 400 instead of 450.
    // `amount`/`consultationFee` are accepted only as legacy fallbacks for the
    // base fee — never combine them with a second subtraction downstream.
    const standardFee = Number(req.body.standardFee ?? req.body.amount ?? req.body.consultationFee ?? 0);
    const discount = Number(req.body.discount ?? 0);
    const paymentDescription = String(req.body.description ?? "Consultation").trim() || "Consultation";
    const paymentMethod = req.body.paymentMethod || "Cash";

    if (!Number.isFinite(standardFee) || standardFee < 0) {
      return res.status(400).json({ message: "Consultation amount must be valid" });
    }
    if (!Number.isFinite(discount) || discount < 0) {
      return res.status(400).json({ message: "Discount must be valid" });
    }

    const patient = await Patient.findOne({
      doctor: req.doctorId,
      _id: patientId,
    });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Capacity check uses STANDARD (non-emergency) bookings only. Emergency
    // bookings are counted separately and never block the slot.
    const standardCount = await Appointment.countDocuments({
      doctor: req.doctorId,
      date,
      slot,
      status: { $nin: INACTIVE_STATUSES },
      isEmergency: { $ne: true },
    });

    if (!isEmergency && standardCount >= MAX_APPOINTMENTS_PER_SLOT) {
      return res
        .status(400)
        .json({
          message: "Slot capacity reached. Enable Emergency Mode to override",
        });
    }

    const isToday = (dateInput) => {
      const d = new Date(dateInput);
      const today = new Date();
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    };

    // Compute the net fee ONCE, here, from the raw standardFee/discount pair.
    // Nothing downstream (Mongoose hooks, Payment record, aggregations) may
    // subtract the discount again — they all just persist/read this value.
    const netAmount = Math.max(0, Number(standardFee) - Number(discount || 0));

    const appointment = new Appointment({
      patient: patientId,
      doctor: req.doctorId,
      date,
      slot,
      type,
      notes,
      isEmergency,
      isWalkIn: req.body.isWalkIn ?? true,
      queueStatus: req.body.queueStatus || 'WAITING',
      checkInTime: req.body.checkInTime || Date.now(),
      consultationFee: netAmount,
      standardFee,
      originalFee: standardFee,
      discountAmount: discount,
      netAmount,
    });
    await appointment.save();

    // Create consultation payment record immediately upon booking (upfront revenue recognized)
    await Payment.create({
      patientId: patientId,
      appointmentId: appointment._id,
      doctorId: req.doctorId,
      category: 'CONSULTATION',
      status: 'PAID',
      amount: netAmount,
      standardFee,
      originalFee: standardFee,
      discount,
      discountAmount: discount,
      netAmount,
      description: paymentDescription,
      method: paymentMethod
    });

    const doctor = await Doctor.findById(req.doctorId);
    const { facilityName, facilityType } = resolveFacilityForPatient(
      patient,
      doctor,
    );

    const populated = await appointment.populate("patient", "name phone age");

    // WhatsApp Suppression Check: DO NOT trigger message if appointment is for today.
    // Trigger confirmation ONLY if appointmentDate is set for a future date.
    const apptDate = new Date(date);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (apptDate > todayEnd && !isToday(date)) {
      const msg = formatAppointmentMessage(
        patient.name,
        date,
        slot,
        type,
        doctor?.fullName || "Doctor",
        facilityName,
        facilityType,
      );
      await sendAppointmentWhatsApp(patient, appointment, msg);
    }

    res.status(201).json({
      message: "Appointment created successfully",
      appointment: populated,
    });
  } catch (error) {
    console.error("[createAppointment]", error);
    if (error?.code === 11000) {
      return res
        .status(409)
        .json({
          message:
            "This slot has reached the maximum capacity (3 appointments)",
        });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const {
      status,
      date,
      slot,
      type,
      notes,
      isEmergency,
      emergencyCancelled,
      cancellationReason,
    } = req.body;

    const appointment = await Appointment.findOne({
      doctor: req.doctorId,
      _id: id,
    });
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const nextDate = typeof date !== "undefined" ? date : appointment.date;
    const nextSlot = typeof slot !== "undefined" ? slot : appointment.slot;
    const nextStatus =
      typeof status !== "undefined" ? status : appointment.status;
    const nextIsEmergency =
      typeof isEmergency !== "undefined"
        ? isEmergency === true || isEmergency === "true"
        : appointment.isEmergency === true;
    const wasActive = !INACTIVE_STATUSES.includes(appointment.status);
    const willBeActive = !INACTIVE_STATUSES.includes(nextStatus);
    const dateOrSlotChanged =
      typeof date !== "undefined" || typeof slot !== "undefined";

    // Re-check capacity if slot changes or this appointment is becoming active.
    // Emergency appointments bypass the standard-capacity check, and only
    // non-emergency bookings count toward it.
    if (
      (dateOrSlotChanged || (!wasActive && willBeActive)) &&
      willBeActive &&
      !nextIsEmergency
    ) {
      const standardCount = await Appointment.countDocuments({
        doctor: req.doctorId,
        _id: { $ne: appointment._id },
        date: nextDate,
        slot: nextSlot,
        status: { $nin: INACTIVE_STATUSES },
        isEmergency: { $ne: true },
      });
      if (standardCount >= MAX_APPOINTMENTS_PER_SLOT) {
        return res
          .status(400)
          .json({
            message: "Slot capacity reached. Enable Emergency Mode to override",
          });
      }
    }

    if (status) appointment.status = status;
    if (date) appointment.date = date;
    if (slot) appointment.slot = slot;
    if (type) appointment.type = type;
    if (typeof isEmergency !== "undefined")
      appointment.isEmergency = nextIsEmergency;
    if (typeof notes !== "undefined") appointment.notes = notes;
    if (typeof emergencyCancelled !== "undefined")
      appointment.emergencyCancelled = emergencyCancelled;

    if (typeof cancellationReason !== "undefined") {
      appointment.cancellationReason = cancellationReason || null;
    } else if (status === "No-show") {
      appointment.cancellationReason = "No-show";
    } else if (status === "Cancelled" && !appointment.cancellationReason) {
      appointment.cancellationReason = "Patient";
    } else if (status !== "Cancelled" && status !== "No-show") {
      appointment.cancellationReason = null;
    }

    // Allow reminder to be recalculated after rescheduling.
    if (typeof date !== "undefined" || typeof slot !== "undefined") {
      appointment.reminderSent = false;
    }

    if (status === "Cancelled" || status === "No-show" || status === "Completed") {
      appointment.reminderSent = true;
    }

    if (status === "Completed" || status === "COMPLETED") {
      appointment.queueStatus = "COMPLETED";
    }

    await appointment.save();

    if (status === "Completed" || status === "COMPLETED") {
      await Payment.updateMany(
        { appointmentId: appointment._id },
        { $set: { status: "REALIZED" } }
      );
    }

    const populated = await Appointment.findById(id).populate(
      "patient",
      "name phone age locations",
    );
    if (date || slot) {
      const doctor = await Doctor.findById(req.doctorId);
      const { facilityName, facilityType } = resolveFacilityForPatient(
        populated?.patient,
        doctor,
      );
      const msg = formatAppointmentMessage(
        populated.patient.name,
        populated.date,
        populated.slot,
        populated.type,
        doctor?.fullName || "Doctor",
        facilityName,
        facilityType,
      );
      await sendAppointmentWhatsApp(populated.patient, populated, msg);
    }

    res.status(200).json({
      message: "Appointment updated successfully",
      appointment: populated,
    });
  } catch (error) {
    console.error("[updateAppointment]", error);
    if (error?.code === 11000) {
      return res
        .status(409)
        .json({
          message:
            "This slot has reached the maximum capacity (3 appointments)",
        });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid appointment id" });
    }
    const appointment = await Appointment.findOneAndDelete({
      doctor: req.doctorId,
      _id: id,
    });
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const emergencyCancel = async (req, res) => {
  try {
    const { startDate, startTime, endDate, endTime } = req.body;
    if (!startDate || !startTime || !endDate || !endTime) {
      return res
        .status(400)
        .json({ message: "Start date/time and end date/time are required" });
    }

    const start = new Date(`${startDate}T${startTime}:00Z`);
    const end = new Date(`${endDate}T${endTime}:00Z`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date/time format" });
    }
    if (start > end) {
      return res
        .status(400)
        .json({ message: "Start datetime must be before end datetime" });
    }

    const startDay = new Date(`${startDate}T00:00:00Z`);
    const endDay = new Date(`${endDate}T23:59:59Z`);

    const appointments = await Appointment.find({
      doctor: req.doctorId,
      date: { $gte: startDay, $lte: endDay },
      status: { $nin: INACTIVE_STATUSES },
    }).populate("patient", "name phone");

    const toCancel = appointments.filter((apt) => {
      const [aptHour, aptMin] = apt.slot.split(":").map(Number);
      const aptMinutesSinceMidnight = aptHour * 60 + aptMin;
      const [startHour, startMin] = startTime.split(":").map(Number);
      const startMinutesSinceMidnight = startHour * 60 + startMin;
      const [endHour, endMin] = endTime.split(":").map(Number);
      const endMinutesSinceMidnight = endHour * 60 + endMin;
      return (
        aptMinutesSinceMidnight >= startMinutesSinceMidnight &&
        aptMinutesSinceMidnight <= endMinutesSinceMidnight
      );
    });

    if (toCancel.length === 0) {
      return res
        .status(200)
        .json({
          message: "0 appointment(s) cancelled successfully",
          cancelledAppointments: [],
        });
    }

    const cancelledAt = new Date();

    // Single atomic write — replaces the sequential per-document save loop
    const cancelIds = toCancel.map((a) => a._id);
    await Appointment.updateMany(
      { _id: { $in: cancelIds } },
      {
        $set: {
          status: "Cancelled",
          cancellationReason: "Emergency",
          emergencyCancelled: true,
          reminderSent: true,
          cancelledAt,
        },
      },
    );

    // Re-fetch with updated status for the response and WhatsApp messages
    const cancelledAppointments = toCancel.map((a) => ({
      ...a.toObject(),
      status: "Cancelled",
      cancellationReason: "Emergency",
      emergencyCancelled: true,
      reminderSent: true,
      cancelledAt,
    }));

    for (const appointment of toCancel) {
      try {
        const formattedDate = new Date(appointment.date).toLocaleDateString(
          "en-PK",
          {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          },
        );
        const msg = `Dear ${appointment.patient.name}, your appointment on ${formattedDate} at ${appointment.slot} has been cancelled due to an emergency. We apologize for the inconvenience. - MedAlerto`;
        await sendAppointmentWhatsApp(appointment.patient, appointment, msg);
      } catch (error) {
        console.error(
          `WhatsApp send failed for appointment ${appointment._id}:`,
          error.message,
        );
      }
    }

    res.status(200).json({
      message: `${cancelledAppointments.length} appointment(s) cancelled successfully`,
      cancelledAppointments,
    });
  } catch (error) {
    console.error("[emergencyCancel]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendRescheduleWhatsApp = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findOne({
      doctor: req.doctorId,
      _id: id,
    }).populate("patient", "name phone locations");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    if (!appointment.patient?.phone) {
      return res
        .status(400)
        .json({ message: "Patient phone number not found" });
    }

    const doctor = await Doctor.findById(req.doctorId);
    const { facilityName, facilityType } = resolveFacilityForPatient(
      appointment?.patient,
      doctor,
    );

    const locationLine = facilityName
      ? `${facilityType || "Location"}: ${facilityName}\n`
      : "";
    const msg = `Dear ${appointment.patient.name},\n\nYour appointment with Dr. ${doctor?.fullName || "Doctor"} was cancelled due to an emergency.\n${locationLine}\nPlease wait while we reschedule your appointment.\n\nWe apologize for the inconvenience. - MedAlerto`;
    await sendAppointmentWhatsApp(appointment.patient, appointment, msg);

    res.status(200).json({ message: "Reschedule WhatsApp sent successfully" });
  } catch (error) {
    console.error("[sendRescheduleWhatsApp]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getTodayQueue = async (req, res) => {
  try {
    // Accept ?date=YYYY-MM-DD, otherwise default to "today" in the clinic's own
    // timezone (Asia/Karachi) so PKT appointments never bleed into the previous
    // calendar day when the server runs on UTC.
    const requestedDateStr = req.query.date
      ? String(req.query.date).trim()
      : toClinicDateString(new Date());

    const range = getClinicDayRange(requestedDateStr);
    if (!range) {
      return res.status(400).json({ message: "Invalid date parameter. Expected YYYY-MM-DD." });
    }

    const query = {
      doctor: req.doctorId,
      date: { $gte: range.startOfDay, $lte: range.endOfDay }
    };

    const appointments = await Appointment.find(query)
      .populate("patient");

    const appointmentIds = appointments.map((a) => a._id);
    const payments = await Payment.find({ appointmentId: { $in: appointmentIds } });

    const appointmentsWithPayments = appointments.map((appt) => {
      const apptObj = appt.toObject();
      const apptPayment = payments.find(
        (p) => p.appointmentId && p.appointmentId.toString() === appt._id.toString()
      );
      apptObj.paymentStatus = apptPayment ? apptPayment.status : "PENDING";
      apptObj.paymentAmount = apptPayment ? Number(apptPayment.netAmount ?? apptPayment.amount ?? 0) : 0;
      apptObj.originalFee = apptPayment ? Number(apptPayment.originalFee ?? apptPayment.amount ?? 0) : Number(apptObj.originalFee || apptObj.consultationFee || 0);
      apptObj.discountAmount = apptPayment ? Number(apptPayment.discountAmount ?? apptPayment.discount ?? 0) : Number(apptObj.discountAmount || 0);
      apptObj.netAmount = apptPayment ? Number(apptPayment.netAmount ?? apptPayment.amount ?? 0) : Number(apptObj.netAmount || apptObj.consultationFee || 0);
      return apptObj;
    });

    // Dynamic queue sort: active above completed, active by slot time, completed by token/time
    const parseSlotTime = (slotStr) => {
      if (!slotStr) return Infinity;
      const parts = String(slotStr).trim().split(' ');
      if (parts.length < 2) return Infinity;
      const [timePart, meridiem] = parts;
      const [hStr, mStr] = timePart.split(':');
      let h = parseInt(hStr, 10) || 0;
      const m = parseInt(mStr, 10) || 0;
      if (meridiem && meridiem.toUpperCase() === 'PM' && h !== 12) h += 12;
      if (meridiem && meridiem.toUpperCase() === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    appointmentsWithPayments.sort((a, b) => {
      const aActive = a.queueStatus !== 'COMPLETED';
      const bActive = b.queueStatus !== 'COMPLETED';
      if (aActive !== bActive) return aActive ? -1 : 1;
      if (aActive && bActive) {
        const ta = parseSlotTime(a.slot);
        const tb = parseSlotTime(b.slot);
        if (ta !== tb) return ta - tb;
        return new Date(a.checkInTime || 0) - new Date(b.checkInTime || 0);
      }
      // Completed group: sink to bottom, order by token number then check-in
      const aToken = parseInt(String(a.token || '').replace(/\D/g, ''), 10) || 0;
      const bToken = parseInt(String(b.token || '').replace(/\D/g, ''), 10) || 0;
      if (aToken !== bToken) return aToken - bToken;
      return new Date(a.checkInTime || 0) - new Date(b.checkInTime || 0);
    });

    // Defensive guard: only keep appointments whose calendar date in the clinic
    // timezone matches the requested date. This is a second line of defence on
    // top of the day-range query above (the server's timezone is no longer used).
    const strictAppointments = appointmentsWithPayments.filter((appt) => {
      const apptDate = toClinicDateString(appt.date) || toClinicDateString(appt.checkInTime);
      return apptDate === requestedDateStr;
    });

    res.status(200).json({ appointments: strictAppointments });
  } catch (error) {
    console.error("[getTodayQueue]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const startConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      doctor: req.doctorId,
    }).populate("patient");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.queueStatus = "IN_CONSULTATION";
    await appointment.save();

    // Query prior checkups matching patient ID
    const history = await Checkup.find({
      patient: appointment.patient._id,
      doctor: req.doctorId
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Consultation started successfully",
      appointment,
      history
    });
  } catch (error) {
    console.error("[startConsultation]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendOverdueReminder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      doctor: req.doctorId,
    }).populate("patient");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!appointment.patient?.phone) {
      return res.status(400).json({ message: "Patient phone number is missing" });
    }

    // Trigger Meta Cloud API text dispatch
    const doctor = await Doctor.findById(req.doctorId);
    const doctorName = doctor?.fullName || "Abdullah";
    const msg = `Dear ${appointment.patient.name}, your appointment with Dr. ${doctorName} was scheduled for ${appointment.slot}. Please arrive at the clinic as soon as possible to keep your slot.`;
    
    await sendWhatsAppTextMessage(appointment.patient.phone, msg);

    res.status(200).json({ message: "Overdue reminder sent successfully" });
  } catch (error) {
    console.error("[sendOverdueReminder]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
