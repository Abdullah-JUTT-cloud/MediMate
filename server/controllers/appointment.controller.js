import mongoose from "mongoose";
import Appointment from "../models/appointment.model.js";
import Patient from "../models/patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import { sendWhatsAppTextMessage } from "../services/whatsapp.service.js";
import Payment from "../models/payment.model.js";
import Checkup from "../models/checkup.model.js";
import BookingPaymentProof from "../models/bookingPaymentProof.model.js";
import {
  getSlotAvailability,
  MAX_STANDARD_APPOINTMENTS_PER_SLOT,
} from "../services/slotService.js";
import {
  getClinicDayRange,
  toClinicDateString,
} from "../utils/dateUtils.js";
import { computeConsultationFee } from "../utils/consultationFee.js";

const MAX_APPOINTMENTS_PER_SLOT = MAX_STANDARD_APPOINTMENTS_PER_SLOT;
const INACTIVE_STATUSES = ["Cancelled", "No-show", "Completed"];


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

    // "Pay at consultation" deferral: the fee is not known yet (e.g. dentists
    // can't price before the exam). Fee fields stay at their schema defaults
    // (0) and NO Payment record is created — the consultation workspace sets
    // the fee and creates the Payment when the visit is saved.
    const payAtConsultation = req.body.payAtConsultation === true || req.body.payAtConsultation === "true";

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

    // Capacity check uses STANDARD (non-emergency) bookings only.
    // Appointments awaiting online approval are excluded — they are not
    // confirmed yet and must not block receptionist-entered bookings.
    const standardCount = await Appointment.countDocuments({
      doctor: req.doctorId,
      date,
      slot,
      status: { $nin: INACTIVE_STATUSES },
      isEmergency: { $ne: true },
      awaitingOnlineApproval: { $ne: true },
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

    // Compute the net fee here from the raw standardFee/discount pair using the
    // shared formula (utils/consultationFee.js). Nothing downstream (Mongoose
    // hooks, Payment record, aggregations) may subtract the discount again —
    // they all just persist/read this value. For payAtConsultation bookings the
    // fee is 0 here; it is computed LATER at consultation save with the same
    // formula. Walk-ins have no online advance, so netAmount is also the whole
    // amount to collect at the desk.
    const { netAmount } = computeConsultationFee({
      standardFee,
      discountAmount: discount,
    });
    // Deferred bookings keep every fee field at its schema default (0) —
    // don't store the placeholder 0 pair as if it were a real price.
    const storedStandardFee = payAtConsultation ? 0 : standardFee;
    const storedDiscount = payAtConsultation ? 0 : discount;
    const storedNet = payAtConsultation ? 0 : netAmount;

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
      consultationFee: storedNet,
      standardFee: storedStandardFee,
      originalFee: storedStandardFee,
      discountAmount: storedDiscount,
      netAmount: storedNet,
      payAtConsultation,
    });
    await appointment.save();

    // Create consultation payment record immediately upon booking (upfront
    // revenue recognized) — SKIPPED for deferred fees: there is no fee to
    // log yet, and the record is created at consultation save instead.
    if (!payAtConsultation) {
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
    }

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

    // Consultation draft auto-save: a snapshot of the in-progress form so
    // the doctor can close the panel and resume later. Reuses this
    // endpoint (instead of a dedicated PATCH /:id/draft) because the
    // payload is just another field on the appointment document — none of
    // the slot/status/cancellation logic above is touched when these
    // fields are sent alone. The actual save is gated below so a
    // draft-save never collides with a real status/date edit in the same
    // request.
    const draftCheckup = req.body.draftCheckup;
    const draftSavedAt = req.body.draftSavedAt;
    const hasDraftUpdate =
      typeof draftCheckup !== "undefined" ||
      typeof draftSavedAt !== "undefined";

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
        awaitingOnlineApproval: { $ne: true },
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

    // Consultation draft auto-save. Either:
    //   - the explicit clear path (`draftCheckup: null` + `draftSavedAt:
    //     null` sent by the consultation-complete handler), or
    //   - the snapshot-save path (a draft object + a Date).
    // `markModified` is required for Mixed subtrees so Mongoose actually
    // persists nested changes. No slot/status side effects apply here.
    if (hasDraftUpdate) {
      const clearDraft =
        draftCheckup === null &&
        (typeof draftSavedAt === "undefined" || draftSavedAt === null);
      if (clearDraft) {
        appointment.draftCheckup = null;
        appointment.draftSavedAt = null;
      } else {
        if (typeof draftCheckup !== "undefined") {
          appointment.draftCheckup = draftCheckup;
          appointment.markModified("draftCheckup");
        }
        if (typeof draftSavedAt !== "undefined") {
          appointment.draftSavedAt = draftSavedAt ? new Date(draftSavedAt) : null;
        }
      }
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
      // Prefer the CONSULTATION ledger row: an appointment can also carry LAB /
      // extra-payment rows, and reading whichever happened to sort first would
      // put the wrong number in the queue's fee badge.
      const apptPayments = payments.filter(
        (p) => p.appointmentId && p.appointmentId.toString() === appt._id.toString()
      );
      const apptPayment =
        apptPayments.find((p) => p.category === "CONSULTATION") || apptPayments[0] || null;
      apptObj.paymentStatus = apptPayment ? apptPayment.status : "PENDING";
      apptObj.paymentAmount = apptPayment ? Number(apptPayment.netAmount ?? apptPayment.amount ?? 0) : 0;
      apptObj.originalFee = apptPayment ? Number(apptPayment.originalFee ?? apptPayment.amount ?? 0) : Number(apptObj.originalFee || apptObj.consultationFee || 0);
      apptObj.discountAmount = apptPayment ? Number(apptPayment.discountAmount ?? apptPayment.discount ?? 0) : Number(apptObj.discountAmount || 0);
      apptObj.netAmount = apptPayment ? Number(apptPayment.netAmount ?? apptPayment.amount ?? 0) : Number(apptObj.netAmount || apptObj.consultationFee || 0);
      // Online advance already received + the cash still to collect at the
      // desk. `netAmount` is the FULL billed price, so the queue needs both
      // numbers: "Rs 2,000 total · Rs 1,500 to collect".
      const advanceAmountPaid = Math.max(
        0,
        Number(apptObj.advanceAmountPaid ?? apptPayment?.advanceAmountPaid) || 0,
      );
      apptObj.advanceAmountPaid = advanceAmountPaid;
      apptObj.balanceDue = Math.max(0, Number(apptObj.netAmount || 0) - advanceAmountPaid);
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

// ─────────────────────────────────────────────────────────────────────────────
// Online Booking Approval / Rejection  (receptionist-authenticated)
// ─────────────────────────────────────────────────────────────────────────────

// Derives a full-year age from a date of birth. Returns null when the value
// is missing/unparseable or implausible so callers can fall back to a
// schema-safe placeholder.
const ageFromDob = (dob) => {
  if (!dob) return null;
  const dobDate = new Date(dob);
  if (Number.isNaN(dobDate.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dobDate.getFullYear();
  const monthDiff = now.getMonth() - dobDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dobDate.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
};

const VALID_PATIENT_GENDERS = ["Male", "Female", "Other"];

/**
 * Resolves how much the patient already paid online for this booking.
 *
 * Prefers the amount stored on the appointment (seeded by the online booking
 * flow and kept in sync on approval) and falls back to the latest
 * BookingPaymentProof — that keeps legacy bookings, created before the amount
 * was mirrored onto the appointment, reporting the real advance instead of 0.
 *
 * The advance is deliberately NOT folded into the fee: it never reduces the
 * billed total, it only says how much of that total is still to collect at the
 * clinic. Returns 0 for walk-ins, which have no online proof.
 */
const resolveOnlineAdvanceAmount = async (appointment) => {
  const stored = Math.max(0, Number(appointment?.advanceAmountPaid) || 0);
  if (stored > 0) return stored;
  // Only PatientAccount bookings can have an online advance at all.
  if (!appointment?.patientAccount) return 0;

  const proof = await BookingPaymentProof.findOne({
    appointmentId: appointment._id,
  })
    .sort({ createdAt: -1 })
    .select("amount");

  return Math.max(0, Number(proof?.amount) || 0);
};

/**
 * PATCH /api/appointments/:id/approve-online
 *
 * Confirms a pending online booking:
 *  1. Re-checks slot capacity (now counting this booking for real).
 *  2. Reconciles fees with the shared formula
 *     (utils/consultationFee.js): netAmount = standardFee - discountAmount
 *     (>= 0) — i.e. the FULL price the doctor typed is what gets billed and
 *     logged, advance included. The online advance never reduces that total;
 *     it is stored on `advanceAmountPaid` in BOTH modes so every surface can
 *     show "Rs X already paid, collect Rs Y at the visit".
 *     With `payAtConsultation: true` the fee is deferred instead — fee
 *     resolution is skipped entirely, fee fields are zeroed, the online
 *     advance is still stored on `advanceAmountPaid`, and no Payment record is
 *     created (it happens at consultation save).
 *  3. Clears awaitingOnlineApproval and sets status → "Confirmed".
 *  4. Links/auto-creates the clinic-scoped Patient record (required
 *     age/gender are supplied — this previously threw a schema
 *     ValidationError and surfaced as a 500 on "Confirm Approval").
 *  5. Marks the BookingPaymentProof → APPROVED.
 *  6. Upserts the Payment record (Revenue Lab / Payments pages) — skipped
 *     for deferred fees.
 *  7. queueStatus → "WAITING" so the booking enters the active Doctor Queue.
 *  8. Sends a WhatsApp confirmation to the PatientAccount's phone — without
 *     a "Total Price" line when the fee is deferred.
 *
 * Re-approving a previously REJECTED booking is supported: the stale
 * cancellation/rejection state is cleared so the booking is a clean
 * "Confirmed" record.
 */
export const approveOnlineBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkupPrice, consultationFee } = req.body || {};
    const payAtConsultation =
      req.body.payAtConsultation === true || req.body.payAtConsultation === "true";

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      doctor: req.doctorId,
    }).populate("patientAccount", "name phone email dateOfBirth");

    if (!appointment) {
      return res.status(404).json({ message: "Pending or rejected online booking not found" });
    }

    // Idempotency: distinguish "already approved" from other non-approvable
    // states so a double-click or stale UI state returns a 409, not a 500.
    const isPending = appointment.awaitingOnlineApproval === true;
    const isRejected =
      appointment.status === "Cancelled" &&
      appointment.cancellationReason === "Payment Rejected";

    if (!isPending && !isRejected) {
      return res.status(409).json({
        message:
          appointment.status === "Confirmed"
            ? "This booking has already been approved"
            : "This booking is not awaiting online approval",
      });
    }

    // Re-check capacity now that this booking will count
    const range = getClinicDayRange(toClinicDateString(appointment.date));
    if (range) {
      const standardCount = await Appointment.countDocuments({
        doctor: req.doctorId,
        date: { $gte: range.startOfDay, $lte: range.endOfDay },
        slot: appointment.slot,
        status: { $nin: INACTIVE_STATUSES },
        isEmergency: { $ne: true },
        awaitingOnlineApproval: { $ne: true },
        _id: { $ne: appointment._id },
      });

      if (standardCount >= MAX_APPOINTMENTS_PER_SLOT) {
        return res.status(409).json({
          message: "Slot is now full — cannot approve this booking. Please reschedule it first.",
        });
      }
    }

    // ── Fee reconciliation ──────────────────────────────────────────────────
    // The doctor's entry is ALWAYS the full price of the visit — the online
    // advance the patient already paid never reduces it, it only explains how
    // much cash is still owed at the desk. Both numbers come out of the shared
    // formula in utils/consultationFee.js so approvals, consultation save and
    // Payments edits can never drift apart.
    //
    // "Pay at consultation": the receptionist is only confirming the booking —
    // there is no fee to resolve yet, so the standardFee fallback chain
    // (checkupPrice → stored fee → doctorFee) is skipped entirely and the fee
    // fields stay at 0. The advance is still resolved: the consultation
    // workspace needs it to tell the doctor what to collect.
    const advanceAmountPaid = await resolveOnlineAdvanceAmount(appointment);
    let feeBreakdown = {
      standardFee: 0,
      discountAmount: 0,
      netAmount: 0,
      advanceAmountPaid,
      balanceDue: 0,
    };
    if (!payAtConsultation) {
      // The explicit checkup price from the approval modal wins; otherwise
      // fall back to the stored fee, then the doctor's configured online
      // booking fee.
      const doctor = await Doctor.findById(req.doctorId).select("advanceBookingFee onlineBookingFee");
      const doctorFee = doctor?.onlineBookingFee || doctor?.advanceBookingFee || 0;
      const standardFee = Math.max(
        0,
        Number(checkupPrice ?? consultationFee ?? appointment.consultationFee ?? doctorFee) || 0,
      );
      feeBreakdown = computeConsultationFee({
        standardFee,
        discountAmount: Number(appointment.discountAmount) || 0,
        advanceAmountPaid,
      });
    }

    // ── Clinic Patient record ──────────────────────────────────────────────
    // Auto-create or find the clinic-scoped Patient record so the patient
    // appears in the Doctor Queue and Patient lists. The Patient model
    // REQUIRES age + gender; the auto-create below supplies them (derived
    // from the PatientAccount where possible, placeholder otherwise) so the
    // approval can never fail schema validation.
    let patientRecord = null;
    if (appointment.patient) {
      patientRecord = await Patient.findById(appointment.patient);
    }
    if (!patientRecord && appointment.patientAccount?.phone) {
      patientRecord = await Patient.findOne({
        doctor: req.doctorId,
        phone: appointment.patientAccount.phone,
      });
      if (!patientRecord) {
        const patientGender = VALID_PATIENT_GENDERS.includes(appointment.patientAccount?.gender)
          ? appointment.patientAccount.gender
          : "Other";
        patientRecord = await Patient.create({
          doctor: req.doctorId,
          name: appointment.patientAccount.name || "Online Patient",
          phone: appointment.patientAccount.phone,
          age: ageFromDob(appointment.patientAccount?.dateOfBirth) ?? 18,
          gender: patientGender,
          locations: [],
        });
      }
    }

    appointment.patient = patientRecord?._id || appointment.patient;
    appointment.awaitingOnlineApproval = false;
    appointment.advancePaid = true;
    appointment.status = "Confirmed";
    // Enters the active Doctor Queue (getTodayQueue renders WAITING first).
    appointment.queueStatus = "WAITING";
    if (payAtConsultation) {
      // Deferred fee: zero out the pre-populated booking fee (the online
      // booking flow seeds it with the doctor's advanceBookingFee) so no
      // stale price is read downstream, and keep the actual online advance on
      // the appointment — the consultation workspace needs it to tell the
      // doctor "Rs X already paid, enter the full price".
      appointment.payAtConsultation = true;
      appointment.advanceAmountPaid = feeBreakdown.advanceAmountPaid;
      appointment.consultationFee = 0;
      appointment.standardFee = 0;
      appointment.originalFee = 0;
      appointment.discountAmount = 0;
      appointment.netAmount = 0;
    } else {
      // Charge now: the entered price IS the bill. `consultationFee` mirrors
      // netAmount (the total) rather than the cash still owed, so Revenue Lab
      // shows the full 2,000 while the queue can still report the 1,500 to
      // collect from `advanceAmountPaid`.
      appointment.payAtConsultation = false;
      appointment.advanceAmountPaid = feeBreakdown.advanceAmountPaid;
      appointment.consultationFee = feeBreakdown.netAmount;
      appointment.standardFee = feeBreakdown.standardFee;
      appointment.originalFee = feeBreakdown.standardFee;
      appointment.discountAmount = feeBreakdown.discountAmount;
      appointment.netAmount = feeBreakdown.netAmount;
    }
    // Clear stale rejection state when re-approving a previously rejected
    // request so the booking reads as a clean "Confirmed" record.
    appointment.cancellationReason = null;
    appointment.rejectionReason = null;
    appointment.cancelledAt = null;
    await appointment.save();

    // Mark payment proof approved
    await BookingPaymentProof.updateOne(
      { appointmentId: appointment._id, status: "PENDING" },
      { $set: { status: "APPROVED" } }
    );

    // Create/Upsert Payment record so it automatically reflects on Revenue Lab
    // and Payments pages. `patientId` is required by the Payment schema, so
    // the upsert is only attempted once a clinic Patient record exists;
    // runValidators keeps the stored document schema-clean on re-approval.
    // The logged amount is the FULL billed price (advance included) — the
    // advance is recorded alongside it as `advanceAmountPaid`, never as an
    // extra row (that would double-count) and never as a discount.
    // SKIPPED for deferred fees — there is no fee to log yet; the record is
    // created when the doctor saves the checkup with the final fee.
    if (patientRecord?._id && !payAtConsultation) {
      await Payment.findOneAndUpdate(
        { appointmentId: appointment._id },
        {
          patientId: patientRecord._id,
          doctorId: req.doctorId,
          appointmentId: appointment._id,
          category: "CONSULTATION",
          status: "PAID",
          amount: feeBreakdown.netAmount,
          standardFee: feeBreakdown.standardFee,
          originalFee: feeBreakdown.standardFee,
          discount: feeBreakdown.discountAmount,
          discountAmount: feeBreakdown.discountAmount,
          netAmount: feeBreakdown.netAmount,
          advanceAmountPaid: feeBreakdown.advanceAmountPaid,
          description: feeBreakdown.balanceDue > 0
            ? `Online Approved Consultation (Rs ${feeBreakdown.advanceAmountPaid.toLocaleString()} paid online, Rs ${feeBreakdown.balanceDue.toLocaleString()} to collect at visit)`
            : "Online Approved Consultation",
          method: "Online Transfer",
        },
        { upsert: true, new: true, runValidators: true }
      );
    }

    // WhatsApp confirmation to patient (fire-and-forget — a messaging
    // failure must never turn an otherwise successful approval into a 500).
    const patientPhone = appointment.patientAccount?.phone || patientRecord?.phone;
    if (patientPhone) {
      const patientName = appointment.patientAccount?.name || patientRecord?.name || "Patient";
      const dateStr = toClinicDateString(appointment.date) || String(appointment.date).slice(0, 10);
      // Deferred fee → the price isn't known yet, so omit the Total Price line
      // but still acknowledge the advance that was received.
      const advanceLines =
        feeBreakdown.advanceAmountPaid > 0 && !payAtConsultation
          ? `Already Paid Online: Rs ${feeBreakdown.advanceAmountPaid.toLocaleString()}\n${
              feeBreakdown.balanceDue > 0
                ? `Balance To Pay At Clinic: Rs ${feeBreakdown.balanceDue.toLocaleString()}\n`
                : ""
            }`
          : "";
      const priceLine = payAtConsultation
        ? feeBreakdown.advanceAmountPaid > 0
          ? `Advance Received: Rs ${feeBreakdown.advanceAmountPaid.toLocaleString()}\nFinal fee will be confirmed at your visit.\n`
          : ""
        : `Total Price: Rs ${feeBreakdown.netAmount.toLocaleString()}\n${advanceLines}`;
      const confirmMsg = `Dear ${patientName}, your appointment request with MedAlerto has been *confirmed* ✅\n\nDate: ${dateStr}\nSlot: ${appointment.slot}\n${priceLine}\n\nPlease arrive 10 minutes early. Thank you!`;
      sendWhatsAppTextMessage(patientPhone, confirmMsg).catch((err) =>
        console.error("[approveOnlineBooking] WhatsApp error:", err.message)
      );
    }

    res.status(200).json({ message: "Online booking approved and confirmed", appointment });
  } catch (error) {
    // Log the exact stack trace so approval 500s are never silent.
    console.error("[approveOnlineBooking] failed:", error);

    // Mongoose schema validation failure — return a descriptive 400 with the
    // first validation message instead of a generic 500.
    if (error?.name === "ValidationError" && error?.message) {
      const firstMessage =
        Object.values(error.errors || {})[0]?.message || error.message;
      return res.status(400).json({
        message: `Validation failed while approving booking: ${firstMessage}`,
      });
    }

    // Bad ObjectId reference while populating/creating linked documents.
    if (error?.name === "CastError") {
      return res.status(400).json({
        message: "Invalid patient or doctor reference while approving booking",
      });
    }

    // Unique-index collision (e.g. two payments for the same booking).
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "A payment record for this booking already exists",
      });
    }

    res.status(500).json({
      message: "Internal server error while approving booking. Please try again.",
    });
  }
};

