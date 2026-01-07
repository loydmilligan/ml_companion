import { useState, useEffect } from "react";
import clsx from "clsx";

type ActivityRecord = {
  id: string;
  actor_name: string;
  activity_type: "submitted" | "voted";
  profile_id: string | null;
};

type Competitor = {
  id: string;
  name: string;
  profile_id: string | null;
};

type ProgressSectionProps = {
  activity: ActivityRecord[];
  competitors: Competitor[];
  roundStatus: "open" | "voting" | "revealed" | "archived";
  submissionDeadline: string | null;
  votingDeadline: string | null;
};

type UrgencyLevel = "safe" | "warning" | "urgent" | "overdue";

function computeUrgency(deadlineStr: string | null): UrgencyLevel {
  if (!deadlineStr) return "safe";
  const deadlineMs = new Date(deadlineStr).getTime();
  const now = Date.now();
  const remaining = deadlineMs - now;

  if (remaining <= 0) return "overdue";
  if (remaining <= 1000 * 60 * 60 * 6) return "urgent"; // 6 hours
  if (remaining <= 1000 * 60 * 60 * 24) return "warning"; // 24 hours
  return "safe";
}

const STORAGE_KEY_PREFIX = "peek-progress-v1-";

type TrackerProps = {
  type: "submitted" | "voted";
  activity: ActivityRecord[];
  competitors: Competitor[];
  deadline: string | null;
  defaultExpanded: boolean;
};

function ProgressTracker({
  type,
  activity,
  competitors,
  deadline,
  defaultExpanded,
}: TrackerProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}${type}`;

  const [expanded, setExpanded] = useState(() => {
    if (typeof window === "undefined") return defaultExpanded;
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      return stored === "true";
    }
    return defaultExpanded;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, String(expanded));
  }, [expanded, storageKey]);

  // Filter activity by type
  const relevantActivity = activity.filter((a) => a.activity_type === type);
  const actedNames = new Set(relevantActivity.map((a) => a.actor_name.toLowerCase()));
  const count = relevantActivity.length;
  const total = competitors.length;

  const label = type === "submitted" ? "Submitted" : "Voted";
  const icon = type === "submitted" ? "📝" : "🗳️";
  const urgency = computeUrgency(deadline);

  // Build list of all competitors with their status
  const competitorStatuses = competitors.map((c) => {
    const hasActed = actedNames.has(c.name.toLowerCase());
    return {
      id: c.id,
      name: c.name,
      hasActed,
      urgency: hasActed ? null : urgency,
    };
  });

  // Sort: acted first, then by name
  competitorStatuses.sort((a, b) => {
    if (a.hasActed !== b.hasActed) return a.hasActed ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className={clsx("progress-tracker", expanded && "expanded")}>
      <button
        type="button"
        className="progress-tracker-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="progress-tracker-icon">{icon}</span>
        <span className="progress-tracker-label">{label}</span>
        <span className="progress-tracker-count">{count}/{total}</span>
        <span className="progress-tracker-chevron">
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <path d="M2 4L6 8L10 4" />
          </svg>
        </span>
      </button>
      {expanded && (
        <div className="progress-tracker-list">
          {competitorStatuses.map((c) => (
            <span
              key={c.id}
              className={clsx(
                "progress-tracker-pill",
                c.hasActed && "acted",
                !c.hasActed && c.urgency === "warning" && "warning",
                !c.hasActed && c.urgency === "urgent" && "urgent",
                !c.hasActed && c.urgency === "overdue" && "urgent"
              )}
            >
              {c.hasActed && <span className="pill-check">✓</span>}
              {c.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProgressSection({
  activity,
  competitors,
  roundStatus,
  submissionDeadline,
  votingDeadline,
}: ProgressSectionProps) {
  if (competitors.length === 0) return null;

  // Determine default expand state based on round status
  const submittedDefaultExpanded = roundStatus === "open";
  const votedDefaultExpanded = roundStatus === "voting";

  return (
    <div className="progress-section">
      <ProgressTracker
        type="submitted"
        activity={activity}
        competitors={competitors}
        deadline={submissionDeadline}
        defaultExpanded={submittedDefaultExpanded}
      />
      <ProgressTracker
        type="voted"
        activity={activity}
        competitors={competitors}
        deadline={votingDeadline}
        defaultExpanded={votedDefaultExpanded}
      />

      <style>{`
        .progress-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .progress-tracker {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }
        .progress-tracker-header {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 0.85rem;
          color: var(--text-primary);
          text-align: left;
          transition: background 0.15s ease;
        }
        .progress-tracker-header:hover {
          background: var(--bg-tertiary);
        }
        .progress-tracker-icon {
          font-size: 1rem;
          flex-shrink: 0;
        }
        .progress-tracker-label {
          font-weight: 600;
          flex: 1;
        }
        .progress-tracker-count {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
        }
        .progress-tracker-chevron {
          display: flex;
          align-items: center;
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .progress-tracker-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 0 12px 12px;
        }
        .progress-tracker-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: var(--bg-tertiary);
          border-radius: 12px;
          font-size: 0.75rem;
          color: var(--text-muted);
          transition: background 0.15s ease, color 0.15s ease;
        }
        .progress-tracker-pill.acted {
          background: var(--success);
          color: white;
        }
        .progress-tracker-pill.warning {
          background: var(--warning, #f59e0b);
          color: white;
        }
        .progress-tracker-pill.urgent {
          background: var(--error);
          color: white;
        }
        .progress-tracker-pill .pill-check {
          font-size: 0.7rem;
        }
      `}</style>
    </div>
  );
}
