import { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  FileText,
  Stethoscope,
  Pill,
  FlaskConical,
  Send,
  User,
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
  const [consultationDiscount, setConsultationDiscount] = useState("0");
  const [labFee, setLabFee] = useState("");
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
      setConsultationDiscount("0");
      setLabFee("");
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

  // Financial calculations
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
    const d = Number(consultationDiscount) || 0;
    return Math.max(0, Math.min(d, originalFee));
  }, [consultationDiscount, originalFee]);

  const netConsultationFee = useMemo(() => {
    return Math.max(0, originalFee - discountAmount);
  }, [originalFee, discountAmount]);

  const ancillaryFee = useMemo(() => {
    const l = Number(labFee) || 0;
    return Math.max(0, l);
  }, [labFee]);

  const totalPayable = useMemo(() => {
    return netConsultationFee + ancillaryFee;
  }, [netConsultationFee, ancillaryFee]);

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
          ancillaryFee,
          description: "Consultation & Prescription",
          method: "Cash",
          isPaid: true,
        },
        labFee: ancillaryFee,
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

      {/* Main Slide-in drawer container */}
      <div className="relative z-10 flex h-full w-full max-w-none flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)] shadow-2xl transition-transform duration-300">
        {/* =========================================================================
            HIGH-CONTRAST CLINICAL DRAWER HEADER
           ========================================================================= */}
        <header className="shrink-0 border-b border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 px-4 sm:px-6 py-3.5 shadow-sm">
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
                    className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate"
                  >
                    {patient.name || "Unknown Patient"}
                  </h3>

                  {/* Status indicator pill */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                    </span>
                    In Consultation
                  </span>

                  {appointment.isWalkIn && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                      Walk-In
                    </span>
                  )}
                </div>

                {/* Patient Clinical Subtext */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300 mt-1">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
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
                      <span className="font-bold text-rose-600 dark:text-rose-400">
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
                  appointment.paymentStatus === "PAID"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/60"
                    : "bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/60"
                }`}
              >
                {appointment.paymentStatus === "PAID" ? (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span>✓ Paid Rs. {Number(appointment.paymentAmount || appointment.netAmount || 0).toLocaleString()}</span>
                  </>
                ) : (
                  <>
                    <Clock size={13} className="text-amber-600 dark:text-amber-400" />
                    <span>Pending Rs. {Number(appointment.paymentAmount || appointment.netAmount || originalFee).toLocaleString()}</span>
                  </>
                )}
              </div>

              {/* Close Drawer Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close consultation workspace"
                className="p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs font-bold"
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
        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-700/80">
          {/* ---------------------------------------------------------------------
              LEFT COLUMN: High-Legibility Patient History
             --------------------------------------------------------------------- */}
          <section
            aria-label="Patient clinical history"
            className="lg:col-span-5 flex flex-col h-full overflow-hidden bg-slate-50/60 dark:bg-slate-900/40"
          >
            {/* Column Header */}
            <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-teal-600 dark:text-teal-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Patient History
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800">
                {history.length} Prior Visit{history.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Scrollable History Cards */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {history.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center shadow-sm space-y-3">
                  <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-800">
                    <Stethoscope size={22} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      First Time Consultation
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed max-w-sm mx-auto">
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
                      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4 transition-all hover:border-teal-500/40"
                    >
                      {/* Date Badge & Meta */}
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 shadow-2xs">
                          <Calendar size={12} className="text-teal-600 dark:text-teal-400" />
                          {visitDate}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Visit #{history.length - idx}
                        </span>
                      </div>

                      {/* Diagnosis & Notes */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                          Diagnosis
                        </span>
                        <h5 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {prescription.diagnosis || "No specific diagnosis recorded"}
                        </h5>

                        {/* Diseases / Symptoms tags */}
                        {Array.isArray(h.diseases) && h.diseases.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {h.diseases.map((dis, dIdx) => (
                              <span
                                key={dIdx}
                                className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
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
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                            Doctor Notes
                          </span>
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80">
                            {h.notes}
                          </div>
                        </div>
                      )}

                      {/* Prescribed Medicines List */}
                      {meds.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                            Prescribed Medicines ({meds.length})
                          </span>
                          <div className="space-y-2">
                            {meds.map((med, mIdx) => (
                              <div
                                key={mIdx}
                                className="rounded-xl p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 space-y-1 shadow-2xs"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                                    {med.name} {med.dosage}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <span className="font-bold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80">
                                      {med.frequency}
                                    </span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      • {med.duration}
                                    </span>
                                  </div>
                                </div>
                                {med.instructions && (
                                  <p className="text-xs text-slate-600 dark:text-slate-400 italic">
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
                        <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 rounded-xl p-3.5 space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                            <FlaskConical size={14} className="text-teal-600 dark:text-teal-400" />
                            Prescribed Lab Tests ({labTestsList.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {labTestsList.map((test, tIdx) => (
                              <span
                                key={tIdx}
                                className="bg-white dark:bg-teal-900/60 text-teal-950 dark:text-teal-100 border border-teal-300 dark:border-teal-700 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs"
                              >
                                {test}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Patient Advice in readable prose */}
                      {prescription.patientAdvice && (
                        <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                            <Sparkles size={13} className="text-amber-600 dark:text-amber-400" />
                            Patient Advice
                          </span>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                            {prescription.patientAdvice}
                          </p>
                        </div>
                      )}

                      {/* Next Appointment Date if recorded */}
                      {prescription.nextAppointment && (
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 pt-1">
                          <Calendar size={13} className="text-teal-600 dark:text-teal-400" />
                          <span>
                            Next Follow-Up:{" "}
                            <strong className="text-slate-900 dark:text-white">
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
            className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900"
          >
            {/* Column Header */}
            <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope size={16} className="text-teal-600 dark:text-teal-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  New Checkup & Prescription
                </h4>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
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
                <label className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 block uppercase">
                  Common Diseases / Symptoms (Comma Separated)
                </label>
                <input
                  type="text"
                  value={diseases}
                  onChange={(e) => setDiseases(e.target.value)}
                  placeholder="e.g. Hypertension, Seasonal Flu, Type 2 Diabetes"
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 py-3 px-4 text-base min-h-[44px] rounded-xl outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs"
                />
                {/* Quick Add Suggestion Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mr-1">
                    Quick suggestions:
                  </span>
                  {QUICK_DISEASES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => appendQuickItem(setDiseases, diseases, item)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-teal-50 hover:text-teal-800 dark:hover:bg-teal-950/60 dark:hover:text-teal-200 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Clinical Examination Notes */}
              <div>
                <label className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 block uppercase">
                  Clinical Examination & Vitals Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Clinical examination findings, vitals (BP, pulse, temp), symptoms timeline, systemic review..."
                  rows={3}
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 py-3 px-4 text-base min-h-[80px] rounded-xl outline-none resize-y transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs"
                />
              </div>

              {/* =============================================================
                  PRESCRIPTION SECTION CARD
                 ============================================================= */}
              <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Pill size={17} className="text-teal-600 dark:text-teal-400" />
                    <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider">
                      Prescription Details
                    </span>
                  </div>
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                    * Required fields
                  </span>
                </div>

                {/* Diagnosis (Required) */}
                <div>
                  <label className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 block uppercase">
                    Diagnosis <span className="text-rose-500">*</span>
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
                    className={`w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border ${
                      formErrors.diagnosis
                        ? "border-rose-500 ring-2 ring-rose-500/20"
                        : "border-slate-300 dark:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
                    } py-3 px-4 text-base min-h-[44px] rounded-xl outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs font-semibold`}
                  />
                  {formErrors.diagnosis && (
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={13} /> {formErrors.diagnosis}
                    </p>
                  )}
                </div>

                {/* =============================================================
                    PRESCRIPTION MEDICINES GRID (SPACIOUS LAYOUT)
                   ============================================================= */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase">
                      Prescribed Medicines <span className="text-rose-500">*</span> ({medicines.length})
                    </label>
                    <button
                      type="button"
                      onClick={addMedicineRow}
                      className="bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 dark:text-teal-200 dark:border-teal-700 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Plus size={13} /> Add Medicine
                    </button>
                  </div>

                  {formErrors.medicines && (
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertCircle size={13} /> {formErrors.medicines}
                    </p>
                  )}

                  {/* Medicines List */}
                  <div className="space-y-4">
                    {medicines.map((med, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-4 space-y-3 shadow-sm transition-all"
                      >
                        {/* Medicine Row Top Action Bar */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-xs font-bold flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                              Medicine #{index + 1}
                            </span>
                          </div>

                          {/* Delete Button (Clear, red-tinted) */}
                          <button
                            type="button"
                            onClick={() => removeMedicineRow(index)}
                            aria-label={`Remove medicine #${index + 1}`}
                            className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-300 p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <Trash2 size={14} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>

                        {/* Top Fields: Medicine Name & Formulation (wide flex-2) + Dosage */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          {/* Medicine Name & Formulation */}
                          <div className="sm:col-span-8">
                            <label className="text-[11px] font-bold tracking-wider text-slate-600 dark:text-slate-400 mb-1 block uppercase">
                              Medicine Name & Formulation <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) =>
                                updateMedicine(index, "name", e.target.value)
                              }
                              placeholder="e.g. Augmentin, Brufen, Panadol Extra"
                              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 py-3 px-4 text-base min-h-[44px] rounded-xl outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs font-semibold"
                            />
                          </div>

                          {/* Dosage */}
                          <div className="sm:col-span-4">
                            <label className="text-[11px] font-bold tracking-wider text-slate-600 dark:text-slate-400 mb-1 block uppercase">
                              Dosage <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={(e) =>
                                updateMedicine(index, "dosage", e.target.value)
                              }
                              placeholder="e.g. 500mg, 1 tablet"
                              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 py-3 px-4 text-base min-h-[44px] rounded-xl outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Mid Fields: Frequency + Duration */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Frequency */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase">
                                Frequency <span className="text-rose-500">*</span>
                              </label>
                            </div>
                            <input
                              type="text"
                              value={med.frequency}
                              onChange={(e) =>
                                updateMedicine(index, "frequency", e.target.value)
                              }
                              placeholder="e.g. 1-0-1, 2x Daily, Once Daily"
                              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 py-3 px-4 text-base min-h-[44px] rounded-xl outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs"
                            />
                            {/* Preset pills for rapid entry */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {["1-0-1", "1-1-1", "1-0-0", "0-0-1", "2x Daily"].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => updateMedicine(index, "frequency", preset)}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-teal-50 hover:text-teal-800 dark:hover:bg-teal-900/60 transition-colors"
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Duration */}
                          <div>
                            <label className="text-[11px] font-bold tracking-wider text-slate-600 dark:text-slate-400 mb-1 block uppercase">
                              Duration <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={med.duration}
                              onChange={(e) =>
                                updateMedicine(index, "duration", e.target.value)
                              }
                              placeholder="e.g. 5 Days, 1 Week, 10 Days"
                              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 py-3 px-4 text-base min-h-[44px] rounded-xl outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs"
                            />
                            {/* Preset pills for duration */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {["3 Days", "5 Days", "7 Days", "14 Days", "1 Month"].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => updateMedicine(index, "duration", preset)}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-teal-50 hover:text-teal-800 dark:hover:bg-teal-900/60 transition-colors"
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row: Instructions (Full Width) */}
                        <div>
                          <label className="text-[11px] font-bold tracking-wider text-slate-600 dark:text-slate-400 mb-1 block uppercase">
                            Instructions & Administration
                          </label>
                          <input
                            type="text"
                            value={med.instructions}
                            onChange={(e) =>
                              updateMedicine(index, "instructions", e.target.value)
                            }
                            placeholder="e.g. Take after meals with plenty of water, avoid dairy"
                            className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 py-3 px-4 text-base min-h-[44px] rounded-xl outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Prominent + Add Medicine Button */}
                  <button
                    type="button"
                    onClick={addMedicineRow}
                    className="w-full py-3.5 rounded-xl border-2 border-dashed border-teal-300 dark:border-teal-700/80 bg-teal-50/50 hover:bg-teal-100/60 dark:bg-teal-950/30 dark:hover:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-2xs"
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
                  <label className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 block uppercase">
                    Prescribe Lab Tests (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={labTests}
                    onChange={(e) => setLabTests(e.target.value)}
                    placeholder="e.g. CBC, Serum Creatinine, Liver Function Test (LFT), Lipid Profile"
                    className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 py-3 px-4 text-base min-h-[44px] rounded-xl outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs"
                  />
                  {/* Quick Lab Tests Suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mr-1">
                      Common tests:
                    </span>
                    {QUICK_LAB_TESTS.map((test) => (
                      <button
                        key={test}
                        type="button"
                        onClick={() => appendQuickItem(setLabTests, labTests, test)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-200 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 transition-colors"
                      >
                        + {test}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patient Advice */}
                <div>
                  <label className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 block uppercase">
                    Patient Advice & Lifestyle Guidance
                  </label>
                  <textarea
                    value={patientAdvice}
                    onChange={(e) => setPatientAdvice(e.target.value)}
                    placeholder="Diet constraints, bed rest advice, hydration guidance (e.g. 8 glasses/day), warning signs to return..."
                    rows={3}
                    className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 py-3 px-4 text-base min-h-[80px] rounded-xl outline-none resize-y transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs"
                  />
                </div>

                {/* Next Follow-Up Appointment Date */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase">
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
                        className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 py-3 px-4 text-base min-h-[44px] rounded-xl outline-none transition-all shadow-2xs"
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
                          className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-teal-50 hover:text-teal-800 dark:hover:bg-teal-900/60 border border-slate-200 dark:border-slate-700 transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Financial Adjustments Card */}
                <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Fee & Billing Summary
                    </span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Standard Fee: Rs. {originalFee.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold tracking-wider text-slate-600 dark:text-slate-400 mb-1 block uppercase">
                        Consultation Discount (PKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={consultationDiscount}
                        onChange={(e) => setConsultationDiscount(e.target.value)}
                        placeholder="0"
                        className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 py-2.5 px-3 text-sm rounded-xl outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold tracking-wider text-slate-600 dark:text-slate-400 mb-1 block uppercase">
                        Lab / Ancillary Fee (PKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={labFee}
                        onChange={(e) => setLabFee(e.target.value)}
                        placeholder="0"
                        className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 py-2.5 px-3 text-sm rounded-xl outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Net Calculated Fee Pill */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Net Total Payable:
                    </span>
                    <span className="text-sm font-bold text-teal-700 dark:text-teal-300 font-mono">
                      Rs. {totalPayable.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom spacing to ensure clear scrolling above footer */}
              <div className="h-6" />
            </form>

            {/* =============================================================
                ACTION CTA GROUP (FIXED BOTTOM BAR)
               ============================================================= */}
            <div className="shrink-0 border-t border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 px-4 sm:px-6 py-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600 dark:text-slate-400 hidden sm:block">
                Patient: <strong className="text-slate-900 dark:text-white">{patient.name}</strong> · Net: <strong className="text-teal-700 dark:text-teal-300">Rs. {totalPayable.toLocaleString()}</strong>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-5 py-3.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCompleteConsultation}
                  disabled={isSubmitting}
                  className="flex-2 sm:flex-initial bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
