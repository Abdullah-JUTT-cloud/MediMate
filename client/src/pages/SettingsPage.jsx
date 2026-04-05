import { useState, useEffect } from "react";
import { Upload, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useAuthStore from "../store/authStore";
import { ProfileHeaderSkeleton, FormFieldSkeleton } from "../components/SkeletonLoaders";
import VerifiedBadge from "../components/VerifiedBadge";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const tokens = {
  colors: {
    background: "var(--color-bg)",
    foreground: "var(--color-text-primary)",
    primary: "var(--color-primary)",
    primaryForeground: "var(--color-on-primary)",
    secondary: "var(--color-secondary)",
    secondary_foreground: "var(--color-on-primary)",
    accent: "var(--color-accent)",
    accentForeground: "var(--color-text-primary)",
    muted: "var(--color-bg-soft)",
    mutedForeground: "var(--color-text-secondary)",
    border: "var(--color-border)",
    destructive: "var(--color-danger)",
  },
  shadows: {
    soft: "0 4px 20px -2px rgba(93, 112, 82, 0.15)",
    float: "0 10px 40px -10px rgba(193, 140, 93, 0.2)",
    deepHover: "0 6px 24px -4px rgba(93, 112, 82, 0.25)",
  },
};

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

// ─── Input Styling ────────────────────────────────────────────────────────────
const inputCls = "w-full px-5 py-3 rounded-full text-sm outline-none transition-all bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/50 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:shadow-[0_0_0_0.5px_rgba(93,112,82,0.1)]";

function SectionLabel({ text }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest mb-4 text-[var(--color-text-secondary)]">
      {text}
    </p>
  );
}

function FieldLabel({ text, optional }) {
  return (
    <label className="block text-sm font-medium mb-2.5 text-[var(--color-text-primary)]">
      {text}{" "}
      {optional ? (
        <span className="opacity-50 text-[var(--color-text-secondary)]">(optional)</span>
      ) : (
        <span style={{ color: tokens.colors.primary }}>*</span>
      )}
    </label>
  );
}

function SaveButton({ onClick, isLoading, label = "Save Changes" }) {
  return (
    <div className="flex justify-end pt-4">
      <button
        onClick={onClick}
        disabled={isLoading}
        className="px-8 py-3 rounded-full text-sm font-bold text-white transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          background: tokens.colors.primary,
          boxShadow: tokens.shadows.soft,
        }}
      >
        {isLoading ? "Saving..." : label}
      </button>
    </div>
  );
}

// ─── Searchable Input  ────────────────────────────────────────────────────────

