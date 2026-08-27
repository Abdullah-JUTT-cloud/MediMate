import { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileText,
  Stethoscope,
  Pill,
  FlaskConical,
  Phone,
  Clock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";

// Common quick disease suggestions
const QUICK_DISEASES = [
  "Hypertension",
  "Seasonal Flu / Fever",
  "Type 2 Diabetes",
  "Acute Bronchitis",
  "Gastritis / GERD",
  "Migraine",
  "Allergic Rhinitis",
];

// Common quick lab tests
const QUICK_LAB_TESTS = [
  "CBC",
  "LFT (Liver Function Test)",
  "Renal / Serum Creatinine",
  "Lipid Profile",
  "Urine R/E",
  "Fasting Blood Sugar (FBS)",
  "HbA1c",
  "Chest X-Ray",
];

// Common frequency presets
const FREQUENCY_PRESETS = [
  "1-0-1",
  "1-1-1",
  "1-0-0",
  "0-0-1",
  "Once Daily",
  "Twice Daily",
  "Every 8 Hours",
  "As Needed (PRN)",
];

const formatVisitDate = (dateVal) => {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }); // e.g. "26 August 2026"
  } catch {
    return "—";
  }
};

// Shared input styling — strict high-contrast dark clinical console
const FIELD_INPUT_CLASS =
  "w-full bg-slate-900/80 border border-slate-700 text-white text-sm rounded-xl p-3 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none placeholder:text-slate-500 font-normal transition-all";

const FIELD_LABEL_CLASS =
  "text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 block";

