import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useAuthStore from "../store/authStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];
const GENDERS = ["Male", "Female", "Other"];
const FREQUENCIES = ["Once a day", "Twice a day", "Three times a day", "Four times a day", "Every 8 hours", "Every 12 hours", "As needed"];
const DURATIONS = ["3 days", "5 days", "7 days", "10 days", "14 days", "1 month", "3 months", "Ongoing"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name) =>
  name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "P";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });

const emptyMedicine = () => ({ name: "", dosage: "", frequency: "", duration: "", instructions: "" });

// ─── Shared Styles ────────────────────────────────────────────────────────────

const S = {
  input: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" },
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" },
  section: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" },
};

const focusInput = (e) => (e.target.style.border = "1px solid #10B8A9");
const blurInput = (e) => (e.target.style.border = "1px solid rgba(255,255,255,0.1)");
const inputCls = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all";

// ─── Location Tag ─────────────────────────────────────────────────────────────

function LocationTag({ location }) {
  const isClinic = location.locationType === "Clinic";
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
      style={{
        background: isClinic ? "rgba(16,184,169,0.1)" : "rgba(56,189,248,0.1)",
        border: isClinic ? "1px solid rgba(16,184,169,0.2)" : "1px solid rgba(56,189,248,0.2)",
        color: isClinic ? "#10B8A9" : "#38bdf8",
      }}>
      {isClinic ? "🏥" : "🏨"} {location.locationName}
    </span>
  );
}

// ─── Back Button ──────────────────────────────────────────────────────────────

function BackButton({ onClick, label = "Back" }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80 mb-6"
      style={{ color: "#10B8A9" }}>
      ← {label}
    </button>
  );
}

function SectionLabel({ text }) {
  return <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>{text}</p>;
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

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
          style={{ background: "rgba(16,184,169,0.12)", color: "#10B8A9" }}>
          + Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: "rgba(16,184,169,0.1)", border: "1px solid rgba(16,184,169,0.2)", color: "#10B8A9" }}>
              {item}
              <button onClick={() => onRemove(i)} style={{ color: "#ef4444", fontSize: "10px" }}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NEW CHECKUP FORM
// ══════════════════════════════════════════════════════════════════════════════

