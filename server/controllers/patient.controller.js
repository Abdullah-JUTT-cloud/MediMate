import Patient from "../models/patient.model.js";

export const getPatients = async (req, res) => {
  try {
    const { search } = req.query;

    const query = { doctor: req.doctorId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const patients = await Patient.find(query)
      .select("name age gender phone bloodGroup createdAt locations")
      .sort({ createdAt: -1 });

    res.status(200).json({ patients });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPatient=async(req,res)=>{
    try {
        const id=req.params.id;
        const patient = await Patient.findOne({ _id: id, doctor: req.doctorId });
        if(!patient){
            return res.status(404).json({message:"Patient not found"});
        }
        res.status(200).json({patient});
    } catch (error) {
        res.status(500).json({message:"Internal server error"});
    }
}

export const addPatient=async(req,res)=>{
    try {
        const {name,age,gender,phone,bloodGroup,medicalHistory,locations}=req.body;
        if(!name){
            return res.status(400).json({message:"Name is required"});
        }
        if(!age){
            return res.status(400).json({message:"Age is required"});
        }
        if(!gender){
            return res.status(400).json({message:"Gender is required"});
        }
        if(!phone){
            return res.status(400).json({message:"Phone is required"});
        }
        const patient=new Patient({
            doctor:req.doctorId,
            name,
            age,
            gender,
            phone,
            bloodGroup,
            medicalHistory,
            locations,
        });
        await patient.save();
        res.status(201).json({message:"Patient added successfully",patient});
    } catch (error) {
        res.status(500).json({message:"Internal server error"});
    }
}

export const updatePatient=async(req,res)=>{
    try {
        const id=req.params.id;
        const {name,age,gender,phone,bloodGroup,medicalHistory,locations}=req.body;
        const patient=await Patient.findOne({ _id: id, doctor: req.doctorId });
        if(!patient){
            return res.status(404).json({message:"Patient not found"});
        }
        if(name){
            patient.name=name;
        }
        if(age){
            patient.age=age;
        }
        if(gender){
            patient.gender=gender;
        }
        if(phone){
            patient.phone=phone;
        }
        if(bloodGroup){
            patient.bloodGroup=bloodGroup;
        }
        if(medicalHistory){
            patient.medicalHistory=medicalHistory;
        }
        if(typeof locations !== "undefined"){
            patient.locations=locations;
        }
        await patient.save();
        res.status(200).json({message:"Patient updated successfully",patient});
    } catch (error) {
        res.status(500).json({message:"Internal server error"});
    }
}       
       
export const deletePatient=async(req,res)=>{
    try {
        const id=req.params.id;
        const patient=await Patient.findOneAndDelete({ _id: id, doctor: req.doctorId });
        if(!patient){
            return res.status(404).json({message:"Patient not found"});
        }
        res.status(200).json({message:"Patient deleted successfully"});
    } catch (error) {
        res.status(500).json({message:"Internal server error"});
    }
}