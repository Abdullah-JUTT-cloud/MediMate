import { useState, useEffect } from "react";
import {
  Upload,
  Trash2,
  Save,
  User,
  GraduationCap,
  ClipboardList,
  MapPin,
  Clock,
  Plus,
  AlertTriangle,
  UserCog,
  FileCheck2,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useAuthStore from "../store/authStore";
import { ProfileHeaderSkeleton, FormFieldSkeleton } from "../components/SkeletonLoaders";
import VerifiedBadge from "../components/VerifiedBadge";

const getSubscriptionCountdownText = (expiresAt, status = "TRIAL") => {
  if (!expiresAt) return "";
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "Your subscription has ended. Please pay to continue.";
  const expiryMidnight = new Date(new Date(expiresAt).toDateString()).getTime();
  const todayMidnight = new Date(new Date().toDateString()).getTime();
  const totalDays = Math.max(0, Math.round((expiryMidnight - todayMidnight) / (1000 * 60 * 60 * 24)));
  const safeStatus = String(status || "").toUpperCase();
  const label = safeStatus === "MONTHLY" ? "monthly subscription" : safeStatus === "YEARLY" ? "yearly subscription" : safeStatus === "ACTIVE" ? "active subscription" : safeStatus === "TRIAL" ? "free trial" : "subscription";
  return `${totalDays} day${totalDays === 1 ? "" : "s"} remaining on your ${label}. Pay to move forward securely.`;
};

// ─── High-Contrast Design Tokens (WCAG AA — light + dark themes) ───────────────
const CARD = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm";

const FIELD_LABEL =
  "text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 block";

const FIELD_INPUT =
  "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl p-3.5 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 w-full shadow-xs placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-colors";

// Selection pills (Gender / Professional Title)
const PILL_SELECTED =
  "bg-teal-600 text-white font-bold shadow-xs border border-teal-600 py-3 px-6 rounded-xl text-xs flex-1 text-center transition-colors";
const PILL_UNSELECTED =
  "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-teal-400 font-semibold py-3 px-6 rounded-xl text-xs flex-1 text-center transition-colors";

// Compact chips (slot duration)
const CHIP_SELECTED =
  "bg-teal-600 text-white font-bold shadow-xs border border-teal-600 py-2.5 px-5 rounded-xl text-xs transition-colors";
const CHIP_UNSELECTED =
  "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-teal-400 font-semibold py-2.5 px-5 rounded-xl text-xs transition-colors";

// Session timetable controls (day dropdowns / time pickers)
const SESSION_CONTROL =
  "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl px-3 py-2.5 shadow-xs focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 w-full transition-colors";

// Degree / training tags
const TAG_CHIP =
  "bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 border border-teal-300 dark:border-teal-700 text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 mr-2 mb-2";

const SAVE_BUTTON =
  "bg-teal-600 hover:bg-teal-500 text-white font-bold py-3.5 px-8 rounded-xl shadow-md transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 ml-auto mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-teal-600";

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

// ─── Shared Field Components ──────────────────────────────────────────────────

function FieldLabel({ text, optional, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className={FIELD_LABEL}>
      {text}{" "}
      {optional ? (
        <span className="font-semibold normal-case tracking-normal text-slate-500 dark:text-slate-400">
          (optional)
        </span>
      ) : (
        <span className="text-rose-600 dark:text-rose-400">*</span>
      )}
    </label>
  );
}

function SaveButton({ onClick, isLoading, label = "Save Changes" }) {
  return (
    <div className="flex">
      <button type="button" onClick={onClick} disabled={isLoading} className={SAVE_BUTTON}>
        <Save size={16} aria-hidden="true" />
        {isLoading ? "Saving..." : label}
      </button>
    </div>
  );
}

// ─── Searchable Input ─────────────────────────────────────────────────────────

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
        className={FIELD_INPUT}
      />
      {open && value && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg overflow-y-auto max-h-52">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-teal-50 dark:hover:bg-teal-950/60 border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition-colors"
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
          className={FIELD_INPUT}
        />
        <button
          type="button"
          onClick={add}
          className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 rounded-xl text-sm shadow-xs transition-colors shrink-0"
        >
          + Add
        </button>
        {open && input && filtered.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-24 mt-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg overflow-y-auto max-h-52">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-teal-50 dark:hover:bg-teal-950/60 border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition-colors"
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
        <div className="flex flex-wrap mt-3">
          {items.map((item, i) => (
            <span key={i} className={TAG_CHIP}>
              {item}
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Remove ${item}`}
                className="text-teal-900 dark:text-teal-200 hover:text-rose-600 dark:hover:text-rose-300 font-bold leading-none transition-colors"
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

// ─── Location Card (Clinic / Hospital Facility) ───────────────────────────────

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

  const facilityEmoji = type === "clinic" ? "🏥" : "🏨";
  const facilityLabel = type === "clinic" ? "Clinic" : "Hospital";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-6 shadow-sm relative">
      {/* Facility header — title + remove */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          {facilityEmoji} {facilityLabel} #{index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 border border-rose-200 dark:border-rose-800 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors inline-flex items-center gap-1.5 shrink-0"
        >
          <Trash2 size={14} aria-hidden="true" />
          Remove Facility
        </button>
      </div>

      {/* Name & address */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <FieldLabel text="Name" htmlFor={`${type}-name-${location.id}`} />
          <input
            id={`${type}-name-${location.id}`}
            value={location.name}
            onChange={(e) => onChange({ ...location, name: e.target.value })}
            placeholder={
              type === "clinic"
                ? "e.g. Doctors Hospital"
                : "e.g. Services Hospital"
            }
            className={FIELD_INPUT}
          />
        </div>
        <div>
          <FieldLabel text="Address" htmlFor={`${type}-address-${location.id}`} />
          <input
            id={`${type}-address-${location.id}`}
            value={location.address}
            onChange={(e) => onChange({ ...location, address: e.target.value })}
            placeholder="e.g. Gulberg, Lahore"
            className={FIELD_INPUT}
          />
        </div>
      </div>

      {/* Sessions timetable */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
          Sessions
        </p>
        {location.sessions.length === 0 && (
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">
            No sessions added yet.
          </p>
        )}
        <div className="space-y-2">
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
                className={`grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_1fr_auto] gap-2 items-end p-3 rounded-xl border transition-colors ${
                  overlap
                    ? "border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                }`}
              >
                {overlap && (
                  <p className="col-span-full flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-200 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-lg px-3 py-1.5">
                    <AlertTriangle size={13} aria-hidden="true" />
                    This slot overlaps another session
                  </p>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    Day
                  </label>
                  <select
                    value={session.day}
                    onChange={(e) =>
                      updateSession(si, "day", e.target.value)
                    }
                    className={SESSION_CONTROL}
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    Start
                  </label>
                  <input
                    type="time"
                    value={session.startTime}
                    onChange={(e) =>
                      updateSession(si, "startTime", e.target.value)
                    }
                    className={SESSION_CONTROL}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    End
                  </label>
                  <input
                    type="time"
                    value={session.endTime}
                    onChange={(e) =>
                      updateSession(si, "endTime", e.target.value)
                    }
                    className={SESSION_CONTROL}
                  />
                </div>
                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => removeSession(si)}
                    aria-label={`Delete ${facilityLabel.toLowerCase()} session row`}
                    title="Delete session"
                    className="text-rose-600 p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors"
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addSession}
          className="border border-dashed border-teal-400 text-teal-700 dark:text-teal-300 font-bold py-2 px-4 rounded-xl text-xs hover:bg-teal-50 dark:hover:bg-teal-950 w-full text-center transition-colors mt-3 inline-flex items-center justify-center gap-1.5"
        >
          <Plus size={14} aria-hidden="true" />
          Add Session
        </button>
      </div>
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
  const [personal, setPersonal] = useState({ firstName: "", lastName: "", gender: "", phone: "" });
  const [professional, setProfessional] = useState({
    title: "", specialization: "", primaryDegree: "",
    additionalDegrees: [], university: "", graduationYear: "",
    postgraduateTraining: [], yearsOfExperience: "", slotDuration: 20,
  });
  const [licensing, setLicensing] = useState({
    pmdcNumber: "", licenseStatus: "Active",
    licenseIssueDate: "", licenseExpiryDate: "",
  });
  const [payments, setPayments] = useState({
    advanceBookingFee: 0,
    paymentAccountTitle: "",
    paymentBankName: "",
    paymentAccountNumber: "",
    paymentIBAN: "",
  });
  const [clinics, setClinics] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [pmdcCertificate, setPmdcCertificate] = useState("");
  const [isUploadingPmdc, setIsUploadingPmdc] = useState(false);
  const [isDragOverPmdc, setIsDragOverPmdc] = useState(false);
  const [trialMessage, setTrialMessage] = useState("");

  // ── Load profile on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get("/doctor/profile");
        const d = res.data.doctor;
        const firstName = d.firstName || d.fullName?.split(" ")?.[0] || "";
        const lastName = d.lastName || d.fullName?.split(" ")?.slice(1).join(" ") || "";
        setPersonal({ firstName, lastName, gender: d.gender || "", phone: d.phone || "" });
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
        setPayments({
          advanceBookingFee: d.advanceBookingFee || 0,
          paymentAccountTitle: d.paymentAccountTitle || "",
          paymentBankName: d.paymentBankName || "",
          paymentAccountNumber: d.paymentAccountNumber || "",
          paymentIBAN: d.paymentIBAN || "",
        });
        setClinics((d.clinics || []).map((c, i) => ({ ...c, id: c.id || Date.now() + i })));
        setHospitals((d.hospitals || []).map((h, i) => ({ ...h, id: h.id || Date.now() + i })));
        setPmdcCertificate(d.pmdcCertificate || "");
        setTrialMessage(getSubscriptionCountdownText(d.subscriptionExpiresAt, d.subscriptionStatus));
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
      const nextDoctor = {
        ...(doctor || {}),
        ...d,
      };
      setDoctor(nextDoctor);
      setTrialMessage(getSubscriptionCountdownText(d.subscriptionExpiresAt || nextDoctor.subscriptionExpiresAt, d.subscriptionStatus || nextDoctor.subscriptionStatus));
      toast.success(successMsg);
    } catch {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const savePersonal = () => {
    if (!personal.firstName.trim()) { toast.error("First name is required"); return; }
    if (!personal.lastName.trim()) { toast.error("Last name is required"); return; }
    if (!personal.phone.trim()) { toast.error("Phone is required"); return; }
    save(
      {
        ...personal,
        fullName: `${personal.firstName} ${personal.lastName}`.trim(),
      },
      "Personal info updated!",
    );
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

  const savePayments = () => {
    save(payments, "Payment & fee settings updated!");
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
    { key: "personal", label: "Personal", icon: User },
    { key: "professional", label: "Professional", icon: GraduationCap },
    { key: "licensing", label: "Licensing", icon: ClipboardList },
    { key: "locations", label: "Locations", icon: MapPin },
    { key: "payments", label: "Payments & Fee", icon: CreditCard },
  ];

  const licenseStatusPillCls = (s) => {
    const selected = licensing.licenseStatus === s;
    if (selected && s === "Active") {
      return "bg-emerald-600 text-white font-bold shadow-xs border border-emerald-600 py-2.5 px-5 rounded-xl text-xs flex-1 text-center transition-colors";
    }
    if (selected) {
      return "bg-slate-700 dark:bg-slate-600 text-white font-bold shadow-xs border border-slate-700 dark:border-slate-600 py-2.5 px-5 rounded-xl text-xs flex-1 text-center transition-colors";
    }
    return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-teal-400 py-2.5 px-5 rounded-xl text-xs font-semibold flex-1 text-center transition-colors";
  };

  const addClinic = () =>
    setClinics((p) => [...p, { id: Date.now(), name: "", address: "", sessions: [] }]);

  const addHospital = () =>
    setHospitals((p) => [...p, { id: Date.now(), name: "", address: "", sessions: [] }]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserCog size={24} className="text-teal-600 dark:text-teal-400" aria-hidden="true" />
          Settings
        </h1>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
          Manage your profile and practice information
        </p>
        <div className="mt-6">
          <ProfileHeaderSkeleton />
        </div>
        <div className={`${CARD} p-6 sm:p-8 mt-6`}>
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
      {/* ── Page header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserCog size={24} className="text-teal-600 dark:text-teal-400" aria-hidden="true" />
          Settings
        </h1>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
          Manage your profile and practice information
        </p>
      </div>

      {/* ── Trial / subscription status banner ── */}
      {trialMessage && (
        <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 p-4 rounded-2xl flex items-center justify-between mb-6 shadow-xs gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Clock size={18} className="text-teal-700 dark:text-teal-300 shrink-0" aria-hidden="true" />
            <p className="text-sm font-bold text-teal-900 dark:text-teal-200">
              {trialMessage}
            </p>
          </div>
        </div>
      )}

      {/* ── Doctor avatar & profile spotlight card ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
          <div className="w-16 h-16 rounded-2xl bg-teal-600 border border-teal-700 dark:border-teal-500 text-white flex items-center justify-center text-2xl font-bold shrink-0 overflow-hidden shadow-xs">
            {doctor?.profilePicture ? (
              <img
                src={doctor.profilePicture || doctor.profilePicUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              doctor?.fullName?.charAt(0) || "D"
            )}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="truncate">{doctor?.fullName || "Doctor"}</span>
              <VerifiedBadge
                isVerified={["Verified", "Approved"].includes(
                  doctor?.profileVerificationStatus
                )}
              />
            </p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              {[doctor?.title, doctor?.specialization || "Specialist"]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
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
              const nextDoctor = { ...(doctor || {}), profilePicture: res.data.profilePicture, profilePicUrl: res.data.profilePicture };
              setDoctor(nextDoctor);
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
          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shrink-0"
        >
          <Upload size={14} aria-hidden="true" />
          Upload Photo
        </label>
      </div>

      {/* ── High-contrast tab navigation ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={isActive}
              className={
                isActive
                  ? "bg-teal-600 text-white font-bold shadow-xs px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 whitespace-nowrap transition-colors"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-500 font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 whitespace-nowrap transition-colors"
              }
            >
              <Icon size={14} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── PERSONAL TAB ── */}
      {activeTab === "personal" && (
        <div className={`${CARD} p-6 sm:p-8`}>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
            <User size={18} className="text-teal-600 dark:text-teal-400" aria-hidden="true" />
            Personal Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <FieldLabel text="First Name" htmlFor="firstName" />
              <input
                id="firstName"
                value={personal.firstName}
                onChange={(e) =>
                  setPersonal((p) => ({ ...p, firstName: e.target.value }))
                }
                placeholder="Ahmed"
                className={FIELD_INPUT}
              />
            </div>
            <div>
              <FieldLabel text="Last Name" htmlFor="lastName" />
              <input
                id="lastName"
                value={personal.lastName}
                onChange={(e) =>
                  setPersonal((p) => ({ ...p, lastName: e.target.value }))
                }
                placeholder="Raza"
                className={FIELD_INPUT}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel text="Gender" />
              <div className="flex gap-3">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={personal.gender === g}
                    onClick={() =>
                      setPersonal((p) => ({ ...p, gender: g }))
                    }
                    className={
                      personal.gender === g ? PILL_SELECTED : PILL_UNSELECTED
                    }
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel text="Phone" htmlFor="phone" />
              <input
                id="phone"
                value={personal.phone}
                onChange={(e) =>
                  setPersonal((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="03001234567"
                className={FIELD_INPUT}
              />
            </div>
          </div>
          <SaveButton onClick={savePersonal} isLoading={isSaving} />
        </div>
      )}

      {/* ── PROFESSIONAL TAB ── */}
      {activeTab === "professional" && (
        <div className={`${CARD} p-6 sm:p-8`}>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
            <GraduationCap size={18} className="text-teal-600 dark:text-teal-400" aria-hidden="true" />
            Professional Information
          </h2>

          <div className="mb-6">
            <FieldLabel text="Professional Title" />
            <div className="flex flex-wrap gap-3">
              {TITLES.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={professional.title === t}
                  onClick={() =>
                    setProfessional((p) => ({ ...p, title: t }))
                  }
                  className={
                    professional.title === t ? PILL_SELECTED : PILL_UNSELECTED
                  }
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
              <FieldLabel text="Medical University" htmlFor="university" />
              <input
                id="university"
                value={professional.university}
                onChange={(e) =>
                  setProfessional((p) => ({
                    ...p,
                    university: e.target.value,
                  }))
                }
                placeholder="e.g. King Edward Medical University"
                className={FIELD_INPUT}
              />
            </div>
            <div>
              <FieldLabel text="Graduation Year" htmlFor="graduationYear" />
              <input
                id="graduationYear"
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
                className={FIELD_INPUT}
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
              <FieldLabel text="Years of Experience" htmlFor="yearsOfExperience" />
              <input
                id="yearsOfExperience"
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
                className={FIELD_INPUT}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel text="Appointment Slot Duration (min)" />
              <div className="flex flex-wrap gap-2">
                {[10, 15, 20, 30, 45, 60].map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={professional.slotDuration === d}
                    onClick={() =>
                      setProfessional((p) => ({
                        ...p,
                        slotDuration: d,
                      }))
                    }
                    className={
                      professional.slotDuration === d
                        ? CHIP_SELECTED
                        : CHIP_UNSELECTED
                    }
                  >
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
        <div className={`${CARD} p-6 sm:p-8`}>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
            <ClipboardList size={18} className="text-teal-600 dark:text-teal-400" aria-hidden="true" />
            Licensing & PMDC Verification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <FieldLabel text="PMDC Registration Number" htmlFor="pmdcNumber" />
              <input
                id="pmdcNumber"
                value={licensing.pmdcNumber}
                onChange={(e) =>
                  setLicensing((p) => ({
                    ...p,
                    pmdcNumber: e.target.value,
                  }))
                }
                placeholder="e.g. PMDC-12345"
                className={`${FIELD_INPUT} font-bold tracking-wide`}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel text="License Status" />
              <div className="flex flex-wrap gap-3">
                {LICENSE_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={licensing.licenseStatus === s}
                    onClick={() =>
                      setLicensing((p) => ({
                        ...p,
                        licenseStatus: s,
                      }))
                    }
                    className={licenseStatusPillCls(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel text="License Issue Date" htmlFor="licenseIssueDate" />
              <input
                id="licenseIssueDate"
                type="date"
                value={licensing.licenseIssueDate}
                onChange={(e) =>
                  setLicensing((p) => ({
                    ...p,
                    licenseIssueDate: e.target.value,
                  }))
                }
                className={FIELD_INPUT}
              />
            </div>
            <div>
              <FieldLabel text="License Expiry Date" optional htmlFor="licenseExpiryDate" />
              <input
                id="licenseExpiryDate"
                type="date"
                value={licensing.licenseExpiryDate}
                onChange={(e) =>
                  setLicensing((p) => ({
                    ...p,
                    licenseExpiryDate: e.target.value,
                  }))
                }
                className={FIELD_INPUT}
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-700 rounded-2xl px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-teal-900 dark:text-teal-200 min-w-0">
                    <FileCheck2 size={18} className="shrink-0" aria-hidden="true" />
                    <span className="truncate">Certificate uploaded</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <a
                      href={pmdcCertificate}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-teal-900 dark:text-teal-200 border border-teal-300 dark:border-teal-700 rounded-lg px-3 py-1.5 hover:bg-teal-100 dark:hover:bg-teal-900 transition-colors"
                    >
                      View
                    </a>
                    <label
                      htmlFor="pmdcUpload"
                      className="text-xs font-bold cursor-pointer text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      {isUploadingPmdc ? "Uploading..." : "Replace"}
                    </label>
                  </span>
                </div>
              ) : (
                <label
                  htmlFor="pmdcUpload"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOverPmdc(true);
                  }}
                  onDragLeave={() => setIsDragOverPmdc(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOverPmdc(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handlePmdcUpload(file);
                  }}
                  className={`block border-2 border-dashed border-teal-400 dark:border-teal-700 bg-teal-50/40 dark:bg-teal-950/20 p-6 rounded-2xl text-center cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors ${
                    isDragOverPmdc ? "ring-2 ring-teal-500/40 bg-teal-50 dark:bg-teal-950/40" : ""
                  }`}
                >
                  <Upload
                    size={28}
                    className="mx-auto mb-2 text-teal-700 dark:text-teal-300"
                    aria-hidden="true"
                  />
                  <p className="text-teal-700 dark:text-teal-300 font-bold text-sm">
                    {isUploadingPmdc
                      ? "⏳ Uploading..."
                      : "Drag & drop your PMDC certificate here"}
                  </p>
                  <p className="text-xs font-semibold text-teal-700 dark:text-teal-300 mt-1.5">
                    PDF or image — or click to browse files
                  </p>
                </label>
              )}
            </div>
          </div>
          <SaveButton onClick={saveLicensing} isLoading={isSaving} />
        </div>
      )}

      {/* ── LOCATIONS TAB ── */}
      {activeTab === "locations" && (
        <div>
          {/* Clinics */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              🏥 Clinics
            </h3>
            <button
              type="button"
              onClick={addClinic}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 shrink-0"
            >
              <Plus size={14} aria-hidden="true" />
              Add Clinic
            </button>
          </div>
          {clinics.length === 0 && (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-8 text-center mb-6">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No clinics added yet
              </p>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
                Add your first practice location to start building your timetable.
              </p>
            </div>
          )}
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

          {/* Hospitals */}
          <div className="flex items-center justify-between gap-3 mb-4 mt-8">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              🏨 Hospitals
            </h3>
            <button
              type="button"
              onClick={addHospital}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 shrink-0"
            >
              <Plus size={14} aria-hidden="true" />
              Add Hospital
            </button>
          </div>
          {hospitals.length === 0 && (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-8 text-center mb-6">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No hospitals added yet
              </p>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
                Add a hospital affiliation to expand your practice schedule.
              </p>
            </div>
          )}
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

          <SaveButton
            onClick={saveLocations}
            isLoading={isSaving}
            label="Save Locations"
          />
        </div>
      )}

      {/* ── PAYMENTS & FEE TAB ── */}
      {activeTab === "payments" && (
        <div className={`${CARD} p-6 sm:p-8`}>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <CreditCard size={18} className="text-teal-600 dark:text-teal-400" aria-hidden="true" />
            Online Booking Fee & Bank Details
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Configure the advance fee patients must pay when requesting an online booking, and the bank account info where they will transfer funds.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <FieldLabel text="Online Booking Fee (PKR)" htmlFor="advanceBookingFee" optional />
              <input
                id="advanceBookingFee"
                type="number"
                min="0"
                step="50"
                value={payments.advanceBookingFee}
                onChange={(e) =>
                  setPayments((p) => ({
                    ...p,
                    advanceBookingFee: Math.max(0, Number(e.target.value) || 0),
                    onlineBookingFee: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                placeholder="e.g. 1000 (Set to 0 for no online fee)"
                className={FIELD_INPUT}
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Patients will be instructed to upload a screenshot of this online booking fee when submitting a booking request. Set to 0 if no advance online fee is required.
              </p>
            </div>

            <div>
              <FieldLabel text="Bank Name" htmlFor="paymentBankName" optional />
              <input
                id="paymentBankName"
                value={payments.paymentBankName}
                onChange={(e) =>
                  setPayments((p) => ({ ...p, paymentBankName: e.target.value }))
                }
                placeholder="e.g. Meezan Bank / JazzCash / EasyPaisa"
                className={FIELD_INPUT}
              />
            </div>

            <div>
              <FieldLabel text="Account Title" htmlFor="paymentAccountTitle" optional />
              <input
                id="paymentAccountTitle"
                value={payments.paymentAccountTitle}
                onChange={(e) =>
                  setPayments((p) => ({ ...p, paymentAccountTitle: e.target.value }))
                }
                placeholder="e.g. Dr. Muhammad Ahmed"
                className={FIELD_INPUT}
              />
            </div>

            <div className="sm:col-span-2">
              <FieldLabel text="Account Number / Phone" htmlFor="paymentAccountNumber" optional />
              <input
                id="paymentAccountNumber"
                value={payments.paymentAccountNumber}
                onChange={(e) =>
                  setPayments((p) => ({ ...p, paymentAccountNumber: e.target.value }))
                }
                placeholder="e.g. 03001234567 or 01234567891234"
                className={FIELD_INPUT}
              />
            </div>

            <div className="sm:col-span-2">
              <FieldLabel text="IBAN" htmlFor="paymentIBAN" optional />
              <input
                id="paymentIBAN"
                value={payments.paymentIBAN}
                onChange={(e) =>
                  setPayments((p) => ({ ...p, paymentIBAN: e.target.value }))
                }
                placeholder="e.g. PK36MEZN0001234567891234"
                className={FIELD_INPUT}
              />
            </div>
          </div>

          <SaveButton onClick={savePayments} isLoading={isSaving} label="Save Payment Details" />
        </div>
      )}
    </div>
  );
}
