import clsx from "clsx";

type SettingsGearProps = {
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md";
};

export default function SettingsGear({ onClick, className, size = "md" }: SettingsGearProps) {
  return (
    <button
      type="button"
      className={clsx("settings-gear", `settings-gear-${size}`, className)}
      onClick={onClick}
      aria-label="Open settings menu"
    >
      <div className="settings-gear-frame">
        <svg viewBox="0 0 100 100" className="settings-gear-svg">
          <defs>
            {/* Iron metallic gradient */}
            <linearGradient id="ironGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8899aa" />
              <stop offset="25%" stopColor="#667788" />
              <stop offset="50%" stopColor="#99aabb" />
              <stop offset="75%" stopColor="#667788" />
              <stop offset="100%" stopColor="#556677" />
            </linearGradient>

            {/* Inner shadow for depth */}
            <filter id="gearInnerShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#1a2a3a" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Gear shape with 8 teeth - centered and sized to fit */}
          <g transform="translate(50, 50) scale(0.9)" filter="url(#gearInnerShadow)">
            <path
              d="M0 -38
                 L4 -38 L6 -30 L10 -29 L15 -35 L20 -32 L18 -24 L22 -20 L30 -22 L32 -16 L25 -12 L26 -7 L34 -4 L34 4 L26 7 L25 12 L32 16 L30 22 L22 20 L18 24 L20 32 L15 35 L10 29 L6 30 L4 38 L-4 38 L-6 30 L-10 29 L-15 35 L-20 32 L-18 24 L-22 20 L-30 22 L-32 16 L-25 12 L-26 7 L-34 4 L-34 -4 L-26 -7 L-25 -12 L-32 -16 L-30 -22 L-22 -20 L-18 -24 L-20 -32 L-15 -35 L-10 -29 L-6 -30 L-4 -38 Z"
              fill="url(#ironGradient)"
            />
          </g>

          {/* Center hole (dark) */}
          <circle cx="50" cy="50" r="14" fill="#1a2a3a" />

          {/* Inner ring highlight */}
          <circle
            cx="50"
            cy="50"
            r="11"
            fill="none"
            stroke="#6d7d8d"
            strokeWidth="1.5"
            opacity="0.6"
          />

          {/* Center bolt detail */}
          <circle cx="50" cy="50" r="5" fill="#4d5d6d" />
          <circle cx="50" cy="50" r="2.5" fill="#3d4d5d" />
        </svg>
      </div>
    </button>
  );
}
