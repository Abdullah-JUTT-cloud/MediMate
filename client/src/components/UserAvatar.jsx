import { useState } from "react";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  <UserAvatar /> — crash-proof user avatar for headers
 * ─────────────────────────────────────────────────────────────────────────────
 *  Fixes the "broken image icon" bug that appeared next to the user's name
 *  (e.g. "Abdullah Jutt") in the top-right header. The old header rendered
 *  <img src="/assets/avatar.png"> — an asset that does not exist — so the
 *  browser painted its ugly broken-image glyph.
 *
 *  Rules:
 *    1. `src` must be a non-empty trimmed string, otherwise we never mount
 *       an <img> at all and show clean initials instead (e.g. "AJ").
 *    2. If the image fails to load (onError — 404, CORS, corrupt file…),
 *       we permanently swap back to the initials fallback for that URL.
 *    3. The initials bubble is a styled <span>, so it can NEVER render as a
 *       broken image icon.
 *
 *  @param {object} props
 *  @param {string} [props.src] Avatar image URL (user.image / user.avatar / photo).
 *  @param {string} [props.name] User's display name — drives the initials.
 *  @param {number} [props.size=28] Diameter in pixels (scales the text too).
 *  @param {string} [props.className] Extra classes for the wrapper.
 */
function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserAvatar({
  src = "",
  name = "",
  size = 28,
  className = "",
}) {
  const imageSrc = typeof src === "string" ? src.trim() : "";
  // Remember WHICH url failed. A new (different) url automatically gets a
  // fresh chance to load — no reset effect needed.
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = failedSrc === imageSrc;

  const showImage = imageSrc.length > 0 && !failed;

  return (
    <span
      role="img"
      aria-label={name ? `${name} avatar` : "User avatar"}
      className={`relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-teal-600/30 bg-teal-600/10 font-bold uppercase tracking-wide text-teal-700 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-300 ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}
    >
      {showImage ? (
        <img
          src={imageSrc}
          alt=""
          onError={() => setFailedSrc(imageSrc)}
          className="h-full w-full object-cover"
          // Never let a dragged/broken file paint the browser's broken glyph.
          draggable={false}
        />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
    </span>
  );
}
