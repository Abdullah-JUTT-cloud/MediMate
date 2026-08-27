import { useEffect, useState } from "react";
import {
  CalendarClock,
  CalendarX2,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  MessageSquareOff,
  RefreshCcw,
  ShieldCheck,
  Siren,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import ConfirmDialog from "../components/ConfirmDialog";
import useConfirmDialog from "../hooks/useConfirmDialog";

/**
 * Emergency Cancelled Appointments — clinical safety control panel.
 *
 * Pure Tailwind palette tokens (slate neutrals, rose for the destructive
 * control surface, teal for recovery actions) with explicit `dark:`
 * counterparts, so both themes stay above WCAG AA contrast. No inline
 * `style` objects and no opacity-diluted text.
 */

const TABLE_COLUMNS = [
  "Patient",
  "Original Slot",
  "Cancelled On",
  "Reason",
  "WhatsApp Alert Status",
  "Action",
];

const SKELETON_ROWS = [0, 1, 2, 3];

// ─── Formatting helpers ──────────────────────────────────────────────────────

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

const formatShortDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ─── Status tokens ───────────────────────────────────────────────────────────

/**
 * WhatsApp alert state is derived from the appointment record: the bulk
 * cancel write sets `reminderSent: true` when the alert is dispatched, and a
 * patient without a phone number can never be reached.
 */
const WHATSAPP_ALERT_STATE = {
  sent: {
    label: "Alert sent",
    Icon: CircleCheck,
    hint: "Cancellation alert dispatched to this patient's WhatsApp number.",
    className:
      "inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  pending: {
    label: "Not dispatched",
    Icon: CircleAlert,
    hint: "No dispatch confirmation on this record — resend before rescheduling.",
    className:
      "inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
  },
  unreachable: {
    label: "No WhatsApp number",
    Icon: MessageSquareOff,
    hint: "This patient has no WhatsApp number — call them before rescheduling.",
    className:
      "inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300",
  },
};

const getWhatsAppAlertState = (appointment) => {
  if (!String(appointment?.patient?.phone || "").trim()) return "unreachable";
  return appointment?.reminderSent ? "sent" : "pending";
};

const getReasonLabel = (appointment) =>
  appointment?.cancellationReason || "Emergency";

const REASON_CLASS = {
  emergency:
    "inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300",
  other:
    "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

// ─── Sub components ──────────────────────────────────────────────────────────

const DateTimeField = ({ id, label, type, value, onChange }) => (
  <div>
    <label
      htmlFor={id}
      className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 block"
    >
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value ?? ""}
      onChange={onChange}
      className="emergency-native-picker bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl p-3 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none w-full shadow-xs [color-scheme:light] dark:[color-scheme:dark]"
    />
  </div>
);

const RescheduleButton = ({ appointment, onReschedule, className = "" }) => (
  <button
    type="button"
    onClick={() => onReschedule?.(appointment)}
    className={`text-teal-700 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${className}`.trim()}
  >
    <RefreshCcw size={14} aria-hidden="true" />
    Reschedule Slot
  </button>
);

const WhatsAppAlertBadge = ({ appointment }) => {
  const state = WHATSAPP_ALERT_STATE[getWhatsAppAlertState(appointment)];
  const { Icon, label, hint, className } = state;
  return (
    <span className={className} title={hint}>
      <Icon size={14} aria-hidden="true" />
      {label}
    </span>
  );
};

const ReasonBadge = ({ appointment }) => {
  const reason = getReasonLabel(appointment);
  const isEmergency = reason === "Emergency";
  return (
    <span
      className={isEmergency ? REASON_CLASS.emergency : REASON_CLASS.other}
      title={`Cancellation reason: ${reason}`}
    >
      {isEmergency ? <Siren size={14} aria-hidden="true" /> : null}
      {reason}
    </span>
  );
};

const CounterBadge = ({ isLoading, count }) => {
  if (isLoading) {
    return (
      <div className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2">
        <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
        Checking records
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-semibold px-4 py-2 rounded-xl text-xs">
        0 active reschedules
      </div>
    );
  }

  return (
    <div className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xs">
      <Siren size={14} aria-hidden="true" />
      <span className="tabular-nums">{count}</span> active reschedules
    </div>
  );
};

const DirectorySkeleton = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
    <div className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 p-4">
      <div className="h-3 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
    </div>
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {SKELETON_ROWS.map((row) => (
        <li key={row} className="flex items-center gap-4 p-4">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="w-full space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-1/5 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="hidden h-6 w-28 shrink-0 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 sm:block" />
        </li>
      ))}
    </ul>
  </div>
);

