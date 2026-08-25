/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useAuthStore from "../store/authStore";
import PrescriptionModal from "./PrescriptionModal";
import {
  RowSkeleton,
  ProfileHeaderSkeleton,
  FormFieldSkeleton,
} from "../components/SkeletonLoaders";
import { Skeleton } from "@mui/material";
import ConfirmDialog from "../components/ConfirmDialog";
import useConfirmDialog from "../hooks/useConfirmDialog";

const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown",
];
const GENDERS = ["Male", "Female", "Other"];
const FREQUENCIES = [
  "Once a day",
  "Twice a day",
  "Three times a day",
  "Four times a day",
  "Every 8 hours",
  "Every 12 hours",
  "As needed",
];
const DURATIONS = [
  "3 days",
  "5 days",
  "7 days",
  "10 days",
  "14 days",
  "1 month",
  "3 months",
  "Ongoing",
];

const getInitials = (name) =>
  name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "P";
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const emptyMedicine = () => ({
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
});
const getTodayDateInput = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
};
const DAY_NAME_TO_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};
const DAY_ORDER = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const parseDateInputLocal = (value) => {
  const [year, month, day] = String(value || "")
    .split("-")
    .map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

// Organic Design Tokens
const ORGANIC = {
  // Colors
  bg: "var(--color-bg)",
  fg: "var(--color-text-primary)",
  primary: "var(--color-primary)",
  primaryFg: "var(--color-on-primary)",
  secondary: "var(--color-secondary)",
  secondaryFg: "var(--color-on-primary)",
  accent: "var(--color-accent)",
  accentFg: "var(--color-text-primary)",
  muted: "var(--color-bg-soft)",
  mutedFg: "var(--color-text-secondary)",
  border: "var(--color-border)",
  destructive: "var(--color-danger)",
  // Shadows - soft, colored
  shadowSoft: "0 4px 20px -2px rgba(93, 112, 82, 0.15)",
  shadowFloat: "0 10px 40px -10px rgba(193, 140, 93, 0.2)",
};

const S = {
  // Organic card styling with soft borders and rounded containers
  input: {
    background:
      "color-mix(in srgb, var(--color-card-elevated) 82%, var(--color-bg) 18%)",
    border:
      "1.5px solid color-mix(in srgb, var(--color-border) 82%, transparent)",
    color: ORGANIC.fg,
    borderRadius: "999px",
  },
  card: {
    background: "color-mix(in srgb, var(--color-card) 92%, var(--color-bg) 8%)",
    border:
      "1px solid color-mix(in srgb, var(--color-border) 78%, transparent)",
    borderRadius: "2rem",
    boxShadow: ORGANIC.shadowSoft,
  },
  section: {
    background:
      "color-mix(in srgb, var(--color-bg-soft) 48%, var(--color-card) 52%)",
    border:
      "1px solid color-mix(in srgb, var(--color-border) 76%, transparent)",
    borderRadius: "1.5rem",
  },
};

const focusInput = (e) => {
  e.target.style.border = `1.5px solid ${ORGANIC.primary}`;
  e.target.style.boxShadow = `0 0 0 3px color-mix(in srgb, var(--color-primary) 22%, transparent)`;
};
const blurInput = (e) => {
  e.target.style.border =
    "1.5px solid color-mix(in srgb, var(--color-border) 82%, transparent)";
  e.target.style.boxShadow = "none";
};
const inputCls =
  "w-full px-5 py-3 rounded-full text-sm outline-none transition-all placeholder:text-[var(--color-text-secondary)]";

function LocationTag({ location }) {
  const isClinic = location.locationType === "Clinic";
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium transition-all"
      style={{
        background: isClinic
          ? `rgba(93, 112, 82, 0.12)`
          : `rgba(193, 140, 93, 0.12)`,
        border: `1px solid ${isClinic ? `rgba(93, 112, 82, 0.24)` : `rgba(193, 140, 93, 0.24)`}`,
        color: isClinic ? ORGANIC.primary : ORGANIC.secondary,
      }}
    >
      {isClinic ? "🏥" : "🏨"} {location.locationName}
    </span>
  );
}

function BackButton({ onClick, label = "Back" }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm font-semibold transition-all mb-6 group hover:translate-x-1"
      style={{ color: ORGANIC.primary }}
    >
      ← {label}
    </button>
  );
}

function SectionLabel({ text }) {
  return (
    <p
      className="text-xs font-bold uppercase tracking-widest mb-3"
      style={{ color: ORGANIC.mutedFg }}
    >
      {text}
    </p>
  );
}

