import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import logo from "../assets/logo-compact.webp";

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
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-primary)",
  },
  card: {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
  },
};

const focusStyle = (e) => (e.target.style.border = "1px solid var(--color-primary)");
const blurStyle = (e) => (e.target.style.border = "1px solid var(--color-border)");
const inputCls = "w-full rounded-xl px-4 py-3 text-sm outline-none transition";

// ─── Searchable Input with Suggestions ───────────────────────────────────────

function SuggestInput({ value, onChange, suggestions, placeholder, label, required }) {
  const [open, setOpen] = useState(false);
  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 8);

  return (
    <div className="relative">
      {label && (
        <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
          {label} {required && <span className="text-[var(--color-primary)]">*</span>}
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
        <div className="absolute z-50 mt-1 max-h-[200px] w-full overflow-y-auto rounded-xl border bg-[var(--color-card)] shadow-lg">
          {filtered.map((s) => (
            <button key={s} type="button"
              className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
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
      <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">{label}</label>
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
          className="rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20">
          + Add
        </button>
        {open && input && filtered.length > 0 && (
          <div className="absolute left-0 right-16 top-full z-50 mt-1 overflow-hidden rounded-xl border bg-[var(--color-card)] shadow-lg">
            {filtered.map((s) => (
              <button key={s} type="button"
                className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
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
              style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", color: "var(--color-primary)" }}>
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
                background: current >= step.num ? "var(--color-primary)" : "var(--color-card)",
                border: current >= step.num ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                color: current >= step.num ? "white" : "var(--color-text-secondary)",
                boxShadow: current >= step.num ? "0 4px 12px rgba(37,99,235,0.25)" : "none",
              }}>
              {current > step.num ? "✓" : step.num}
            </div>
            <span className="text-xs mt-1 font-medium" style={{ color: current >= step.num ? "var(--color-primary)" : "var(--color-text-secondary)" }}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="w-16 sm:w-24 h-0.5 mb-4 mx-2 transition-all duration-300"
              style={{ background: current > step.num ? "var(--color-primary)" : "var(--color-border)" }} />
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
          <span className="text-sm font-bold text-[var(--color-text-primary)]">
            {type === "clinic" ? "Clinic" : "Hospital"} {index + 1}
          </span>
        </div>
        <button type="button" onClick={onRemove}
          className="text-xs px-2.5 py-1.5 rounded-lg transition-all hover-danger-soft"
          style={{ color: "var(--color-danger)", border: "1px solid rgba(239,68,68,0.25)" }}>
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
            {type === "clinic" ? "Clinic" : "Hospital"} Name <span className="text-[var(--color-primary)]">*</span>
          </label>
          <input value={location.name}
            onChange={(e) => onChange({ ...location, name: e.target.value })}
            placeholder={type === "clinic" ? "e.g. Doctors Hospital" : "e.g. Services Hospital"}
            className={inputCls} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
            Address <span className="text-[var(--color-primary)]">*</span>
          </label>
          <input value={location.address}
            onChange={(e) => onChange({ ...location, address: e.target.value })}
            placeholder="e.g. Gulberg, Lahore"
            className={inputCls} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
      </div>

      {/* Sessions */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">Working Sessions</p>
        {location.sessions.length === 0 && (
          <p className="mb-3 text-xs text-[var(--color-text-secondary)]">No sessions added yet</p>
        )}
        <div className="space-y-2 mb-3">
          {location.sessions.map((session, si) => {
            const overlapping = isTimeOverlapping(session.day, session.startTime, session.endTime, occupied);
            return (
              <div key={si} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-xl items-end"
                style={{
                  background: overlapping ? "rgba(239,68,68,0.06)" : "var(--color-bg)",
                  border: overlapping ? "1px solid rgba(239,68,68,0.25)" : "1px solid var(--color-border)",
                }}>
                <div>
                  <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">Day</label>
                  <select value={session.day} onChange={(e) => updateSession(si, "day", e.target.value)}
                    className={inputCls} style={{ ...S.input, opacity: overlapping ? 0.6 : 1 }}
                    onFocus={focusStyle} onBlur={blurStyle}>
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">Start Time</label>
                  <input type="time" value={session.startTime}
                    onChange={(e) => updateSession(si, "startTime", e.target.value)}
                    className={inputCls} style={{ ...S.input, opacity: overlapping ? 0.6 : 1 }}
                    onFocus={focusStyle} onBlur={blurStyle} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">End Time</label>
                  <input type="time" value={session.endTime}
                    onChange={(e) => updateSession(si, "endTime", e.target.value)}
                    className={inputCls} style={{ ...S.input, opacity: overlapping ? 0.6 : 1 }}
                    onFocus={focusStyle} onBlur={blurStyle} />
                </div>
                <div className="flex items-end gap-2">
                  {overlapping && (
                    <span className="text-xs px-2 py-1 rounded-lg flex-1 text-center"
                      style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-danger)" }}>
                      ⚠ Overlap
                    </span>
                  )}
                  <button type="button" onClick={() => removeSession(si)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover-danger-soft flex-shrink-0"
                    style={{ color: "var(--color-danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={addSession}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: "rgba(37,99,235,0.08)", border: "1px dashed rgba(37,99,235,0.35)", color: "var(--color-primary)" }}>
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
      const { confirmPassword: _confirmPassword, ...personalData } = personal;
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
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] px-4 py-8 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/80 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-24 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(222,216,207,0.45)_1px,transparent_1px),linear-gradient(to_bottom,rgba(222,216,207,0.45)_1px,transparent_1px)] bg-size-[52px_52px] opacity-[0.18] [mask-image:radial-gradient(circle_at_center,black_45%,transparent_100%)]" />
      <div className="relative mx-auto w-full max-w-4xl">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-border)]/80 bg-[var(--color-primary)] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)]">
            <img src={logo} alt="MedAlerto" className="h-10 w-auto rounded-full" />
          </div>
          <span className="bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-primary)] bg-clip-text text-lg font-black tracking-[0.3em] text-transparent sm:text-xl">
            MEDALERTO
          </span>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-1 text-2xl font-heading font-semibold text-[var(--color-text-primary)] sm:text-3xl">Create your account</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[var(--color-secondary)] transition hover:opacity-80">
              Sign in
            </Link>
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator current={step} />

        {/* Card */}
        <div className="rounded-[2rem] border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-5 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.18)] backdrop-blur-md sm:p-8">

          {/* ── STEP 1: Personal Info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="mb-5 text-lg font-heading font-semibold text-[var(--color-text-primary)]">Personal Information</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Full Name <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <input value={personal.fullName} onChange={(e) => updatePersonal("fullName", e.target.value)}
                    placeholder="Dr. Ahmed Raza" className={inputCls} style={S.input}
                    onFocus={focusStyle} onBlur={blurStyle} />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Gender <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <div className="flex gap-2">
                    {GENDERS.map((g) => (
                      <button key={g} type="button" onClick={() => updatePersonal("gender", g)}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: personal.gender === g ? "rgba(93,112,82,0.15)" : "var(--color-bg)",
                          border: personal.gender === g ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                          color: personal.gender === g ? "var(--color-primary)" : "var(--color-text-secondary)",
                        }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Phone <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <input value={personal.phone} onChange={(e) => updatePersonal("phone", e.target.value)}
                    placeholder="03001234567" className={inputCls} style={S.input}
                    onFocus={focusStyle} onBlur={blurStyle} />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Email <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <input type="email" value={personal.email} onChange={(e) => updatePersonal("email", e.target.value)}
                    placeholder="doctor@example.com" className={inputCls} style={S.input}
                    onFocus={focusStyle} onBlur={blurStyle} />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Password <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"}
                      value={personal.password} onChange={(e) => updatePersonal("password", e.target.value)}
                      placeholder="Min. 8 characters" className={inputCls + " pr-10"} style={S.input}
                      onFocus={focusStyle} onBlur={blurStyle} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-secondary)]">
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Confirm Password <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <div className="relative">
                    <input type={showConfirm ? "text" : "password"}
                      value={personal.confirmPassword} onChange={(e) => updatePersonal("confirmPassword", e.target.value)}
                      placeholder="Repeat password" className={inputCls + " pr-10"}
                      style={{ ...S.input, borderColor: personal.confirmPassword ? (personal.password === personal.confirmPassword ? "var(--color-primary)" : "var(--color-danger)") : "var(--color-border)" }}
                      onFocus={focusStyle} onBlur={blurStyle} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-secondary)]">
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
              <h2 className="mb-5 text-lg font-bold text-[var(--color-text-primary)]">Professional Information</h2>

              {/* Title */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                  Professional Title <span className="text-[var(--color-primary)]">*</span>
                </label>
                <div className="flex gap-2">
                  {TITLES.map((t) => (
                    <button key={t} type="button" onClick={() => updateProfessional("title", t)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: professional.title === t ? "rgba(93,112,82,0.15)" : "var(--color-bg)",
                        border: professional.title === t ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                        color: professional.title === t ? "var(--color-primary)" : "var(--color-text-secondary)",
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
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Medical University <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <input value={professional.university}
                    onChange={(e) => updateProfessional("university", e.target.value)}
                    placeholder="e.g. King Edward Medical University"
                    className={inputCls} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Graduation Year <span className="text-[var(--color-primary)]">*</span>
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
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Years of Experience <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <input type="number" value={professional.yearsOfExperience}
                    onChange={(e) => updateProfessional("yearsOfExperience", e.target.value)}
                    placeholder="e.g. 8" min="0"
                    className={inputCls} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    PMDC Registration Number <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <input value={professional.pmdcNumber}
                    onChange={(e) => updateProfessional("pmdcNumber", e.target.value)}
                    placeholder="e.g. PMDC-12345"
                    className={inputCls} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
                </div>

                {/* License Status */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">License Status</label>
                  <div className="flex gap-2">
                    {LICENSE_STATUSES.map((s) => (
                      <button key={s} type="button" onClick={() => updateProfessional("licenseStatus", s)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: professional.licenseStatus === s ? "rgba(93,112,82,0.15)" : "var(--color-bg)",
                          border: professional.licenseStatus === s ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                          color: professional.licenseStatus === s ? "var(--color-primary)" : "var(--color-text-secondary)",
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    License Issue Date <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <input type="date" value={professional.licenseIssueDate}
                    onChange={(e) => updateProfessional("licenseIssueDate", e.target.value)}
                    className={inputCls} style={S.input}
                    onFocus={focusStyle} onBlur={blurStyle} />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    License Expiry Date <span className="text-xs opacity-60">(optional)</span>
                  </label>
                  <input type="date" value={professional.licenseExpiryDate}
                    onChange={(e) => updateProfessional("licenseExpiryDate", e.target.value)}
                    className={inputCls} style={S.input}
                    onFocus={focusStyle} onBlur={blurStyle} />
                </div>

                {/* PMDC Certificate Upload — disabled until Cloudinary */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    PMDC Certificate <span className="text-xs opacity-60">(optional — coming soon)</span>
                  </label>
                    <div className="w-full rounded-full border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                    📎 Upload will be available soon
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Clinics & Hospitals ── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">Clinics & Hospitals</h2>
              <p className="mb-5 text-xs text-[var(--color-text-secondary)]">
                Add your practice locations. Sessions with overlapping times will be highlighted.
              </p>

              {/* Clinics */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">🏥 Clinics</p>
                  <button type="button" onClick={addClinic}
                    className="rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-all hover:scale-105 hover:bg-[var(--color-primary)]/15 active:scale-95">
                    + Add Clinic
                  </button>
                </div>
                {clinics.length === 0 && (
                  <div className="mb-2 rounded-[2rem] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] py-6 text-center">
                    <p className="text-xs text-[var(--color-text-secondary)]">No clinics added yet</p>
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
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">🏨 Hospitals</p>
                  <button type="button" onClick={addHospital}
                    className="rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-all hover:scale-105 hover:bg-[var(--color-primary)]/15 active:scale-95">
                    + Add Hospital
                  </button>
                </div>
                {hospitals.length === 0 && (
                  <div className="mb-2 rounded-[2rem] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] py-6 text-center">
                    <p className="text-xs text-[var(--color-text-secondary)]">No hospitals added yet</p>
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
                className="flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] py-3.5 text-sm font-bold text-[var(--color-text-secondary)] transition-all hover:scale-105 hover:bg-[var(--color-muted)] active:scale-95"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                ← Back
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={handleNext}
                className="flex-1 rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] py-3.5 text-sm font-bold text-[var(--color-primary-foreground)] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] transition-all hover:scale-105 hover:shadow-[0_6px_24px_-4px_rgba(93,112,82,0.25)] active:scale-95"
                style={{ background: "var(--color-primary)", boxShadow: "0 4px 20px rgba(93,112,82,0.15)" }}>
                Continue →
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isLoading}
                className="flex-1 rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] py-3.5 text-sm font-bold text-[var(--color-primary-foreground)] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] transition-all hover:scale-105 hover:shadow-[0_6px_24px_-4px_rgba(93,112,82,0.25)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                style={{ background: "var(--color-primary)", boxShadow: "0 4px 20px rgba(93,112,82,0.15)" }}>
                {isLoading ? "Creating Account..." : "Create Account ✓"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}