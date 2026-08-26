import { CalendarClock, ChevronRight } from "lucide-react";
import { AppointmentRowSkeleton } from "../SkeletonLoaders";
import { formatSlotTime, getInitials } from "./dashboardHelpers";

// Simple visit badges that match the doctor queue.
const STATUS_BADGES = {
  WAITING: { label: "Waiting", className: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]" },
  IN_CONSULTATION: {
    label: "In Consultation",
    className: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
  },
  COMPLETED: { label: "Completed", className: "bg-[var(--color-success)]/10 text-[var(--color-success)]" },
  NO_SHOW: { label: "No Show", className: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]" },
};

export default function TodayAppointmentsList({ appointments, isLoading, onOpenQueue }) {
  // Earliest visit first.
  const sortedAppointments = [...(appointments || [])].sort((a, b) =>
    String(a.slot).localeCompare(String(b.slot)),
  );

  return (
    <section className="flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">Today&apos;s Appointments</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
            Click a visit to open the queue
          </p>
        </div>
        <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)]">
          {sortedAppointments.length} total
        </span>
      </div>

      <div className="max-h-[360px] flex-1 space-y-2.5 overflow-y-auto pr-1">
        {isLoading ? (
          <>
            <AppointmentRowSkeleton />
            <AppointmentRowSkeleton />
            <AppointmentRowSkeleton />
          </>
        ) : sortedAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-6 py-10 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg-soft)]/70 text-[var(--color-text-secondary)]">
              <CalendarClock className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              No appointments today
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              New bookings will show up here.
            </p>
          </div>
        ) : (
          sortedAppointments.map((appointment) => {
            const badge = STATUS_BADGES[appointment.queueStatus] || STATUS_BADGES.WAITING;
            return (
              <button
                key={appointment._id}
                type="button"
                onClick={onOpenQueue}
                className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)]/40 p-3 text-left transition-all duration-200 hover:bg-[var(--color-bg-soft)]/70 hover:shadow-[var(--shadow-soft)]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-sm font-bold text-[var(--color-primary)]">
                  {getInitials(appointment.patient?.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">
                    {appointment.patient?.name || "Unknown patient"}
                  </span>
                  <span className="block truncate text-xs text-[var(--color-text-secondary)]">
                    {appointment.type || "Visit"} · {formatSlotTime(appointment.slot)}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}
                >
                  {badge.label}
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
