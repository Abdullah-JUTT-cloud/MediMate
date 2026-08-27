import { useState, useEffect, useRef, useCallback } from "react";
import { CalendarDays, ClipboardCheck, RefreshCcw, Search, Siren, Stethoscope, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useAuthStore from "../store/authStore";
import { RowSkeleton } from "../components/SkeletonLoaders";
import ConfirmDialog from "../components/ConfirmDialog";
import useConfirmDialog from "../hooks/useConfirmDialog";
import SlotPicker from "../components/patients/SlotPicker";
import { useSlotAvailability } from "../components/patients/slotAvailability";

// ─── Constants ────────────────────────────────────────────────────────────────

const APPOINTMENT_TYPES = ["Consultation", "Follow-up", "Check-up", "Emergency"];
const STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled", "No-show"];
const CANCELLATION_REASONS = ["Patient", "Doctor", "Emergency", "No-show"];

// High-contrast (WCAG AA) status badge classes — light + dark themes.
const BADGE_BASE = "inline-flex items-center whitespace-nowrap font-bold px-3 py-1 rounded-full text-xs border";

const STATUS_BADGE_CLASSES = {
  Completed:
    "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-400/50",
  Pending:
    "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-400/50",
  Confirmed:
    "bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-500/20 dark:text-teal-100 dark:border-teal-400/50",
  Cancelled:
    "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/20 dark:text-rose-100 dark:border-rose-400/50",
  "No-show":
    "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/20 dark:text-rose-100 dark:border-rose-400/50",
};

// Selectable (toggle) variants used by the status picker in the detail view.
const STATUS_SELECT_CLASSES = {
  Completed: "bg-emerald-600 text-white border-emerald-600",
  Pending: "bg-amber-500 text-white border-amber-500",
  Confirmed: "bg-teal-600 text-white border-teal-600",
  Cancelled: "bg-rose-600 text-white border-rose-600",
  "No-show": "bg-rose-600 text-white border-rose-600",
};

const UNSELECTED_CHIP =
  "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-teal-500 font-semibold";

// Shared field primitives
const FIELD_LABEL =
  "text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 block";
const FIELD_INPUT =
  "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl p-3.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none w-full shadow-xs placeholder:text-slate-400 transition-colors";

const TYPE_ICONS = {
  Consultation: Stethoscope,
  "Follow-up": RefreshCcw,
  "Check-up": ClipboardCheck,
  Emergency: Siren,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });

const formatDateInput = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getDayName = (dateStr) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date(dateStr).getDay()];
};

const generateSlots = (startTime, endTime, slotDuration) => {
  const slots = [];
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const toTime = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
  let current = toMin(startTime);
  const end = toMin(endTime);
  while (current + slotDuration <= end) {
    slots.push(toTime(current));
    current += slotDuration;
  }
  return slots;
};

const TypeIcon = ({ type, size = 18 }) => {
  const Icon = TYPE_ICONS[type] || Stethoscope;
  return <Icon size={size} strokeWidth={2} />;
};

function BackButton({ onClick, label = "Back" }) {
  return (
    <button onClick={onClick} type="button"
      className="flex items-center gap-2 text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline mb-6">
      ← {label}
    </button>
  );
}

function SectionLabel({ text }) {
  return <span className={FIELD_LABEL}>{text}</span>;
}

function StatusBadge({ status }) {
  const cls = STATUS_BADGE_CLASSES[status] || STATUS_BADGE_CLASSES.Pending;
  return <span className={`${BADGE_BASE} ${cls}`}>{status}</span>;
}

function TypeBadge({ type }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold px-3 py-1 rounded-lg text-xs">
      <TypeIcon type={type} size={13} /> {type}
    </span>
  );
}

const getInitials = (name) =>
  name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "P";

