import mongoose from "mongoose";
import Appointment from "../models/appointment.model.js";
import Patient from "../models/patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import { sendTextWhatsApp } from "../utils/whatsapp.js";

const MAX_APPOINTMENTS_PER_SLOT = 3;
const INACTIVE_STATUSES = ["Cancelled", "No-show", "Completed"];

const sendAppointmentWhatsApp = async (patient, appointment, message) => {
  try {
    await sendTextWhatsApp(patient.phone, message);
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
    ? `${facilityType === "Clinic" ? "Clinic" : "Hospital"}: ${facilityName}`
    : "";
  return `Dear ${patientName},\n\nYour appointment is confirmed with Dr. ${doctorName}\nDate: ${formattedDate}\nTime: ${slot}\nType: ${type}\n${facility}\n\nSee you soon! - MedAlerto`;
};

export const getAppointments = async (req, res) => {
  try {
    const { date, status, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const query = { doctor: req.doctorId };

    if (date) {
      const startOfDay = new Date(date);
      if (isNaN(startOfDay.getTime())) {
        return res.status(400).json({ message: "Invalid date parameter" });
      }
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
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

    const patient = await Patient.findOne({
      doctor: req.doctorId,
      _id: patientId,
    });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const activeCount = await Appointment.countDocuments({
      doctor: req.doctorId,
      date,
      slot,
      status: { $nin: INACTIVE_STATUSES },
    });

    if (activeCount >= MAX_APPOINTMENTS_PER_SLOT) {
      return res
        .status(409)
        .json({
          message:
            "This slot has reached the maximum capacity (3 appointments)",
        });
    }

    const appointment = new Appointment({
      patient: patientId,
      doctor: req.doctorId,
      date,
      slot,
      type,
      notes,
    });
    await appointment.save();

    const doctor = await Doctor.findById(req.doctorId);
    const facilityName =
      type === "Clinic"
        ? doctor?.clinics?.[0]?.name
        : doctor?.hospitals?.[0]?.name;
    const facilityType = type === "Clinic" ? "Clinic" : "Hospital";

    const populated = await appointment.populate("patient", "name phone age");
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
    const wasActive = !INACTIVE_STATUSES.includes(appointment.status);
    const willBeActive = !INACTIVE_STATUSES.includes(nextStatus);
    const dateOrSlotChanged =
      typeof date !== "undefined" || typeof slot !== "undefined";

    // Re-check capacity if slot changes or this appointment is becoming active.
    if ((dateOrSlotChanged || (!wasActive && willBeActive)) && willBeActive) {
      const activeCount = await Appointment.countDocuments({
        doctor: req.doctorId,
        _id: { $ne: appointment._id },
        date: nextDate,
        slot: nextSlot,
        status: { $nin: INACTIVE_STATUSES },
      });
      if (activeCount >= MAX_APPOINTMENTS_PER_SLOT) {
        return res
          .status(400)
          .json({
            message:
              "This slot has reached the maximum capacity (3 appointments)",
          });
      }
    }

    if (status) appointment.status = status;
    if (date) appointment.date = date;
    if (slot) appointment.slot = slot;
    if (type) appointment.type = type;
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

    await appointment.save();

    const populated = await Appointment.findById(id).populate(
      "patient",
      "name phone age",
    );
    if (date || slot) {
      const msg = formatAppointmentMessage(
        populated.patient.name,
        populated.date,
        populated.slot,
        populated.type,
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
    }).populate("patient", "name phone");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    if (!appointment.patient?.phone) {
      return res
        .status(400)
        .json({ message: "Patient phone number not found" });
    }

    const doctor = await Doctor.findById(req.doctorId);
    const facilityName =
      appointment.type === "Clinic"
        ? doctor?.clinics?.[0]?.name
        : doctor?.hospitals?.[0]?.name;
    const facilityType = appointment.type === "Clinic" ? "Clinic" : "Hospital";

    const msg = `Dear ${appointment.patient.name},\n\nYour appointment with Dr. ${doctor?.fullName || "Doctor"} was cancelled due to an emergency.\n${facilityType}: ${facilityName}\n\nPlease wait while we reschedule your appointment.\n\nWe apologize for the inconvenience. - MedAlerto`;
    await sendAppointmentWhatsApp(appointment.patient, appointment, msg);

    res.status(200).json({ message: "Reschedule WhatsApp sent successfully" });
  } catch (error) {
    console.error("[sendRescheduleWhatsApp]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
