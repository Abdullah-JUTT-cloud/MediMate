import mongoose from "mongoose";
import Checkup from "../models/checkup.model.js";
import Patient from "../models/patient.model.js";
import Appointment from "../models/appointment.model.js";
import Payment from "../models/payment.model.js";
import { Doctor } from "../models/doctor.model.js";
import { generatePrescriptionPdf } from "../utils/generatePrescriptionPdf.js";
import { uploadToR2, getFileUrl } from "../services/storage.service.js";
import { sendWhatsAppPdfDocument } from "../services/whatsapp.service.js";

const PAYMENT_METHODS = new Set(["Cash", "Card", "Online Transfer"]);
const MAX_PAYMENT_AMOUNT = 1000000;

const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const parsePagination = ({ page = 1, limit = 50 }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

const cleanText = (value, maxLength) =>
  String(value ?? "")
    .replace(/<script[\s\S]*?(?:<\/script>|$)/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const uniqueTextList = (items, maxItems, maxLength) => {
  if (!Array.isArray(items)) return [];

  const seen = new Set();
  const output = [];
  for (const item of items) {
    const value = cleanText(item, maxLength);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(value);
    if (output.length >= maxItems) break;
  }
  return output;
};

const validateNextAppointmentDate = (value) => {
  if (value === undefined || value === null || value === "") {
    return { valid: true, value: undefined };
  }

  const appointmentDate = new Date(value);
  if (Number.isNaN(appointmentDate.getTime())) {
    return { valid: false, message: "Invalid next appointment date" };
  }

  const comparisonDate = new Date(appointmentDate);
  comparisonDate.setHours(0, 0, 0, 0);
  if (comparisonDate < getStartOfToday()) {
    return { valid: false, message: "Next appointment cannot be in the past" };
  }

  return { valid: true, value: appointmentDate };
};

const normalizeDiseasesWithDiagnosis = (diseases, diagnosis) => {
  const unique = uniqueTextList(diseases, 25, 120);
  if (unique.length > 0) return unique;

  const diag = cleanText(diagnosis, 1000);
  return diag ? [diag.slice(0, 120)] : [];
};

const normalizeMedicines = (medicines) => {
  if (!Array.isArray(medicines)) {
    return { valid: false, message: "Medicines must be an array" };
  }

  if (medicines.length === 0 || medicines.length > 50) {
    return { valid: false, message: "Provide 1 to 50 medicines" };
  }

  const normalized = medicines.map((medicine) => ({
    name: cleanText(medicine?.name, 120),
    dosage: cleanText(medicine?.dosage, 80),
    frequency: cleanText(medicine?.frequency, 80),
    duration: cleanText(medicine?.duration, 80),
    instructions: cleanText(medicine?.instructions, 240),
  }));

  const hasInvalidRequiredField = normalized.some(
    (medicine) =>
      !medicine.name ||
      !medicine.dosage ||
      !medicine.frequency ||
      !medicine.duration,
  );

  if (hasInvalidRequiredField) {
    return { valid: false, message: "Medicine name, dosage, frequency, and duration are required" };
  }

  return { valid: true, value: normalized };
};

const normalizePdfUrl = (value) => {
  const url = cleanText(value, 1000);
  if (!url) return { valid: true, value: "" };

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return { valid: true, value: url };
  }

  try {
    const parsed = new URL(url);
    const allowedProtocols =
      process.env.NODE_ENV === "production"
        ? new Set(["https:"])
        : new Set(["http:", "https:"]);
    if (!allowedProtocols.has(parsed.protocol)) {
      return { valid: false, message: "Invalid prescription PDF URL" };
    }
    return { valid: true, value: parsed.toString() };
  } catch {
    return { valid: false, message: "Invalid prescription PDF URL" };
  }
};

const normalizePrescription = (prescription, { requireDiagnosis, requireMedicines }) => {
  if (!prescription || typeof prescription !== "object" || Array.isArray(prescription)) {
    return { valid: false, message: "Prescription payload is required" };
  }

  const output = {};

  if (prescription.diagnosis !== undefined || requireDiagnosis) {
    output.diagnosis = cleanText(prescription.diagnosis, 1000);
    if (requireDiagnosis && !output.diagnosis) {
      return { valid: false, message: "Diagnosis is required" };
    }
  }

  if (prescription.nextAppointment !== undefined) {
    const nextAppointmentValidation = validateNextAppointmentDate(
      prescription.nextAppointment,
    );
    if (!nextAppointmentValidation.valid) {
      return nextAppointmentValidation;
    }
    output.nextAppointment = nextAppointmentValidation.value;
  }

  if (prescription.medicines !== undefined || requireMedicines) {
    const medicinesValidation = normalizeMedicines(prescription.medicines);
    if (!medicinesValidation.valid) return medicinesValidation;
    output.medicines = medicinesValidation.value;
  }

  if (prescription.labTests !== undefined) {
    output.labTests = uniqueTextList(prescription.labTests, 50, 160);
  }

  if (prescription.patientAdvice !== undefined) {
    output.patientAdvice = cleanText(prescription.patientAdvice, 2000);
  }

  if (prescription.pdfUrl !== undefined) {
    const pdfUrlValidation = normalizePdfUrl(prescription.pdfUrl);
    if (!pdfUrlValidation.valid) return pdfUrlValidation;
    output.pdfUrl = pdfUrlValidation.value;
  }

  return { valid: true, value: output };
};

const normalizePayment = (payment, fallback = {}) => {
  if (payment === undefined || payment === null) {
    const fallbackAmount = Number(fallback.netAmount ?? fallback.amount ?? 0);
    const fallbackOriginal = Number(fallback.originalFee ?? fallbackAmount + (fallback.discountAmount ?? fallback.discount ?? 0));
    const fallbackDiscount = Number(fallback.discountAmount ?? fallback.discount ?? 0);

    return {
      valid: true,
      value: {
        amount: Math.max(0, Number(fallbackAmount || 0)),
        originalFee: Math.max(0, Number(fallbackOriginal || 0)),
        discount: Math.max(0, Number(fallbackDiscount || 0)),
        discountAmount: Math.max(0, Number(fallbackDiscount || 0)),
        netAmount: Math.max(0, Number(fallbackAmount || 0)),
        ancillaryFee: Number(fallback.ancillaryFee || 0),
        description: cleanText(fallback.description || "Consultation", 200),
        method: fallback.method || "Cash",
        isPaid: Boolean(fallback.isPaid),
      },
    };
  }

  if (typeof payment !== "object" || Array.isArray(payment)) {
    return { valid: false, message: "Invalid payment payload" };
  }

  const fallbackOriginal = Number(fallback.originalFee ?? fallback.amount ?? 0);
  const fallbackDiscount = Number(fallback.discountAmount ?? fallback.discount ?? 0);
  const fallbackNet = Number(fallback.netAmount ?? fallback.amount ?? 0);

  const rawAmount = Number(payment.amount ?? payment.netAmount ?? fallbackNet ?? 0);
  const rawOriginal = Number(payment.originalFee ?? payment.amount ?? fallbackOriginal ?? rawAmount + fallbackDiscount ?? 0);
  const rawDiscount = Number(payment.discountAmount ?? payment.discount ?? fallbackDiscount ?? 0);
  const rawNet = Number(payment.netAmount ?? Math.max(0, rawOriginal - rawDiscount) ?? rawAmount ?? 0);

  const amount = Number.isFinite(rawAmount) ? Math.max(0, rawAmount) : 0;
  const originalFee = Number.isFinite(rawOriginal) ? Math.max(0, rawOriginal) : 0;
  const discountAmount = Number.isFinite(rawDiscount) ? Math.max(0, rawDiscount) : 0;
  const netAmount = Number.isFinite(rawNet) ? Math.max(0, rawNet) : 0;

  if (amount < 0 || amount > MAX_PAYMENT_AMOUNT || originalFee < 0 || originalFee > MAX_PAYMENT_AMOUNT || discountAmount < 0 || discountAmount > MAX_PAYMENT_AMOUNT || netAmount < 0 || netAmount > MAX_PAYMENT_AMOUNT) {
    return { valid: false, message: "Payment amount is invalid" };
  }

  const description = cleanText(payment.description ?? fallback.description ?? "Consultation", 200);
  const method = cleanText(payment.method ?? fallback.method ?? "Cash", 40);
  if (!PAYMENT_METHODS.has(method)) {
    return { valid: false, message: "Payment method is invalid" };
  }

  const finalOriginalFee = originalFee > 0 ? originalFee : Math.max(0, amount + discountAmount);
  const finalDiscountAmount = discountAmount > 0 ? discountAmount : Math.max(0, finalOriginalFee - netAmount);
  const finalNetAmount = Math.max(0, netAmount || amount || Math.max(0, finalOriginalFee - finalDiscountAmount));

  return {
    valid: true,
    value: {
      amount: finalNetAmount,
      originalFee: finalOriginalFee,
      discount: finalDiscountAmount,
      discountAmount: finalDiscountAmount,
      netAmount: finalNetAmount,
      ancillaryFee: Number(payment.ancillaryFee ?? fallback.ancillaryFee ?? 0),
      description,
      method,
      isPaid:
        typeof payment.isPaid === "boolean"
          ? payment.isPaid
          : Boolean(fallback.isPaid),
    },
  };
};

const normalizeVisitedFacility = (facility) => {
  if (facility === undefined) return { valid: true, value: undefined };
  if (facility === null || facility === "") return { valid: true, value: null };
  if (typeof facility !== "object" || Array.isArray(facility)) {
    return { valid: false, message: "Invalid visited facility" };
  }

  const locationType = cleanText(facility.locationType, 20);
  if (!["Clinic", "Hospital"].includes(locationType)) {
    return { valid: false, message: "Invalid visited facility type" };
  }

  const locationName = cleanText(facility.locationName, 160);
  if (!locationName) {
    return { valid: false, message: "Visited facility name is required" };
  }

  return {
    valid: true,
    value: {
      locationType,
      locationName,
      locationAddress: cleanText(facility.locationAddress, 260),
    },
  };
};

const sendModelError = (res, error) => {
  if (error?.name === "ValidationError" || error?.name === "CastError") {
    return res.status(400).json({ message: "Invalid checkup payload" });
  }
  return res.status(500).json({ message: "Internal server error" });
};

export const getCheckups = async (req, res) => {
  try {
    const patientId = req.params.id;
    if (!mongoose.isValidObjectId(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    const { pageNum, limitNum, skip } = parsePagination(req.query);
    const patient = await Patient.exists({
      _id: patientId,
      doctor: req.doctorId,
    });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const filter = { patient: patientId, doctor: req.doctorId };
    const [checkups, total] = await Promise.all([
      Checkup.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Checkup.countDocuments(filter),
    ]);

    res.status(200).json({
      checkups,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("getCheckups error:", error);
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
    console.error("getCheckup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addCheckup = async (req, res) => {
  try {
    const patientId = req.params.id;
    if (!mongoose.isValidObjectId(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    const { diseases, notes, prescription, payment, visitedFacility } = req.body;
    const patient = await Patient.exists({
      _id: patientId,
      doctor: req.doctorId,
    });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const prescriptionValidation = normalizePrescription(prescription, {
      requireDiagnosis: true,
      requireMedicines: true,
    });
    if (!prescriptionValidation.valid) {
      return res.status(400).json({ message: prescriptionValidation.message });
    }

    const paymentValidation = normalizePayment(payment);
    if (!paymentValidation.valid) {
      return res.status(400).json({ message: paymentValidation.message });
    }

    const facilityValidation = normalizeVisitedFacility(visitedFacility);
    if (!facilityValidation.valid) {
      return res.status(400).json({ message: facilityValidation.message });
    }

    const normalizedDiseases = normalizeDiseasesWithDiagnosis(
      diseases,
      prescriptionValidation.value.diagnosis,
    );

    const checkup = new Checkup({
      patient: patientId,
      doctor: req.doctorId,
      diseases: normalizedDiseases,
      notes: cleanText(notes, 5000),
      prescription: prescriptionValidation.value,
      payment: paymentValidation.value,
      visitedFacility:
        facilityValidation.value === undefined ? null : facilityValidation.value,
    });

    await checkup.save();
    res.status(201).json({ message: "Checkup added successfully", checkup });
  } catch (error) {
    console.error("addCheckup error:", error);
    sendModelError(res, error);
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
    console.error("deleteCheckup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCheckup = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid checkup ID" });
    }

    const { diseases, notes, prescription, payment, visitedFacility } = req.body;
    const checkup = await Checkup.findOne({ _id: id, doctor: req.doctorId });
    if (!checkup) {
      return res.status(404).json({ message: "Checkup not found" });
    }

    if (diseases !== undefined) {
      checkup.diseases = uniqueTextList(diseases, 25, 120);
    }
    if (notes !== undefined) {
      checkup.notes = cleanText(notes, 5000);
    }

    const facilityValidation = normalizeVisitedFacility(visitedFacility);
    if (!facilityValidation.valid) {
      return res.status(400).json({ message: facilityValidation.message });
    }
    if (facilityValidation.value !== undefined) {
      checkup.visitedFacility = facilityValidation.value;
    }

    if (prescription !== undefined) {
      const prescriptionValidation = normalizePrescription(prescription, {
        requireDiagnosis: false,
        requireMedicines: false,
      });
      if (!prescriptionValidation.valid) {
        return res.status(400).json({ message: prescriptionValidation.message });
      }

      Object.assign(checkup.prescription, prescriptionValidation.value);
      checkup.markModified("prescription");
    }

    if (payment !== undefined) {
      const paymentValidation = normalizePayment(payment, checkup.payment);
      if (!paymentValidation.valid) {
        return res.status(400).json({ message: paymentValidation.message });
      }
      checkup.payment = paymentValidation.value;
      checkup.markModified("payment");
    }

    const effectiveDiagnosis =
      prescription?.diagnosis !== undefined
        ? checkup.prescription?.diagnosis
        : checkup.prescription?.diagnosis;
    const effectiveDiseases =
      diseases !== undefined ? checkup.diseases : checkup.diseases;
    checkup.diseases = normalizeDiseasesWithDiagnosis(
      effectiveDiseases,
      effectiveDiagnosis,
    );

    if (!cleanText(checkup.prescription?.diagnosis, 1000)) {
      return res.status(400).json({ message: "Diagnosis is required" });
    }
    if (!Array.isArray(checkup.prescription?.medicines) || checkup.prescription.medicines.length === 0) {
      return res.status(400).json({ message: "At least one medicine is required" });
    }

    await checkup.save();
    res.status(200).json({ message: "Checkup updated successfully", checkup });
  } catch (error) {
    console.error("updateCheckup error:", error);
    sendModelError(res, error);
  }
};

export const completeCheckup = async (req, res) => {
  try {
    const { appointmentId, patientId, diseases, notes, prescription, payment, labFee, visitedFacility } = req.body;

    if (!mongoose.isValidObjectId(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }
    if (!mongoose.isValidObjectId(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    const patientExists = await Patient.exists({ _id: patientId, doctor: req.doctorId });
    if (!patientExists) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const appointment = await Appointment.findOne({ _id: appointmentId, doctor: req.doctorId });
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const prescriptionValidation = normalizePrescription(prescription, {
      requireDiagnosis: true,
      requireMedicines: true,
    });
    if (!prescriptionValidation.valid) {
      return res.status(400).json({ message: prescriptionValidation.message });
    }

    const paymentValidation = normalizePayment(payment);
    if (!paymentValidation.valid) {
      return res.status(400).json({ message: paymentValidation.message });
    }

    const facilityValidation = normalizeVisitedFacility(visitedFacility);
    if (!facilityValidation.valid) {
      return res.status(400).json({ message: facilityValidation.message });
    }

    const normalizedDiseases = normalizeDiseasesWithDiagnosis(
      diseases,
      prescriptionValidation.value.diagnosis,
    );

    // Create Checkup document
    const checkup = new Checkup({
      patient: patientId,
      doctor: req.doctorId,
      diseases: normalizedDiseases,
      notes: cleanText(notes, 5000),
      prescription: prescriptionValidation.value,
      payment: paymentValidation.value,
      visitedFacility: facilityValidation.value === undefined ? null : facilityValidation.value,
    });

    await checkup.save();

    if (labFee && Number(labFee) > 0) {
      const serializedLabFee = Number(labFee);
      await Payment.create({
        patientId,
        appointmentId,
        doctorId: req.doctorId,
        category: 'LAB',
        status: 'REALIZED',
        amount: serializedLabFee,
        originalFee: serializedLabFee,
        discount: 0,
        discountAmount: 0,
        netAmount: serializedLabFee,
        ancillaryFee: serializedLabFee,
        method: paymentValidation.value.method || 'Cash',
        description: 'Lab / Test fee',
      });
    }

    const nextFollowUpDate = prescriptionValidation.value.nextAppointment;
    if (nextFollowUpDate) {
      const futureAppointment = new Appointment({
        doctor: req.doctorId,
        patient: patientId,
        date: new Date(nextFollowUpDate),
        slot: "Follow-up",
        type: "Follow-up",
        status: "Pending",
        queueStatus: "WAITING",
        isWalkIn: false,
        checkInTime: new Date(nextFollowUpDate),
        consultationFee: paymentValidation.value.netAmount || paymentValidation.value.amount || 0,
        originalFee: paymentValidation.value.originalFee || paymentValidation.value.amount || 0,
        discountAmount: paymentValidation.value.discountAmount || paymentValidation.value.discount || 0,
        netAmount: paymentValidation.value.netAmount || paymentValidation.value.amount || 0,
      });

      await futureAppointment.save();

      if (patientExists && paymentValidation.value.method) {
        try {
          const patient = await Patient.findById(patientId);
          if (patient?.phone) {
            const followUpMessage = `Dear ${patient.name || "Patient"},\n\nYour next follow-up has been scheduled for ${new Date(nextFollowUpDate).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}.\nPlease arrive on time.\n\nMedAlerto`;
            await import("../services/whatsapp.service.js").then(({ sendWhatsAppTextMessage }) => sendWhatsAppTextMessage(patient.phone, followUpMessage));
          }
        } catch (followUpError) {
          console.error("Follow-up WhatsApp dispatch failed:", followUpError);
        }
      }
    }

    // Render PDF and upload to Cloudflare R2, then dispatch to WhatsApp
    let publicPdfUrl = "";
    try {
      const checkupPopulated = await Checkup.findById(checkup._id)
        .populate("patient")
        .populate("doctor");

      const pdfBuffer = await generatePrescriptionPdf(
        checkupPopulated.doctor,
        checkupPopulated.patient,
        checkupPopulated
      );

      const fileObj = {
        buffer: pdfBuffer,
        originalname: `prescription_${checkup._id}.pdf`,
        mimetype: "application/pdf",
      };

      const { key } = await uploadToR2(fileObj, "prescriptions");

      checkup.prescription.pdfUrl = key;
      await checkup.save();

      publicPdfUrl = getFileUrl(key);

      if (checkupPopulated.patient?.phone) {
        const locations = Array.isArray(checkupPopulated.patient.locations) ? checkupPopulated.patient.locations : [];
        let facilityName = "";
        let facilityType = "";
        if (locations.length > 0) {
          const location = locations[0];
          facilityName = location.locationName || "";
          facilityType = location.locationType || "";
          if (facilityType === "Clinic" && !facilityName) {
            facilityName = checkupPopulated.doctor?.clinics?.[0]?.name || "";
          } else if (facilityType === "Hospital" && !facilityName) {
            facilityName = checkupPopulated.doctor?.hospitals?.[0]?.name || "";
          }
        }

        const facilityInfo = facilityName ? `\nFrom: ${facilityType} - ${facilityName}` : "";
        const patientName = checkupPopulated.patient.name || "Patient";
        const doctorName = checkupPopulated.doctor.fullName || "Doctor";
        const caption = `Dear ${patientName},\n\nYour prescription from Dr. ${doctorName} is ready.${facilityInfo}\n\nPlease find the PDF attached.\n\nGenerated by MedAlerto 🏥`;
        const fileName = `prescription_${patientName.replace(/\s+/g, "_")}.pdf`;

        await sendWhatsAppPdfDocument(
          checkupPopulated.patient.phone,
          publicPdfUrl,
          fileName,
          caption
        );
      }
    } catch (pdfError) {
      console.error("PDF Generation or WhatsApp dispatch failed:", pdfError);
    }

    // Update appointment queueStatus and status to COMPLETED
    appointment.queueStatus = 'COMPLETED';
    appointment.status = 'Completed';
    await appointment.save();

    // Flip consultation payment records to REALIZED upon consultation completion
    await Payment.updateMany(
      { appointmentId: appointment._id },
      { $set: { status: 'REALIZED' } }
    );

    res.status(201).json({
      message: "Checkup completed, secondary payments processed, and PDF prescription dispatched",
      checkup,
      pdfUrl: publicPdfUrl
    });
  } catch (error) {
    console.error("completeCheckup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
