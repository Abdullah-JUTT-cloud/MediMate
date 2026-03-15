import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useAuthStore from "../store/authStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const TITLES = ["Dr.", "Prof.", "Consultant"];
const GENDERS = ["Male", "Female", "Other"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LICENSE_STATUSES = ["Active", "Inactive", "Suspended"];

const DEGREE_SUGGESTIONS = [
  "MBBS", "BDS", "BHMS", "BUMS", "BAMS", "DVM", "Pharm.D", "DPT",
  "MS", "MCh", "MD", "FCPS", "MCPS", "MRCP",
  "FCPS Dermatology", "FCPS Gynecology", "FCPS Urology", "FCPS Cardiology",
  "FCPS Orthopedics", "FCPS Ophthalmology", "FCPS ENT", "FCPS Psychiatry",
  "FCPS Neurology", "FCPS Pediatrics", "FCPS Medicine", "FCPS Surgery",
  "MD Dermatology", "MD Gynecology", "MD Cardiology", "MD Psychiatry",
  "MD Neurology", "MD Pediatrics", "MD Medicine",
  "MS Urology", "MS Orthopedics", "MS ENT",
  "DGO", "DDV", "DO", "DLO", "DCH", "MDS",
  "Diploma Aesthetic Medicine", "Diploma Cosmetology",
  "Certificate Trichology", "MBBS + Hair Transplant Certification",
];

const SPECIALIZATION_SUGGESTIONS = [
  "General Physician", "Dermatologist", "Hair Transplant Surgeon",
  "Cosmetologist", "Aesthetic Medicine", "Gynecologist", "Obstetrician",
  "Urologist", "Cardiologist", "Orthopedic Surgeon", "Neurologist",
  "Psychiatrist", "Pediatrician", "ENT Specialist", "Ophthalmologist",
  "Dentist", "Orthodontist", "Oral Surgeon", "General Surgeon",
  "Plastic Surgeon", "Gastroenterologist", "Pulmonologist",
  "Nephrologist", "Endocrinologist", "Rheumatologist", "Oncologist",
  "Radiologist", "Anesthesiologist", "Pathologist", "Physical Therapist",
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
    border: "1px solid rgba(255,255,255,0.07)",
  },
  section: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
  },
};

const focusStyle = (e) => (e.target.style.border = "1px solid #10B8A9");
const blurStyle = (e) => (e.target.style.border = "1px solid rgba(16,184,169,0.15)");
const inputCls = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ text }) {
  return <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#475569" }}>{text}</p>;
}

function FieldLabel({ text, optional }) {
  return (
    <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
      {text} {optional ? <span className="opacity-50">(optional)</span> : <span style={{ color: "#10B8A9" }}>*</span>}
    </label>
  );
}

function SaveButton({ onClick, isLoading, label = "Save Changes" }) {
  return (
    <div className="flex justify-end pt-2">
      <button onClick={onClick} disabled={isLoading}
        className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{ background: "linear-gradient(135deg,#10B8A9,#0d9488)", boxShadow: "0 4px 15px rgba(16,184,169,0.25)" }}>
        {isLoading ? "Saving..." : label}
      </button>
    </div>
  );
}

// ─── Searchable Input ─────────────────────────────────────────────────────────

