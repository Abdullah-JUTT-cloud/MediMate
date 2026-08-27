import mongoose from "mongoose";
import Checkup from "../models/checkup.model.js";

const parseDateIfProvided = (value, endOfDay = false) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  if (endOfDay) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d;
};

export const getBillingLog = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = "all",
      startDate,
      endDate,
      search = "",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const from = parseDateIfProvided(startDate, false);
    const to = parseDateIfProvided(endDate, true);

    if (from === undefined || to === undefined) {
      return res.status(400).json({ message: "Invalid startDate or endDate" });
    }

    const baseQuery = { doctor: req.doctorId };

    if (status === "paid") baseQuery["payment.isPaid"] = true;
    if (status === "unpaid") baseQuery["payment.isPaid"] = false;

    if (from || to) {
      baseQuery.createdAt = {};
      if (from) baseQuery.createdAt.$gte = from;
      if (to) baseQuery.createdAt.$lte = to;
    }

    let checkups = await Checkup.find(baseQuery)
      .populate("patient", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select("patient payment createdAt");

    const lowerSearch = String(search || "").trim().toLowerCase();
    if (lowerSearch) {
      checkups = checkups.filter((c) =>
        String(c.patient?.name || "").toLowerCase().includes(lowerSearch)
      );
    }

    const total = await Checkup.countDocuments(baseQuery);

    res.status(200).json({
      billingLog: checkups.map((row) => ({
        id: row._id,
        patientName: row.patient?.name || "Unknown",
        fee: Number(row.payment?.amount || 0),
        isPaid: Boolean(row.payment?.isPaid),
        status: row.payment?.isPaid ? "Paid" : "Unpaid",
        method: row.payment?.method || "Cash",
        date: row.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("getBillingLog error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createExtraPayment = async (req, res) => {
  try {
    const { checkupId, amount, description, method } = req.body;

    if (!mongoose.isValidObjectId(checkupId)) {
      return res.status(400).json({ message: "Invalid checkup ID" });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: "Extra payment amount must be greater than zero" });
    }

    const checkup = await Checkup.findOne({ _id: checkupId, doctor: req.doctorId }).populate("patient", "name");
    if (!checkup) {
      return res.status(404).json({ message: "Checkup not found" });
    }

    const paymentDescription = String(description || "Laboratory Test").trim() || "Laboratory Test";
    const paymentMethod = ["Cash", "Card", "Online Transfer"].includes(method) ? method : "Cash";

    const consultationBase = Number(checkup.payment?.netAmount ?? checkup.payment?.amount ?? 0) - Number(checkup.payment?.ancillaryFee || 0);
    const nextAncillaryFee = Number(checkup.payment?.ancillaryFee || 0) + parsedAmount;
    const nextTotal = Math.max(0, consultationBase + nextAncillaryFee);

    checkup.payment = {
      ...(checkup.payment || {}),
      amount: nextTotal,
      netAmount: nextTotal,
      ancillaryFee: nextAncillaryFee,
      isPaid: true,
      method: paymentMethod,
      description: checkup.payment?.description || "Consultation",
    };
    await checkup.save();

    const paymentRecord = await import("../models/payment.model.js").then(({ default: PaymentModel }) =>
      PaymentModel.create({
        patientId: checkup.patient,
        appointmentId: undefined,
        doctorId: req.doctorId,
        category: "LAB",
        status: "REALIZED",
        amount: parsedAmount,
        originalFee: parsedAmount,
        discount: 0,
        discountAmount: 0,
        netAmount: parsedAmount,
        ancillaryFee: parsedAmount,
        description: paymentDescription,
        method: paymentMethod,
      }),
    );

    return res.status(201).json({
      message: "Extra payment recorded successfully",
      payment: paymentRecord,
      checkup,
    });
  } catch (error) {
    console.error("createExtraPayment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateBillingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid billing item ID" });
    }

    const { isPaid } = req.body;
    if (typeof isPaid !== "boolean") {
      return res.status(400).json({ message: "isPaid must be true or false" });
    }

    const checkup = await Checkup.findOne({ _id: id, doctor: req.doctorId }).populate("patient", "name");
    if (!checkup) {
      return res.status(404).json({ message: "Billing item not found" });
    }

    checkup.payment.isPaid = isPaid;
    checkup.markModified("payment");
    await checkup.save();

    return res.status(200).json({
      message: `Billing marked as ${isPaid ? "Paid" : "Unpaid"}`,
      billingItem: {
        id: checkup._id,
        patientName: checkup.patient?.name || "Unknown",
        fee: Number(checkup.payment?.amount || 0),
        isPaid: Boolean(checkup.payment?.isPaid),
        status: checkup.payment?.isPaid ? "Paid" : "Unpaid",
        method: checkup.payment?.method || "Cash",
        date: checkup.createdAt,
      },
    });
  } catch (error) {
    console.error("updateBillingStatus error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
