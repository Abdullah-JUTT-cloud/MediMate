import { AlertTriangle } from "lucide-react";

export default function EmailSpamNotice() {
  return (
    <div
      role="note"
      aria-label="Important: check your spam folder if the email is missing"
      className="mb-6 rounded-2xl border-2 px-4 py-3.5 sm:px-5 sm:py-4"
      style={{
        borderColor: "var(--color-warning)",
        background:
          "color-mix(in srgb, var(--color-warning) 16%, var(--color-card))",
        boxShadow:
          "0 6px 18px -8px color-mix(in srgb, var(--color-warning) 55%, transparent)",
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{
            background: "var(--color-warning)",
            color: "#1e293b",
          }}
        >
          <AlertTriangle size={16} strokeWidth={2.6} />
        </span>
        <div className="min-w-0 text-left">
          <p
            className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.2em] sm:text-xs"
            style={{ color: "var(--color-warning)" }}
          >
            Important — Attention
          </p>
          <p className="text-sm font-extrabold leading-snug text-[var(--color-text-primary)] sm:text-base">
            If you do not receive the email in your inbox, check your{" "}
            <span className="underline decoration-2 underline-offset-2">
              Spam / Junk
            </span>{" "}
            folder.
          </p>
        </div>
      </div>
    </div>
  );
}
