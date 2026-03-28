import mongoose from "mongoose";
import Checkup from "../models/checkup.model.js";
import Patient from "../models/patient.model.js";

const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const validateNextAppointmentDate = (value) => {
  if (value === undefined || value === null || value === "") {
    return { valid: true };
  }

  const appointmentDate = new Date(value);
  if (Number.isNaN(appointmentDate.getTime())) {
    return { valid: false, message: "Invalid next appointment date" };
  }

  appointmentDate.setHours(0, 0, 0, 0);
  if (appointmentDate < getStartOfToday()) {
    return { valid: false, message: "Next appointment cannot be in the past" };
  }

  return { valid: true };
};

export const getCheckups = async (req, res) => {
  try {
    const patientId = req.params.id;
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const patient = await Patient.findOne({
      _id: patientId,
      doctor: req.doctorId,
    });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    const checkups = await Checkup.find({
      patient: patientId,
      doctor: req.doctorId,
    }).sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Checkup.countDocuments({ patient: patientId, doctor: req.doctorId });
    res.status(200).json({ checkups, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCheckup = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid checkup ID" });
    }
    const checkup = await Checkup.findOne({ _id: id, doctor: req.doctorId });
    if (!checkup) {
      return res.status(404).json({ message: "Checkup not found" });
    }
    res.status(200).json({ checkup });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addCheckup = async (req, res) => {
  try {
    const { diseases, notes, prescription,payment } = req.body;
    const patientId = req.params.id;
    const patient = await Patient.findOne({
      _id: patientId,
      doctor: req.doctorId,
    });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    if (!prescription?.diagnosis) {
      return res.status(400).json({ message: "Diagnosis is required" });
    }
    if (!prescription?.medicines || prescription.medicines.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one medicine is required" });
    }
    const nextAppointmentValidation = validateNextAppointmentDate(prescription?.nextAppointment);
    if (!nextAppointmentValidation.valid) {
      return res.status(400).json({ message: nextAppointmentValidation.message });
    }
    if (payment?.amount === undefined || payment?.amount === null) {
      return res.status(400).json({ message: "Payment amount is required" });
    }
    if (!payment?.method) {
      return res.status(400).json({ message: "Payment method is required" });
    }
   
    const checkup = new Checkup({
      patient: patientId,
      doctor: req.doctorId,
      diseases,
      notes,
      prescription,
      payment,
    });
    await checkup.save();
    res.status(201).json({ message: "Checkup added successfully", checkup });
  } catch (error) {
    console.error("addCheckup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCheckup = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid checkup ID" });
    }
    const checkup = await Checkup.findOneAndDelete({
      _id: id,
      doctor: req.doctorId,
    });
    if (!checkup) {
      return res.status(404).json({ message: "Checkup not found" });
    }
    res.status(200).json({ message: "Checkup deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
export const updateCheckup = async (req, res) => {
  try {
    const { diseases, notes, prescription, payment } = req.body;
    const checkup = await Checkup.findOne({ _id: req.params.id, doctor: req.doctorId });
    if (!checkup) {
      return res.status(404).json({ message: "Checkup not found" });
    }
    if (diseases !== undefined) checkup.diseases = diseases;
    if (notes !== undefined) checkup.notes = notes;
    if (prescription !== undefined) {
      const nextAppointmentValidation = validateNextAppointmentDate(prescription.nextAppointment);
      if (!nextAppointmentValidation.valid) {
        return res.status(400).json({ message: nextAppointmentValidation.message });
      }

      // Merge prescription fields individually to ensure Mongoose tracks changes
      if (prescription.diagnosis !== undefined) checkup.prescription.diagnosis = prescription.diagnosis;
      if (prescription.nextAppointment !== undefined) checkup.prescription.nextAppointment = prescription.nextAppointment;
      if (prescription.medicines !== undefined) checkup.prescription.medicines = prescription.medicines;
      if (prescription.labTests !== undefined) checkup.prescription.labTests = prescription.labTests;
      if (prescription.pdfUrl !== undefined) checkup.prescription.pdfUrl = prescription.pdfUrl;
      checkup.markModified("prescription");
    }
    if (payment !== undefined) checkup.payment = payment;
    await checkup.save();
    res.status(200).json({ message: "Checkup updated successfully", checkup });
  } catch (error) {
    console.error("updateCheckup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};