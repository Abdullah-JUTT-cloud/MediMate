import { Doctor } from "../models/doctor.model.js";

export const getProfile=async(req,res)=>{
    try {
        const doctor=await Doctor.findById(req.doctorId).select("-password -otp -otpExpiry -resetToken -resetTokenExpiry");
        if(!doctor){
            return res.status(404).json({message:"Doctor not found"})
        }
        res.status(200).json({doctor});
    } catch (error) {
        res.status(500).json({message:"Error getting profile",error:error.message})
    }
}