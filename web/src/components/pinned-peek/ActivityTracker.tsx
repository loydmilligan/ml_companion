type ActivityRecord = {
  id: string;
  actor_name: string;
  activity_type: "submitted" | "voted";
  profile_id: string | null;
};

type ActivityTrackerProps = {
  activity: ActivityRecord[];
  totalMembers: number;
  activityType: "submitted" | "voted";
  roundStatus: "open" | "voting" | "revealed" | "archived";
};

export default function ActivityTracker({
  activity,
  totalMembers,
  activityType,
  roundStatus,
}: ActivityTrackerProps) {
  // Filter activity by type
  const relevantActivity = activity.filter((a) => a.activity_type === activityType);
  const count = relevantActivity.length;

  // Don't show submitted tracker during voting, or voted tracker during open
  if (activityType === "submitted" && roundStatus === "voting") return null;
  if (activityType === "voted" && roundStatus === "open") return null;

  // Get label and icon based on type
  const label = activityType === "submitted" ? "Submitted" : "Voted";
  const icon = activityType === "submitted" ? "📝" : "🗳️";

  return (
    <div className="activity-tracker">
      <div className="activity-tracker-header">
        <span className="activity-tracker-icon">{icon}</span>
        <span className="activity-tracker-label">{label}</span>
        <span className="activity-tracker-count">
          {count}/{totalMembers}
        </span>
      </div>
      {relevantActivity.length > 0 && (
        <div className="activity-tracker-list">
          {relevantActivity.map((a) => (
            <span key={a.id} className="activity-tracker-name">
              {a.actor_name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