function Avatar({ name, size = "md" }) {
  const dim = size === "sm" ? "w-9 h-9 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${dim} rounded-xl flex items-center justify-center font-bold text-white bg-teal-600 shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APPOINTMENT DETAIL PAGE
// ══════════════════════════════════════════════════════════════════════════════

function AppointmentDetailPage({ appointment, onBack, onUpdated, onDeleted, confirmAction }) {
  const [status, setStatus] = useState(appointment.status);
  const [notes, setNotes] = useState(appointment.notes || "");
  const [cancellationReason, setCancellationReason] = useState(
    appointment.cancellationReason || (appointment.status === "No-show" ? "No-show" : "")
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        status,
        notes,
      };

      if (status === "Cancelled" || status === "No-show") {
        payload.cancellationReason =
          cancellationReason || (status === "No-show" ? "No-show" : "Patient");
      } else {
        payload.cancellationReason = null;
      }

      const res = await axiosInstance.put(`/appointments/${appointment._id}`, payload);
      toast.success("Appointment updated");
      onUpdated(res.data.appointment);
    } catch {
      toast.error("Failed to update");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmAction({
      title: "Delete Appointment",
      message: "This appointment will be permanently removed.",
      confirmText: "Delete",
      cancelText: "Cancel",
      tone: "danger",
    });
    if (!confirmed) return;
    if (isLoading) return;
    setIsLoading(true);
    try {
      await axiosInstance.delete(`/appointments/${appointment._id}`);
      toast.success("Appointment deleted");
      onDeleted(appointment._id);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setIsLoading(false);
    }
  };

  const patient = appointment.patient;

  return (
    <div className="max-w-3xl mx-auto px-1">
      <BackButton onClick={onBack} label="Back to Appointments" />

      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8 mb-5">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-teal-600 text-white">
            <TypeIcon type={appointment.type} size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{patient?.name || "Unknown Patient"}</h2>
            <p className="text-sm font-semibold mt-0.5 text-slate-700 dark:text-slate-300">
              {appointment.type} · {formatDate(appointment.date)} at {appointment.slot}
            </p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Patient", value: patient?.name || "—" },
            { label: "Phone", value: patient?.phone || "—" },
            { label: "Age", value: patient?.age ? `${patient.age} yrs` : "—" },
            { label: "Date", value: formatDate(appointment.date) },
            { label: "Time Slot", value: appointment.slot },
            { label: "Type", value: appointment.type },
            { label: "Reason", value: appointment.cancellationReason || "—" },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-400">{label}</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white break-words">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Update Status */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8 mb-4">
        <SectionLabel text="Update Status" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)} type="button"
              className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                status === s ? `${STATUS_SELECT_CLASSES[s]} shadow-sm` : UNSELECTED_CHIP
              }`}>
              {s}
            </button>
          ))}
        </div>

        {(status === "Cancelled" || status === "No-show") && (
          <>
            <SectionLabel text="Cancellation Reason" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {CANCELLATION_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCancellationReason(r)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    cancellationReason === r
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                      : UNSELECTED_CHIP
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </>
        )}

        <SectionLabel text="Notes" />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this appointment..."
          rows={3} className={`${FIELD_INPUT} resize-none mb-4`} />

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={isLoading} type="button"
            className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold text-base py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
          <button onClick={handleDelete} disabled={isLoading} type="button"
            className="px-4 py-3.5 rounded-xl text-sm font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-500/50 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-colors flex items-center gap-2 disabled:opacity-60">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BOOK APPOINTMENT FORM
// ══════════════════════════════════════════════════════════════════════════════

function BookAppointmentForm({
  onBack,
  onBooked,
  preSelectedPatient = null,
  rescheduleCancelledAppointmentId = null,
  onEmergencyRescheduleComplete,
}) {
  const { doctor } = useAuthStore();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [type, setType] = useState("");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState([]);
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [billingAmount, setBillingAmount] = useState("");
  const [billingDiscount, setBillingDiscount] = useState("0");
  const [billingDescription, setBillingDescription] = useState("Consultation");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  // Emergency Mode override — defaults OFF; when ON full slots become
  // selectable and the backend bypasses the 3-per-slot capacity check.
  const [isEmergency, setIsEmergency] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isHydratingSelectedPatient, setIsHydratingSelectedPatient] = useState(false);
  const hasShownMissingScheduleToast = useRef(false);
  const dateInputRef = useRef(null);

  // Live per-slot occupancy shared with the Patient booking modal
  // (standardCount / emergencyCount / isFull from GET /api/slots).
  const { availability: slotAvailability, isLoading: isLoadingSlots } =
    useSlotAvailability(date, {
      enabled: Boolean(date && selectedPatient && !isHydratingSelectedPatient),
    });

  // Preselected patients coming from reschedule can be partial objects (without locations).
  useEffect(() => {
    let cancelled = false;

    const hydratePatient = async () => {
      if (!preSelectedPatient) return;

      setSearch(preSelectedPatient.name || "");

      if (Array.isArray(preSelectedPatient.locations)) {
        setSelectedPatient(preSelectedPatient);
        return;
      }

      if (!preSelectedPatient._id) {
        setSelectedPatient(preSelectedPatient);
        return;
      }

      setIsHydratingSelectedPatient(true);
      try {
        const res = await axiosInstance.get(`/patients/${preSelectedPatient._id}`);
        if (!cancelled) {
          setSelectedPatient(res.data.patient || preSelectedPatient);
        }
      } catch {
        if (!cancelled) {
          setSelectedPatient(preSelectedPatient);
          toast.error("Failed to load full patient details for reschedule");
        }
      } finally {
        if (!cancelled) setIsHydratingSelectedPatient(false);
      }
    };

    hydratePatient();
    return () => { cancelled = true; };
  }, [preSelectedPatient]);

  // Search patients
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!search.trim()) { setPatients([]); return; }
      setSearchLoading(true);
      try {
        const res = await axiosInstance.get("/patients", { params: { search, limit: 10 } });
        setPatients(res.data.patients);
      } catch {
        toast.error("Failed to search patients");
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Generate slots when date and patient are selected
  useEffect(() => {
    if (!date || !selectedPatient || isHydratingSelectedPatient) return;

    const dayName = getDayName(date);
    const slotDuration = doctor?.slotDuration || 20;
    const generatedSlots = [];
    const doctorClinics = Array.isArray(doctor?.clinics) ? doctor.clinics : [];
    const doctorHospitals = Array.isArray(doctor?.hospitals) ? doctor.hospitals : [];

    // Get patient's locations
    const patientLocations = Array.isArray(selectedPatient.locations) ? selectedPatient.locations : [];

    if (patientLocations.length > 0 && doctorClinics.length === 0 && doctorHospitals.length === 0) {
      if (!hasShownMissingScheduleToast.current) {
        toast.error("Doctor schedule data is missing. Please refresh or re-login.");
        hasShownMissingScheduleToast.current = true;
      }
      console.warn("Slot generation skipped: doctor clinics/hospitals missing in auth store");
      setSlots([]);
      setSelectedSlot("");
      return;
    }
    hasShownMissingScheduleToast.current = false;

    // For each patient location find matching sessions in doctor's profile
    for (const loc of patientLocations) {
      const isClinic = loc.locationType === "Clinic";
      const locationList = isClinic ? doctorClinics : doctorHospitals;
      const matchedLocation = locationList.find(
        (l) => l._id?.toString() === loc.locationId || l.name === loc.locationName
      );

      if (matchedLocation) {
        const daySessions = matchedLocation.sessions.filter((s) => s.day === dayName);
        for (const session of daySessions) {
          const sessionSlots = generateSlots(session.startTime, session.endTime, slotDuration);
          for (const slot of sessionSlots) {
            if (!generatedSlots.find((s) => s.time === slot)) {
              generatedSlots.push({ time: slot, locationName: loc.locationName, locationType: loc.locationType });
            }
          }
        }
      }
    }

    setSlots(generatedSlots);
    setSelectedSlot("");
  }, [date, selectedPatient, doctor, isHydratingSelectedPatient]);

  const handleSubmit = async () => {
    if (!selectedPatient) { toast.error("Select a patient"); return; }
    if (!date) { toast.error("Select a date"); return; }
    if (!selectedSlot) { toast.error("Select a time slot"); return; }
    if (!type) { toast.error("Select appointment type"); return; }

    const parsedAmount = Number(billingAmount);
    const parsedDiscount = Number(billingDiscount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      toast.error("Enter a valid consultation amount");
      return;
    }
    if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0) {
      toast.error("Enter a valid discount amount");
      return;
    }

    setIsLoading(true);
    try {
      // Send RAW standardFee + RAW discount only — never pre-subtract the
      // discount before dispatching. The server (appointment.controller.js)
      // is the single place that computes netAmount = standardFee - discount,
      // so sending an already-discounted `consultationFee`/`amount` here
      // used to double-apply the discount (500 fee, 50 discount rendered as
      // 100 PKR off / 400 net instead of 50 off / 450 net).
      const res = await axiosInstance.post("/appointments", {
        patientId: selectedPatient._id,
        date,
        slot: selectedSlot,
        type,
        notes,
        isEmergency,
        isWalkIn,
        standardFee: parsedAmount,
        amount: parsedAmount,
        discount: parsedDiscount,
        description: billingDescription.trim() || "Consultation",
        paymentMethod,
      });
      if (rescheduleCancelledAppointmentId && onEmergencyRescheduleComplete) {
        await onEmergencyRescheduleComplete(rescheduleCancelledAppointmentId);
      }
      toast.success("Appointment booked!");
      onBooked(res.data.appointment);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to book appointment");
    } finally {
      setIsLoading(false);
    }
  };

  const originalFee = Math.max(0, Number(billingAmount || 0));
  const discountFee = Math.max(0, Number(billingDiscount || 0));
  const netFee = Math.max(0, originalFee - discountFee);

  return (
    <div className="max-w-3xl mx-auto px-1">
      <BackButton onClick={onBack} label="Back to Appointments" />

      <div className="space-y-4">

        {/* Patient Search */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <SectionLabel text="Select Patient" />
          <div className="relative mb-3">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none">
              <Search size={16} />
            </span>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setSelectedPatient(null); }}
              placeholder="Search patient by name or phone..."
              className={`${FIELD_INPUT} pl-10`} />
          </div>

          {searchLoading && (
            <div className="space-y-2 py-4">
              <RowSkeleton hasAvatar={true} />
              <RowSkeleton hasAvatar={true} />
            </div>
          )}

          {!searchLoading && patients.length > 0 && !selectedPatient && (
            <div className="space-y-2">
              {patients.map((p) => (
                <button key={p._id} type="button" onClick={() => { setSelectedPatient(p); setSearch(p.name); setPatients([]); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-colors">
                  <Avatar name={p.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{p.age} yrs · {p.phone}</p>
                  </div>
                  {p.locations?.map((loc, i) => (
                    <span key={i} className="hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                      {loc.locationType === "Clinic" ? "🏥" : "🏨"} {loc.locationName}
                    </span>
                  ))}
                </button>
              ))}
            </div>
          )}

          {selectedPatient && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
              <Avatar name={selectedPatient.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedPatient.name}</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{selectedPatient.age} yrs · {selectedPatient.phone}</p>
              </div>
              <button type="button" onClick={() => { setSelectedPatient(null); setSearch(""); setSlots([]); }}
                className="text-xs font-bold px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700">✕</button>
            </div>
          )}
        </div>

        {/* Date + Type */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <SectionLabel text="Date" />
              <div className="relative">
                <input type="date" ref={dateInputRef} value={date} onChange={(e) => setDate(e.target.value)}
                  min={formatDateInput(new Date())}
                  className={FIELD_INPUT} />
                {/* Imperative trigger (Option B) so a click on the calendar
                    glyph itself always opens the native picker, in addition
                    to the pointer-events fix on the native indicator. */}
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Open calendar"
                  onClick={() => dateInputRef.current?.showPicker?.()}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition-colors hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
                >
                  <CalendarDays size={16} />
                </button>
              </div>
            </div>
            <div>
              <SectionLabel text="Appointment Type" />
              <div className="grid grid-cols-2 gap-2">
                {APPOINTMENT_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`py-2.5 px-3 rounded-xl text-xs border transition-all flex items-center gap-1.5 ${
                      type === t
                        ? "bg-teal-600 text-white font-bold border-teal-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-teal-400 font-semibold"
                    }`}>
                    <TypeIcon type={t} size={14} /> {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 p-4 rounded-xl mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Walk-In Patient</p>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Flag this patient as a walk-in for the queue</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isWalkIn}
              aria-label="Walk-in patient"
              onClick={() => setIsWalkIn(!isWalkIn)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500/40 ${
                isWalkIn ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                style={{ transform: isWalkIn ? "translateX(20px)" : "translateX(0px)" }}
              />
            </button>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-2 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <SectionLabel text="Price / Amount (PKR)" />
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={billingAmount}
                  onChange={(e) => setBillingAmount(e.target.value)}
                  placeholder="2000"
                  className={FIELD_INPUT}
                />
              </div>
              <div>
                <SectionLabel text="Discount (PKR)" />
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={billingDiscount}
                  onChange={(e) => setBillingDiscount(e.target.value)}
                  placeholder="0"
                  className={FIELD_INPUT}
                />
              </div>
            </div>

            <div>
              <SectionLabel text="Payment Description" />
              <input
                type="text"
                value={billingDescription}
                onChange={(e) => setBillingDescription(e.target.value)}
                placeholder="Consultation"
                className={FIELD_INPUT}
              />
            </div>

            <div>
              <SectionLabel text="Payment Method" />
              <div className="grid grid-cols-3 gap-2">
                {['Cash', 'Card', 'Online Transfer'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2.5 px-3 rounded-xl text-xs border transition-all ${
                      paymentMethod === method
                        ? "bg-teal-600 text-white font-bold border-teal-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-teal-400 font-semibold"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 p-4 rounded-xl mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-200 mb-1">Fee Summary</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Original Fee: Rs. {originalFee.toLocaleString()}
                <span className="mx-2 text-slate-400 dark:text-slate-500">|</span>
                Discount: -Rs. {discountFee.toLocaleString()}
                <span className="mx-2 text-slate-400 dark:text-slate-500">|</span>
                <span className="font-bold text-teal-800 dark:text-teal-200">Net Charge: Rs. {netFee.toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Slots — shared SlotPicker (same grid/logic as the Patient booking modal) */}
        {selectedPatient && date && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
            <SectionLabel text={`Available Slots — ${getDayName(date)}, ${formatDate(date)}`} />
            {isHydratingSelectedPatient ? (
              <div className="text-center py-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-3xl mb-2">⏳</div>
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Loading patient schedule...</p>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Fetching complete location details to calculate slots
                </p>
              </div>
            ) : (
              <SlotPicker
                slots={slots}
                availability={slotAvailability}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
                isEmergency={isEmergency}
                onEmergencyChange={setIsEmergency}
                isLoading={isLoadingSlots}
                emptyTitle="No slots available"
                emptyHint={`${selectedPatient.name} has no sessions on ${getDayName(date)}`}
              />
            )}
          </div>
        )}

        {/* Notes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <SectionLabel text="Notes (optional)" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this appointment..."
            rows={3} className={`${FIELD_INPUT} resize-none`} />
        </div>

        <button onClick={handleSubmit} disabled={isLoading} type="button"
          className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-base py-3.5 px-6 rounded-xl shadow-md transition-all w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
          <ClipboardCheck size={18} />
          {isLoading ? "Booking..." : "Book Appointment"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APPOINTMENTS LIST
// ══════════════════════════════════════════════════════════════════════════════

export default function AppointmentsPage({
  initialPatient = null,
  rescheduleCancelledAppointmentId = null,
  onEmergencyRescheduleComplete,
}) {
  const { confirm, dialogProps } = useConfirmDialog();
  const [view, setView] = useState("list");
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [preSelectedPatient, setPreSelectedPatient] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (dateFilter) params.set("date", dateFilter);
      if (activeFilter !== "All") params.set("status", activeFilter);
      const res = await axiosInstance.get(`/appointments?${params.toString()}`);
      setAppointments(res.data.appointments);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, dateFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  useEffect(() => {
    // Keep selection in sync when list changes by filter/date.
    setSelectedIds((prev) => prev.filter((id) => appointments.some((a) => a._id === id)));
  }, [appointments]);

  useEffect(() => {
    if (initialPatient) {
      setPreSelectedPatient(initialPatient);
      setView("book");
    }
  }, [initialPatient]);

  const handleUpdated = (updated) => {
    setAppointments((p) => p.map((a) => a._id === updated._id ? updated : a));
    setView("list");
  };

  const handleDeleted = (id) => {
    setAppointments((p) => p.filter((a) => a._id !== id));
    setView("list");
  };

  const handleBooked = (newAppt) => {
    setAppointments((p) => [newAppt, ...p]);
    setView("list");
  };

  const markNoShow = async (id) => {
    try {
      await axiosInstance.put(`/appointments/${id}`, {
        status: "No-show",
        cancellationReason: "No-show",
      });
      toast.success("Marked as no-show");
      fetchAppointments();
    } catch {
      toast.error("Failed to update appointment");
    }
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    if (appointments.length === 0) return;
    if (selectedIds.length === appointments.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(appointments.map((a) => a._id));
  };

  const runBulkStatusUpdate = async (status) => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one appointment first");
      return;
    }

    let cancellationReason = null;

    if (status === "No-show") {
      cancellationReason = "No-show";
    }

    if (status === "Cancelled") {
      cancellationReason = "Patient";
    }

    setBulkLoading(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          axiosInstance.put(`/appointments/${id}`, {
            status,
            cancellationReason,
          })
        )
      );
      toast.success(`Updated ${selectedIds.length} appointment(s)`);
      setSelectedIds([]);
      await fetchAppointments();
    } catch {
      toast.error("Bulk update failed");
    } finally {
      setBulkLoading(false);
    }
  };

  if (view === "book") return (
    <>
      <BookAppointmentForm
        onBack={() => setView("list")}
        onBooked={handleBooked}
        preSelectedPatient={preSelectedPatient}
        rescheduleCancelledAppointmentId={rescheduleCancelledAppointmentId}
        onEmergencyRescheduleComplete={onEmergencyRescheduleComplete}
      />
      <ConfirmDialog {...dialogProps} />
    </>
  );
  if (view === "detail" && activeAppointment) return (
    <>
      <AppointmentDetailPage
        appointment={activeAppointment}
        onBack={() => setView("list")}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
        confirmAction={confirm}
      />
      <ConfirmDialog {...dialogProps} />
    </>
  );

  return (
    <>
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Appointments</h2>
          <p className="text-sm font-medium mt-1 text-slate-600 dark:text-slate-400">{appointments.length} appointments</p>
        </div>
        <button onClick={() => setView("book")} type="button"
          className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm py-3 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 w-fit">
          + Book Appointment
        </button>
      </div>

      {/* Filters */}
      {/* Fix filter rows wrapping unpredictably on tablet by keeping the status chips on a horizontal scroller. */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Date filter first so native calendar popup has room on the right */}
        <div className="flex items-center gap-2">
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter by date"
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none" />
          {dateFilter && (
            <button type="button" onClick={() => setDateFilter("")}
              className="text-xs font-bold px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors">✕</button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {["All", ...STATUSES].map((s) => (
            <button key={s} type="button" onClick={() => setActiveFilter(s)}
              aria-pressed={activeFilter === s}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs transition-all ${
                activeFilter === s
                  ? "bg-teal-600 text-white font-bold shadow-sm border border-teal-600"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-500 font-semibold"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 p-3 rounded-xl flex flex-wrap items-center gap-2 bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
          <p className="text-xs font-bold text-slate-900 dark:text-white mr-1">
            {selectedIds.length} selected
          </p>
          {[
            { label: "Mark Confirmed", status: "Confirmed", cls: "bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-500/20 dark:text-teal-100 dark:border-teal-400/50" },
            { label: "Mark Completed", status: "Completed", cls: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-400/50" },
            { label: "Mark No-show", status: "No-show", cls: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/20 dark:text-rose-100 dark:border-rose-400/50" },
            { label: "Mark Cancelled", status: "Cancelled", cls: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/20 dark:text-rose-100 dark:border-rose-400/50" },
          ].map(({ label, status, cls }) => (
            <button
              key={status}
              type="button"
              onClick={() => runBulkStatusUpdate(status)}
              disabled={bulkLoading}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-60 ${cls}`}>
              {bulkLoading ? "Saving..." : label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            disabled={bulkLoading}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-teal-500 disabled:opacity-60">
            Clear
          </button>
        </div>
      )}

      {/* Appointments List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">

        {/* Desktop Header */}
        <div className="hidden sm:grid grid-cols-6 gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <input
              type="checkbox"
              aria-label="Select all appointments"
              className="w-4 h-4 accent-teal-600 cursor-pointer"
              checked={appointments.length > 0 && selectedIds.length === appointments.length}
              onChange={toggleSelectAllVisible}
            />
          </div>
          {["Patient", "Date & Time", "Type", "Status", "Action"].map((h) => (
            <p key={h} className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">{h}</p>
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
        ) : appointments.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📅</div>
            <p className="text-base font-bold text-slate-900 dark:text-white mb-1">No appointments found</p>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {activeFilter !== "All" || dateFilter ? "Try changing filters" : "Book your first appointment"}
            </p>
          </div>
        ) : (
          appointments.map((apt) => (
            <div key={apt._id}
              role="button"
              tabIndex={0}
              className="group cursor-pointer border-b border-slate-200 dark:border-slate-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500 transition-colors"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveAppointment(apt);
                  setView("detail");
                }
              }}
              onClick={() => { setActiveAppointment(apt); setView("detail"); }}>

              {/* Mobile */}
              <div className="sm:hidden flex items-center gap-3 p-4">
                <input
                  type="checkbox"
                  aria-label={`Select appointment for ${apt.patient?.name || "Unknown"}`}
                  className="w-4 h-4 accent-teal-600 cursor-pointer"
                  checked={selectedIds.includes(apt._id)}
                  onChange={() => toggleSelected(apt._id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <Avatar name={apt.patient?.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-slate-900 dark:text-white truncate">{apt.patient?.name || "Unknown"}</p>
                  <p className="text-xs mt-0.5 font-semibold text-slate-700 dark:text-slate-300">
                    {formatDate(apt.date)} at {apt.slot} · {apt.type}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={apt.status} />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); markNoShow(apt._id); }}
                      className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-50 dark:hover:bg-rose-500/15 px-2 py-1 rounded-lg">
                      No-show
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop */}
              <div className="hidden sm:grid grid-cols-6 gap-4 items-center p-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    aria-label={`Select appointment for ${apt.patient?.name || "Unknown"}`}
                    className="w-4 h-4 accent-teal-600 cursor-pointer"
                    checked={selectedIds.includes(apt._id)}
                    onChange={() => toggleSelected(apt._id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={apt.patient?.name} />
                  <span className="text-base font-bold text-slate-900 dark:text-white truncate">{apt.patient?.name || "Unknown"}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatDate(apt.date)}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{apt.slot}</p>
                </div>
                <div><TypeBadge type={apt.type} /></div>
                <div><StatusBadge status={apt.status} /></div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveAppointment(apt); setView("detail"); }}
                    className="text-sm text-teal-600 dark:text-teal-400 font-bold hover:underline">
                    View →
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); markNoShow(apt._id); }}
                    className="text-sm text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-50 dark:hover:bg-rose-500/15 px-2 py-1 rounded-lg transition-colors">
                    No-show
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
