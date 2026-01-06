import { useMemo } from "react";
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
import { useTimelineGame } from "./useTimelineGame";
import { TimelineSongCard } from "./TimelineSongCard";
import Button from "../Button";

type TimelineGameModalProps = {
  isOpen: boolean;
  onClose: () => void;
  roundId: string | null;
  groupId: string | null;
  isRevealed: boolean;
};

export function TimelineGameModal({
  isOpen,
  onClose,
  roundId,
  groupId,
  isRevealed,
}: TimelineGameModalProps) {
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
  } = useTimelineGame(roundId, groupId, isRevealed);

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

  if (!isOpen) return null;

  return (
    <div className="timeline-game-overlay" onClick={onClose}>
      <style>{`
        .timeline-game-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .timeline-game-modal {
          background: var(--bg-primary);
          border-radius: 16px;
          max-width: 480px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        .timeline-game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }
        .timeline-game-title {
          font-size: 1.1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .timeline-game-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-muted);
          padding: 4px;
          line-height: 1;
        }
        .timeline-game-close:hover {
          color: var(--text-primary);
        }
        .timeline-game-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
        }
        .timeline-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .timeline-label {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .timeline-songs {
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
        }
        .timeline-songs::before {
          content: "";
          position: absolute;
          left: 24px;
          top: 12px;
          bottom: 12px;
          width: 2px;
          background: linear-gradient(to bottom, var(--accent), var(--accent-secondary, var(--accent)));
          opacity: 0.3;
          z-index: 0;
        }
        .timeline-hint {
          background: var(--bg-accent);
          border: 1px solid var(--accent);
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
          font-size: 0.9rem;
          text-align: center;
        }
        .timeline-game-footer {
          padding: 16px 20px;
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .timeline-score {
          text-align: center;
          font-size: 1.1rem;
          font-weight: 600;
        }
        .timeline-score-value {
          color: var(--accent);
          font-size: 1.5rem;
        }
        .timeline-leaderboard {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .timeline-leaderboard-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        .timeline-leaderboard-entry {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }
        .timeline-leaderboard-rank {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .timeline-leaderboard-medal {
          font-size: 1.1rem;
        }
        .timeline-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 16px;
          color: var(--text-muted);
        }
        .timeline-cant-play {
          text-align: center;
          padding: 24px 16px;
          color: var(--text-muted);
        }
        .timeline-attempt-badge {
          font-size: 0.7rem;
          background: var(--accent);
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
        }
      `}</style>

      <div className="timeline-game-modal" onClick={(e) => e.stopPropagation()}>
        <div className="timeline-game-header">
          <div className="timeline-game-title">
            Song Timeline Challenge
            {!isLocked && attemptNumber <= 2 && (
              <span className="timeline-attempt-badge">
                Attempt {attemptNumber}/2
              </span>
            )}
          </div>
          <button className="timeline-game-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="timeline-game-body">
          {loading ? (
            <div className="timeline-loading">Loading...</div>
          ) : !canPlay ? (
            <div className="timeline-cant-play">
              This game is not available yet. All songs need release year data before it can be played.
            </div>
          ) : (
            <>
              {hintMessage && !isLocked && (
                <div className="timeline-hint">{hintMessage}</div>
              )}

              <div className="timeline-labels">
                <div className="timeline-label">
                  <span>1900</span>
                  <span title="Earliest commercial recordings">Earliest</span>
                </div>
                <div className="timeline-label">
                  <span>Today</span>
                  <span>Most Recent</span>
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
                  <div className="timeline-songs">
                    {currentOrder.map((id) => {
                      const sub = submissionMap.get(id);
                      if (!sub) return null;
                      return (
                        <TimelineSongCard
                          key={id}
                          id={id}
                          title={sub.title}
                          artist={sub.artist}
                          artworkUrl={sub.artwork_url}
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
            </>
          )}
        </div>

        <div className="timeline-game-footer">
          {isLocked && finalScore !== null && (
            <div className="timeline-score">
              Your Score: <span className="timeline-score-value">{finalScore}/{submissions.length}</span>
            </div>
          )}

          {isRevealed && leaderboard.length > 0 && (
            <div className="timeline-leaderboard">
              <div className="timeline-leaderboard-title">Top Scores</div>
              {leaderboard.map((entry, index) => (
                <div key={entry.player_id} className="timeline-leaderboard-entry">
                  <div className="timeline-leaderboard-rank">
                    <span className="timeline-leaderboard-medal">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                    </span>
                    <span>{entry.player_name}</span>
                  </div>
                  <span>{entry.correct_count}/{submissions.length}</span>
                </div>
              ))}
            </div>
          )}

          {!isLocked && canPlay && (
            <Button
              type="button"
              onClick={submitOrder}
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? "Submitting..." : attemptNumber === 1 ? "Submit Order" : "Final Submit"}
            </Button>
          )}

          {isLocked && !isRevealed && (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Your answer is locked in. Results will be revealed when the round ends.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimelineGameModal;
