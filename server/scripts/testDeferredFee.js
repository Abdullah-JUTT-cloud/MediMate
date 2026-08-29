/**
 * Standalone verification for the "Pay at consultation" deferred-fee feature.
 *
 * Run with:  node scripts/testDeferredFee.js        (or: npm run test:deferred-fee)
 *
 * It imports the REAL controllers (appointment.controller.js,
 * checkup.controller.js) and drives them end-to-end, swapping the
 * Mongoose model/service modules for in-memory mocks via Node's module
 * hooks (node:module registerHooks) — the same pattern as
 * scripts/testApprovalController.js.
 *
 * Covered scenarios:
 *   A. approveOnlineBooking, toggle ON  → 200, fee block skipped (no doctor
 *      lookup), no Payment record, fee fields zeroed, advanceAmountPaid set
 *      from the BookingPaymentProof amount, WhatsApp without a price line.
 *   B. approveOnlineBooking, toggle OFF → unchanged: checkupPrice wins,
 *      Payment upserted, WhatsApp includes the Total Price line.
 *   C. createAppointment (walk-in), toggle ON  → 201, fee fields 0, no
 *      Payment record, payAtConsultation persisted.
 *   D. createAppointment (walk-in), toggle OFF → unchanged: Payment created
 *      with standardFee/discount/netAmount.
 *   E. completeCheckup, deferred walk-in (no advance) → fee finalized on the
 *      appointment, Payment CREATED (PAID) and flipped to REALIZED,
 *      checkup stores the fee + appointmentId.
 *   F. completeCheckup, deferred online (advance 500, fee 1000) → the visit is
 *      billed at the FULL 1000 (advance included, never subtracted), Payment
 *      amount/netAmount 1000 with advanceAmountPaid 500 so the desk can show
 *      "collect 500 more", advance NOT mislabelled as a discount, follow-up
 *      priced at the full fee.
 *   F2. completeCheckup, deferred online with a discount (fee 2000, discount
 *      200, advance 500) → bill 1800, collect 1300 — the doctor's entry is
 *      always the full price; only the cash-to-collect line moves.
 *   G. completeCheckup, deferred but fee missing/too-small → 400.
 *   H. completeCheckup, non-deferred (regression) → no new Payment created.
 *   I. updateCheckup (PUT /checkups/:id) — deferred checkup with NO Payment
 *      row yet → upsert CREATES it + appointment synced (Payments page can
 *      price a forgotten deferred checkup).
 *   J. updateCheckup — correction on an already-priced checkup → values
 *      overwritten, REALIZED status preserved, checkup.payment.amount is
 *      what Revenue Lab reads (the "1700 → 200 discount → 1500" flow).
 */
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import state, { resetState } from "./testDeferredFeeState.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// Mock module sources.
// ─────────────────────────────────────────────────────────────────────────────
const STATE_IMPORT = `import state from "../scripts/testDeferredFeeState.js";`;

const thenableSrc = `
const thenable = (doc) => ({
  populate: function () { return this; },
  select: function () { return this; },
  sort: function () { return this; },
  then: (res, rej) => Promise.resolve(doc).then(res, rej),
});
`;

const appointmentMock = `${STATE_IMPORT}
${thenableSrc}
class AppointmentMock {
  constructor(doc = {}) {
    Object.assign(this, doc);
    if (!this._id) this._id = "new-appt-" + (state.createdAppointments.length + 1);
  }
  async save() { state.createdAppointments.push(this); return this; }
  populate() { return Promise.resolve(this); }
  select() { return this; }
  sort() { return this; }
  static findOne() { return thenable(state.appointment); }
  static async countDocuments() { return state.standardCount; }
  static async updateOne(filter, update) {
    state.appointmentUpdates.push({ filter, update });
    return { matchedCount: 1, modifiedCount: 1 };
  }
  static async updateMany(filter, update) {
    state.appointmentUpdates.push({ filter, update });
    return { matchedCount: 1, modifiedCount: 1 };
  }
}
export default AppointmentMock;
`;

