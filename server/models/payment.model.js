import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        required: false
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: false
    },
    category: {
        type: String,
        enum: ['CONSULTATION', 'LAB', 'PROCEDURE', 'OTHER'],
        required: true
    },
    status: {
        type: String,
        enum: ['PAID', 'PENDING', 'REALIZED'],
        default: 'PENDING'
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    // Canonical raw base price (pre-discount). `originalFee` stays as a
    // legacy alias so existing reads/aggregations keep working.
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
    discount: {
        type: Number,
        default: 0,
        min: 0,
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    // netAmount = standardFee - discountAmount - advanceAmountPaid, computed
    // with the same shared formula by whichever write actually sets this
    // record: booking (charge-now), online-booking approval (charge-now),
    // consultation save (deferred fee), or a Payments-page edit (correction).
    // The most recent write is authoritative — do not re-derive it downstream.
    netAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    description: {
        type: String,
        default: "Consultation",
    },
    ancillaryFee: {
        type: Number,
        default: 0,
        min: 0,
    },
    method: {
        type: String,
        enum: ["Cash", "Card", "Online Transfer"],
        default: "Cash"
    }
}, { timestamps: true });

// Indexing for faster lookups
paymentSchema.index({ patientId: 1, doctorId: 1, createdAt: -1 });
paymentSchema.index({ appointmentId: 1 });

export default mongoose.model("Payment", paymentSchema);
