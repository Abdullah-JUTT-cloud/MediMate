import { useState, useEffect, useRef, useCallback } from "react";
import { CalendarDays, ClipboardCheck, RefreshCcw, Search, Siren, Stethoscope, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useAuthStore from "../store/authStore";
import { RowSkeleton, AppointmentRowSkeleton, FormFieldSkeleton } from "../components/SkeletonLoaders";
import { Skeleton } from "@mui/material";
import ConfirmDialog from "../components/ConfirmDialog";
import useConfirmDialog from "../hooks/useConfirmDialog";
import { organicCardStyle, organicInputStyle, organicSectionStyle, organicTheme } from "../styles/organicTheme";

// ─── Constants ────────────────────────────────────────────────────────────────

const APPOINTMENT_TYPES = ["Consultation", "Follow-up", "Check-up", "Emergency"];
const STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled", "No-show"];
const CANCELLATION_REASONS = ["Patient", "Doctor", "Emergency", "No-show"];

const STATUS_STYLES = {
  Pending: { bg: "rgba(193,140,93,0.12)", border: "rgba(193,140,93,0.28)", color: "var(--color-secondary)" },
  Confirmed: {
    bg: "rgba(93,112,82,0.12)",
    border: "rgba(93,112,82,0.28)",
    color: "var(--color-primary)",
  },
  Completed: { bg: "rgba(93,112,82,0.16)", border: "rgba(93,112,82,0.34)", color: "var(--color-primary)" },
  Cancelled: { bg: "rgba(168,84,72,0.12)", border: "rgba(168,84,72,0.28)", color: "var(--color-danger)" },
  "No-show": { bg: "rgba(168,84,72,0.15)", border: "rgba(168,84,72,0.34)", color: "var(--color-danger)" },
};

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

// ─── Shared Styles ────────────────────────────────────────────────────────────

const S = {
  input: organicInputStyle,
  card: organicCardStyle,
  section: organicSectionStyle,
};

const focusInput = (e) => (e.target.style.border = `1px solid ${organicTheme.colors.primary}`);
const blurInput = (e) => (e.target.style.border = `1px solid ${organicTheme.colors.border}`);
const inputCls = "w-full px-4 py-3 rounded-full text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--color-primary)]/30";

const TypeIcon = ({ type, size = 18 }) => {
  const Icon = TYPE_ICONS[type] || Stethoscope;
  return <Icon size={size} strokeWidth={2} />;
};

function BackButton({ onClick, label = "Back" }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 text-sm font-semibold transition-all hover:opacity-80 mb-6"
      style={{ color: organicTheme.colors.primary }}>
      ← {label}
    </button>
  );
}

