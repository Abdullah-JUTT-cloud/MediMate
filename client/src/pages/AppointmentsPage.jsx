import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useAuthStore from "../store/authStore";
import { RowSkeleton, AppointmentRowSkeleton, FormFieldSkeleton } from "../components/SkeletonLoaders";
import { Skeleton } from "@mui/material";

// ─── Constants ────────────────────────────────────────────────────────────────

const APPOINTMENT_TYPES = ["Consultation", "Follow-up", "Check-up", "Emergency"];
const STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];

const STATUS_STYLES = {
  Pending:   { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)",  color: "#f59e0b" },
  Confirmed: { bg: "color-mix(in srgb, var(--color-primary) 12%, transparent)",  border: "color-mix(in srgb, var(--color-primary) 24%, transparent)",  color: "var(--color-primary)" },
  Completed: { bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.2)",   color: "#22c55e" },
  Cancelled: { bg: "color-mix(in srgb, var(--color-danger) 12%, transparent)",   border: "color-mix(in srgb, var(--color-danger) 24%, transparent)",   color: "var(--color-danger)" },
};

const TYPE_ICONS = {
  Consultation: "🩺", "Follow-up": "🔄", "Check-up": "📋", Emergency: "🚨",
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
  input: { background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" },
  card:  { background: "var(--color-card)", border: "1px solid var(--color-border)" },
  section: { background: "var(--color-bg)", border: "1px solid var(--color-border)" },
};

const focusInput = (e) => (e.target.style.border = "1px solid var(--color-primary)");
const blurInput  = (e) => (e.target.style.border = "1px solid var(--color-border)");
const inputCls   = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all";

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

function AppointmentDetailPage({ appointment, onBack, onUpdated, onDeleted }) {
  const [status, setStatus] = useState(appointment.status);
  const [notes, setNotes] = useState(appointment.notes || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.put(`/appointments/${appointment._id}`, { status, notes });
      toast.success("Appointment updated");
      onUpdated(res.data.appointment);
    } catch {
      toast.error("Failed to update");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this appointment?")) return;
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
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)" }}>
            {TYPE_ICONS[appointment.type] || "🩺"}
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
            className="px-4 py-3 rounded-xl text-sm font-bold transition-all hover:bg-red-500 hover:bg-opacity-10"
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
        const res = await axiosInstance.get("/patients", { params: { search } });
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
        const res = await axiosInstance.get(`/appointments?date=${date}`);
        setBookedSlots(
          res.data.appointments
            .filter((a) => !["Cancelled", "Completed"].includes(a.status))
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
        date, slot: selectedSlot, type, notes,
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
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-secondary)]">🔍</span>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setSelectedPatient(null); }}
              placeholder="Search patient by name or phone..."
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
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
                      style={{ background: loc.locationType === "Clinic" ? "color-mix(in srgb, var(--color-primary) 12%, transparent)" : "rgba(56,189,248,0.1)", color: loc.locationType === "Clinic" ? "var(--color-primary)" : "#38bdf8" }}>
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
        <div className="rounded-2xl p-5" style={S.card}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <SectionLabel text="Date" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                min={formatDateInput(new Date())}
                className={inputCls} style={{ ...S.input, colorScheme: "auto" }}
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
                    <span>{TYPE_ICONS[t]}</span> {t}
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
                  return (
                    <button key={slot.time} onClick={() => setSelectedSlot(slot.time)}
                      className="relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: isSelected ? "color-mix(in srgb, var(--color-primary) 15%, transparent)" : "var(--color-bg)",
                        border: isSelected ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                        color: isSelected ? "var(--color-primary)" : "var(--color-text-primary)",
                      }}>
                      {slot.time}
                      {bookingCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                          style={{ background: "#f59e0b", color: "white", fontSize: "9px" }}>
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
        <div className="rounded-2xl p-5" style={S.card}>
          <SectionLabel text="Notes (optional)" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this appointment..."
            rows={3} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
            style={S.input} onFocus={focusInput} onBlur={blurInput} />
        </div>

        <button onClick={handleSubmit} disabled={isLoading}
          className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ background: "linear-gradient(135deg,var(--color-primary),color-mix(in srgb, var(--color-primary) 80%, black))", boxShadow: "0 4px 20px color-mix(in srgb, var(--color-primary) 30%, transparent)" }}>
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
  const [view, setView] = useState("list");
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [preSelectedPatient, setPreSelectedPatient] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = "/appointments?";
      if (dateFilter) url += `date=${dateFilter}&`;
      if (activeFilter !== "All") url += `status=${activeFilter}`;
      const res = await axiosInstance.get(url);
      setAppointments(res.data.appointments);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, dateFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

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

  if (view === "book") return (
    <BookAppointmentForm
      onBack={() => setView("list")}
      onBooked={handleBooked}
      preSelectedPatient={preSelectedPatient}
      rescheduleCancelledAppointmentId={rescheduleCancelledAppointmentId}
      onEmergencyRescheduleComplete={onEmergencyRescheduleComplete}
    />
  );
  if (view === "detail" && activeAppointment) return (
    <AppointmentDetailPage
      appointment={activeAppointment}
      onBack={() => setView("list")}
      onUpdated={handleUpdated}
      onDeleted={handleDeleted}
    />
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Appointments</h2>
          <p className="text-xs mt-0.5 text-[var(--color-text-secondary)]">{appointments.length} appointments</p>
        </div>
        <button onClick={() => setView("book")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 hover:opacity-90 w-fit"
          style={{ background: "linear-gradient(135deg,var(--color-primary),color-mix(in srgb, var(--color-primary) 80%, black))", boxShadow: "0 4px 15px color-mix(in srgb, var(--color-primary) 25%, transparent)" }}>
          + Book Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Status filters */}
        <div className="flex gap-1.5 flex-wrap">
          {["All", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setActiveFilter(s)}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: activeFilter === s ? "color-mix(in srgb, var(--color-primary) 15%, transparent)" : "var(--color-bg)",
                border: activeFilter === s ? "1px solid color-mix(in srgb, var(--color-primary) 35%, transparent)" : "1px solid var(--color-border)",
                color: activeFilter === s ? "var(--color-primary)" : "var(--color-text-secondary)",
              }}>
              {s}
            </button>
          ))}
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-2 ml-auto">
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs outline-none transition-all"
            style={{ ...S.input, colorScheme: "auto" }}
            onFocus={focusInput} onBlur={blurInput} />
          {dateFilter && (
            <button onClick={() => setDateFilter("")}
              className="text-xs px-2 py-2 rounded-xl transition-all hover:bg-[var(--color-bg)] text-[var(--color-text-secondary)]">✕</button>
          )}
        </div>
      </div>

      {/* Appointments List */}
      <div className="rounded-2xl overflow-hidden" style={S.card}>

        {/* Desktop Header */}
        <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-3"
          style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
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
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)" }}>
                  {TYPE_ICONS[apt.type] || "🩺"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{apt.patient?.name || "Unknown"}</p>
                  <p className="text-xs mt-0.5 text-[var(--color-text-secondary)]">
                    {formatDate(apt.date)} at {apt.slot} · {apt.type}
                  </p>
                </div>
                <StatusBadge status={apt.status} />
              </div>

              {/* Desktop */}
              <div className="hidden sm:grid grid-cols-5 gap-4 items-center px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0"
                    style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)" }}>
                    {TYPE_ICONS[apt.type] || "🩺"}
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
                  <button
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all opacity-0 group-hover:opacity-100"
                    style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)", color: "var(--color-primary)" }}>
                    View →
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
