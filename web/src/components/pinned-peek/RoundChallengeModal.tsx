import { useEffect, useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
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

// Compact Song Card (similar to TimelineSongCard)
function SongCard({
  song,
  isAssigned,
  isSelected,
  disabled,
  isCorrect,
  showResult,
  size = 60,
  onSelect,
  onInfoTap,
}: {
  song: ChallengeSong;
  isAssigned: boolean;
  isSelected: boolean;
  disabled: boolean;
  isCorrect: boolean | null;
  showResult: boolean;
  size?: number;
  onSelect: () => void;
  onInfoTap: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: song.id,
    disabled: disabled || isAssigned,
  });

  const getBorderColor = () => {
    if (isSelected) return "var(--accent)";
    if (showResult && isCorrect === true) return "var(--success)";
    if (showResult && isCorrect === false) return "var(--error)";
    if (isAssigned) return "var(--border)";
    return "var(--border)";
  };

  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    opacity: isDragging ? 0.5 : isAssigned ? 0.4 : 1,
    width: `${size}px`,
    height: `${size}px`,
    borderColor: getBorderColor(),
    cursor: disabled || isAssigned ? "default" : isDragging ? "grabbing" : "pointer",
    boxShadow: isSelected
      ? "0 0 0 3px var(--accent), 0 4px 12px rgba(0, 0, 0, 0.3)"
      : isDragging
        ? "0 4px 16px rgba(0, 0, 0, 0.3)"
        : undefined,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging && !disabled && !isAssigned) {
      onSelect();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rc-song-thumb ${isAssigned ? "assigned" : ""} ${isDragging ? "dragging" : ""}`}
      onClick={handleClick}
      onContextMenu={(e) => { e.preventDefault(); onInfoTap(); }}
    >
      {song.artwork_url ? (
        <img src={song.artwork_url} alt="" className="rc-song-thumb-img" />
      ) : (
        <div className="rc-song-thumb-placeholder">🎵</div>
      )}
      {showResult && isCorrect !== null && (
        <div className={`rc-song-result ${isCorrect ? "correct" : "incorrect"}`}>
          {isCorrect ? "✓" : "✗"}
        </div>
      )}
      {song.youtube_url && !isAssigned && (
        <a
          href={song.youtube_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rc-song-play"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          title="Listen on YouTube"
        >
          ▶
        </a>
      )}
    </div>
  );
}

// Song Card Overlay for dragging
function SongCardOverlay({ song, size = 60 }: { song: ChallengeSong; size?: number }) {
  return (
    <div
      className="rc-song-thumb dragging-overlay"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {song.artwork_url ? (
        <img src={song.artwork_url} alt="" className="rc-song-thumb-img" />
      ) : (
        <div className="rc-song-thumb-placeholder">🎵</div>
      )}
    </div>
  );
}

// Theme Card with drop zone
function ThemeCard({
  theme,
  assignedSong,
  selectedSongId,
  disabled,
  isCorrect,
  showResult,
  correctThemeTitle,
  onAssign,
  onRemoveSong,
  onTapInfo,
}: {
  theme: ChallengeTheme;
  assignedSong: ChallengeSong | null;
  selectedSongId: string | null;
  disabled: boolean;
  isCorrect: boolean | null;
  showResult: boolean;
  correctThemeTitle?: string;
  onAssign: () => void;
  onRemoveSong: () => void;
  onTapInfo: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: theme.id,
    disabled,
  });

  const canAcceptTap = !disabled && selectedSongId && !assignedSong;

  const handleClick = () => {
    if (canAcceptTap) {
      onAssign();
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`rc-theme-card ${isOver ? "drag-over" : ""} ${canAcceptTap ? "can-accept" : ""} ${
        showResult ? (isCorrect ? "correct" : isCorrect === false ? "incorrect" : "") : ""
      }`}
      onClick={handleClick}
    >
      <div className="rc-theme-header" onClick={(e) => { e.stopPropagation(); onTapInfo(); }}>
        <div className="rc-theme-icon">
          {theme.thumbnail_url ? (
            <img src={theme.thumbnail_url} alt="" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} />
          ) : null}
          <span className="rc-theme-icon-fallback">🎭</span>
        </div>
        <div className="rc-theme-info">
          <span className="rc-theme-title">{theme.title}</span>
          <span className="rc-theme-hint">Tap ⓘ for hints</span>
        </div>
        <button type="button" className="rc-theme-info-btn" onClick={(e) => { e.stopPropagation(); onTapInfo(); }}>
          ⓘ
        </button>
      </div>

      <div className="rc-theme-slot">
        {assignedSong ? (
          <div className="rc-assigned-song">
            <div className="rc-assigned-art">
              {assignedSong.artwork_url ? (
                <img src={assignedSong.artwork_url} alt="" />
              ) : (
                <span>🎵</span>
              )}
            </div>
            <div className="rc-assigned-info">
              <span className="rc-assigned-title">{assignedSong.title}</span>
              <span className="rc-assigned-artist">{assignedSong.artist}</span>
            </div>
            {assignedSong.youtube_url && (
              <a
                href={assignedSong.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rc-assigned-play"
                onClick={(e) => e.stopPropagation()}
                title="Listen on YouTube"
              >
                ▶
              </a>
            )}
            {!disabled && (
              <button type="button" className="rc-remove-btn" onClick={(e) => { e.stopPropagation(); onRemoveSong(); }}>
                ✕
              </button>
            )}
            {showResult && !isCorrect && correctThemeTitle && (
              <div className="rc-wrong-answer">→ {correctThemeTitle}</div>
            )}
          </div>
        ) : (
          <div className={`rc-empty-slot ${isOver ? "drag-over" : ""} ${canAcceptTap ? "tap-ready" : ""}`}>
            {isOver ? "Drop here!" : canAcceptTap ? "Tap to assign" : "Drag or select a song"}
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

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ChallengeTheme | null>(null);
  const [selectedSongInfo, setSelectedSongInfo] = useState<ChallengeSong | null>(null);

  // Reload data when modal opens
  useEffect(() => {
    if (isOpen) {
      reload();
      setSelectedSongId(null);
    }
  }, [isOpen, reload]);

  // Clear selection when a song is assigned
  useEffect(() => {
    if (selectedSongId && assignments[selectedSongId]) {
      setSelectedSongId(null);
    }
  }, [assignments, selectedSongId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
    setSelectedSongId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (over && active.id !== over.id) {
      const songId = active.id as string;
      const themeId = over.id as string;

      if (themes.some(t => t.id === themeId)) {
        assignSongToTheme(songId, themeId);
      }
    }
  };

  const handleSongSelect = (songId: string) => {
    setSelectedSongId(prev => prev === songId ? null : songId);
  };

  const handleThemeAssign = (themeId: string) => {
    if (selectedSongId) {
      assignSongToTheme(selectedSongId, themeId);
      setSelectedSongId(null);
    }
  };

  const activeSong = activeDragId ? songs.find(s => s.id === activeDragId) : null;
  const getThemeById = (id: string) => themes.find(t => t.id === id);
  const allAssigned = songs.length > 0 && songs.every(s => assignments[s.id]);

  // Calculate thumbnail size based on song count
  const thumbSize = useMemo(() => {
    const count = songs.length;
    if (count <= 3) return 70;
    if (count <= 5) return 60;
    return 52;
  }, [songs.length]);

  if (!isOpen) return null;

  return (
    <div className="rc-overlay" onClick={onClose}>
      <style>{`
        .rc-overlay {
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
          height: 100px;
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
          font-size: 1.2rem;
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
          z-index: 2;
        }
        .rc-instructions {
          padding: 10px 16px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          text-align: center;
        }
        .rc-instructions p {
          margin: 0;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .rc-body {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        /* Songs Row */
        .rc-songs-section {
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
        }
        .rc-songs-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .rc-songs-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* Song Thumbnails */
        .rc-song-thumb {
          position: relative;
          flex-shrink: 0;
          background: var(--bg-tertiary);
          border: 3px solid var(--border);
          border-radius: 8px;
          touch-action: none;
          user-select: none;
          overflow: hidden;
          transition: all 0.15s ease;
        }
        .rc-song-thumb:not(.assigned):not(.dragging):hover {
          transform: scale(1.05);
        }
        .rc-song-thumb.dragging-overlay {
          border-color: var(--accent);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .rc-song-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .rc-song-thumb-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          background: var(--bg-primary);
        }
        .rc-song-result {
          position: absolute;
          top: 2px;
          right: 2px;
          font-size: 0.8rem;
          font-weight: bold;
          background: rgba(0,0,0,0.7);
          color: white;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rc-song-result.correct { background: var(--success); }
        .rc-song-result.incorrect { background: var(--error); }
        .rc-song-play {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 20px;
          height: 20px;
          background: #ff0000;
          border-radius: 50%;
          color: white;
          font-size: 0.6rem;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        /* Themes Section */
        .rc-themes-section {
          padding: 12px 16px 100px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .rc-theme-card {
          background: var(--bg-secondary);
          border: 2px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.15s ease;
        }
        .rc-theme-card.drag-over,
        .rc-theme-card.can-accept {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent);
        }
        .rc-theme-card.correct { border-color: var(--success); }
        .rc-theme-card.incorrect { border-color: var(--error); }

        .rc-theme-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: var(--bg-tertiary);
          cursor: pointer;
        }
        .rc-theme-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-primary);
          flex-shrink: 0;
          position: relative;
        }
        .rc-theme-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: relative;
          z-index: 1;
        }
        .rc-theme-icon-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        .rc-theme-info {
          flex: 1;
          min-width: 0;
        }
        .rc-theme-title {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rc-theme-hint {
          display: block;
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .rc-theme-info-btn {
          background: transparent;
          border: none;
          color: var(--accent);
          cursor: pointer;
          padding: 8px;
          font-size: 1rem;
          border-radius: 50%;
        }
        .rc-theme-info-btn:hover {
          background: var(--bg-primary);
        }

        .rc-theme-slot {
          padding: 8px 12px 12px;
        }
        .rc-empty-slot {
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px dashed var(--border);
          border-radius: 8px;
          color: var(--text-muted);
          font-size: 0.8rem;
          transition: all 0.15s ease;
        }
        .rc-empty-slot.drag-over,
        .rc-empty-slot.tap-ready {
          border-color: var(--accent);
          background: rgba(17, 193, 236, 0.1);
          color: var(--accent);
        }

        .rc-assigned-song {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-tertiary);
          border-radius: 8px;
          padding: 8px 10px;
          position: relative;
        }
        .rc-assigned-art {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          overflow: hidden;
          background: var(--bg-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .rc-assigned-art img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .rc-assigned-info {
          flex: 1;
          min-width: 0;
        }
        .rc-assigned-title {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rc-assigned-artist {
          display: block;
          font-size: 0.7rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rc-assigned-play {
          width: 24px;
          height: 24px;
          background: #ff0000;
          border-radius: 50%;
          color: white;
          font-size: 0.7rem;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          flex-shrink: 0;
        }
        .rc-remove-btn {
          background: var(--bg-primary);
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          color: var(--text-muted);
          font-size: 0.8rem;
          flex-shrink: 0;
        }
        .rc-remove-btn:hover {
          background: var(--error);
          color: white;
        }
        .rc-wrong-answer {
          position: absolute;
          bottom: -18px;
          left: 10px;
          font-size: 0.65rem;
          color: var(--error);
        }

        /* Controls */
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
        }
        .rc-score-value {
          color: var(--accent);
          font-size: 1.3rem;
        }
        .rc-locked-msg {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
          margin: 0;
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

        /* Popups */
        .rc-popup {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border);
          padding: 16px;
          z-index: 1001;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
          animation: rcSlideUp 0.2s ease-out;
        }
        @keyframes rcSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .rc-popup-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .rc-popup-thumb {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-tertiary);
        }
        .rc-popup-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .rc-popup-title {
          flex: 1;
          font-size: 1rem;
          font-weight: 700;
        }
        .rc-popup-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .rc-popup-close {
          background: var(--bg-tertiary);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.2rem;
          color: var(--text-muted);
        }
        .rc-popup-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 12px;
        }
        .rc-popup-hints {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .rc-popup-hint {
          font-size: 0.75rem;
          background: var(--accent);
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
        }
        .rc-popup-play {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          padding: 8px 16px;
          background: #ff0000;
          color: white;
          text-decoration: none;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
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
            ×
          </button>
          <div className="rc-header-content">
            <div className="rc-title">Round Challenge</div>
          </div>
        </div>

        {!loading && canPlay && !isLocked && (
          <div className="rc-instructions">
            <p>Tap a song, then tap the theme it belongs to — or drag directly</p>
          </div>
        )}

        {error && <div className="rc-error">{error}</div>}

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
              <div className="rc-loading">Challenge not available yet.</div>
            ) : (
              <>
                {/* Songs Row */}
                <div className="rc-songs-section">
                  <div className="rc-songs-label">
                    Songs ({songs.filter(s => !assignments[s.id]).length} remaining)
                  </div>
                  <div className="rc-songs-row">
                    {songs.map((song) => (
                      <SongCard
                        key={song.id}
                        song={song}
                        isAssigned={!!assignments[song.id]}
                        isSelected={selectedSongId === song.id}
                        disabled={isLocked}
                        isCorrect={results ? results[song.id] : null}
                        showResult={isRevealed && !!results}
                        size={thumbSize}
                        onSelect={() => handleSongSelect(song.id)}
                        onInfoTap={() => setSelectedSongInfo(song)}
                      />
                    ))}
                  </div>
                </div>

                {/* Themes List */}
                <div className="rc-themes-section">
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
                      <ThemeCard
                        key={theme.id}
                        theme={theme}
                        assignedSong={assignedSong ?? null}
                        selectedSongId={selectedSongId}
                        disabled={isLocked}
                        isCorrect={isCorrect}
                        showResult={isRevealed && !!results}
                        correctThemeTitle={correctTheme?.title}
                        onAssign={() => handleThemeAssign(theme.id)}
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
            {activeSong ? <SongCardOverlay song={activeSong} size={thumbSize} /> : null}
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
        <div className="rc-popup" onClick={() => setSelectedTheme(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <div className="rc-popup-header">
              <div className="rc-popup-thumb">
                {selectedTheme.thumbnail_url && (
                  <img src={selectedTheme.thumbnail_url} alt="" />
                )}
              </div>
              <div>
                <div className="rc-popup-title">{selectedTheme.title}</div>
              </div>
              <button className="rc-popup-close" onClick={() => setSelectedTheme(null)}>
                ×
              </button>
            </div>
            <p className="rc-popup-desc">{selectedTheme.description}</p>
          </div>
        </div>
      )}

      {/* Song Info Popup */}
      {selectedSongInfo && (
        <div className="rc-popup" onClick={() => setSelectedSongInfo(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <div className="rc-popup-header">
              <div className="rc-popup-thumb">
                {selectedSongInfo.artwork_url ? (
                  <img src={selectedSongInfo.artwork_url} alt="" />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '24px' }}>🎵</div>
                )}
              </div>
              <div>
                <div className="rc-popup-title">{selectedSongInfo.title}</div>
                <div className="rc-popup-subtitle">{selectedSongInfo.artist}</div>
              </div>
              <button className="rc-popup-close" onClick={() => setSelectedSongInfo(null)}>
                ×
              </button>
            </div>
            {selectedSongInfo.youtube_url && (
              <a
                href={selectedSongInfo.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rc-popup-play"
                onClick={(e) => e.stopPropagation()}
              >
                ▶ Listen on YouTube
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RoundChallengeModal;