const patientMock = `${STATE_IMPORT}
export default {
  exists: async () => true,
  findById: async () => state.patient,
  findOne: async (query) => {
    // The clinic patient (state.patient) is a valid match target too —
    // createAppointment looks it up by { doctor, _id }.
    const pool = [...state.existingPatients, state.patient];
    return pool.find((p) =>
      Object.entries(query).every(([k, v]) => String(p[k]) === String(v))
    ) || null;
  },
  create: async (doc) => {
    const errors = {};
    if (doc.age === undefined || doc.age === null) errors.age = "Path \\\`age\\\` is required.";
    if (doc.gender === undefined || doc.gender === null) errors.gender = "Path \\\`gender\\\` is required.";
    if (Object.keys(errors).length > 0) {
      const err = new Error("Patient validation failed");
      err.name = "ValidationError";
      err.errors = errors;
      throw err;
    }
    const created = { _id: "patient-auto-created", ...doc };
    state.createdPatients.push(created);
    return created;
  },
};
`;

const doctorMock = `${STATE_IMPORT}
${thenableSrc}
export const Doctor = {
  findById: () => {
    state.doctorLookups += 1;
    return thenable(state.doctor);
  },
};
`;

const paymentMock = `${STATE_IMPORT}
export default {
  create: async (doc) => {
    state.createdPayments.push(doc);
    return { _id: "pay-" + state.createdPayments.length, ...doc };
  },
  findOneAndUpdate: async (query, update, options) => {
    state.paymentUpdates.push({ query, update, options });
    return { _id: "pay-mock", ...update };
  },
  findOne: async (query) =>
    query && query.category === "CONSULTATION" ? state.existingPayment : null,
  updateMany: async (filter, update) => {
    state.paymentUpdateMany.push({ filter, update });
    return { matchedCount: 1 };
  },
};
`;

const bookingProofMock = `${STATE_IMPORT}
${thenableSrc}
export default {
  findOne: () => {
    state.proofLookups += 1;
    return thenable(state.proof);
  },
  updateOne: async () => {
    state.proofUpdates += 1;
    return { matchedCount: 1 };
  },
};
`;

const checkupMock = `${STATE_IMPORT}
class CheckupMock {
  constructor(doc = {}) {
    Object.assign(this, doc);
    if (!this._id) this._id = "checkup-" + (state.savedCheckups.length + 1);
  }
  async save() { state.savedCheckups.push(this); return this; }
  markModified() {}
  static async findOne() { return state.checkupDoc; }
  static find() { return { sort: () => Promise.resolve([]) }; }
  static findById(id) {
    const found = state.savedCheckups.find((x) => String(x._id) === String(id)) || null;
    return {
      populate: function () { return this; },
      then: (res, rej) => Promise.resolve(found).then(res, rej),
    };
  }
}
export default CheckupMock;
`;

const reviewMock = `${STATE_IMPORT}
export default {
  generateToken: () => "review-token-123",
  create: async (doc) => { state.reviews.push(doc); return doc; },
};
`;

const patientAccountMock = `${STATE_IMPORT}
${thenableSrc}
export default {
  findById: () => thenable(state.patientAccount),
};
`;

const whatsappMock = `${STATE_IMPORT}
export const sendWhatsAppTextMessage = async (phone, message) => {
  state.whatsapp.push({ phone, message });
  return { ok: true };
};
export const sendWhatsAppPdfDocument = async (phone, url, fileName, caption) => {
  state.whatsappPdfs.push({ phone, url, fileName, caption });
  return { ok: true };
};
`;

const storageMock = `${STATE_IMPORT}
export const uploadToR2 = async (fileObj, folder) => ({ key: folder + "/mock.pdf" });
export const getFileUrl = (key) => "https://cdn.example.com/" + key;
`;

const pdfMock = `
export const generatePrescriptionPdf = async () => new Uint8Array([37, 80, 68, 70]);
`;

// Map: file-suffix (URL-anchored) → mock source.
const MOCKS = {
  "/models/appointment.model.js": appointmentMock,
  "/models/patient.model.js": patientMock,
  "/models/doctor.model.js": doctorMock,
  "/models/payment.model.js": paymentMock,
  "/models/bookingPaymentProof.model.js": bookingProofMock,
  "/models/checkup.model.js": checkupMock,
  "/models/review.model.js": reviewMock,
  "/models/patientAccount.model.js": patientAccountMock,
  "/services/whatsapp.service.js": whatsappMock,
  "/services/storage.service.js": storageMock,
  "/utils/generatePrescriptionPdf.js": pdfMock,
};

