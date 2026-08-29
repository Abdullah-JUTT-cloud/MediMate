/**
 * Client mirror of `server/utils/consultationFee.js`.
 *
 * The doctor ALWAYS enters the FULL price of the visit. The online advance the
 * patient already paid never reduces that number — it only says how much cash
 * is still to collect at the desk:
 *
 *   netAmount   = max(0, standardFee - discountAmount)   ← billed total
 *   balanceDue  = max(0, netAmount - advanceAmountPaid)   ← collect now
 *
 * Both the Online Approvals modal and the Consultation Workspace derive their
 * copy from this helper so the two fee-entry paths read and behave identically.
 * The server re-derives the same numbers; UI math is display-only.
 */

/** Coerce any input (usually a raw <input type="number"> value) to a fee. */
export const toFeeAmount = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return num;
};

/**
 * @param {{standardFee?: number|string, discountAmount?: number|string, advanceAmountPaid?: number|string}} input
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

  const netAmount = Math.max(0, rawStandardFee - rawDiscount);

  return {
    standardFee: rawStandardFee,
    discountAmount: rawDiscount,
    netAmount,
    advanceAmountPaid: rawAdvance,
    balanceDue: Math.max(0, netAmount - rawAdvance),
  };
};

/** "Rs. 1,500" — the shared money format used by the fee surfaces. */
export const formatPkr = (value) =>
  `Rs. ${Math.round(toFeeAmount(value)).toLocaleString()}`;

/**
 * The one-line instruction shown above a fee field: the advance is already in,
 * so the doctor must type the full price — not the remainder.
 */
export const buildFeeFieldHint = (advanceAmountPaid) =>
  toFeeAmount(advanceAmountPaid) > 0
    ? `${formatPkr(advanceAmountPaid)} is already paid by the patient online while booking. Enter the FULL price (fees) for this consultation in the field below — not the remaining balance.`
    : "Enter the FULL price (fees) for this consultation.";

/**
 * The line shown under the fee field, live as the doctor types.
 * Returns null when there is nothing to say (no advance paid).
 */
export const buildCollectNowNote = ({ standardFee, discountAmount, advanceAmountPaid }) => {
  const advance = toFeeAmount(advanceAmountPaid);
  if (advance <= 0) return null;

  const { netAmount, balanceDue } = computeConsultationFee({
    standardFee,
    discountAmount,
    advanceAmountPaid: advance,
  });

  if (!netAmount) {
    return { tone: "neutral", text: "Enter the full price to see what is left to collect." };
  }
  if (balanceDue > 0) {
    return {
      tone: "due",
      text: `Collect ${formatPkr(balanceDue)} more from the patient at this visit — the system adds the full ${formatPkr(netAmount)} to the ledger.`,
    };
  }
  return {
    tone: "covered",
    text: `Nothing more to collect — the ${formatPkr(advance)} advance already covers the ${formatPkr(netAmount)} fee.`,
  };
};

/**
 * Queue-row fee display: what the fee badge says for one appointment.
 *
 * The ledger amount is ALWAYS the full billed price, so an online advance never
 * shrinks the total — it is reported underneath as the cash still to take at
 * the desk. `balanceDue` is supplied by getTodayQueue (total − advance); the
 * subtraction here is only a fallback for cached/stale rows.
 *
 * Two states have no final price yet and must not be shown as "Rs 0 pending"
 * or as "covered": a deferred visit where the doctor sets the fee at the
 * consultation, and an online booking still awaiting approval (its stored fee
 * is only the advance placeholder the patient paid).
 *
 * @param {{billed?: number, advanceAmountPaid?: number, balanceDue?: number,
 *           payAtConsultation?: boolean, isSettled?: boolean,
 *           awaitingApproval?: boolean}} input
 * @returns {{billed: number, advance: number, collectNow: number,
 *             isUnpriced: boolean, isCovered: boolean,
 *             label: string, hint: string,
 *             tone: "slate" | "emerald" | "amber", hintTone: "slate" | "rose" | "emerald"}}
 */
export const resolveQueueFee = ({
  billed = 0,
  advanceAmountPaid = 0,
  balanceDue = 0,
  payAtConsultation = false,
  isSettled = false,
  awaitingApproval = false,
} = {}) => {
  const billedAmount = toFeeAmount(billed);
  const advance = toFeeAmount(advanceAmountPaid);
  const isDeferred = payAtConsultation === true;
  const pricePending = awaitingApproval === true || (isDeferred && billedAmount <= 0);
  // Only rows that actually carry an online advance get a "collect the rest"
  // readout — for a walk-in the badge has nothing to split, and stating
  // "collect the full amount" would guess how the patient pays.
  const rawCollectNow = toFeeAmount(balanceDue) > 0
    ? toFeeAmount(balanceDue)
    : Math.max(0, billedAmount - advance);
  const collectNow = advance > 0 && !pricePending ? rawCollectNow : 0;
  const isCovered = advance > 0 && !pricePending && billedAmount > 0 && collectNow === 0;

  let label = `${isSettled ? "Billed" : "Pending"} ${formatPkr(billedAmount)}`;
  let hint = "";
  if (awaitingApproval === true) {
    label = advance > 0 ? `Advance ${formatPkr(advance)} · price pending` : "Price on approval";
    hint = advance > 0 ? "The doctor sets the FULL price when approving this booking." : "";
  } else if (isDeferred && billedAmount <= 0) {
    label = "Price at consultation";
    hint = advance > 0
      ? `Rs. ${advance.toLocaleString()} advance paid online — the FULL price is entered at the consultation.`
      : "";
  } else if (collectNow > 0) {
    hint = `Rs. ${advance.toLocaleString()} paid online — collect Rs. ${collectNow.toLocaleString()} at this visit.`;
  } else if (isCovered) {
    hint = `Rs. ${advance.toLocaleString()} paid online — fully covered, nothing to collect.`;
  }

  // Anything unsettled is amber (the fee still needs the doctor's attention),
  // a settled one is emerald, and a row that has no price to talk about yet is
  // neutral slate — never a green "fully paid" or a red "collect 0".
  const tone = awaitingApproval === true
    ? "amber"
    : pricePending
      ? "slate"
      : isSettled || isCovered
        ? "emerald"
        : "amber";
  const hintTone = pricePending ? "slate" : collectNow > 0 ? "rose" : "emerald";

  return {
    billed: billedAmount,
    advance,
    collectNow,
    isUnpriced: pricePending,
    isCovered,
    label,
    hint,
    tone,
    hintTone,
  };
};
