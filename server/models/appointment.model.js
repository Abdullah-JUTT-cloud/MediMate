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
        required: [true, "Patient is required"]
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
        enum: ["Doctor", "Patient", "Emergency", "No-show", null],
        default: null,
    },
    consultationFee: {
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
    netAmount: {
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
    notes:{
        type:String,

    },
    reminderSent: { type: Boolean, default: false },
    emergencyCancelled: { type: Boolean, default: false },
    cancelledAt: {
        type: Date,
        default: null,
    },

    
    
    
},{timestamps:true});

// Speed up hot paths for date/status dashboard queries and listing.
appointmentSchema.index({ doctor: 1, date: 1, status: 1 });
appointmentSchema.index({ doctor: 1, createdAt: -1 });

// Slot lookup index used by max-capacity checks in controllers.
appointmentSchema.index({ doctor: 1, date: 1, slot: 1, status: 1 });

export default mongoose.model("Appointment", appointmentSchema);