registerHooks({
  load(url, context, nextLoad) {
    for (const [suffix, source] of Object.entries(MOCKS)) {
      if (url.endsWith(suffix)) {
        return { format: "module", source, shortCircuit: true };
      }
    }
    return nextLoad(url, context);
  },
});

// Import the REAL controllers AFTER the hooks are registered.
const { approveOnlineBooking, createAppointment } = await import(
  "../controllers/appointment.controller.js"
);
const { completeCheckup, updateCheckup } = await import(
  "../controllers/checkup.controller.js"
);

// ─────────────────────────────────────────────────────────────────────────────
// Test harness
// ─────────────────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const assert = (condition, label) => {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${label}`);
  }
};

// Valid hex ObjectIds — completeCheckup validates the raw strings.
const APPT_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const DOCTOR_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
const PATIENT_ID = "cccccccccccccccccccccccc";

const makeReqRes = (body = {}, params = { id: APPT_ID }, doctorId = DOCTOR_ID) => {
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
  return { req: { doctorId, params, body }, res };
};

const onlineAppointment = (overrides = {}) => ({
  save: async function () { state.appointment = this; return this; },
  _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
  doctor: "bbbbbbbbbbbbbbbbbbbbbbbb",
  patient: null,
  patientAccount: {
    _id: "patientacc-0001",
    name: "Ahmed Khan",
    phone: "03001234567",
    email: "ahmed@example.com",
    dateOfBirth: new Date("1990-04-10"),
  },
  date: new Date("2026-09-10T00:00:00Z"),
  slot: "09:00",
  type: "Consultation",
  status: "Pending",
  queueStatus: "WAITING",
  awaitingOnlineApproval: true,
  advancePaid: false,
  // Seeded by the online booking flow with the doctor's advanceBookingFee:
  consultationFee: 500,
  standardFee: 500,
  originalFee: 500,
  discountAmount: 0,
  netAmount: 500,
  cancellationReason: null,
  rejectionReason: null,
  cancelledAt: null,
  ...overrides,
});

const walkInAppointment = (overrides = {}) => ({
  save: async function () { state.appointment = this; return this; },
  _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
  doctor: "bbbbbbbbbbbbbbbbbbbbbbbb",
  patient: { _id: "cccccccccccccccccccccccc" },
  patientAccount: null,
  date: new Date(),
  slot: "10:00 AM",
  type: "Consultation",
  status: "Confirmed",
  queueStatus: "WAITING",
  awaitingOnlineApproval: false,
  advancePaid: false,
  consultationFee: 0,
  standardFee: 0,
  originalFee: 0,
  discountAmount: 0,
  netAmount: 0,
  advanceAmountPaid: 0,
  ...overrides,
});

const prescription = {
  diagnosis: "Dental caries (molar 36)",
  medicines: [
    { name: "Panadol", dosage: "500mg", frequency: "1-0-1", duration: "3 Days", instructions: "After meals" },
  ],
  labTests: [],
  patientAdvice: "Rinse with salt water",
  nextAppointment: undefined,
};

// ─────────────────────────────────────────────────────────────────────────────
console.log("\nA — approveOnlineBooking, toggle ON (deferred)\n");
resetState();
{
  state.appointment = onlineAppointment();
  state.proof = { _id: "proof-1", appointmentId: "aaaaaaaaaaaaaaaaaaaaaaaa", amount: 500, status: "PENDING" };
  const { req, res } = makeReqRes({ payAtConsultation: true });
  await approveOnlineBooking(req, res);

  assert(res.statusCode === 200, `returns 200 with no checkupPrice — got ${res.statusCode}`);
  const a = state.appointment;
  assert(a.payAtConsultation === true, "appointment.payAtConsultation = true");
  assert(a.advanceAmountPaid === 500, `advanceAmountPaid captured from BookingPaymentProof (500) — got ${a.advanceAmountPaid}`);
  assert([a.consultationFee, a.standardFee, a.originalFee, a.discountAmount, a.netAmount].every((v) => Number(v) === 0),
    "all fee fields zeroed (stale booking-fee 500 cleared)");
  assert(a.status === "Confirmed", "status → Confirmed");
  assert(a.queueStatus === "WAITING", "queueStatus → WAITING (enters Doctor Queue)");
  assert(a.awaitingOnlineApproval === false, "awaitingOnlineApproval cleared");
  assert(a.advancePaid === true, "advancePaid still true (advance WAS paid, just not the final fee)");
  assert(state.doctorLookups === 0, "fee-resolution block skipped (no doctor fee lookup)");
  assert(state.proofLookups === 1, "BookingPaymentProof looked up for the advance amount");
  assert(state.paymentUpdates.length === 0, "NO Payment record created/upserted");
  assert(state.proofUpdates === 1, "BookingPaymentProof marked APPROVED");
  assert(state.createdPatients.length === 1, "clinic Patient still auto-created");
  const msg = state.whatsapp[0]?.message || "";
  assert(msg.includes("confirmed"), "WhatsApp confirmation still sent");
  assert(!msg.includes("Total Price"), "WhatsApp has NO Total Price line");
}