/**
 * PATCH /api/appointments/:id/reject-online
 *
 * Rejects a pending online booking:
 *  1. Cancels the appointment with reason "Payment Rejected".
 *  2. Marks the BookingPaymentProof → REJECTED with the given reason.
 *  3. Notifies the patient via WhatsApp.
 *
 * Body: { reason?: string }
 */
export const rejectOnlineBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "Payment could not be verified" } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      doctor: req.doctorId,
      awaitingOnlineApproval: true,
    }).populate("patientAccount", "name phone email");

    if (!appointment) {
      return res.status(404).json({ message: "Pending online booking not found" });
    }

    appointment.awaitingOnlineApproval = false;
    appointment.status = "Cancelled";
    appointment.cancellationReason = "Payment Rejected";
    appointment.rejectionReason = String(reason).slice(0, 500);
    appointment.cancelledAt = new Date();
    await appointment.save();

    // Mark payment proof rejected
    await BookingPaymentProof.updateOne(
      { appointmentId: appointment._id },
      { $set: { status: "REJECTED", rejectionReason: String(reason).slice(0, 500) } }
    );

    // WhatsApp rejection notice
    const patientPhone = appointment.patientAccount?.phone;
    if (patientPhone) {
      const patientName = appointment.patientAccount?.name || "Patient";
      const dateStr = toClinicDateString(appointment.date) || String(appointment.date).slice(0, 10);
      const rejectMsg = `Dear ${patientName}, unfortunately your appointment request for ${dateStr} at slot ${appointment.slot} could not be confirmed.\n\nReason: ${reason}\n\nPlease contact the clinic to rebook or submit a corrected payment. — MedAlerto`;
      sendWhatsAppTextMessage(patientPhone, rejectMsg).catch((err) =>
        console.error("[rejectOnlineBooking] WhatsApp error:", err.message)
      );
    }

    res.status(200).json({ message: "Online booking rejected and cancelled" });
  } catch (error) {
    console.error("[rejectOnlineBooking]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/appointments/online-pending
 * Lists all pending online approval requests AND rejected online requests
 * for the authenticated doctor. Used by the receptionist approval queue.
 */
export const getOnlinePendingBookings = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const pendingQuery = { doctor: req.doctorId, awaitingOnlineApproval: true };
    const rejectedQuery = {
      doctor: req.doctorId,
      status: "Cancelled",
      cancellationReason: "Payment Rejected",
    };

    const [appointments, total, rejectedList] = await Promise.all([
      Appointment.find(pendingQuery)
        .populate("patientAccount", "name phone email")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Appointment.countDocuments(pendingQuery),
      Appointment.find(rejectedQuery)
        .populate("patientAccount", "name phone email")
        .sort({ cancelledAt: -1, updatedAt: -1 })
        .limit(50)
        .lean(),
    ]);

    // Lookup payment proof screenshots
    const allAppointmentIds = [
      ...appointments.map((a) => a._id),
      ...rejectedList.map((a) => a._id),
    ];
    const proofs = await BookingPaymentProof.find({ appointmentId: { $in: allAppointmentIds } }).lean();

    const proofMap = {};
    proofs.forEach((p) => {
      if (p.appointmentId) {
        proofMap[p.appointmentId.toString()] = {
          url: p.screenshotUrl,
          rejectionReason: p.rejectionReason,
          amount: Math.max(0, Number(p.amount) || 0),
        };
      }
    });

    // `advanceAmountPaid` = what the patient already sent online. The approval
    // modal needs it on the list payload so it can state "Rs 500 is already
    // paid — enter the FULL price" before the booking is approved. Latest
    // proof wins, then the amount mirrored on the appointment document.
    const withAdvance = (a) => ({
      ...a,
      advanceAmountPaid:
        proofMap[a._id.toString()]?.amount ??
        Math.max(0, Number(a.advanceAmountPaid) || 0),
    });

    const appointmentsWithProof = appointments.map((a) => ({
      ...withAdvance(a),
      paymentScreenshotUrl: proofMap[a._id.toString()]?.url || a.paymentScreenshotUrl || a.paymentScreenshot || null,
    }));

    const rejectedWithProof = rejectedList.map((a) => ({
      ...withAdvance(a),
      rejectionReason: a.rejectionReason || proofMap[a._id.toString()]?.rejectionReason || "Payment screenshot could not be verified",
      paymentScreenshotUrl: proofMap[a._id.toString()]?.url || a.paymentScreenshotUrl || a.paymentScreenshot || null,
    }));

    res.status(200).json({
      appointments: appointmentsWithProof,
      rejectedAppointments: rejectedWithProof,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error("[getOnlinePendingBookings]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

