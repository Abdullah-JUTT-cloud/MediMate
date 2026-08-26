import PaymentProof from "../models/PaymentProof.js";
import { Doctor } from "../models/doctor.model.js";
import { uploadToR2 } from "../services/storage.service.js";

const DEFAULT_MONTHLY_AMOUNT = 2499;
const BILLING_DAYS = {
  monthly: 30,
  annual: 365,
};

export const submitPaymentProof = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "Payment receipt screenshot is required" });
    }

    const doctorName = String(req.body.doctorName || "").trim();
    const doctorEmail = String(req.body.doctorEmail || "").trim();
    const doctorPhone = String(req.body.doctorPhone || "").trim();
    const billingCycle = BILLING_DAYS[req.body.billingCycle] ? req.body.billingCycle : "monthly";
    const amountValue = Number(req.body.amount || DEFAULT_MONTHLY_AMOUNT);

    if (!doctorName || !doctorEmail || !doctorPhone) {
      return res.status(400).json({ message: "Doctor name, email, and phone number are required" });
    }

    const { url } = await uploadToR2(file, "receipts");

    let doctorId = req.doctorId || null;
    if (!doctorId && doctorEmail) {
      const doctor = await Doctor.findOne({ email: doctorEmail.toLowerCase() }).select("_id");
      doctorId = doctor?._id || null;
    }

    const paymentProof = await PaymentProof.create({
      doctorId,
      doctorName,
      doctorEmail,
      doctorPhone,
      amount: Number.isFinite(amountValue) ? amountValue : DEFAULT_MONTHLY_AMOUNT,
      billingCycle,
      screenshotUrl: url,
      status: "PENDING",
      rejectionReason: "",
    });

    if (doctorId) {
      await Doctor.findByIdAndUpdate(doctorId, {
        subscriptionStatus: "PENDING_VERIFICATION",
      });
    }

    return res.status(201).json({
      message: "Payment submitted! Your subscription will be activated upon admin verification within 2 hours.",
      paymentProof,
    });
  } catch (error) {
    console.error("[submitPaymentProof]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listPaymentProofs = async (_req, res) => {
  try {
    const proofs = await PaymentProof.find({})
      .sort({ createdAt: -1 })
      .populate("doctorId", "fullName email phone verificationStatus profilePicUrl profilePicture subscriptionStatus");

    return res.status(200).json({ proofs });
  } catch (error) {
    console.error("[listPaymentProofs]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const approvePaymentProof = async (req, res) => {
  try {
    const proof = await PaymentProof.findById(req.params.id);
    if (!proof) {
      return res.status(404).json({ message: "Payment proof not found" });
    }

    proof.status = "APPROVED";
    proof.rejectionReason = "";
    await proof.save();

    if (proof.doctorId) {
      const durationDays = BILLING_DAYS[proof.billingCycle] || BILLING_DAYS.monthly;
      await Doctor.findByIdAndUpdate(proof.doctorId, {
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      });
    }

    return res.status(200).json({
      message: "Payment approved successfully",
      proof,
    });
  } catch (error) {
    console.error("[approvePaymentProof]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectPaymentProof = async (req, res) => {
  try {
    const { reason } = req.body;
    const proof = await PaymentProof.findById(req.params.id);

    if (!proof) {
      return res.status(404).json({ message: "Payment proof not found" });
    }

    proof.status = "REJECTED";
    proof.rejectionReason = String(reason || "").trim() || "Payment proof did not match the required bank transfer details.";
    await proof.save();

    if (proof.doctorId) {
      await Doctor.findByIdAndUpdate(proof.doctorId, {
        subscriptionStatus: "BLOCKED",
      });
    }

    return res.status(200).json({
      message: "Payment rejected successfully",
      proof,
    });
  } catch (error) {
    console.error("[rejectPaymentProof]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
