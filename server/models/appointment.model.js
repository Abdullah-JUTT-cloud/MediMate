import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    doctor:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: [true, "Doctor is required"]
    },
    patient:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        // Not required for online bookings — patientAccount is used instead
        // until the receptionist approves and maps a clinic Patient record.
        required: false,
        default: null,
    },
    // Reference to PatientAccount for public online bookings.
    // Null for walk-in / receptionist-entered appointments.
    patientAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PatientAccount",
        default: null,
    },
    date:{
        type: Date,
        required: true
    },
    slot:{
        type: String,
        required: true
    },
    status:{
        type: String,
        enum: ["Pending", "Confirmed", "Cancelled", "No-show", "Completed"],
        default: "Pending"
    },
    queueStatus: {
        type: String,
        enum: ['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW'],
        default: 'WAITING'
    },
    isWalkIn: {
        type: Boolean,
        default: false
    },
    checkInTime: {
        type: Date,
        default: Date.now
    },
    cancellationReason: {
        type: String,
        enum: ["Doctor", "Patient", "Emergency", "No-show", "Payment Rejected", null],
        default: null,
    },
    consultationFee: {
        type: Number,
        default: 0,
        min: 0,
    },
    // `standardFee` is the canonical raw base price (pre-discount). `originalFee`
    // is kept as a legacy alias so existing reads/aggregations keep working.
    standardFee: {
        type: Number,
        default: 0,
        min: 0,
    },
    originalFee: {
        type: Number,
        default: 0,
        min: 0,
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    // `netAmount` = standardFee - discountAmount - advanceAmountPaid, computed
    // with the same shared formula at whichever of these points actually sets
    // the fee: booking (walk-in, charge-now), online-booking approval
    // (charge-now), consultation save (pay-at-consultation / deferred), or a
    // Payments-page edit (correction). The most recent write is authoritative —
    // do not re-derive or re-subtract it downstream.
    netAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    // True when the consultation fee was deferred (toggle used at walk-in
    // booking or at online-booking approval). The fee fields stay at their
    // defaults (0) until the doctor sets the fee at consultation time.
    payAtConsultation: {
        type: Boolean,
        default: false,
    },
    // Actual amount the patient already paid online (from the
    // BookingPaymentProof amount) for deferred fees. Lets the consultation
    // workspace compute the remaining balance without an extra query.
    // Note: distinct from `advancePaid` (boolean — "was an advance paid").
    advanceAmountPaid: {
        type: Number,
        default: 0,
        min: 0,
    },
    labFee: {
        type: Number,
        default: 0,
        min: 0,
    },
    type:{
        type: String,
        enum:["Consultation", "Follow-up", "Check-up", "Emergency"],
        required: true
    },
    // Emergency override flag: emergency bookings bypass the 3-per-slot
    // standard capacity check and are counted separately in slot aggregation.
    isEmergency: {
        type: Boolean,
        default: false,
    },
    notes:{
        type:String,

    },
    reminderSent: { type: Boolean, default: false },
    emergencyCancelled: { type: Boolean, default: false },
    cancelledAt: {
        type: Date,
        default: null,
    },

    // === Online Booking Fields ===
    // True while a PatientAccount booking is pending receptionist approval.
    // These appointments are excluded from slot capacity counts so they do not
    // falsely block other bookings.
    awaitingOnlineApproval: {
        type: Boolean,
        default: false,
    },
    // True once the patient's advance payment proof has been verified.
    advancePaid: {
        type: Boolean,
        default: false,
    },
    // Rejection reason specified by clinic staff upon declining an online booking
    rejectionReason: {
        type: String,
        default: null,
    },
    // === Consultation Draft Auto-Save ===
    // Snapshot of the in-progress consultation form (diseases, notes,
    // diagnosis, medicines, labTests, patientAdvice, nextAppointment,
    // deferred fee) captured when the doctor clicks "Save changes" on the
    // unsaved-changes prompt. Populated back into the workspace when the
    // doctor next opens the appointment so they can resume where they
    // left off. Cleared by the consultation-complete path so a finished
    // visit never leaves a stale draft.
    // Mixed is the right type — a draft is a free-form snapshot, NOT a
    // validated Checkup. Doctors may save mid-typing with empty/partial
    // rows, so applying the Checkup schema would block valid drafts.
    draftCheckup: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    draftSavedAt: {
        type: Date,
        default: null,
    },
},{timestamps:true});

// Speed up hot paths for date/status dashboard queries and listing.
appointmentSchema.index({ doctor: 1, date: 1, status: 1 });
appointmentSchema.index({ doctor: 1, createdAt: -1 });

// Slot lookup index used by max-capacity checks in controllers.
appointmentSchema.index({ doctor: 1, date: 1, slot: 1, status: 1 });

// Slot availability aggregation index: groups active bookings per time slot
// and separates standard vs emergency counts (GET /api/slots).
appointmentSchema.index({ doctor: 1, date: 1, slot: 1, isEmergency: 1, status: 1 });

// Online booking approval queue: fast lookup of pending patient-submitted requests.
appointmentSchema.index({ doctor: 1, awaitingOnlineApproval: 1, createdAt: -1 });
appointmentSchema.index({ patientAccount: 1, createdAt: -1 });

export default mongoose.model("Appointment", appointmentSchema);