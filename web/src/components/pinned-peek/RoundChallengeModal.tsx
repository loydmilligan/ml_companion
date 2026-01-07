import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useRoundChallenge } from "./useRoundChallenge";
import type { ChallengeSong, ChallengeTheme } from "./useRoundChallenge";
import Button from "../Button";

type RoundChallengeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  roundId: string | null;
  groupId: string | null;
  isRevealed: boolean;
};

// Draggable Song Card
function DraggableSongCard({
  song,
  isAssigned,
  disabled,
  isCorrect,
  showResult,
}: {
  song: ChallengeSong;
  isAssigned: boolean;
  disabled: boolean;
  isCorrect: boolean | null;
  showResult: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: song.id,
    disabled: disabled || isAssigned,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rc-song-card ${isAssigned ? "assigned" : ""} ${isDragging ? "dragging" : ""} ${
        showResult ? (isCorrect ? "correct" : "incorrect") : ""
      }`}
    >
      <div className="rc-song-art">
        {song.artwork_url ? (
          <img src={song.artwork_url} alt="" />
        ) : (
          <div className="rc-song-art-placeholder">🎵</div>
        )}
      </div>
      <div className="rc-song-info">
        <span className="rc-song-title">{song.title}</span>
        <span className="rc-song-artist">{song.artist}</span>
      </div>
      {song.youtube_url && (
        <a
          href={song.youtube_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rc-play-btn"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          title="Listen on YouTube"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </a>
      )}
      {!disabled && !isAssigned && (
        <div className="rc-drag-handle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="2" />
            <circle cx="15" cy="6" r="2" />
            <circle cx="9" cy="12" r="2" />
            <circle cx="15" cy="12" r="2" />
            <circle cx="9" cy="18" r="2" />
            <circle cx="15" cy="18" r="2" />
          </svg>
        </div>
      )}
    </div>
  );
}

// Song Card for DragOverlay
function SongCardOverlay({ song }: { song: ChallengeSong }) {
  return (
    <div className="rc-song-card dragging-overlay">
      <div className="rc-song-art">
        {song.artwork_url ? (
          <img src={song.artwork_url} alt="" />
        ) : (
          <div className="rc-song-art-placeholder">🎵</div>
        )}
      </div>
      <div className="rc-song-info">
        <span className="rc-song-title">{song.title}</span>
        <span className="rc-song-artist">{song.artist}</span>
      </div>
    </div>
  );
}

// Droppable Theme Card
function DroppableThemeCard({
  theme,
  assignedSong,
  isOver,
  disabled,
  isCorrect,
  showResult,
  correctThemeTitle,
  onRemoveSong,
  onTapInfo,
}: {
  theme: ChallengeTheme;
  assignedSong: ChallengeSong | null;
  isOver: boolean;
  disabled: boolean;
  isCorrect: boolean | null;
  showResult: boolean;
  correctThemeTitle?: string;
  onRemoveSong: () => void;
  onTapInfo: () => void;
}) {
  const { setNodeRef, isOver: isDragOver } = useDroppable({
    id: theme.id,
    disabled,
  });

  const active = isOver || isDragOver;

  return (
    <div
      ref={setNodeRef}
      className={`rc-theme-card ${active ? "drag-over" : ""} ${assignedSong ? "has-song" : ""} ${
        showResult ? (isCorrect ? "correct" : "incorrect") : ""
      }`}
    >
      <div className="rc-theme-header" onClick={onTapInfo}>
        <div className="rc-theme-thumb">
          {theme.thumbnail_url ? (
            <img src={theme.thumbnail_url} alt="" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} />
          ) : null}
          <span className="rc-theme-thumb-fallback">🎭</span>
        </div>
        <span className="rc-theme-title">{theme.title}</span>
        <button type="button" className="rc-theme-info-btn" onClick={(e) => { e.stopPropagation(); onTapInfo(); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </button>
      </div>

      <div className="rc-theme-dropzone">
        {assignedSong ? (
          <div className="rc-assigned-song">
            <div className="rc-assigned-song-art">
              {assignedSong.artwork_url ? (
                <img src={assignedSong.artwork_url} alt="" />
              ) : (
                <span>🎵</span>
              )}
            </div>
            <div className="rc-assigned-song-info">
              <span className="rc-assigned-song-title">{assignedSong.title}</span>
              <span className="rc-assigned-song-artist">{assignedSong.artist}</span>
            </div>
            {assignedSong.youtube_url && (
              <a
                href={assignedSong.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rc-play-btn rc-play-btn-small"
                onClick={(e) => e.stopPropagation()}
                title="Listen on YouTube"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            )}
            {!disabled && (
              <button type="button" className="rc-remove-btn" onClick={onRemoveSong}>
                ✕
              </button>
            )}
            {showResult && !isCorrect && correctThemeTitle && (
              <div className="rc-correct-answer">
                Should be: {correctThemeTitle}
              </div>
            )}
          </div>
        ) : (
          <div className="rc-dropzone-placeholder">
            {active ? "Drop here!" : "Drag a song here"}
          </div>
        )}
      </div>
    </div>
  );
}

export function RoundChallengeModal({
  isOpen,
  onClose,
  roundId,
  groupId,
  isRevealed,
}: RoundChallengeModalProps) {
  const {
    songs,
    themes,
    assignments,
    loading,
    error,
    isLocked,
    isSubmitted: _isSubmitted,
    canPlay,
    results,
    correctAnswers,
    score,
    assignSongToTheme,
    removeSongFromTheme,
    submitGuesses,
    reload,
    isSubmitting,
  } = useRoundChallenge(roundId, groupId, isRevealed);

  void _isSubmitted; // Reserved for future badge display

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ChallengeTheme | null>(null);

  // Reload data when modal opens
  useEffect(() => {
    if (isOpen) {
      reload();
    }
  }, [isOpen, reload]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (over && active.id !== over.id) {
      const songId = active.id as string;
      const themeId = over.id as string;

      // Check if this is a valid theme drop
      if (themes.some(t => t.id === themeId)) {
        assignSongToTheme(songId, themeId);
      }
    }
  };

  const activeSong = activeDragId ? songs.find(s => s.id === activeDragId) : null;

  // Get unassigned songs
  const unassignedSongs = songs.filter(s => !assignments[s.id]);

  // Get theme by ID helper
  const getThemeById = (id: string) => themes.find(t => t.id === id);

  // Check if all songs are assigned
  const allAssigned = songs.length > 0 && songs.every(s => assignments[s.id]);

  if (!isOpen) return null;

  return (
    <div className="rc-modal-overlay" onClick={onClose}>
      <style>{`
        .rc-modal-overlay {
          position: fixed;
          inset: 0;
          background: #1a1a2e;
          display: flex;
          flex-direction: column;
          z-index: 1000;
        }
        .rc-modal {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .rc-header {
          position: relative;
          height: 140px;
          flex-shrink: 0;
          overflow: hidden;
        }
        .rc-banner {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .rc-header-content {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 100%;
          padding: 12px 16px;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);
        }
        .rc-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        .rc-close {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0,0,0,0.5);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          font-size: 1.3rem;
          cursor: pointer;
          color: white;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        .rc-close:hover {
          background: rgba(0,0,0,0.7);
        }
        .rc-instructions {
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          text-align: center;
        }
        .rc-instructions p {
          margin: 0;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .rc-body {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        .rc-songs-panel {
          width: 140px;
          flex-shrink: 0;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          padding: 12px 8px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .rc-songs-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 4px;
          text-align: center;
        }
        .rc-song-card {
          background: var(--bg-tertiary);
          border: 2px solid transparent;
          border-radius: 8px;
          padding: 8px;
          cursor: grab;
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .rc-song-card:hover:not(.assigned):not(.dragging) {
          border-color: var(--accent);
        }
        .rc-song-card.assigned {
          opacity: 0.5;
          cursor: default;
        }
        .rc-song-card.dragging {
          opacity: 0.5;
        }
        .rc-song-card.dragging-overlay {
          background: var(--bg-tertiary);
          border: 2px solid var(--accent);
          border-radius: 8px;
          padding: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .rc-song-card.correct {
          border-color: var(--success);
          background: rgba(34, 197, 94, 0.1);
        }
        .rc-song-card.incorrect {
          border-color: var(--error);
          background: rgba(239, 68, 68, 0.1);
        }
        .rc-song-art {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 4px;
          overflow: hidden;
          background: var(--bg-primary);
        }
        .rc-song-art img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .rc-song-art-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .rc-song-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .rc-song-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rc-song-artist {
          font-size: 0.65rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rc-play-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: #ff0000;
          border-radius: 50%;
          color: white;
          text-decoration: none;
          transition: transform 0.15s ease, background 0.15s ease;
          flex-shrink: 0;
        }
        .rc-play-btn:hover {
          transform: scale(1.1);
          background: #cc0000;
        }
        .rc-play-btn:active {
          transform: scale(0.95);
        }
        .rc-play-btn-small {
          width: 22px;
          height: 22px;
        }
        .rc-drag-handle {
          display: flex;
          justify-content: center;
          color: var(--text-muted);
          padding-top: 4px;
        }
        .rc-themes-panel {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .rc-theme-card {
          background: var(--bg-secondary);
          border: 2px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.15s ease;
        }
        .rc-theme-card.drag-over {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent);
        }
        .rc-theme-card.correct {
          border-color: var(--success);
        }
        .rc-theme-card.incorrect {
          border-color: var(--error);
        }
        .rc-theme-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: var(--bg-tertiary);
          cursor: pointer;
        }
        .rc-theme-thumb {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          overflow: hidden;
          background: var(--bg-primary);
          flex-shrink: 0;
          position: relative;
        }
        .rc-theme-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: relative;
          z-index: 1;
        }
        .rc-theme-thumb-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        .rc-theme-title {
          flex: 1;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rc-theme-info-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
        .rc-theme-info-btn:hover {
          background: var(--bg-primary);
        }
        .rc-theme-dropzone {
          min-height: 50px;
          padding: 8px 10px;
        }
        .rc-dropzone-placeholder {
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px dashed var(--border);
          border-radius: 6px;
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        .rc-assigned-song {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-tertiary);
          border-radius: 6px;
          padding: 6px 8px;
          position: relative;
        }
        .rc-assigned-song-art {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          overflow: hidden;
          background: var(--bg-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .rc-assigned-song-art img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .rc-assigned-song-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .rc-assigned-song-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rc-assigned-song-artist {
          font-size: 0.65rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rc-remove-btn {
          background: var(--bg-primary);
          border: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          cursor: pointer;
          color: var(--text-muted);
          font-size: 0.7rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .rc-remove-btn:hover {
          background: var(--error);
          color: white;
        }
        .rc-correct-answer {
          position: absolute;
          bottom: -20px;
          left: 0;
          right: 0;
          font-size: 0.65rem;
          color: var(--error);
          text-align: center;
        }
        .rc-controls {
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: center;
          gap: 12px;
        }
        .rc-footer {
          padding: 12px 16px;
          border-top: 1px solid var(--border);
          background: var(--bg-secondary);
        }
        .rc-score {
          text-align: center;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .rc-score-value {
          color: var(--accent);
          font-size: 1.3rem;
        }
        .rc-locked-msg {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        .rc-loading {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }
        .rc-error {
          padding: 16px;
          text-align: center;
          color: var(--error);
        }
        .rc-theme-popup {
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
        .rc-theme-popup-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .rc-theme-popup-thumb {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-tertiary);
        }
        .rc-theme-popup-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .rc-theme-popup-title {
          flex: 1;
          font-size: 1rem;
          font-weight: 700;
        }
        .rc-theme-popup-close {
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
        .rc-theme-popup-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
      `}</style>

      <div className="rc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rc-header">
          <img
            src="/images/minigames/round-challenge-large-banner.png"
            alt=""
            className="rc-banner"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/minigames/round-challenge.png";
            }}
          />
          <button className="rc-close" onClick={onClose}>
            &times;
          </button>
          <div className="rc-header-content">
            <div className="rc-title">Round Challenge</div>
          </div>
        </div>

        {!loading && canPlay && !isLocked && (
          <div className="rc-instructions">
            <p>Drag each song to the Season 1 theme it belongs to</p>
          </div>
        )}

        {error && (
          <div className="rc-error">{error}</div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="rc-body">
            {loading ? (
              <div className="rc-loading">Loading...</div>
            ) : !canPlay ? (
              <div className="rc-loading">
                Challenge not available yet.
              </div>
            ) : (
              <>
                {/* Songs Panel (Left) */}
                <div className="rc-songs-panel">
                  <div className="rc-songs-title">Songs ({unassignedSongs.length}/{songs.length})</div>
                  {songs.map((song) => (
                    <DraggableSongCard
                      key={song.id}
                      song={song}
                      isAssigned={!!assignments[song.id]}
                      disabled={isLocked}
                      isCorrect={results ? results[song.id] : null}
                      showResult={isRevealed && !!results}
                    />
                  ))}
                </div>

                {/* Themes Panel (Right) */}
                <div className="rc-themes-panel">
                  {themes.map((theme) => {
                    const assignedSongId = Object.entries(assignments).find(
                      ([, themeId]) => themeId === theme.id
                    )?.[0];
                    const assignedSong = assignedSongId
                      ? songs.find((s) => s.id === assignedSongId)
                      : null;
                    const isCorrect = assignedSongId && results
                      ? results[assignedSongId]
                      : null;
                    const correctThemeId = assignedSongId && correctAnswers && !isCorrect
                      ? correctAnswers[assignedSongId]
                      : null;
                    const correctTheme = correctThemeId ? getThemeById(correctThemeId) : null;

                    return (
                      <DroppableThemeCard
                        key={theme.id}
                        theme={theme}
                        assignedSong={assignedSong ?? null}
                        isOver={false}
                        disabled={isLocked}
                        isCorrect={isCorrect}
                        showResult={isRevealed && !!results}
                        correctThemeTitle={correctTheme?.title}
                        onRemoveSong={() => assignedSongId && removeSongFromTheme(assignedSongId)}
                        onTapInfo={() => setSelectedTheme(theme)}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <DragOverlay>
            {activeSong ? <SongCardOverlay song={activeSong} /> : null}
          </DragOverlay>
        </DndContext>

        {/* Submit Button */}
        {!isLocked && canPlay && !loading && (
          <div className="rc-controls">
            <Button
              type="button"
              onClick={submitGuesses}
              disabled={isSubmitting || !allAssigned}
            >
              {isSubmitting ? "Submitting..." : "Submit Guesses"}
            </Button>
          </div>
        )}

        {/* Footer with results */}
        {((isLocked && !isRevealed) || (isRevealed && score !== null)) && (
          <div className="rc-footer">
            {isRevealed && score !== null && (
              <div className="rc-score">
                Your Score: <span className="rc-score-value">{score}/{songs.length}</span>
              </div>
            )}

            {isLocked && !isRevealed && (
              <p className="rc-locked-msg">
                Your answer is locked. Results shown when the round ends.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Theme Info Popup */}
      {selectedTheme && (
        <div className="rc-theme-popup" onClick={() => setSelectedTheme(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <div className="rc-theme-popup-header">
              <div className="rc-theme-popup-thumb">
                {selectedTheme.thumbnail_url && (
                  <img src={selectedTheme.thumbnail_url} alt="" />
                )}
              </div>
              <span className="rc-theme-popup-title">{selectedTheme.title}</span>
              <button
                className="rc-theme-popup-close"
                onClick={() => setSelectedTheme(null)}
              >
                &times;
              </button>
            </div>
            <p className="rc-theme-popup-desc">{selectedTheme.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoundChallengeModal;