export default function ConsultationWorkspace({
  isOpen,
  onClose,
  appointment,
  history = [],
  onCheckupComplete,
}) {
  // Form States
  const [diseases, setDiseases] = useState("");
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
  ]);
  const [labTests, setLabTests] = useState("");
  const [patientAdvice, setPatientAdvice] = useState("");
  const [nextAppointment, setNextAppointment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Reset form when appointment changes or drawer opens
  useEffect(() => {
    if (isOpen) {
      setDiseases("");
      setNotes("");
      setDiagnosis("");
      setMedicines([
        { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
      ]);
      setLabTests("");
      setPatientAdvice("");
      setNextAppointment("");
      setFormErrors({});
    }
  }, [isOpen, appointment?._id]);

  // Lock body scroll when open and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Upfront consultation fees are locked at check-in/booking
  const originalFee = useMemo(() => {
    const fee = Number(
      appointment?.originalFee ??
        appointment?.consultationFee ??
        appointment?.netAmount ??
        0,
    );
    return Number.isFinite(fee) ? fee : 0;
  }, [appointment]);

  const discountAmount = useMemo(() => {
    const d = Number(appointment?.discountAmount ?? appointment?.discount ?? 0);
    return Math.max(0, Math.min(d, originalFee));
  }, [appointment, originalFee]);

  const netConsultationFee = useMemo(() => {
    const net = Number(appointment?.netAmount ?? (originalFee - discountAmount));
    return Number.isFinite(net) ? Math.max(0, net) : Math.max(0, originalFee - discountAmount);
  }, [appointment, originalFee, discountAmount]);

  // Helper to add preset to comma-separated field
  const appendQuickItem = (setter, currentVal, item) => {
    const list = currentVal
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.includes(item)) {
      list.push(item);
      setter(list.join(", "));
    }
  };

  // Medicine helpers
  const addMedicineRow = () => {
    setMedicines((prev) => [
      ...prev,
      { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
    ]);
  };

  const removeMedicineRow = (index) => {
    if (medicines.length === 1) {
      setMedicines([
        { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
      ]);
      return;
    }
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMedicine = (index, field, value) => {
    setMedicines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Quick preset for follow-up date
  const setQuickFollowUp = (daysToAdd) => {
    const target = new Date();
    target.setDate(target.getDate() + daysToAdd);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, "0");
    const dd = String(target.getDate()).padStart(2, "0");
    setNextAppointment(`${yyyy}-${mm}-${dd}`);
  };

  // Validation
  const validateForm = () => {
    const errors = {};
    if (!diagnosis.trim()) {
      errors.diagnosis = "Diagnosis is required";
    }

    const invalidMeds = medicines.some(
      (m) =>
        !m.name.trim() ||
        !m.dosage.trim() ||
        !m.frequency.trim() ||
        !m.duration.trim(),
    );
    if (invalidMeds) {
      errors.medicines =
        "Please fill in Name, Dosage, Frequency, and Duration for each medicine row";
    }

    if (nextAppointment) {
      const selected = new Date(nextAppointment);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        errors.nextAppointment = "Next appointment date cannot be in the past";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCompleteConsultation = async () => {
    if (!validateForm()) {
      if (!diagnosis.trim()) {
        toast.error("Diagnosis is required before saving prescription");
      } else {
        toast.error(
          "Please fill in all required fields (Name, Dosage, Frequency, Duration) for every prescribed medicine",
        );
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const diseaseList = diseases
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
      const testList = labTests
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        appointmentId: appointment._id,
        patientId: appointment.patient?._id,
        diseases: diseaseList.length > 0 ? diseaseList : [diagnosis.trim()],
        notes: notes.trim(),
        prescription: {
          diagnosis: diagnosis.trim(),
          medicines: medicines.map((m) => ({
            name: m.name.trim(),
            dosage: m.dosage.trim(),
            frequency: m.frequency.trim(),
            duration: m.duration.trim(),
            instructions: m.instructions?.trim() || "",
          })),
          labTests: testList,
          patientAdvice: patientAdvice.trim(),
          nextAppointment: nextAppointment || undefined,
        },
        payment: {
          amount: netConsultationFee,
          originalFee,
          discountAmount,
          discount: discountAmount,
          netAmount: netConsultationFee,
          ancillaryFee: 0,
          description: "Consultation & Prescription",
          method: appointment?.paymentMethod || "Cash",
          isPaid: true,
        },
        labFee: 0,
      };

      await axiosInstance.post("/checkups/complete", payload);
      toast.success("Consultation saved & WhatsApp prescription dispatched!");
      onClose?.();
      onCheckupComplete?.();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Failed to complete checkup. Please verify all fields.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const patient = appointment.patient || {};
  const todayFormatted = new Date().toISOString().split("T")[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-heading"
      className="fixed inset-0 z-50 flex justify-end overflow-hidden"
    >
      {/* Dark overlay backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Main Slide-in drawer container — fixed high-contrast clinical console */}
      <div className="relative z-10 flex h-full w-full max-w-none flex-col bg-slate-950 text-slate-100 shadow-2xl transition-transform duration-300">
        {/* =========================================================================
            HIGH-CONTRAST CLINICAL DRAWER HEADER & PATIENT BANNER
           ========================================================================= */}
        <header className="shrink-0 bg-slate-900 border-b border-slate-800 text-white p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Patient Details Left Section */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-sm sm:text-base font-bold text-white shrink-0 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-primary, #0d9488), #0f766e)",
                }}
              >
                {patient.name
                  ? patient.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "PT"}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    id="workspace-heading"
                    className="text-lg font-bold text-white truncate"
                  >
                    {patient.name || "Unknown Patient"}
                  </h3>

                  {/* Status indicator pill */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/15 text-teal-300 border border-teal-500/40">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                    </span>
                    In Consultation
                  </span>

                  {appointment.isWalkIn && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/40">
                      Walk-In
                    </span>
                  )}
                </div>

                {/* Patient Clinical Subtext */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-300 text-sm font-medium mt-1">
                  <span className="font-semibold text-white">
                    Slot: {appointment.slot || "—"}
                  </span>
                  <span>•</span>
                  <span>
                    {patient.age ? `${patient.age} yrs` : "Age N/A"} ·{" "}
                    {patient.gender || "Gender N/A"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Phone size={11} className="text-slate-400" />
                    {patient.phone || "No phone"}
                  </span>
                  {patient.bloodGroup && (
                    <>
                      <span>•</span>
                      <span className="font-bold text-rose-400">
                        {patient.bloodGroup}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Header Right Action & Fee Pill */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
              {/* Financial Status Pill */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  appointment.paymentStatus === "PAID" || appointment.paymentStatus === "REALIZED"
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                    : "bg-amber-500/15 text-amber-300 border border-amber-500/40"
                }`}
              >
                {appointment.paymentStatus === "PAID" || appointment.paymentStatus === "REALIZED" ? (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>✓ Paid Rs. {Number(appointment.paymentAmount || appointment.netAmount || originalFee).toLocaleString()}</span>
                  </>
                ) : (
                  <>
                    <Clock size={13} className="text-amber-400" />
                    <span>Pending Rs. {Number(appointment.paymentAmount || appointment.netAmount || originalFee).toLocaleString()}</span>
                  </>
                )}
              </div>

              {/* Close Drawer Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close consultation workspace"
                className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <X size={17} />
                <span className="hidden sm:inline">Esc</span>
              </button>
            </div>
          </div>
        </header>

        {/* =========================================================================
            SPLIT WORKSPACE BODY (2 COLUMNS)
           ========================================================================= */}
        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* ---------------------------------------------------------------------
              LEFT COLUMN: High-Legibility Patient History
             --------------------------------------------------------------------- */}
          <section
            aria-label="Patient clinical history"
            className="lg:col-span-5 flex flex-col h-full overflow-hidden bg-slate-950"
          >
            {/* Column Header */}
            <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-teal-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Patient History
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/15 text-teal-300 border border-teal-500/40">
                {history.length} Prior Visit{history.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Scrollable History Cards */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {history.length === 0 ? (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center shadow-md space-y-3">
                  <div className="w-12 h-12 rounded-full bg-teal-500/15 text-teal-300 flex items-center justify-center mx-auto border border-teal-500/40">
                    <Stethoscope size={22} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">
                      First Time Consultation
                    </h5>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-sm mx-auto">
                      No previous clinical consultation records exist for this
                      patient. Prescribing now will automatically record their initial
                      medical history.
                    </p>
                  </div>
                </div>
              ) : (
                history.map((h, idx) => {
                  const visitDate = formatVisitDate(h.createdAt);
                  const prescription = h.prescription || {};
                  const meds = prescription.medicines || [];
                  const labTestsList = prescription.labTests || [];

                  return (
                    <article
                      key={h._id || idx}
                      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-4 shadow-md space-y-4 last:mb-0 transition-all hover:border-teal-500/40"
                    >
                      {/* Date Badge & Meta */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-100 border border-slate-700">
                          <Calendar size={12} className="text-teal-400" />
                          {visitDate}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Visit #{history.length - idx}
                        </span>
                      </div>

                      {/* Diagnosis & Notes */}
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-1 block">
                          Diagnosis
                        </span>
                        <p className="text-slate-100 text-sm font-medium leading-relaxed">
                          {prescription.diagnosis || "No specific diagnosis recorded"}
                        </p>

                        {/* Diseases / Symptoms tags */}
                        {Array.isArray(h.diseases) && h.diseases.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {h.diseases.map((dis, dIdx) => (
                              <span
                                key={dIdx}
                                className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700"
                              >
                                {dis}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Doctor Clinical Notes */}
                      {h.notes && (
                        <div className="space-y-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-1 block">
                            Doctor Notes
                          </span>
                          <div className="text-slate-100 text-sm font-medium leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                            {h.notes}
                          </div>
                        </div>
                      )}

                      {/* Prescribed Medicines List */}
                      {meds.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-1 block">
                            Prescribed Medicines ({meds.length})
                          </span>
                          <div className="space-y-2">
                            {meds.map((med, mIdx) => (
                              <div
                                key={mIdx}
                                className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs font-medium"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                  <span className="font-bold text-white">
                                    {med.name} {med.dosage}
                                  </span>
                                  <span className="flex items-center gap-1.5 text-slate-300">
                                    <span className="font-bold text-teal-300">
                                      {med.frequency}
                                    </span>
                                    <span>• {med.duration}</span>
                                  </span>
                                </div>
                                {med.instructions && (
                                  <p className="text-slate-400 italic mt-1">
                                    Instructions: {med.instructions}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lab Tests Section (Teal Callout Box) */}
                      {labTestsList.length > 0 && (
                        <div className="bg-teal-950/40 border border-teal-800/80 rounded-xl p-3.5 space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                            <FlaskConical size={14} className="text-teal-400" />
                            Prescribed Lab Tests ({labTestsList.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {labTestsList.map((test, tIdx) => (
                              <span
                                key={tIdx}
                                className="bg-teal-900/60 text-teal-100 border border-teal-700 px-2.5 py-1 rounded-lg text-xs font-bold"
                              >
                                {test}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Patient Advice in readable prose */}
                      {prescription.patientAdvice && (
                        <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-3.5 space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
                            <Sparkles size={13} className="text-amber-400" />
                            Patient Advice
                          </span>
                          <p className="text-slate-100 text-sm font-medium leading-relaxed">
                            {prescription.patientAdvice}
                          </p>
                        </div>
                      )}

                      {/* Next Appointment Date if recorded */}
                      {prescription.nextAppointment && (
                        <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 pt-1">
                          <Calendar size={13} className="text-teal-400" />
                          <span>
                            Next Follow-Up:{" "}
                            <strong className="text-white">
                              {formatVisitDate(prescription.nextAppointment)}
                            </strong>
                          </span>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* ---------------------------------------------------------------------
              RIGHT COLUMN: Ergonomic New Checkup & Prescription Form
             --------------------------------------------------------------------- */}
          <section
            aria-label="New checkup and prescription form"
            className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-slate-950"
          >
            {/* Column Header */}
            <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope size={16} className="text-teal-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  New Checkup & Prescription
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                All changes dispatched to patient WhatsApp
              </span>
            </div>

            {/* Scrollable Form Fields */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCompleteConsultation();
              }}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
            >
              {/* Field 1: Common Diseases / Symptoms */}
              <div>
                <label className={FIELD_LABEL_CLASS}>
                  Common Diseases / Symptoms (Comma Separated)
                </label>
                <input
                  type="text"
                  value={diseases}
                  onChange={(e) => setDiseases(e.target.value)}
                  placeholder="e.g. Hypertension, Seasonal Flu, Type 2 Diabetes"
                  className={FIELD_INPUT_CLASS}
                />
                {/* Quick Add Suggestion Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">
                    Quick suggestions:
                  </span>
                  {QUICK_DISEASES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => appendQuickItem(setDiseases, diseases, item)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-2.5 py-1 rounded-md transition-colors"
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Clinical Examination Notes */}
              <div>
                <label className={FIELD_LABEL_CLASS}>
                  Clinical Examination & Vitals Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Clinical examination findings, vitals (BP, pulse, temp), symptoms timeline, systemic review..."
                  rows={3}
                  className={`${FIELD_INPUT_CLASS} resize-y`}
                />
              </div>

              {/* =============================================================
                  PRESCRIPTION SECTION CARD
                 ============================================================= */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 space-y-5 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Pill size={17} className="text-teal-400" />
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                      Prescription Details
                    </span>
                  </div>
                  <span className="text-xs text-rose-400 font-semibold">
                    * Required fields
                  </span>
                </div>

                {/* Diagnosis (Required) */}
                <div>
                  <label className={FIELD_LABEL_CLASS}>
                    Diagnosis <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => {
                      setDiagnosis(e.target.value);
                      if (formErrors.diagnosis) {
                        setFormErrors((prev) => ({ ...prev, diagnosis: null }));
                      }
                    }}
                    placeholder="e.g. Acute Viral Bronchitis, Essential Hypertension"
                    className={`w-full bg-slate-900/80 border text-white text-sm rounded-xl p-3 outline-none placeholder:text-slate-500 font-normal transition-all ${
                      formErrors.diagnosis
                        ? "border-rose-500 ring-1 ring-rose-500/40"
                        : "border-slate-700 focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                    }`}
                  />
                  {formErrors.diagnosis && (
                    <p className="text-xs font-bold text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={13} /> {formErrors.diagnosis}
                    </p>
                  )}
                </div>

                {/* =============================================================
                    PRESCRIPTION MEDICINES GRID (SPACIOUS LAYOUT)
                   ============================================================= */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Prescribed Medicines <span className="text-rose-400">*</span> ({medicines.length})
                    </label>
                    <button
                      type="button"
                      onClick={addMedicineRow}
                      className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Plus size={13} /> Add Medicine
                    </button>
                  </div>

                  {formErrors.medicines && (
                    <p className="text-xs font-bold text-rose-400 flex items-center gap-1">
                      <AlertCircle size={13} /> {formErrors.medicines}
                    </p>
                  )}

                  {/* Medicines List */}
                  <div>
                    {medicines.map((med, index) => (
                      <div
                        key={index}
                        className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-3 space-y-3 last:mb-0 transition-all"
                      >
                        {/* Medicine Row Top Action Bar */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                              Medicine #{index + 1}
                            </span>
                          </div>

                          {/* Delete Button (Clear, red-tinted) */}
                          <button
                            type="button"
                            onClick={() => removeMedicineRow(index)}
                            aria-label={`Remove medicine #${index + 1}`}
                            className="text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/70 p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <Trash2 size={14} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>

                        {/* Top Fields: Medicine Name & Formulation (wide flex-2) + Dosage */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          {/* Medicine Name & Formulation */}
                          <div className="sm:col-span-8">
                            <label className={FIELD_LABEL_CLASS}>
                              Medicine Name & Formulation <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) =>
                                updateMedicine(index, "name", e.target.value)
                              }
                              placeholder="e.g. Augmentin, Brufen, Panadol Extra"
                              className={FIELD_INPUT_CLASS}
                            />
                          </div>

                          {/* Dosage */}
                          <div className="sm:col-span-4">
                            <label className={FIELD_LABEL_CLASS}>
                              Dosage <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={(e) =>
                                updateMedicine(index, "dosage", e.target.value)
                              }
                              placeholder="e.g. 500mg, 1 tablet"
                              className={FIELD_INPUT_CLASS}
                            />
                          </div>
                        </div>

                        {/* Mid Fields: Frequency + Duration */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Frequency */}
                          <div>
                            <label className={FIELD_LABEL_CLASS}>
                              Frequency <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={med.frequency}
                              onChange={(e) =>
                                updateMedicine(index, "frequency", e.target.value)
                              }
                              placeholder="e.g. 1-0-1, 2x Daily, Once Daily"
                              className={FIELD_INPUT_CLASS}
                            />
                            {/* Preset pills for rapid entry */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {["1-0-1", "1-1-1", "1-0-0", "0-0-1", "2x Daily"].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => updateMedicine(index, "frequency", preset)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-2.5 py-1 rounded-md transition-colors"
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Duration */}
                          <div>
                            <label className={FIELD_LABEL_CLASS}>
                              Duration <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={med.duration}
                              onChange={(e) =>
                                updateMedicine(index, "duration", e.target.value)
                              }
                              placeholder="e.g. 5 Days, 1 Week, 10 Days"
                              className={FIELD_INPUT_CLASS}
                            />
                            {/* Preset pills for duration */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {["3 Days", "5 Days", "7 Days", "14 Days", "1 Month"].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => updateMedicine(index, "duration", preset)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-2.5 py-1 rounded-md transition-colors"
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row: Instructions (Full Width) */}
                        <div>
                          <label className={FIELD_LABEL_CLASS}>
                            Instructions & Administration
                          </label>
                          <input
                            type="text"
                            value={med.instructions}
                            onChange={(e) =>
                              updateMedicine(index, "instructions", e.target.value)
                            }
                            placeholder="e.g. Take after meals with plenty of water, avoid dairy"
                            className={FIELD_INPUT_CLASS}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Prominent + Add Medicine Button */}
                  <button
                    type="button"
                    onClick={addMedicineRow}
                    className="w-full py-3.5 rounded-xl border-2 border-dashed border-teal-700/80 bg-teal-950/40 hover:bg-teal-950/70 text-teal-300 font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus size={16} />
                    + Add Another Medicine Row
                  </button>
                </div>
              </div>

              {/* =============================================================
                  ANCILLARY SECTION: LAB TESTS, ADVICE & APPOINTMENT
                 ============================================================= */}
              <div className="space-y-5">
                {/* Prescribe Lab Tests */}
                <div>
                  <label className={FIELD_LABEL_CLASS}>
                    Prescribe Lab Tests (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={labTests}
                    onChange={(e) => setLabTests(e.target.value)}
                    placeholder="e.g. CBC, Serum Creatinine, Liver Function Test (LFT), Lipid Profile"
                    className={FIELD_INPUT_CLASS}
                  />
                  {/* Quick Lab Tests Suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">
                      Common tests:
                    </span>
                    {QUICK_LAB_TESTS.map((test) => (
                      <button
                        key={test}
                        type="button"
                        onClick={() => appendQuickItem(setLabTests, labTests, test)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-2.5 py-1 rounded-md transition-colors"
                      >
                        + {test}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patient Advice */}
                <div>
                  <label className={FIELD_LABEL_CLASS}>
                    Patient Advice & Lifestyle Guidance
                  </label>
                  <textarea
                    value={patientAdvice}
                    onChange={(e) => setPatientAdvice(e.target.value)}
                    placeholder="Diet constraints, bed rest advice, hydration guidance (e.g. 8 glasses/day), warning signs to return..."
                    rows={3}
                    className={`${FIELD_INPUT_CLASS} resize-y`}
                  />
                </div>

                {/* Next Follow-Up Appointment Date */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Next Follow-Up Appointment Date
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <input
                        type="date"
                        min={todayFormatted}
                        value={nextAppointment}
                        onChange={(e) => setNextAppointment(e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-700 text-white text-sm rounded-xl p-3 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none transition-all [color-scheme:dark]"
                      />
                    </div>
                    {/* Quick follow-up buttons */}
                    <div className="sm:col-span-6 flex flex-wrap items-center gap-1.5">
                      {[
                        { label: "+ 3 Days", days: 3 },
                        { label: "+ 1 Week", days: 7 },
                        { label: "+ 2 Weeks", days: 14 },
                        { label: "+ 1 Month", days: 30 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setQuickFollowUp(item.days)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom spacing to ensure clear scrolling above footer */}
              <div className="h-6" />
            </form>

            {/* =============================================================
                ACTION CTA GROUP (FIXED BOTTOM BAR)
               ============================================================= */}
            <div className="shrink-0 border-t border-slate-800 bg-slate-950 px-4 sm:px-6 py-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400 hidden sm:block">
                Patient: <strong className="text-white">{patient.name}</strong>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-5 py-3.5 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCompleteConsultation}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Dispatching Prescription...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Checkup & Dispatch WhatsApp Prescription</span>
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
