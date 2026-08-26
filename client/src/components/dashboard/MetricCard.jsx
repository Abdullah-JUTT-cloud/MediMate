/**
 * A single summary card, e.g. "Total Patients".
 * Shows one clear number, one plain label and a small helper line.
 */
export default function MetricCard({ icon, label, value, subtitle }) {
  // Capitalised alias so the icon renders like a normal React component.
  const Icon = icon;

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">{value}</p>
      <p className="mt-0.5 text-sm font-semibold text-[var(--color-text-primary)]">{label}</p>
      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{subtitle}</p>
    </article>
  );
}
