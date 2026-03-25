import { generatePrescriptionPdf } from "../utils/generatePrescriptionPdf.js";
import Checkup from "../models/checkup.model.js";
import Patient from "../models/patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import cloudinary from "../config/cloudinary.js";
import { sendPrescriptionWhatsApp } from "../utils/whatsapp.js";

export const generatePrescription = async (req, res) => {
  try {
    const { checkupId } = req.params;
    const checkup = await Checkup.findOne({
      _id: checkupId,
      doctor: req.doctorId,
    });
    if (!checkup) {
      return res.status(404).json({ message: "Checkup not found" });
    }

    const patient = await Patient.findById(checkup.patient);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const doctor = await Doctor.findById(req.doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    const pdfBuffer = await generatePrescriptionPdf(doctor, patient, checkup);
    const base64 = pdfBuffer.toString("base64");
    res.status(200).json({ pdf: base64 });
  } catch (error) {
    console.error("[generatePrescription]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const savePrescription = async (req, res) => {
  try {
    const { checkupId } = req.params;
    const checkup = await Checkup.findOne({
      _id: checkupId,
      doctor: req.doctorId,
    });
    if (!checkup) {
      return res.status(404).json({ message: "Checkup not found" });
    }

    const patient = await Patient.findById(checkup.patient);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const doctor = await Doctor.findById(req.doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    const pdfBuffer = await generatePrescriptionPdf(doctor, patient, checkup);
   
    const uploadResult = await new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    { folder: "medimate/prescriptions", resource_type: "raw", format: "pdf" },
    (error, result) => { if (error) reject(error); else resolve(result); }
  );
  stream.end(pdfBuffer);
});
checkup.prescription.pdfUrl = uploadResult.secure_url;
await checkup.save();
return res.status(200).json({ message: "Prescription saved successfully", pdfUrl: uploadResult.secure_url });

  } catch (error) {
    console.error("[savePrescription]", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const downloadPrescription = async (req, res) => {
  try {
    const { checkupId } = req.params;
    const checkup = await Checkup.findOne({
      _id: checkupId,
      doctor: req.doctorId,
    });
    if (!checkup) {
      return res.status(404).json({ message: "Checkup not found" });
    }

    const patient = await Patient.findById(checkup.patient);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const doctor = await Doctor.findById(req.doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const pdfBuffer = await generatePrescriptionPdf(doctor, patient, checkup);
    const safePatientName = (patient.name || "patient")
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .trim()
      .replace(/\s+/g, "_") || "patient";
    const filename = `prescription_${safePatientName}_${new Date().toISOString().split("T")[0]}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("[downloadPrescription]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const sendWhatsApp=async(req,res)=>{
  try {
    const { checkupId } = req.params;
    const checkup = await Checkup.findOne({
      _id: checkupId,
      doctor: req.doctorId,
    });
    if (!checkup) {
      return res.status(404).json({ message: "Checkup not found" });
    }

    const patient = await Patient.findById(checkup.patient);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const doctor = await Doctor.findById(req.doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    const pdfBuffer = await generatePrescriptionPdf(doctor, patient, checkup);
    await sendPrescriptionWhatsApp(patient.phone, patient.name, pdfBuffer);
    return res.status(200).json({ message: "Prescription sent successfully" });
  } catch (error) {
    console.error("[sendWhatsApp]", error);
    res.status(500).json({ message: "Internal server error" });
  }
}