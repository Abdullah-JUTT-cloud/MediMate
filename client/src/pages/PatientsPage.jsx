import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useAuthStore from "../store/authStore";
import PrescriptionModal from "./PrescriptionModal";
import { RowSkeleton, ProfileHeaderSkeleton, FormFieldSkeleton } from "../components/SkeletonLoaders";
import { Skeleton } from "@mui/material";
import ConfirmDialog from "../components/ConfirmDialog";
import useConfirmDialog from "../hooks/useConfirmDialog";

const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"];
const GENDERS = ["Male","Female","Other"];
const FREQUENCIES = ["Once a day","Twice a day","Three times a day","Four times a day","Every 8 hours","Every 12 hours","As needed"];
const DURATIONS = ["3 days","5 days","7 days","10 days","14 days","1 month","3 months","Ongoing"];
const PAYMENT_METHODS = ["Cash","Card","Online Transfer"];

const getInitials = (name) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "P";
const formatDate = (date) => new Date(date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
const emptyMedicine = () => ({ name: "", dosage: "", frequency: "", duration: "", instructions: "" });
const getTodayDateInput = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0];
};

const S = {
  input: { background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" },
  card: { background: "var(--color-card)", border: "1px solid var(--color-border)" },
  section: { background: "var(--color-bg)", border: "1px solid var(--color-border)" },
};
const focusInput = (e) => (e.target.style.border = "1px solid var(--color-primary)");
const blurInput = (e) => (e.target.style.border = "1px solid var(--color-border)");
const inputCls = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all";

function LocationTag({ location }) {
  const isClinic = location.locationType === "Clinic";
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
      style={{
        background: isClinic ? "color-mix(in srgb, var(--color-primary) 12%, transparent)" : "rgba(56,189,248,0.1)",
        border: isClinic ? "1px solid color-mix(in srgb, var(--color-primary) 24%, transparent)" : "1px solid rgba(56,189,248,0.2)",
        color: isClinic ? "var(--color-primary)" : "#38bdf8",
      }}>
      {isClinic ? "🏥" : "🏨"} {location.locationName}
    </span>
  );
}

function BackButton({ onClick, label = "Back" }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80 mb-6"
      style={{ color: "var(--color-primary)" }}>
      ← {label}
    </button>
  );
}

function SectionLabel({ text }) {
  return <p className="text-xs font-bold uppercase tracking-widest mb-3 text-[var(--color-text-secondary)]">{text}</p>;
}

