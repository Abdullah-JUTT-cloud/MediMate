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
  ChevronDown,
  ChevronUp,
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

// Frequency presets
const FREQUENCY_PRESETS = ["1-0-1", "1-1-1", "1-0-0", "0-0-1", "2x Daily"];

// Duration presets
const DURATION_PRESETS = ["3 Days", "5 Days", "7 Days", "14 Days", "1 Month"];

const formatVisitDate = (dateVal) => {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

// Clean, modern input styling with light theme
const FIELD_INPUT_CLASS =
  "w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg p-3 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none placeholder:text-slate-400 font-normal transition-all";

const FIELD_LABEL_CLASS =
  "text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2 block";

// Accordion component for patient history
const HistoryAccordion = ({ children, title, date, visitNumber, isOpen, onToggle }) => {
  return (
    <article className="bg-white border border-slate-200 rounded-xl p-4 mb-3 shadow-sm last:mb-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-1 -m-1 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Calendar size={12} className="text-teal-600" />
            {date}
          </span>
          <span className="text-sm font-semibold text-slate-800">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Visit #{visitNumber}
          </span>
          {isOpen ? (
            <ChevronUp size={18} className="text-slate-500" />
          ) : (
            <ChevronDown size={18} className="text-slate-500" />
          )}
        </div>
      </button>
      {isOpen && <div className="mt-4 pt-4 border-t border-slate-100">{children}</div>}
    </article>
  );
};

// Medicine row component
const MedicineRow = ({
  index,
  medicine,
  onUpdate,
  onRemove,
  isLast,
}) => {
  const [activeFrequency, setActiveFrequency] = useState(medicine.frequency || "");
  const [activeDuration, setActiveDuration] = useState(medicine.duration || "");

  const handleFrequencySelect = (preset) => {
    setActiveFrequency(preset);
    onUpdate(index, "frequency", preset);
  };

  const handleDurationSelect = (preset) => {
    setActiveDuration(preset);
    onUpdate(index, "duration", preset);
  };

  return (
    <div className="bg-white border border-slate-200 p-4 rounded-lg mb-3 last:mb-0 shadow-sm">
      {/* Row header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Medicine #{index + 1}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          aria-label={`Remove medicine #${index + 1}`}
          className="text-rose-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Medicine Name & Dosage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="md:col-span-2">
          <label className={FIELD_LABEL_CLASS}>
            Medicine Name & Formulation
          </label>
          <input
            type="text"
            value={medicine.name}
            onChange={(e) => onUpdate(index, "name", e.target.value)}
            placeholder="e.g. Augmentin, Brufen, Panadol Extra"
            className={FIELD_INPUT_CLASS}
          />
        </div>
        <div className="md:col-span-1">
          <label className={FIELD_LABEL_CLASS}>
            Dosage
          </label>
          <input
            type="text"
            value={medicine.dosage}
            onChange={(e) => onUpdate(index, "dosage", e.target.value)}
            placeholder="e.g. 500mg, 1 tablet"
            className={FIELD_INPUT_CLASS}
          />
        </div>
      </div>

      {/* Frequency & Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className={FIELD_LABEL_CLASS}>
            Frequency
          </label>
          <input
            type="text"
            value={medicine.frequency}
            onChange={(e) => {
              onUpdate(index, "frequency", e.target.value);
              setActiveFrequency(e.target.value);
            }}
            placeholder="e.g. 1-0-1, 2x Daily"
            className={FIELD_INPUT_CLASS}
          />
          {/* Frequency preset buttons */}
          <div className="flex flex-wrap gap-1 mt-2">
            {FREQUENCY_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleFrequencySelect(preset)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  activeFrequency === preset
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={FIELD_LABEL_CLASS}>
            Duration
          </label>
          <input
            type="text"
            value={medicine.duration}
            onChange={(e) => {
              onUpdate(index, "duration", e.target.value);
              setActiveDuration(e.target.value);
            }}
            placeholder="e.g. 5 Days, 1 Week"
            className={FIELD_INPUT_CLASS}
          />
          {/* Duration preset buttons */}
          <div className="flex flex-wrap gap-1 mt-2">
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleDurationSelect(preset)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  activeDuration === preset
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label className={FIELD_LABEL_CLASS}>
          Instructions
        </label>
        <input
          type="text"
          value={medicine.instructions}
          onChange={(e) => onUpdate(index, "instructions", e.target.value)}
          placeholder="e.g. Take after meals with plenty of water"
          className={FIELD_INPUT_CLASS}
        />
      </div>
    </div>
  );
};

// Quick suggestion chip component
const QuickSuggestionChip = ({ item, onClick, selectedItems }) => {
  const isSelected = selectedItems.split(",").some((i) => i.trim() === item);
  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        isSelected
          ? "bg-teal-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
      }`}
    >
      + {item}
    </button>
  );
};

export default function ConsultationWorkspaceRedesigned({
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
  const [expandedHistory, setExpandedHistory] = useState({});

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
      setExpandedHistory({});
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

  // Toggle history accordion
  const toggleHistory = (index) => {
    setExpandedHistory((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
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
      className="fixed inset-0 z-50 flex overflow-hidden"
    >
      {/* Light overlay backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Main container - clean, modern clinical workspace */}
      <div className="relative z-10 flex h-full w-full max-w-none flex-col bg-slate-50 text-slate-900 shadow-2xl">
        {/* =========================================================================
            STICKY TOP PATIENT BAR
           ========================================================================= */}
        <header className="shrink-0 bg-white border-b border-slate-200 p-4 shadow-sm sticky top-0 z-20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Patient Details Left Section */}
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Avatar Circle */}
              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-bold text-white shrink-0 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #0d9488, #0f766e)",
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
                    className="text-lg font-bold text-slate-900 truncate"
                  >
                    {patient.name || "Unknown Patient"}
                  </h3>

                  {/* Status indicator pill */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 border border-teal-200">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
                    </span>
                    In Consultation
                  </span>

                  {appointment.isWalkIn && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                      Walk-In
                    </span>
                  )}
                </div>

                {/* Patient Metadata Sub-line */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 text-sm font-medium mt-1">
                  <span className="font-semibold text-slate-900">
                    Slot: {appointment.slot || "—"}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span>
                    {patient.age ? `${patient.age} Yrs` : "Age N/A"} ·{" "}
                    {patient.gender || "Gender N/A"}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Phone size={11} className="text-slate-500" />
                    {patient.phone || "No phone"}
                  </span>
                  {patient.bloodGroup && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">
                        {patient.bloodGroup}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Header Right Action */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
              {/* Financial Status Pill */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  appointment.paymentStatus === "PAID"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-amber-100 text-amber-700 border border-amber-200"
                }`}
              >
                {appointment.paymentStatus === "PAID" ? (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>✓ Paid Rs. {Number(appointment.paymentAmount || appointment.netAmount || 0).toLocaleString()}</span>
                  </>
                ) : (
                  <>
                    <Clock size={13} className="text-amber-600" />
                    <span>Pending Rs. {Number(appointment.paymentAmount || appointment.netAmount || originalFee).toLocaleString()}</span>
                  </>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close consultation workspace"
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1 text-xs font-semibold"
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
        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* ---------------------------------------------------------------------
              LEFT COLUMN: Patient History (35%)
             --------------------------------------------------------------------- */}
          <section
            aria-label="Patient clinical history"
            className="lg:col-span-5 flex flex-col h-full overflow-hidden bg-white"
          >
            {/* Column Header */}
            <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-teal-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Patient History
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 border border-teal-200">
                {history.length} Prior Visit{history.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Scrollable History Cards */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {history.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center shadow-sm space-y-3">
                  <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto border border-teal-200">
                    <Stethoscope size={22} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">
                      First Time Consultation
                    </h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-sm mx-auto">
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
                  const isExpanded = expandedHistory[idx];

                  return (
                    <HistoryAccordion
                      key={h._id || idx}
                      title={prescription.diagnosis || "Consultation"}
                      date={visitDate}
                      visitNumber={history.length - idx}
                      isOpen={isExpanded}
                      onToggle={() => toggleHistory(idx)}
                    >
                      {/* Diagnosis */}
                      {prescription.diagnosis && (
                        <div className="mb-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 mb-1 block">
                            Diagnosis
                          </span>
                          <p className="text-slate-900 text-sm font-medium leading-relaxed">
                            {prescription.diagnosis}
                          </p>
                        </div>
                      )}

                      {/* Diseases / Symptoms tags */}
                      {Array.isArray(h.diseases) && h.diseases.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {h.diseases.map((dis, dIdx) => (
                            <span
                              key={dIdx}
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {dis}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Doctor Clinical Notes - Conditionally rendered */}
                      {h.notes && h.notes.trim() !== "none" && (
                        <div className="mb-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 mb-1 block">
                            Doctor Notes
                          </span>
                          <div className="text-slate-800 text-sm font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                            {h.notes}
                          </div>
                        </div>
                      )}

                      {/* Prescribed Medicines List - Conditionally rendered */}
                      {meds.length > 0 && (
                        <div className="mb-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 mb-1 block">
                            Prescribed Medicines ({meds.length})
                          </span>
                          <div className="space-y-2">
                            {meds.map((med, mIdx) => (
                              <div
                                key={mIdx}
                                className="bg-white border border-slate-200 text-slate-800 px-3 py-2 rounded-lg text-xs font-medium shadow-sm"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                  <span className="font-bold text-slate-900">
                                    {med.name} {med.dosage}
                                  </span>
                                  <span className="flex items-center gap-1.5 text-slate-600">
                                    <span className="font-bold text-teal-600">
                                      {med.frequency}
                                    </span>
                                    <span>• {med.duration}</span>
                                  </span>
                                </div>
                                {med.instructions && med.instructions.trim() !== "" && (
                                  <p className="text-slate-500 italic mt-1">
                                    {med.instructions}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lab Tests Section - Conditionally rendered */}
                      {labTestsList.length > 0 && (
                        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 mb-4">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                            <FlaskConical size={14} className="text-teal-600" />
                            Prescribed Lab Tests ({labTestsList.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {labTestsList.map((test, tIdx) => (
                              <span
                                key={tIdx}
                                className="bg-teal-100 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-lg text-xs font-semibold"
                              >
                                {test}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Patient Advice - Conditionally rendered */}
                      {prescription.patientAdvice && prescription.patientAdvice.trim() !== "" && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                            <Sparkles size={13} className="text-amber-600" />
                            Patient Advice
                          </span>
                          <p className="text-slate-800 text-sm font-medium leading-relaxed mt-1">
                            {prescription.patientAdvice}
                          </p>
                        </div>
                      )}

                      {/* Next Appointment Date - Conditionally rendered */}
                      {prescription.nextAppointment && (
                        <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                          <Calendar size={13} className="text-teal-600" />
                          <span>
                            Next Follow-Up:{" "}
                            <strong className="text-slate-900">
                              {formatVisitDate(prescription.nextAppointment)}
                            </strong>
                          </span>
                        </div>
                      )}
                    </HistoryAccordion>
                  );
                })
              )}
            </div>
          </section>

          {/* ---------------------------------------------------------------------
              RIGHT COLUMN: Active Examination & Prescription Form (65%)
             --------------------------------------------------------------------- */}
          <section
            aria-label="Active examination and prescription form"
            className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-slate-50"
          >
            {/* Column Header */}
            <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope size={16} className="text-teal-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Active Examination & Prescription
                </h4>
              </div>
              <span className="text-xs text-slate-500 font-medium">
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
              {/* Module 1: Chief Complaints & Symptoms */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h5 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
                  Chief Complaints & Symptoms
                </h5>
                <div>
                  <label className={FIELD_LABEL_CLASS}>
                    Common Diseases / Symptoms
                  </label>
                  <input
                    type="text"
                    value={diseases}
                    onChange={(e) => setDiseases(e.target.value)}
                    placeholder="e.g. Hypertension, Seasonal Flu, Type 2 Diabetes"
                    className={FIELD_INPUT_CLASS}
                  />
                  {/* Quick suggestion chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {QUICK_DISEASES.map((item) => (
                      <QuickSuggestionChip
                        key={item}
                        item={item}
                        onClick={() => appendQuickItem(setDiseases, diseases, item)}
                        selectedItems={diseases}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Module 2: Vitals & Clinical Examination */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h5 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
                  Vitals & Clinical Examination
                </h5>
                <div>
                  <label className={FIELD_LABEL_CLASS}>
                    Clinical Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Clinical examination findings, vitals (BP, pulse, temp), symptoms timeline, systemic review..."
                    rows={4}
                    className={`${FIELD_INPUT_CLASS} resize-y`}
                  />
                </div>
              </div>

              {/* Module 3: Dynamic Prescription Builder */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Pill size={17} className="text-teal-600" />
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                      Prescription Builder
                    </span>
                  </div>
                  <span className="text-xs text-rose-500 font-semibold">
                    * Required fields
                  </span>
                </div>

                {/* Diagnosis (Required) */}
                <div className="mb-4">
                  <label className={FIELD_LABEL_CLASS}>
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
                    className={`w-full bg-white border text-slate-900 text-sm rounded-lg p-3 outline-none placeholder:text-slate-400 font-normal transition-all ${
                      formErrors.diagnosis
                        ? "border-rose-500 ring-1 ring-rose-500/10"
                        : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                    }`}
                  />
                  {formErrors.diagnosis && (
                    <p className="text-xs font-bold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={13} /> {formErrors.diagnosis}
                    </p>
                  )}
                </div>

                {/* Medicine Rows */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Prescribed Medicines <span className="text-rose-500">*</span> ({medicines.length})
                    </label>
                    <button
                      type="button"
                      onClick={addMedicineRow}
                      className="bg-teal-100 hover:bg-teal-200 text-teal-700 border border-teal-200 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Plus size={13} /> Add Medicine
                    </button>
                  </div>

                  {formErrors.medicines && (
                    <p className="text-xs font-bold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {formErrors.medicines}
                    </p>
                  )}

                  {/* Render medicine rows */}
                  {medicines.map((med, index) => (
                    <MedicineRow
                      key={index}
                      index={index}
                      medicine={med}
                      onUpdate={updateMedicine}
                      onRemove={removeMedicineRow}
                      isLast={index === medicines.length - 1}
                    />
                  ))}

                  {/* Add another medicine button (full width) */}
                  <button
                    type="button"
                    onClick={addMedicineRow}
                    className="w-full py-3.5 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus size={16} />
                    + Add Another Medicine
                  </button>
                </div>
              </div>

              {/* Module 4: Lab Diagnostics & Follow-up */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h5 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
                  Lab Diagnostics & Follow-up
                </h5>

                {/* Lab Tests */}
                <div className="mb-4">
                  <label className={FIELD_LABEL_CLASS}>
                    Prescribe Lab Tests
                  </label>
                  <input
                    type="text"
                    value={labTests}
                    onChange={(e) => setLabTests(e.target.value)}
                    placeholder="e.g. CBC, Serum Creatinine, Liver Function Test (LFT)"
                    className={FIELD_INPUT_CLASS}
                  />
                  {/* Quick lab test suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {QUICK_LAB_TESTS.map((test) => (
                      <QuickSuggestionChip
                        key={test}
                        item={test}
                        onClick={() => appendQuickItem(setLabTests, labTests, test)}
                        selectedItems={labTests}
                      />
                    ))}
                  </div>
                </div>

                {/* Patient Advice */}
                <div className="mb-4">
                  <label className={FIELD_LABEL_CLASS}>
                    Patient Advice & Lifestyle Guidance
                  </label>
                  <textarea
                    value={patientAdvice}
                    onChange={(e) => setPatientAdvice(e.target.value)}
                    placeholder="Diet constraints, bed rest advice, hydration guidance, warning signs to return..."
                    rows={3}
                    className={`${FIELD_INPUT_CLASS} resize-y`}
                  />
                </div>

                {/* Next Follow-Up Appointment */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
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
                        className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg p-3 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none transition-all [color-scheme:dark]"
                      />
                    </div>
                    {/* Quick follow-up buttons */}
                    <div className="sm:col-span-6 flex flex-wrap items-center gap-1.5">
                      {[
                        { label: "+3 Days", days: 3 },
                        { label: "+1 Week", days: 7 },
                        { label: "+2 Weeks", days: 14 },
                        { label: "+1 Month", days: 30 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setQuickFollowUp(item.days)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Financial Adjustments Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Fee & Billing Summary
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Standard Fee: Rs. {originalFee.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className={FIELD_LABEL_CLASS}>
                        Consultation Discount (PKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={consultationDiscount}
                        onChange={(e) => setConsultationDiscount(e.target.value)}
                        placeholder="0"
                        className={FIELD_INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className={FIELD_LABEL_CLASS}>
                        Lab / Ancillary Fee (PKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={labFee}
                        onChange={(e) => setLabFee(e.target.value)}
                        placeholder="0"
                        className={FIELD_INPUT_CLASS}
                      />
                    </div>
                  </div>

                  {/* Net Calculated Fee Pill */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-xs font-bold text-slate-600">
                      Net Total Payable:
                    </span>
                    <span className="text-sm font-bold text-teal-600 font-mono">
                      Rs. {totalPayable.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom spacing */}
              <div className="h-6" />
            </form>

            {/* =============================================================
                STICKY ACTION FOOTER
               ============================================================= */}
            <div className="shrink-0 border-t border-slate-200 bg-white px-4 sm:px-6 py-4 shadow-lg sticky bottom-0 z-20">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-600 sm:block">
                  Patient: <strong className="text-slate-900">{patient.name}</strong> · Net: <strong className="text-teal-600">Rs. {totalPayable.toLocaleString()}</strong>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-initial px-5 py-3.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-sm transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteConsultation}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
