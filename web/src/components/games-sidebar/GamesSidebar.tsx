import { useEffect, useRef, useCallback, useState } from "react";
import clsx from "clsx";
import { useGamesSidebar, type GameTab } from "./GamesSidebarContext";
import { useSubmitterGuess } from "../pinned-peek/useSubmitterGuess";
import { useRound } from "../../contexts/RoundContext";
import { useAuth } from "../../contexts/AuthContext";
import TimelineGameModal from "../pinned-peek/TimelineGameModal";
import RoundChallengeModal from "../pinned-peek/RoundChallengeModal";
import GuessSongCard from "./GuessSongCard";

type GamesSidebarProps = {
  roundChallengeEnabled?: boolean;
  roundChallengePhase?: "open" | "voting" | "both";
  submitterGuessEnabled?: boolean;
  timelineGameEnabled?: boolean;
  timelineGamePhase?: "voting" | "revealed" | "both";
  isTimelineTester?: boolean;
};

export default function GamesSidebar({
  roundChallengeEnabled = true,
  roundChallengePhase = "open",
  submitterGuessEnabled = true,
  timelineGameEnabled = false,
  timelineGamePhase = "voting",
  isTimelineTester = false,
}: GamesSidebarProps) {
  const { isOpen, activeTab, setActiveTab, closeSidebar } = useGamesSidebar();
  const { round, submissions } = useRound();
  const { group } = useAuth();
  const groupId = group?.id ?? null;

  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isRoundChallengeModalOpen, setIsRoundChallengeModalOpen] = useState(false);

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
      closeSidebar();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [closeSidebar]);

  // Submitter guess state
  const isRevealed = round?.status === "revealed";
  const showGuessUI = submitterGuessEnabled && (round?.status === "voting" || round?.status === "revealed");

  // Game visibility
  const showTimelineGame = !!(
    timelineGameEnabled &&
    isTimelineTester &&
    round &&
    (
      (timelineGamePhase === "voting" && round.status === "voting") ||
      (timelineGamePhase === "revealed" && round.status === "revealed") ||
      (timelineGamePhase === "both" && (round.status === "voting" || round.status === "revealed"))
    )
  );

  const showRoundChallenge = !!(
    roundChallengeEnabled &&
    round &&
    (
      (roundChallengePhase === "open" && round.status === "open") ||
      (roundChallengePhase === "voting" && round.status === "voting") ||
      (roundChallengePhase === "both" && (round.status === "open" || round.status === "voting"))
    )
  );

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
        closeSidebar();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeSidebar]);

  // Tab definitions
  const tabs: { id: GameTab; label: string; icon: string; available: boolean }[] = [
    { id: "submitter-guess", label: "Guess", icon: "🎯", available: showGuessUI },
    { id: "timeline", label: "Timeline", icon: "📅", available: showTimelineGame },
    { id: "round-challenge", label: "Challenge", icon: "🎮", available: showRoundChallenge },
  ];

  const availableTabs = tabs.filter((t) => t.available);

  // Handle tab click for modal-based games
  const handleTabClick = (tabId: GameTab) => {
    if (tabId === "timeline") {
      setIsTimelineModalOpen(true);
      closeSidebar();
    } else if (tabId === "round-challenge") {
      setIsRoundChallengeModalOpen(true);
      closeSidebar();
    } else {
      setActiveTab(tabId);
    }
  };

  // Render content based on active tab
  const renderContent = () => {
    if (activeTab === "submitter-guess" && showGuessUI) {
      return (
        <div className="games-sidebar-content">
          <div className="games-sidebar-section">
            <div className="games-sidebar-intro">
              <h3>Guess the Submitter</h3>
              <p>
                {isRevealed
                  ? "Results are in! See how you did."
                  : "Who submitted each song? Make your guesses below."}
              </p>
              {maxPossibleGuesses > 0 && (
                <div className="games-sidebar-progress">
                  {isRevealed
                    ? `${correctCount}/${maxPossibleGuesses} correct`
                    : `${totalGuessed}/${maxPossibleGuesses} guessed`}
                </div>
              )}
            </div>

            {/* Leaderboard (when revealed) */}
            {isRevealed && leaderboard.length > 0 && (
              <div className="games-sidebar-leaderboard">
                <h4>Top Guessers</h4>
                <div className="leaderboard-list">
                  {leaderboard.map((entry, index) => (
                    <div key={entry.guesser_id} className="leaderboard-entry">
                      <span className="leaderboard-rank">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
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

            {/* Song list for guessing */}
            <div className="games-sidebar-songs">
              {submissions.map((song) => (
                <GuessSongCard
                  key={song.id}
                  song={song}
                  guessEnabled={showGuessUI}
                  guessState={guessStates[song.id]}
                  competitors={guessCompetitors}
                  isRevealed={isRevealed ?? false}
                  onGuessChange={(competitorId) => handleGuessChange(song.id, competitorId)}
                  onSaveGuess={() => handleSaveGuess(song.id)}
                />
              ))}
              {submissions.length === 0 && (
                <p className="games-sidebar-empty">
                  No songs available yet. Check back when voting starts.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "timeline" && showTimelineGame) {
      return (
        <div className="games-sidebar-content">
          <div className="games-sidebar-section games-sidebar-coming-soon">
            <img
              src="/images/minigames/timeline-game.png"
              alt="Timeline Game"
              className="games-sidebar-game-image"
            />
            <h3>Timeline Game</h3>
            <p>Arrange songs by release year</p>
            <button
              type="button"
              className="games-sidebar-play-btn"
              onClick={() => {
                setIsTimelineModalOpen(true);
                closeSidebar();
              }}
            >
              Play Now
            </button>
          </div>
        </div>
      );
    }

    if (activeTab === "round-challenge" && showRoundChallenge) {
      return (
        <div className="games-sidebar-content">
          <div className="games-sidebar-section games-sidebar-coming-soon">
            <img
              src="/images/minigames/round-challenge.png"
              alt="Round Challenge"
              className="games-sidebar-game-image"
            />
            <h3>Round Challenge</h3>
            <p>Match songs to Season 1 themes</p>
            <button
              type="button"
              className="games-sidebar-play-btn"
              onClick={() => {
                setIsRoundChallengeModalOpen(true);
                closeSidebar();
              }}
            >
              Play Now
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="games-sidebar-content">
        <div className="games-sidebar-section games-sidebar-no-games">
          <p>No games available right now.</p>
          <p className="games-sidebar-hint">
            Games become available during different round phases.
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx("games-sidebar-backdrop", isOpen && "open")}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        className={clsx("games-sidebar", isOpen && "open")}
        role="dialog"
        aria-modal="true"
        aria-label="Minigames"
        aria-hidden={!isOpen}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="games-sidebar-header">
          <h2 className="games-sidebar-title">Minigames</h2>
          <button
            type="button"
            className="games-sidebar-close"
            onClick={closeSidebar}
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        {/* Tab bar */}
        {availableTabs.length > 0 && (
          <div className="games-sidebar-tabs">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={clsx(
                  "games-sidebar-tab",
                  activeTab === tab.id && "active"
                )}
                onClick={() => handleTabClick(tab.id)}
              >
                <span className="games-sidebar-tab-icon">{tab.icon}</span>
                <span className="games-sidebar-tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {renderContent()}
      </aside>

      {/* Timeline Game Modal */}
      <TimelineGameModal
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
        roundId={round?.id ?? null}
        groupId={groupId}
        isRevealed={isRevealed ?? false}
      />

      {/* Round Challenge Modal */}
      <RoundChallengeModal
        isOpen={isRoundChallengeModalOpen}
        onClose={() => setIsRoundChallengeModalOpen(false)}
        roundId={round?.id ?? null}
        groupId={groupId}
        isRevealed={isRoundChallengeRevealed ?? false}
      />
    </>
  );
}