function SuggestInput({ value, onChange, suggestions, placeholder }) {
  const [open, setOpen] = useState(false);
  const filtered = suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8);
  return (
    <div className="relative">
      <input value={value} onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={(e) => { focusStyle(e); setOpen(true); }}
        onBlur={(e) => { blurStyle(e); setTimeout(() => setOpen(false), 150); }}
        placeholder={placeholder} className={inputCls} style={S.input} />
      {open && value && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-xl"
          style={{ background: "#0a1628", border: "1px solid rgba(16,184,169,0.2)", maxHeight: "180px", overflowY: "auto" }}>
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

function TagListInput({ items, onAdd, onRemove, placeholder, suggestions = [] }) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = suggestions.filter((s) => s.toLowerCase().includes(input.toLowerCase()) && !items.includes(s)).slice(0, 6);

  const add = () => {
    if (!input.trim() || items.includes(input.trim())) return;
    onAdd(input.trim());
    setInput("");
  };

  return (
    <div>
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

// ─── Overlap Detection ────────────────────────────────────────────────────────

function getOccupiedSlots(clinics, hospitals, excludeIndex, locationType) {
  const occupied = [];
  const all = [
    ...clinics.map((c, i) => ({ ...c, type: "clinic", index: i })),
    ...hospitals.map((h, i) => ({ ...h, type: "hospital", index: i })),
  ];
  for (const loc of all) {
    if (loc.type === locationType && loc.index === excludeIndex) continue;
    for (const s of loc.sessions) occupied.push(s);
  }
  return occupied;
}

function isOverlapping(day, start, end, occupied) {
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  return occupied.some((s) => {
    if (s.day !== day) return false;
    return toMin(start) < toMin(s.endTime) && toMin(end) > toMin(s.startTime);
  });
}

// ─── Location Card ────────────────────────────────────────────────────────────

function LocationCard({ location, index, type, allClinics, allHospitals, onChange, onRemove }) {
  const occupied = getOccupiedSlots(allClinics, allHospitals, index, type);

  const addSession = () => onChange({ ...location, sessions: [...location.sessions, { id: Date.now(), day: "Monday", startTime: "09:00", endTime: "17:00" }] });
  const updateSession = (si, field, val) => onChange({ ...location, sessions: location.sessions.map((s, i) => i === si ? { ...s, [field]: val } : s) });
  const removeSession = (si) => onChange({ ...location, sessions: location.sessions.filter((_, i) => i !== si) });

  return (
    <div className="rounded-2xl p-4 sm:p-5" style={S.card}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-white flex items-center gap-2">
          {type === "clinic" ? "🏥" : "🏨"} {type === "clinic" ? "Clinic" : "Hospital"} {index + 1}
        </span>
        <button onClick={onRemove}
          className="text-xs px-2.5 py-1.5 rounded-lg transition-all hover:bg-red-500 hover:bg-opacity-10"
          style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <FieldLabel text="Name" />
          <input value={location.name} onChange={(e) => onChange({ ...location, name: e.target.value })}
            placeholder={type === "clinic" ? "e.g. Doctors Hospital" : "e.g. Services Hospital"}
            className={inputCls} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
        <div>
          <FieldLabel text="Address" />
          <input value={location.address} onChange={(e) => onChange({ ...location, address: e.target.value })}
            placeholder="e.g. Gulberg, Lahore"
            className={inputCls} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
      </div>

      <SectionLabel text="Sessions" />
      {location.sessions.length === 0 && (
        <p className="text-xs mb-3" style={{ color: "#475569" }}>No sessions added yet</p>
      )}
      <div className="space-y-2 mb-3">
        {location.sessions.map((session, si) => {
          const overlap = isOverlapping(session.day, session.startTime, session.endTime, occupied);
          return (
            <div key={session.id ?? si} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-xl items-end"
              style={{
                background: overlap ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)",
                border: overlap ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.05)",
              }}>
              <div>
                <label className="block text-xs mb-1" style={{ color: "#64748b" }}>Day</label>
                <select value={session.day} onChange={(e) => updateSession(si, "day", e.target.value)}
                  className={inputCls} style={{ ...S.input, opacity: overlap ? 0.6 : 1 }}
                  onFocus={focusStyle} onBlur={blurStyle}>
                  {DAYS.map((d) => <option key={d} value={d} style={{ background: "#0a1628" }}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "#64748b" }}>Start</label>
                <input type="time" value={session.startTime} onChange={(e) => updateSession(si, "startTime", e.target.value)}
                  className={inputCls} style={{ ...S.input, colorScheme: "dark", opacity: overlap ? 0.6 : 1 }}
                  onFocus={focusStyle} onBlur={blurStyle} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "#64748b" }}>End</label>
                <input type="time" value={session.endTime} onChange={(e) => updateSession(si, "endTime", e.target.value)}
                  className={inputCls} style={{ ...S.input, colorScheme: "dark", opacity: overlap ? 0.6 : 1 }}
                  onFocus={focusStyle} onBlur={blurStyle} />
              </div>
              <div className="flex items-end gap-2">
                {overlap && (
                  <span className="text-xs px-2 py-1 rounded-lg flex-1 text-center"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>⚠ Overlap</span>
                )}
                <button onClick={() => removeSession(si)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-red-500 hover:bg-opacity-10 shrink-0"
                  style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                  🗑
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={addSession}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
        style={{ background: "rgba(16,184,169,0.06)", border: "1px dashed rgba(16,184,169,0.3)", color: "#10B8A9" }}>
        + Add Session
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SETTINGS PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function SettingsPage() {
  const { doctor, setDoctor } = useAuthStore();
  const [activeTab, setActiveTab] = useState("personal");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ── Tab state
  const [personal, setPersonal] = useState({ fullName: "", gender: "", phone: "" });
  const [professional, setProfessional] = useState({
    title: "", specialization: "", primaryDegree: "",
    additionalDegrees: [], university: "", graduationYear: "",
    postgraduateTraining: [], yearsOfExperience: "", slotDuration: 20,
  });
  const [licensing, setLicensing] = useState({
    pmdcNumber: "", licenseStatus: "Active",
    licenseIssueDate: "", licenseExpiryDate: "",
  });
  const [clinics, setClinics] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  // ── Load profile on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get("/doctor/profile");
        const d = res.data.doctor;
        setPersonal({ fullName: d.fullName || "", gender: d.gender || "", phone: d.phone || "" });
        setProfessional({
          title: d.title || "",
          specialization: d.specialization || "",
          primaryDegree: d.primaryDegree || "",
          additionalDegrees: d.additionalDegrees || [],
          university: d.university || "",
          graduationYear: d.graduationYear || "",
          postgraduateTraining: d.postgraduateTraining || [],
          yearsOfExperience: d.yearsOfExperience || "",
          slotDuration: d.slotDuration || 20,
        });
        setLicensing({
          pmdcNumber: d.pmdcNumber || "",
          licenseStatus: d.licenseStatus || "Active",
          licenseIssueDate: d.licenseIssueDate ? d.licenseIssueDate.split("T")[0] : "",
          licenseExpiryDate: d.licenseExpiryDate ? d.licenseExpiryDate.split("T")[0] : "",
        });
        setClinics((d.clinics || []).map((c, i) => ({ ...c, id: c.id || Date.now() + i })));
        setHospitals((d.hospitals || []).map((h, i) => ({ ...h, id: h.id || Date.now() + i })));
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Save handlers
  const save = async (data, successMsg) => {
    setIsSaving(true);
    try {
      const res = await axiosInstance.put("/doctor/update-profile", data);
      const d = res.data.doctor;
      setDoctor({
        fullName: d.fullName,
        email: d.email,
        title: d.title,
        specialization: d.specialization,
        profilePicture: d.profilePicture,
      });
      toast.success(successMsg);
    } catch {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const savePersonal = () => {
    if (!personal.fullName.trim()) { toast.error("Name is required"); return; }
    if (!personal.phone.trim()) { toast.error("Phone is required"); return; }
    save(personal, "Personal info updated!");
  };

  const saveProfessional = () => {
    if (!professional.title) { toast.error("Title is required"); return; }
    if (!professional.specialization.trim()) { toast.error("Specialization is required"); return; }
    if (!professional.primaryDegree.trim()) { toast.error("Primary degree is required"); return; }
    save(professional, "Professional info updated!");
  };

  const saveLicensing = () => {
    if (!licensing.pmdcNumber.trim()) { toast.error("PMDC number is required"); return; }
    if (!licensing.licenseIssueDate) { toast.error("License issue date is required"); return; }
    save(licensing, "Licensing info updated!");
  };

  const saveLocations = () => {
    for (const c of clinics) {
      if (!c.name.trim()) { toast.error("Clinic name is required"); return; }
      if (!c.address.trim()) { toast.error("Clinic address is required"); return; }
    }
    for (const h of hospitals) {
      if (!h.name.trim()) { toast.error("Hospital name is required"); return; }
      if (!h.address.trim()) { toast.error("Hospital address is required"); return; }
    }
    save({ clinics, hospitals }, "Locations updated!");
  };

  const TABS = [
    { key: "personal", label: "Personal", icon: "👤" },
    { key: "professional", label: "Professional", icon: "🎓" },
    { key: "licensing", label: "Licensing", icon: "📋" },
    { key: "locations", label: "Locations", icon: "🏥" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "#10B8A9", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Manage your profile and practice information</p>
      </div>

      {/* Profile Picture Placeholder */}
      <div className="flex items-center gap-4 p-5 rounded-2xl mb-6" style={S.card}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg,#10B8A9,#0d9488)" }}>
          {doctor?.profilePicture ? (
            <img src={doctor.profilePicture} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
          ) : (
            doctor?.fullName?.charAt(0) || "D"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-white">{doctor?.fullName || "Doctor"}</p>
          <p className="text-sm" style={{ color: "#10B8A9" }}>{doctor?.specialization || "Specialist"}</p>
        </div>
        <input
          type="file"
          id="profilePicUpload"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("profilePicture", file);

            try {
              const res = await axiosInstance.post("/doctor/upload-profile-picture", formData, {
                headers: { "Content-Type": "multipart/form-data" },
              });
              setDoctor({ ...doctor, profilePicture: res.data.profilePicture });
              toast.success("Profile picture updated!");
            } catch {
              toast.error("Failed to upload picture");
            } finally {
              e.target.value = "";
            }
          }}
        />
        <label htmlFor="profilePicUpload"
          className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:opacity-80"
          style={{ background: "rgba(16,184,169,0.12)", color: "#10B8A9", border: "1px solid rgba(16,184,169,0.2)" }}>
          📷 Upload Photo
        </label>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-2xl overflow-x-auto" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-1 justify-center"
            style={{
              background: activeTab === tab.key ? "rgba(16,184,169,0.15)" : "transparent",
              color: activeTab === tab.key ? "#10B8A9" : "#64748b",
              border: activeTab === tab.key ? "1px solid rgba(16,184,169,0.3)" : "1px solid transparent",
            }}>
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── PERSONAL TAB ── */}
      {activeTab === "personal" && (
        <div className="rounded-2xl p-5 sm:p-6 space-y-5" style={S.card}>
          <SectionLabel text="Personal Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FieldLabel text="Full Name" />
              <input value={personal.fullName} onChange={(e) => setPersonal((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="Dr. Ahmed Raza" className={inputCls} style={S.input}
                onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel text="Gender" />
              <div className="flex gap-2">
                {GENDERS.map((g) => (
                  <button key={g} onClick={() => setPersonal((p) => ({ ...p, gender: g }))}
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
            <div className="sm:col-span-2">
              <FieldLabel text="Phone" />
              <input value={personal.phone} onChange={(e) => setPersonal((p) => ({ ...p, phone: e.target.value }))}
                placeholder="03001234567" className={inputCls} style={S.input}
                onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>
          <SaveButton onClick={savePersonal} isLoading={isSaving} />
        </div>
      )}

      {/* ── PROFESSIONAL TAB ── */}
      {activeTab === "professional" && (
        <div className="rounded-2xl p-5 sm:p-6 space-y-5" style={S.card}>
          <SectionLabel text="Professional Information" />

          <div>
            <FieldLabel text="Professional Title" />
            <div className="flex gap-2">
              {TITLES.map((t) => (
                <button key={t} onClick={() => setProfessional((p) => ({ ...p, title: t }))}
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
            <div>
              <FieldLabel text="Specialization" />
              <SuggestInput value={professional.specialization}
                onChange={(v) => setProfessional((p) => ({ ...p, specialization: v }))}
                suggestions={SPECIALIZATION_SUGGESTIONS} placeholder="e.g. Dermatologist" />
            </div>
            <div>
              <FieldLabel text="Primary Degree" />
              <SuggestInput value={professional.primaryDegree}
                onChange={(v) => setProfessional((p) => ({ ...p, primaryDegree: v }))}
                suggestions={DEGREE_SUGGESTIONS} placeholder="e.g. MBBS" />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel text="Additional Degrees" optional />
              <TagListInput
                items={professional.additionalDegrees}
                onAdd={(v) => setProfessional((p) => ({ ...p, additionalDegrees: [...p.additionalDegrees, v] }))}
                onRemove={(i) => setProfessional((p) => ({ ...p, additionalDegrees: p.additionalDegrees.filter((_, idx) => idx !== i) }))}
                placeholder="e.g. FCPS, MD" suggestions={DEGREE_SUGGESTIONS} />
            </div>
            <div>
              <FieldLabel text="Medical University" />
              <input value={professional.university}
                onChange={(e) => setProfessional((p) => ({ ...p, university: e.target.value }))}
                placeholder="e.g. King Edward Medical University"
                className={inputCls} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <FieldLabel text="Graduation Year" />
              <input type="number" value={professional.graduationYear}
                onChange={(e) => setProfessional((p) => ({ ...p, graduationYear: e.target.value }))}
                placeholder="e.g. 2015" min="1970" max={new Date().getFullYear()}
                className={inputCls} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel text="Postgraduate Training" optional />
              <TagListInput
                items={professional.postgraduateTraining}
                onAdd={(v) => setProfessional((p) => ({ ...p, postgraduateTraining: [...p.postgraduateTraining, v] }))}
                onRemove={(i) => setProfessional((p) => ({ ...p, postgraduateTraining: p.postgraduateTraining.filter((_, idx) => idx !== i) }))}
                placeholder="e.g. Hair Transplant Training" />
            </div>
            <div>
              <FieldLabel text="Years of Experience" />
              <input type="number" value={professional.yearsOfExperience}
                onChange={(e) => setProfessional((p) => ({ ...p, yearsOfExperience: e.target.value }))}
                placeholder="e.g. 8" min="0"
                className={inputCls} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <FieldLabel text="Appointment Slot Duration (min)" />
              <div className="flex gap-2 flex-wrap">
                {[10, 15, 20, 30, 45, 60].map((d) => (
                  <button key={d} onClick={() => setProfessional((p) => ({ ...p, slotDuration: d }))}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: professional.slotDuration === d ? "rgba(16,184,169,0.15)" : "rgba(255,255,255,0.04)",
                      border: professional.slotDuration === d ? "1px solid #10B8A9" : "1px solid rgba(16,184,169,0.15)",
                      color: professional.slotDuration === d ? "#10B8A9" : "#64748b",
                    }}>
                    {d} min
                  </button>
                ))}
              </div>
            </div>
          </div>
          <SaveButton onClick={saveProfessional} isLoading={isSaving} />
        </div>
      )}

      {/* ── LICENSING TAB ── */}
      {activeTab === "licensing" && (
        <div className="rounded-2xl p-5 sm:p-6 space-y-5" style={S.card}>
          <SectionLabel text="Licensing Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FieldLabel text="PMDC Registration Number" />
              <input value={licensing.pmdcNumber}
                onChange={(e) => setLicensing((p) => ({ ...p, pmdcNumber: e.target.value }))}
                placeholder="e.g. PMDC-12345"
                className={inputCls} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel text="License Status" />
              <div className="flex gap-2">
                {LICENSE_STATUSES.map((s) => (
                  <button key={s} onClick={() => setLicensing((p) => ({ ...p, licenseStatus: s }))}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: licensing.licenseStatus === s ? "rgba(16,184,169,0.15)" : "rgba(255,255,255,0.04)",
                      border: licensing.licenseStatus === s ? "1px solid #10B8A9" : "1px solid rgba(16,184,169,0.15)",
                      color: licensing.licenseStatus === s ? "#10B8A9" : "#64748b",
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel text="License Issue Date" />
              <input type="date" value={licensing.licenseIssueDate}
                onChange={(e) => setLicensing((p) => ({ ...p, licenseIssueDate: e.target.value }))}
                className={inputCls} style={{ ...S.input, colorScheme: "dark" }}
                onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <FieldLabel text="License Expiry Date" optional />
              <input type="date" value={licensing.licenseExpiryDate}
                onChange={(e) => setLicensing((p) => ({ ...p, licenseExpiryDate: e.target.value }))}
                className={inputCls} style={{ ...S.input, colorScheme: "dark" }}
                onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel text="PMDC Certificate" optional />
              <div className="w-full px-4 py-3 rounded-xl text-sm flex items-center gap-2 cursor-not-allowed"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)", color: "#475569" }}>
                📎 Upload will be available soon (Cloudinary)
              </div>
            </div>
          </div>
          <SaveButton onClick={saveLicensing} isLoading={isSaving} />
        </div>
      )}

      {/* ── LOCATIONS TAB ── */}
      {activeTab === "locations" && (
        <div className="space-y-5">
          {/* Clinics */}
          <div className="rounded-2xl p-5 sm:p-6" style={S.card}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-white">🏥 Clinics</p>
              <button onClick={() => setClinics((p) => [...p, { id: Date.now(), name: "", address: "", sessions: [] }])}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(16,184,169,0.12)", color: "#10B8A9" }}>
                + Add Clinic
              </button>
            </div>
            {clinics.length === 0 && (
              <div className="text-center py-6 rounded-xl"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)" }}>
                <p className="text-xs" style={{ color: "#475569" }}>No clinics added</p>
              </div>
            )}
            <div className="space-y-3">
              {clinics.map((clinic, i) => (
                <LocationCard key={clinic.id} location={clinic} index={i} type="clinic"
                  allClinics={clinics} allHospitals={hospitals}
                  onChange={(data) => setClinics((p) => p.map((c, idx) => idx === i ? data : c))}
                  onRemove={() => setClinics((p) => p.filter((_, idx) => idx !== i))} />
              ))}
            </div>
          </div>

          {/* Hospitals */}
          <div className="rounded-2xl p-5 sm:p-6" style={S.card}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-white">🏨 Hospitals</p>
              <button onClick={() => setHospitals((p) => [...p, { id: Date.now(), name: "", address: "", sessions: [] }])}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(16,184,169,0.12)", color: "#10B8A9" }}>
                + Add Hospital
              </button>
            </div>
            {hospitals.length === 0 && (
              <div className="text-center py-6 rounded-xl"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)" }}>
                <p className="text-xs" style={{ color: "#475569" }}>No hospitals added</p>
              </div>
            )}
            <div className="space-y-3">
              {hospitals.map((hospital, i) => (
                <LocationCard key={hospital.id} location={hospital} index={i} type="hospital"
                  allClinics={clinics} allHospitals={hospitals}
                  onChange={(data) => setHospitals((p) => p.map((h, idx) => idx === i ? data : h))}
                  onRemove={() => setHospitals((p) => p.filter((_, idx) => idx !== i))} />
              ))}
            </div>
          </div>

          <SaveButton onClick={saveLocations} isLoading={isSaving} label="Save Locations" />
        </div>
      )}
    </div>
  );
}