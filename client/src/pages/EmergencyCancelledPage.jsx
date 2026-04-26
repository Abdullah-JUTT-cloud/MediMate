import { useEffect, useState } from "react";
import { RefreshCcw, Clock3, CalendarDays, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import ConfirmDialog from "../components/ConfirmDialog";
import useConfirmDialog from "../hooks/useConfirmDialog";

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatAppointmentTime = (date, slot) => {
  if (!date && !slot) return "—";
  const appointmentDate = date ? new Date(date) : null;
  const formattedDate = appointmentDate && !Number.isNaN(appointmentDate.getTime())
    ? appointmentDate.toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    : "—";
  return `${formattedDate} at ${slot || "—"}`;
};

export default function EmergencyCancelledPage({ onReschedule }) {
  const { confirm, dialogProps } = useConfirmDialog();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [emergencyStartDate, setEmergencyStartDate] = useState("");
  const [emergencyStartTime, setEmergencyStartTime] = useState("");
  const [emergencyEndDate, setEmergencyEndDate] = useState("");
  const [emergencyEndTime, setEmergencyEndTime] = useState("");

  const clearForm = () => {
    setEmergencyStartDate("");
    setEmergencyStartTime("");
    setEmergencyEndDate("");
    setEmergencyEndTime("");
  };

  const fetchCancelledAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get("/appointments?status=Cancelled&limit=500");
      const emergency = Array.isArray(res.data?.appointments)
        ? res.data.appointments.filter((appointment) => appointment.emergencyCancelled === true)
        : [];
      setAppointments(emergency);
    } catch {
      setAppointments([]);
      toast.error("Failed to load emergency cancellations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCancelledAppointments();
  }, []);

  const handleEmergencyCancel = async () => {
    if (!emergencyStartDate || !emergencyStartTime || !emergencyEndDate || !emergencyEndTime) {
      toast.error("Select start/end date and time");
      return;
    }

    const startDateTime = new Date(`${emergencyStartDate}T${emergencyStartTime}:00`);
    const endDateTime = new Date(`${emergencyEndDate}T${emergencyEndTime}:00`);
    if (startDateTime > endDateTime) {
      toast.error("Start date/time must be before end date/time");
      return;
    }

    const confirmed = await confirm({
      title: "Emergency Cancel",
      message: `Cancel all appointments from ${emergencyStartDate} ${emergencyStartTime} to ${emergencyEndDate} ${emergencyEndTime}?`,
      confirmText: "Yes, Cancel All",
      cancelText: "Keep Appointments",
      tone: "danger",
    });
    if (!confirmed) return;

    setIsCancelling(true);
    try {
      const res = await axiosInstance.post("/appointments/emergency-cancel", {
        startDate: emergencyStartDate,
        startTime: emergencyStartTime,
        endDate: emergencyEndDate,
        endTime: emergencyEndTime,
      });
      const cancelled = Array.isArray(res.data?.cancelledAppointments) ? res.data.cancelledAppointments : [];
      toast.success(`${cancelled.length} appointments cancelled`);
      setAppointments((prev) => [...cancelled, ...prev]);
      clearForm();
    } catch {
      toast.error("Failed to cancel appointments");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="rounded-4xl border border-(--color-border)/80 bg-(--color-card)/95 p-4 sm:p-6 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)]">
      <div className="flex flex-col gap-2 border-b border-(--color-border)/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-(--color-text-primary) sm:text-xl">🚨 Emergency Cancelled Appointments</h2>
          <p className="mt-1 text-sm text-(--color-text-secondary)">
            Cancel appointments in a time range and track the patients that need rescheduling.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-(--color-danger)/25 bg-(--color-danger)/10 px-3 py-1.5 text-xs font-semibold text-(--color-danger)">
          <Clock3 size={14} />
          {appointments.length} pending reschedules
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-[rgba(168,84,72,0.2)] bg-[rgba(168,84,72,0.06)] p-4 sm:p-5">
        <p className="mb-4 text-sm font-bold text-(--color-danger)">🚨 Emergency Cancel Appointments</p>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--color-text-secondary)">Start Date & Time</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={emergencyStartDate}
                onChange={(e) => setEmergencyStartDate(e.target.value)}
                className="w-full rounded-full border border-(--color-danger)/35 bg-(--color-card)/90 px-4 py-3 text-sm text-(--color-text-primary) outline-none focus-visible:ring-2 focus-visible:ring-(--color-danger)/25"
              />
              <input
                type="time"
                value={emergencyStartTime}
                onChange={(e) => setEmergencyStartTime(e.target.value)}
                className="w-full rounded-full border border-(--color-danger)/35 bg-(--color-card)/90 px-4 py-3 text-sm text-(--color-text-primary) outline-none focus-visible:ring-2 focus-visible:ring-(--color-danger)/25"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--color-text-secondary)">End Date & Time</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={emergencyEndDate}
                onChange={(e) => setEmergencyEndDate(e.target.value)}
                className="w-full rounded-full border border-(--color-danger)/35 bg-(--color-card)/90 px-4 py-3 text-sm text-(--color-text-primary) outline-none focus-visible:ring-2 focus-visible:ring-(--color-danger)/25"
              />
              <input
                type="time"
                value={emergencyEndTime}
                onChange={(e) => setEmergencyEndTime(e.target.value)}
                className="w-full rounded-full border border-(--color-danger)/35 bg-(--color-card)/90 px-4 py-3 text-sm text-(--color-text-primary) outline-none focus-visible:ring-2 focus-visible:ring-(--color-danger)/25"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleEmergencyCancel}
            disabled={isCancelling}
            className="rounded-full px-5 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-50"
            style={{ background: "color-mix(in srgb, var(--color-danger) 15%, transparent)", border: "1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)", color: "var(--color-danger)" }}
          >
            {isCancelling ? "Cancelling..." : "Cancel All Appointments"}
          </button>
          <button
            onClick={clearForm}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-(--color-text-secondary) transition-all hover:opacity-80"
            style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <div className="rounded-3xl border border-dashed border-(--color-border) px-4 py-10 text-center text-sm text-(--color-text-secondary)">
            Loading emergency cancellations...
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-(--color-border) px-4 py-10 text-center text-sm text-(--color-text-secondary)">
            No emergency-cancelled appointments found.
          </div>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment._id}
              className="flex flex-col gap-4 rounded-3xl border border-[rgba(168,84,72,0.18)] bg-[rgba(168,84,72,0.05)] p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-danger),color-mix(in_srgb,var(--color-danger)_82%,black))] text-sm font-bold text-white">
                  <UserRound size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-(--color-text-primary)">
                      {appointment.patient?.name || "Unknown patient"}
                    </p>
                    <span className="rounded-full border border-(--color-danger)/20 bg-(--color-danger)/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-(--color-danger)">
                      Emergency
                    </span>
                  </div>
                  <div className="mt-2 grid gap-2 text-xs text-(--color-text-secondary) sm:grid-cols-2 lg:grid-cols-4">
                    <p className="inline-flex items-center gap-2">
                      <CalendarDays size={13} />
                      {formatAppointmentTime(appointment.date, appointment.slot)}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <Clock3 size={13} />
                      Cancelled: {formatDateTime(appointment.cancelledAt || appointment.updatedAt)}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <RefreshCcw size={13} />
                      {appointment.type || "Appointment"}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      Status: {appointment.status || "Cancelled"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => onReschedule?.(appointment)}
                  className="rounded-full border border-(--color-primary)/25 bg-(--color-primary)/10 px-4 py-2 text-xs font-bold text-(--color-primary) transition hover:-translate-y-0.5 hover:opacity-95"
                >
                  Reschedule
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
