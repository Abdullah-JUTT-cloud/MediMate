/**
 * Shared in-memory state for the approval controller verification script
 * (scripts/testApprovalController.js). The mocked model modules and the
 * test script itself both import this module so they observe the same
 * state. NOT part of the application runtime.
 */
const state = {
  appointment: null, // document the mocked Appointment.findOne resolves
  standardCount: 0,
  doctor: { onlineBookingFee: 1000, advanceBookingFee: 500 },
  existingPatients: [], // records Patient.findOne may match
  createdPatients: [],
  paymentUpdates: [],
  proofUpdates: 0,
  whatsapp: [],
  forcePatientCreateError: null,
};

export const resetState = () => {
  state.appointment = null;
  state.standardCount = 0;
  state.doctor = { onlineBookingFee: 1000, advanceBookingFee: 500 };
  state.existingPatients = [];
  state.createdPatients = [];
  state.paymentUpdates = [];
  state.proofUpdates = 0;
  state.whatsapp = [];
  state.forcePatientCreateError = null;
};

export default state;
