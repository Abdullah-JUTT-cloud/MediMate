import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import logo from "../assets/logo.svg";

// ─── Constants ────────────────────────────────────────────────────────────────

const TITLES = ["Dr.", "Prof.", "Consultant"];
const GENDERS = ["Male", "Female", "Other"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LICENSE_STATUSES = ["Active", "Inactive", "Suspended"];

const DEGREE_SUGGESTIONS = [
  "MBBS", "BDS", "BHMS", "BUMS", "BAMS", "DVM", "Pharm.D", "DPT",
  "MS", "MCh", "MD", "FCPS", "MCPS", "MRCP",
  "FCPS (Surgery)", "FCPS Dermatology", "FCPS Gynecology", "FCPS Urology",
  "FCPS Cardiology", "FCPS Orthopedics", "FCPS Ophthalmology", "FCPS ENT",
  "FCPS Psychiatry", "FCPS Neurology", "FCPS Pediatrics", "FCPS Medicine",
  "MD Dermatology", "MD Gynecology", "MD Cardiology", "MD Psychiatry",
  "MD Neurology", "MD Pediatrics", "MD Medicine",
  "MS Urology", "MS Orthopedics", "MS ENT",
  "MCh Urology", "MCh Orthopedics",
  "MCPS Dermatology", "MCPS Gynecology",
  "DGO", "DDV", "DO", "DLO", "DCH",
  "MDS", "BPO", "BOT", "B.Sc MLT", "B.Sc Nursing",
  "B.Sc Radiology", "B.Sc Optometry",
  "Diploma Aesthetic Medicine", "Diploma Cosmetology",
  "Diploma Endodontics", "Certificate Trichology",
  "MBBS + Hair Transplant Certification",
  "Postgraduate Diploma Dermatology",
];

const SPECIALIZATION_SUGGESTIONS = [
  "General Physician", "Dermatologist", "Hair Transplant Surgeon",
  "Cosmetologist", "Aesthetic Medicine", "Gynecologist", "Obstetrician",
  "Urologist", "Cardiologist", "Orthopedic Surgeon", "Neurologist",
  "Psychiatrist", "Pediatrician", "ENT Specialist", "Ophthalmologist",
  "Dentist", "Orthodontist", "Oral Surgeon", "Endodontist",
  "General Surgeon", "Plastic Surgeon", "Vascular Surgeon",
  "Gastroenterologist", "Hepatologist", "Pulmonologist", "Nephrologist",
  "Endocrinologist", "Rheumatologist", "Oncologist", "Hematologist",
  "Radiologist", "Anesthesiologist", "Pathologist", "Physical Therapist",
  "Pharmacist", "Veterinarian", "Homeopath", "Nutritionist",
];

// ─── Shared Styles ────────────────────────────────────────────────────────────

const S = {
  input: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(16,184,169,0.15)",
    color: "white",
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(16,184,169,0.12)",
  },
};

const focusStyle = (e) => (e.target.style.border = "1px solid #10B8A9");
const blurStyle = (e) => (e.target.style.border = "1px solid rgba(16,184,169,0.15)");
const inputCls = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all";

// ─── Searchable Input with Suggestions ───────────────────────────────────────

