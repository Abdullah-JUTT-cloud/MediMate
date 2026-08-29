import mongoose from "mongoose";
import Appointment from "../models/appointment.model.js";

// Immediate revenue recognition: count all appointment payments that were
// collected at creation (status PAID / REALIZED) — no COMPLETED filter.
export const getRealizedRevenue = async (req, res) => {
  try {
    const doctorId = req.doctorId;
    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID required" });
    }

    // Immediate recognition: sum netAmount (already computed ONCE by the
    // shared fee formula as standardFee - discountAmount) from created
    // appointments with a fee. No COMPLETED-status filter is applied.
    // IMPORTANT: do not re-subtract discountAmount from netAmount/consultationFee
    // here — that was the source of the double-discount bug (500 fee, 50
    // discount incorrectly showing as 100 PKR off instead of 50).
    // Equally important: do NOT subtract `advanceAmountPaid` either. netAmount
    // is the full billed price of the visit, advance included (the patient paid
    // part of it online and hands over the rest at the desk), so this total is
    // already the complete revenue for both charge-now approvals and
    // "pay at consultation" visits.
    const revenueAgg = await Appointment.aggregate([
      { $match: { doctor: new mongoose.Types.ObjectId(String(doctorId)), consultationFee: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalRealized: { $sum: { $toDouble: "$netAmount" } },
          totalDiscount: { $sum: { $toDouble: "$discountAmount" } },
          totalFee: { $sum: { $toDouble: { $ifNull: ["$standardFee", "$originalFee"] } } },
          count: { $sum: 1 },
        },
      },
    ]);

    const result = revenueAgg[0] || {
      totalRealized: 0,
      totalDiscount: 0,
      totalFee: 0,
      count: 0,
    };

    res.status(200).json({
      realizedRevenue: Number(result.totalRealized || 0),
      totalDiscount: Number(result.totalDiscount || 0),
      totalFee: Number(result.totalFee || 0),
      transactionCount: Number(result.count || 0),
    });
  } catch (error) {
    console.error("[getRealizedRevenue]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
