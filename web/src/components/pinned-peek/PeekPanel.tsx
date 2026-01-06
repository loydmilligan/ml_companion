import { useEffect, useState } from "react";
import clsx from "clsx";
import SongCard from "./SongCard";
import AIAssistant from "./AIAssistant";
import RoundChallenge from "./RoundChallenge";
import ExpandableSection from "./ExpandableSection";
import ActivityTracker from "./ActivityTracker";
import TimelineGameModal from "./TimelineGameModal";
import { useYouTubeSidebar } from "../youtube-sidebar";
import { useSubmitterGuess } from "./useSubmitterGuess";

type SubmissionRow = {
  id: string;
  title: string;
  artist: string | null;
  link: string | null;
  artwork_url: string | null;
  submitter_name?: string | null;
  youtube_url?: string | null;
  spotify_url?: string | null;
  submitter_comment?: string | null;
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

type Competitor = {
  id: string;
  name: string;
  profile_id: string | null;
};

type RoundSummary = {
  id: string;
  theme: string;
  theme_description: string | null;
  theme_author: string | null;
  theme_image_url: string | null;
  status: "open" | "voting" | "revealed" | "archived";
  submission_deadline: string | null;
  voting_deadline: string | null;
  playlist_url: string | null;
  external_playlist_url: string | null;
  youtube_playlist_url: string | null;
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
  competitors: Competitor[];
  isVotingComplete: boolean;
  onQuoteSong: (song: SubmissionRow) => void;
  narrative?: string | null;
  previousRoundChallenge?: {
    song1: { title: string; artist: string; theme: string } | null;
    song2: { title: string; artist: string; theme: string } | null;
  } | null;
  roundChallengeEnabled?: boolean;
  submitterGuessEnabled?: boolean;
  timelineGameEnabled?: boolean;
  timelineGamePhase?: "voting" | "revealed" | "both";
  isTimelineTester?: boolean;
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
  competitors,
  isVotingComplete,
  onQuoteSong,
  narrative,
  previousRoundChallenge,
  roundChallengeEnabled = true,
  submitterGuessEnabled = true,
  timelineGameEnabled = false,
  timelineGamePhase = "voting",
  isTimelineTester = false,
}: PeekPanelProps) {
  const { openPlaylist } = useYouTubeSidebar();
  const [isTimelineGameOpen, setIsTimelineGameOpen] = useState(false);

  // Submitter guess state
  const isRevealed = round?.status === "revealed";
  const showGuessUI = submitterGuessEnabled && (round?.status === "voting" || round?.status === "revealed");

  // Timeline game visibility
  const showTimelineGame =
    timelineGameEnabled &&
    isTimelineTester &&
    round &&
    (
      (timelineGamePhase === "voting" && round.status === "voting") ||
      (timelineGamePhase === "revealed" && round.status === "revealed") ||
      (timelineGamePhase === "both" && (round.status === "voting" || round.status === "revealed"))
    );
  const {
    competitors: guessCompetitors,
    guessStates,
    leaderboard,
    correctCount,
    totalGuessed,
    maxPossibleGuesses,
    handleGuessChange,
    handleSaveGuess,
  } = useSubmitterGuess(
    round?.id ?? null,
    groupId,
    submissions,
    isRevealed ?? false
  );

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
              {(round.status === "open" || round.status === "voting") && competitors.length > 0 && (
                <div className="peek-panel-section">
                  <ActivityTracker
                    activity={activity}
                    competitors={competitors}
                    activityType="submitted"
                    roundStatus={round.status}
                    deadline={round.submission_deadline}
                  />
                  <ActivityTracker
                    activity={activity}
                    competitors={competitors}
                    activityType="voted"
                    roundStatus={round.status}
                    deadline={round.voting_deadline}
                  />
                </div>
              )}

              {/* AI Assistant (only during open phase - hidden during voting) */}
              {round.status === "open" && (
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

              {/* Submitter Guess Header - shows score and leaderboard */}
              {showGuessUI && groupId && (
                <div className="peek-panel-section submitter-guess-header-section">
                  <div className="submitter-guess-header">
                    <h3>Guess the Submitter</h3>
                    {maxPossibleGuesses > 0 && (
                      <span className="submitter-guess-score">
                        {isRevealed
                          ? `${correctCount}/${maxPossibleGuesses} correct`
                          : `${totalGuessed}/${maxPossibleGuesses} guessed`}
                      </span>
                    )}
                  </div>
                  <p className="submitter-guess-intro">
                    {isRevealed
                      ? "Results are in! See how you did."
                      : "Who submitted each song? Guess below!"}
                  </p>
                  {/* Leaderboard - shown when revealed */}
                  {isRevealed && leaderboard.length > 0 && (
                    <div className="submitter-guess-leaderboard">
                      <h4>Top Guessers</h4>
                      <div className="leaderboard-list">
                        {leaderboard.map((entry, index) => (
                          <div key={entry.guesser_id} className="leaderboard-entry">
                            <span className="leaderboard-rank">
                              {index === 0 ? "1st" : index === 1 ? "2nd" : "3rd"}
                            </span>
                            <span className="leaderboard-name">{entry.guesser_name}</span>
                            <span className="leaderboard-score">
                              {entry.correct_count}/{entry.total_guesses}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Playlist Links */}
              {(round.status === "voting" || round.status === "revealed") && (round.playlist_url || round.external_playlist_url || round.youtube_playlist_url) && (
                <div className="peek-panel-section playlist-link-section">
                  {(round.playlist_url || round.external_playlist_url) && (
                    <a
                      href={round.playlist_url || round.external_playlist_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="playlist-link"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      <span>Spotify</span>
                    </a>
                  )}
                  {round.youtube_playlist_url && (
                    <button
                      type="button"
                      className="playlist-link playlist-link-youtube"
                      onClick={() => openPlaylist(round.youtube_playlist_url!, `${round.theme} Playlist`)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <span>YouTube</span>
                    </button>
                  )}
                </div>
              )}

              {/* Timeline Game Button */}
              {showTimelineGame && (
                <div className="peek-panel-section">
                  <button
                    type="button"
                    className="timeline-game-button"
                    onClick={() => setIsTimelineGameOpen(true)}
                  >
                    <span className="timeline-game-icon">🎵</span>
                    <span>Play Song Timeline</span>
                  </button>
                  <style>{`
                    .timeline-game-button {
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      gap: 8px;
                      width: 100%;
                      padding: 12px 16px;
                      background: linear-gradient(135deg, var(--accent), var(--accent-secondary, var(--accent)));
                      color: white;
                      border: none;
                      border-radius: 10px;
                      font-size: 0.95rem;
                      font-weight: 600;
                      cursor: pointer;
                      transition: transform 0.15s ease, box-shadow 0.15s ease;
                    }
                    .timeline-game-button:hover {
                      transform: scale(1.02);
                      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    }
                    .timeline-game-button:active {
                      transform: scale(0.98);
                    }
                    .timeline-game-icon {
                      font-size: 1.2rem;
                    }
                  `}</style>
                </div>
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
                      guessEnabled={showGuessUI}
                      guessState={guessStates[song.id]}
                      competitors={guessCompetitors}
                      isRevealed={isRevealed ?? false}
                      onGuessChange={(competitorId) => handleGuessChange(song.id, competitorId)}
                      onSaveGuess={() => handleSaveGuess(song.id)}
                    />
                  ))}
                </div>
              )}

              {/* Awards (if voting complete) */}
              {isVotingComplete && awards.length > 0 && (
                <ExpandableSection title="Round Awards" badge={awards.length} defaultExpanded>
                  {awards.map((award) => (
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
                </ExpandableSection>
              )}

              {/* Round Story (if available) */}
              {isVotingComplete && narrative && (
                <ExpandableSection title="Round Story">
                  <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>
                    {narrative}
                  </p>
                </ExpandableSection>
              )}

              {/* All Songs */}
              {isVotingComplete && restOfSongs.length > 0 ? (
                <ExpandableSection
                  title="All Songs"
                  badge={restOfSongs.length}
                >
                  {restOfSongs.map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      votes={song.votes}
                      showSubmitter={isVotingComplete}
                      showVotes={isVotingComplete}
                      onQuote={() => onQuoteSong(song)}
                      guessEnabled={showGuessUI}
                      guessState={guessStates[song.id]}
                      competitors={guessCompetitors}
                      isRevealed={isRevealed ?? false}
                      onGuessChange={(competitorId) => handleGuessChange(song.id, competitorId)}
                      onSaveGuess={() => handleSaveGuess(song.id)}
                    />
                  ))}
                </ExpandableSection>
              ) : (
                <div className="peek-panel-section">
                  <h3>Songs</h3>
                  {rankedSubmissions.map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      votes={song.votes}
                      showSubmitter={isVotingComplete}
                      showVotes={isVotingComplete}
                      onQuote={() => onQuoteSong(song)}
                      guessEnabled={showGuessUI}
                      guessState={guessStates[song.id]}
                      competitors={guessCompetitors}
                      isRevealed={isRevealed ?? false}
                      onGuessChange={(competitorId) => handleGuessChange(song.id, competitorId)}
                      onSaveGuess={() => handleSaveGuess(song.id)}
                    />
                  ))}
                  {submissions.length === 0 && (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      No songs submitted yet.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {!round && (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>
              No active round.
            </p>
          )}
        </div>
      </aside>

      {/* Timeline Game Modal */}
      <TimelineGameModal
        isOpen={isTimelineGameOpen}
        onClose={() => setIsTimelineGameOpen(false)}
        roundId={round?.id ?? null}
        groupId={groupId}
        isRevealed={isRevealed ?? false}
      />
    </>
  );
}