function TagInput({ value, onChange, onAdd, onRemove, items, placeholder }) {
  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input value={value} onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
          style={S.input} onFocus={focusInput} onBlur={blurInput} />
        <button onClick={onAdd}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}>
          + Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--color-primary) 24%, transparent)", color: "var(--color-primary)" }}>
              {item}
              <button onClick={() => onRemove(i)} style={{ color: "var(--color-danger)", fontSize: "10px" }}>✕</button>
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
  const [diagnosis, setDiagnosis] = useState(existingCheckup?.prescription?.diagnosis || "");
  const [nextAppointment, setNextAppointment] = useState(
    existingCheckup?.prescription?.nextAppointment
      ? new Date(existingCheckup.prescription.nextAppointment).toISOString().split("T")[0]
      : ""
  );
  const [medicines, setMedicines] = useState(
    existingCheckup?.prescription?.medicines?.length
      ? existingCheckup.prescription.medicines
      : [emptyMedicine()]
  );
  const [labTests, setLabTests] = useState(existingCheckup?.prescription?.labTests || []);
  const [labInput, setLabInput] = useState("");
  const [patientAdvice, setPatientAdvice] = useState(existingCheckup?.prescription?.patientAdvice || "");
  const [visitedFacility, setVisitedFacility] = useState(existingCheckup?.visitedFacility || null);
  const [payment, setPayment] = useState(
    existingCheckup?.payment || { amount: "", method: "Cash", isPaid: false }
  );
  const [savedCheckupId, setSavedCheckupId] = useState(existingCheckup?._id || null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(existingCheckup?.prescription?.pdfUrl || "");
  const [prescriptionCheckup, setPrescriptionCheckup] = useState(null);
  const [autoGeneratePrescription, setAutoGeneratePrescription] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const canGenerate = diagnosis.trim().length > 0 && medicines.some((m) => m.name.trim().length > 0);

  const validateNextAppointment = () => {
    if (!nextAppointment) return true;
    if (nextAppointment < minAppointmentDate) {
      toast.error("Next appointment cannot be in the past");
      return false;
    }
    return true;
  };

  const updateMedicine = (i, field, val) =>
    setMedicines((p) => p.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  const addMedicine = () => setMedicines((p) => [...p, emptyMedicine()]);
  const removeMedicine = (i) => {
    if (medicines.length === 1) { toast.error("At least one medicine required"); return; }
    setMedicines((p) => p.filter((_, idx) => idx !== i));
  };

  const buildPayload = () => ({
    diseases,
    notes,
    visitedFacility,
    prescription: {
      diagnosis,
      nextAppointment: nextAppointment || undefined,
      medicines,
      labTests,
      patientAdvice,
      pdfUrl: currentPdfUrl,
    },
    payment: { amount: Number(payment.amount) || 0, method: payment.method, isPaid: payment.isPaid },
  });

  const handleGeneratePrescription = async () => {
    if (!canGenerate) return;
    if (!validateNextAppointment()) return;
    if (medicines.some((m) => !m.name.trim() || !m.dosage.trim() || !m.frequency || !m.duration)) {
      toast.error("Fill all required medicine fields"); return;
    }
    setIsAutoSaving(true);
    try {
      let checkupId = savedCheckupId;
      if (!checkupId) {
        const res = await axiosInstance.post(`/checkups/${patient._id}`, buildPayload());
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
        visitedFacility,
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
    if (!diagnosis.trim()) { toast.error("Diagnosis is required"); return; }
    if (!validateNextAppointment()) return;
    if (medicines.some((m) => !m.name.trim() || !m.dosage.trim() || !m.frequency || !m.duration)) {
      toast.error("Fill all required medicine fields"); return;
    }
    if (!payment.amount) { toast.error("Payment amount is required"); return; }
    setIsSaving(true);
    try {
      let res;
      const id = savedCheckupId;
      if (id) {
        res = await axiosInstance.put(`/checkups/${id}`, buildPayload());
      } else {
        res = await axiosInstance.post(`/checkups/${patient._id}`, buildPayload());
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
              prev ? { ...prev, prescription: { ...prev.prescription, pdfUrl: url } } : null
            );
          }}
        />
      )}

      <BackButton onClick={onBack} label={`Back to ${patient.name}`} />

      <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-2xl" style={S.card}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,var(--color-primary),color-mix(in srgb, var(--color-primary) 80%, black))" }}>
          {getInitials(patient.name)}
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--color-text-primary)]">{patient.name}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{patient.age} yrs · {patient.gender}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs font-semibold text-[var(--color-primary)]">{isEdit ? "Edit Checkup" : "New Checkup"}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{formatDate(new Date())}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl p-5" style={S.card}>
          <SectionLabel text="Diseases This Visit" />
          <TagInput value={diseaseInput} onChange={setDiseaseInput}
            onAdd={() => { if (!diseaseInput.trim()) return; setDiseases((p) => [...p, diseaseInput.trim()]); setDiseaseInput(""); }}
            onRemove={(i) => setDiseases((p) => p.filter((_, idx) => idx !== i))}
            items={diseases} placeholder="e.g. Hypertension" />
        </div>

        <div className="rounded-2xl p-5" style={S.card}>
          <SectionLabel text="Visit Notes (Doctor Only)" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes — not shown on prescription..."
            rows={3} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={S.input} onFocus={focusInput} onBlur={blurInput} />
        </div>

        <div className="rounded-2xl p-5" style={S.card}>
          <SectionLabel text="Prescription" />
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">Diagnosis *</label>
              <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Hypertension Stage 2"
                className={inputCls} style={S.input} onFocus={focusInput} onBlur={blurInput} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">Visit Location (will show on prescription) *</label>
              <select value={visitedFacility ? JSON.stringify(visitedFacility) : ""} 
                onChange={(e) => {
                  if (e.target.value) {
                    setVisitedFacility(JSON.parse(e.target.value));
                  } else {
                    setVisitedFacility(null);
                  }
                }}
                className={inputCls} style={{ ...S.input, colorScheme: "auto" }} onFocus={focusInput} onBlur={blurInput}>
                <option value="" style={{ background: "var(--color-card)", color: "var(--color-text-primary)" }}>Select clinic or hospital</option>
                {[
                  ...(doctor?.clinics || []).map((c, i) => ({ 
                    locationType: "Clinic", 
                    locationName: c.name,
                    locationAddress: c.address
                  })),
                  ...(doctor?.hospitals || []).map((h, i) => ({ 
                    locationType: "Hospital", 
                    locationName: h.name,
                    locationAddress: h.address
                  })),
                ].map((loc, idx) => (
                  <option key={idx} value={JSON.stringify(loc)} style={{ background: "var(--color-card)", color: "var(--color-text-primary)" }}>
                    {loc.locationType === "Clinic" ? "🏥" : "🏨"} {loc.locationName}
                  </option>
                ))}
              </select>
              {visitedFacility && (
                <p className="text-xs mt-2 px-3 py-2 rounded-lg" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)", color: "var(--color-text-secondary)" }}>
                  <span className="font-semibold">Patient visited at:</span> {visitedFacility.locationType === "Clinic" ? "🏥" : "🏨"} {visitedFacility.locationName}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">Next Appointment (optional)</label>
              <input type="date" value={nextAppointment} onChange={(e) => setNextAppointment(e.target.value)}
                min={minAppointmentDate}
                className={inputCls} style={{ ...S.input, colorScheme: "auto" }} onFocus={focusInput} onBlur={blurInput} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-3 text-[var(--color-text-secondary)]">Medicines *</label>
              <div className="space-y-3">
                {medicines.map((med, i) => (
                  <div key={i} className="p-4 rounded-xl" style={S.section}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold px-2 py-1 rounded-lg"
                        style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}>
                        💊 Medicine {i + 1}
                      </span>
                      <button onClick={() => removeMedicine(i)}
                        className="text-xs px-2 py-1 rounded-lg transition-all hover-danger-soft"
                        style={{ color: "var(--color-danger)" }}>Remove</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: "Name *", field: "name", placeholder: "e.g. Paracetamol" },
                        { label: "Dosage *", field: "dosage", placeholder: "e.g. 500mg" },
                      ].map(({ label, field, placeholder }) => (
                        <div key={field}>
                          <label className="block text-xs mb-1 text-[var(--color-text-secondary)]">{label}</label>
                          <input value={med[field]} onChange={(e) => updateMedicine(i, field, e.target.value)}
                            placeholder={placeholder} className={inputCls} style={S.input}
                            onFocus={focusInput} onBlur={blurInput} />
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs mb-1 text-[var(--color-text-secondary)]">Frequency *</label>
                        <select value={med.frequency} onChange={(e) => updateMedicine(i, "frequency", e.target.value)}
                          className={inputCls} style={S.input} onFocus={focusInput} onBlur={blurInput}>
                          <option value="" style={{ background: "var(--color-card)", color: "var(--color-text-primary)" }}>Select</option>
                          {FREQUENCIES.map((f) => <option key={f} value={f} style={{ background: "var(--color-card)", color: "var(--color-text-primary)" }}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs mb-1 text-[var(--color-text-secondary)]">Duration *</label>
                        <select value={med.duration} onChange={(e) => updateMedicine(i, "duration", e.target.value)}
                          className={inputCls} style={S.input} onFocus={focusInput} onBlur={blurInput}>
                          <option value="" style={{ background: "var(--color-card)", color: "var(--color-text-primary)" }}>Select</option>
                          {DURATIONS.map((d) => <option key={d} value={d} style={{ background: "var(--color-card)", color: "var(--color-text-primary)" }}>{d}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs mb-1 text-[var(--color-text-secondary)]">Instructions</label>
                        <input value={med.instructions} onChange={(e) => updateMedicine(i, "instructions", e.target.value)}
                          placeholder="e.g. Take after meal" className={inputCls} style={S.input}
                          onFocus={focusInput} onBlur={blurInput} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addMedicine}
                className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: "color-mix(in srgb, var(--color-primary) 7%, transparent)", border: "1px dashed color-mix(in srgb, var(--color-primary) 35%, transparent)", color: "var(--color-primary)" }}>
                + Add Another Medicine
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 text-[var(--color-text-secondary)]">Lab Tests (optional)</label>
              <TagInput value={labInput} onChange={setLabInput}
                onAdd={() => { if (!labInput.trim()) return; setLabTests((p) => [...p, labInput.trim()]); setLabInput(""); }}
                onRemove={(i) => setLabTests((p) => p.filter((_, idx) => idx !== i))}
                items={labTests} placeholder="e.g. CBC, Blood Sugar" />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">Patient Advice (shown on prescription)</label>
              <textarea
                value={patientAdvice}
                onChange={(e) => setPatientAdvice(e.target.value)}
                placeholder="e.g. Walk 30 minutes daily, avoid oily food, stay hydrated"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={S.input}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>

            <button onClick={handleGeneratePrescription}
              disabled={isAutoSaving || !canGenerate}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: canGenerate ? "color-mix(in srgb, var(--color-primary) 15%, transparent)" : "var(--color-bg)",
                border: canGenerate ? "1px solid color-mix(in srgb, var(--color-primary) 35%, transparent)" : "1px solid var(--color-border)",
                color: canGenerate ? "var(--color-primary)" : "var(--color-text-secondary)",
              }}>
              {isAutoSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 animate-spin inline-block"
                    style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
                  Saving...
                </span>
              ) : currentPdfUrl ? "📋 Regenerate Prescription" : "📋 Generate Prescription"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl p-5" style={S.card}>
          <SectionLabel text="Payment" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">Amount (PKR) *</label>
              <input type="number" value={payment.amount}
                onChange={(e) => setPayment((p) => ({ ...p, amount: e.target.value }))}
                placeholder="e.g. 1500" className={inputCls} style={S.input}
                onFocus={focusInput} onBlur={blurInput} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">Method</label>
              <div className="flex gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button key={m} onClick={() => setPayment((p) => ({ ...p, method: m }))}
                    className="flex-1 py-3 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: payment.method === m ? "color-mix(in srgb, var(--color-primary) 15%, transparent)" : "var(--color-bg)",
                      border: payment.method === m ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                      color: payment.method === m ? "var(--color-primary)" : "var(--color-text-secondary)",
                    }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <button onClick={() => setPayment((p) => ({ ...p, isPaid: !p.isPaid }))}
                className="w-full py-3 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: payment.isPaid ? "rgba(34,197,94,0.15)" : "var(--color-bg)",
                  border: payment.isPaid ? "1px solid #22c55e" : "1px solid var(--color-border)",
                  color: payment.isPaid ? "#22c55e" : "var(--color-text-secondary)",
                }}>
                {payment.isPaid ? "✓ Paid" : "Unpaid"}
              </button>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={isSaving}
          className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ background: "linear-gradient(135deg,var(--color-primary),color-mix(in srgb, var(--color-primary) 80%, black))", boxShadow: "0 4px 20px color-mix(in srgb, var(--color-primary) 30%, transparent)" }}>
          {isSaving ? "Saving..." : isEdit ? "Update Checkup ✓" : "Save Checkup ✓"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PATIENT DETAIL PAGE
// ══════════════════════════════════════════════════════════════════════════════
function PatientDetailPage({ patient: initialPatient, onBack, onNewCheckup, onEditCheckup, refreshTrigger, confirmAction }) {
  const [patient, setPatient] = useState(initialPatient);
  const [checkups, setCheckups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prescriptionCheckup, setPrescriptionCheckup] = useState(null);
  const [autoGeneratePrescription, setAutoGeneratePrescription] = useState(false);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [editForm, setEditForm] = useState({
    name: initialPatient.name, age: initialPatient.age, gender: initialPatient.gender,
    phone: initialPatient.phone, bloodGroup: initialPatient.bloodGroup,
    medicalHistory: initialPatient.medicalHistory || [],
  });
  const [isSavingPatient, setIsSavingPatient] = useState(false);

  useEffect(() => {
    const fetchCheckups = async () => {
      setIsLoading(true);
      try {
        const res = await axiosInstance.get(`/checkups/${patient._id}?limit=500`);
        setCheckups(res.data.checkups);
      } catch { toast.error("Failed to load checkups"); }
      finally { setIsLoading(false); }
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
    } catch { toast.error("Failed to update patient"); }
    finally { setIsSavingPatient(false); }
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
    } catch { toast.error("Failed to delete"); }
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
            setCheckups((prev) => prev.map((c) =>
              c._id === prescriptionCheckup._id
                ? { ...c, prescription: { ...c.prescription, pdfUrl: url } }
                : c
            ));
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
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Edit Patient Info</h3>
            <button onClick={() => setIsEditingPatient(false)}
              className="text-xs px-3 py-1.5 rounded-lg text-[var(--color-text-secondary)]">Cancel</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[
              { name: "name", label: "Full Name", placeholder: "Ahmed Raza" },
              { name: "age", label: "Age", placeholder: "34", type: "number" },
              { name: "phone", label: "Phone", placeholder: "03001234567" },
            ].map(({ name, label, placeholder, type }) => (
              <div key={name}>
                <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">{label}</label>
                <input type={type || "text"} value={editForm[name]}
                  onChange={(e) => setEditForm((p) => ({ ...p, [name]: e.target.value }))}
                  placeholder={placeholder} className={inputCls} style={S.input}
                  onFocus={focusInput} onBlur={blurInput} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">Gender</label>
              <select value={editForm.gender} onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value }))}
                className={inputCls} style={S.input} onFocus={focusInput} onBlur={blurInput}>
                {GENDERS.map((g) => <option key={g} value={g} style={{ background: "var(--color-card)", color: "var(--color-text-primary)" }}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">Blood Group</label>
              <select value={editForm.bloodGroup} onChange={(e) => setEditForm((p) => ({ ...p, bloodGroup: e.target.value }))}
                className={inputCls} style={S.input} onFocus={focusInput} onBlur={blurInput}>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b} style={{ background: "var(--color-card)", color: "var(--color-text-primary)" }}>{b}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleSavePatient} disabled={isSavingPatient}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,var(--color-primary),color-mix(in srgb, var(--color-primary) 80%, black))" }}>
            {isSavingPatient ? "Saving..." : "Save Changes ✓"}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl p-5 sm:p-6 mb-5" style={S.card}>
          <div className="flex items-start gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg,var(--color-primary),color-mix(in srgb, var(--color-primary) 80%, black))" }}>
              {getInitials(patient.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{patient.name}</h2>
              <p className="text-sm mt-0.5 text-[var(--color-text-secondary)]">
                {patient.age} yrs · {patient.gender} · {patient.bloodGroup}
              </p>
              {patient.locations?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {patient.locations.map((loc, i) => <LocationTag key={i} location={loc} />)}
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setIsEditingPatient(true)}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                ✏️ Edit
              </button>
              <button onClick={onNewCheckup}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,var(--color-primary),color-mix(in srgb, var(--color-primary) 80%, black))", boxShadow: "0 4px 15px color-mix(in srgb, var(--color-primary) 30%, transparent)" }}>
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
              <div key={label} className="p-3 rounded-xl" style={S.section}>
                <p className="text-xs mb-1 text-[var(--color-text-secondary)]">{label}</p>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{value}</p>
              </div>
            ))}
          </div>
          {patient.medicalHistory?.length > 0 && (
            <div className="mt-4 p-4 rounded-xl" style={S.section}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2 text-[var(--color-text-secondary)]">Medical History</p>
              <div className="flex flex-wrap gap-2">
                {patient.medicalHistory.map((h, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg"
                    style={{ background: "var(--color-card)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>{h}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Checkup History */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[var(--color-text-primary)]">Checkup History</h3>
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
          style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}>
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
        <div className="text-center py-16 rounded-2xl"
          style={{ background: "var(--color-bg)", border: "1px dashed var(--color-border)" }}>
          <div className="text-4xl mb-3">🩺</div>
          <p className="text-sm font-bold text-[var(--color-text-primary)] mb-1">No checkups yet</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Click "+ New Checkup" to record the first visit</p>
        </div>
      ) : (
        <div className="space-y-4">
          {checkups.map((checkup, idx) => (
            <div key={checkup._id} className="rounded-2xl overflow-hidden" style={S.card}>
              <div className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: "1px solid var(--color-border)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    {formatDate(checkup.createdAt)}
                  </span>
                  {idx === 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                      Latest
                    </span>
                  )}
                </div>
              {checkup.payment && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{
                    background: checkup.payment.isPaid ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
                    color: checkup.payment.isPaid ? "#22c55e" : "#f59e0b",
                  }}>
                  {checkup.payment.isPaid ? "✓ Paid" : "Unpaid"} · PKR {checkup.payment.amount}
                </span>
              )}
            </div>

            <div className="px-5 py-4 space-y-3">

              {/* ── PDF Thumbnail */}
              {checkup.prescription?.pdfUrl ? (
                <div className="cursor-pointer rounded-xl transition-all hover:opacity-90"
                  style={{ background: "color-mix(in srgb, var(--color-primary) 7%, transparent)", border: "1px solid color-mix(in srgb, var(--color-primary) 24%, transparent)" }}
                  onClick={() => {
                    setAutoGeneratePrescription(false);
                    setPrescriptionCheckup(checkup);
                  }}>
                  <div className="flex items-center gap-3 p-3">
                    {/* Mini PDF preview icon */}
                    <div className="w-10 h-14 rounded-lg flex-shrink-0 flex flex-col overflow-hidden"
                      style={{ background: "white", border: "1px solid #e2e8f0" }}>
                      <div className="h-2 w-full" style={{ background: "var(--color-primary)" }} />
                      <div className="flex-1 flex flex-col justify-center px-1 gap-0.5">
                        <div className="h-0.5 rounded" style={{ background: "#e2e8f0" }} />
                        <div className="h-0.5 rounded w-3/4" style={{ background: "#e2e8f0" }} />
                        <div className="h-0.5 rounded" style={{ background: "var(--color-primary)", opacity: 0.5 }} />
                        <div className="h-0.5 rounded w-4/5" style={{ background: "#e2e8f0" }} />
                        <div className="h-0.5 rounded w-3/4" style={{ background: "#e2e8f0" }} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[var(--color-text-primary)]">Prescription PDF</p>
                      <p className="text-xs mt-0.5 text-[var(--color-text-secondary)]">
                        {checkup.prescription.diagnosis}
                      </p>
                      <p className="text-xs mt-0.5 text-[var(--color-primary)]">
                        {checkup.prescription.medicines?.length || 0} medicine{checkup.prescription.medicines?.length !== 1 ? "s" : ""}
                        {checkup.prescription.labTests?.length > 0 && ` · ${checkup.prescription.labTests.length} lab test${checkup.prescription.labTests.length !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <span className="text-xs font-semibold flex-shrink-0 text-[var(--color-primary)]">View →</span>
                  </div>
                </div>
              ) : checkup.prescription?.medicines?.length > 0 ? (
                <button onClick={() => {
                  setAutoGeneratePrescription(true);
                  setPrescriptionCheckup(checkup);
                }}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                  style={{ background: "color-mix(in srgb, var(--color-primary) 7%, transparent)", border: "1px dashed color-mix(in srgb, var(--color-primary) 35%, transparent)", color: "var(--color-primary)" }}>
                  📋 Generate Prescription PDF
                </button>
              ) : null}

              {/* ── Medicines */}
              {checkup.prescription?.medicines?.length > 0 && (
                <div className="p-3 rounded-xl" style={S.section}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2 text-[var(--color-text-secondary)]">Medicines</p>
                  <div className="space-y-2">
                    {checkup.prescription.medicines.map((med, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg"
                        style={{ background: "color-mix(in srgb, var(--color-primary) 5%, transparent)", border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)" }}>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}>💊</span>
                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{med.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "var(--color-card)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>{med.dosage}</span>
                        <span className="text-xs text-[var(--color-text-secondary)]">·</span>
                        <span className="text-xs text-[var(--color-text-secondary)]">{med.frequency}</span>
                        <span className="text-xs text-[var(--color-text-secondary)]">·</span>
                        <span className="text-xs text-[var(--color-text-secondary)]">{med.duration}</span>
                        {med.instructions && (
                          <>
                            <span className="text-xs text-[var(--color-text-secondary)]">·</span>
                            <span className="text-xs italic text-[var(--color-text-secondary)]">{med.instructions}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Diseases */}
              {checkup.diseases?.length > 0 && (
                <div className="p-3 rounded-xl" style={S.section}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2 text-[var(--color-text-secondary)]">Diseases</p>
                  <div className="flex flex-wrap gap-1.5">
                    {checkup.diseases.map((d, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.15)" }}>
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Lab Tests */}
              {checkup.prescription?.labTests?.length > 0 && (
                <div className="p-3 rounded-xl" style={S.section}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2 text-[var(--color-text-secondary)]">Lab Tests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {checkup.prescription.labTests.map((t, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.2)" }}>
                        🧪 {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Patient Advice */}
              {checkup.prescription?.patientAdvice && (
                <div className="p-3 rounded-xl" style={S.section}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1.5 text-[var(--color-text-secondary)]">Patient Advice</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{checkup.prescription.patientAdvice}</p>
                </div>
              )}

              {/* ── Notes */}
              {checkup.notes && (
                <div className="p-3 rounded-xl" style={S.section}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1.5 text-[var(--color-text-secondary)]">Notes (Doctor Only)</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{checkup.notes}</p>
                </div>
              )}

              {/* ── Actions */}
              <div className="flex items-center justify-between pt-1">
                <button onClick={() => onEditCheckup(checkup)}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl transition-all hover:bg-[var(--color-bg)]"
                  style={{ color: "var(--color-primary)", border: "1px solid color-mix(in srgb, var(--color-primary) 24%, transparent)" }}>
                  ✏️ Edit Checkup
                </button>
                <button onClick={() => handleDeleteCheckup(checkup._id)}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl transition-all hover-danger-soft"
                  style={{ color: "var(--color-danger)", border: "1px solid color-mix(in srgb, var(--color-danger) 22%, transparent)" }}>
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
  const [form, setForm] = useState({ name: "", age: "", gender: "", phone: "", bloodGroup: "Unknown", medicalHistory: [] });
  const [historyInput, setHistoryInput] = useState("");
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const allLocations = [
    ...(doctor?.clinics || []).map((c, i) => ({ locationType: "Clinic", locationId: c._id || `clinic_${i}`, locationName: c.name })),
    ...(doctor?.hospitals || []).map((h, i) => ({ locationType: "Hospital", locationId: h._id || `hospital_${i}`, locationName: h.name })),
  ];

  const toggleLocation = (loc) => {
    const exists = selectedLocations.find((l) => l.locationId === loc.locationId);
    if (exists) setSelectedLocations((p) => p.filter((l) => l.locationId !== loc.locationId));
    else setSelectedLocations((p) => [...p, loc]);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!form.age) { toast.error("Age is required"); return; }
    if (!form.gender) { toast.error("Gender is required"); return; }
    if (!form.phone.trim()) { toast.error("Phone is required"); return; }
    if (selectedLocations.length === 0) { toast.error("Select at least one location"); return; }
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/patients", { ...form, locations: selectedLocations });
      toast.success("Patient added!");
      onAdded(res.data.patient);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add patient");
    } finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-1">
      <BackButton onClick={onBack} label="Back to Patients" />
      <div className="rounded-2xl p-5 sm:p-6 space-y-5" style={S.card}>
        <div>
          <SectionLabel text="Basic Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: "name", label: "Full Name *", placeholder: "Ahmed Raza", type: "text" },
              { name: "age", label: "Age *", placeholder: "34", type: "number" },
              { name: "phone", label: "Phone *", placeholder: "03001234567", type: "text" },
            ].map(({ name, label, placeholder, type }) => (
              <div key={name}>
                <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">{label}</label>
                <input name={name} type={type} value={form[name]}
                  onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
                  placeholder={placeholder} className={inputCls} style={S.input}
                  onFocus={focusInput} onBlur={blurInput} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">Gender *</label>
              <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                className={inputCls} style={S.input} onFocus={focusInput} onBlur={blurInput}>
                <option value="" style={{ background: "var(--color-card)", color: "var(--color-text-primary)" }}>Select gender</option>
                {GENDERS.map((g) => <option key={g} value={g} style={{ background: "var(--color-card)", color: "var(--color-text-primary)" }}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">Blood Group</label>
              <select value={form.bloodGroup} onChange={(e) => setForm((p) => ({ ...p, bloodGroup: e.target.value }))}
                className={inputCls} style={S.input} onFocus={focusInput} onBlur={blurInput}>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b} style={{ background: "var(--color-card)", color: "var(--color-text-primary)" }}>{b}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div>
          <SectionLabel text="Medical History" />
          <TagInput value={historyInput} onChange={setHistoryInput}
            onAdd={() => { if (!historyInput.trim()) return; setForm((p) => ({ ...p, medicalHistory: [...p.medicalHistory, historyInput.trim()] })); setHistoryInput(""); }}
            onRemove={(i) => setForm((p) => ({ ...p, medicalHistory: p.medicalHistory.filter((_, idx) => idx !== i) }))}
            items={form.medicalHistory} placeholder="e.g. Appendix surgery 2019" />
        </div>
        <div>
          <SectionLabel text="Patient Location *" />
          {allLocations.length === 0 ? (
            <div className="p-4 rounded-xl text-center" style={S.section}>
              <p className="text-sm text-[var(--color-text-secondary)]">No clinics or hospitals found.</p>
              <p className="text-xs mt-1 text-[var(--color-text-secondary)]">Add locations in Settings first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allLocations.map((loc) => {
                const selected = selectedLocations.find((l) => l.locationId === loc.locationId);
                const isClinic = loc.locationType === "Clinic";
                return (
                  <button key={loc.locationId} onClick={() => toggleLocation(loc)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                    style={{
                      background: selected ? isClinic ? "color-mix(in srgb, var(--color-primary) 12%, transparent)" : "rgba(56,189,248,0.12)" : "var(--color-bg)",
                      border: selected ? isClinic ? "1px solid var(--color-primary)" : "1px solid #38bdf8" : "1px solid var(--color-border)",
                    }}>
                    <span className="text-lg">{isClinic ? "🏥" : "🏨"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate"
                        style={{ color: selected ? isClinic ? "var(--color-primary)" : "#38bdf8" : "var(--color-text-primary)" }}>
                        {loc.locationName}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{loc.locationType}</p>
                    </div>
                    {selected && <span style={{ color: isClinic ? "var(--color-primary)" : "#38bdf8" }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button onClick={handleSubmit} disabled={isLoading}
          className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,var(--color-primary),color-mix(in srgb, var(--color-primary) 80%, black))", boxShadow: "0 4px 20px color-mix(in srgb, var(--color-primary) 30%, transparent)" }}>
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
      setPatientsTotal(Number(res?.data?.pagination?.total || res?.data?.patients?.length || 0));
    } catch { toast.error("Failed to load patients"); }
    finally { setIsLoading(false); }
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
    } catch { toast.error("Failed to load patient"); }
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
    } catch { toast.error("Failed to delete"); }
  };

  if (view === "add") return (
    <>
      <AddPatientForm onBack={() => setView("list")}
        onAdded={(p) => { setPatients((prev) => [p, ...prev]); setView("list"); }} />
      <ConfirmDialog {...dialogProps} />
    </>
  );

  if (view === "detail" && activePatient) return (
    <>
      <PatientDetailPage
        patient={activePatient}
        onBack={() => setView("list")}
        onNewCheckup={() => { setEditingCheckup(null); setView("checkup"); }}
        onEditCheckup={(checkup) => { setEditingCheckup(checkup); setView("checkup"); }}
        refreshTrigger={refreshTrigger}
        confirmAction={confirm}
      />
      <ConfirmDialog {...dialogProps} />
    </>
  );

  if (view === "checkup" && activePatient) return (
    <>
      <CheckupForm
        patient={activePatient}
        existingCheckup={editingCheckup}
        onBack={() => setView("detail")}
        onSaved={() => { setRefreshTrigger(p => p + 1); setView("detail"); }}
      />
      <ConfirmDialog {...dialogProps} />
    </>
  );

  return (
    <>
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Patients</h2>
          <p className="text-xs mt-0.5 text-[var(--color-text-secondary)]">{patientsTotal} total patients</p>
        </div>
        <button onClick={() => setView("add")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 hover:opacity-90 w-fit"
          style={{ background: "linear-gradient(135deg,var(--color-primary),color-mix(in srgb, var(--color-primary) 80%, black))", boxShadow: "0 4px 15px color-mix(in srgb, var(--color-primary) 25%, transparent)" }}>
          + Add Patient
        </button>
      </div>

      <div className="relative mb-5">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-secondary)]">🔍</span>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
          style={S.input}
          onFocus={focusInput}
          onBlur={blurInput} />
      </div>

      <div className="rounded-2xl overflow-hidden" style={S.card}>
        <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-3"
          style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
          {["Patient", "Age & Gender", "Phone", "Location", "Added"].map((h) => (
            <p key={h} className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{h}</p>
          ))}
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
            <p className="text-sm font-bold text-[var(--color-text-primary)] mb-1">{search ? "No patients found" : "No patients yet"}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{search ? "Try a different search" : "Click + Add Patient to get started"}</p>
          </div>
        ) : (
          patients.map((patient) => (
            <div key={patient._id} onClick={() => openPatient(patient)}
              className="group cursor-pointer transition-all duration-200"
              style={{ borderBottom: "1px solid var(--color-border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--color-primary) 6%, transparent)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>

              <div className="sm:hidden flex items-center gap-3 px-4 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,var(--color-primary),color-mix(in srgb, var(--color-primary) 80%, black))" }}>
                  {getInitials(patient.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{patient.name}</p>
                  <p className="text-xs mt-0.5 text-[var(--color-text-secondary)]">{patient.age} yrs · {patient.gender}</p>
                  {patient.locations?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {patient.locations.map((loc, i) => <LocationTag key={i} location={loc} />)}
                    </div>
                  )}
                </div>
                <button onClick={(e) => handleDeletePatient(patient._id, e)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover-danger-soft flex-shrink-0"
                  style={{ color: "var(--color-danger)", border: "1px solid color-mix(in srgb, var(--color-danger) 28%, transparent)" }}>🗑</button>
              </div>

              <div className="hidden sm:grid grid-cols-5 gap-4 items-center px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,var(--color-primary),color-mix(in srgb, var(--color-primary) 80%, black))" }}>
                    {getInitials(patient.name)}
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{patient.name}</span>
                </div>
                <span className="text-sm text-[var(--color-text-secondary)]">{patient.age} yrs · {patient.gender}</span>
                <span className="text-sm text-[var(--color-text-secondary)]">{patient.phone}</span>
                <div className="flex flex-wrap gap-1">
                  {patient.locations?.length > 0
                    ? patient.locations.map((loc, i) => <LocationTag key={i} location={loc} />)
                    : <span className="text-xs text-[var(--color-text-secondary)]">—</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-secondary)]">{formatDate(patient.createdAt)}</span>
                  <button onClick={(e) => handleDeletePatient(patient._id, e)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover-danger-soft"
                    style={{ color: "var(--color-danger)", border: "1px solid color-mix(in srgb, var(--color-danger) 28%, transparent)" }}>🗑</button>
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