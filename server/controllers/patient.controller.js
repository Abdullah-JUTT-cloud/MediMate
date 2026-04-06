import mongoose from "mongoose";
import Patient from "../models/patient.model.js";
import Appointment from "../models/appointment.model.js";
import Checkup from "../models/checkup.model.js";
import { createPatientChatCredentials, sendPatientChatInvite } from "../utils/chatAccess.js";

const toBoolean = (value) => {
    if (value === true || value === false) return value;
    if (typeof value === "string") {
        return ["true", "1", "yes", "on"].includes(value.toLowerCase());
    }
    return false;
};

const getPatientChatPortalUrl = () => {
    const baseUrl = (process.env.PATIENT_PORTAL_URL || process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    return `${baseUrl}/patient-login`;
};

const syncPatientChatAccess = async (patient, requestedChatAccessEnabled, shouldSendInvite = false, forceRotateCredentials = false) => {
    const nextChatAccessEnabled = toBoolean(requestedChatAccessEnabled);

    if (!nextChatAccessEnabled) {
        patient.chatAccessEnabled = false;
        if (!patient.chatInviteStatus || patient.chatInviteStatus === "Pending") {
            patient.chatInviteStatus = "Not Sent";
        }
        return { inviteSent: false };
    }

    const needsCredentials = forceRotateCredentials || !patient.chatUsername || !patient.chatPasswordHash;
    let generatedCredentials = null;

    if (needsCredentials) {
        generatedCredentials = await createPatientChatCredentials(Patient, patient.doctor, patient.name);
        patient.chatUsername = generatedCredentials.username;
        patient.chatPasswordHash = generatedCredentials.passwordHash;
    }

    patient.chatAccessEnabled = true;
    if (shouldSendInvite) {
        patient.chatInviteStatus = "Pending";
    }

    if (!shouldSendInvite) {
        return { inviteSent: false, generatedCredentials };
    }

    try {
        await sendPatientChatInvite({
            phone: patient.phone,
            patientName: patient.name,
            username: patient.chatUsername,
            password: generatedCredentials?.password || "******",
            portalUrl: getPatientChatPortalUrl(),
        });
        patient.chatInviteStatus = "Sent";
        patient.chatInviteSentAt = new Date();
        return { inviteSent: true, generatedCredentials };
    } catch (error) {
        patient.chatInviteStatus = "Failed";
        console.error("[syncPatientChatAccess] WhatsApp invite failed:", error.message);
        return { inviteSent: false, generatedCredentials, inviteError: error };
    }
};

export const getPatients = async (req, res) => {
    try {
        const { search, page = 1, limit = 50 } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 50));
        const skip = (pageNum - 1) * limitNum;

        const query = { doctor: req.doctorId };

        if (search) {
            const escapedSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            query.$or = [
                { name: { $regex: escapedSearch, $options: "i" } },
                { phone: { $regex: escapedSearch, $options: "i" } },
                { chatUsername: { $regex: escapedSearch, $options: "i" } },
            ];
        }

        const patients = await Patient.find(query)
            .select("name age gender phone bloodGroup createdAt locations chatAccessEnabled chatUsername chatInviteStatus chatInviteSentAt chatLastLoginAt")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Patient.countDocuments(query);

        res.status(200).json({ patients, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getPatient = async (req, res) => {
    try {
        const id = req.params.id;
        const patient = await Patient.findOne({ _id: id, doctor: req.doctorId });
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }
        res.status(200).json({ patient });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const addPatient = async (req, res) => {
    try {
        const { name, age, gender, phone, bloodGroup, medicalHistory, locations, chatAccessEnabled } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Name is required" });
        }
        if (!age) {
            return res.status(400).json({ message: "Age is required" });
        }
        if (!gender) {
            return res.status(400).json({ message: "Gender is required" });
        }
        if (!phone) {
            return res.status(400).json({ message: "Phone is required" });
        }

        const patient = new Patient({
            doctor: req.doctorId,
            name,
            age,
            gender,
            phone,
            bloodGroup,
            medicalHistory,
            locations,
        });

        const shouldEnableChat = toBoolean(chatAccessEnabled);
        if (shouldEnableChat) {
            await syncPatientChatAccess(patient, true, true, true);
        }

        await patient.save();
        res.status(201).json({ message: "Patient added successfully", patient });
    } catch (error) {
        console.error("[addPatient]", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid patient ID" });
        }

        const { name, age, gender, phone, bloodGroup, medicalHistory, locations, chatAccessEnabled } = req.body;
        const patient = await Patient.findOne({ _id: id, doctor: req.doctorId });
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        if (name) {
            patient.name = name;
        }
        if (age) {
            patient.age = age;
        }
        if (gender) {
            patient.gender = gender;
        }
        if (phone) {
            patient.phone = phone;
        }
        if (bloodGroup) {
            patient.bloodGroup = bloodGroup;
        }
        if (medicalHistory) {
            patient.medicalHistory = medicalHistory;
        }
        if (typeof locations !== "undefined") {
            patient.locations = locations;
        }

        if (typeof chatAccessEnabled !== "undefined") {
            const nextChatAccessEnabled = toBoolean(chatAccessEnabled);
            const wasChatAccessEnabled = Boolean(patient.chatAccessEnabled);
            const shouldSendInvite = nextChatAccessEnabled && !wasChatAccessEnabled;
            await syncPatientChatAccess(patient, nextChatAccessEnabled, shouldSendInvite, shouldSendInvite);
        }

        await patient.save();
        res.status(200).json({ message: "Patient updated successfully", patient });
    } catch (error) {
        console.error("[updatePatient]", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid patient ID" });
        }
        const patient = await Patient.findOne({ _id: id, doctor: req.doctorId });
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        const [appointmentsResult, checkupsResult] = await Promise.all([
            Appointment.deleteMany({ doctor: req.doctorId, patient: id }),
            Checkup.deleteMany({ doctor: req.doctorId, patient: id }),
        ]);

        await patient.deleteOne();

        res.status(200).json({
            message: "Patient and related data deleted successfully",
            deleted: {
                patient: 1,
                appointments: appointmentsResult.deletedCount || 0,
                checkups: checkupsResult.deletedCount || 0,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};