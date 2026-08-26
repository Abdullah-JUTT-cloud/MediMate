import { CalendarDays, CalendarPlus, MessageCircle, Siren, UserPlus } from "lucide-react";

// Simple, everyday actions a doctor or clinic assistant needs.
const QUICK_ACTIONS = [
  { key: "patients", label: "Add Patient", icon: UserPlus, style: "primary" },
  { key: "appointments", label: "Book Appointment", icon: CalendarPlus, style: "soft" },
  { key: "support", label: "Support / Feedback", icon: MessageCircle, style: "soft" },
  { key: "emergency-cancelled", label: "Emergency Cancel", icon: Siren, style: "danger" },
];

const BUTTON_STYLES = {
  // The most common action, gently filled with the theme colour.
  primary:
    "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]",
  // Calm outline pills for the everyday actions.
  soft: "border border-[var(--color-border)] bg-[var(--color-bg-soft)]/50 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-primary)]",
  // Soft red outline so urgent actions stand out without shouting.
  // The border colour is set inline because the global stylesheet
  // overrides Tailwind border colours.
  danger:
    "border bg-[var(--color-danger)]/5 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10",
};
const DANGER_BORDER_COLOR = "color-mix(in srgb, var(--color-danger) 35%, transparent)";

export default function GreetingCard({ doctorName, dateLabel, onNavigate }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
            {dateLabel}
          </p>
          <h2 className="mt-2 text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">
            Good day, {doctorName}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Here is a quick look at your clinic today.
          </p>
        </div>

        <div className="shrink-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
            Quick Actions
          </p>
          <div className="flex flex-wrap gap-2.5">
            {QUICK_ACTIONS.map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => onNavigate(action.key)}
                  style={action.style === "danger" ? { borderColor: DANGER_BORDER_COLOR } : undefined}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${BUTTON_STYLES[action.style]}`}
                >
                  <ActionIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