const DirectoryEmptyState = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
    <ShieldCheck className="h-12 w-12 text-slate-400 mx-auto mb-3" aria-hidden="true" />
    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
      No emergency cancellations on record
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
      Every booked slot is intact. Use the control above to cancel a full time
      window — patients are alerted on WhatsApp and land here until each one is
      rescheduled.
    </p>
  </div>
);

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EmergencyCancelledPage({ onReschedule }) {
  const { confirm, dialogProps } = useConfirmDialog();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleClearInputs = () => {
    setStartDate("");
    setEndDate("");
    setStartTime("");
    setEndTime("");
  };

  // `isLoading` starts true, so the effect only has to resolve the request —
  // no synchronous setState on mount, and no writes after unmount.
  useEffect(() => {
    let cancelled = false;

    const loadCancelledAppointments = async () => {
      try {
        const res = await axiosInstance.get("/appointments?status=Cancelled&limit=500");
        const emergency = Array.isArray(res.data?.appointments)
          ? res.data.appointments.filter((appointment) => appointment.emergencyCancelled === true)
          : [];
        if (!cancelled) setAppointments(emergency);
      } catch {
        if (cancelled) return;
        setAppointments([]);
        toast.error("Failed to load emergency cancellations");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadCancelledAppointments();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleBulkCancellation = async () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      toast.error("Select start/end date and time");
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    const endDateTime = new Date(`${endDate}T${endTime}:00`);
    if (startDateTime > endDateTime) {
      toast.error("Start date/time must be before end date/time");
      return;
    }

    const confirmed = await confirm({
      title: "Emergency Cancel",
      message: `Cancel all appointments from ${startDate} ${startTime} to ${endDate} ${endTime}?`,
      confirmText: "Yes, Cancel All",
      cancelText: "Keep Appointments",
      tone: "danger",
    });
    if (!confirmed) return;

    setIsCancelling(true);
    try {
      const res = await axiosInstance.post("/appointments/emergency-cancel", {
        startDate: startDate,
        startTime: startTime,
        endDate: endDate,
        endTime: endTime,
      });
      const cancelled = Array.isArray(res.data?.cancelledAppointments) ? res.data.cancelledAppointments : [];
      toast.success(`${cancelled.length} appointments cancelled`);
      setAppointments((prev) => [...cancelled, ...prev]);
      handleClearInputs();
    } catch {
      toast.error("Failed to cancel appointments");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div>
      {/* ── Header & status counter ───────────────────────────────────── */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Siren className="h-6 w-6 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
            Emergency Cancelled Appointments
          </h2>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Cancel every booked slot inside a time window, then track the
            patients waiting to be rescheduled.
          </p>
        </div>
        <div aria-live="polite" className="shrink-0">
          <CounterBadge isLoading={isLoading} count={appointments.length} />
        </div>
      </header>

      {/* ── Bulk emergency cancellation control ───────────────────────── */}
      <form
        aria-labelledby="emergency-cancel-control-title"
        onSubmit={(event) => {
          event.preventDefault();
          void handleBulkCancellation();
        }}
        className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 shadow-sm mb-6 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-rose-500"
      >
        <h3
          id="emergency-cancel-control-title"
          className="text-base font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2 mb-4"
        >
          <Siren size={18} aria-hidden="true" />
          Bulk Emergency Cancellation
        </h3>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">
          Set the full window you are unavailable for. Every active appointment
          inside it is cancelled in one action and patients with a WhatsApp
          number are alerted right away. Each one then appears in the directory
          below until its slot is rescheduled.
        </p>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateTimeField
            id="emergency-start-date"
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <DateTimeField
            id="emergency-start-time"
            label="Start Time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <DateTimeField
            id="emergency-end-date"
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <DateTimeField
            id="emergency-end-time"
            label="End Time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isCancelling}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all text-sm flex items-center gap-2 justify-center disabled:cursor-not-allowed disabled:bg-rose-600/50 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            {isCancelling ? (
              <>
                <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
                Cancelling Appointments…
              </>
            ) : (
              <>
                <CalendarX2 size={16} aria-hidden="true" />
                Cancel All Appointments in Range
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleClearInputs}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-4 py-3 rounded-xl text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500"
          >
            Clear Inputs
          </button>
        </div>
      </form>

      {/* ── Cancelled appointments directory ──────────────────────────── */}
      <section aria-labelledby="cancelled-directory-title">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3
            id="cancelled-directory-title"
            className="text-base font-bold text-slate-900 dark:text-white"
          >
            Cancelled Appointments Directory
          </h3>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isLoading ? "Loading records" : `${appointments.length} awaiting reschedule`}
          </p>
        </div>

        {isLoading ? (
          <DirectorySkeleton />
        ) : appointments.length === 0 ? (
          <DirectoryEmptyState />
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {/* Desktop / tablet table */}
            <table className="hidden w-full sm:table">
              <caption className="sr-only">
                Emergency-cancelled appointments that still need to be rescheduled
              </caption>
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 p-4">
                  {TABLE_COLUMNS.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className={`p-4 ${column === "Action" ? "text-right" : "text-left"}`}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {appointments.map((appointment) => (
                  <tr
                    key={appointment._id}
                    className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          <UserRound size={18} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {appointment.patient?.name || "Unknown patient"}
                          </p>
                          <p className="truncate text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                            {appointment.patient?.phone || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">
                        {formatShortDate(appointment.date)}
                      </p>
                      <p className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                        {appointment.slot || "—"} · {appointment.type || "Appointment"}
                      </p>
                    </td>
                    <td className="p-4 text-sm font-medium tabular-nums text-slate-700 dark:text-slate-300">
                      {formatDateTime(appointment.cancelledAt || appointment.updatedAt)}
                    </td>
                    <td className="p-4">
                      <ReasonBadge appointment={appointment} />
                    </td>
                    <td className="p-4">
                      <WhatsAppAlertBadge appointment={appointment} />
                    </td>
                    <td className="p-4 text-right">
                      <RescheduleButton appointment={appointment} onReschedule={onReschedule} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 sm:hidden dark:divide-slate-800">
              {appointments.map((appointment) => (
                <li key={appointment._id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <UserRound size={18} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {appointment.patient?.name || "Unknown patient"}
                      </p>
                      <p className="truncate text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                        {appointment.patient?.phone || "—"}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Original Slot
                      </dt>
                      <dd className="text-right text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">
                        {formatShortDate(appointment.date)}
                        <span className="block text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                          {appointment.slot || "—"} · {appointment.type || "Appointment"}
                        </span>
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Cancelled On
                      </dt>
                      <dd className="text-right text-sm font-medium tabular-nums text-slate-700 dark:text-slate-300">
                        {formatDateTime(appointment.cancelledAt || appointment.updatedAt)}
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <dt className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Reason
                      </dt>
                      <dd>
                        <ReasonBadge appointment={appointment} />
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <dt className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        WhatsApp Alert
                      </dt>
                      <dd>
                        <WhatsAppAlertBadge appointment={appointment} />
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <CalendarClock size={14} aria-hidden="true" />
                      {appointment.status || "Cancelled"}
                    </span>
                    <RescheduleButton
                      appointment={appointment}
                      onReschedule={onReschedule}
                      className="text-sm"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
