export default function ConfirmDialog({
  open,
  title = "Please Confirm",
  message = "Are you sure you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
  onClose,
}) {
  if (!open) return null;

  const isDanger = tone === "danger";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
        aria-label="Close dialog overlay"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl p-5 sm:p-6"
        style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 h-8 w-8 rounded-lg text-sm font-bold transition-all hover:opacity-80"
          style={{ background: "var(--color-bg)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
          aria-label="Close"
        >
          ×
        </button>

        <div className="pr-10">
          <h3 className="text-base sm:text-lg font-extrabold text-[var(--color-text-primary)]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{message}</p>
        </div>

        <div className="mt-6 flex justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
            style={{ background: "var(--color-bg)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={
              isDanger
                ? { background: "linear-gradient(135deg,var(--color-danger),color-mix(in srgb, var(--color-danger) 82%, black))" }
                : { background: "linear-gradient(135deg,var(--color-primary),color-mix(in srgb, var(--color-primary) 82%, black))" }
            }
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