function SectionLabel({ text }) {
  return <p className="text-xs font-bold uppercase tracking-widest mb-3 text-[var(--color-text-secondary)]">{text}</p>;
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Pending;
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {status}
    </span>
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
    <div className="max-w-2xl mx-auto px-1">
      <BackButton onClick={onBack} label="Back to Appointments" />

      {/* Header Card */}
      <div className="rounded-2xl p-5 sm:p-6 mb-5" style={S.card}>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(93,112,82,0.12)", color: organicTheme.colors.primary }}>
            <TypeIcon type={appointment.type} size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{patient?.name || "Unknown Patient"}</h2>
            <p className="text-sm mt-0.5 text-[var(--color-text-secondary)]">
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
            <div key={label} className="p-3 rounded-xl" style={S.section}>
              <p className="text-xs mb-1 text-[var(--color-text-secondary)]">{label}</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Update Status */}
      <div className="rounded-2xl p-5 mb-4" style={S.card}>
        <SectionLabel text="Update Status" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          {STATUSES.map((s) => {
            const style = STATUS_STYLES[s];
            return (
              <button key={s} onClick={() => setStatus(s)}
                className="py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: status === s ? style.bg : "var(--color-bg)",
                  border: status === s ? `1px solid ${style.border}` : "1px solid var(--color-border)",
                  color: status === s ? style.color : "var(--color-text-secondary)",
                }}>
                {s}
              </button>
            );
          })}
        </div>

        {(status === "Cancelled" || status === "No-show") && (
          <>
            <SectionLabel text="Cancellation Reason" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {CANCELLATION_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setCancellationReason(r)}
                  className="py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background:
                      cancellationReason === r
                        ? "color-mix(in srgb, var(--color-danger) 12%, transparent)"
                        : "var(--color-bg)",
                    border:
                      cancellationReason === r
                        ? "1px solid color-mix(in srgb, var(--color-danger) 35%, transparent)"
                        : "1px solid var(--color-border)",
                    color:
                      cancellationReason === r
                        ? "var(--color-danger)"
                        : "var(--color-text-secondary)",
                  }}
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
          rows={3} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all mb-4"
          style={S.input} onFocus={focusInput} onBlur={blurInput} />

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={isLoading}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,var(--color-primary),color-mix(in srgb, var(--color-primary) 80%, black))", boxShadow: "0 4px 15px color-mix(in srgb, var(--color-primary) 25%, transparent)" }}>
            {isLoading ? "Saving..." : "Save Changes ✓"}
          </button>
          <button onClick={handleDelete} disabled={isLoading}
            className="px-4 py-3 rounded-xl text-sm font-bold transition-all hover-danger-soft"
            style={{ color: "var(--color-danger)", border: "1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)" }}>
            🗑 Delete
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
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isHydratingSelectedPatient, setIsHydratingSelectedPatient] = useState(false);
  const hasShownMissingScheduleToast = useRef(false);

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
      setBookedSlots([]);
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

    // Fetch already booked slots for this date
    const fetchBooked = async () => {
      try {
        const params = new URLSearchParams({ date, limit: "500" });
        const res = await axiosInstance.get(`/appointments?${params.toString()}`);
        setBookedSlots(
          res.data.appointments
            .filter((a) => !["Cancelled", "No-show", "Completed"].includes(a.status))
            .map((a) => a.slot)
        );
      } catch {
        setBookedSlots([]);
      }
    };
    fetchBooked();
  }, [date, selectedPatient, doctor, isHydratingSelectedPatient]);

  const handleSubmit = async () => {
    if (!selectedPatient) { toast.error("Select a patient"); return; }
    if (!date) { toast.error("Select a date"); return; }
    if (!selectedSlot) { toast.error("Select a time slot"); return; }
    if (!type) { toast.error("Select appointment type"); return; }

    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/appointments", {
        patientId: selectedPatient._id,
        date,
        slot: selectedSlot,
        type,
        notes,
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

  const getInitials = (name) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "P";

  return (
    <div className="max-w-2xl mx-auto px-1">
      <BackButton onClick={onBack} label="Back to Appointments" />

      <div className="space-y-4">

        {/* Patient Search */}
        <div className="rounded-2xl p-5" style={S.card}>
          <SectionLabel text="Select Patient" />
          <div className="relative mb-3">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: organicTheme.colors.mutedForeground }}>
              <Search size={16} />
            </span>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setSelectedPatient(null); }}
              placeholder="Search patient by name or phone..."
              className="w-full pl-10 pr-4 py-3 rounded-full text-sm outline-none transition-all"
              style={S.input} onFocus={focusInput} onBlur={blurInput} />
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
                <button key={p._id} onClick={() => { setSelectedPatient(p); setSearch(p.name); setPatients([]); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={S.section}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--color-primary) 8%, var(--color-bg))")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = S.section.background)}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg,var(--color-primary),color-mix(in srgb, var(--color-primary) 80%, black))" }}>
                    {getInitials(p.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{p.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{p.age} yrs · {p.phone}</p>
                  </div>
                  {p.locations?.map((loc, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full hidden sm:block"
                      style={{ background: loc.locationType === "Clinic" ? "rgba(93,112,82,0.12)" : "rgba(193,140,93,0.14)", color: loc.locationType === "Clinic" ? organicTheme.colors.primary : organicTheme.colors.secondary }}>
                      {loc.locationType === "Clinic" ? "🏥" : "🏨"} {loc.locationName}
                    </span>
                  ))}
                </button>
              ))}
            </div>
          )}

          {selectedPatient && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "color-mix(in srgb, var(--color-primary) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--color-primary) 22%, transparent)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg,var(--color-primary),color-mix(in srgb, var(--color-primary) 80%, black))" }}>
                {getInitials(selectedPatient.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{selectedPatient.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{selectedPatient.age} yrs · {selectedPatient.phone}</p>
              </div>
              <button onClick={() => { setSelectedPatient(null); setSearch(""); setSlots([]); }}
                className="text-xs px-2 py-1 rounded-lg text-[var(--color-text-secondary)]">✕</button>
            </div>
          )}
        </div>

        {/* Date + Type */}
        <div className="rounded-[2rem] p-5" style={S.card}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <SectionLabel text="Date" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                min={formatDateInput(new Date())}
                className={inputCls} style={{ ...S.input, colorScheme: "light" }}
                onFocus={focusInput} onBlur={blurInput} />
            </div>
            <div>
              <SectionLabel text="Appointment Type" />
              <div className="grid grid-cols-2 gap-2">
                {APPOINTMENT_TYPES.map((t) => (
                  <button key={t} onClick={() => setType(t)}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                    style={{
                      background: type === t ? "color-mix(in srgb, var(--color-primary) 15%, transparent)" : "var(--color-bg)",
                      border: type === t ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                      color: type === t ? "var(--color-primary)" : "var(--color-text-secondary)",
                    }}>
                    <TypeIcon type={t} size={14} /> {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Slots */}
        {selectedPatient && date && (
          <div className="rounded-2xl p-5" style={S.card}>
            <SectionLabel text={`Available Slots — ${getDayName(date)}, ${formatDate(date)}`} />
            {isHydratingSelectedPatient ? (
              <div className="text-center py-8 rounded-xl" style={S.section}>
                <div className="text-3xl mb-2">⏳</div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Loading patient schedule...</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Fetching complete location details to calculate slots
                </p>
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-8 rounded-xl" style={S.section}>
                <div className="text-3xl mb-2">📅</div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">No slots available</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {selectedPatient.name} has no sessions on {getDayName(date)}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => {
                  const bookingCount = bookedSlots.filter((b) => b === slot.time).length;
                  const isSelected = selectedSlot === slot.time;
                  const isFull = bookingCount >= 3;
                  return (
                    <button key={slot.time} onClick={() => setSelectedSlot(slot.time)}
                      disabled={isFull}
                      className="relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: isFull
                          ? "color-mix(in srgb, var(--color-danger) 12%, transparent)"
                          : isSelected
                            ? "color-mix(in srgb, var(--color-primary) 15%, transparent)"
                            : "var(--color-bg)",
                        border: isFull
                          ? "1px solid color-mix(in srgb, var(--color-danger) 35%, transparent)"
                          : isSelected
                            ? "1px solid var(--color-primary)"
                            : "1px solid var(--color-border)",
                        color: isFull ? "var(--color-danger)" : isSelected ? "var(--color-primary)" : "var(--color-text-primary)",
                        opacity: isFull ? 0.85 : 1,
                        cursor: isFull ? "not-allowed" : "pointer",
                      }}>
                      {slot.time}
                      {bookingCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                          style={{ background: bookingCount >= 3 ? "var(--color-danger)" : "var(--color-warning)", color: "var(--color-on-primary)", fontSize: "9px" }}>
                          {bookingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {slots.length > 0 && (
              <p className="text-xs mt-3 text-[var(--color-text-secondary)]">
                🟡 Number on slot = existing bookings for that time
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="rounded-[2rem] p-5" style={S.card}>
          <SectionLabel text="Notes (optional)" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this appointment..."
            rows={3} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
            style={S.input} onFocus={focusInput} onBlur={blurInput} />
        </div>

        <button onClick={handleSubmit} disabled={isLoading}
          className="w-full py-4 rounded-full text-sm font-bold text-white transition-all hover:opacity-95 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ background: organicTheme.colors.primary, boxShadow: organicTheme.shadows.button }}>
          {isLoading ? "Booking..." : "Book Appointment ✓"}
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
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Fraunces" }}>Appointments</h2>
          <p className="text-sm mt-1 text-[var(--color-text-secondary)]">{appointments.length} appointments</p>
        </div>
        <button onClick={() => setView("book")}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 hover:opacity-95 w-fit"
          style={{ background: organicTheme.colors.primary, boxShadow: organicTheme.shadows.button }}>
          + Book Appointment
        </button>
      </div>

      {/* Filters */}
      {/* Fix filter rows wrapping unpredictably on tablet by keeping the status chips on a horizontal scroller. */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Date filter first so native calendar popup has room on the right */}
        <div className="flex items-center gap-2">
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2.5 rounded-full text-xs outline-none transition-all"
            style={{ ...S.input, colorScheme: "light" }}
            onFocus={focusInput} onBlur={blurInput} />
          {dateFilter && (
            <button onClick={() => setDateFilter("")}
              className="text-xs px-3 py-2 rounded-full transition-all text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-soft)] active:scale-[0.99]">✕</button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {["All", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setActiveFilter(s)}
              aria-pressed={activeFilter === s}
              className="shrink-0 px-3 py-2 rounded-full text-xs font-semibold transition-all"
              style={{
                background: activeFilter === s ? "rgba(93,112,82,0.14)" : "color-mix(in srgb, var(--color-bg-soft) 46%, transparent)",
                border: activeFilter === s ? "1px solid rgba(93,112,82,0.35)" : "1px solid color-mix(in srgb, var(--color-border) 80%, transparent)",
                color: activeFilter === s ? organicTheme.colors.primary : organicTheme.colors.mutedForeground,
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 p-3 rounded-xl flex flex-wrap items-center gap-2"
          style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)" }}>
          <p className="text-xs font-semibold text-[var(--color-text-primary)]">
            {selectedIds.length} selected
          </p>
          <button
            onClick={() => runBulkStatusUpdate("Confirmed")}
            disabled={bulkLoading}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "rgba(16,184,129,0.14)", color: "var(--color-success)", border: "1px solid rgba(16,184,129,0.35)" }}>
            {bulkLoading ? "Saving..." : "Mark Confirmed"}
          </button>
          <button
            onClick={() => runBulkStatusUpdate("Completed")}
            disabled={bulkLoading}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "rgba(34,197,94,0.14)", color: "var(--color-success)", border: "1px solid rgba(34,197,94,0.35)" }}>
            {bulkLoading ? "Saving..." : "Mark Completed"}
          </button>
          <button
            onClick={() => runBulkStatusUpdate("No-show")}
            disabled={bulkLoading}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "rgba(239,68,68,0.14)", color: "var(--color-danger)", border: "1px solid rgba(239,68,68,0.35)" }}>
            {bulkLoading ? "Saving..." : "Mark No-show"}
          </button>
          <button
            onClick={() => runBulkStatusUpdate("Cancelled")}
            disabled={bulkLoading}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "color-mix(in srgb, var(--color-danger) 14%, transparent)", color: "var(--color-danger)", border: "1px solid color-mix(in srgb, var(--color-danger) 35%, transparent)" }}>
            {bulkLoading ? "Saving..." : "Mark Cancelled"}
          </button>
          <button
            onClick={() => setSelectedIds([])}
            disabled={bulkLoading}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "var(--color-bg)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
            Clear
          </button>
        </div>
      )}

      {/* Appointments List */}
      <div className="rounded-2xl overflow-hidden" style={S.card}>

        {/* Desktop Header */}
        <div className="hidden sm:grid grid-cols-6 gap-4 px-5 py-3"
          style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={appointments.length > 0 && selectedIds.length === appointments.length}
              onChange={toggleSelectAllVisible}
            />
          </div>
          {["Patient", "Date & Time", "Type", "Status", "Action"].map((h) => (
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
        ) : appointments.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📅</div>
            <p className="text-sm font-bold text-[var(--color-text-primary)] mb-1">No appointments found</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {activeFilter !== "All" || dateFilter ? "Try changing filters" : "Book your first appointment"}
            </p>
          </div>
        ) : (
          appointments.map((apt) => (
            <div key={apt._id}
              className="group cursor-pointer transition-all duration-200"
              style={{ borderBottom: "1px solid var(--color-border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--color-primary) 6%, transparent)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              onClick={() => { setActiveAppointment(apt); setView("detail"); }}>

              {/* Mobile */}
              <div className="sm:hidden flex items-center gap-3 px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(apt._id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSelected(apt._id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(93,112,82,0.12)", color: organicTheme.colors.primary }}>
                  <TypeIcon type={apt.type} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{apt.patient?.name || "Unknown"}</p>
                  <p className="text-xs mt-0.5 text-[var(--color-text-secondary)]">
                    {formatDate(apt.date)} at {apt.slot} · {apt.type}
                  </p>
                </div>
                <StatusBadge status={apt.status} />
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await axiosInstance.put(`/appointments/${apt._id}`, {
                        status: "No-show",
                        cancellationReason: "No-show",
                      });
                      toast.success("Marked as no-show");
                      fetchAppointments();
                    } catch {
                      toast.error("Failed to update appointment");
                    }
                  }}
                  className="text-[10px] px-2 py-1 rounded-lg font-semibold"
                  style={{ background: "rgba(239,68,68,0.14)", color: "var(--color-danger)", border: "1px solid rgba(239,68,68,0.35)" }}>
                  No-show
                </button>
              </div>

              {/* Desktop */}
              <div className="hidden sm:grid grid-cols-6 gap-4 items-center px-5 py-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(apt._id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelected(apt._id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-sm shrink-0"
                    style={{ background: "rgba(93,112,82,0.12)", color: organicTheme.colors.primary }}>
                    <TypeIcon type={apt.type} size={16} />
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{apt.patient?.name || "Unknown"}</span>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-primary)]">{formatDate(apt.date)}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{apt.slot}</p>
                </div>
                <span className="text-sm text-[var(--color-text-secondary)]">{apt.type}</span>
                <StatusBadge status={apt.status} />
                <div className="flex items-center">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await axiosInstance.put(`/appointments/${apt._id}`, {
                            status: "No-show",
                            cancellationReason: "No-show",
                          });
                          toast.success("Marked as no-show");
                          fetchAppointments();
                        } catch {
                          toast.error("Failed to update appointment");
                        }
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                      style={{ background: "rgba(239,68,68,0.14)", color: "var(--color-danger)", border: "1px solid rgba(239,68,68,0.35)" }}>
                      No-show
                    </button>
                    <button
                      className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                      style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)", color: "var(--color-primary)", border: "1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)" }}>
                      View →
                    </button>
                  </div>
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
