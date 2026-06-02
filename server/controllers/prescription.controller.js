import { generatePrescriptionPdf } from "../utils/generatePrescriptionPdf.js";
import Checkup from "../models/checkup.model.js";
import Patient from "../models/patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import cloudinary from "../config/cloudinary.js";
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

    const MAX_PDF_SIZE = 5 * 1024 * 1024;
    if (pdfBuffer.length > MAX_PDF_SIZE) {
      return res.status(400).json({ message: "PDF too large (max 5MB)" });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "medimate/prescriptions",
          resource_type: "raw",
          format: "pdf",
          timeout: 60000,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(pdfBuffer);
    });

    if (!uploadResult.secure_url?.includes("cloudinary.com")) {
      throw new Error("Invalid upload response");
    }

    checkup.prescription.pdfUrl = uploadResult.secure_url;
    await checkup.save();
    return res.status(200).json({
      message: "Prescription saved successfully",
      pdfUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error("[savePrescription]", error);
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
  try {
    const { checkupId } = req.params;
    const checkup = await verifyCheckupOwnership(checkupId, req.doctorId);

    const pdfBuffer = await generatePrescriptionPdf(
      checkup.doctor,
      checkup.patient,
      checkup
    );
    const facilityName = checkup.visitedFacility?.locationName || "";
    const facilityType = checkup.visitedFacility?.locationType || "";
    await sendPrescriptionWhatsApp(
      checkup.patient.phone,
      checkup.patient.name,
      checkup.doctor.fullName,
      facilityName,
      facilityType,
      pdfBuffer
    );
    return res.status(200).json({ message: "Prescription sent successfully" });
  } catch (error) {
    console.error("[sendWhatsApp]", error);
    res
      .status(error.message.includes("not found") ? 404 : 500)
      .json({ message: error.message || "Internal server error" });
  }
};
