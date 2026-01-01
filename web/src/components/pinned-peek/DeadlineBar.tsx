type DeadlineBarProps = {
  submissionDeadline: string | null;
  votingDeadline: string | null;
  submittedCount: number;
  votedCount: number;
  totalMembers: number;
};

function computeProgress(deadline: string | null): { pct: number; level: string } {
  if (!deadline) return { pct: 0, level: "neutral" };

  const now = Date.now();
  const deadlineMs = new Date(deadline).getTime();
  const remaining = deadlineMs - now;

  if (remaining <= 0) return { pct: 100, level: "overdue" };

  // Use a 72-hour window for progress calculation
  const totalWindow = 1000 * 60 * 60 * 72;
  const pct = Math.min(100, Math.max(5, (1 - remaining / totalWindow) * 100));

  if (remaining <= 1000 * 60 * 60 * 6) return { pct, level: "urgent" };
  if (remaining <= 1000 * 60 * 60 * 24) return { pct, level: "warning" };
  return { pct, level: "safe" };
}

function formatTimeRemaining(deadline: string | null): string {
  if (!deadline) return "No deadline";

  const now = Date.now();
  const deadlineMs = new Date(deadline).getTime();
  const remaining = deadlineMs - now;

  if (remaining <= 0) return "Overdue";

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days > 0) {
    return `${days}d ${remainingHours}h`;
  }
  return `${hours}h`;
}

export default function DeadlineBar({
  submissionDeadline,
  votingDeadline,
  submittedCount,
  votedCount,
  totalMembers,
}: DeadlineBarProps) {
  const submission = computeProgress(submissionDeadline);
  const voting = computeProgress(votingDeadline);

  const submittedPct = totalMembers > 0 ? (submittedCount / totalMembers) * 100 : 0;
  const votedPct = totalMembers > 0 ? (votedCount / totalMembers) * 100 : 0;

  // Dynamic outline styles based on participation
  const submittedOpacity = submittedPct > 0 ? 0.3 + (submittedPct / 100) * 0.5 : 0;
  const votedOpacity = votedPct > 0 ? 0.4 + (votedPct / 100) * 0.5 : 0;

  return (
    <div className="deadline-bar-wrapper">
      <div
        className="deadline-bar-combined"
        style={{
          boxShadow: submittedPct > 0 || votedPct > 0
            ? `0 0 0 3px rgba(24, 224, 168, ${submittedOpacity}), 0 0 0 6px rgba(17, 193, 236, ${votedOpacity})`
            : undefined
        }}
      >
        <div className="deadline-bar-combined-inner">
          {/* Submission fill (behind voting) */}
          <span
            className={`deadline-fill-submission ${submission.level}`}
            style={{ width: `${submission.pct}%` }}
          />
          {/* Voting fill (on top, semi-transparent) */}
          <span
            className={`deadline-fill-voting ${voting.level}`}
            style={{ width: `${voting.pct}%` }}
          />
        </div>
      </div>

      <div className="deadline-legend">
        <span>
          <span className="deadline-legend-dot submission" />
          Submit: {formatTimeRemaining(submissionDeadline)}
        </span>
        <span>
          <span className="deadline-legend-dot voting" />
          Vote: {formatTimeRemaining(votingDeadline)}
        </span>
      </div>

      {totalMembers > 0 && (
        <div className="deadline-participation">
          <span className="participation-stat">
            {submittedCount}/{totalMembers} submitted
          </span>
          <span className="participation-stat">
            {votedCount}/{totalMembers} voted
          </span>
        </div>
      )}
    </div>
  );
}
