import clsx from "clsx";

type UrgencyLevel = "safe" | "warning" | "urgent" | "overdue" | "neutral";

type DualNeedleGaugeProps = {
  submissionPct: number; // 0-100, how close to deadline
  votingPct: number; // 0-100, how close to deadline
  submissionLevel: UrgencyLevel;
  votingLevel: UrgencyLevel;
  size?: "sm" | "md";
  onClick?: () => void;
  className?: string;
  showExpandIndicator?: boolean;
};

// Convert percentage (0-100) to angle within the gauge arc
// Gauge arc spans from -135deg to +135deg (270 degrees total)
// 0% = -135deg (safe), 100% = +135deg (overdue)
function pctToAngle(pct: number): number {
  const clampedPct = Math.max(0, Math.min(100, pct));
  return -135 + (clampedPct / 100) * 270;
}

// Brighter colors for better visibility
function getUrgencyColor(level: UrgencyLevel): string {
  switch (level) {
    case "safe":
      return "#00ff9f"; // Bright mint green
    case "warning":
      return "#ffcc00"; // Bright yellow
    case "urgent":
    case "overdue":
      return "#ff4444"; // Bright red
    default:
      return "#8899aa";
  }
}

export default function DualNeedleGauge({
  submissionPct,
  votingPct,
  submissionLevel,
  votingLevel,
  size = "sm",
  onClick,
  className,
  showExpandIndicator = false,
}: DualNeedleGaugeProps) {
  const sizeValue = size === "sm" ? 44 : 56;
  const isUrgent = submissionLevel === "urgent" || submissionLevel === "overdue" ||
                   votingLevel === "urgent" || votingLevel === "overdue";

  const submissionAngle = pctToAngle(submissionPct);
  const votingAngle = pctToAngle(votingPct);

  const submissionColor = getUrgencyColor(submissionLevel);
  const votingColor = getUrgencyColor(votingLevel);

  // SVG dimensions
  const center = 50;
  const radius = 36;
  const strokeWidth = 6;

  // Arc path for the gauge background (270 degrees)
  const arcPath = describeArc(center, center, radius, -135, 135);

  // Green zone: -135 to -45 (first third)
  const greenArc = describeArc(center, center, radius, -135, -45);
  // Yellow zone: -45 to 45 (middle third)
  const yellowArc = describeArc(center, center, radius, -45, 45);
  // Red zone: 45 to 135 (last third)
  const redArc = describeArc(center, center, radius, 45, 135);

  return (
    <div
      className={clsx(
        "dual-needle-gauge",
        `dual-needle-gauge-${size}`,
        isUrgent && "dual-needle-gauge-urgent",
        onClick && "dual-needle-gauge-clickable",
        showExpandIndicator && "dual-needle-gauge-expandable",
        className
      )}
      style={{ width: sizeValue, height: sizeValue }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <svg viewBox="0 0 100 100" className="dual-needle-gauge-svg" style={{ width: sizeValue, height: sizeValue }}>
        {/* Background arc (subtle) */}
        <path
          d={arcPath}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Green zone - brighter */}
        <path
          d={greenArc}
          fill="none"
          stroke="#00ff9f"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.6}
        />

        {/* Yellow zone - brighter */}
        <path
          d={yellowArc}
          fill="none"
          stroke="#ffcc00"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.6}
        />

        {/* Red zone - brighter */}
        <path
          d={redArc}
          fill="none"
          stroke="#ff4444"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.6}
        />

        {/* Center hub */}
        <circle cx={center} cy={center} r="8" fill="var(--surface-elevated, #1a2a3f)" />
        <circle cx={center} cy={center} r="5" fill="var(--navy, #0a1a2f)" />

        {/* Submission needle - Music note icon style (thicker, with note head) */}
        <g
          transform={`rotate(${submissionAngle}, ${center}, ${center})`}
          className="gauge-needle gauge-needle-submission"
        >
          {/* Needle stem */}
          <line
            x1={center}
            y1={center - 4}
            x2={center}
            y2={center - radius + 6}
            stroke={submissionColor}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Music note head (circle) */}
          <circle
            cx={center}
            cy={center - radius + 6}
            r="5"
            fill={submissionColor}
          />
          {/* "S" label for Submit */}
          <text
            x={center}
            y={center - radius + 9}
            textAnchor="middle"
            fontSize="7"
            fontWeight="bold"
            fill="#000"
          >
            S
          </text>
        </g>

        {/* Voting needle - Checkmark style (thinner, dashed) */}
        <g
          transform={`rotate(${votingAngle}, ${center}, ${center})`}
          className="gauge-needle gauge-needle-voting"
        >
          {/* Needle stem - dashed */}
          <line
            x1={center}
            y1={center - 4}
            x2={center}
            y2={center - radius + 6}
            stroke={votingColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="3 2"
          />
          {/* Checkmark box */}
          <rect
            x={center - 5}
            y={center - radius + 1}
            width="10"
            height="10"
            fill={votingColor}
            rx="2"
          />
          {/* "V" label for Vote */}
          <text
            x={center}
            y={center - radius + 9}
            textAnchor="middle"
            fontSize="7"
            fontWeight="bold"
            fill="#000"
          >
            V
          </text>
        </g>
      </svg>
    </div>
  );
}

// Helper function to describe an SVG arc path
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}
