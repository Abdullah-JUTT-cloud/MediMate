import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useThemedLogo from "../hooks/useThemedLogo";

// ─── Constants ────────────────────────────────────────────────────────────────

const TITLES = ["Dr.", "Prof.", "Consultant"];
const GENDERS = ["Male", "Female", "Other"];
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const LICENSE_STATUSES = ["Active", "Inactive", "Suspended"];

const DEGREE_SUGGESTIONS = [
  "MBBS",
  "BDS",
  "BHMS",
  "BUMS",
  "BAMS",
  "DVM",
  "Pharm.D",
  "DPT",
  "MS",
  "MCh",
  "MD",
  "FCPS",
  "MCPS",
  "MRCP",
  "FCPS (Surgery)",
  "FCPS Dermatology",
  "FCPS Gynecology",
  "FCPS Urology",
  "FCPS Cardiology",
  "FCPS Orthopedics",
  "FCPS Ophthalmology",
  "FCPS ENT",
  "FCPS Psychiatry",
  "FCPS Neurology",
  "FCPS Pediatrics",
  "FCPS Medicine",
  "MD Dermatology",
  "MD Gynecology",
  "MD Cardiology",
  "MD Psychiatry",
  "MD Neurology",
  "MD Pediatrics",
  "MD Medicine",
  "MS Urology",
  "MS Orthopedics",
  "MS ENT",
  "MCh Urology",
  "MCh Orthopedics",
  "MCPS Dermatology",
  "MCPS Gynecology",
  "DGO",
  "DDV",
  "DO",
  "DLO",
  "DCH",
  "MDS",
  "BPO",
  "BOT",
  "B.Sc MLT",
  "B.Sc Nursing",
  "B.Sc Radiology",
  "B.Sc Optometry",
  "Diploma Aesthetic Medicine",
  "Diploma Cosmetology",
  "Diploma Endodontics",
  "Certificate Trichology",
  "MBBS + Hair Transplant Certification",
  "Postgraduate Diploma Dermatology",
];

const SPECIALIZATION_SUGGESTIONS = [
  "General Physician",
  "Dermatologist",
  "Hair Transplant Surgeon",
  "Cosmetologist",
  "Aesthetic Medicine",
  "Gynecologist",
  "Obstetrician",
  "Urologist",
  "Cardiologist",
  "Orthopedic Surgeon",
  "Neurologist",
  "Psychiatrist",
  "Pediatrician",
  "ENT Specialist",
  "Ophthalmologist",
  "Dentist",
  "Orthodontist",
  "Oral Surgeon",
  "Endodontist",
  "General Surgeon",
  "Plastic Surgeon",
  "Vascular Surgeon",
  "Gastroenterologist",
  "Hepatologist",
  "Pulmonologist",
  "Nephrologist",
  "Endocrinologist",
  "Rheumatologist",
  "Oncologist",
  "Hematologist",
  "Radiologist",
  "Anesthesiologist",
  "Pathologist",
  "Physical Therapist",
  "Pharmacist",
  "Veterinarian",
  "Homeopath",
  "Nutritionist",
];

// ─── Shared Styles ────────────────────────────────────────────────────────────

const S = {
  input: {
    background: "var(--color-bg-soft)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-primary)",
  },
  card: {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
  },
};

