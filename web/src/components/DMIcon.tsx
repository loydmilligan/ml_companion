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

          {/* Large centered speech bubble */}
          <g transform="translate(50, 48)" filter="url(#dmInnerShadow)">
            <path
              d="M-32 -22
                 C-32 -30 -26 -34 -18 -34
                 L18 -34
                 C26 -34 32 -30 32 -22
                 L32 12
                 C32 20 26 24 18 24
                 L2 24
                 L-8 34
                 L-8 24
                 L-18 24
                 C-26 24 -32 20 -32 12
                 Z"
              fill="url(#dmIconGradient)"
            />
          </g>

          {/* Large paper airplane centered inside bubble */}
          <g transform="translate(50, 46) rotate(-20)">
            {/* Main wing - top */}
            <path
              d="M-18 6 L22 -10 L-8 -2 Z"
              fill="#f8fafc"
            />
            {/* Body - right side */}
            <path
              d="M-8 -2 L22 -10 L-4 14 L-8 -2 Z"
              fill="#e2e8f0"
            />
            {/* Tail fold */}
            <path
              d="M-4 14 L-8 -2 L2 5 Z"
              fill="#cbd5e1"
            />
          </g>

          {/* Highlight on bubble */}
          <ellipse
            cx="50"
            cy="28"
            rx="16"
            ry="4"
            fill="white"
            opacity="0.3"
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