function SuggestInput({ value, onChange, suggestions, placeholder }) {
  const [open, setOpen] = useState(false);
  const filtered = suggestions
    .filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 8);
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className={inputCls}
      />
      {open && value && filtered.length > 0 && (
        <div
          className="absolute z-50 w-full mt-2 rounded-2xl overflow-hidden border"
          style={{
            background: tokens.colors.background,
            border: `1px solid ${tokens.colors.border}`,
            boxShadow: tokens.shadows.float,
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              className="w-full text-left px-5 py-3 text-sm transition-all hover:bg-[var(--color-primary)]/10 text-[var(--color-text-primary)] border-b border-[var(--color-border)]/30 last:border-b-0"
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

// ─── Tag List Input  ──────────────────────────────────────────────────────────

function TagListInput({ items, onAdd, onRemove, placeholder, suggestions = [] }) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = suggestions
    .filter(
      (s) =>
        s.toLowerCase().includes(input.toLowerCase()) && !items.includes(s)
    )
    .slice(0, 6);

  const add = () => {
    if (!input.trim() || items.includes(input.trim())) return;
    onAdd(input.trim());
    setInput("");
  };

  return (
    <div>
      <div className="relative flex gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          onClick={add}
          className="px-5 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90"
          style={{
            background: `${tokens.colors.primary}15`,
            color: tokens.colors.primary,
            border: `1.5px solid ${tokens.colors.primary}30`,
          }}
        >
          + Add
        </button>
        {open && input && filtered.length > 0 && (
          <div
            className="absolute z-50 top-full left-0 right-20 mt-2 rounded-2xl overflow-hidden border"
            style={{
              background: tokens.colors.background,
              border: `1px solid ${tokens.colors.border}`,
              boxShadow: tokens.shadows.float,
            }}
          >
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                className="w-full text-left px-5 py-3 text-sm transition-all hover:bg-[var(--color-primary)]/10 text-[var(--color-text-primary)] border-b border-[var(--color-border)]/30 last:border-b-0"
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
        <div className="flex flex-wrap gap-2 mt-3">
          {items.map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200"
              style={{
                background: `${tokens.colors.primary}15`,
                border: `1px solid ${tokens.colors.primary}30`,
                color: tokens.colors.primary,
              }}
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="opacity-70 hover:opacity-100 text-[var(--color-danger)]"
                style={{ fontSize: "12px" }}
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

  const addSession = () =>
    onChange({
      ...location,
      sessions: [
        ...location.sessions,
        {
          id: Date.now(),
          day: "Monday",
          startTime: "09:00",
          endTime: "17:00",
        },
      ],
    });
  const updateSession = (si, field, val) =>
    onChange({
      ...location,
      sessions: location.sessions.map((s, i) =>
        i === si ? { ...s, [field]: val } : s
      ),
    });
  const removeSession = (si) =>
    onChange({
      ...location,
      sessions: location.sessions.filter((_, i) => i !== si),
    });

  return (
    <div
      className="rounded-3xl p-6 transition-all duration-300 hover:shadow-lg"
      style={{
        background: tokens.colors.background,
        border: `1px solid ${tokens.colors.border}`,
        boxShadow: tokens.shadows.soft,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          {type === "clinic" ? "🏥" : "🏨"}{" "}
          {type === "clinic" ? "Clinic" : "Hospital"} #{index + 1}
        </span>
        <button
          onClick={onRemove}
          className="px-3 py-1.5 rounded-lg transition-all text-[var(--color-danger)] border"
          style={{
            borderColor: `${tokens.colors.destructive}30`,
            background: `${tokens.colors.destructive}10`,
          }}
        >
          <Trash2 size={16} className="inline mr-1" />
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <FieldLabel text="Name" />
          <input
            value={location.name}
            onChange={(e) => onChange({ ...location, name: e.target.value })}
            placeholder={
              type === "clinic"
                ? "e.g. Doctors Hospital"
                : "e.g. Services Hospital"
            }
            className={inputCls}
          />
        </div>
        <div>
          <FieldLabel text="Address" />
          <input
            value={location.address}
            onChange={(e) => onChange({ ...location, address: e.target.value })}
            placeholder="e.g. Gulberg, Lahore"
            className={inputCls}
          />
        </div>
      </div>

      <SectionLabel text="Sessions" />
      {location.sessions.length === 0 && (
        <p className="text-xs mb-3 text-[var(--color-text-secondary)]">No sessions added yet</p>
      )}
      <div className="space-y-2 mb-3">
        {location.sessions.map((session, si) => {
          const overlap = isOverlapping(
            session.day,
            session.startTime,
            session.endTime,
            occupied
          );
          return (
            <div
              key={session.id ?? si}
              className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-2xl items-end border transition-all"
              style={{
                background: overlap
                  ? `${tokens.colors.destructive}10`
                  : `${tokens.colors.muted}20`,
                borderColor: overlap
                  ? `${tokens.colors.destructive}30`
                  : tokens.colors.border,
              }}
            >
              <div>
                <label className="block text-xs mb-1.5 text-[var(--color-text-secondary)] font-medium">
                  Day
                </label>
                <select
                  value={session.day}
                  onChange={(e) =>
                    updateSession(si, "day", e.target.value)
                  }
                  className={`${inputCls} ${overlap ? "opacity-60" : ""}`}
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1.5 text-[var(--color-text-secondary)] font-medium">
                  Start
                </label>
                <input
                  type="time"
                  value={session.startTime}
                  onChange={(e) =>
                    updateSession(si, "startTime", e.target.value)
                  }
                  className={`${inputCls} ${overlap ? "opacity-60" : ""}`}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5 text-[var(--color-text-secondary)] font-medium">
                  End
                </label>
                <input
                  type="time"
                  value={session.endTime}
                  onChange={(e) =>
                    updateSession(si, "endTime", e.target.value)
                  }
                  className={`${inputCls} ${overlap ? "opacity-60" : ""}`}
                />
              </div>
              <div className="flex items-end gap-2">
                {overlap && (
                  <span className="text-xs px-3 py-1.5 rounded-lg flex-1 text-center bg-[var(--color-danger)]/10 text-[var(--color-danger)] font-medium">
                    ⚠ Overlap
                  </span>
                )}
                <button
                  onClick={() => removeSession(si)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 border text-[var(--color-danger)]"
                  style={{
                    borderColor: `${tokens.colors.destructive}30`,
                    background: `${tokens.colors.destructive}10`,
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={addSession}
        className="w-full py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90 border border-dashed"
        style={{
          borderColor: `${tokens.colors.primary}30`,
          color: tokens.colors.primary,
          background: `${tokens.colors.primary}05`,
        }}
      >
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
  const [pmdcCertificate, setPmdcCertificate] = useState("");
  const [isUploadingPmdc, setIsUploadingPmdc] = useState(false);

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
        setPmdcCertificate(d.pmdcCertificate || "");
        
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
        ...(doctor || {}),
        ...d,
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

  const handlePmdcUpload = async (file) => {
    if (!file) return;
    setIsUploadingPmdc(true);
    try {
      const formData = new FormData();
      formData.append("pmdcCertificate", file);
      const res = await axiosInstance.post("/doctor/upload-pmdc-certificate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPmdcCertificate(res.data.pmdcCertificate);
      toast.success("PMDC certificate uploaded!");
    } catch {
      toast.error("Failed to upload certificate");
    } finally {
      setIsUploadingPmdc(false);
    }
  };

  const TABS = [
    { key: "personal", label: "Personal", icon: "👤" },
    { key: "professional", label: "Professional", icon: "🎓" },
    { key: "licensing", label: "Licensing", icon: "📋" },
    { key: "locations", label: "Locations", icon: "🏥" },
  ];


  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-2" style={{ fontFamily: "Fraunces" }}>
            Settings
          </h1>
          <p className="text-base text-[var(--color-text-secondary)]">
            Manage your profile and practice information
          </p>
        </div>
        <ProfileHeaderSkeleton />
        <div className="rounded-3xl p-6 space-y-6 border"
          style={{
            background: tokens.colors.background,
            border: `1px solid ${tokens.colors.border}`,
            boxShadow: tokens.shadows.soft,
          }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormFieldSkeleton />
            <FormFieldSkeleton />
            <FormFieldSkeleton />
            <FormFieldSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-2" style={{ fontFamily: "Fraunces" }}>
          Settings
        </h1>
        <p className="text-base text-[var(--color-text-secondary)]">
          Manage your profile and practice information
        </p>
      </div>

      {/* Profile Picture Section */}
      <div
        className="flex items-center gap-4 p-6 rounded-3xl mb-6 border transition-all hover:shadow-lg"
        style={{
          background: tokens.colors.background,
          border: `1px solid ${tokens.colors.border}`,
          boxShadow: tokens.shadows.soft,
        }}
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-bold text-white shrink-0"
          style={{ background: tokens.colors.primary }}
        >
          {doctor?.profilePicture ? (
            <img
              src={doctor.profilePicture}
              alt="Profile"
              className="w-full h-full object-cover rounded-3xl"
            />
          ) : (
            doctor?.fullName?.charAt(0) || "D"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p
              className="text-lg font-bold text-[var(--color-text-primary)]"
              style={{ fontFamily: "Fraunces" }}
            >
              {doctor?.fullName || "Doctor"}
            </p>
            <VerifiedBadge
              isVerified={["Verified", "Approved"].includes(
                doctor?.profileVerificationStatus
              )}
            />
          </div>
          <p
            className="text-sm font-medium"
            style={{ color: tokens.colors.primary }}
          >
            {doctor?.specialization || "Specialist"}
          </p>
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
              const res = await axiosInstance.post(
                "/doctor/upload-profile-picture",
                formData,
                {
                  headers: { "Content-Type": "multipart/form-data" },
                }
              );
              setDoctor({ ...(doctor || {}), profilePicture: res.data.profilePicture });
              toast.success("Profile picture updated!");
            } catch {
              toast.error("Failed to upload picture");
            } finally {
              e.target.value = "";
            }
          }}
        />
        <label
          htmlFor="profilePicUpload"
          className="px-5 py-2.5 rounded-full text-xs font-semibold cursor-pointer transition-all hover:opacity-85"
          style={{
            background: `${tokens.colors.primary}15`,
            color: tokens.colors.primary,
            border: `1.5px solid ${tokens.colors.primary}30`,
          }}
        >
          <Upload size={16} className="inline mr-1" />
          Upload Photo
        </label>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-2 mb-6 p-2 rounded-full overflow-x-auto border"
        style={{
          background: `${tokens.colors.muted}30`,
          border: `1px solid ${tokens.colors.border}`,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border"
            style={{
              background:
                activeTab === tab.key
                  ? tokens.colors.primary
                  : "transparent",
              color:
                activeTab === tab.key
                  ? tokens.colors.primaryForeground
                  : tokens.colors.mutedForeground,
              borderColor:
                activeTab === tab.key
                  ? tokens.colors.primary
                  : "transparent",
              boxShadow:
                activeTab === tab.key ? tokens.shadows.soft : "none",
            }}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── PERSONAL TAB ── */}
      {activeTab === "personal" && (
        <div
          className="rounded-3xl p-6 sm:p-8 space-y-6 border transition-all hover:shadow-lg"
          style={{
            background: tokens.colors.background,
            border: `1px solid ${tokens.colors.border}`,
            boxShadow: tokens.shadows.soft,
          }}
        >
          <h2
            className="text-2xl font-bold text-[var(--color-text-primary)]"
            style={{ fontFamily: "Fraunces" }}
          >
            Personal Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <FieldLabel text="Full Name" />
              <input
                value={personal.fullName}
                onChange={(e) =>
                  setPersonal((p) => ({ ...p, fullName: e.target.value }))
                }
                placeholder="Dr. Ahmed Raza"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel text="Gender" />
              <div className="flex gap-3">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    onClick={() =>
                      setPersonal((p) => ({ ...p, gender: g }))
                    }
                    className="flex-1 py-3 rounded-full text-sm font-semibold transition-all border"
                    style={{
                      background:
                        personal.gender === g
                          ? tokens.colors.primary
                          : `${tokens.colors.muted}20`,
                      borderColor:
                        personal.gender === g
                          ? tokens.colors.primary
                          : tokens.colors.border,
                      color:
                        personal.gender === g
                          ? tokens.colors.primaryForeground
                          : tokens.colors.foreground,
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel text="Phone" />
              <input
                value={personal.phone}
                onChange={(e) =>
                  setPersonal((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="03001234567"
                className={inputCls}
              />
            </div>
          </div>
          <SaveButton
            onClick={savePersonal}
            isLoading={isSaving}
          />
        </div>
      )}

      {/* ── PROFESSIONAL TAB ── */}
      {activeTab === "professional" && (
        <div
          className="rounded-3xl p-6 sm:p-8 space-y-6 border transition-all hover:shadow-lg"
          style={{
            background: tokens.colors.background,
            border: `1px solid ${tokens.colors.border}`,
            boxShadow: tokens.shadows.soft,
          }}
        >
          <h2
            className="text-2xl font-bold text-[var(--color-text-primary)]"
            style={{ fontFamily: "Fraunces" }}
          >
            Professional Information
          </h2>

          <div>
            <FieldLabel text="Professional Title" />
            <div className="flex gap-3">
              {TITLES.map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    setProfessional((p) => ({ ...p, title: t }))
                  }
                  className="flex-1 py-3 rounded-full text-sm font-semibold transition-all border"
                  style={{
                    background:
                      professional.title === t
                        ? tokens.colors.primary
                        : `${tokens.colors.muted}20`,
                    borderColor:
                      professional.title === t
                        ? tokens.colors.primary
                        : tokens.colors.border,
                    color:
                      professional.title === t
                        ? tokens.colors.primaryForeground
                        : tokens.colors.foreground,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <FieldLabel text="Specialization" />
              <SuggestInput
                value={professional.specialization}
                onChange={(v) =>
                  setProfessional((p) => ({ ...p, specialization: v }))
                }
                suggestions={SPECIALIZATION_SUGGESTIONS}
                placeholder="e.g. Dermatologist"
              />
            </div>
            <div>
              <FieldLabel text="Primary Degree" />
              <SuggestInput
                value={professional.primaryDegree}
                onChange={(v) =>
                  setProfessional((p) => ({ ...p, primaryDegree: v }))
                }
                suggestions={DEGREE_SUGGESTIONS}
                placeholder="e.g. MBBS"
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel text="Additional Degrees" optional />
              <TagListInput
                items={professional.additionalDegrees}
                onAdd={(v) =>
                  setProfessional((p) => ({
                    ...p,
                    additionalDegrees: [...p.additionalDegrees, v],
                  }))
                }
                onRemove={(i) =>
                  setProfessional((p) => ({
                    ...p,
                    additionalDegrees: p.additionalDegrees.filter(
                      (_, idx) => idx !== i
                    ),
                  }))
                }
                placeholder="e.g. FCPS, MD"
                suggestions={DEGREE_SUGGESTIONS}
              />
            </div>
            <div>
              <FieldLabel text="Medical University" />
              <input
                value={professional.university}
                onChange={(e) =>
                  setProfessional((p) => ({
                    ...p,
                    university: e.target.value,
                  }))
                }
                placeholder="e.g. King Edward Medical University"
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel text="Graduation Year" />
              <input
                type="number"
                value={professional.graduationYear}
                onChange={(e) =>
                  setProfessional((p) => ({
                    ...p,
                    graduationYear: e.target.value,
                  }))
                }
                placeholder="e.g. 2015"
                min="1970"
                max={new Date().getFullYear()}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel text="Postgraduate Training" optional />
              <TagListInput
                items={professional.postgraduateTraining}
                onAdd={(v) =>
                  setProfessional((p) => ({
                    ...p,
                    postgraduateTraining: [
                      ...p.postgraduateTraining,
                      v,
                    ],
                  }))
                }
                onRemove={(i) =>
                  setProfessional((p) => ({
                    ...p,
                    postgraduateTraining: p.postgraduateTraining.filter(
                      (_, idx) => idx !== i
                    ),
                  }))
                }
                placeholder="e.g. Hair Transplant Training"
              />
            </div>
            <div>
              <FieldLabel text="Years of Experience" />
              <input
                type="number"
                value={professional.yearsOfExperience}
                onChange={(e) =>
                  setProfessional((p) => ({
                    ...p,
                    yearsOfExperience: e.target.value,
                  }))
                }
                placeholder="e.g. 8"
                min="0"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel text="Appointment Slot Duration (min)" />
              <div className="flex gap-2 flex-wrap">
                {[10, 15, 20, 30, 45, 60].map((d) => (
                  <button
                    key={d}
                    onClick={() =>
                      setProfessional((p) => ({
                        ...p,
                        slotDuration: d,
                      }))
                    }
                    className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all border"
                    style={{
                      background:
                        professional.slotDuration === d
                          ? tokens.colors.primary
                          : `${tokens.colors.muted}20`,
                      borderColor:
                        professional.slotDuration === d
                          ? tokens.colors.primary
                          : tokens.colors.border,
                      color:
                        professional.slotDuration === d
                          ? tokens.colors.primaryForeground
                          : tokens.colors.foreground,
                    }}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>
          </div>
          <SaveButton
            onClick={saveProfessional}
            isLoading={isSaving}
          />
        </div>
      )}

      {/* ── LICENSING TAB ── */}
      {activeTab === "licensing" && (
        <div
          className="rounded-3xl p-6 sm:p-8 space-y-6 border transition-all hover:shadow-lg"
          style={{
            background: tokens.colors.background,
            border: `1px solid ${tokens.colors.border}`,
            boxShadow: tokens.shadows.soft,
          }}
        >
          <h2
            className="text-2xl font-bold text-[var(--color-text-primary)]"
            style={{ fontFamily: "Fraunces" }}
          >
            Licensing Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <FieldLabel text="PMDC Registration Number" />
              <input
                value={licensing.pmdcNumber}
                onChange={(e) =>
                  setLicensing((p) => ({
                    ...p,
                    pmdcNumber: e.target.value,
                  }))
                }
                placeholder="e.g. PMDC-12345"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel text="License Status" />
              <div className="flex gap-3">
                {LICENSE_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      setLicensing((p) => ({
                        ...p,
                        licenseStatus: s,
                      }))
                    }
                    className="flex-1 py-3 rounded-full text-sm font-semibold transition-all border"
                    style={{
                      background:
                        licensing.licenseStatus === s
                          ? tokens.colors.primary
                          : `${tokens.colors.muted}20`,
                      borderColor:
                        licensing.licenseStatus === s
                          ? tokens.colors.primary
                          : tokens.colors.border,
                      color:
                        licensing.licenseStatus === s
                          ? tokens.colors.primaryForeground
                          : tokens.colors.foreground,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel text="License Issue Date" />
              <input
                type="date"
                value={licensing.licenseIssueDate}
                onChange={(e) =>
                  setLicensing((p) => ({
                    ...p,
                    licenseIssueDate: e.target.value,
                  }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel text="License Expiry Date" optional />
              <input
                type="date"
                value={licensing.licenseExpiryDate}
                onChange={(e) =>
                  setLicensing((p) => ({
                    ...p,
                    licenseExpiryDate: e.target.value,
                  }))
                }
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel text="PMDC Certificate" optional />
              <input
                type="file"
                id="pmdcUpload"
                accept=".pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  handlePmdcUpload(e.target.files[0]);
                  e.target.value = "";
                }}
              />
              {pmdcCertificate ? (
                <div
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl border"
                  style={{
                    background: `${tokens.colors.primary}10`,
                    borderColor: `${tokens.colors.primary}30`,
                  }}
                >
                  <span style={{ color: tokens.colors.primary }}>📎</span>
                  <span
                    className="text-sm flex-1 font-medium"
                    style={{ color: tokens.colors.primary }}
                  >
                    Certificate uploaded
                  </span>
                  <a
                    href={pmdcCertificate}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                    style={{
                      background: `${tokens.colors.primary}15`,
                      color: tokens.colors.primary,
                    }}
                  >
                    View
                  </a>
                  <label
                    htmlFor="pmdcUpload"
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                    style={{
                      background: `${tokens.colors.muted}40`,
                      color: tokens.colors.mutedForeground,
                    }}
                  >
                    {isUploadingPmdc ? "Uploading..." : "Replace"}
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="pmdcUpload"
                  className="w-full px-5 py-3 rounded-2xl text-sm flex items-center gap-2 cursor-pointer transition-all hover:opacity-90 border border-dashed"
                  style={{
                    borderColor: `${tokens.colors.primary}30`,
                    color: tokens.colors.primary,
                    background: `${tokens.colors.primary}05`,
                  }}
                >
                  {isUploadingPmdc ? (
                    "⏳ Uploading..."
                  ) : (
                    <>
                      📎 Upload PMDC Certificate (PDF or Image)
                    </>
                  )}
                </label>
              )}
            </div>
          </div>
          <SaveButton
            onClick={saveLicensing}
            isLoading={isSaving}
          />
        </div>
      )}

      {/* ── LOCATIONS TAB ── */}
      {activeTab === "locations" && (
        <div className="space-y-6">
          {/* Clinics */}
          <div
            className="rounded-3xl p-6 sm:p-8 border transition-all hover:shadow-lg"
            style={{
              background: tokens.colors.background,
              border: `1px solid ${tokens.colors.border}`,
              boxShadow: tokens.shadows.soft,
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className="text-lg font-bold text-[var(--color-text-primary)]"
                style={{ fontFamily: "Fraunces" }}
              >
                🏥 Clinics
              </h3>
              <button
                onClick={() =>
                  setClinics((p) => [
                    ...p,
                    {
                      id: Date.now(),
                      name: "",
                      address: "",
                      sessions: [],
                    },
                  ])
                }
                className="px-5 py-2.5 rounded-full text-xs font-semibold transition-all hover:opacity-90"
                style={{
                  background: `${tokens.colors.primary}15`,
                  color: tokens.colors.primary,
                  border: `1.5px solid ${tokens.colors.primary}30`,
                }}
              >
                + Add Clinic
              </button>
            </div>
            {clinics.length === 0 && (
              <div
                className="text-center py-8 rounded-2xl border border-dashed"
                style={{
                  borderColor: tokens.colors.border,
                  background: `${tokens.colors.muted}20`,
                }}
              >
                <p className="text-sm text-[var(--color-text-secondary)]">No clinics added yet</p>
              </div>
            )}
            <div className="space-y-4">
              {clinics.map((clinic, i) => (
                <LocationCard
                  key={clinic.id}
                  location={clinic}
                  index={i}
                  type="clinic"
                  allClinics={clinics}
                  allHospitals={hospitals}
                  onChange={(data) =>
                    setClinics((p) =>
                      p.map((c, idx) => (idx === i ? data : c))
                    )
                  }
                  onRemove={() =>
                    setClinics((p) =>
                      p.filter((_, idx) => idx !== i)
                    )
                  }
                />
              ))}
            </div>
          </div>

          {/* Hospitals */}
          <div
            className="rounded-3xl p-6 sm:p-8 border transition-all hover:shadow-lg"
            style={{
              background: tokens.colors.background,
              border: `1px solid ${tokens.colors.border}`,
              boxShadow: tokens.shadows.soft,
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className="text-lg font-bold text-[var(--color-text-primary)]"
                style={{ fontFamily: "Fraunces" }}
              >
                🏨 Hospitals
              </h3>
              <button
                onClick={() =>
                  setHospitals((p) => [
                    ...p,
                    {
                      id: Date.now(),
                      name: "",
                      address: "",
                      sessions: [],
                    },
                  ])
                }
                className="px-5 py-2.5 rounded-full text-xs font-semibold transition-all hover:opacity-90"
                style={{
                  background: `${tokens.colors.primary}15`,
                  color: tokens.colors.primary,
                  border: `1.5px solid ${tokens.colors.primary}30`,
                }}
              >
                + Add Hospital
              </button>
            </div>
            {hospitals.length === 0 && (
              <div
                className="text-center py-8 rounded-2xl border border-dashed"
                style={{
                  borderColor: tokens.colors.border,
                  background: `${tokens.colors.muted}20`,
                }}
              >
                <p className="text-sm text-[var(--color-text-secondary)]">No hospitals added yet</p>
              </div>
            )}
            <div className="space-y-4">
              {hospitals.map((hospital, i) => (
                <LocationCard
                  key={hospital.id}
                  location={hospital}
                  index={i}
                  type="hospital"
                  allClinics={clinics}
                  allHospitals={hospitals}
                  onChange={(data) =>
                    setHospitals((p) =>
                      p.map((h, idx) => (idx === i ? data : h))
                    )
                  }
                  onRemove={() =>
                    setHospitals((p) =>
                      p.filter((_, idx) => idx !== i)
                    )
                  }
                />
              ))}
            </div>
          </div>

          <SaveButton
            onClick={saveLocations}
            isLoading={isSaving}
            label="Save Locations"
          />
        </div>
      )}
    </div>
  );
}
