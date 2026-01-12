import { useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useTimelineGame } from "../pinned-peek/useTimelineGame";
import TimelineSongItem from "./TimelineSongItem";
import Button from "../Button";

type TimelineGameProps = {
  roundId: string | null;
  groupId: string | null;
  isRevealed: boolean;
};

/**
 * Parse title to remove remastered hints that could reveal release year.
 * Removes everything from "remaster" onwards (case-insensitive).
 */
function cleanTitle(title: string): string {
  const remasterIndex = title.toLowerCase().indexOf("remaster");
  if (remasterIndex === -1) return title;

  // Find where to cut - look for common patterns before "remaster"
  // e.g., " - Remastered", " (Remastered", " [Remastered"
  let cutIndex = remasterIndex;
  const beforeRemaster = title.slice(0, remasterIndex);

  // Check for separators before "remaster"
  const separators = [" - ", " (", " [", " / "];
  for (const sep of separators) {
    const lastSep = beforeRemaster.lastIndexOf(sep);
    if (lastSep !== -1 && lastSep > cutIndex - 10) {
      cutIndex = lastSep;
      break;
    }
  }

  return title.slice(0, cutIndex).trim();
}

export default function TimelineGame({
  roundId,
  groupId,
  isRevealed,
}: TimelineGameProps) {
  const {
    submissions,
    currentOrder,
    attemptNumber,
    hintMessage,
    isLocked,
    loading,
    correctOrder,
    finalScore,
    setOrder,
    submitOrder,
    leaderboard,
    isSubmitting,
    canPlay,
    reload,
  } = useTimelineGame(roundId, groupId, isRevealed);

  // Reload data when component mounts
  useEffect(() => {
    reload();
  }, [reload]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Map submission IDs to submission data
  const submissionMap = useMemo(() => {
    const map = new Map<string, typeof submissions[0]>();
    submissions.forEach((s) => map.set(s.id, s));
    return map;
  }, [submissions]);

  // Calculate correctness for each position (only when revealed)
  const correctnessMap = useMemo(() => {
    if (!isRevealed || !correctOrder) return new Map<string, boolean>();
    const map = new Map<string, boolean>();
    currentOrder.forEach((id, index) => {
      map.set(id, correctOrder[index] === id);
    });
    return map;
  }, [isRevealed, correctOrder, currentOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = currentOrder.indexOf(active.id as string);
      const newIndex = currentOrder.indexOf(over.id as string);
      const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
      setOrder(newOrder);
    }
  };

  if (loading) {
    return (
      <div className="timeline-game-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!canPlay) {
    return (
      <div className="timeline-game-unavailable">
        <img
          src="/images/minigames/timeline-game.png"
          alt="Timeline Game"
          className="timeline-game-promo-image"
        />
        <h3>Timeline Game</h3>
        <p>Not available yet.</p>
        <p className="timeline-game-hint">
          All songs need release year data for this game.
        </p>
      </div>
    );
  }

  return (
    <div className="timeline-game">
      <div className="timeline-game-intro">
        <h3>Timeline Game</h3>
        <p>
          {isRevealed
            ? "Results are in! See how you did."
            : isLocked
            ? "Your answer is locked. Results shown when round ends."
            : "Arrange songs from oldest to newest."}
        </p>
        {!isLocked && attemptNumber <= 2 && (
          <div className="timeline-game-attempt">
            Attempt {attemptNumber}/2
          </div>
        )}
      </div>

      {hintMessage && !isLocked && (
        <div className="timeline-game-hint-message">{hintMessage}</div>
      )}

      {/* Leaderboard (when revealed) */}
      {isRevealed && leaderboard.length > 0 && (
        <div className="timeline-game-leaderboard">
          <h4>Top Scores</h4>
          <div className="leaderboard-list">
            {leaderboard.map((entry, index) => (
              <div key={entry.player_id} className="leaderboard-entry">
                <span className="leaderboard-rank">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                </span>
                <span className="leaderboard-name">{entry.player_name}</span>
                <span className="leaderboard-score">
                  {entry.correct_count}/{submissions.length}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score display */}
      {isRevealed && finalScore !== null && (
        <div className="timeline-game-score">
          Your Score: <span className="timeline-game-score-value">{finalScore}/{submissions.length}</span>
        </div>
      )}

      {/* Timeline track with songs */}
      <div className="timeline-game-track-wrapper">
        <div className="timeline-game-track">
          <div className="timeline-game-track-label timeline-game-track-label-top">
            Oldest
          </div>
          <div className="timeline-game-track-line" />
          <div className="timeline-game-track-label timeline-game-track-label-bottom">
            Newest
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={currentOrder}
            strategy={verticalListSortingStrategy}
          >
            <div className="timeline-game-songs">
              {currentOrder.map((id) => {
                const sub = submissionMap.get(id);
                if (!sub) return null;
                return (
                  <TimelineSongItem
                    key={id}
                    id={id}
                    artworkUrl={sub.artwork_url}
                    title={cleanTitle(sub.title)}
                    artist={sub.artist}
                    releaseYear={sub.release_year}
                    showYear={isRevealed}
                    isCorrect={isRevealed ? correctnessMap.get(id) : null}
                    disabled={isLocked}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Submit button */}
      {!isLocked && !isRevealed && (
        <div className="timeline-game-actions">
          <Button
            type="button"
            onClick={submitOrder}
            disabled={isSubmitting || loading}
            style={{ width: "100%" }}
          >
            {isSubmitting
              ? "Submitting..."
              : attemptNumber === 1
              ? "Submit Order"
              : "Final Submit"}
          </Button>
        </div>
      )}
    </div>
  );
}
