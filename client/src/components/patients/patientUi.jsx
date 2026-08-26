import {
  cls,
  formatMoney,
  getInitials,
  pluralize,
} from "./patientTokens";

const AVATAR_SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
};

/** Initials circle used in the directory rows and the profile header. */
export function PatientAvatar({ name, size = "md", className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`${AVATAR_SIZES[size] || AVATAR_SIZES.md} flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 font-bold text-white shadow-sm dark:from-teal-500 dark:to-teal-800 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}

/** Neutral facility chip — quiet enough not to compete with patient identity. */
export function LocationTag({ location }) {
  if (!location?.locationName) return null;
  const isClinic = location.locationType === "Clinic";
  return (
    <span
      className={`${cls.badgeNeutral} inline-flex items-center gap-1.5`}
      title={`${location.locationType}: ${location.locationName}`}
    >
      <span aria-hidden="true">{isClinic ? "🏥" : "🏨"}</span>
      <span className="truncate">{location.locationName}</span>
    </span>
  );
}

/** Bullet used between inline metadata items (21 yrs • Male • AB+). */
export function MetaDot() {
  return (
    <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">
      •
    </span>
  );
}

/** Labelled sub-card for the profile info grid. */
export function InfoCard({ label, value, children, className = "" }) {
  return (
    <div className={`${cls.infoCard} ${className}`}>
      <span className={cls.fieldLabel}>{label}</span>
      {children || (
        <p className={cls.strongText}>{value || "—"}</p>
      )}
    </div>
  );
}

/** Tinted block that groups one slice of a visit record. */
export function ContentBlock({ label, children, className = "" }) {
  return (
    <div className={`${cls.contentBlock} ${className}`}>
      <span className={cls.blockLabel}>{label}</span>
      {children}
    </div>
  );
}

export function LatestBadge() {
  return (
    <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300">
      Latest
    </span>
  );
}

/** "✓ Paid Rs. 3,900" / "Unpaid Rs. 3,900" with an optional discount note. */
export function PaymentPill({ payment }) {
  if (!payment) return null;

  const net = Number(payment.netAmount ?? payment.amount ?? 0);
  const discount = Number(payment.discountAmount ?? payment.discount ?? 0);
  const isPaid = Boolean(payment.isPaid);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
        isPaid
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
          : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
      }`}
    >
      <span aria-hidden="true">{isPaid ? "✓" : "!"}</span>
      <span>{isPaid ? "Paid" : "Unpaid"}</span>
      <span className="font-extrabold">{formatMoney(net)}</span>
      {discount > 0 && (
        <span className="font-semibold opacity-80">({formatMoney(discount)} off)</span>
      )}
    </span>
  );
}

export function MedicineTag({ medicine }) {
  const regimen = [medicine.dosage, medicine.frequency, medicine.duration]
    .filter(Boolean)
    .join(" · ");

  return (
    <span className="mr-2 mb-2 inline-flex flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-xs dark:border-slate-600 dark:bg-slate-800 dark:text-white">
      <span aria-hidden="true">💊</span>
      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
        {medicine.name}
      </span>
      {regimen && (
        <span className="text-slate-600 dark:text-slate-300">{regimen}</span>
      )}
      {medicine.instructions && (
        <span className="italic text-slate-500 dark:text-slate-400">
          {medicine.instructions}
        </span>
      )}
    </span>
  );
}

export function DiseasePill({ name }) {
  return (
    <span className="mr-2 mb-2 inline-block rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
      {name}
    </span>
  );
}

export function LabTestPill({ name }) {
  return (
    <span className="mr-2 mb-2 inline-block rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
      {name}
    </span>
  );
}

export function HistoryPill({ name }) {
  return (
    <span className="mr-2 mb-2 inline-block rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
      {name}
    </span>
  );
}

export function BackLink({ onClick, label = "Back" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 transition-colors hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
    >
      <span aria-hidden="true">←</span>
      {label}
    </button>
  );
}

export function Spinner({ label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
      {label}
    </span>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-800/40">
      <div aria-hidden="true" className="text-4xl">
        {icon}
      </div>
      <p className="mt-3 text-base font-bold text-slate-900 dark:text-white">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm font-medium text-slate-600 dark:text-slate-300">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/** Small counter chip ("12 visits", "3 results"). */
export function CountChip({ count, singular, plural }) {
  return (
    <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
      {pluralize(count, singular, plural)}
    </span>
  );
}

/** Enter-to-add chip list used for medical history, diseases and lab tests. */
export function TagInput({ value, onChange, onAdd, onRemove, items = [], placeholder, label }) {
  const commit = () => {
    if (!value.trim()) return;
    onAdd();
  };

  return (
    <div>
      {label && <span className={cls.fieldLabel}>{label}</span>}
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
          }}
          placeholder={placeholder}
          aria-label={label || placeholder}
          className={cls.input}
        />
        <button
          type="button"
          onClick={commit}
          className="flex-shrink-0 rounded-xl border border-teal-600 bg-teal-50 px-4 text-sm font-bold text-teal-700 transition-colors hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-950/50 dark:text-teal-300 dark:hover:bg-teal-900/50"
        >
          + Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="mr-2 mb-2 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Remove ${item}`}
                className="text-slate-400 transition-colors hover:text-rose-600 dark:hover:text-rose-400"
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
