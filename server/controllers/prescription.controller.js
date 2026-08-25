import { generatePrescriptionPdf } from "../utils/generatePrescriptionPdf.js";
import Checkup from "../models/checkup.model.js";
import Patient from "../models/patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import { uploadToR2, deleteFromR2, getPresignedR2Url, getFileUrl } from "../services/storage.service.js";
import { sendPrescriptionWhatsApp } from "../utils/whatsapp.js";

const verifyCheckupOwnership = async (checkupId, doctorId) => {
  const checkup = await Checkup.findOne({
    _id: checkupId,
    doctor: doctorId,
  })
    .populate("patient")
    .populate("doctor");

  if (!checkup) throw new Error("Checkup not found or access denied");
  return checkup;
};

export const generatePrescription = async (req, res) => {
  try {
    const { checkupId } = req.params;
    const checkup = await verifyCheckupOwnership(checkupId, req.doctorId);

    const pdfBuffer = await generatePrescriptionPdf(
      checkup.doctor,
      checkup.patient,
      checkup
    );
    const base64 = pdfBuffer.toString("base64");
    res.status(200).json({ pdf: base64 });
  } catch (error) {
    console.error("[generatePrescription]", error);
    res
      .status(error.message.includes("not found") ? 404 : 500)
      .json({ message: error.message || "Internal server error" });
  }
};

export const savePrescription = async (req, res) => {
  try {
    const { checkupId } = req.params;
    const checkup = await verifyCheckupOwnership(checkupId, req.doctorId);

    const pdfBuffer = await generatePrescriptionPdf(
      checkup.doctor,
      checkup.patient,
      checkup
    );

    const MAX_PDF_SIZE = 10 * 1024 * 1024;
    if (pdfBuffer.length > MAX_PDF_SIZE) {
      return res.status(400).json({ message: "PDF too large (max 10MB)" });
    }

    if (checkup.prescription?.pdfUrl) {
      await deleteFromR2(checkup.prescription.pdfUrl);
    }

    const fileObj = {
      buffer: pdfBuffer,
      originalname: `prescription_${checkupId}.pdf`,
      mimetype: "application/pdf",
    };

    const { key, url } = await uploadToR2(fileObj, "prescriptions");

    checkup.prescription.pdfUrl = key;
    await checkup.save();

    return res.status(200).json({
      message: "Prescription saved successfully",
      pdfUrl: url,
      key,
    });
  } catch (error) {
    console.error("[savePrescription]", error);
    res
      .status(error.message.includes("not found") ? 404 : 500)
      .json({ message: error.message || "Internal server error" });
  }
};

export const getPrescriptionDownloadUrl = async (req, res) => {
  try {
    const { checkupId } = req.params;
    const checkup = await verifyCheckupOwnership(checkupId, req.doctorId);

    if (!checkup.prescription?.pdfUrl) {
      return res.status(404).json({ message: "Prescription PDF not saved" });
    }

    const presignedUrl = await getPresignedR2Url(checkup.prescription.pdfUrl, 3600);
    return res.status(200).json({ url: presignedUrl, key: checkup.prescription.pdfUrl });
  } catch (error) {
    console.error("[getPrescriptionDownloadUrl]", error);
    res
      .status(error.message.includes("not found") ? 404 : 500)
      .json({ message: error.message || "Internal server error" });
  }
};

export const downloadPrescription = async (req, res) => {
  try {
    const { checkupId } = req.params;
    const checkup = await verifyCheckupOwnership(checkupId, req.doctorId);

    const pdfBuffer = await generatePrescriptionPdf(
      checkup.doctor,
      checkup.patient,
      checkup
    );
    const safePatientName = (checkup.patient.name || "patient")
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .trim()
      .replace(/\s+/g, "_") || "patient";
    const filename = `prescription_${safePatientName}_${new Date()
      .toISOString()
      .split("T")[0]}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("[downloadPrescription]", error);
    res
      .status(error.message.includes("not found") ? 404 : 500)
      .json({ message: error.message || "Internal server error" });
  }
};


export const sendWhatsApp = async (req, res) => {
  return res.status(200).json({ message: "We are making / building it please wait" });
};
