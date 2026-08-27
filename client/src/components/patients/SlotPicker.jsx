import { Siren } from "lucide-react";
import { MAX_APPOINTMENTS_PER_SLOT } from "./patientTokens";

/**
 * Shared Emergency-enabled slot picker used by BOTH booking surfaces:
 *   - Patient page book-slot modal (BookAppointmentModal)
 *   - Appointments page book form (BookAppointmentForm in AppointmentsPage)
 *
 * It owns the Emergency Case toggle and renders the exact same slot grid,
 * capacity data, full-slot lockout, red emergency indicators and badges.
 */

const ToggleSwitch = ({ isEmergency, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={isEmergency}
    aria-label="Emergency Case"
    onClick={() => onChange(!isEmergency)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 ${
      isEmergency
        ? "bg-red-600 ring-red-500 focus:ring-red-500/50"
        : "bg-slate-300 dark:bg-slate-600 focus:ring-teal-500/40"
    }`}
  >
    <span
      className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
      style={{ transform: isEmergency ? "translateX(20px)" : "translateX(0px)" }}
    />
  </button>
);

const EmergencyToggleRow = ({ isEmergency, onChange }) => (
  <div
    className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors ${
      isEmergency
        ? "border-red-300 bg-red-50 dark:border-red-500/60 dark:bg-red-950/40"
        : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70"
    }`}
  >
    <div className="flex min-w-0 items-start gap-2.5">
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isEmergency
            ? "bg-red-600 text-white"
            : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
        }`}
      >
        <Siren size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p
          className={`text-sm font-bold ${
            isEmergency ? "text-red-700 dark:text-red-300" : "text-slate-900 dark:text-white"
          }`}
        >
          Emergency Case
        </p>
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {isEmergency
            ? "Override ON — full slots are bookable with no capacity limit"
            : "OFF — slots limited to 3 standard bookings each"}
        </p>
      </div>
    </div>
    <ToggleSwitch isEmergency={isEmergency} onChange={onChange} />
  </div>
);

export default function SlotPicker({
  slots,
  availability = {},
  selectedSlot,
  onSelectSlot,
  isEmergency,
  onEmergencyChange,
  isLoading = false,
  maxPerSlot = MAX_APPOINTMENTS_PER_SLOT,
  emptyTitle = "No slots on this date",
  emptyHint = "No session is scheduled on this date. Pick another date or add sessions in Settings.",
}) {
  return (
    <div className="space-y-3">
      {/* Emergency Mode override toggle */}
      <EmergencyToggleRow isEmergency={isEmergency} onChange={onEmergencyChange} />

      {isLoading ? (
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Checking slot availability…
        </p>
      ) : slots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-sm font-bold text-slate-900 dark:text-white">{emptyTitle}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {emptyHint}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((entry) => {
              const stats = availability[entry.time] || {
                standardCount: 0,
                emergencyCount: 0,
                totalCount: 0,
                isFull: false,
              };
              const standardCount = Number(stats.standardCount) || 0;
              const emergencyCount = Number(stats.emergencyCount) || 0;
              const isFull =
                Boolean(stats.isFull) || standardCount >= maxPerSlot;
              const hasEmergency = emergencyCount > 0;
              const isSelected = selectedSlot === entry.time;
              const isDisabled = !isEmergency && isFull;

              const cardClasses = (() => {
                if (isEmergency) {
                  return isSelected
                    ? "border-red-600 bg-red-600 text-white shadow-md"
                    : hasEmergency
                      ? "border-red-400 bg-red-50/40 text-red-700 hover:border-red-500 hover:bg-red-100 dark:border-red-400/60 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
                      : "border-slate-300 bg-white text-slate-800 hover:border-red-500 hover:bg-red-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-red-400 dark:hover:bg-red-950/40";
                }
                if (isFull) {
                  // Full slots stay visually locked, but slots carrying
                  // emergency overrides keep the red border + red hint.
                  return `cursor-not-allowed opacity-50 bg-slate-100 ${
                    hasEmergency
                      ? "border-red-400 text-red-700 dark:border-red-400/60 dark:bg-red-500/10 dark:text-red-200"
                      : "border-slate-200 text-slate-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-600"
                  }`;
                }
                if (isSelected) {
                  return "border-teal-600 bg-teal-600 text-white shadow-md";
                }
                if (hasEmergency) {
                  return "border-red-400 bg-red-50/40 text-red-700 hover:border-red-500 hover:bg-red-100 dark:border-red-400/60 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20";
                }
                return "border-slate-300 bg-white text-slate-800 hover:border-teal-500 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:text-teal-300";
              })();

              const tooltip = `Slot ${entry.time} - ${standardCount}/${maxPerSlot} Booked${
                hasEmergency ? ` (+${emergencyCount} Emergency)` : ""
              }`;

              return (
                <button
                  key={entry.time}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onSelectSlot(entry.time)}
                  title={tooltip}
                  aria-label={`Slot ${entry.time}`}
                  className={`relative rounded-xl border px-2 py-2.5 text-sm font-bold transition-colors ${cardClasses}`}
                >
                  {hasEmergency && (
                    <span className="absolute -top-2 -right-2 z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                      +{emergencyCount}
                    </span>
                  )}
                  {entry.time}
                  {!isFull && (
                    <span
                      className={`block text-[11px] font-semibold ${
                        isSelected
                          ? isEmergency
                            ? "text-red-50"
                            : "text-teal-50"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {standardCount}/{maxPerSlot} booked
                    </span>
                  )}
                  {isFull && (
                    <span className="block text-[11px] font-semibold">Full</span>
                  )}
                  {hasEmergency && !isSelected && (
                    <span className="block text-[10px] font-bold text-red-600 dark:text-red-300">
                      +{emergencyCount} Emergency
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="font-bold">Red badge (+N)</span> = emergency overrides on that
            slot ·{" "}
            <span className="font-bold">
              {isEmergency ? "Emergency ON: full slots are selectable" : "Emergency OFF: full slots are locked"}
            </span>
          </p>
        </>
      )}
    </div>
  );
}
