import mongoose from "mongoose";
import Appointment from "../models/appointment.model.js";
import Patient from "../models/patient.model.js";

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
    const { status, date, slot, type, notes } = req.body;
    const appointment = await Appointment.findOne({
      doctor: req.doctorId,
      _id: id,
    });
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    if (status) appointment.status = status;
    if (date) appointment.date = date;
    if (slot) appointment.slot = slot;
    if (type) appointment.type = type;
    if (notes) appointment.notes = notes;
    await appointment.save();
    const populated = await Appointment.findById(appointment._id).populate(
      "patient",
      "name phone age",
    );
    res
      .status(200)
      .json({
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
