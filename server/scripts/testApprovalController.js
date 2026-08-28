/**
 * Standalone verification for the refactored online-booking approval
 * controller (server/controllers/appointment.controller.js →
 * approveOnlineBooking).
 *
 * Run with:  node scripts/testApprovalController.js
 *
 * It imports the REAL controller and drives it end-to-end, swapping the
 * Mongoose model/service modules for in-memory mocks via Node's module
 * hooks (node:module registerHooks). The Patient mock enforces the SAME
 * required-field rules as the real Patient schema (age + gender are
 * required) — this is what made the old "Confirm Approval" flow throw a
 * ValidationError and surface as a 500 "Internal Server Error".
 *
 * Covered scenarios:
 *   1. Original bug: new online patient (no clinic Patient record) is
 *      approved → must return 200 (previously 500) and auto-create a
 *      schema-valid Patient.
 *   2. Fee reconciliation: netAmount = standardFee - discountAmount.
 *   3. Explicit checkupPrice from the approval modal wins.
 *   4. Double-approval is idempotent → 409, not 500.
 *   5. Re-approving a rejected booking clears the stale rejection state.
 *   6. Slot capacity reached → 409.
 *   7. Invalid appointment ID → 400.
 *   8. Unexpected downstream failure → 500 with descriptive message.
 *   9. Schema validation failure → descriptive 400.
 */
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import state, { resetState } from "./testApprovalState.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// Mock module sources.
// Each injected module imports the shared state module (resolved relative to
// the file it replaces, i.e. server/models/ or server/services/).
// ─────────────────────────────────────────────────────────────────────────────
const STATE_IMPORT = `import state from "../scripts/testApprovalState.js";`;

const appointmentMock = `${STATE_IMPORT}
const thenable = (doc) => ({
  populate: function () { return this; },
  select: function () { return this; },
  then: (res, rej) => Promise.resolve(doc).then(res, rej),
});
export default {
  findOne: () => thenable(state.appointment),
  countDocuments: async () => state.standardCount,
};
`;

const patientMock = `${STATE_IMPORT}
export default {
  findById: async (id) => state.existingPatients.find((p) => String(p._id) === String(id)) || null,
  findOne: async (query) =>
    state.existingPatients.find((p) =>
      Object.entries(query).every(([k, v]) => String(p[k]) === String(v))
    ) || null,
  create: async (doc) => {
    if (state.forcePatientCreateError) throw state.forcePatientCreateError;
    const errors = {};
    if (doc.age === undefined || doc.age === null) errors.age = "Path \\\`age\\\` is required.";
    if (doc.gender === undefined || doc.gender === null) errors.gender = "Path \\\`gender\\\` is required.";
    if (!["Male", "Female", "Other"].includes(doc.gender))
      errors.gender = "\\"gender\\" \\"" + doc.gender + "\\" is not a valid enum value.";
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
export const Doctor = {
  findById: () => ({
    select: function () { return this; },
    then: (res, rej) => Promise.resolve(state.doctor).then(res, rej),
  }),
};
`;

const paymentMock = `${STATE_IMPORT}
export default {
  findOneAndUpdate: async (query, update, options) => {
    state.paymentUpdates.push({ query, update, options });
    return update;
  },
};
`;

const bookingProofMock = `${STATE_IMPORT}
export default {
  updateOne: async () => { state.proofUpdates += 1; return { matchedCount: 1 }; },
};
`;

const checkupMock = `
export default {
  find: () => ({ sort: () => Promise.resolve([]) }),
};
`;

const whatsappMock = `${STATE_IMPORT}
export const sendWhatsAppTextMessage = async (phone, message) => {
  state.whatsapp.push({ phone, message });
  return { ok: true };
};
`;

