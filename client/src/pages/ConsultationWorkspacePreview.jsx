/**
 * ConsultationWorkspacePreview.jsx
 * 
 * This is a preview/demo component that can be used to test the redesigned
 * ConsultationWorkspace component without needing to go through the full
 * DoctorQueuePage flow.
 * 
 * Usage: Import and render this component in your app to see the redesigned workspace.
 */

import { useState } from "react";
import ConsultationWorkspaceRedesigned from "./ConsultationWorkspaceRedesigned";

// Demo appointment data
const demoAppointment = {
  _id: "demo-001",
  token: "A-100",
  patient: {
    _id: "patient-001",
    name: "Muhammad Abdullah",
    age: 21,
    gender: "Male",
    phone: "03214194045",
    bloodGroup: "AB+",
  },
  slot: "10:00",
  queueStatus: "IN_CONSULTATION",
  isWalkIn: true,
  paymentStatus: "PAID",
  paymentAmount: 3000,
  originalFee: 3000,
  netAmount: 3000,
  consultationFee: 3000,
};

// Demo history data
const demoHistory = [
  {
    _id: "history-001",
    createdAt: "2026-08-20T10:00:00Z",
    diseases: ["Seasonal Flu", "Fever"],
    notes: "Patient presented with high fever and body aches. Prescribed rest and hydration.",
    prescription: {
      diagnosis: "Acute Viral Fever",
      medicines: [
        {
          name: "Panadol Extra",
          dosage: "500mg",
          frequency: "1-1-1",
          duration: "3 Days",
          instructions: "Take after meals with water",
        },
        {
          name: "Brufen",
          dosage: "400mg",
          frequency: "1-0-1",
          duration: "3 Days",
          instructions: "Take with food if stomach upset",
        },
      ],
      labTests: ["CBC", "Urine R/E"],
      patientAdvice: "Rest for 3 days, drink plenty of fluids, monitor temperature",
      nextAppointment: "2026-08-23T10:00:00Z",
    },
  },
  {
    _id: "history-002",
    createdAt: "2026-08-26T10:00:00Z",
    diseases: ["Hypertension"],
    notes: "BP: 140/90 mmHg. Patient advised to monitor BP daily.",
    prescription: {
      diagnosis: "Essential Hypertension",
      medicines: [
        {
          name: "Amlodipine",
          dosage: "5mg",
          frequency: "1-0-0",
          duration: "1 Month",
          instructions: "Take in the morning",
        },
      ],
      labTests: ["LFT", "Renal Function Test"],
      patientAdvice: "Low salt diet, regular exercise, avoid stress",
    },
  },
];

export default function ConsultationWorkspacePreview() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mb-4 px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
      >
        Open Consultation Workspace
      </button>

      <ConsultationWorkspaceRedesigned
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        appointment={demoAppointment}
        history={demoHistory}
        onCheckupComplete={() => {
          setIsOpen(false);
          alert("Consultation completed!");
        }}
      />
    </div>
  );
}