function TagInput({ value, onChange, onAdd, onRemove, items, placeholder }) {
  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder={placeholder}
          className="flex-1 px-5 py-3 rounded-full text-sm outline-none transition-all"
          style={S.input}
          onFocus={focusInput}
          onBlur={blurInput}
        />
        <button
          onClick={onAdd}
          className="px-6 py-3 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
          style={{
            background: `rgba(93, 112, 82, 0.1)`,
            color: ORGANIC.primary,
            border: `1px solid rgba(93, 112, 82, 0.24)`,
          }}
        >
          + Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: `rgba(93, 112, 82, 0.1)`,
                border: `1px solid rgba(93, 112, 82, 0.24)`,
                color: ORGANIC.primary,
              }}
            >
              {item}
              <button onClick={() => onRemove(i)} className="hover:opacity-60">
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECKUP FORM
// ══════════════════════════════════════════════════════════════════════════════
function CheckupForm({ patient, existingCheckup, onBack, onSaved }) {
  const { doctor } = useAuthStore();
  const isEdit = !!existingCheckup;
  const minAppointmentDate = getTodayDateInput();

  const [diseases, setDiseases] = useState(existingCheckup?.diseases || []);
  const [diseaseInput, setDiseaseInput] = useState("");
  const [notes, setNotes] = useState(existingCheckup?.notes || "");
  const [diagnosis, setDiagnosis] = useState(
    existingCheckup?.prescription?.diagnosis || "",
  );
  const [nextAppointment, setNextAppointment] = useState(
    existingCheckup?.prescription?.nextAppointment
      ? new Date(existingCheckup.prescription.nextAppointment)
          .toISOString()
          .split("T")[0]
      : "",
  );
  const [medicines, setMedicines] = useState(
    existingCheckup?.prescription?.medicines?.length
      ? existingCheckup.prescription.medicines
      : [emptyMedicine()],
  );
  const [labTests, setLabTests] = useState(
    existingCheckup?.prescription?.labTests || [],
  );
  const [labInput, setLabInput] = useState("");
  const [patientAdvice, setPatientAdvice] = useState(
    existingCheckup?.prescription?.patientAdvice || "",
  );
  const [visitedFacility, setVisitedFacility] = useState(
    existingCheckup?.visitedFacility || null,
  );
  const [savedCheckupId, setSavedCheckupId] = useState(
    existingCheckup?._id || null,
  );
  const [currentPdfUrl, setCurrentPdfUrl] = useState(
    existingCheckup?.prescription?.pdfUrl || "",
  );
  const [prescriptionCheckup, setPrescriptionCheckup] = useState(null);
  const [autoGeneratePrescription, setAutoGeneratePrescription] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const doctorLocations = [
    ...(doctor?.clinics || []).map((c, i) => ({
      locationType: "Clinic",
      locationId: c._id || `clinic_${i}`,
      locationName: c.name,
      locationAddress: c.address,
      sessions: Array.isArray(c.sessions) ? c.sessions : [],
    })),
    ...(doctor?.hospitals || []).map((h, i) => ({
      locationType: "Hospital",
      locationId: h._id || `hospital_${i}`,
      locationName: h.name,
      locationAddress: h.address,
      sessions: Array.isArray(h.sessions) ? h.sessions : [],
    })),
  ];
  const normalizeVisitedFacility = (facility) => {
    if (!facility) return null;
    const matched = doctorLocations.find((loc) => {
      if (facility.locationId && loc.locationId) {
        return (
          loc.locationType === facility.locationType &&
          String(loc.locationId) === String(facility.locationId)
        );
      }
      return (
        loc.locationType === facility.locationType &&
        loc.locationName === facility.locationName
      );
    });
    if (matched) return matched;
    return {
      ...facility,
      sessions: Array.isArray(facility.sessions) ? facility.sessions : [],
    };
  };
  const selectedFacility = normalizeVisitedFacility(visitedFacility);
  const availableSessionDays = DAY_ORDER.filter((day) =>
    (selectedFacility?.sessions || []).some((session) => session?.day === day),
  );
  const availableSessionDayIndexes = new Set(
    availableSessionDays.map((day) => DAY_NAME_TO_INDEX[day]),
  );
  const availableSessionDaysLabel = availableSessionDays.join(", ");

  const canGenerate =
    diagnosis.trim().length > 0 &&
    medicines.some((m) => m.name.trim().length > 0);
  const isDateAllowedForSelectedFacility = (dateValue) => {
    if (!dateValue || !selectedFacility) return true;
    if (availableSessionDayIndexes.size === 0) return false;
    const dayIdx = parseDateInputLocal(dateValue).getDay();
    return availableSessionDayIndexes.has(dayIdx);
  };

  const validateNextAppointment = () => {
    if (!nextAppointment) return true;
    if (nextAppointment < minAppointmentDate) {
      toast.error("Next appointment cannot be in the past");
      return false;
    }
    if (selectedFacility && availableSessionDayIndexes.size === 0) {
      toast.error(
        `No session days configured for ${selectedFacility.locationName}. Update location sessions in Settings first.`,
      );
      return false;
    }
    if (!isDateAllowedForSelectedFacility(nextAppointment)) {
      toast.error(
        `Doctor is not available at ${selectedFacility.locationName} on this day. Available days: ${availableSessionDaysLabel || "none"}`,
      );
      return false;
    }
    return true;
  };
  const handleNextAppointmentChange = (value) => {
    if (!value) {
      setNextAppointment("");
      return;
    }
    if (!selectedFacility) {
      toast.error("Select visit location first");
      return;
    }
    if (!isDateAllowedForSelectedFacility(value)) {
      toast.error(
        `Only session days are allowed for ${selectedFacility.locationName}: ${availableSessionDaysLabel || "none"}`,
      );
      return;
    }
    setNextAppointment(value);
  };

  useEffect(() => {
    if (!nextAppointment || !selectedFacility) return;
    if (isDateAllowedForSelectedFacility(nextAppointment)) return;
    setNextAppointment("");
    toast.error(
      `Next appointment date cleared because it is not available for ${selectedFacility.locationName}.`,
    );
  }, [
    visitedFacility,
    nextAppointment,
    selectedFacility,
    availableSessionDaysLabel,
  ]);

  const updateMedicine = (i, field, val) =>
    setMedicines((p) =>
      p.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)),
    );
  const addMedicine = () => setMedicines((p) => [...p, emptyMedicine()]);
  const removeMedicine = (i) => {
    if (medicines.length === 1) {
      toast.error("At least one medicine required");
      return;
    }
    setMedicines((p) => p.filter((_, idx) => idx !== i));
  };

  const buildPayload = () => ({
    diseases,
    notes,
    visitedFacility: selectedFacility
      ? {
          locationType: selectedFacility.locationType,
          locationName: selectedFacility.locationName,
          locationAddress: selectedFacility.locationAddress,
        }
      : null,
    prescription: {
      diagnosis,
      nextAppointment: nextAppointment || undefined,
      medicines,
      labTests,
      patientAdvice,
      pdfUrl: currentPdfUrl,
    },
  });

  const handleGeneratePrescription = async () => {
    if (!canGenerate) return;
    if (!validateNextAppointment()) return;
    if (
      medicines.some(
        (m) =>
          !m.name.trim() || !m.dosage.trim() || !m.frequency || !m.duration,
      )
    ) {
      toast.error("Fill all required medicine fields");
      return;
    }
    setIsAutoSaving(true);
    try {
      let checkupId = savedCheckupId;
      if (!checkupId) {
        const res = await axiosInstance.post(
          `/checkups/${patient._id}`,
          buildPayload(),
        );
        checkupId = res.data.checkup._id;
        setSavedCheckupId(checkupId);
      } else {
        await axiosInstance.put(`/checkups/${checkupId}`, buildPayload());
      }
      // Pass current state labTests directly — this is key
      const tempCheckup = {
        _id: checkupId,
        createdAt: existingCheckup?.createdAt || new Date().toISOString(),
        prescription: {
          diagnosis,
          nextAppointment: nextAppointment || undefined,
          medicines: [...medicines],
          labTests: [...labTests],
          patientAdvice,
          pdfUrl: currentPdfUrl,
        },
        notes,
        visitedFacility: selectedFacility
          ? {
              locationType: selectedFacility.locationType,
              locationName: selectedFacility.locationName,
              locationAddress: selectedFacility.locationAddress,
            }
          : null,
      };
      setAutoGeneratePrescription(true);
      setPrescriptionCheckup(tempCheckup);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to auto-save checkup");
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleSave = async () => {
    if (!diagnosis.trim()) {
      toast.error("Diagnosis is required");
      return;
    }
    if (!validateNextAppointment()) return;
    if (
      medicines.some(
        (m) =>
          !m.name.trim() || !m.dosage.trim() || !m.frequency || !m.duration,
      )
    ) {
      toast.error("Fill all required medicine fields");
      return;
    }
    setIsSaving(true);
    try {
      let res;
      const id = savedCheckupId;
      if (id) {
        res = await axiosInstance.put(`/checkups/${id}`, buildPayload());
      } else {
        res = await axiosInstance.post(
          `/checkups/${patient._id}`,
          buildPayload(),
        );
      }
      toast.success(isEdit ? "Checkup updated!" : "Checkup saved!");
      onSaved(res.data.checkup);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-1">
      {prescriptionCheckup && (
        <PrescriptionModal
          checkup={prescriptionCheckup}
          patient={patient}
          autoGenerateOnOpen={autoGeneratePrescription}
          onClose={() => {
            setPrescriptionCheckup(null);
            setAutoGeneratePrescription(false);
          }}
          onSaved={(url) => {
            setCurrentPdfUrl(url);
            setPrescriptionCheckup((prev) =>
              prev
                ? {
                    ...prev,
                    prescription: { ...prev.prescription, pdfUrl: url },
                  }
                : null,
            );
          }}
        />
      )}

      <BackButton onClick={onBack} label={`Back to ${patient.name}`} />

      <div
        className="flex items-center gap-3 mb-6 px-5 py-4 rounded-2xl"
        style={S.card}
      >
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${ORGANIC.primary}, ${ORGANIC.secondary})`,
            boxShadow: ORGANIC.shadowSoft,
          }}
        >
          {getInitials(patient.name)}
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: ORGANIC.fg }}>
            {patient.name}
          </p>
          <p className="text-xs" style={{ color: ORGANIC.mutedFg }}>
            {patient.age} yrs · {patient.gender}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p
            className="text-xs font-semibold"
            style={{ color: ORGANIC.primary }}
          >
            {isEdit ? "Edit Checkup" : "New Checkup"}
          </p>
          <p className="text-xs" style={{ color: ORGANIC.mutedFg }}>
            {formatDate(new Date())}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl p-5" style={S.card}>
          <SectionLabel text="Diseases This Visit" />
          <TagInput
            value={diseaseInput}
            onChange={setDiseaseInput}
            onAdd={() => {
              if (!diseaseInput.trim()) return;
              setDiseases((p) => [...p, diseaseInput.trim()]);
              setDiseaseInput("");
            }}
            onRemove={(i) =>
              setDiseases((p) => p.filter((_, idx) => idx !== i))
            }
            items={diseases}
            placeholder="e.g. Hypertension"
          />
        </div>

        <div className="rounded-2xl p-5" style={S.card}>
          <SectionLabel text="Visit Notes (Doctor Only)" />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes — not shown on prescription..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={S.input}
            onFocus={focusInput}
            onBlur={blurInput}
          />
        </div>

        <div className="rounded-2xl p-5" style={S.card}>
          <SectionLabel text="Prescription" />
          <div className="space-y-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: ORGANIC.mutedFg }}
              >
                Diagnosis *
              </label>
              <input
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Hypertension Stage 2"
                className={inputCls}
                style={S.input}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: ORGANIC.mutedFg }}
              >
                Visit Location (will show on prescription) *
              </label>
              <select
                value={selectedFacility ? JSON.stringify(selectedFacility) : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    setVisitedFacility(JSON.parse(e.target.value));
                  } else {
                    setVisitedFacility(null);
                  }
                }}
                className={inputCls}
                style={S.input}
                onFocus={focusInput}
                onBlur={blurInput}
              >
                <option
                  value=""
                  style={{ background: ORGANIC.bg, color: ORGANIC.fg }}
                >
                  Select clinic or hospital
                </option>
                {doctorLocations.map((loc, idx) => (
                  <option
                    key={idx}
                    value={JSON.stringify(loc)}
                    style={{ background: ORGANIC.bg, color: ORGANIC.fg }}
                  >
                    {loc.locationType === "Clinic" ? "🏥" : "🏨"}{" "}
                    {loc.locationName}
                  </option>
                ))}
              </select>
              {selectedFacility && (
                <p
                  className="text-xs mt-2 px-3 py-2 rounded-full"
                  style={{
                    background: `rgba(93, 112, 82, 0.1)`,
                    color: ORGANIC.mutedFg,
                  }}
                >
                  <span className="font-semibold">Patient visited at:</span>{" "}
                  {selectedFacility.locationType === "Clinic" ? "🏥" : "🏨"}{" "}
                  {selectedFacility.locationName}
                </p>
              )}
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: ORGANIC.mutedFg }}
              >
                Next Appointment (optional)
              </label>
              <input
                type="date"
                value={nextAppointment}
                onChange={(e) => handleNextAppointmentChange(e.target.value)}
                min={minAppointmentDate}
                disabled={!selectedFacility}
                className={inputCls}
                style={{ ...S.input, colorScheme: "light" }}
                onFocus={focusInput}
                onBlur={blurInput}
              />
              <p className="text-xs mt-2" style={{ color: ORGANIC.mutedFg }}>
                {!selectedFacility
                  ? "Select visit location first to enable date selection."
                  : availableSessionDays.length
                    ? `Available days at ${selectedFacility.locationName}: ${availableSessionDaysLabel}`
                    : `No session days configured for ${selectedFacility.locationName}.`}
              </p>
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-3"
                style={{ color: ORGANIC.mutedFg }}
              >
                Medicines *
              </label>
              <div className="space-y-3">
                {medicines.map((med, i) => (
                  <div key={i} className="p-4 rounded-2xl" style={S.section}>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-xs font-bold px-3 py-1.5 rounded-full"
                        style={{
                          background: `rgba(93, 112, 82, 0.12)`,
                          color: ORGANIC.primary,
                        }}
                      >
                        💊 Medicine {i + 1}
                      </span>
                      <button
                        onClick={() => removeMedicine(i)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-60"
                        style={{ color: ORGANIC.destructive }}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          label: "Name *",
                          field: "name",
                          placeholder: "e.g. Paracetamol",
                        },
                        {
                          label: "Dosage *",
                          field: "dosage",
                          placeholder: "e.g. 500mg",
                        },
                      ].map(({ label, field, placeholder }) => (
                        <div key={field}>
                          <label
                            className="block text-xs mb-1"
                            style={{ color: ORGANIC.mutedFg }}
                          >
                            {label}
                          </label>
                          <input
                            value={med[field]}
                            onChange={(e) =>
                              updateMedicine(i, field, e.target.value)
                            }
                            placeholder={placeholder}
                            className={inputCls}
                            style={S.input}
                            onFocus={focusInput}
                            onBlur={blurInput}
                          />
                        </div>
                      ))}
                      <div>
                        <label
                          className="block text-xs mb-1"
                          style={{ color: ORGANIC.mutedFg }}
                        >
                          Frequency *
                        </label>
                        <select
                          value={med.frequency}
                          onChange={(e) =>
                            updateMedicine(i, "frequency", e.target.value)
                          }
                          className={inputCls}
                          style={S.input}
                          onFocus={focusInput}
                          onBlur={blurInput}
                        >
                          <option
                            value=""
                            style={{
                              background: ORGANIC.bg,
                              color: ORGANIC.fg,
                            }}
                          >
                            Select
                          </option>
                          {FREQUENCIES.map((f) => (
                            <option
                              key={f}
                              value={f}
                              style={{
                                background: ORGANIC.bg,
                                color: ORGANIC.fg,
                              }}
                            >
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          className="block text-xs mb-1"
                          style={{ color: ORGANIC.mutedFg }}
                        >
                          Duration *
                        </label>
                        <select
                          value={med.duration}
                          onChange={(e) =>
                            updateMedicine(i, "duration", e.target.value)
                          }
                          className={inputCls}
                          style={S.input}
                          onFocus={focusInput}
                          onBlur={blurInput}
                        >
                          <option
                            value=""
                            style={{
                              background: ORGANIC.bg,
                              color: ORGANIC.fg,
                            }}
                          >
                            Select
                          </option>
                          {DURATIONS.map((d) => (
                            <option
                              key={d}
                              value={d}
                              style={{
                                background: ORGANIC.bg,
                                color: ORGANIC.fg,
                              }}
                            >
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label
                          className="block text-xs mb-1"
                          style={{ color: ORGANIC.mutedFg }}
                        >
                          Instructions
                        </label>
                        <input
                          value={med.instructions}
                          onChange={(e) =>
                            updateMedicine(i, "instructions", e.target.value)
                          }
                          placeholder="e.g. Take after meal"
                          className={inputCls}
                          style={S.input}
                          onFocus={focusInput}
                          onBlur={blurInput}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addMedicine}
                className="mt-3 w-full py-3 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `rgba(93, 112, 82, 0.08)`,
                  border: `1.5px dashed ${ORGANIC.border}`,
                  color: ORGANIC.primary,
                }}
              >
                + Add Another Medicine
              </button>
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-2"
                style={{ color: ORGANIC.mutedFg }}
              >
                Lab Tests (optional)
              </label>
              <TagInput
                value={labInput}
                onChange={setLabInput}
                onAdd={() => {
                  if (!labInput.trim()) return;
                  setLabTests((p) => [...p, labInput.trim()]);
                  setLabInput("");
                }}
                onRemove={(i) =>
                  setLabTests((p) => p.filter((_, idx) => idx !== i))
                }
                items={labTests}
                placeholder="e.g. CBC, Blood Sugar"
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: ORGANIC.mutedFg }}
              >
                Patient Advice (shown on prescription)
              </label>
              <textarea
                value={patientAdvice}
                onChange={(e) => setPatientAdvice(e.target.value)}
                placeholder="e.g. Walk 30 minutes daily, avoid oily food, stay hydrated"
                rows={3}
                className="w-full px-5 py-3 rounded-3xl text-sm outline-none resize-none transition-all"
                style={{
                  ...S.input,
                  borderRadius: "1.5rem",
                  fontFamily: "inherit",
                }}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>

            <button
              onClick={handleGeneratePrescription}
              disabled={isAutoSaving || !canGenerate}
              className="w-full py-3 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: canGenerate
                  ? ORGANIC.primary
                  : `rgba(93, 112, 82, 0.1)`,
                border: `1.5px solid ${canGenerate ? ORGANIC.primary : ORGANIC.border}`,
                color: canGenerate ? ORGANIC.primaryFg : ORGANIC.mutedFg,
                boxShadow: canGenerate ? ORGANIC.shadowSoft : "none",
              }}
            >
              {isAutoSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border-2 animate-spin inline-block"
                    style={{
                      borderColor: "currentColor",
                      borderTopColor: "transparent",
                    }}
                  />
                  Saving...
                </span>
              ) : currentPdfUrl ? (
                "📋 Regenerate Prescription"
              ) : (
                "📋 Generate Prescription"
              )}
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 rounded-full text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: `linear-gradient(135deg, ${ORGANIC.primary}, ${ORGANIC.secondary})`,
            boxShadow: ORGANIC.shadowSoft,
          }}
        >
          {isSaving
            ? "Saving..."
            : isEdit
              ? "Update Checkup ✓"
              : "Save Checkup ✓"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PATIENT DETAIL PAGE
// ══════════════════════════════════════════════════════════════════════════════
function PatientDetailPage({
  patient: initialPatient,
  onBack,
  onNewCheckup,
  onEditCheckup,
  refreshTrigger,
  confirmAction,
}) {
  const [patient, setPatient] = useState(initialPatient);
  const [checkups, setCheckups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prescriptionCheckup, setPrescriptionCheckup] = useState(null);
  const [autoGeneratePrescription, setAutoGeneratePrescription] =
    useState(false);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [editForm, setEditForm] = useState({
    name: initialPatient.name,
    age: initialPatient.age,
    gender: initialPatient.gender,
    phone: initialPatient.phone,
    bloodGroup: initialPatient.bloodGroup,
    medicalHistory: initialPatient.medicalHistory || [],
  });
  const [isSavingPatient, setIsSavingPatient] = useState(false);

  useEffect(() => {
    const fetchCheckups = async () => {
      setIsLoading(true);
      try {
        const res = await axiosInstance.get(
          `/checkups/${patient._id}?limit=500`,
        );
        setCheckups(res.data.checkups);
      } catch {
        toast.error("Failed to load checkups");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCheckups();
  }, [patient._id, refreshTrigger]);

  const handleSavePatient = async () => {
    setIsSavingPatient(true);
    try {
      const res = await axiosInstance.put(`/patients/${patient._id}`, editForm);
      setPatient(res.data.patient);
      toast.success("Patient updated!");
      setIsEditingPatient(false);
    } catch {
      toast.error("Failed to update patient");
    } finally {
      setIsSavingPatient(false);
    }
  };

  const handleDeleteCheckup = async (checkupId) => {
    const confirmed = await confirmAction({
      title: "Delete Checkup",
      message: "This checkup record will be permanently deleted.",
      confirmText: "Delete",
      cancelText: "Cancel",
      tone: "danger",
    });
    if (!confirmed) return;
    try {
      await axiosInstance.delete(`/checkups/${checkupId}`);
      setCheckups((p) => p.filter((c) => c._id !== checkupId));
      toast.success("Checkup deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-1">
      {prescriptionCheckup && (
        <PrescriptionModal
          checkup={prescriptionCheckup}
          patient={patient}
          autoGenerateOnOpen={autoGeneratePrescription}
          onClose={() => {
            setPrescriptionCheckup(null);
            setAutoGeneratePrescription(false);
          }}
          onSaved={(url) => {
            setCheckups((prev) =>
              prev.map((c) =>
                c._id === prescriptionCheckup._id
                  ? { ...c, prescription: { ...c.prescription, pdfUrl: url } }
                  : c,
              ),
            );
          }}
        />
      )}

      <BackButton onClick={onBack} label="Back to Patients" />

      {/* Patient Header */}
      {isLoading ? (
        <ProfileHeaderSkeleton />
      ) : isEditingPatient ? (
        <div className="rounded-2xl p-5 sm:p-6 mb-5" style={S.card}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold" style={{ color: ORGANIC.fg }}>
              Edit Patient Info
            </h3>
            <button
              onClick={() => setIsEditingPatient(false)}
              className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-70"
              style={{ color: ORGANIC.mutedFg }}
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[
              { name: "name", label: "Full Name", placeholder: "Ahmed Raza" },
              { name: "age", label: "Age", placeholder: "34", type: "number" },
              { name: "phone", label: "Phone", placeholder: "03001234567" },
            ].map(({ name, label, placeholder, type }) => (
              <div key={name}>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: ORGANIC.mutedFg }}
                >
                  {label}
                </label>
                <input
                  type={type || "text"}
                  value={editForm[name]}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, [name]: e.target.value }))
                  }
                  placeholder={placeholder}
                  className={inputCls}
                  style={S.input}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>
            ))}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: ORGANIC.mutedFg }}
              >
                Gender
              </label>
              <select
                value={editForm.gender}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, gender: e.target.value }))
                }
                className={inputCls}
                style={S.input}
                onFocus={focusInput}
                onBlur={blurInput}
              >
                {GENDERS.map((g) => (
                  <option
                    key={g}
                    value={g}
                    style={{ background: ORGANIC.bg, color: ORGANIC.fg }}
                  >
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: ORGANIC.mutedFg }}
              >
                Blood Group
              </label>
              <select
                value={editForm.bloodGroup}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, bloodGroup: e.target.value }))
                }
                className={inputCls}
                style={S.input}
                onFocus={focusInput}
                onBlur={blurInput}
              >
                {BLOOD_GROUPS.map((b) => (
                  <option
                    key={b}
                    value={b}
                    style={{ background: ORGANIC.bg, color: ORGANIC.fg }}
                  >
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleSavePatient}
            disabled={isSavingPatient}
            className="w-full py-3 rounded-full text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            style={{
              background: `linear-gradient(135deg, ${ORGANIC.primary}, ${ORGANIC.secondary})`,
              boxShadow: ORGANIC.shadowSoft,
            }}
          >
            {isSavingPatient ? "Saving..." : "Save Changes ✓"}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl p-5 sm:p-6 mb-5" style={S.card}>
          <div className="flex items-start gap-4 mb-5">
            <div
              className="w-14 h-14 rounded-3xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${ORGANIC.primary}, ${ORGANIC.secondary})`,
                boxShadow: ORGANIC.shadowSoft,
              }}
            >
              {getInitials(patient.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold" style={{ color: ORGANIC.fg }}>
                {patient.name}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: ORGANIC.mutedFg }}>
                {patient.age} yrs · {patient.gender} · {patient.bloodGroup}
              </p>
              {patient.locations?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {patient.locations.map((loc, i) => (
                    <LocationTag key={i} location={loc} />
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setIsEditingPatient(true)}
                className="px-3 py-2 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `rgba(93, 112, 82, 0.08)`,
                  border: `1.5px solid ${ORGANIC.border}`,
                  color: ORGANIC.mutedFg,
                }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={onNewCheckup}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${ORGANIC.primary}, ${ORGANIC.secondary})`,
                  boxShadow: ORGANIC.shadowSoft,
                }}
              >
                + New Checkup
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Phone", value: patient.phone },
              { label: "Blood Group", value: patient.bloodGroup },
              { label: "Patient Since", value: formatDate(patient.createdAt) },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-2xl" style={S.section}>
                <p className="text-xs mb-1" style={{ color: ORGANIC.mutedFg }}>
                  {label}
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: ORGANIC.fg }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
          {patient.medicalHistory?.length > 0 && (
            <div className="mt-4 p-4 rounded-2xl" style={S.section}>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: ORGANIC.mutedFg }}
              >
                Medical History
              </p>
              <div className="flex flex-wrap gap-2">
                {patient.medicalHistory.map((h, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1.5 rounded-full"
                    style={{
                      background: `rgba(93, 112, 82, 0.08)`,
                      color: ORGANIC.mutedFg,
                      border: `1px solid ${ORGANIC.border}`,
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Checkup History */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold" style={{ color: ORGANIC.fg }}>
          Checkup History
        </h3>
        <span
          className="text-xs px-3 py-1.5 rounded-full font-semibold"
          style={{
            background: `rgba(93, 112, 82, 0.12)`,
            color: ORGANIC.primary,
          }}
        >
          {checkups.length} visit{checkups.length !== 1 ? "s" : ""}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : checkups.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{
            background: `rgba(93, 112, 82, 0.05)`,
            border: `1.5px dashed ${ORGANIC.border}`,
          }}
        >
          <div className="text-4xl mb-3">🩺</div>
          <p className="text-sm font-bold mb-1" style={{ color: ORGANIC.fg }}>
            No checkups yet
          </p>
          <p className="text-xs" style={{ color: ORGANIC.mutedFg }}>
            Click "+ New Checkup" to record the first visit
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {checkups.map((checkup, idx) => (
            <div
              key={checkup._id}
              className="rounded-2xl overflow-hidden"
              style={S.card}
            >
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: `1px solid ${ORGANIC.border}` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: ORGANIC.mutedFg }}
                  >
                    {formatDate(checkup.createdAt)}
                  </span>
                  {idx === 0 && (
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-bold"
                      style={{
                        background: `rgba(93, 112, 82, 0.12)`,
                        color: ORGANIC.primary,
                        border: `1px solid rgba(93, 112, 82, 0.24)`,
                      }}
                    >
                      Latest
                    </span>
                  )}
                </div>
                {checkup.payment && (
                  <span
                    className="text-xs px-3 py-1.5 rounded-full font-semibold"
                    style={{
                      background: checkup.payment.isPaid
                        ? `rgba(93, 112, 82, 0.12)`
                        : `rgba(193, 140, 93, 0.12)`,
                      color: checkup.payment.isPaid
                        ? ORGANIC.primary
                        : ORGANIC.secondary,
                    }}
                  >
                    {checkup.payment.isPaid ? "✓ Paid" : "Unpaid"} · PKR{" "}
                    {checkup.payment.amount}
                  </span>
                )}
              </div>

              <div className="px-5 py-4 space-y-3">
                {/* ── PDF Thumbnail */}
                {checkup.prescription?.pdfUrl ? (
                  <div
                    className="cursor-pointer rounded-2xl transition-all hover:-translate-y-0.5"
                    style={{
                      background: `rgba(93, 112, 82, 0.08)`,
                      border: `1.5px solid ${ORGANIC.border}`,
                    }}
                    onClick={() => {
                      setAutoGeneratePrescription(false);
                      setPrescriptionCheckup(checkup);
                    }}
                  >
                    <div className="flex items-center gap-3 p-3">
                      {/* Mini PDF preview icon */}
                      <div
                        className="w-10 h-14 rounded-lg flex-shrink-0 flex flex-col overflow-hidden"
                        style={{
                          background: ORGANIC.primaryFg,
                          border: `1px solid ${ORGANIC.border}`,
                        }}
                      >
                        <div
                          className="h-2 w-full"
                          style={{ background: ORGANIC.primary }}
                        />
                        <div className="flex-1 flex flex-col justify-center px-1 gap-0.5">
                          <div
                            className="h-0.5 rounded"
                            style={{ background: ORGANIC.border }}
                          />
                          <div
                            className="h-0.5 rounded w-3/4"
                            style={{ background: ORGANIC.border }}
                          />
                          <div
                            className="h-0.5 rounded"
                            style={{
                              background: ORGANIC.primary,
                              opacity: 0.5,
                            }}
                          />
                          <div
                            className="h-0.5 rounded w-4/5"
                            style={{ background: ORGANIC.border }}
                          />
                          <div
                            className="h-0.5 rounded w-3/4"
                            style={{ background: ORGANIC.border }}
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-bold"
                          style={{ color: ORGANIC.fg }}
                        >
                          Prescription PDF
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: ORGANIC.mutedFg }}
                        >
                          {checkup.prescription.diagnosis}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: ORGANIC.primary }}
                        >
                          {checkup.prescription.medicines?.length || 0} medicine
                          {checkup.prescription.medicines?.length !== 1
                            ? "s"
                            : ""}
                          {checkup.prescription.labTests?.length > 0 &&
                            ` · ${checkup.prescription.labTests.length} lab test${checkup.prescription.labTests.length !== 1 ? "s" : ""}`}
                        </p>
                      </div>
                      <span
                        className="text-xs font-semibold flex-shrink-0"
                        style={{ color: ORGANIC.primary }}
                      >
                        View →
                      </span>
                    </div>
                  </div>
                ) : checkup.prescription?.medicines?.length > 0 ? (
                  <button
                    onClick={() => {
                      setAutoGeneratePrescription(true);
                      setPrescriptionCheckup(checkup);
                    }}
                    className="w-full py-3 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: `rgba(93, 112, 82, 0.08)`,
                      border: `1.5px dashed ${ORGANIC.border}`,
                      color: ORGANIC.primary,
                    }}
                  >
                    📋 Generate Prescription PDF
                  </button>
                ) : null}

                {/* ── Medicines */}
                {checkup.prescription?.medicines?.length > 0 && (
                  <div className="p-3 rounded-2xl" style={S.section}>
                    <p
                      className="text-xs font-bold uppercase tracking-wide mb-2"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      Medicines
                    </p>
                    <div className="space-y-2">
                      {checkup.prescription.medicines.map((med, i) => (
                        <div
                          key={i}
                          className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl"
                          style={{
                            background: `rgba(93, 112, 82, 0.05)`,
                            border: `1px solid ${ORGANIC.border}`,
                          }}
                        >
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                            style={{
                              background: `rgba(93, 112, 82, 0.12)`,
                              color: ORGANIC.primary,
                            }}
                          >
                            💊
                          </span>
                          <span
                            className="text-sm font-semibold"
                            style={{ color: ORGANIC.fg }}
                          >
                            {med.name}
                          </span>
                          <span
                            className="text-xs px-2.5 py-1 rounded-full"
                            style={{
                              background: `rgba(93, 112, 82, 0.08)`,
                              color: ORGANIC.mutedFg,
                              border: `1px solid ${ORGANIC.border}`,
                            }}
                          >
                            {med.dosage}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: ORGANIC.mutedFg }}
                          >
                            ·
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: ORGANIC.mutedFg }}
                          >
                            {med.frequency}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: ORGANIC.mutedFg }}
                          >
                            ·
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: ORGANIC.mutedFg }}
                          >
                            {med.duration}
                          </span>
                          {med.instructions && (
                            <>
                              <span
                                className="text-xs"
                                style={{ color: ORGANIC.mutedFg }}
                              >
                                ·
                              </span>
                              <span
                                className="text-xs italic"
                                style={{ color: ORGANIC.mutedFg }}
                              >
                                {med.instructions}
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Diseases */}
                {checkup.diseases?.length > 0 && (
                  <div className="p-3 rounded-2xl" style={S.section}>
                    <p
                      className="text-xs font-bold uppercase tracking-wide mb-2"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      Diseases
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {checkup.diseases.map((d, i) => (
                        <span
                          key={i}
                          className="text-xs px-3 py-1.5 rounded-full font-medium"
                          style={{
                            background: `rgba(168, 84, 72, 0.12)`,
                            color: ORGANIC.destructive,
                            border: `1px solid rgba(168, 84, 72, 0.24)`,
                          }}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Lab Tests */}
                {checkup.prescription?.labTests?.length > 0 && (
                  <div className="p-3 rounded-2xl" style={S.section}>
                    <p
                      className="text-xs font-bold uppercase tracking-wide mb-2"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      Lab Tests
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {checkup.prescription.labTests.map((t, i) => (
                        <span
                          key={i}
                          className="text-xs px-3 py-1.5 rounded-full font-medium"
                          style={{
                            background: `rgba(193, 140, 93, 0.12)`,
                            color: ORGANIC.secondary,
                            border: `1px solid rgba(193, 140, 93, 0.24)`,
                          }}
                        >
                          🧪 {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Patient Advice */}
                {checkup.prescription?.patientAdvice && (
                  <div className="p-3 rounded-2xl" style={S.section}>
                    <p
                      className="text-xs font-bold uppercase tracking-wide mb-1.5"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      Patient Advice
                    </p>
                    <p className="text-sm" style={{ color: ORGANIC.mutedFg }}>
                      {checkup.prescription.patientAdvice}
                    </p>
                  </div>
                )}

                {/* ── Notes */}
                {checkup.notes && (
                  <div className="p-3 rounded-2xl" style={S.section}>
                    <p
                      className="text-xs font-bold uppercase tracking-wide mb-1.5"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      Notes (Doctor Only)
                    </p>
                    <p className="text-sm" style={{ color: ORGANIC.mutedFg }}>
                      {checkup.notes}
                    </p>
                  </div>
                )}

                {/* ── Actions */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => onEditCheckup(checkup)}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
                    style={{
                      color: ORGANIC.primary,
                      border: `1.5px solid ${ORGANIC.border}`,
                    }}
                  >
                    ✏️ Edit Checkup
                  </button>
                  <button
                    onClick={() => handleDeleteCheckup(checkup._id)}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
                    style={{
                      color: ORGANIC.destructive,
                      border: `1.5px solid rgba(168, 84, 72, 0.24)`,
                    }}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADD PATIENT FORM
// ══════════════════════════════════════════════════════════════════════════════
function AddPatientForm({ onBack, onAdded }) {
  const { doctor } = useAuthStore();
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    bloodGroup: "Unknown",
    medicalHistory: [],
  });
  const [historyInput, setHistoryInput] = useState("");
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const allLocations = [
    ...(doctor?.clinics || []).map((c, i) => ({
      locationType: "Clinic",
      locationId: c._id || `clinic_${i}`,
      locationName: c.name,
    })),
    ...(doctor?.hospitals || []).map((h, i) => ({
      locationType: "Hospital",
      locationId: h._id || `hospital_${i}`,
      locationName: h.name,
    })),
  ];

  const toggleLocation = (loc) => {
    const exists = selectedLocations.find(
      (l) => l.locationId === loc.locationId,
    );
    if (exists)
      setSelectedLocations((p) =>
        p.filter((l) => l.locationId !== loc.locationId),
      );
    else setSelectedLocations((p) => [...p, loc]);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.age) {
      toast.error("Age is required");
      return;
    }
    if (!form.gender) {
      toast.error("Gender is required");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Phone is required");
      return;
    }
    if (selectedLocations.length === 0) {
      toast.error("Select at least one location");
      return;
    }
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/patients", {
        ...form,
        locations: selectedLocations,
      });
      toast.success("Patient added!");
      onAdded(res.data.patient);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add patient");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-1">
      <BackButton onClick={onBack} label="Back to Patients" />
      <div className="rounded-2xl p-5 sm:p-6 space-y-5" style={S.card}>
        <div>
          <SectionLabel text="Basic Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                name: "name",
                label: "Full Name *",
                placeholder: "Ahmed Raza",
                type: "text",
              },
              {
                name: "age",
                label: "Age *",
                placeholder: "34",
                type: "number",
              },
              {
                name: "phone",
                label: "Phone *",
                placeholder: "03001234567",
                type: "text",
              },
            ].map(({ name, label, placeholder, type }) => (
              <div key={name}>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: ORGANIC.mutedFg }}
                >
                  {label}
                </label>
                <input
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [name]: e.target.value }))
                  }
                  placeholder={placeholder}
                  className={inputCls}
                  style={S.input}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>
            ))}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: ORGANIC.mutedFg }}
              >
                Gender *
              </label>
              <select
                value={form.gender}
                onChange={(e) =>
                  setForm((p) => ({ ...p, gender: e.target.value }))
                }
                className={inputCls}
                style={S.input}
                onFocus={focusInput}
                onBlur={blurInput}
              >
                <option
                  value=""
                  style={{ background: ORGANIC.bg, color: ORGANIC.fg }}
                >
                  Select gender
                </option>
                {GENDERS.map((g) => (
                  <option
                    key={g}
                    value={g}
                    style={{ background: ORGANIC.bg, color: ORGANIC.fg }}
                  >
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: ORGANIC.mutedFg }}
              >
                Blood Group
              </label>
              <select
                value={form.bloodGroup}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bloodGroup: e.target.value }))
                }
                className={inputCls}
                style={S.input}
                onFocus={focusInput}
                onBlur={blurInput}
              >
                {BLOOD_GROUPS.map((b) => (
                  <option
                    key={b}
                    value={b}
                    style={{ background: ORGANIC.bg, color: ORGANIC.fg }}
                  >
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div>
          <SectionLabel text="Medical History" />
          <TagInput
            value={historyInput}
            onChange={setHistoryInput}
            onAdd={() => {
              if (!historyInput.trim()) return;
              setForm((p) => ({
                ...p,
                medicalHistory: [...p.medicalHistory, historyInput.trim()],
              }));
              setHistoryInput("");
            }}
            onRemove={(i) =>
              setForm((p) => ({
                ...p,
                medicalHistory: p.medicalHistory.filter((_, idx) => idx !== i),
              }))
            }
            items={form.medicalHistory}
            placeholder="e.g. Appendix surgery 2019"
          />
        </div>
        <div>
          <SectionLabel text="Patient Location *" />
          {allLocations.length === 0 ? (
            <div className="p-4 rounded-2xl text-center" style={S.section}>
              <p className="text-sm" style={{ color: ORGANIC.mutedFg }}>
                No clinics or hospitals found.
              </p>
              <p className="text-xs mt-1" style={{ color: ORGANIC.mutedFg }}>
                Add locations in Settings first.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allLocations.map((loc) => {
                const selected = selectedLocations.find(
                  (l) => l.locationId === loc.locationId,
                );
                const isClinic = loc.locationType === "Clinic";
                return (
                  <button
                    key={loc.locationId}
                    onClick={() => toggleLocation(loc)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: selected
                        ? isClinic
                          ? `rgba(93, 112, 82, 0.12)`
                          : `rgba(193, 140, 93, 0.12)`
                        : `rgba(93, 112, 82, 0.05)`,
                      border: selected
                        ? isClinic
                          ? `1.5px solid ${ORGANIC.primary}`
                          : `1.5px solid ${ORGANIC.secondary}`
                        : `1.5px solid ${ORGANIC.border}`,
                    }}
                  >
                    <span className="text-lg">{isClinic ? "🏥" : "🏨"}</span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{
                          color: selected
                            ? isClinic
                              ? ORGANIC.primary
                              : ORGANIC.secondary
                            : ORGANIC.fg,
                        }}
                      >
                        {loc.locationName}
                      </p>
                      <p className="text-xs" style={{ color: ORGANIC.mutedFg }}>
                        {loc.locationType}
                      </p>
                    </div>
                    {selected && (
                      <span
                        style={{
                          color: isClinic ? ORGANIC.primary : ORGANIC.secondary,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-4 rounded-full text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          style={{
            background: `linear-gradient(135deg, ${ORGANIC.primary}, ${ORGANIC.secondary})`,
            boxShadow: ORGANIC.shadowSoft,
          }}
        >
          {isLoading ? "Adding..." : "Add Patient ✓"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PATIENTS LIST
// ══════════════════════════════════════════════════════════════════════════════
export default function PatientsPage() {
  const { confirm, dialogProps } = useConfirmDialog();
  const [view, setView] = useState("list");
  const [patients, setPatients] = useState([]);
  const [patientsTotal, setPatientsTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activePatient, setActivePatient] = useState(null);
  const [editingCheckup, setEditingCheckup] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchPatients = async (q = "") => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (q) params.set("search", q);
      const res = await axiosInstance.get(`/patients?${params.toString()}`);
      setPatients(res.data.patients);
      setPatientsTotal(
        Number(
          res?.data?.pagination?.total || res?.data?.patients?.length || 0,
        ),
      );
    } catch {
      toast.error("Failed to load patients");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchPatients(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const openPatient = async (patient) => {
    try {
      const res = await axiosInstance.get(`/patients/${patient._id}`);
      setActivePatient(res.data.patient);
      setView("detail");
    } catch {
      toast.error("Failed to load patient");
    }
  };

  const handleDeletePatient = async (id, e) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: "Delete Patient",
      message: "This will remove the patient and all linked records.",
      confirmText: "Delete",
      cancelText: "Cancel",
      tone: "danger",
    });
    if (!confirmed) return;
    try {
      await axiosInstance.delete(`/patients/${id}`);
      setPatients((p) => p.filter((pt) => pt._id !== id));
      toast.success("Patient deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (view === "add")
    return (
      <>
        <AddPatientForm
          onBack={() => setView("list")}
          onAdded={(p) => {
            setPatients((prev) => [p, ...prev]);
            setView("list");
          }}
        />
        <ConfirmDialog {...dialogProps} />
      </>
    );

  if (view === "detail" && activePatient)
    return (
      <>
        <PatientDetailPage
          patient={activePatient}
          onBack={() => setView("list")}
          onNewCheckup={() => {
            setEditingCheckup(null);
            setView("checkup");
          }}
          onEditCheckup={(checkup) => {
            setEditingCheckup(checkup);
            setView("checkup");
          }}
          refreshTrigger={refreshTrigger}
          confirmAction={confirm}
        />
        <ConfirmDialog {...dialogProps} />
      </>
    );

  if (view === "checkup" && activePatient)
    return (
      <>
        <CheckupForm
          patient={activePatient}
          existingCheckup={editingCheckup}
          onBack={() => setView("detail")}
          onSaved={() => {
            setRefreshTrigger((p) => p + 1);
            setView("detail");
          }}
        />
        <ConfirmDialog {...dialogProps} />
      </>
    );

  return (
    <>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{ color: ORGANIC.fg }}>
              Patients
            </h2>
            <p className="text-xs mt-0.5" style={{ color: ORGANIC.mutedFg }}>
              {patientsTotal} total patients
            </p>
          </div>
          <button
            onClick={() => setView("add")}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 w-fit"
            style={{
              background: `linear-gradient(135deg, ${ORGANIC.primary}, ${ORGANIC.secondary})`,
              boxShadow: ORGANIC.shadowSoft,
            }}
          >
            + Add Patient
          </button>
        </div>

        <div className="relative mb-5">
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: ORGANIC.mutedFg }}
          >
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-10 pr-5 py-3 rounded-full text-sm outline-none transition-all"
            style={S.input}
            onFocus={focusInput}
            onBlur={blurInput}
          />
        </div>

        <div className="rounded-2xl overflow-hidden" style={S.card}>
          <div
            className="hidden sm:grid grid-cols-5 gap-4 px-5 py-3"
            style={{
              borderBottom: `1px solid ${ORGANIC.border}`,
              background: `rgba(93, 112, 82, 0.05)`,
            }}
          >
            {["Patient", "Age & Gender", "Phone", "Location", "Added"].map(
              (h) => (
                <p
                  key={h}
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: ORGANIC.mutedFg }}
                >
                  {h}
                </p>
              ),
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2 p-4">
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">👥</div>
              <p
                className="text-sm font-bold mb-1"
                style={{ color: ORGANIC.fg }}
              >
                {search ? "No patients found" : "No patients yet"}
              </p>
              <p className="text-xs" style={{ color: ORGANIC.mutedFg }}>
                {search
                  ? "Try a different search"
                  : "Click + Add Patient to get started"}
              </p>
            </div>
          ) : (
            patients.map((patient) => (
              <div
                key={patient._id}
                onClick={() => openPatient(patient)}
                className="group cursor-pointer transition-all duration-200"
                style={{ borderBottom: `1px solid ${ORGANIC.border}` }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = `rgba(93, 112, 82, 0.08)`)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div className="sm:hidden flex items-center gap-3 px-4 py-4">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${ORGANIC.primary}, ${ORGANIC.secondary})`,
                      boxShadow: ORGANIC.shadowSoft,
                    }}
                  >
                    {getInitials(patient.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold truncate"
                      style={{ color: ORGANIC.fg }}
                    >
                      {patient.name}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      {patient.age} yrs · {patient.gender}
                    </p>
                    {patient.locations?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {patient.locations.map((loc, i) => (
                          <LocationTag key={i} location={loc} />
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDeletePatient(patient._id, e)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 flex-shrink-0"
                    style={{
                      color: ORGANIC.destructive,
                      border: `1.5px solid rgba(168, 84, 72, 0.24)`,
                    }}
                  >
                    🗑
                  </button>
                </div>

                <div className="hidden sm:grid grid-cols-5 gap-4 items-center px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${ORGANIC.primary}, ${ORGANIC.secondary})`,
                        boxShadow: ORGANIC.shadowSoft,
                      }}
                    >
                      {getInitials(patient.name)}
                    </div>
                    <span
                      className="text-sm font-semibold truncate"
                      style={{ color: ORGANIC.fg }}
                    >
                      {patient.name}
                    </span>
                  </div>
                  <span className="text-sm" style={{ color: ORGANIC.mutedFg }}>
                    {patient.age} yrs · {patient.gender}
                  </span>
                  <span className="text-sm" style={{ color: ORGANIC.mutedFg }}>
                    {patient.phone}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {patient.locations?.length > 0 ? (
                      patient.locations.map((loc, i) => (
                        <LocationTag key={i} location={loc} />
                      ))
                    ) : (
                      <span
                        className="text-xs"
                        style={{ color: ORGANIC.mutedFg }}
                      >
                        —
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      {formatDate(patient.createdAt)}
                    </span>
                    <button
                      onClick={(e) => handleDeletePatient(patient._id, e)}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                      style={{
                        color: ORGANIC.destructive,
                        border: `1.5px solid rgba(168, 84, 72, 0.24)`,
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <ConfirmDialog {...dialogProps} />
    </>
  );
}
