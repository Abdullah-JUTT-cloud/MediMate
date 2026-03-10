import Checkup from "../models/checkup.model.js";
import Patient from "../models/patient.model.js";

export const getCheckups = async (req, res) => {
  try {
    const patientId = req.params.id;
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
    }).sort({ createdAt: -1 });
    res.status(200).json({ checkups });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCheckup = async (req, res) => {
  try {
    const id = req.params.id;
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
    const { diseases, notes, prescription } = req.body;
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
    const checkup = new Checkup({
      patient: patientId,
      doctor: req.doctorId,
      diseases,
      notes,
      prescription,
    });
    await checkup.save();
    res.status(201).json({ message: "Checkup added successfully", checkup });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCheckup = async (req, res) => {
  try {
    const id = req.params.id;
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