console.log("\nB — approveOnlineBooking, toggle OFF (regression)\n");
resetState();
{
  state.appointment = onlineAppointment({ consultationFee: 800, standardFee: 800, originalFee: 800, netAmount: 800 });
  state.proof = { _id: "proof-2", amount: 500, status: "PENDING" };
  const { req, res } = makeReqRes({ checkupPrice: 1500 });
  await approveOnlineBooking(req, res);

  assert(res.statusCode === 200, `returns 200 — got ${res.statusCode}`);
  const a = state.appointment;
  assert(a.payAtConsultation !== true, "payAtConsultation not set");
  assert(a.standardFee === 1500 && a.netAmount === 1500, `checkupPrice wins (1500) — std ${a.standardFee}, net ${a.netAmount}`);
  assert(state.doctorLookups === 1, "fee-resolution path still runs (doctor lookup)");
  assert(state.paymentUpdates.length === 1, "Payment upsert still happens");
  assert(state.paymentUpdates[0].update.amount === 1500, "Payment amount = 1500 (full price, advance NOT subtracted)");
  assert(state.paymentUpdates[0].options?.upsert === true, "upsert pattern preserved");
  // The online advance is mirrored onto the appointment in the charge-now
  // branch too, so the queue/workspace can report what is left to collect.
  assert(a.advanceAmountPaid === 500, `advanceAmountPaid mirrored from the proof (500) — got ${a.advanceAmountPaid}`);
  assert(a.netAmount - a.advanceAmountPaid === 1000, "1,000 of the 1,500 bill is still to collect at the desk");
  assert(state.paymentUpdates[0].update.advanceAmountPaid === 500, "Payment row carries the advance split");
  assert(state.paymentUpdates[0].update.discountAmount === 0, "advance never stored as a discount");
  assert(String(state.paymentUpdates[0].update.description || "").includes("Rs 1,000 to collect at visit"),
    `ledger description states the cash owed — "${state.paymentUpdates[0].update.description}"`);
  const msg = state.whatsapp[0]?.message || "";
  assert(msg.includes("Total Price: Rs 1,500"), `WhatsApp includes Total Price line — "${msg.split("\n").find((l) => l.includes("Total")) || "missing"}"`);
  assert(msg.includes("Balance To Pay At Clinic: Rs 1,000"), "WhatsApp states the balance due at the clinic");
}

console.log("\nC — createAppointment (walk-in), toggle ON (deferred)\n");
resetState();
{
  state.standardCount = 0;
  const { req, res } = makeReqRes({
    patientId: "cccccccccccccccccccccccc",
    date: new Date().toISOString().slice(0, 10),
    slot: "10:00 AM",
    type: "Consultation",
    isWalkIn: true,
    payAtConsultation: true,
    standardFee: 0,
    amount: 0,
    discount: 0,
    paymentMethod: "Cash",
  });
  await createAppointment(req, res);

  assert(res.statusCode === 201, `returns 201 with no fee entered — got ${res.statusCode}`);
  const a = state.createdAppointments[0];
  assert(a && a.payAtConsultation === true, "appointment.payAtConsultation persisted");
  assert(a && [a.standardFee, a.discountAmount, a.netAmount, a.consultationFee].every((v) => Number(v) === 0),
    "fee fields at schema defaults (0)");
  assert(state.createdPayments.length === 0, "NO Payment record created");
}

