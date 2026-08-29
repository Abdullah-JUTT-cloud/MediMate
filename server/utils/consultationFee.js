/**
 * Shared consultation-fee math — the single source of truth for every fee write
 * (walk-in booking, online-booking approval, consultation save, Payments edit).
 *
 * Canonical field meanings:
 *   standardFee        the FULL price the doctor charges for the visit
 *                      (e.g. 2000). This is what the doctor types in.
 *   discountAmount     any concession taken off that price (e.g. 0).
 *   netAmount          max(0, standardFee - discountAmount) — the TOTAL the
 *                      visit costs (2000). Every ledger surface (Payment
 *                      record, Revenue Lab, Doctor Queue, billing log) records
 *                      THIS number.
 *   advanceAmountPaid  what the patient already paid online while booking
 *                      (e.g. 500). It is part of netAmount, never an extra
 *                      payment line and never a discount.
 *   balanceDue         max(0, netAmount - advanceAmountPaid) — the amount the
 *                      clinic still has to collect in person at the visit
 *                      (1500). Derived, never stored.
 *
 * Why the advance is NOT subtracted from netAmount: the advance was already
 * received, so subtracting it made the ledger understate the visit (a 2000
 * consultation logged as 1500, and the 500 online advance was never logged
 * anywhere). The number the doctor enters is the number the clinic bills; the
 * advance only changes how much cash is still owed at the desk, which is why it
 * is surfaced as `balanceDue` for the UI instead of being folded into the fee.
 */

/** Coerce any incoming value to a non-negative, finite fee amount. */
export const toFeeAmount = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return num;
};

/**
 * Computes the canonical fee breakdown.
 *
 * @param {{standardFee?: number, discountAmount?: number, advanceAmountPaid?: number}} input
 * @returns {{standardFee: number, discountAmount: number, netAmount: number, advanceAmountPaid: number, balanceDue: number}}
 */
export const computeConsultationFee = ({
  standardFee = 0,
  discountAmount = 0,
  advanceAmountPaid = 0,
} = {}) => {
  const rawStandardFee = toFeeAmount(standardFee);
  const rawDiscount = toFeeAmount(discountAmount);
  const rawAdvance = toFeeAmount(advanceAmountPaid);

  // A discount can never push the bill below zero, and an advance can never
  // create "negative cash due" — a fully covered visit simply owes 0.
  const netAmount = Math.max(0, rawStandardFee - rawDiscount);

  return {
    standardFee: rawStandardFee,
    discountAmount: rawDiscount,
    netAmount,
    advanceAmountPaid: rawAdvance,
    balanceDue: Math.max(0, netAmount - rawAdvance),
  };
};

/**
 * True when part of the fee was already collected online, so surfaces can
 * decide between "collect the balance at the desk" copy and a plain fee.
 */
export const hasAdvanceCollected = (value) => toFeeAmount(value) > 0;

export default computeConsultationFee;
