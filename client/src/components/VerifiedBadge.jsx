export default function VerifiedBadge({ isVerified, compact = false }) {
  if (!isVerified) return null;

  const sizeClass = compact ? "h-4 w-4" : "h-5 w-5";

  return (
    <span className="inline-flex items-center" title="Verified profile" aria-label="Verified profile">
      <svg
        viewBox="0 0 24 24"
        className={sizeClass}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="verified-blue" x1="5" y1="3" x2="19" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3FC2FF" />
            <stop offset="1" stopColor="#0C95DE" />
          </linearGradient>
          <linearGradient id="verified-blue-gloss" x1="12" y1="2" x2="12" y2="11" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.38" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <filter id="verified-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#0B5E90" floodOpacity="0.4" />
          </filter>
        </defs>

        <path
          d="M23,12L20.56,9.22L20.9,5.82L17.55,5.06L15.8,2.12L12.5,3.53L9.2,2.11L7.45,5.05L4.1,5.81L4.44,9.21L2,12L4.44,14.78L4.1,18.18L7.45,18.94L9.2,21.88L12.5,20.47L15.8,21.89L17.55,18.95L20.9,18.19L20.56,14.79L23,12Z"
          fill="url(#verified-blue)"
          filter="url(#verified-shadow)"
        />
        <path
          d="M12.5,3.53L9.2,2.11L7.45,5.05L4.1,5.81L4.44,9.21L2,12L4.44,14.78L4.1,18.18L7.45,18.94L9.2,21.88L12.5,20.47"
          fill="none"
          stroke="#0A85CA"
          strokeOpacity="0.5"
          strokeWidth="0.9"
        />
        <ellipse cx="12" cy="7.7" rx="6.9" ry="3.2" fill="url(#verified-blue-gloss)" />
        <path
          d="M9.95 14.72L7.36 12.15C7.03 11.82 6.49 11.82 6.16 12.15C5.83 12.48 5.83 13.02 6.16 13.35L9.36 16.55C9.69 16.88 10.23 16.88 10.56 16.55L17.8 9.31C18.13 8.98 18.13 8.44 17.8 8.11C17.47 7.78 16.93 7.78 16.6 8.11L9.95 14.72Z"
          fill="#F7FCFF"
        />
      </svg>
    </span>
  );
}