console.log("\nD — createAppointment (walk-in), toggle OFF (regression)\n");
resetState();
{
  state.standardCount = 0;
  const { req, res } = makeReqRes({
    patientId: "cccccccccccccccccccccccc",
    date: new Date().toISOString().slice(0, 10),
    slot: "10:00 AM",
    type: "Consultation",
    isWalkIn: true,
    standardFee: 1000,
    amount: 1000,
    discount: 200,
    paymentMethod: "Cash",
  });
  await createAppointment(req, res);

  assert(res.statusCode === 201, `returns 201 — got ${res.statusCode}`);
  const a = state.createdAppointments[0];
  assert(a && a.payAtConsultation === false, "payAtConsultation false by default");
  assert(a && a.standardFee === 1000 && a.discountAmount === 200 && a.netAmount === 800,
    `netAmount = 1000 - 200 = 800 — got ${a && a.netAmount}`);
  assert(state.createdPayments.length === 1, "Payment record still created upfront");
  const p = state.createdPayments[0];
  assert(p && p.amount === 800 && p.standardFee === 1000 && p.discountAmount === 200 && p.status === "PAID",
    "Payment shape unchanged (amount 800, std 1000, disc 200, PAID)");
}

const completeBody = (feeNum, discountNum, extras = {}) => ({
  appointmentId: "aaaaaaaaaaaaaaaaaaaaaaaa",
  patientId: "cccccccccccccccccccccccc",
  diseases: ["Tooth pain"],
  notes: "Exam notes",
  prescription: { ...prescription, ...extras.prescription },
  payment: {
    amount: Math.max(0, feeNum - discountNum),
    originalFee: feeNum,
    standardFee: feeNum,
    discountAmount: discountNum,
    discount: discountNum,
    netAmount: Math.max(0, feeNum - discountNum),
    ancillaryFee: 0,
    description: "Consultation & Prescription",
    method: "Cash",
    isPaid: true,
  },
  labFee: 0,
  ...extras.body,
});

console.log("\nE — completeCheckup, deferred walk-in (advance 0, fee 1000)\n");
resetState();
{
  state.appointment = walkInAppointment({ payAtConsultation: true, advanceAmountPaid: 0 });
  const { req, res } = makeReqRes(completeBody(1000, 0));
  await completeCheckup(req, res);

  assert(res.statusCode === 201, `returns 201 — got ${res.statusCode} ${JSON.stringify(res.body)}`);
  const a = state.appointment;
  assert(a.standardFee === 1000 && a.originalFee === 1000, "appointment.standardFee/originalFee = 1000");
  assert(a.discountAmount === 0, "appointment.discountAmount = 0");
  assert(a.netAmount === 1000 && a.consultationFee === 1000, `netAmount = 1000 - 0 - 0 = 1000 — got ${a.netAmount}`);
  assert(a.status === "Completed" && a.queueStatus === "COMPLETED", "appointment still completed");
  assert(state.createdPayments.length === 1, "Payment record CREATED at consultation save");
  const p = state.createdPayments[0];
  assert(p && p.category === "CONSULTATION" && p.status === "PAID" && p.amount === 1000 && p.standardFee === 1000 && p.netAmount === 1000,
    "Payment shape: CONSULTATION/PAID, amount=standardFee=netAmount=1000");
  const flipped = state.paymentUpdateMany.some((u) => u.update?.$set?.status === "REALIZED");
  assert(flipped, "new Payment flipped to REALIZED on completion");
  const c = state.savedCheckups[0];
  assert(c && String(c.appointmentId) === "aaaaaaaaaaaaaaaaaaaaaaaa", "checkup stores appointmentId");
  assert(c && c.payment.amount === 1000 && c.payment.netAmount === 1000 && c.payment.originalFee === 1000 && c.payment.discountAmount === 0,
    "checkup.payment subdocument carries the finalized fee (Revenue Lab source)");
}

