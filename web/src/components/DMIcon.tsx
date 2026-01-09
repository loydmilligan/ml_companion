import clsx from "clsx";

type DMIconProps = {
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md";
  badgeCount?: number;
};

export default function DMIcon({ onClick, className, size = "md", badgeCount = 0 }: DMIconProps) {
  return (
    <button
      type="button"
      className={clsx("dm-icon", `dm-icon-${size}`, className)}
      onClick={onClick}
      aria-label="Messages"
      title="Messages"
    >
      <div className="dm-icon-frame">
        <svg viewBox="0 0 100 100" className="dm-icon-svg">
          <defs>
            {/* Blue metallic gradient - matches app theme */}
            <linearGradient id="dmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6b9bd1" />
              <stop offset="25%" stopColor="#4a7cb5" />
              <stop offset="50%" stopColor="#7aaddf" />
              <stop offset="75%" stopColor="#4a7cb5" />
              <stop offset="100%" stopColor="#3a6ca5" />
            </linearGradient>

            {/* Inner shadow for depth */}
            <filter id="dmInnerShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#1a3a5a" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Speech bubble envelope shape - centered and sized to fit */}
          <g transform="translate(50, 48) scale(0.85)" filter="url(#dmInnerShadow)">
            {/* Main envelope/message bubble shape */}
            <path
              d="M-32 -20
                 C-32 -28 -26 -32 -18 -32
                 L18 -32
                 C26 -32 32 -28 32 -20
                 L32 12
                 C32 20 26 24 18 24
                 L2 24
                 L-8 34
                 L-8 24
                 L-18 24
                 C-26 24 -32 20 -32 12
                 Z"
              fill="url(#dmGradient)"
            />
          </g>

          {/* Message lines inside bubble */}
          <g transform="translate(50, 45)">
            <rect x="-16" y="-10" width="32" height="3" rx="1.5" fill="#1a3a5a" opacity="0.4" />
            <rect x="-16" y="-2" width="24" height="3" rx="1.5" fill="#1a3a5a" opacity="0.4" />
            <rect x="-16" y="6" width="18" height="3" rx="1.5" fill="#1a3a5a" opacity="0.4" />
          </g>

          {/* Highlight on top */}
          <ellipse
            cx="50"
            cy="28"
            rx="18"
            ry="4"
            fill="white"
            opacity="0.2"
          />
        </svg>
      </div>
      {badgeCount > 0 && (
        <span className="dm-icon-badge">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </button>
  );
}