function NewCheckupForm({ patient, onBack, onAdded }) {
  const [diseases, setDiseases] = useState([]);
  const [diseaseInput, setDiseaseInput] = useState("");
  const [labTests, setLabTests] = useState([]);
  const [labInput, setLabInput] = useState("");
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [nextAppointment, setNextAppointment] = useState("");
  const [medicines, setMedicines] = useState([emptyMedicine()]);
  const [isLoading, setIsLoading] = useState(false);

  const updateMedicine = (i, field, val) =>
    setMedicines((p) => p.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  const addMedicine = () => setMedicines((p) => [...p, emptyMedicine()]);
  const removeMedicine = (i) => {
    if (medicines.length === 1) { toast.error("At least one medicine required"); return; }
    setMedicines((p) => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!diagnosis.trim()) { toast.error("Diagnosis is required"); return; }
    if (medicines.some((m) => !m.name.trim() || !m.dosage.trim() || !m.frequency || !m.duration)) {
      toast.error("Fill all required medicine fields"); return;
    }
    setIsLoading(true);
    try {
      const res = await axiosInstance.post(`/checkups/${patient._id}`, {
        diseases, notes,
        prescription: { diagnosis, nextAppointment: nextAppointment || undefined, medicines, labTests },
      });
      toast.success("Checkup saved!");
      onAdded(res.data.checkup);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save checkup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-1">
      <BackButton onClick={onBack} label={`Back to ${patient.name}`} />
      <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-2xl" style={S.card}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#10B8A9,#0d9488)" }}>
          {getInitials(patient.name)}
        </div>
        <div>
          <p className="text-sm font-bold text-white">{patient.name}</p>
          <p className="text-xs" style={{ color: "#64748b" }}>{patient.age} yrs · {patient.gender}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs font-semibold" style={{ color: "#10B8A9" }}>New Checkup</p>
          <p className="text-xs" style={{ color: "#64748b" }}>{formatDate(new Date())}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Diseases */}
        <div className="rounded-2xl p-5" style={S.card}>
          <SectionLabel text="Diseases This Visit" />
          <TagInput value={diseaseInput} onChange={setDiseaseInput}
            onAdd={() => { if (!diseaseInput.trim()) return; setDiseases((p) => [...p, diseaseInput.trim()]); setDiseaseInput(""); }}
            onRemove={(i) => setDiseases((p) => p.filter((_, idx) => idx !== i))}
            items={diseases} placeholder="e.g. Hypertension" />
        </div>

        {/* Notes */}
        <div className="rounded-2xl p-5" style={S.card}>
          <SectionLabel text="Visit Notes" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="General notes about this visit..." rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={S.input} onFocus={focusInput} onBlur={blurInput} />
        </div>

        {/* Prescription */}
        <div className="rounded-2xl p-5" style={S.card}>
          <SectionLabel text="Prescription" />
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Diagnosis *</label>
              <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Hypertension Stage 2"
                className={inputCls} style={S.input} onFocus={focusInput} onBlur={blurInput} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Next Appointment (optional)</label>
              <input type="date" value={nextAppointment} onChange={(e) => setNextAppointment(e.target.value)}
                className={inputCls} style={{ ...S.input, colorScheme: "dark" }} onFocus={focusInput} onBlur={blurInput} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-3" style={{ color: "#94a3b8" }}>Medicines *</label>
              <div className="space-y-3">
                {medicines.map((med, i) => (
                  <div key={i} className="p-4 rounded-xl" style={S.section}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold px-2 py-1 rounded-lg"
                        style={{ background: "rgba(16,184,169,0.12)", color: "#10B8A9" }}>
                        💊 Medicine {i + 1}
                      </span>
                      <button onClick={() => removeMedicine(i)}
                        className="text-xs px-2 py-1 rounded-lg transition-all hover:bg-red-500 hover:bg-opacity-10"
                        style={{ color: "#ef4444" }}>Remove</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: "Name *", field: "name", placeholder: "e.g. Paracetamol", type: "text" },
                        { label: "Dosage *", field: "dosage", placeholder: "e.g. 500mg", type: "text" },
                      ].map(({ label, field, placeholder }) => (
                        <div key={field}>
                          <label className="block text-xs mb-1" style={{ color: "#64748b" }}>{label}</label>
                          <input value={med[field]} onChange={(e) => updateMedicine(i, field, e.target.value)}
                            placeholder={placeholder} className={inputCls} style={S.input}
                            onFocus={focusInput} onBlur={blurInput} />
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs mb-1" style={{ color: "#64748b" }}>Frequency *</label>
                        <select value={med.frequency} onChange={(e) => updateMedicine(i, "frequency", e.target.value)}
                          className={inputCls} style={S.input} onFocus={focusInput} onBlur={blurInput}>
                          <option value="" style={{ background: "#0a1628" }}>Select</option>
                          {FREQUENCIES.map((f) => <option key={f} value={f} style={{ background: "#0a1628" }}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: "#64748b" }}>Duration *</label>
                        <select value={med.duration} onChange={(e) => updateMedicine(i, "duration", e.target.value)}
                          className={inputCls} style={S.input} onFocus={focusInput} onBlur={blurInput}>
                          <option value="" style={{ background: "#0a1628" }}>Select</option>
                          {DURATIONS.map((d) => <option key={d} value={d} style={{ background: "#0a1628" }}>{d}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs mb-1" style={{ color: "#64748b" }}>Instructions</label>
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
                style={{ background: "rgba(16,184,169,0.06)", border: "1px dashed rgba(16,184,169,0.3)", color: "#10B8A9" }}>
                + Add Another Medicine
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "#94a3b8" }}>Lab Tests (optional)</label>
              <TagInput value={labInput} onChange={setLabInput}
                onAdd={() => { if (!labInput.trim()) return; setLabTests((p) => [...p, labInput.trim()]); setLabInput(""); }}
                onRemove={(i) => setLabTests((p) => p.filter((_, idx) => idx !== i))}
                items={labTests} placeholder="e.g. CBC, Blood Sugar" />
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={isLoading}
          className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ background: "linear-gradient(135deg,#10B8A9,#0d9488)", boxShadow: "0 4px 20px rgba(16,184,169,0.3)" }}>
          {isLoading ? "Saving..." : "Save Checkup ✓"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PATIENT DETAIL PAGE
// ══════════════════════════════════════════════════════════════════════════════

function PatientDetailPage({ patient, onBack, onNewCheckup }) {
  const [checkups, setCheckups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.get(`/checkups/${patient._id}`);
        setCheckups(res.data.checkups);
      } catch {
        toast.error("Failed to load checkups");
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [patient._id]);

  const handleDelete = async (checkupId) => {
    if (!window.confirm("Delete this checkup?")) return;
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
      <BackButton onClick={onBack} label="Back to Patients" />

      {/* Patient Header */}
      <div className="rounded-2xl p-5 sm:p-6 mb-5" style={S.card}>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#10B8A9,#0d9488)" }}>
            {getInitials(patient.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white">{patient.name}</h2>
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
              {patient.age} yrs · {patient.gender} · {patient.bloodGroup}
            </p>
            {/* Location tags */}
            {patient.locations?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {patient.locations.map((loc, i) => <LocationTag key={i} location={loc} />)}
              </div>
            )}
          </div>
          <button onClick={onNewCheckup}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105"
            style={{ background: "linear-gradient(135deg,#10B8A9,#0d9488)", boxShadow: "0 4px 15px rgba(16,184,169,0.3)" }}>
            + New Checkup
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Phone", value: patient.phone },
            { label: "Blood Group", value: patient.bloodGroup },
            { label: "Patient Since", value: formatDate(patient.createdAt) },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-xl" style={S.section}>
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>{label}</p>
              <p className="text-sm font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        {patient.medicalHistory?.length > 0 && (
          <div className="mt-4 p-4 rounded-xl" style={S.section}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#475569" }}>Medical History</p>
            <div className="flex flex-wrap gap-2">
              {patient.medicalHistory.map((h, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>{h}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checkup History */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white">Checkup History</h3>
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
          style={{ background: "rgba(16,184,169,0.1)", color: "#10B8A9" }}>
          {checkups.length} visit{checkups.length !== 1 ? "s" : ""}
        </span>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "#10B8A9", borderTopColor: "transparent" }} />
        </div>
      )}

      {!isLoading && checkups.length === 0 && (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
          <div className="text-4xl mb-3">🩺</div>
          <p className="text-sm font-bold text-white mb-1">No checkups yet</p>
          <p className="text-xs" style={{ color: "#475569" }}>Click "+ New Checkup" to record the first visit</p>
        </div>
      )}

      <div className="space-y-4">
        {checkups.map((checkup, idx) => (
          <div key={checkup._id} className="rounded-2xl overflow-hidden" style={S.card}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: "rgba(16,184,169,0.1)" }}>🩺</div>
                <div>
                  <p className="text-sm font-bold text-white">{checkup.prescription?.diagnosis || "No diagnosis"}</p>
                  <p className="text-xs" style={{ color: "#64748b" }}>{formatDate(checkup.createdAt)}</p>
                </div>
              </div>
              {idx === 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold hidden sm:block"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>Latest</span>
              )}
            </div>

            <div className="px-5 py-4 space-y-4">
              {checkup.diseases?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#475569" }}>Diseases:</span>
                  {checkup.diseases.map((d, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.15)" }}>
                      {d}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#475569" }}>Last Checkup:</span>
                <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>{formatDate(checkup.createdAt)}</span>
              </div>

              {checkup.notes && (
                <div className="p-3 rounded-xl" style={S.section}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#475569" }}>Notes</p>
                  <p className="text-sm" style={{ color: "#94a3b8" }}>{checkup.notes}</p>
                </div>
              )}

              {checkup.prescription?.medicines?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2.5" style={{ color: "#475569" }}>Prescription</p>
                  <div className="space-y-2">
                    {checkup.prescription.medicines.map((med, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={S.section}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "rgba(16,184,169,0.15)", color: "#10B8A9" }}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">
                            {med.name}<span className="font-normal ml-2" style={{ color: "#64748b" }}>— {med.dosage}</span>
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                            {med.frequency} · {med.duration}{med.instructions && ` · ${med.instructions}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {checkup.prescription?.labTests?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#475569" }}>Lab Tests</p>
                  <div className="flex flex-wrap gap-2">
                    {checkup.prescription.labTests.map((t, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium"
                        style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.2)" }}>
                        🧪 {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {checkup.prescription?.nextAppointment && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl w-fit"
                  style={{ background: "rgba(16,184,169,0.08)", border: "1px solid rgba(16,184,169,0.15)" }}>
                  <span>📅</span>
                  <span className="text-xs font-semibold" style={{ color: "#10B8A9" }}>
                    Next appointment: {formatDate(checkup.prescription.nextAppointment)}
                  </span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button onClick={() => handleDelete(checkup._id)}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl transition-all hover:bg-red-500 hover:bg-opacity-10"
                  style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                  🗑 Delete Checkup
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADD PATIENT FORM
// ══════════════════════════════════════════════════════════════════════════════

function AddPatientForm({ onBack, onAdded }) {
  const { doctor } = useAuthStore();
  const [form, setForm] = useState({
    name: "", age: "", gender: "", phone: "", bloodGroup: "Unknown", medicalHistory: [],
  });
  const [historyInput, setHistoryInput] = useState("");
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Build all available locations from doctor profile
  const allLocations = [
    ...(doctor?.clinics || []).map((c, i) => ({ locationType: "Clinic", locationId: c._id || `clinic_${i}`, locationName: c.name })),
    ...(doctor?.hospitals || []).map((h, i) => ({ locationType: "Hospital", locationId: h._id || `hospital_${i}`, locationName: h.name })),
  ];

  const toggleLocation = (loc) => {
    const exists = selectedLocations.find((l) => l.locationId === loc.locationId);
    if (exists) {
      setSelectedLocations((p) => p.filter((l) => l.locationId !== loc.locationId));
    } else {
      setSelectedLocations((p) => [...p, loc]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-1">
      <BackButton onClick={onBack} label="Back to Patients" />
      <div className="rounded-2xl p-5 sm:p-6 space-y-5" style={S.card}>

        {/* Basic Info */}
        <div>
          <SectionLabel text="Basic Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: "name", label: "Full Name *", placeholder: "Ahmed Raza", type: "text" },
              { name: "age", label: "Age *", placeholder: "34", type: "number" },
              { name: "phone", label: "Phone *", placeholder: "03001234567", type: "text" },
            ].map(({ name, label, placeholder, type }) => (
              <div key={name}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>{label}</label>
                <input name={name} type={type} value={form[name]} onChange={handleChange}
                  placeholder={placeholder} className={inputCls} style={S.input}
                  onFocus={focusInput} onBlur={blurInput} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Gender *</label>
              <select name="gender" value={form.gender} onChange={handleChange}
                className={inputCls} style={S.input} onFocus={focusInput} onBlur={blurInput}>
                <option value="" style={{ background: "#0a1628" }}>Select gender</option>
                {GENDERS.map((g) => <option key={g} value={g} style={{ background: "#0a1628" }}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Blood Group</label>
              <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange}
                className={inputCls} style={S.input} onFocus={focusInput} onBlur={blurInput}>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b} style={{ background: "#0a1628" }}>{b}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Medical History */}
        <div>
          <SectionLabel text="Medical History" />
          <TagInput value={historyInput} onChange={setHistoryInput}
            onAdd={() => { if (!historyInput.trim()) return; setForm((p) => ({ ...p, medicalHistory: [...p.medicalHistory, historyInput.trim()] })); setHistoryInput(""); }}
            onRemove={(i) => setForm((p) => ({ ...p, medicalHistory: p.medicalHistory.filter((_, idx) => idx !== i) }))}
            items={form.medicalHistory} placeholder="e.g. Appendix surgery 2019" />
        </div>

        {/* Location Selection */}
        <div>
          <SectionLabel text="Patient Location *" />
          {allLocations.length === 0 ? (
            <div className="p-4 rounded-xl text-center" style={S.section}>
              <p className="text-sm" style={{ color: "#475569" }}>No clinics or hospitals found.</p>
              <p className="text-xs mt-1" style={{ color: "#334155" }}>Add locations in Settings first.</p>
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
                      background: selected ? isClinic ? "rgba(16,184,169,0.12)" : "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.03)",
                      border: selected ? isClinic ? "1px solid #10B8A9" : "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.07)",
                    }}>
                    <span className="text-lg">{isClinic ? "🏥" : "🏨"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: selected ? isClinic ? "#10B8A9" : "#38bdf8" : "white" }}>
                        {loc.locationName}
                      </p>
                      <p className="text-xs" style={{ color: "#64748b" }}>{loc.locationType}</p>
                    </div>
                    {selected && <span className="text-sm" style={{ color: isClinic ? "#10B8A9" : "#38bdf8" }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={handleSubmit} disabled={isLoading}
          className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ background: "linear-gradient(135deg,#10B8A9,#0d9488)", boxShadow: "0 4px 20px rgba(16,184,169,0.3)" }}>
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
  const [view, setView] = useState("list");
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activePatient, setActivePatient] = useState(null);

  const fetchPatients = async (q = "") => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/patients${q ? `?search=${q}` : ""}`);
      setPatients(res.data.patients);
    } catch {
      toast.error("Failed to load patients");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);
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

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this patient?")) return;
    try {
      await axiosInstance.delete(`/patients/${id}`);
      setPatients((p) => p.filter((pt) => pt._id !== id));
      toast.success("Patient deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (view === "add") return <AddPatientForm onBack={() => setView("list")} onAdded={(p) => { setPatients((prev) => [p, ...prev]); setView("list"); }} />;
  if (view === "detail" && activePatient) return (
    <PatientDetailPage patient={activePatient} onBack={() => setView("list")} onNewCheckup={() => setView("checkup")} />
  );
  if (view === "checkup" && activePatient) return (
    <NewCheckupForm patient={activePatient} onBack={() => setView("detail")} onAdded={() => setView("detail")} />
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Patients</h2>
          <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{patients.length} total patients</p>
        </div>
        <button onClick={() => setView("add")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 hover:opacity-90 w-fit"
          style={{ background: "linear-gradient(135deg,#10B8A9,#0d9488)", boxShadow: "0 4px 15px rgba(16,184,169,0.25)" }}>
          + Add Patient
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#64748b" }}>🔍</span>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "white" }}
          onFocus={(e) => (e.target.style.border = "1px solid #10B8A9")}
          onBlur={(e) => (e.target.style.border = "1px solid rgba(255,255,255,0.07)")} />
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={S.card}>
        <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
          {["Patient", "Age & Gender", "Phone", "Location", "Added"].map((h) => (
            <p key={h} className="text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>{h}</p>
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "#10B8A9", borderTopColor: "transparent" }} />
          </div>
        )}

        {!isLoading && patients.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">👥</div>
            <p className="text-sm font-bold text-white mb-1">{search ? "No patients found" : "No patients yet"}</p>
            <p className="text-xs" style={{ color: "#475569" }}>{search ? "Try a different search" : "Click + Add Patient to get started"}</p>
          </div>
        )}

        {!isLoading && patients.map((patient) => (
          <div key={patient._id} onClick={() => openPatient(patient)}
            className="group cursor-pointer transition-all duration-200"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(16,184,169,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>

            {/* Mobile */}
            <div className="sm:hidden flex items-center gap-3 px-4 py-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#10B8A9,#0d9488)" }}>
                {getInitials(patient.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{patient.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{patient.age} yrs · {patient.gender}</p>
                {patient.locations?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {patient.locations.map((loc, i) => <LocationTag key={i} location={loc} />)}
                  </div>
                )}
              </div>
              <button onClick={(e) => handleDelete(patient._id, e)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-500 hover:bg-opacity-15 flex-shrink-0"
                style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                🗑
              </button>
            </div>

            {/* Desktop */}
            <div className="hidden sm:grid grid-cols-5 gap-4 items-center px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#10B8A9,#0d9488)" }}>
                  {getInitials(patient.name)}
                </div>
                <span className="text-sm font-semibold text-white truncate">{patient.name}</span>
              </div>
              <span className="text-sm" style={{ color: "#94a3b8" }}>{patient.age} yrs · {patient.gender}</span>
              <span className="text-sm" style={{ color: "#94a3b8" }}>{patient.phone}</span>
              <div className="flex flex-wrap gap-1">
                {patient.locations?.length > 0
                  ? patient.locations.map((loc, i) => <LocationTag key={i} location={loc} />)
                  : <span className="text-xs" style={{ color: "#475569" }}>—</span>
                }
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#64748b" }}>{formatDate(patient.createdAt)}</span>
                <button onClick={(e) => handleDelete(patient._id, e)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:bg-opacity-15"
                  style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}