console.log("\nF — completeCheckup, deferred online (advance 500, fee 1000)\n");
resetState();
{
  state.appointment = walkInAppointment({
    payAtConsultation: true,
    advanceAmountPaid: 500,
    patientAccount: { _id: "patientacc-0001" },
  });
  state.patientAccount = { _id: "patientacc-0001", name: "Ahmed Khan", phone: "03001234567" };
  const { req, res } = makeReqRes(
    completeBody(1000, 0, {
      prescription: { nextAppointment: "2026-09-15" },
    }),
  );
  await completeCheckup(req, res);

  assert(res.statusCode === 201, `returns 201 — got ${res.statusCode} ${JSON.stringify(res.body)}`);
  const a = state.appointment;
  assert(a.netAmount === 1000, `netAmount = the FULL 1000 bill (advance is part of it, not a deduction) — got ${a.netAmount}`);
  assert(a.consultationFee === 1000, `consultationFee mirrors the total (1000) — got ${a.consultationFee}`);
  assert(a.standardFee === 1000 && a.discountAmount === 0, "standardFee 1000 / discount 0 stored");
  assert(a.advanceAmountPaid === 500, "advance still recorded separately on the appointment (500)");
  assert(state.createdPayments.length === 1, "Payment record created");
  const p = state.createdPayments[0];
  assert(p && p.amount === 1000, `Payment.amount = 1000 (total billed — 500 online + 500 at the desk) — got ${p && p.amount}`);
  assert(p && p.standardFee === 1000 && p.netAmount === 1000, "Payment standardFee 1000 / netAmount 1000");
  assert(p && p.advanceAmountPaid === 500, `Payment.advanceAmountPaid = 500 → collect 1000 - 500 = 500 more`);
  assert(p && p.method === "Cash", `cash balance still owed → entered method kept (Cash) — got ${p && p.method}`);
  const c = state.savedCheckups[0];
  assert(c && c.payment.discountAmount === 0 && c.payment.discount === 0,
    "online advance NOT mislabelled as a discount in checkup.payment");
  assert(c && c.payment.amount === 1000 && c.payment.originalFee === 1000, "checkup.payment: amount 1000 / originalFee 1000 (what Revenue Lab reads)");
  assert(c && c.payment.advanceAmountPaid === 500, "checkup.payment carries the advance split");
  // Follow-up visit must be priced at the FULL fee — the online advance
  // belongs to this visit, not the future one. (The follow-up Appointment
  // doc carries originalFee, not standardFee — same shape as before this
  // feature, only the values differ for deferred visits.)
  const followUp = state.createdAppointments.find((x) => x.type === "Follow-up");
  assert(followUp, "follow-up appointment still scheduled");
  assert(followUp && followUp.originalFee === 1000 && followUp.netAmount === 1000 && followUp.consultationFee === 1000 && followUp.discountAmount === 0,
    `follow-up priced at full fee 1000 (not the 500 balance) — got std ${followUp && followUp.originalFee} / net ${followUp && followUp.netAmount}`);
  assert(state.reviews.length === 1, "review invite path unaffected");
}

console.log("\nF2 — completeCheckup, deferred online WITH discount (fee 2000, disc 200, advance 500)\n");
resetState();
{
  state.appointment = walkInAppointment({
    payAtConsultation: true,
    advanceAmountPaid: 500,
    patientAccount: { _id: "patientacc-0001" },
  });
  const { req, res } = makeReqRes(completeBody(2000, 200));
  await completeCheckup(req, res);

  assert(res.statusCode === 201, `returns 201 — got ${res.statusCode} ${JSON.stringify(res.body)}`);
  const a = state.appointment;
  assert(a.standardFee === 2000, "doctor's full price stored as standardFee (2000)");
  assert(a.discountAmount === 200, "discount stored (200)");
  assert(a.netAmount === 1800 && a.consultationFee === 1800,
    `billed total = 2000 - 200 = 1800 (advance NOT subtracted) — got ${a.netAmount}`);
  assert(a.advanceAmountPaid === 500, "advance untouched by the discount math (500)");
  const p = state.createdPayments[0];
  assert(p && p.amount === 1800 && p.netAmount === 1800, "Payment row = 1800 total → Revenue Lab");
  assert(p && p.advanceAmountPaid === 500, "Payment row keeps the 500 advance → 1300 to collect at the desk");
  const c = state.savedCheckups[0];
  assert(c && c.payment.amount === 1800 && c.payment.originalFee === 2000 && c.payment.discountAmount === 200,
    "checkup.payment: 1800 net of discount, 2000 gross, discount 200");
}

