import mongoose from "mongoose";
import Appointment from "../models/appointment.model.js";
import Patient from "../models/patient.model.js";
import client from "../utils/whatsapp.js";
import { Doctor } from "../models/doctor.model.js";

const sendAppointmentWhatsApp = async (patient, appointment, message) => {
  try {
    const phone = patient.phone.replace(/\D/g, "");
    const whatsappPhone = phone.startsWith("0") ? "92" + phone.slice(1) : phone;
    const chatId = `${whatsappPhone}@c.us`;
    await client.sendMessage(chatId, message);
  } catch (err) {
    console.error("Appointment WhatsApp error:", err.message);
  }
};
const formatAppointmentMessage = (patientName, date, slot, type) => {
  const formattedDate = new Date(date).toLocaleDateString("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `Dear ${patientName}, your appointment is scheduled for ${formattedDate} at ${slot}. Type: ${type}. - MedAlerto`;
};

export const getAppointments = async (req, res) => {
  try {
    const { date, status } = req.query;

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
      .sort({ date: 1 });

    res.status(200).json({ appointments });
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
    const existing = await Appointment.findOne({
      doctor: req.doctorId,
      date,
      slot,
      status: { $nin: ["Cancelled", "Completed"] },
    });
    if (existing) {
      return res.status(409).json({ message: "This slot is already booked" });
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
    const populated = await appointment.populate("patient", "name phone age");
    const msg = formatAppointmentMessage(patient.name, date, slot, type);
    await sendAppointmentWhatsApp(patient, appointment, msg);
    res.status(201).json({
      message: "Appointment created successfully",
      appointment: populated,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }
    const { status, date, slot, type, notes, emergencyCancelled } = req.body;
    const appointment = await Appointment.findOne({
      doctor: req.doctorId,
      _id: id,
    });
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (typeof date !== "undefined" || typeof slot !== "undefined") {
      const nextDate = typeof date !== "undefined" ? date : appointment.date;
      const nextSlot = typeof slot !== "undefined" ? slot : appointment.slot;
      const conflict = await Appointment.findOne({
        doctor: req.doctorId,
        _id: { $ne: appointment._id },
        date: nextDate,
        slot: nextSlot,
        status: { $nin: ["Cancelled", "Completed"] },
      });
      if (conflict) {
        return res.status(400).json({ message: "This slot is already booked" });
      }
    }

    if (status) appointment.status = status;
    if (date) appointment.date = date;
    if (slot) appointment.slot = slot;
    if (type) appointment.type = type;
    if (typeof notes !== "undefined") appointment.notes = notes;
    if (typeof emergencyCancelled !== "undefined") appointment.emergencyCancelled = emergencyCancelled;

    // Allow reminder to be recalculated after rescheduling.
    if (typeof date !== "undefined" || typeof slot !== "undefined") {
      appointment.reminderSent = false;
    }

    if (status === "Cancelled" || status === "Completed") {
      appointment.reminderSent = true;
    }

    await appointment.save();
    const populated = await Appointment.findById(appointment._id).populate(
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
      return res.status(400).json({ message: "Start date/time and end date/time are required" });
    }

    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date/time format" });
    }
    if (start > end) {
      return res.status(400).json({ message: "Start datetime must be before end datetime" });
    }

    const startDay = new Date(startDate);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(endDate);
    endDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctor: req.doctorId,
      date: { $gte: startDay, $lte: endDay },
      status: { $ne: "Cancelled" },
    }).populate("patient", "name phone");

    const toCancel = appointments.filter((apt) => {
      const aptDateTime = new Date(`${apt.date.toISOString().split("T")[0]}T${apt.slot}:00`);
      return aptDateTime >= start && aptDateTime <= end;
    });

    const cancelledAppointments = [];

    for (const appointment of toCancel) {
      appointment.status = "Cancelled";
      appointment.emergencyCancelled = true;
      appointment.reminderSent = true;
      await appointment.save();
      cancelledAppointments.push(appointment);

      try {
        const formattedDate = new Date(appointment.date).toLocaleDateString(
          "en-PK",
          {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          }
        );
        const msg = `Dear ${appointment.patient.name}, your appointment on ${formattedDate} at ${appointment.slot} has been cancelled due to an emergency. We apologize for the inconvenience. - MedAlerto`;
        await sendAppointmentWhatsApp(appointment.patient, appointment, msg);
      } catch (error) {
        console.error(
          `WhatsApp send failed for appointment ${appointment._id}:`,
          error.message
        );
      }
    }

    res.status(200).json({
      message: `${cancelledAppointments.length} appointment(s) cancelled successfully`,
      cancelledAppointments,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
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
      return res.status(400).json({ message: "Patient phone number not found" });
    }

    const msg = `Dear ${appointment.patient.name}, your appointment was cancelled due to an emergency. Please wait while we reschedule your appointment. - MedAlerto`;
    await sendAppointmentWhatsApp(appointment.patient, appointment, msg);

    res.status(200).json({ message: "Reschedule WhatsApp sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
