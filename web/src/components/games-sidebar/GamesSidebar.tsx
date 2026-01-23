import { useEffect, useRef, useCallback } from "react";
import clsx from "clsx";
import { useGamesSidebar, type GameTab } from "../side-panels";
import { useSubmitterGuess } from "../pinned-peek/useSubmitterGuess";
import { useRound } from "../../contexts/RoundContext";
import { useAuth } from "../../contexts/AuthContext";
import GuessSongCard from "./GuessSongCard";
import RoundChallengeGame from "./RoundChallengeGame";
import TimelineGame from "./TimelineGame";
import RotatedCassetteBanner from "../side-panels/RotatedCassetteBanner";
import GuessResultsSection from "./GuessResultsSection";

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
  const { group, session } = useAuth();
  const groupId = group?.id ?? null;
  const userDisplayName = session?.user?.user_metadata?.display_name ?? session?.user?.email ?? "You";

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
      (timelineGamePhase === "both" && (round.status === "voting" || round.status === "revealed")) ||
      // Always show during revealed phase so users can view results
      round.status === "revealed"
    )
  );

  const showRoundChallenge = !!(
    roundChallengeEnabled &&
    round &&
    (
      (roundChallengePhase === "open" && round.status === "open") ||
      (roundChallengePhase === "voting" && round.status === "voting") ||
      (roundChallengePhase === "both" && (round.status === "open" || round.status === "voting")) ||
      // Always show during revealed phase so users can view results
      round.status === "revealed"
    )
  );

  const isRoundChallengeRevealed =
    (roundChallengePhase === "open" && (round?.status === "voting" || round?.status === "revealed")) ||
    ((roundChallengePhase === "voting" || roundChallengePhase === "both") && round?.status === "revealed");

  const {
    competitors: guessCompetitors,
    guessStates,
    leaderboard,
    topVotersPerSong,
    guessAggregatesPerSong,
    correctCount,
    totalGuessed,
    maxPossibleGuesses,
    handleGuessChange,
    handleSubmitGuess,
    handleAdminUnlock,
    isAdmin,
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

  // Determine disabled reasons for each game
  const getGuessDisabledReason = (): string | null => {
    if (!submitterGuessEnabled) return "Disabled by admin";
    if (!round) return "No active round";
    if (round.status === "open") return "Available during voting";
    if (round.status === "archived") return "Round archived";
    return null;
  };

  const getTimelineDisabledReason = (): string | null => {
    if (!timelineGameEnabled) return "Disabled by admin";
    if (!isTimelineTester) return "Beta testers only";
    if (!round) return "No active round";
    // Always available during revealed phase for viewing results
    if (round.status === "revealed") return null;
    // After early return, status can only be "open", "voting", or "archived"
    // Check if current phase matches the configured availability
    const inPhase =
      (timelineGamePhase === "voting" && round.status === "voting") ||
      (timelineGamePhase === "both" && round.status === "voting");
    // Note: timelineGamePhase === "revealed" case is not in inPhase since revealed status is handled above
    if (!inPhase) {
      if (timelineGamePhase === "voting") return "Available during voting";
      if (timelineGamePhase === "revealed") return "Available after reveal";
      return "Not available this phase";
    }
    return null;
  };

  const getChallengeDisabledReason = (): string | null => {
    if (!roundChallengeEnabled) return "Disabled by admin";
    if (!round) return "No active round";
    // Always available during revealed phase for viewing results
    if (round.status === "revealed") return null;
    const inPhase =
      (roundChallengePhase === "open" && round.status === "open") ||
      (roundChallengePhase === "voting" && round.status === "voting") ||
      (roundChallengePhase === "both" && (round.status === "open" || round.status === "voting"));
    if (!inPhase) {
      if (roundChallengePhase === "open") return "Available during submissions";
      if (roundChallengePhase === "voting") return "Available during voting";
      return "Not available this phase";
    }
    return null;
  };

  // Tab definitions with disabled reasons
  const tabs: { id: GameTab; label: string; icon: string; available: boolean; disabledReason: string | null }[] = [
    { id: "submitter-guess", label: "Guess", icon: "🎯", available: showGuessUI, disabledReason: getGuessDisabledReason() },
    { id: "timeline", label: "Timeline", icon: "📅", available: showTimelineGame, disabledReason: getTimelineDisabledReason() },
    { id: "round-challenge", label: "Challenge", icon: "🎮", available: showRoundChallenge, disabledReason: getChallengeDisabledReason() },
  ];

  // Handle tab click
  const handleTabClick = (tabId: GameTab, isAvailable: boolean) => {
    if (!isAvailable) return; // Don't do anything for disabled tabs
    setActiveTab(tabId);
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

            {/* Enhanced Results Section (when revealed) */}
            {isRevealed && (
              <GuessResultsSection
                groupId={groupId}
                leaderboard={leaderboard}
                correctCount={correctCount}
                maxPossibleGuesses={maxPossibleGuesses}
                userDisplayName={userDisplayName}
                isRevealed={isRevealed}
              />
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
                  topVoters={topVotersPerSong[song.id]}
                  guessAggregates={guessAggregatesPerSong[song.id]}
                  isAdmin={isAdmin}
                  onGuessChange={(competitorId) => handleGuessChange(song.id, competitorId)}
                  onSubmitGuess={() => handleSubmitGuess(song.id)}
                  onAdminUnlock={() => handleAdminUnlock(song.id)}
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
          <TimelineGame
            roundId={round?.id ?? null}
            groupId={groupId}
            isRevealed={isRevealed ?? false}
          />
        </div>
      );
    }

    if (activeTab === "round-challenge" && showRoundChallenge) {
      return (
        <div className="games-sidebar-content">
          <RoundChallengeGame
            roundId={round?.id ?? null}
            groupId={groupId}
            isRevealed={isRoundChallengeRevealed ?? false}
          />
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
        {/* Rotated Cassette Banner Header */}
        <RotatedCassetteBanner
          roundNumber={round?.round_number}
          onClose={closeSidebar}
        />

        {/* Tab bar - always show all tabs */}
        <div className="games-sidebar-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={clsx(
                "games-sidebar-tab",
                activeTab === tab.id && tab.available && "active",
                !tab.available && "disabled"
              )}
              onClick={() => handleTabClick(tab.id, tab.available)}
              disabled={!tab.available}
              title={tab.disabledReason ?? undefined}
            >
              <span className="games-sidebar-tab-icon">{tab.icon}</span>
              <span className="games-sidebar-tab-label">{tab.label}</span>
              {tab.disabledReason && (
                <span className="games-sidebar-tab-hint">{tab.disabledReason}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {renderContent()}
      </aside>

    </>
  );
}