console.log("\nG — completeCheckup, deferred but fee missing / invalid → 400\n");
resetState();
{
  // Fee entirely missing (no payment payload) → hard 400.
  state.appointment = walkInAppointment({ payAtConsultation: true, advanceAmountPaid: 0 });
  const bodyNoPayment = completeBody(1000, 0);
  delete bodyNoPayment.payment;
  const { req: r1, res: res1 } = makeReqRes(bodyNoPayment);
  await completeCheckup(r1, res1);
  assert(res1.statusCode === 400, `missing fee → 400 — got ${res1.statusCode}`);
  assert(String(res1.body?.message || "").includes("fee is required"), "descriptive message");

  // Negative fee → 400.
  resetState();
  state.appointment = walkInAppointment({ payAtConsultation: true, advanceAmountPaid: 0 });
  const { req: rNeg, res: resNeg } = makeReqRes(
    completeBody(-50, 0, { body: { payment: { amount: 0, originalFee: -50, standardFee: -50, discountAmount: 0, netAmount: 0, method: "Cash", isPaid: true } } }),
  );
  await completeCheckup(rNeg, resNeg);
  assert(resNeg.statusCode === 400, `negative fee → 400 — got ${resNeg.statusCode}`);

  // Discount larger than the fee → 400.
  resetState();
  state.appointment = walkInAppointment({ payAtConsultation: true, advanceAmountPaid: 0 });
  const { req: r2, res: res2 } = makeReqRes(completeBody(500, 700));
  await completeCheckup(r2, res2);
  assert(res2.statusCode === 400, `discount > fee → 400 — got ${res2.statusCode}`);
  assert(state.createdPayments.length === 0, "no Payment created on rejected save");

  // NOTE: an explicit 0 fee is a valid "free consultation" (same as the
  // charge-now path, where a 0 fee is allowed); the UI requires a non-empty
  // value so an accidental empty input never reaches this point.
}

console.log("\nH — completeCheckup, non-deferred (regression)\n");
resetState();
{
  state.appointment = walkInAppointment({
    payAtConsultation: false,
    consultationFee: 1500,
    standardFee: 1700,
    originalFee: 1700,
    discountAmount: 200,
    netAmount: 1500,
  });
  const { req, res } = makeReqRes(completeBody(1700, 200));
  await completeCheckup(req, res);

  assert(res.statusCode === 201, `returns 201 — got ${res.statusCode} ${JSON.stringify(res.body)}`);
  assert(state.createdPayments.length === 0, "no NEW Payment record (created at booking)");
  const c = state.savedCheckups[0];
  assert(c && c.payment.originalFee === 1700 && c.payment.discountAmount === 200 && c.payment.netAmount === 1500 && c.payment.amount === 1500,
    "checkup.payment unchanged behavior (1700/200/1500)");
  assert(c && String(c.appointmentId) === "aaaaaaaaaaaaaaaaaaaaaaaa", "checkup stores appointmentId (non-deferred too)");
  const a = state.appointment;
  assert(a.standardFee === 1700 && a.netAmount === 1500, "appointment fee fields untouched by completion");
  const flipped = state.paymentUpdateMany.some((u) => u.update?.$set?.status === "REALIZED");
  assert(flipped, "existing Payment flipped to REALIZED as before");
}

const checkupDoc = (overrides = {}) => ({
  _id: "c11111111111111111111111",
  doctor: "bbbbbbbbbbbbbbbbbbbbbbbb",
  patient: "cccccccccccccccccccccccc",
  appointmentId: "aaaaaaaaaaaaaaaaaaaaaaaa",
  diseases: ["Tooth pain"],
  notes: "Exam notes",
  prescription: {
    diagnosis: "Dental caries",
    medicines: [
      { name: "Panadol", dosage: "500mg", frequency: "1-0-1", duration: "3 Days" },
    ],
  },
  payment: {
    amount: 0,
    originalFee: 0,
    discount: 0,
    discountAmount: 0,
    netAmount: 0,
    ancillaryFee: 0,
    description: "Consultation",
    method: "Cash",
    isPaid: false,
  },
  save: async function () { return this; },
  markModified: () => {},
  ...overrides,
});

