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


export const updateProfile=async(req,res)=>{
    const { fullName, phoneNumber,profileImage,specialization, clinicName, clinicAddress, workingHours, slotDuration } =req.body;
    try {
        const doctor=await Doctor.findById(req.doctorId);
        if(!doctor){
            return res.status(404).json({message:"Doctor not found"})
        }
        if(fullName){
            doctor.fullName=fullName;
        }
        if(phoneNumber){
            doctor.phoneNumber=phoneNumber;
        }
        if(specialization){
            doctor.specialization=specialization;
        }
        if(clinicName){
            doctor.clinicName=clinicName;
        }
        if(clinicAddress){
            doctor.clinicAddress=clinicAddress;
        }
        if(workingHours){
            doctor.workingHours=workingHours;
        }
        if(slotDuration){
            doctor.slotDuration=slotDuration;
        }   
        if(profileImage){
            doctor.profileImage=profileImage;

        }
        await doctor.save();
        const updatedDoc=await Doctor.findById(req.doctorId).select("-password -otp -otpExpiry -resetToken -resetTokenExpiry");
        res.status(200).json({message:"Profile updated successfully",doctor:updatedDoc});
    } catch (error) {
        res.status(500).json({message:"Error updating profile",error:error.message})
    }
}
