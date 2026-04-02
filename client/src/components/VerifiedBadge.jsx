export default function VerifiedBadge({ isVerified, compact = false }) {
  if (!isVerified) return null;

  return (
    <span className="inline-flex items-center" title="Verified profile" aria-label="Verified profile">
      <span
        className={
          "inline-flex items-center justify-center rounded-full bg-[#1d9bf0] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.15)] " +
          (compact ? "h-4 w-4 text-[10px]" : "h-5 w-5 text-[11px]")
        }
      >
        ✓
      </span>
    </span>
  );
}
