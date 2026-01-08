import { useState, useEffect } from "react";

type RoundCountdownProps = {
  status: "open" | "voting" | "revealed" | "archived";
  revealUntil: string | null;
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
  if (remaining <= 1000 * 60 * 30) return "urgent"; // 30 minutes
  if (remaining <= 1000 * 60 * 60) return "warning"; // 1 hour
  return "safe";
}

/**
 * Live countdown timer showing time until peek panel switches to new round.
 * Only shown during "revealed" phase - counts down to reveal_until timestamp
 * which is set to 2 hours after "votes are in" email is received.
 */
export default function RoundCountdown({
  status,
  revealUntil,
}: RoundCountdownProps) {
  const [time, setTime] = useState(() => computeTimeRemaining(revealUntil));

  // Update every second
  useEffect(() => {
    if (!revealUntil) return;

    const update = () => setTime(computeTimeRemaining(revealUntil));
    update();

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [revealUntil]);

  // Only show for revealed phase with valid reveal_until timestamp
  if (status !== "revealed" || !revealUntil) {
    return null;
  }

  const urgency = getUrgencyLevel(time.total);
  const label = "New round in";
  const nextPhase = "Next Round";

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