const focusStyle = (e) => {
  e.target.style.borderColor = "var(--color-primary)";
  e.target.style.boxShadow = "0 0 0 4px rgba(13, 148, 136, 0.1)";
};
const blurStyle = (e) => {
  e.target.style.borderColor = "var(--color-border)";
  e.target.style.boxShadow = "none";
};
const inputCls = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 border border-[var(--color-border)] bg-[var(--color-bg-soft)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10";

const PASSWORD_RULES = [
  { key: "minLength", label: "At least 8 characters" },
  { key: "uppercase", label: "At least 1 uppercase letter" },
  { key: "number", label: "At least 1 number" },
  { key: "special", label: "At least 1 special character" },
];

const evaluatePassword = (password = "") => {
  const checks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["#ef4444", "#f97316", "#f59e0b", "#22c55e", "#14b8a6"];

  return {
    checks,
    score,
    percent: (score / PASSWORD_RULES.length) * 100,
    label: labels[score],
    color: colors[score],
    isValid: score === PASSWORD_RULES.length,
  };
};

// ─── Searchable Input with Suggestions ───────────────────────────────────────

function SuggestInput({
  value,
  onChange,
  suggestions,
  placeholder,
  label,
  required,
}) {
  const [open, setOpen] = useState(false);
  const filtered = suggestions
    .filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 8);

  return (
    <div className="relative">
      {label && (
        <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
          {label}{" "}
          {required && <span className="text-[var(--color-primary)]">*</span>}
        </label>
      )}
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={(e) => {
          focusStyle(e);
          setOpen(true);
        }}
        onBlur={(e) => {
          blurStyle(e);
          setTimeout(() => setOpen(false), 150);
        }}
        placeholder={placeholder}
        className={inputCls}
        style={S.input}
      />
      {open && value && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-[200px] w-full overflow-y-auto rounded-xl border bg-[var(--color-card)] shadow-lg">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
              onMouseDown={() => {
                onChange(s);
                setOpen(false);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tag List Input ───────────────────────────────────────────────────────────

function TagListInput({
  label,
  items,
  onAdd,
  onRemove,
  placeholder,
  suggestions = [],
}) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = suggestions
    .filter(
      (s) =>
        s.toLowerCase().includes(input.toLowerCase()) && !items.includes(s),
    )
    .slice(0, 6);

  const add = () => {
    if (!input.trim()) return;
    if (items.includes(input.trim())) {
      toast.error("Already added");
      return;
    }
    onAdd(input.trim());
    setInput("");
    setOpen(false);
  };

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
        {label}
      </label>
      <div className="relative flex gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={(e) => {
            focusStyle(e);
            setOpen(true);
          }}
          onBlur={(e) => {
            blurStyle(e);
            setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all"
          style={S.input}
        />
        <button
          type="button"
          onClick={add}
          className="rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20"
        >
          + Add
        </button>
        {open && input && filtered.length > 0 && (
          <div className="absolute left-0 right-16 top-full z-50 mt-1 overflow-hidden rounded-xl border bg-[var(--color-card)] shadow-lg">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
                onMouseDown={() => {
                  onAdd(s);
                  setInput("");
                  setOpen(false);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {items.map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="opacity-70 hover:opacity-100 text-[var(--color-danger)] text-[10px]"
              >
                ✕
              </button>
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
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border ${
                current >= step.num
                  ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-float)]"
                  : "bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-secondary)]"
              }`}
            >
              {step.num}
            </div>
            <span
              className="text-xs mt-1 font-medium"
              style={{
                color:
                  current >= step.num
                    ? "var(--color-primary)"
                    : "var(--color-text-secondary)",
              }}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="w-16 sm:w-24 h-0.5 mb-4 mx-2 transition-all duration-300"
              style={{
                background:
                  current > step.num
                    ? "var(--color-primary)"
                    : "var(--color-border)",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Get all occupied time ranges ────────────────────────────────────────────

function getOccupiedSlots(
  clinics,
  hospitals,
  excludeLocationIndex,
  locationType,
) {
  const occupied = [];
  const allLocations = [
    ...clinics.map((c, i) => ({ ...c, type: "clinic", index: i })),
    ...hospitals.map((h, i) => ({ ...h, type: "hospital", index: i })),
  ];
  for (const loc of allLocations) {
    if (loc.type === locationType && loc.index === excludeLocationIndex)
      continue;
    for (const session of loc.sessions) {
      occupied.push({
        day: session.day,
        startTime: session.startTime,
        endTime: session.endTime,
      });
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
    if (sStart === null || sEnd === null || nStart === null || nEnd === null)
      return false;
    return nStart < sEnd && nEnd > sStart;
  });
}

// ─── Location Card (Clinic or Hospital) ──────────────────────────────────────

function LocationCard({
  location,
  index,
  type,
  allClinics,
  allHospitals,
  onChange,
  onRemove,
}) {
  const occupied = getOccupiedSlots(allClinics, allHospitals, index, type);

  const addSession = () => {
    onChange({
      ...location,
      sessions: [
        ...location.sessions,
        { day: "Monday", startTime: "09:00", endTime: "17:00" },
      ],
    });
  };

  const updateSession = (si, field, value) => {
    const sessions = location.sessions.map((s, i) =>
      i === si ? { ...s, [field]: value } : s,
    );
    onChange({ ...location, sessions });
  };

  const removeSession = (si) => {
    onChange({
      ...location,
      sessions: location.sessions.filter((_, i) => i !== si),
    });
  };

  return (
    <div className="rounded-2xl p-4 sm:p-5" style={S.card}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[var(--color-text-primary)]">
            {type === "clinic" ? "Clinic" : "Hospital"} {index + 1}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all hover:bg-red-50 text-red-500 border border-red-100 hover:border-red-200"
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
            {type === "clinic" ? "Clinic" : "Hospital"} Name{" "}
            <span className="text-[var(--color-primary)]">*</span>
          </label>
          <input
            value={location.name}
            onChange={(e) => onChange({ ...location, name: e.target.value })}
            placeholder={
              type === "clinic"
                ? "e.g. Doctors Hospital"
                : "e.g. Services Hospital"
            }
            className={inputCls}
            style={S.input}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
            Address <span className="text-[var(--color-primary)]">*</span>
          </label>
          <input
            value={location.address}
            onChange={(e) => onChange({ ...location, address: e.target.value })}
            placeholder="e.g. Gulberg, Lahore"
            className={inputCls}
            style={S.input}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </div>
      </div>

      {/* Sessions */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
          Working Sessions
        </p>
        {location.sessions.length === 0 && (
          <p className="mb-3 text-xs text-[var(--color-text-secondary)]">
            No sessions added yet
          </p>
        )}
        <div className="space-y-2 mb-3">
          {location.sessions.map((session, si) => {
            const overlapping = isTimeOverlapping(
              session.day,
              session.startTime,
              session.endTime,
              occupied,
            );
            return (
              <div
                key={si}
                className={`grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-xl items-end border ${
                  overlapping
                    ? "bg-[var(--color-danger)]/10 border-[var(--color-danger)]/25"
                    : "bg-[var(--color-bg)] border-[var(--color-border)]"
                }`}
              >
                <div>
                  <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">
                    Day
                  </label>
                  <select
                    value={session.day}
                    onChange={(e) => updateSession(si, "day", e.target.value)}
                    className={inputCls}
                    style={{ ...S.input, opacity: overlapping ? 0.6 : 1 }}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={session.startTime}
                    onChange={(e) =>
                      updateSession(si, "startTime", e.target.value)
                    }
                    className={inputCls}
                    style={{ ...S.input, opacity: overlapping ? 0.6 : 1 }}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={session.endTime}
                    onChange={(e) =>
                      updateSession(si, "endTime", e.target.value)
                    }
                    className={inputCls}
                    style={{ ...S.input, opacity: overlapping ? 0.6 : 1 }}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>
                <div className="flex items-end gap-2">
                  {overlapping && (
                    <span
                      className="text-xs px-2 py-1 rounded-lg flex-1 text-center bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
                    >
                      ⚠ Overlap
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeSession(si)}
                    className="px-3 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 text-[var(--color-danger)] border border-[var(--color-danger)]/20 hover:bg-[var(--color-danger)]/10 text-xs font-bold uppercase tracking-wider"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addSession}
          className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all hover:bg-[var(--color-primary)] hover:text-white bg-[var(--color-primary)]/5 border border-dashed border-[var(--color-primary)]/30 text-[var(--color-primary)]"
        >
          + Add Working Session
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
  const location = useLocation();
  const logo = useThemedLogo();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Step 1 state
  // The landing-page CTA can hand off an email so the doctor never types it
  // twice.
  const [personal, setPersonal] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    email: location.state?.email ?? "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // ── Step 2 state
  const [professional, setProfessional] = useState({
    title: "",
    specialization: "",
    primaryDegree: "",
    additionalDegrees: [],
    university: "",
    graduationYear: "",
    postgraduateTraining: [],
    yearsOfExperience: "",
    pmdcNumber: "",
    licenseStatus: "Active",
    licenseIssueDate: "",
    licenseExpiryDate: "",
    pmdcCertificate: "",
    advanceBookingFee: "",
  });

  // ── Step 3 state
  const [clinics, setClinics] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  // ── Helpers
  const updatePersonal = (field, value) =>
    setPersonal((p) => ({ ...p, [field]: value }));
  const updateProfessional = (field, value) =>
    setProfessional((p) => ({ ...p, [field]: value }));

  // ── Step validation
  const validateStep1 = () => {
    const { firstName, lastName, gender, email, phone, password, confirmPassword } =
      personal;
    if (!firstName.trim()) {
      toast.error("First name is required");
      return false;
    }
    if (!lastName.trim()) {
      toast.error("Last name is required");
      return false;
    }
    if (!gender) {
      toast.error("Gender is required");
      return false;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!phone.trim()) {
      toast.error("Phone is required");
      return false;
    }
    if (!password) {
      toast.error("Password is required");
      return false;
    }
    const passwordState = evaluatePassword(password);
    if (!passwordState.isValid) {
      toast.error("Password must include uppercase, number, special character, and be at least 8 characters");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const {
      title,
      specialization,
      primaryDegree,
      university,
      graduationYear,
      yearsOfExperience,
      pmdcNumber,
      licenseIssueDate,
    } = professional;
    if (!title) {
      toast.error("Title is required");
      return false;
    }
    if (!specialization.trim()) {
      toast.error("Specialization is required");
      return false;
    }
    if (!primaryDegree.trim()) {
      toast.error("Primary degree is required");
      return false;
    }
    if (!university.trim()) {
      toast.error("University is required");
      return false;
    }
    if (!graduationYear) {
      toast.error("Graduation year is required");
      return false;
    }
    if (!yearsOfExperience) {
      toast.error("Years of experience is required");
      return false;
    }
    if (!pmdcNumber.trim()) {
      toast.error("PMDC number is required");
      return false;
    }
    if (!licenseIssueDate) {
      toast.error("License issue date is required");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (clinics.length === 0 && hospitals.length === 0) {
      toast.error("Add at least one clinic or hospital");
      return false;
    }
    for (const clinic of clinics) {
      if (!clinic.name.trim()) {
        toast.error("Clinic name is required");
        return false;
      }
      if (!clinic.address.trim()) {
        toast.error("Clinic address is required");
        return false;
      }
      if (clinic.sessions.length === 0) {
        toast.error(`Add at least one session for ${clinic.name || "clinic"}`);
        return false;
      }
    }
    for (const hospital of hospitals) {
      if (!hospital.name.trim()) {
        toast.error("Hospital name is required");
        return false;
      }
      if (!hospital.address.trim()) {
        toast.error("Hospital address is required");
        return false;
      }
      if (hospital.sessions.length === 0) {
        toast.error(
          `Add at least one session for ${hospital.name || "hospital"}`,
        );
        return false;
      }
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
  const addClinic = () =>
    setClinics((p) => [...p, { name: "", address: "", sessions: [] }]);
  const updateClinic = (i, data) =>
    setClinics((p) => p.map((c, idx) => (idx === i ? data : c)));
  const removeClinic = (i) =>
    setClinics((p) => p.filter((_, idx) => idx !== i));

  const addHospital = () =>
    setHospitals((p) => [...p, { name: "", address: "", sessions: [] }]);
  const updateHospital = (i, data) =>
    setHospitals((p) => p.map((h, idx) => (idx === i ? data : h)));
  const removeHospital = (i) =>
    setHospitals((p) => p.filter((_, idx) => idx !== i));

  const passwordState = evaluatePassword(personal.password);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[var(--color-bg-gradient)] px-4 py-8 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-24 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[52px_52px] opacity-[0.2] [mask-image:radial-gradient(circle_at_center,black_45%,transparent_100%)]"
      />
      <div className="relative mx-auto w-full max-w-4xl">
        {/* Logo */}
        <Link
          to="/"
          className="mb-4 mt-2 flex flex-col items-center p-1 transition hover:opacity-90"
        >
          <div className="mx-auto w-[50px] sm:w-[60px] lg:w-[85px] aspect-square glass-card rounded-full flex items-center justify-center border-[var(--color-border)]/80 bg-[var(--color-card)] shadow-[0_4px_10px_rgba(0,0,0,0.08)] mb-2">
            <img
              src={logo}
              alt="MedAlerto"
              className="h-2/3 w-auto object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
            />
          </div>
          <span className="block font-heading text-base sm:text-lg font-bold tracking-[0.3em] text-[var(--color-text-primary)] uppercase mb-1">
            MEDALERTO
          </span>
          <div className="h-px w-16 mx-auto bg-[var(--color-border)] mb-1 opacity-60" />
        </Link>

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="mb-1 text-2xl font-heading font-bold text-[var(--color-text-primary)] sm:text-3xl">
            Create your account
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] font-medium">
            Set up your doctor profile in a few steps.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-6">
          <StepIndicator current={step} />
        </div>

        {/* Card */}
        <div className="rounded-[2.5rem] border border-[var(--color-border)]/50 bg-[var(--color-card)]/80 p-6 shadow-[var(--shadow-float)] backdrop-blur-xl sm:p-10">
          {/* ── STEP 1: Personal Info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="mb-6 text-xl font-heading font-bold text-[var(--color-text-primary)]">
                Your Personal Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    First Name{" "}
                    <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <input
                    value={personal.firstName}
                    onChange={(e) => updatePersonal("firstName", e.target.value)}
                    placeholder="Enter first name"
                    className={inputCls}
                    style={S.input}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Last Name{" "}
                    <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <input
                    value={personal.lastName}
                    onChange={(e) => updatePersonal("lastName", e.target.value)}
                    placeholder="Enter last name"
                    className={inputCls}
                    style={S.input}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Gender{" "}
                    <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <div className="flex gap-2 p-1 bg-[var(--color-bg)] rounded-xl">
                    {GENDERS.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => updatePersonal("gender", g)}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                            personal.gender === g
                              ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-md scale-[1.02]"
                              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-card)]"
                          }`}
                        >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Phone <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <input
                    value={personal.phone}
                    onChange={(e) => updatePersonal("phone", e.target.value)}
                    placeholder="e.g. 0300 1234567"
                    className={inputCls}
                    style={S.input}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Email <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <input
                    type="email"
                    value={personal.email}
                    onChange={(e) => updatePersonal("email", e.target.value)}
                    placeholder="e.g. name@healthcare.com"
                    className={inputCls}
                    style={S.input}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Password{" "}
                    <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={personal.password}
                      onChange={(e) =>
                        updatePersonal("password", e.target.value)
                      }
                      placeholder="Enter a strong password"
                      className={inputCls + " pr-10"}
                      style={S.input}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10px] font-medium text-[var(--color-text-secondary)] ml-1">
                    Use at least 8 characters
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Confirm Password{" "}
                    <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={personal.confirmPassword}
                      onChange={(e) =>
                        updatePersonal("confirmPassword", e.target.value)
                      }
                      placeholder="Repeat password"
                      className={inputCls + " pr-10"}
                      style={{
                        ...S.input,
                        borderColor: personal.confirmPassword
                          ? personal.password === personal.confirmPassword
                            ? "var(--color-primary)"
                            : "var(--color-danger)"
                          : "var(--color-border)",
                      }}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      {showConfirm ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="mx-auto mt-1 w-full max-w-xl rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-bg-soft)]/50 px-4 py-3">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em]">
                      <span className="text-[var(--color-text-secondary)]">
                        Password strength
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          color: passwordState.color,
                          backgroundColor: `${passwordState.color}22`,
                        }}
                      >
                        {passwordState.label}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${passwordState.percent}%`,
                          backgroundColor: passwordState.color,
                          boxShadow:
                            passwordState.percent > 0
                              ? `0 0 10px ${passwordState.color}66`
                              : "none",
                        }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {PASSWORD_RULES.map((rule) => {
                        const passed = passwordState.checks[rule.key];
                        return (
                          <p
                            key={rule.key}
                            className="text-[11px] font-medium"
                            style={{
                              color: passed
                                ? "var(--color-primary)"
                                : "var(--color-text-secondary)",
                              textAlign: "center",
                            }}
                          >
                            {passed ? "✓" : "•"} {rule.label}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Professional Info ── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="mb-6 text-xl font-heading font-bold text-[var(--color-text-primary)]">
                Professional Details
              </h2>

              {/* Title */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                  Professional Title{" "}
                  <span className="text-[var(--color-primary)]">*</span>
                </label>
                <div className="flex gap-2 p-1 bg-[var(--color-bg)] rounded-xl">
                  {TITLES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updateProfessional("title", t)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                        professional.title === t
                          ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-md scale-[1.02]"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-card)]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SuggestInput
                  value={professional.specialization}
                  onChange={(v) => updateProfessional("specialization", v)}
                  suggestions={SPECIALIZATION_SUGGESTIONS}
                  placeholder="e.g. Dermatologist"
                  label="Specialization"
                  required
                />

                <SuggestInput
                  value={professional.primaryDegree}
                  onChange={(v) => updateProfessional("primaryDegree", v)}
                  suggestions={DEGREE_SUGGESTIONS}
                  placeholder="e.g. MBBS, BDS"
                  label="Primary Degree"
                  required
                />

                <div className="sm:col-span-2">
                  <TagListInput
                    label="Additional Degrees"
                    items={professional.additionalDegrees}
                    onAdd={(v) =>
                      updateProfessional("additionalDegrees", [
                        ...professional.additionalDegrees,
                        v,
                      ])
                    }
                    onRemove={(i) =>
                      updateProfessional(
                        "additionalDegrees",
                        professional.additionalDegrees.filter(
                          (_, idx) => idx !== i,
                        ),
                      )
                    }
                    placeholder="e.g. FCPS, MD"
                    suggestions={DEGREE_SUGGESTIONS}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Medical University{" "}
                    <span className="text-[var(--color-primary)]">*</span>
                  </label>
                    <input
                      value={professional.university}
                      onChange={(e) =>
                        updateProfessional("university", e.target.value)
                      }
                      placeholder="Enter your medical university"
                      className={inputCls}
                      style={S.input}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                    />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Graduation Year{" "}
                    <span className="text-[var(--color-primary)]">*</span>
                  </label>
                    <input
                      type="number"
                      value={professional.graduationYear}
                      onChange={(e) =>
                        updateProfessional("graduationYear", e.target.value)
                      }
                      placeholder="Year of graduation"
                      min="1970"
                      max={new Date().getFullYear()}
                      className={inputCls}
                      style={S.input}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                    />
                </div>

                <div className="sm:col-span-2">
                  <TagListInput
                    label="Postgraduate Training / Certifications"
                    items={professional.postgraduateTraining}
                    onAdd={(v) =>
                      updateProfessional("postgraduateTraining", [
                        ...professional.postgraduateTraining,
                        v,
                      ])
                    }
                    onRemove={(i) =>
                      updateProfessional(
                        "postgraduateTraining",
                        professional.postgraduateTraining.filter(
                          (_, idx) => idx !== i,
                        ),
                      )
                    }
                    placeholder="e.g. Hair Transplant Training, Aesthetic Medicine"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Years of Experience{" "}
                    <span className="text-[var(--color-primary)]">*</span>
                  </label>
                    <input
                      type="number"
                      value={professional.yearsOfExperience}
                      onChange={(e) =>
                        updateProfessional("yearsOfExperience", e.target.value)
                      }
                      placeholder="Enter years of experience"
                      min="0"
                      className={inputCls}
                      style={S.input}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                    />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    PMDC Registration Number{" "}
                    <span className="text-[var(--color-primary)]">*</span>
                  </label>
                    <input
                      value={professional.pmdcNumber}
                      onChange={(e) =>
                        updateProfessional("pmdcNumber", e.target.value)
                      }
                      placeholder="Enter PMDC number"
                      className={inputCls}
                      style={S.input}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                    />
                </div>

                {/* License Status */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    License Status
                  </label>
                  <div className="flex gap-2 p-1 bg-[var(--color-bg)] rounded-xl">
                    {LICENSE_STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateProfessional("licenseStatus", s)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                          professional.licenseStatus === s
                            ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-md scale-[1.02]"
                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-card)]"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    License Issue Date{" "}
                    <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <input
                    type="date"
                    value={professional.licenseIssueDate}
                    onChange={(e) =>
                      updateProfessional("licenseIssueDate", e.target.value)
                    }
                    className={inputCls}
                    style={S.input}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    License Expiry Date{" "}
                    <span className="text-xs opacity-60">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={professional.licenseExpiryDate}
                    onChange={(e) =>
                      updateProfessional("licenseExpiryDate", e.target.value)
                    }
                    className={inputCls}
                    style={S.input}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>

                {/* Online Booking Fee */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Online Booking Fee (PKR){" "}
                    <span className="text-xs opacity-60">(optional — can change in profile settings later)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={professional.advanceBookingFee}
                    onChange={(e) =>
                      updateProfessional("advanceBookingFee", e.target.value)
                    }
                    placeholder="e.g. 1000 (Set 0 or leave empty if no online fee required)"
                    className={inputCls}
                    style={S.input}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Clinics & Hospitals ── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="mb-2 text-xl font-heading font-bold text-[var(--color-text-primary)]">
                Practice Locations
              </h2>
              <p className="mb-5 text-xs text-[var(--color-text-secondary)]">
                Add your practice locations. Sessions with overlapping times
                will be highlighted.
              </p>

              {/* Clinics */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">
                    Clinics
                  </p>
                  <button
                    type="button"
                    onClick={addClinic}
                    className="rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-all hover:scale-105 hover:bg-[var(--color-primary)]/15 active:scale-95"
                  >
                    + Add Clinic
                  </button>
                </div>
                {clinics.length === 0 && (
                  <div className="mb-2 rounded-[2rem] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] py-6 text-center">
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      No clinics added yet
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {clinics.map((clinic, i) => (
                    <LocationCard
                      key={i}
                      location={clinic}
                      index={i}
                      type="clinic"
                      allClinics={clinics}
                      allHospitals={hospitals}
                      onChange={(data) => updateClinic(i, data)}
                      onRemove={() => removeClinic(i)}
                    />
                  ))}
                </div>
              </div>

              {/* Hospitals */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">
                    Hospitals
                  </p>
                  <button
                    type="button"
                    onClick={addHospital}
                    className="rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-all hover:scale-105 hover:bg-[var(--color-primary)]/15 active:scale-95"
                  >
                    + Add Hospital
                  </button>
                </div>
                {hospitals.length === 0 && (
                  <div className="mb-2 rounded-[2rem] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] py-6 text-center">
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      No hospitals added yet
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {hospitals.map((hospital, i) => (
                    <LocationCard
                      key={i}
                      location={hospital}
                      index={i}
                      type="hospital"
                      allClinics={clinics}
                      allHospitals={hospitals}
                      onChange={(data) => updateHospital(i, data)}
                      onRemove={() => removeHospital(i)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ── */}
          <div className="flex flex-col items-center gap-4 mt-6">
            <div className="flex w-full gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] py-3.5 text-sm font-bold text-[var(--color-text-secondary)] transition-all hover:bg-[var(--color-bg-soft)] active:scale-[0.98]"
                >
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-[2] rounded-xl bg-[var(--color-primary)] py-3.5 text-sm font-bold text-[var(--color-on-primary)] shadow-[var(--shadow-soft)] transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  Continue Setup
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-[2] rounded-xl bg-[var(--color-primary)] py-3.5 text-sm font-bold text-[var(--color-on-primary)] shadow-[var(--shadow-soft)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? "Creating Account..." : "Complete Setup"}
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Secure & Private
            </div>
          </div>

          <p className="mt-8 text-center text-[10px] text-[var(--color-text-muted)] leading-relaxed max-w-xs mx-auto">
            By creating an account, you agree to our{" "}
            <Link to="/terms-of-service" className="text-[var(--color-primary)] hover:underline font-semibold">Terms</Link>
            {" "}and{" "}
            <Link to="/privacy-policy" className="text-[var(--color-primary)] hover:underline font-semibold">Privacy Policy</Link>.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm border-t border-[var(--color-border)] pt-6">
            <span className="text-[var(--color-text-secondary)]">Already have an account?</span>
            <Link
              to="/login"
              className="font-bold text-[var(--color-primary)] hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
