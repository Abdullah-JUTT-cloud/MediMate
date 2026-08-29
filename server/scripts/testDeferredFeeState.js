/**
 * Shared in-memory state for the "pay at consultation" verification script
 * (scripts/testDeferredFee.js). The mocked model modules and the test script
 * both import this module so they observe the same state.
 * NOT part of the application runtime.
 */
const state = {
  // approveOnlineBooking / createAppointment / completeCheckup
  appointment: null, // document the mocked Appointment.findOne resolves
  standardCount: 0, // slot capacity counter
  doctor: { onlineBookingFee: 1000, advanceBookingFee: 500, fullName: "Dr. Test" },
  doctorLookups: 0, // proves the fee-resolution block was (not) reached
  proof: null, // BookingPaymentProof document { amount }
  patientAccount: null,
  patient: { _id: "cccccccccccccccccccccccc", doctor: "bbbbbbbbbbbbbbbbbbbbbbbb", name: "Walk-in Patient", phone: "03001112223" },
  existingPatients: [],
  createdPatients: [],
  // records
  createdAppointments: [],
  createdPayments: [],
  paymentUpdates: [], // Payment.findOneAndUpdate calls (approve / updateCheckup)
  paymentUpdateMany: [], // Payment.updateMany calls (REALIZED flips)
  appointmentUpdates: [], // Appointment.updateOne / updateMany calls
  savedCheckups: [],
  proofUpdates: 0,
  proofLookups: 0,
  reviews: [],
  whatsapp: [], // text messages
  whatsappPdfs: [], // pdf documents
  // updateCheckup
  existingPayment: null, // Payment.findOne result (status preservation)
  checkupDoc: null, // document the mocked Checkup.findOne resolves
};

export const resetState = () => {
  state.appointment = null;
  state.standardCount = 0;
  state.doctor = { onlineBookingFee: 1000, advanceBookingFee: 500, fullName: "Dr. Test" };
  state.doctorLookups = 0;
  state.proof = null;
  state.patientAccount = null;
  state.patient = { _id: "cccccccccccccccccccccccc", doctor: "bbbbbbbbbbbbbbbbbbbbbbbb", name: "Walk-in Patient", phone: "03001112223" };
  state.existingPatients = [];
  state.createdPatients = [];
  state.createdAppointments = [];
  state.createdPayments = [];
  state.paymentUpdates = [];
  state.paymentUpdateMany = [];
  state.appointmentUpdates = [];
  state.savedCheckups = [];
  state.proofUpdates = 0;
  state.proofLookups = 0;
  state.reviews = [];
  state.whatsapp = [];
  state.whatsappPdfs = [];
  state.existingPayment = null;
  state.checkupDoc = null;
};

export default state;
