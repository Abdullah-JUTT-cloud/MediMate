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
    res
      .status(500)
      .json({ message: "Error generating prescription", error: error.message });
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

  }catch (error) { 
    res
      .status(500)
      .json({ message: "Error saving prescription", error: error.message }); 
  }
}


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
    res
      .status(500)
      .json({ message: "Error sending prescription", error: error.message });
  }
}