console.log("\nI — updateCheckup (Payments page), deferred checkup, NO Payment row yet\n");
resetState();
{
  // Edge case: doctor forgot to price the deferred visit → no Payment exists.
  state.checkupDoc = checkupDoc({
    payment: { amount: 0, originalFee: 0, discount: 0, discountAmount: 0, netAmount: 0, ancillaryFee: 0, description: "Consultation", method: "Cash", isPaid: false },
  });
  state.existingPayment = null;
  const { req, res } = makeReqRes({ payment: { amount: 1000, method: "Cash", isPaid: true } });
  await updateCheckup(req, res);

  assert(res.statusCode === 200, `returns 200 — got ${res.statusCode} ${JSON.stringify(res.body)}`);
  assert(state.paymentUpdates.length === 1, "Payment upsert attempted");
  const u = state.paymentUpdates[0];
  assert(u.options?.upsert === true, "uses upsert: true (create if missing)");
  assert(u.query.appointmentId && u.query.category === "CONSULTATION", "keyed on appointmentId + category");
  assert(u.update.amount === 1000 && u.update.standardFee === 1000 && u.update.netAmount === 1000, "payment row gets amount/standardFee/netAmount = 1000");
  assert(u.update.status === "PAID", "status PAID (isPaid on, no prior row)");
  assert(state.appointmentUpdates.length === 1, "linked appointment synced");
  const s = state.appointmentUpdates[0].update.$set;
  assert(s.standardFee === 1000 && s.netAmount === 1000 && s.consultationFee === 1000, "appointment fee fields = latest write");
  assert(state.checkupDoc.payment.amount === 1000, "checkup.payment.amount = 1000 (what Revenue Lab reads)");
}

console.log("\nJ — updateCheckup (Payments page), correction on priced checkup (1700 → 200 disc → edit 1500)\n");
resetState();
{
  // Consultation already saved: 1700 fee, 200 discount, 1500 net, REALIZED.
  state.checkupDoc = checkupDoc({
    payment: { amount: 1500, originalFee: 1700, discount: 200, discountAmount: 200, netAmount: 1500, ancillaryFee: 0, description: "Consultation & Prescription", method: "Cash", isPaid: true },
  });
  state.existingPayment = { _id: "pay-1", status: "REALIZED" };
  // Payments page sends: { payment: { amount, method, isPaid } }
  const { req, res } = makeReqRes({ payment: { amount: 1500, method: "Cash", isPaid: true } });
  await updateCheckup(req, res);

  assert(res.statusCode === 200, `returns 200 — got ${res.statusCode} ${JSON.stringify(res.body)}`);
  const u = state.paymentUpdates[0];
  assert(state.paymentUpdates.length === 1 && u.options?.upsert === true, "upsert on the existing row (overwrite, not duplicate)");
  assert(u.update.status === "REALIZED", "REALIZED status preserved after correction");
  assert(state.checkupDoc.payment.amount === 1500 && state.checkupDoc.payment.netAmount === 1500,
    "entered 1500 lands in checkup.payment.amount/netAmount → 1500 is what hits Revenue Lab (stale discount not re-subtracted)");
  assert(state.checkupDoc.payment.originalFee === 1700 && state.checkupDoc.payment.discountAmount === 200,
    "fee split re-derived consistently (1700 − 200 = 1500)");
  assert(u.update.amount === 1500 && u.update.standardFee === 1700 && u.update.netAmount === 1500,
    "Payment row mirrors the corrected fee (amount 1500 / standardFee 1700)");
  const s = state.appointmentUpdates[0]?.update?.$set;
  assert(s && s.netAmount === state.checkupDoc.payment.netAmount && s.standardFee === state.checkupDoc.payment.originalFee,
    "appointment mirrors the latest checkup write");

  // And unchecking "paid" flips the ledger row back to PENDING.
  resetState();
  state.checkupDoc = checkupDoc({
    payment: { amount: 1500, originalFee: 1500, discount: 0, discountAmount: 0, netAmount: 1500, ancillaryFee: 0, description: "Consultation", method: "Cash", isPaid: true },
  });
  state.existingPayment = { _id: "pay-2", status: "PAID" };
  const { req: r2, res: res2 } = makeReqRes({ payment: { amount: 1500, method: "Cash", isPaid: false } });
  await updateCheckup(r2, res2);
  assert(res2.statusCode === 200, `unpaid edit returns 200 — got ${res2.statusCode}`);
  assert(state.paymentUpdates[0].update.status === "PENDING", "status → PENDING when marked unpaid");

  // Standalone history checkups (no appointmentId) must NOT touch the ledger.
  resetState();
  state.checkupDoc = checkupDoc({ appointmentId: null });
  state.existingPayment = null;
  const { req: r3, res: res3 } = makeReqRes({ payment: { amount: 900, method: "Cash", isPaid: true } });
  await updateCheckup(r3, res3);
  assert(res3.statusCode === 200, `standalone checkup edit returns 200 — got ${res3.statusCode}`);
  assert(state.paymentUpdates.length === 0, "no Payment upsert without an appointment link");
  assert(state.appointmentUpdates.length === 0, "no appointment sync without an appointment link");
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(60)}`);
console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
