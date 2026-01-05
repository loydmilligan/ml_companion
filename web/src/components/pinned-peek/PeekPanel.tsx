import { useEffect } from "react";
import clsx from "clsx";
import SongCard from "./SongCard";
import AIAssistant from "./AIAssistant";
import RoundChallenge from "./RoundChallenge";
import SubmitterGuess from "./SubmitterGuess";
import ActivityTracker from "./ActivityTracker";

type SubmissionRow = {
  id: string;
  title: string;
  artist: string | null;
  link: string | null;
  artwork_url: string | null;
  submitter_name?: string | null;
};

type VoteRow = {
  submission_id: string;
  voter_id: string | null;
  voter_name: string | null;
  points: number | null;
};

type RoundAwardRow = {
  id: string;
  award_name: string;
  award_description: string | null;
  trophy_url: string | null;
  winner_name: string | null;
};

type ActivityRecord = {
  id: string;
  actor_name: string;
  activity_type: "submitted" | "voted";
  profile_id: string | null;
};

type RoundSummary = {
  id: string;
  theme: string;
  theme_description: string | null;
  theme_author: string | null;
  theme_image_url: string | null;
  status: "open" | "voting" | "revealed" | "archived";
};

type PeekPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  round: RoundSummary | null;
  groupId: string | null;
  submissions: SubmissionRow[];
  votes: VoteRow[];
  awards: RoundAwardRow[];
  activity: ActivityRecord[];
  totalMembers: number;
  isVotingComplete: boolean;
  onQuoteSong: (song: SubmissionRow) => void;
  narrative?: string | null;
  previousRoundChallenge?: {
    song1: { title: string; artist: string; theme: string } | null;
    song2: { title: string; artist: string; theme: string } | null;
  } | null;
  roundChallengeEnabled?: boolean;
  submitterGuessEnabled?: boolean;
};

export default function PeekPanel({
  isOpen,
  onClose,
  round,
  groupId,
  submissions,
  votes,
  awards,
  activity,
  totalMembers,
  isVotingComplete,
  onQuoteSong,
  narrative,
  previousRoundChallenge,
  roundChallengeEnabled = true,
  submitterGuessEnabled = true,
}: PeekPanelProps) {
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

  // Calculate rankings if voting is complete
  const rankedSubmissions = isVotingComplete
    ? submissions
        .map((song) => {
          const songVotes = votes.filter((v) => v.submission_id === song.id);
          const totalPoints = songVotes.reduce((sum, v) => sum + (v.points ?? 0), 0);
          return { ...song, points: totalPoints, votes: songVotes };
        })
        .sort((a, b) => b.points - a.points)
    : submissions.map((song) => ({ ...song, points: 0, votes: [] }));

  const top3 = rankedSubmissions.slice(0, 3);
  const restOfSongs = rankedSubmissions.slice(3);

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx("peek-panel-backdrop", isOpen && "open")}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={clsx("peek-panel", isOpen && "open")}
        role="dialog"
        aria-modal="true"
        aria-label="Round details"
        aria-hidden={!isOpen}
      >
        {/* Header with banner */}
        <div className="peek-panel-header">
          {round?.theme_image_url ? (
            <img
              src={round.theme_image_url}
              alt={round.theme}
              className="peek-panel-banner"
            />
          ) : (
            <div className="peek-panel-banner" />
          )}
          <button
            type="button"
            className="peek-panel-close"
            onClick={onClose}
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="peek-panel-content">
          {round && (
            <>
              {/* Theme info */}
              <div className="peek-panel-section">
                <h2 style={{ margin: "0 0 4px 0", fontSize: "1.2rem" }}>
                  {round.theme}
                </h2>
                {round.theme_description && (
                  <p style={{ margin: "0 0 4px 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    {round.theme_description}
                  </p>
                )}
                {round.theme_author && (
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    Theme by {round.theme_author}
                  </p>
                )}
              </div>

              {/* Activity Trackers (during open/voting phases) */}
              {(round.status === "open" || round.status === "voting") && activity.length > 0 && (
                <div className="peek-panel-section">
                  <ActivityTracker
                    activity={activity}
                    totalMembers={totalMembers}
                    activityType="submitted"
                    roundStatus={round.status}
                  />
                  <ActivityTracker
                    activity={activity}
                    totalMembers={totalMembers}
                    activityType="voted"
                    roundStatus={round.status}
                  />
                </div>
              )}

              {/* AI Assistant (only during open/voting phase) */}
              {(round.status === "open" || round.status === "voting") && (
                <AIAssistant round={round} />
              )}

              {/* Round Challenge (only during open phase, if enabled) */}
              {round.status === "open" && roundChallengeEnabled && (
                <RoundChallenge
                  roundId={round.id}
                  groupId={groupId}
                  currentTheme={round.theme}
                  previousRoundChallenge={previousRoundChallenge}
                />
              )}

              {/* Submitter Guess (during voting phase or revealed, if enabled) */}
              {(round.status === "voting" || round.status === "revealed") && submitterGuessEnabled && groupId && (
                <SubmitterGuess
                  roundId={round.id}
                  groupId={groupId}
                  submissions={submissions}
                  isRevealed={round.status === "revealed"}
                />
              )}

              {/* Top 3 Results (if voting complete) */}
              {isVotingComplete && top3.length > 0 && (
                <div className="peek-panel-section">
                  <h3>Top Songs</h3>
                  {top3.map((song, index) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      votes={song.votes}
                      rank={index + 1}
                      showSubmitter={isVotingComplete}
                      showVotes={isVotingComplete}
                      onQuote={() => onQuoteSong(song)}
                    />
                  ))}
                </div>
              )}

              {/* Awards (if voting complete) */}
              {isVotingComplete && awards.length > 0 && (
                <div className="peek-panel-section">
                  <h3>Round Awards</h3>
                  {awards.slice(0, 3).map((award) => (
                    <div key={award.id} className="award-card">
                      {award.trophy_url ? (
                        <img
                          src={award.trophy_url}
                          alt={award.award_name}
                          className="award-card-trophy"
                        />
                      ) : (
                        <div className="award-card-trophy" />
                      )}
                      <div className="award-card-info">
                        <p className="award-card-name">{award.award_name}</p>
                        <p className="award-card-winner">{award.winner_name}</p>
                      </div>
                      {award.award_description && (
                        <div className="award-card-tooltip">
                          {award.award_description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Round Story (if available) */}
              {isVotingComplete && narrative && (
                <div className="peek-panel-section">
                  <h3>Round Story</h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.6 }}>
                    {narrative}
                  </p>
                </div>
              )}

              {/* All Songs */}
              <div className="peek-panel-section">
                <h3>{isVotingComplete ? "All Songs" : "Songs"}</h3>
                {(isVotingComplete ? restOfSongs : rankedSubmissions).map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    votes={song.votes}
                    showSubmitter={isVotingComplete}
                    showVotes={isVotingComplete}
                    onQuote={() => onQuoteSong(song)}
                  />
                ))}
                {submissions.length === 0 && (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    No songs submitted yet.
                  </p>
                )}
              </div>
            </>
          )}

          {!round && (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>
              No active round.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
