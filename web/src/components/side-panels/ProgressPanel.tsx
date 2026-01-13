import { useEffect, useRef, useCallback } from "react";
import clsx from "clsx";
import ProgressSection from "../pinned-peek/ProgressSection";
import RoundCountdown from "../pinned-peek/RoundCountdown";
import DualNeedleGauge from "../pinned-peek/DualNeedleGauge";
import RotatedCassetteBanner from "./RotatedCassetteBanner";

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

type UrgencyLevel = "safe" | "warning" | "urgent" | "overdue" | "neutral";

type UrgencyState = {
  level: UrgencyLevel;
  pct: number;
};

type RoundSummary = {
  id: string;
  theme: string;
  status: "open" | "voting" | "revealed" | "archived";
  submission_deadline: string | null;
  voting_deadline: string | null;
  reveal_until: string | null;
};

type ProgressPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  round: RoundSummary | null;
  activity: ActivityRecord[];
  competitors: Competitor[];
  submissionUrgency: UrgencyState;
  votingUrgency: UrgencyState;
  leagueName?: string;
};

/**
 * Panel containing progress tracking content:
 * - DualNeedleGauge at top
 * - ProgressSection with submission/voting trackers
 * - Countdown timer when in revealed phase
 */
export default function ProgressPanel({
  isOpen,
  onClose,
  round,
  activity,
  competitors,
  submissionUrgency,
  votingUrgency,
  leagueName,
}: ProgressPanelProps) {
  // Swipe-to-close state
  const panelRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    const isRightSwipe = deltaX > 80;

    if (isHorizontalSwipe && isRightSwipe) {
      onClose();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const showProgress = round && (round.status === "open" || round.status === "voting") && competitors.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx("side-panel-backdrop", isOpen && "open")}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        className={clsx("side-panel side-panel-progress", isOpen && "open")}
        role="dialog"
        aria-modal="true"
        aria-label="Progress tracking"
        aria-hidden={!isOpen}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Rotated Cassette Banner Header */}
        <RotatedCassetteBanner
          leagueName={leagueName}
          roundName={round?.theme}
          onClose={onClose}
        />

        {/* Round title and status */}
        {round && (
          <div className="side-panel-title-row">
            <h2 className="side-panel-round-title">{round.theme}</h2>
            <span className={clsx("side-panel-status-badge", `status-${round.status}`)}>
              {round.status === "open" ? "Submissions" :
               round.status === "voting" ? "Voting" :
               round.status === "revealed" ? "Revealed" : round.status}
            </span>
          </div>
        )}

        {/* Countdown Timer - only for revealed phase */}
        {round && round.status === "revealed" && (
          <RoundCountdown
            status={round.status}
            revealUntil={round.reveal_until}
          />
        )}

        {/* Content */}
        <div className="side-panel-content">
          {showProgress && (
            <>
              {/* Gauge at top */}
              <div className="progress-panel-gauge-section">
                <DualNeedleGauge
                  submissionPct={submissionUrgency.pct}
                  votingPct={votingUrgency.pct}
                  submissionLevel={submissionUrgency.level}
                  votingLevel={votingUrgency.level}
                  size="md"
                  roundStatus={round.status}
                />
              </div>

              {/* Progress Section */}
              <div className="progress-panel-section">
                <ProgressSection
                  activity={activity}
                  competitors={competitors}
                  roundStatus={round.status}
                  submissionDeadline={round.submission_deadline}
                  votingDeadline={round.voting_deadline}
                />
              </div>
            </>
          )}

          {round && round.status === "revealed" && (
            <div className="progress-panel-revealed">
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 20px" }}>
                Round is revealed! Check the Playlist panel for results.
              </p>
            </div>
          )}

          {!round && (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>
              No active round.
            </p>
          )}

          {round && competitors.length === 0 && round.status !== "revealed" && (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>
              No competitors found for this round.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
