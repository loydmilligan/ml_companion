import { useState, useEffect, useMemo } from "react";

type RoundCountdownProps = {
  status: "open" | "voting" | "revealed" | "archived";
  submissionDeadline: string | null;
  votingDeadline: string | null;
};

type TimeRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
};

function computeTimeRemaining(deadline: string | null): TimeRemaining {
  if (!deadline) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const deadlineMs = new Date(deadline).getTime();
  const now = Date.now();
  const remaining = Math.max(0, deadlineMs - now);

  const seconds = Math.floor((remaining / 1000) % 60);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total: remaining };
}

function getUrgencyLevel(remaining: number): "safe" | "warning" | "urgent" | "overdue" {
  if (remaining <= 0) return "overdue";
  if (remaining <= 1000 * 60 * 60 * 6) return "urgent"; // 6 hours
  if (remaining <= 1000 * 60 * 60 * 24) return "warning"; // 24 hours
  return "safe";
}

/**
 * Live countdown timer showing time until round switches phases.
 * - Open phase: shows time until submissions close
 * - Voting phase: shows time until voting closes
 */
export default function RoundCountdown({
  status,
  submissionDeadline,
  votingDeadline,
}: RoundCountdownProps) {
  // Pick the relevant deadline based on status
  const deadline = useMemo(() => {
    if (status === "open") return submissionDeadline;
    if (status === "voting") return votingDeadline;
    return null;
  }, [status, submissionDeadline, votingDeadline]);

  const [time, setTime] = useState(() => computeTimeRemaining(deadline));

  // Update every second
  useEffect(() => {
    if (!deadline) return;

    const update = () => setTime(computeTimeRemaining(deadline));
    update();

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  // Don't show for revealed/archived rounds or if no deadline
  if (status === "revealed" || status === "archived" || !deadline) {
    return null;
  }

  const urgency = getUrgencyLevel(time.total);
  const label = status === "open" ? "Submissions close in" : "Voting ends in";
  const nextPhase = status === "open" ? "Voting" : "Results";

  // Format with leading zeros
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className={`round-countdown round-countdown-${urgency}`}>
      <div className="round-countdown-label">{label}</div>
      <div className="round-countdown-timer">
        {time.total <= 0 ? (
          <span className="round-countdown-overdue">{nextPhase} starting...</span>
        ) : (
          <>
            {time.days > 0 && (
              <span className="countdown-segment">
                <span className="countdown-value">{time.days}</span>
                <span className="countdown-unit">d</span>
              </span>
            )}
            <span className="countdown-segment">
              <span className="countdown-value">{pad(time.hours)}</span>
              <span className="countdown-unit">h</span>
            </span>
            <span className="countdown-segment">
              <span className="countdown-value">{pad(time.minutes)}</span>
              <span className="countdown-unit">m</span>
            </span>
            <span className="countdown-segment">
              <span className="countdown-value">{pad(time.seconds)}</span>
              <span className="countdown-unit">s</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
