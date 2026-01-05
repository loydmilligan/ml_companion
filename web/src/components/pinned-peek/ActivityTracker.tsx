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

type ActivityTrackerProps = {
  activity: ActivityRecord[];
  competitors: Competitor[];
  activityType: "submitted" | "voted";
  roundStatus: "open" | "voting" | "revealed" | "archived";
  deadline: string | null;
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

export default function ActivityTracker({
  activity,
  competitors,
  activityType,
  roundStatus,
  deadline,
}: ActivityTrackerProps) {
  // Filter activity by type
  const relevantActivity = activity.filter((a) => a.activity_type === activityType);
  const actedNames = new Set(relevantActivity.map((a) => a.actor_name.toLowerCase()));
  const count = relevantActivity.length;
  const total = competitors.length;

  // Don't show submitted tracker during voting, or voted tracker during open
  if (activityType === "submitted" && roundStatus === "voting") return null;
  if (activityType === "voted" && roundStatus === "open") return null;

  // Get label and icon based on type
  const label = activityType === "submitted" ? "Submitted" : "Voted";
  const icon = activityType === "submitted" ? "📝" : "🗳️";

  // Calculate urgency for those who haven't acted
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
    <div className="activity-tracker">
      <div className="activity-tracker-header">
        <span className="activity-tracker-icon">{icon}</span>
        <span className="activity-tracker-label">{label}</span>
        <span className="activity-tracker-count">
          {count}/{total}
        </span>
      </div>
      <div className="activity-tracker-list">
        {competitorStatuses.map((c) => (
          <span
            key={c.id}
            className={clsx(
              "activity-tracker-pill",
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
    </div>
  );
}
