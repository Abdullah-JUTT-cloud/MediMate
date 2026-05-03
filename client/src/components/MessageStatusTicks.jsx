import { Check, CheckCheck } from "lucide-react";

export default function MessageStatusTicks({
  status = "sent",
  className = "",
}) {
  const isDelivered = status === "delivered" || status === "seen";
  const isSeen = status === "seen";

  return (
    <span
      className={`inline-flex items-center ${className}`.trim()}
      aria-label={`Message ${status}`}
    >
      {isDelivered ? (
        <CheckCheck
          className="h-3.5 w-3.5"
          style={{
            color: isSeen
              ? "var(--color-primary)"
              : "var(--color-text-secondary)",
          }}
        />
      ) : (
        <Check
          className="h-3.5 w-3.5"
          style={{ color: "var(--color-text-secondary)" }}
        />
      )}
    </span>
  );
}
