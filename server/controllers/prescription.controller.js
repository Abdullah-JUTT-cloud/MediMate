import { generatePrescriptionPdf } from "../utils/generatePrescriptionPdf.js";
import Checkup from "../models/checkup.model.js";
import { uploadToR2, deleteFromR2, getPresignedR2Url, getFileUrl } from "../services/storage.service.js";
import { sendWhatsAppPdfDocument } from "../services/whatsapp.service.js";

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

    // Support both inline viewing (default) and attachment download. The client
    // requests an attachment with `?download=true` and inline by omitting it, so
    // the same endpoint serves both:
    //   - /api/prescriptions/view/:checkupId     -> inline (opens in a new tab)
    //   - /api/prescriptions/download/:checkupId -> attachment (forces download)
    const disposition =
      req.query.download === "true" ? "attachment" : "inline";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${filename}"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);
    // Let the browser read Content-Disposition cross-origin so the client can
    // distinguish a view (inline) from a download (attachment).
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
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

    if (!checkup.patient?.phone) {
      return res.status(400).json({ message: "Patient phone number is missing" });
    }

    let pdfUrl = "";
    if (!checkup.prescription?.pdfUrl) {
      const pdfBuffer = await generatePrescriptionPdf(
        checkup.doctor,
        checkup.patient,
        checkup
      );
      const fileObj = {
        buffer: pdfBuffer,
        originalname: `prescription_${checkupId}.pdf`,
        mimetype: "application/pdf",
      };
      const { key, url } = await uploadToR2(fileObj, "prescriptions");
      checkup.prescription.pdfUrl = key;
      await checkup.save();
      pdfUrl = url;
    } else {
      pdfUrl = getFileUrl(checkup.prescription.pdfUrl);
    }

    // Resolve facility info
    const locations = Array.isArray(checkup.patient.locations) ? checkup.patient.locations : [];
    let facilityName = "";
    let facilityType = "";
    if (locations.length > 0) {
      const location = locations[0];
      facilityName = location.locationName || "";
      facilityType = location.locationType || "";
      if (facilityType === "Clinic" && !facilityName) {
        facilityName = checkup.doctor?.clinics?.[0]?.name || "";
      } else if (facilityType === "Hospital" && !facilityName) {
        facilityName = checkup.doctor?.hospitals?.[0]?.name || "";
      }
    }

    const facilityInfo = facilityName ? `\nFrom: ${facilityType} - ${facilityName}` : "";
    const patientName = checkup.patient.name || "Patient";
    const doctorName = checkup.doctor.fullName || "Doctor";
    const caption = `Dear ${patientName},\n\nYour prescription from Dr. ${doctorName} is ready.${facilityInfo}\n\nPlease find the PDF attached.\n\nGenerated by MedAlerto 🏥`;
    const fileName = `prescription_${patientName.replace(/\s+/g, "_")}.pdf`;

    await sendWhatsAppPdfDocument(
      checkup.patient.phone,
      pdfUrl,
      fileName,
      caption
    );

    return res.status(200).json({ message: "Prescription sent via WhatsApp successfully" });
  } catch (error) {
    console.error("[sendWhatsApp]", error);
    res
      .status(error.message.includes("not found") ? 404 : 500)
      .json({ message: error.message || "Internal server error" });
  }
};