// Map: file-suffix (URL-anchored) → mock source.
const MOCKS = {
  "/models/appointment.model.js": appointmentMock,
  "/models/patient.model.js": patientMock,
  "/models/doctor.model.js": doctorMock,
  "/models/payment.model.js": paymentMock,
  "/models/bookingPaymentProof.model.js": bookingProofMock,
  "/models/checkup.model.js": checkupMock,
  "/services/whatsapp.service.js": whatsappMock,
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

// Import the REAL controller AFTER the hooks are registered.
const { approveOnlineBooking } = await import("../controllers/appointment.controller.js");

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

const makeReqRes = (body = {}, params = { id: "aaaaaaaaaaaaaaaaaaaaaaaa" }) => {
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
  return { req: { doctorId: "bbbbbbbbbbbbbbbbbbbbbbbb", params, body }, res };
};

const baseAppointment = (overrides = {}) => ({
  save: async function () { return this; }, // mimics the Mongoose document API
  _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
  doctor: "bbbbbbbbbbbbbbbbbbbbbbbb",
  patient: null,
  patientAccount: {
    name: "Ahmed Khan",
    phone: "03001234567",
    email: "ahmed@example.com",
    dateOfBirth: new Date("1990-04-10"),
  },
  date: new Date("2026-09-01T00:00:00Z"),
  slot: "09:00",
  type: "Consultation",
  status: "Pending",
  queueStatus: "WAITING",
  awaitingOnlineApproval: true,
  consultationFee: 1000,
  standardFee: 1000,
  originalFee: 1000,
  discountAmount: 0,
  netAmount: 1000,
  cancellationReason: null,
  rejectionReason: null,
  cancelledAt: null,
  ...overrides,
});

const expectedAge = (dob) => {
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
};

// ─────────────────────────────────────────────────────────────────────────────
console.log("\nScenario 1 — original 500: new online patient, no clinic record\n");
resetState();
{
  state.appointment = baseAppointment();
  const { req, res } = makeReqRes({ checkupPrice: 1000 });
  await approveOnlineBooking(req, res);
  assert(res.statusCode === 200, `returns 200 (was 500 before the fix) — got ${res.statusCode}`);
  assert(state.createdPatients.length === 1, "auto-creates exactly one clinic Patient record");
  const created = state.createdPatients[0];
  if (created) {
    assert(created.age === expectedAge("1990-04-10"), `age derived from dateOfBirth (${created.age})`);
    assert(created.gender === "Other", "gender falls back to a valid enum value");
    assert(created.name === "Ahmed Khan", "name carried over from PatientAccount");
    assert(created.phone === "03001234567", "phone carried over from PatientAccount");
  }
  assert(
    state.appointment.status === "Confirmed" && state.appointment.awaitingOnlineApproval === false,
    "appointment marked Confirmed and approval flag cleared",
  );
  assert(state.appointment.queueStatus === "WAITING", "enters the active Doctor Queue (WAITING)");
  assert(state.proofUpdates === 1, "payment proof marked APPROVED");
  assert(state.paymentUpdates.length === 1, "Payment record upserted for Revenue Lab");
  const payment = state.paymentUpdates[0]?.update;
  assert(
    payment && payment.netAmount === 1000 && payment.standardFee === 1000 && payment.status === "PAID",
    "Payment upsert carries fee + PAID status",
  );
  assert(
    state.paymentUpdates[0]?.options?.upsert === true && state.paymentUpdates[0]?.options?.runValidators === true,
    "Payment upsert uses { upsert: true, runValidators: true }",
  );
  assert(state.whatsapp.length === 1 && state.whatsapp[0].phone === "03001234567", "WhatsApp confirmation sent");
}

console.log("\nScenario 2 — fee reconciliation (netAmount = standardFee - discountAmount)\n");
resetState();
{
  state.appointment = baseAppointment({ consultationFee: 1500, discountAmount: 200 });
  const { req, res } = makeReqRes({}); // no explicit price → stored fee wins
  await approveOnlineBooking(req, res);
  assert(res.statusCode === 200, `returns 200 — got ${res.statusCode}`);
  assert(state.appointment.standardFee === 1500, "standardFee kept at 1500");
  assert(state.appointment.discountAmount === 200, "discountAmount kept at 200");
  assert(state.appointment.netAmount === 1300, `netAmount = 1500 - 200 = 1300 (got ${state.appointment.netAmount})`);
  assert(state.appointment.consultationFee === 1300, "consultationFee mirrors netAmount");
}

console.log("\nScenario 3 — explicit checkupPrice wins\n");
resetState();
{
  state.appointment = baseAppointment({ consultationFee: 800 });
  const { req, res } = makeReqRes({ checkupPrice: 2000 });
  await approveOnlineBooking(req, res);
  assert(res.statusCode === 200, `returns 200 — got ${res.statusCode}`);
  assert(state.appointment.standardFee === 2000, "standardFee set to explicit checkupPrice");
  assert(state.appointment.netAmount === 2000, "netAmount follows the explicit price");
}

console.log("\nScenario 4 — double approval is idempotent (409, not 500)\n");
resetState();
{
  state.appointment = baseAppointment({ status: "Confirmed", awaitingOnlineApproval: false });
  const { req, res } = makeReqRes({});
  await approveOnlineBooking(req, res);
  assert(res.statusCode === 409, `returns 409 — got ${res.statusCode}`);
  assert(String(res.body?.message || "").includes("already been approved"), "descriptive 409 message");
  assert(state.createdPatients.length === 0, "no side effects on re-approval");
}

console.log("\nScenario 5 — re-approving a rejected booking clears stale state\n");
resetState();
{
  state.appointment = baseAppointment({
    status: "Cancelled",
    awaitingOnlineApproval: false,
    cancellationReason: "Payment Rejected",
    rejectionReason: "Screenshot blurry",
    cancelledAt: new Date(),
  });
  const { req, res } = makeReqRes({ checkupPrice: 1200 });
  await approveOnlineBooking(req, res);
  assert(res.statusCode === 200, `returns 200 — got ${res.statusCode}`);
  assert(state.appointment.status === "Confirmed", "status restored to Confirmed");
  assert(state.appointment.cancellationReason === null, "stale cancellationReason cleared");
  assert(state.appointment.rejectionReason === null, "stale rejectionReason cleared");
  assert(state.appointment.cancelledAt === null, "stale cancelledAt cleared");
}

console.log("\nScenario 6 — slot capacity reached → 409\n");
resetState();
{
  state.appointment = baseAppointment();
  state.standardCount = 3;
  const { req, res } = makeReqRes({});
  await approveOnlineBooking(req, res);
  assert(res.statusCode === 409, `returns 409 — got ${res.statusCode}`);
  assert(String(res.body?.message || "").includes("full"), "descriptive capacity message");
  assert(state.appointment.status === "Pending", "appointment untouched when capacity blocks approval");
}

console.log("\nScenario 7 — invalid appointment ID → 400\n");
resetState();
{
  const { req, res } = makeReqRes({}, { id: "not-an-objectid" });
  await approveOnlineBooking(req, res);
  assert(res.statusCode === 400, `returns 400 — got ${res.statusCode}`);
}

console.log("\nScenario 8 — unexpected downstream failure → descriptive 500\n");
resetState();
{
  state.appointment = baseAppointment();
  state.forcePatientCreateError = new Error("boom: mock transient failure");
  const { req, res } = makeReqRes({});
  await approveOnlineBooking(req, res);
  assert(res.statusCode === 500, `returns 500 — got ${res.statusCode}`);
  assert(String(res.body?.message || "").includes("approving booking"), "descriptive 500 message");
}

console.log("\nScenario 9 — validation failure maps to descriptive 400\n");
resetState();
{
  state.appointment = baseAppointment();
  const err = new Error("Patient validation failed");
  err.name = "ValidationError";
  err.errors = { age: { message: "Path `age` is required." } };
  state.forcePatientCreateError = err;
  const { req, res } = makeReqRes({});
  await approveOnlineBooking(req, res);
  assert(res.statusCode === 400, `returns 400 — got ${res.statusCode}`);
  assert(
    String(res.body?.message || "").includes("Path `age` is required"),
    "surfaces the first schema validation message",
  );
}

console.log(`\n${"─".repeat(60)}`);
console.log(`RESULT: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
