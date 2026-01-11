import clsx from "clsx";

type DMIconProps = {
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md";
  badgeCount?: number;
};

export default function DMIcon({ onClick, className, size = "md", badgeCount = 0 }: DMIconProps) {
  const hasUnread = badgeCount > 0;

  return (
    <button
      type="button"
      className={clsx("dm-icon", `dm-icon-${size}`, hasUnread && "has-unread", className)}
      onClick={onClick}
      aria-label="Messages"
      title="Messages"
    >
      <div className="dm-icon-frame">
        <svg viewBox="0 0 100 100" className="dm-icon-svg">
          <defs>
            {/* Light blue metallic gradient for icon */}
            <linearGradient id="dmIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9ac5eb" />
              <stop offset="50%" stopColor="#7aaddf" />
              <stop offset="100%" stopColor="#6b9bd1" />
            </linearGradient>

            {/* Inner shadow for depth */}
            <filter id="dmInnerShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#1a3a5a" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Speech bubble - smaller and positioned left */}
          <g transform="translate(42, 48) scale(0.7)" filter="url(#dmInnerShadow)">
            <path
              d="M-28 -18
                 C-28 -25 -23 -28 -16 -28
                 L16 -28
                 C23 -28 28 -25 28 -18
                 L28 8
                 C28 15 23 18 16 18
                 L0 18
                 L-8 26
                 L-8 18
                 L-16 18
                 C-23 18 -28 15 -28 8
                 Z"
              fill="url(#dmIconGradient)"
            />
          </g>

          {/* Paper airplane overlay - positioned top right of bubble */}
          <g transform="translate(62, 38) rotate(-15) scale(0.5)">
            <path
              d="M-20 8 L24 -8 L-10 -2 Z"
              fill="#f8fafc"
              opacity="0.95"
            />
            <path
              d="M-10 -2 L24 -8 L-6 12 L-10 -2 Z"
              fill="#e2e8f0"
              opacity="0.9"
            />
            <path
              d="M-6 12 L-10 -2 L0 4 Z"
              fill="#cbd5e1"
              opacity="0.85"
            />
          </g>

          {/* Highlight on bubble */}
          <ellipse
            cx="42"
            cy="32"
            rx="12"
            ry="3"
            fill="white"
            opacity="0.25"
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
