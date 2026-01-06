import { useMemo, useState } from "react";
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

  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);

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

  const selectedSong = selectedSongId ? submissionMap.get(selectedSongId) : null;

  // Calculate thumbnail size based on number of songs (aim to fit without scrolling)
  // Mobile viewport ~640px, minus header/instructions/controls/footer ~200px = ~440px for songs
  const thumbnailSize = useMemo(() => {
    const count = submissions.length;
    if (count <= 5) return 60;
    if (count <= 7) return 52;
    if (count <= 9) return 46;
    if (count <= 11) return 40;
    return 36; // 12+ songs
  }, [submissions.length]);

  if (!isOpen) return null;

  return (
    <div className="timeline-game-overlay" onClick={onClose}>
      <style>{`
        .timeline-game-overlay {
          position: fixed;
          inset: 0;
          background: var(--bg-primary);
          display: flex;
          flex-direction: column;
          z-index: 1000;
        }
        .timeline-game-modal {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .timeline-game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          background: var(--bg-secondary);
        }
        .timeline-game-title {
          font-size: 1rem;
          font-weight: 600;
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
        .timeline-game-instructions {
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          text-align: center;
        }
        .timeline-game-instructions p {
          margin: 0;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .timeline-game-hint {
          background: var(--accent);
          color: white;
          padding: 12px 16px;
          text-align: center;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .timeline-game-controls {
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: center;
          gap: 12px;
        }
        .timeline-game-body {
          flex: 1;
          overflow-y: auto;
          padding: 0;
          display: flex;
        }
        .timeline-track {
          width: 40px;
          flex-shrink: 0;
          background: linear-gradient(to bottom,
            var(--accent) 0%,
            var(--accent-secondary, var(--accent)) 100%
          );
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .timeline-track-line {
          position: absolute;
          left: 50%;
          top: 32px;
          bottom: 32px;
          width: 3px;
          background: rgba(255,255,255,0.4);
          transform: translateX(-50%);
        }
        .timeline-label {
          font-size: 0.6rem;
          color: white;
          font-weight: 700;
          text-transform: uppercase;
          padding: 8px 4px;
          text-align: center;
          line-height: 1.1;
          z-index: 1;
        }
        .timeline-label-top {
          margin-bottom: auto;
        }
        .timeline-label-bottom {
          margin-top: auto;
        }
        .timeline-songs-container {
          flex: 1;
          padding: 8px 12px 8px 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
          align-items: flex-start;
        }
        .timeline-game-footer {
          padding: 12px 16px;
          border-top: 1px solid var(--border);
          background: var(--bg-secondary);
        }
        .timeline-score {
          text-align: center;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .timeline-score-value {
          color: var(--accent);
          font-size: 1.3rem;
        }
        .timeline-leaderboard {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .timeline-leaderboard-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          text-align: center;
          margin-bottom: 4px;
        }
        .timeline-leaderboard-entry {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          padding: 4px 8px;
          background: var(--bg-tertiary);
          border-radius: 6px;
        }
        .timeline-leaderboard-rank {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .timeline-leaderboard-medal {
          font-size: 1rem;
        }
        .timeline-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          color: var(--text-muted);
        }
        .timeline-cant-play {
          text-align: center;
          padding: 24px 16px;
          color: var(--text-muted);
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .timeline-attempt-badge {
          font-size: 0.7rem;
          background: var(--accent);
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          margin-left: 8px;
        }
        .timeline-locked-msg {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
          padding: 8px;
        }

        /* Song info popup */
        .song-info-popup {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border);
          padding: 16px;
          z-index: 1001;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
          animation: slideUp 0.2s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .song-info-popup-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .song-info-popup-art {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          object-fit: cover;
          background: var(--bg-tertiary);
        }
        .song-info-popup-text {
          flex: 1;
          min-width: 0;
        }
        .song-info-popup-title {
          font-weight: 600;
          font-size: 1rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .song-info-popup-artist {
          color: var(--text-muted);
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .song-info-popup-year {
          color: var(--accent);
          font-size: 0.85rem;
          font-weight: 600;
          margin-top: 2px;
        }
        .song-info-popup-close {
          background: var(--bg-tertiary);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.2rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      <div className="timeline-game-modal" onClick={(e) => e.stopPropagation()}>
        <div className="timeline-game-header">
          <div className="timeline-game-title">
            Song Timeline
            {!isLocked && attemptNumber <= 2 && (
              <span className="timeline-attempt-badge">
                {attemptNumber}/2
              </span>
            )}
          </div>
          <button className="timeline-game-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {!loading && canPlay && (
          <div className="timeline-game-instructions">
            <p>Arrange tracks from oldest (top) to newest (bottom)</p>
          </div>
        )}

        {hintMessage && !isLocked && (
          <div className="timeline-game-hint">{hintMessage}</div>
        )}

        {!isLocked && canPlay && !loading && (
          <div className="timeline-game-controls">
            <Button
              type="button"
              onClick={submitOrder}
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? "Submitting..." : attemptNumber === 1 ? "Submit Order" : "Final Submit"}
            </Button>
          </div>
        )}

        <div className="timeline-game-body">
          {loading ? (
            <div className="timeline-loading">Loading...</div>
          ) : !canPlay ? (
            <div className="timeline-cant-play">
              This game is not available yet. All songs need release year data.
            </div>
          ) : (
            <>
              <div className="timeline-track">
                <div className="timeline-label timeline-label-top">1900<br/>Oldest</div>
                <div className="timeline-track-line" />
                <div className="timeline-label timeline-label-bottom">Today<br/>Newest</div>
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
                  <div className="timeline-songs-container">
                    {currentOrder.map((id) => {
                      const sub = submissionMap.get(id);
                      if (!sub) return null;
                      return (
                        <TimelineSongCard
                          key={id}
                          id={id}
                          artworkUrl={sub.artwork_url}
                          releaseYear={sub.release_year}
                          showYear={isRevealed}
                          isCorrect={isRevealed ? correctnessMap.get(id) : null}
                          disabled={isLocked}
                          size={thumbnailSize}
                          isSelected={selectedSongId === id}
                          onSelect={() => setSelectedSongId(selectedSongId === id ? null : id)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>

        {(isLocked || (isRevealed && leaderboard.length > 0)) && (
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

            {isLocked && !isRevealed && (
              <p className="timeline-locked-msg">
                Your answer is locked. Results shown when the round ends.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Song info popup */}
      {selectedSong && (
        <div className="song-info-popup" onClick={() => setSelectedSongId(null)}>
          <div className="song-info-popup-content" onClick={(e) => e.stopPropagation()}>
            {selectedSong.artwork_url ? (
              <img src={selectedSong.artwork_url} alt="" className="song-info-popup-art" />
            ) : (
              <div className="song-info-popup-art" />
            )}
            <div className="song-info-popup-text">
              <div className="song-info-popup-title">{selectedSong.title}</div>
              {selectedSong.artist && (
                <div className="song-info-popup-artist">{selectedSong.artist}</div>
              )}
              {isRevealed && selectedSong.release_year && (
                <div className="song-info-popup-year">{selectedSong.release_year}</div>
              )}
            </div>
            <button className="song-info-popup-close" onClick={() => setSelectedSongId(null)}>
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimelineGameModal;
