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
        enum: ["Pending", "Confirmed", "Cancelled","Completed"],
        default: "Pending"
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

    
    
    
},{timestamps:true});

export default mongoose.model("Appointment", appointmentSchema);