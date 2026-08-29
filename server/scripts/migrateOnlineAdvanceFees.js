/**
 * migrateOnlineAdvanceFees.js
 *
 * Audit + backfill for the online-advance fee rule:
 *
 *   The doctor's entered price is the FULL bill. An online advance the patient
 *   already paid is PART of that bill (and is stored separately as
 *   `advanceAmountPaid`) — it must never be subtracted from the ledger total.
 *
 * Before that rule was fixed, "pay at consultation" bookings that had paid an
 * online advance stored the REMAINDER as the fee: a Rs 2,000 consultation with
 * a Rs 500 advance was written as netAmount/consultationFee/Payment.amount =
 * 1,500, so Revenue Lab, the billing log and the revenue reports understated
 * the visit (and the 500 online advance was never logged at all).
 *
 * This script recomputes those historical rows with the shared formula
 * (utils/consultationFee.js):  total = max(0, standardFee - discountAmount).
 *
 * Usage:
 *   node scripts/migrateOnlineAdvanceFees.js            # dry-run report
 *   node scripts/migrateOnlineAdvanceFees.js --apply    # write the corrections
 *
 * Run via npm:
 *   cd server && npm run migrate:advance-fees
 *   cd server && npm run migrate:advance-fees:apply
 *
 * Safety:
 *  • Dry-run by default — nothing is written without --apply.
 *  • Only touches appointments that had a deferred fee AND a recorded online
 *    advance, and only when the ledger total is still the old remainder
 *    (i.e. the row is not already carrying `advanceAmountPaid`). Re-running is
 *    therefore a no-op.
 *  • Never touches the follow-up appointments derived from a visit, walk-in
 *    bookings without an advance, or charge-now approvals (those already stored
 *    the full price).
 */

import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../db/connectDB.js";
import Appointment from "../models/appointment.model.js";
import Checkup from "../models/checkup.model.js";
import Payment from "../models/payment.model.js";
import { computeConsultationFee } from "../utils/consultationFee.js";

const APPLY = process.argv.includes("--apply");

const money = (value) => `Rs ${Math.max(0, Number(value) || 0).toLocaleString()}`;

async function run() {
  await connectDB();

  // Deferred fee + a recorded online advance + a fee that was already resolved.
  const candidates = await Appointment.find({
    payAtConsultation: true,
    advanceAmountPaid: { $gt: 0 },
    standardFee: { $gt: 0 },
  })
    .select("doctor patient standardFee originalFee discountAmount netAmount consultationFee advanceAmountPaid status")
    .lean();

  console.log(
    `\n${APPLY ? "APPLYING" : "DRY RUN"} — ${candidates.length} deferred online visit(s) with an advance to check\n`,
  );

  let corrected = 0;
  let alreadyFine = 0;
  let ledgerSynced = 0;
  let checkupsSynced = 0;

  for (const appointment of candidates) {
    const expected = computeConsultationFee({
      standardFee: appointment.standardFee,
      discountAmount: appointment.discountAmount,
      advanceAmountPaid: appointment.advanceAmountPaid,
    });
    const storedTotal = Math.max(0, Number(appointment.netAmount) || 0);

    if (storedTotal === expected.netAmount) {
      alreadyFine += 1;
      continue;
    }

    console.log(
      [
        `appointment ${appointment._id}`,
        `price ${money(expected.standardFee)} − discount ${money(expected.discountAmount)}`,
        `advance ${money(expected.advanceAmountPaid)}`,
        `stored total ${money(storedTotal)} → expected ${money(expected.netAmount)}`,
        `cash to collect at the desk ${money(expected.balanceDue)}`,
      ].join("  |  "),
    );

    if (!APPLY) {
      corrected += 1;
      continue;
    }

    // 1) Appointment: the fee fields become the full bill (advance mirrored
    //    separately), keeping `consultationFee` as the legacy mirror.
    await Appointment.updateOne(
      { _id: appointment._id },
      {
        $set: {
          standardFee: expected.standardFee,
          originalFee: expected.standardFee,
          discountAmount: expected.discountAmount,
          netAmount: expected.netAmount,
          consultationFee: expected.netAmount,
          advanceAmountPaid: expected.advanceAmountPaid,
        },
      },
    );
    corrected += 1;

    // 2) Payment ledger row (Revenue Lab / Payments source of truth).
    const paymentResult = await Payment.updateOne(
      { appointmentId: appointment._id, category: "CONSULTATION" },
      {
        $set: {
          amount: expected.netAmount,
          standardFee: expected.standardFee,
          originalFee: expected.standardFee,
          discount: expected.discountAmount,
          discountAmount: expected.discountAmount,
          netAmount: expected.netAmount,
          advanceAmountPaid: expected.advanceAmountPaid,
        },
      },
    );
    if (paymentResult.matchedCount > 0) ledgerSynced += 1;

    // 3) Linked checkup payment subdocument (what Revenue Lab aggregates).
    const checkupResult = await Checkup.updateMany(
      { appointmentId: appointment._id },
      {
        $set: {
          "payment.amount": expected.netAmount,
          "payment.originalFee": expected.standardFee,
          "payment.discount": expected.discountAmount,
          "payment.discountAmount": expected.discountAmount,
          "payment.netAmount": expected.netAmount,
          "payment.advanceAmountPaid": expected.advanceAmountPaid,
        },
      },
    );
    checkupsSynced += checkupResult.modifiedCount || 0;
  }

  console.log(
    [
      "",
      "─".repeat(64),
      `needs correction ............ ${corrected}`,
      `already correct ............. ${alreadyFine}`,
      APPLY ? `Payment rows synced ......... ${ledgerSynced}` : "Payment rows synced ......... (dry run)",
      APPLY ? `Checkup rows synced ......... ${checkupsSynced}` : "Checkup rows synced ......... (dry run)",
      APPLY
        ? "\nDone. Revenue Lab / billing totals now include the online advance."
        : "\nNo changes written — re-run with --apply to correct these rows.",
    ].join("\n"),
  );

  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error("Migration failed:", error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
