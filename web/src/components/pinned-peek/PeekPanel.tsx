import { useEffect, useState, useRef, useCallback } from "react";
import clsx from "clsx";
import SongCard from "./SongCard";
import AIAssistant from "./AIAssistant";
import CollapsibleSection from "./CollapsibleSection";
import ProgressSection from "./ProgressSection";
import RoundCountdown from "./RoundCountdown";
import TimelineGameModal from "./TimelineGameModal";
import RoundChallengeModal from "./RoundChallengeModal";
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
  reveal_until: string | null;
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
  roundChallengeEnabled?: boolean;
  roundChallengePhase?: "open" | "voting" | "both";
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
  roundChallengeEnabled = true,
  roundChallengePhase = "open",
  submitterGuessEnabled = true,
  timelineGameEnabled = false,
  timelineGamePhase = "voting",
  isTimelineTester = false,
}: PeekPanelProps) {
  const { openPlaylist } = useYouTubeSidebar();
  const [isTimelineGameOpen, setIsTimelineGameOpen] = useState(false);
  const [isRoundChallengeOpen, setIsRoundChallengeOpen] = useState(false);

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

    // Require horizontal swipe: deltaX > 80px and more horizontal than vertical
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    const isRightSwipe = deltaX > 80;

    if (isHorizontalSwipe && isRightSwipe) {
      onClose();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [onClose]);

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

  // Round Challenge visibility based on phase setting
  const showRoundChallenge =
    roundChallengeEnabled &&
    round &&
    (
      (roundChallengePhase === "open" && round.status === "open") ||
      (roundChallengePhase === "voting" && round.status === "voting") ||
      (roundChallengePhase === "both" && (round.status === "open" || round.status === "voting"))
    );

  // Round Challenge answer revelation:
  // - "open" phase: reveal when voting starts (status becomes "voting" or "revealed")
  // - "voting" phase: reveal when voting ends (status becomes "revealed")
  // - "both" phases: reveal when voting ends (status becomes "revealed")
  const isRoundChallengeRevealed =
    (roundChallengePhase === "open" && (round?.status === "voting" || round?.status === "revealed")) ||
    ((roundChallengePhase === "voting" || roundChallengePhase === "both") && round?.status === "revealed");
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
        ref={panelRef}
        className={clsx("peek-panel", isOpen && "open")}
        role="dialog"
        aria-modal="true"
        aria-label="Round details"
        aria-hidden={!isOpen}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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

        {/* Round title and status */}
        {round && (
          <div className="peek-panel-title-row">
            <h2 className="peek-panel-round-title">{round.theme}</h2>
            <span className={clsx("peek-panel-status-badge", `status-${round.status}`)}>
              {round.status === "open" ? "Submissions Open" :
               round.status === "voting" ? "Voting" :
               round.status === "revealed" ? "Revealed" : round.status}
            </span>
          </div>
        )}

        {/* Countdown Timer - only for revealed phase (2hr until new round) */}
        {round && round.status === "revealed" && (
          <RoundCountdown
            status={round.status}
            revealUntil={round.reveal_until}
          />
        )}

        {/* Content */}
        <div className="peek-panel-content">
          {round && (
            <>
              {/* Theme description and author */}
              {(round.theme_description || round.theme_author) && (
                <div className="peek-panel-section peek-panel-theme-info">
                  {round.theme_description && (
                    <p className="theme-description">{round.theme_description}</p>
                  )}
                  {round.theme_author && (
                    <p className="theme-author">Theme by {round.theme_author}</p>
                  )}
                </div>
              )}

              {/* Progress Section (during open/voting phases) */}
              {(round.status === "open" || round.status === "voting") && competitors.length > 0 && (
                <CollapsibleSection
                  id="progress"
                  title="Progress"
                  icon="📊"
                  defaultExpanded={true}
                >
                  <ProgressSection
                    activity={activity}
                    competitors={competitors}
                    roundStatus={round.status}
                    submissionDeadline={round.submission_deadline}
                    votingDeadline={round.voting_deadline}
                  />
                </CollapsibleSection>
              )}

              {/* Playlist Section */}
              {(round.status === "voting" || round.status === "revealed") && (round.playlist_url || round.external_playlist_url || round.youtube_playlist_url) && (
                <CollapsibleSection
                  id="playlist"
                  title="Playlist"
                  icon="🎧"
                  defaultExpanded={true}
                >
                  <div className="playlist-link-buttons">
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
                </CollapsibleSection>
              )}

              {/* Minigames Section */}
              {((round.status === "open" && (roundChallengeEnabled || showGuessUI)) ||
                (round.status === "voting" && (showTimelineGame || showGuessUI)) ||
                (round.status === "revealed" && (showTimelineGame || showGuessUI))) && (
                <CollapsibleSection
                  id="minigames"
                  title="Minigames"
                  icon="🎮"
                  defaultExpanded={true}
                >
                  {/* AI Assistant (only during open phase) */}
                  {round.status === "open" && (
                    <AIAssistant round={round} />
                  )}

                  {/* Round Challenge - visibility based on phase setting */}
                  {showRoundChallenge && (
                    <button
                      type="button"
                      className="minigame-card"
                      onClick={() => {
                        setIsRoundChallengeOpen(true);
                        onClose();
                      }}
                    >
                      <img
                        src="/images/minigames/round-challenge.png"
                        srcSet="/images/minigames/round-challenge.png 1x,
                                /images/minigames/round-challenge@2x.png 2x,
                                /images/minigames/round-challenge@3x.png 3x"
                        alt=""
                        className="minigame-card-bg"
                      />
                      <div className="minigame-card-content">
                        <span className="minigame-card-title">Round Challenge</span>
                        <span className="minigame-card-subtitle">Match songs to Season 1 themes</span>
                      </div>
                    </button>
                  )}

                  {/* Timeline Game Card */}
                  {showTimelineGame && (
                    <button
                      type="button"
                      className="minigame-card"
                      onClick={() => {
                        setIsTimelineGameOpen(true);
                        onClose();
                      }}
                    >
                      <img
                        src="/images/minigames/timeline-game.png"
                        srcSet="/images/minigames/timeline-game.png 1x,
                                /images/minigames/timeline-game@2x.png 2x,
                                /images/minigames/timeline-game@3x.png 3x"
                        alt=""
                        className="minigame-card-bg"
                      />
                      <div className="minigame-card-content">
                        <span className="minigame-card-title">Timeline Game</span>
                        <span className="minigame-card-subtitle">Arrange songs by release year</span>
                      </div>
                    </button>
                  )}

                  {/* Submitter Guess Header */}
                  {showGuessUI && groupId && (
                    <div className="minigame-item minigame-with-card">
                      <div className="minigame-card-header">
                        <img
                          src="/images/minigames/guess-submitter.png"
                          srcSet="/images/minigames/guess-submitter.png 1x,
                                  /images/minigames/guess-submitter@2x.png 2x,
                                  /images/minigames/guess-submitter@3x.png 3x"
                          alt=""
                          className="minigame-card-bg"
                        />
                        <div className="minigame-card-content">
                          <span className="minigame-card-title">Guess the Submitter</span>
                          <span className="minigame-card-subtitle">
                            {isRevealed
                              ? "Results are in! See how you did below."
                              : "Choose who submitted each song below"}
                          </span>
                        </div>
                        {maxPossibleGuesses > 0 && (
                          <span className="minigame-card-badge">
                            {isRevealed
                              ? `${correctCount}/${maxPossibleGuesses}`
                              : `${totalGuessed}/${maxPossibleGuesses}`}
                          </span>
                        )}
                      </div>
                      {isRevealed && leaderboard.length > 0 && (
                        <div className="submitter-guess-leaderboard">
                          <h5>Top Guessers</h5>
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
                </CollapsibleSection>
              )}

              {/* Songs Section */}
              <CollapsibleSection
                id="songs"
                title="Songs"
                icon="🎵"
                badge={submissions.length}
                defaultExpanded={true}
              >
                {/* Top 3 Results (if voting complete) */}
                {isVotingComplete && top3.length > 0 && (
                  <div className="songs-subsection">
                    <h4 className="songs-subsection-title">Top Songs</h4>
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
                  <div className="songs-subsection awards-subsection">
                    <h4 className="songs-subsection-title">Round Awards</h4>
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
                  </div>
                )}

                {/* Round Story (if available) */}
                {isVotingComplete && narrative && (
                  <div className="songs-subsection">
                    <h4 className="songs-subsection-title">Round Story</h4>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>
                      {narrative}
                    </p>
                  </div>
                )}

                {/* Rest of Songs (if voting complete and there are more than 3) */}
                {isVotingComplete && restOfSongs.length > 0 && (
                  <div className="songs-subsection">
                    <h4 className="songs-subsection-title">All Songs ({restOfSongs.length})</h4>
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
                  </div>
                )}

                {/* All songs (if voting not complete) */}
                {!isVotingComplete && (
                  <>
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
                  </>
                )}
              </CollapsibleSection>
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

      {/* Round Challenge Modal */}
      <RoundChallengeModal
        isOpen={isRoundChallengeOpen}
        onClose={() => setIsRoundChallengeOpen(false)}
        roundId={round?.id ?? null}
        groupId={groupId}
        isRevealed={isRoundChallengeRevealed ?? false}
      />
    </>
  );
}