function SuggestInput({ value, onChange, suggestions, placeholder, label, required }) {
  const [open, setOpen] = useState(false);
  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 8);

  return (
    <div className="relative">
      {label && (
        <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
          {label} {required && <span style={{ color: "#10B8A9" }}>*</span>}
        </label>
      )}
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={(e) => { focusStyle(e); setOpen(true); }}
        onBlur={(e) => { blurStyle(e); setTimeout(() => setOpen(false), 150); }}
        placeholder={placeholder}
        className={inputCls}
        style={S.input}
      />
      {open && value && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-xl"
          style={{ background: "#0a1628", border: "1px solid rgba(16,184,169,0.2)", maxHeight: "200px", overflowY: "auto" }}>
          {filtered.map((s) => (
            <button key={s} type="button"
              className="w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-teal-500 hover:bg-opacity-10"
              style={{ color: "#94a3b8" }}
              onMouseDown={() => { onChange(s); setOpen(false); }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tag List Input ───────────────────────────────────────────────────────────

function TagListInput({ label, items, onAdd, onRemove, placeholder, suggestions = [] }) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes(input.toLowerCase()) && !items.includes(s)
  ).slice(0, 6);

  const add = () => {
    if (!input.trim()) return;
    if (items.includes(input.trim())) { toast.error("Already added"); return; }
    onAdd(input.trim());
    setInput("");
    setOpen(false);
  };

  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>{label}</label>
      <div className="relative flex gap-2">
        <input value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onFocus={(e) => { focusStyle(e); setOpen(true); }}
          onBlur={(e) => { blurStyle(e); setTimeout(() => setOpen(false), 150); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all"
          style={S.input} />
        <button type="button" onClick={add}
          className="px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: "rgba(16,184,169,0.12)", color: "#10B8A9" }}>
          + Add
        </button>
        {open && input && filtered.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-16 mt-1 rounded-xl overflow-hidden shadow-xl"
            style={{ background: "#0a1628", border: "1px solid rgba(16,184,169,0.2)" }}>
            {filtered.map((s) => (
              <button key={s} type="button"
                className="w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-teal-500 hover:bg-opacity-10"
                style={{ color: "#94a3b8" }}
                onMouseDown={() => { onAdd(s); setInput(""); setOpen(false); }}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: "rgba(16,184,169,0.1)", border: "1px solid rgba(16,184,169,0.2)", color: "#10B8A9" }}>
              {item}
              <button type="button" onClick={() => onRemove(i)}
                className="opacity-70 hover:opacity-100" style={{ color: "#ef4444", fontSize: "10px" }}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  const steps = [
    { num: 1, label: "Personal" },
    { num: 2, label: "Professional" },
    { num: 3, label: "Locations" },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${current >= step.num ? "text-white" : ""}`}
              style={{
                background: current >= step.num ? "linear-gradient(135deg,#10B8A9,#0d9488)" : "rgba(255,255,255,0.05)",
                border: current >= step.num ? "none" : "1px solid rgba(255,255,255,0.1)",
                color: current >= step.num ? "white" : "#475569",
                boxShadow: current >= step.num ? "0 4px 12px rgba(16,184,169,0.3)" : "none",
              }}>
              {current > step.num ? "✓" : step.num}
            </div>
            <span className="text-xs mt-1 font-medium" style={{ color: current >= step.num ? "#10B8A9" : "#475569" }}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="w-16 sm:w-24 h-0.5 mb-4 mx-2 transition-all duration-300"
              style={{ background: current > step.num ? "#10B8A9" : "rgba(255,255,255,0.08)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Get all occupied time ranges ────────────────────────────────────────────

function getOccupiedSlots(clinics, hospitals, excludeLocationIndex, locationType) {
  const occupied = [];
  const allLocations = [
    ...clinics.map((c, i) => ({ ...c, type: "clinic", index: i })),
    ...hospitals.map((h, i) => ({ ...h, type: "hospital", index: i })),
  ];
  for (const loc of allLocations) {
    if (loc.type === locationType && loc.index === excludeLocationIndex) continue;
    for (const session of loc.sessions) {
      occupied.push({ day: session.day, startTime: session.startTime, endTime: session.endTime });
    }
  }
  return occupied;
}

function isTimeOverlapping(day, startTime, endTime, occupiedSlots) {
  const toMin = (t) => {
    if (!t || typeof t !== "string") return null;
    const parts = t.split(":");
    if (parts.length !== 2) return null;
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  };
  return occupiedSlots.some((slot) => {
    if (slot.day !== day) return false;
    const sStart = toMin(slot.startTime);
    const sEnd = toMin(slot.endTime);
    const nStart = toMin(startTime);
    const nEnd = toMin(endTime);
    if (sStart === null || sEnd === null || nStart === null || nEnd === null) return false;
    return nStart < sEnd && nEnd > sStart;
  });
}

// ─── Location Card (Clinic or Hospital) ──────────────────────────────────────

function LocationCard({ location, index, type, allClinics, allHospitals, onChange, onRemove }) {
  const occupied = getOccupiedSlots(allClinics, allHospitals, index, type);

  const addSession = () => {
    onChange({ ...location, sessions: [...location.sessions, { day: "Monday", startTime: "09:00", endTime: "17:00" }] });
  };

  const updateSession = (si, field, value) => {
    const sessions = location.sessions.map((s, i) => i === si ? { ...s, [field]: value } : s);
    onChange({ ...location, sessions });
  };

  const removeSession = (si) => {
    onChange({ ...location, sessions: location.sessions.filter((_, i) => i !== si) });
  };

  return (
    <div className="rounded-2xl p-4 sm:p-5" style={S.card}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-base">{type === "clinic" ? "🏥" : "🏨"}</span>
          <span className="text-sm font-bold text-white">
            {type === "clinic" ? "Clinic" : "Hospital"} {index + 1}
          </span>
        </div>
        <button type="button" onClick={onRemove}
          className="text-xs px-2.5 py-1.5 rounded-lg transition-all hover:bg-red-500 hover:bg-opacity-10"
          style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
            {type === "clinic" ? "Clinic" : "Hospital"} Name <span style={{ color: "#10B8A9" }}>*</span>
          </label>
          <input value={location.name}
            onChange={(e) => onChange({ ...location, name: e.target.value })}
            placeholder={type === "clinic" ? "e.g. Doctors Hospital" : "e.g. Services Hospital"}
            className={inputCls} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
            Address <span style={{ color: "#10B8A9" }}>*</span>
          </label>
          <input value={location.address}
            onChange={(e) => onChange({ ...location, address: e.target.value })}
            placeholder="e.g. Gulberg, Lahore"
            className={inputCls} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
      </div>

      {/* Sessions */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>Working Sessions</p>
        {location.sessions.length === 0 && (
          <p className="text-xs mb-3" style={{ color: "#475569" }}>No sessions added yet</p>
        )}
        <div className="space-y-2 mb-3">
          {location.sessions.map((session, si) => {
            const overlapping = isTimeOverlapping(session.day, session.startTime, session.endTime, occupied);
            return (
              <div key={si} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-xl items-end"
                style={{
                  background: overlapping ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)",
                  border: overlapping ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.05)",
                }}>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "#64748b" }}>Day</label>
                  <select value={session.day} onChange={(e) => updateSession(si, "day", e.target.value)}
                    className={inputCls} style={{ ...S.input, opacity: overlapping ? 0.6 : 1 }}
                    onFocus={focusStyle} onBlur={blurStyle}>
                    {DAYS.map((d) => <option key={d} value={d} style={{ background: "#0a1628" }}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "#64748b" }}>Start Time</label>
                  <input type="time" value={session.startTime}
                    onChange={(e) => updateSession(si, "startTime", e.target.value)}
                    className={inputCls} style={{ ...S.input, colorScheme: "dark", opacity: overlapping ? 0.6 : 1 }}
                    onFocus={focusStyle} onBlur={blurStyle} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "#64748b" }}>End Time</label>
                  <input type="time" value={session.endTime}
                    onChange={(e) => updateSession(si, "endTime", e.target.value)}
                    className={inputCls} style={{ ...S.input, colorScheme: "dark", opacity: overlapping ? 0.6 : 1 }}
                    onFocus={focusStyle} onBlur={blurStyle} />
                </div>
                <div className="flex items-end gap-2">
                  {overlapping && (
                    <span className="text-xs px-2 py-1 rounded-lg flex-1 text-center"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                      ⚠ Overlap
                    </span>
                  )}
                  <button type="button" onClick={() => removeSession(si)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-red-500 hover:bg-opacity-10 flex-shrink-0"
                    style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={addSession}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: "rgba(16,184,169,0.06)", border: "1px dashed rgba(16,184,169,0.3)", color: "#10B8A9" }}>
          + Add Session
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SIGNUP PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Step 1 state
  const [personal, setPersonal] = useState({
    fullName: "", gender: "", email: "", phone: "", password: "", confirmPassword: "",
  });

  // ── Step 2 state
  const [professional, setProfessional] = useState({
    title: "", specialization: "", primaryDegree: "",
    additionalDegrees: [], university: "", graduationYear: "",
    postgraduateTraining: [], yearsOfExperience: "",
    pmdcNumber: "", licenseStatus: "Active",
    licenseIssueDate: "", licenseExpiryDate: "",
    pmdcCertificate: "",
  });

  // ── Step 3 state
  const [clinics, setClinics] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  // ── Helpers
  const updatePersonal = (field, value) => setPersonal((p) => ({ ...p, [field]: value }));
  const updateProfessional = (field, value) => setProfessional((p) => ({ ...p, [field]: value }));

  // ── Step validation
  const validateStep1 = () => {
    const { fullName, gender, email, phone, password, confirmPassword } = personal;
    if (!fullName.trim()) { toast.error("Full name is required"); return false; }
    if (!gender) { toast.error("Gender is required"); return false; }
    if (!email.trim()) { toast.error("Email is required"); return false; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { toast.error("Please enter a valid email address"); return false; }
    if (!phone.trim()) { toast.error("Phone is required"); return false; }
    if (!password) { toast.error("Password is required"); return false; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return false; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return false; }
    return true;
  };

  const validateStep2 = () => {
    const { title, specialization, primaryDegree, university, graduationYear, yearsOfExperience, pmdcNumber, licenseIssueDate } = professional;
    if (!title) { toast.error("Title is required"); return false; }
    if (!specialization.trim()) { toast.error("Specialization is required"); return false; }
    if (!primaryDegree.trim()) { toast.error("Primary degree is required"); return false; }
    if (!university.trim()) { toast.error("University is required"); return false; }
    if (!graduationYear) { toast.error("Graduation year is required"); return false; }
    if (!yearsOfExperience) { toast.error("Years of experience is required"); return false; }
    if (!pmdcNumber.trim()) { toast.error("PMDC number is required"); return false; }
    if (!licenseIssueDate) { toast.error("License issue date is required"); return false; }
    return true;
  };

  const validateStep3 = () => {
    if (clinics.length === 0 && hospitals.length === 0) {
      toast.error("Add at least one clinic or hospital"); return false;
    }
    for (const clinic of clinics) {
      if (!clinic.name.trim()) { toast.error("Clinic name is required"); return false; }
      if (!clinic.address.trim()) { toast.error("Clinic address is required"); return false; }
      if (clinic.sessions.length === 0) { toast.error(`Add at least one session for ${clinic.name || "clinic"}`); return false; }
    }
    for (const hospital of hospitals) {
      if (!hospital.name.trim()) { toast.error("Hospital name is required"); return false; }
      if (!hospital.address.trim()) { toast.error("Hospital address is required"); return false; }
      if (hospital.sessions.length === 0) { toast.error(`Add at least one session for ${hospital.name || "hospital"}`); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setIsLoading(true);
    try {
      const { confirmPassword, ...personalData } = personal;
      await axiosInstance.post("/auth/register", {
        ...personalData,
        ...professional,
        clinics,
        hospitals,
      });
      toast.success("Account created! Please verify your email.");
      navigate("/verify-email", { state: { email: personal.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Location helpers
  const addClinic = () => setClinics((p) => [...p, { name: "", address: "", sessions: [] }]);
  const updateClinic = (i, data) => setClinics((p) => p.map((c, idx) => idx === i ? data : c));
  const removeClinic = (i) => setClinics((p) => p.filter((_, idx) => idx !== i));

  const addHospital = () => setHospitals((p) => [...p, { name: "", address: "", sessions: [] }]);
  const updateHospital = (i, data) => setHospitals((p) => p.map((h, idx) => idx === i ? data : h));
  const removeHospital = (i) => setHospitals((p) => p.filter((_, idx) => idx !== i));

  return (
    <div className="min-h-screen flex items-start justify-center py-8 px-4" style={{ background: "#0f1923" }}>
      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="MediMate" className="h-10 brightness-0 invert" />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-sm" style={{ color: "#64748b" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold transition-colors hover:opacity-80" style={{ color: "#10B8A9" }}>
              Sign in
            </Link>
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator current={step} />

        {/* Card */}
        <div className="rounded-3xl p-5 sm:p-8" style={{ background: "#0a1628", border: "1px solid rgba(16,184,169,0.12)" }}>

          {/* ── STEP 1: Personal Info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white mb-5">Personal Information</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
                    Full Name <span style={{ color: "#10B8A9" }}>*</span>
                  </label>
                  <input value={personal.fullName} onChange={(e) => updatePersonal("fullName", e.target.value)}
                    placeholder="Dr. Ahmed Raza" className={inputCls} style={S.input}
                    onFocus={focusStyle} onBlur={blurStyle} />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
                    Gender <span style={{ color: "#10B8A9" }}>*</span>
                  </label>
                  <div className="flex gap-2">
                    {GENDERS.map((g) => (
                      <button key={g} type="button" onClick={() => updatePersonal("gender", g)}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: personal.gender === g ? "rgba(16,184,169,0.15)" : "rgba(255,255,255,0.04)",
                          border: personal.gender === g ? "1px solid #10B8A9" : "1px solid rgba(16,184,169,0.15)",
                          color: personal.gender === g ? "#10B8A9" : "#64748b",
                        }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
                    Phone <span style={{ color: "#10B8A9" }}>*</span>
                  </label>
                  <input value={personal.phone} onChange={(e) => updatePersonal("phone", e.target.value)}
                    placeholder="03001234567" className={inputCls} style={S.input}
                    onFocus={focusStyle} onBlur={blurStyle} />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
                    Email <span style={{ color: "#10B8A9" }}>*</span>
                  </label>
                  <input type="email" value={personal.email} onChange={(e) => updatePersonal("email", e.target.value)}
                    placeholder="doctor@example.com" className={inputCls} style={S.input}
                    onFocus={focusStyle} onBlur={blurStyle} />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
                    Password <span style={{ color: "#10B8A9" }}>*</span>
                  </label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"}
                      value={personal.password} onChange={(e) => updatePersonal("password", e.target.value)}
                      placeholder="Min. 8 characters" className={inputCls + " pr-10"} style={S.input}
                      onFocus={focusStyle} onBlur={blurStyle} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#64748b" }}>
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
                    Confirm Password <span style={{ color: "#10B8A9" }}>*</span>
                  </label>
                  <div className="relative">
                    <input type={showConfirm ? "text" : "password"}
                      value={personal.confirmPassword} onChange={(e) => updatePersonal("confirmPassword", e.target.value)}
                      placeholder="Repeat password" className={inputCls + " pr-10"}
                      style={{ ...S.input, borderColor: personal.confirmPassword ? (personal.password === personal.confirmPassword ? "#10B8A9" : "#ef4444") : "rgba(16,184,169,0.15)" }}
                      onFocus={focusStyle} onBlur={blurStyle} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#64748b" }}>
                      {showConfirm ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Professional Info ── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white mb-5">Professional Information</h2>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
                  Professional Title <span style={{ color: "#10B8A9" }}>*</span>
                </label>
                <div className="flex gap-2">
                  {TITLES.map((t) => (
                    <button key={t} type="button" onClick={() => updateProfessional("title", t)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: professional.title === t ? "rgba(16,184,169,0.15)" : "rgba(255,255,255,0.04)",
                        border: professional.title === t ? "1px solid #10B8A9" : "1px solid rgba(16,184,169,0.15)",
                        color: professional.title === t ? "#10B8A9" : "#64748b",
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SuggestInput value={professional.specialization}
                  onChange={(v) => updateProfessional("specialization", v)}
                  suggestions={SPECIALIZATION_SUGGESTIONS}
                  placeholder="e.g. Dermatologist"
                  label="Specialization" required />

                <SuggestInput value={professional.primaryDegree}
                  onChange={(v) => updateProfessional("primaryDegree", v)}
                  suggestions={DEGREE_SUGGESTIONS}
                  placeholder="e.g. MBBS, BDS"
                  label="Primary Degree" required />

                <div className="sm:col-span-2">
                  <TagListInput label="Additional Degrees"
                    items={professional.additionalDegrees}
                    onAdd={(v) => updateProfessional("additionalDegrees", [...professional.additionalDegrees, v])}
                    onRemove={(i) => updateProfessional("additionalDegrees", professional.additionalDegrees.filter((_, idx) => idx !== i))}
                    placeholder="e.g. FCPS, MD"
                    suggestions={DEGREE_SUGGESTIONS} />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
                    Medical University <span style={{ color: "#10B8A9" }}>*</span>
                  </label>
                  <input value={professional.university}
                    onChange={(e) => updateProfessional("university", e.target.value)}
                    placeholder="e.g. King Edward Medical University"
                    className={inputCls} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
                    Graduation Year <span style={{ color: "#10B8A9" }}>*</span>
                  </label>
                  <input type="number" value={professional.graduationYear}
                    onChange={(e) => updateProfessional("graduationYear", e.target.value)}
                    placeholder="e.g. 2015" min="1970" max={new Date().getFullYear()}
                    className={inputCls} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
                </div>

                <div className="sm:col-span-2">
                  <TagListInput label="Postgraduate Training / Certifications"
                    items={professional.postgraduateTraining}
                    onAdd={(v) => updateProfessional("postgraduateTraining", [...professional.postgraduateTraining, v])}
                    onRemove={(i) => updateProfessional("postgraduateTraining", professional.postgraduateTraining.filter((_, idx) => idx !== i))}
                    placeholder="e.g. Hair Transplant Training, Aesthetic Medicine" />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
                    Years of Experience <span style={{ color: "#10B8A9" }}>*</span>
                  </label>
                  <input type="number" value={professional.yearsOfExperience}
                    onChange={(e) => updateProfessional("yearsOfExperience", e.target.value)}
                    placeholder="e.g. 8" min="0"
                    className={inputCls} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
                    PMDC Registration Number <span style={{ color: "#10B8A9" }}>*</span>
                  </label>
                  <input value={professional.pmdcNumber}
                    onChange={(e) => updateProfessional("pmdcNumber", e.target.value)}
                    placeholder="e.g. PMDC-12345"
                    className={inputCls} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
                </div>

                {/* License Status */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>License Status</label>
                  <div className="flex gap-2">
                    {LICENSE_STATUSES.map((s) => (
                      <button key={s} type="button" onClick={() => updateProfessional("licenseStatus", s)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: professional.licenseStatus === s ? "rgba(16,184,169,0.15)" : "rgba(255,255,255,0.04)",
                          border: professional.licenseStatus === s ? "1px solid #10B8A9" : "1px solid rgba(16,184,169,0.15)",
                          color: professional.licenseStatus === s ? "#10B8A9" : "#64748b",
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
                    License Issue Date <span style={{ color: "#10B8A9" }}>*</span>
                  </label>
                  <input type="date" value={professional.licenseIssueDate}
                    onChange={(e) => updateProfessional("licenseIssueDate", e.target.value)}
                    className={inputCls} style={{ ...S.input, colorScheme: "dark" }}
                    onFocus={focusStyle} onBlur={blurStyle} />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
                    License Expiry Date <span className="text-xs opacity-60">(optional)</span>
                  </label>
                  <input type="date" value={professional.licenseExpiryDate}
                    onChange={(e) => updateProfessional("licenseExpiryDate", e.target.value)}
                    className={inputCls} style={{ ...S.input, colorScheme: "dark" }}
                    onFocus={focusStyle} onBlur={blurStyle} />
                </div>

                {/* PMDC Certificate Upload — disabled until Cloudinary */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
                    PMDC Certificate <span className="text-xs opacity-60">(optional — coming soon)</span>
                  </label>
                  <div className="w-full px-4 py-3 rounded-xl text-sm flex items-center gap-2 cursor-not-allowed"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)", color: "#475569" }}>
                    📎 Upload will be available soon
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Clinics & Hospitals ── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-white mb-2">Clinics & Hospitals</h2>
              <p className="text-xs mb-5" style={{ color: "#64748b" }}>
                Add your practice locations. Sessions with overlapping times will be highlighted.
              </p>

              {/* Clinics */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-white">🏥 Clinics</p>
                  <button type="button" onClick={addClinic}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(16,184,169,0.12)", color: "#10B8A9" }}>
                    + Add Clinic
                  </button>
                </div>
                {clinics.length === 0 && (
                  <div className="text-center py-6 rounded-2xl mb-2"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)" }}>
                    <p className="text-xs" style={{ color: "#475569" }}>No clinics added yet</p>
                  </div>
                )}
                <div className="space-y-3">
                  {clinics.map((clinic, i) => (
                    <LocationCard key={i} location={clinic} index={i} type="clinic"
                      allClinics={clinics} allHospitals={hospitals}
                      onChange={(data) => updateClinic(i, data)}
                      onRemove={() => removeClinic(i)} />
                  ))}
                </div>
              </div>

              {/* Hospitals */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-white">🏨 Hospitals</p>
                  <button type="button" onClick={addHospital}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(16,184,169,0.12)", color: "#10B8A9" }}>
                    + Add Hospital
                  </button>
                </div>
                {hospitals.length === 0 && (
                  <div className="text-center py-6 rounded-2xl mb-2"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)" }}>
                    <p className="text-xs" style={{ color: "#475569" }}>No hospitals added yet</p>
                  </div>
                )}
                <div className="space-y-3">
                  {hospitals.map((hospital, i) => (
                    <LocationCard key={i} location={hospital} index={i} type="hospital"
                      allClinics={clinics} allHospitals={hospitals}
                      onChange={(data) => updateHospital(i, data)}
                      onRemove={() => removeHospital(i)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ── */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}>
                ← Back
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={handleNext}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105"
                style={{ background: "linear-gradient(135deg,#10B8A9,#0d9488)", boxShadow: "0 4px 20px rgba(16,184,169,0.3)" }}>
                Continue →
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isLoading}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ background: "linear-gradient(135deg,#10B8A9,#0d9488)", boxShadow: "0 4px 20px rgba(16,184,169,0.3)" }}>
                {isLoading ? "Creating Account..." : "Create Account ✓"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}