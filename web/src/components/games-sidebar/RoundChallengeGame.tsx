import { useEffect, useState } from "react";
import { useRoundChallenge } from "../pinned-peek/useRoundChallenge";
import type { ChallengeSong } from "../pinned-peek/useRoundChallenge";
import Button from "../Button";

type RoundChallengeGameProps = {
  roundId: string | null;
  groupId: string | null;
  isRevealed: boolean;
};

export default function RoundChallengeGame({
  roundId,
  groupId,
  isRevealed,
}: RoundChallengeGameProps) {
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

  const [selectedSongInfo, setSelectedSongInfo] = useState<ChallengeSong | null>(null);

  // Reload data when component mounts
  useEffect(() => {
    reload();
  }, [reload]);

  const getThemeById = (id: string) => themes.find((t) => t.id === id);
  const allAssigned = songs.length > 0 && songs.every((s) => assignments[s.id]);

  // Handle dropdown change for a song
  const handleThemeSelect = (songId: string, themeId: string) => {
    if (themeId === "") {
      // Remove assignment
      removeSongFromTheme(songId);
    } else {
      assignSongToTheme(songId, themeId);
    }
  };

  // Get the theme ID currently assigned to this song
  const getAssignedThemeId = (songId: string): string => {
    return assignments[songId] || "";
  };

  // Check if a theme is already assigned to another song
  const isThemeUsed = (themeId: string, excludeSongId: string): boolean => {
    return Object.entries(assignments).some(
      ([songId, assignedThemeId]) =>
        assignedThemeId === themeId && songId !== excludeSongId
    );
  };

  if (loading) {
    return (
      <div className="rc-game-loading">
        <p>Loading challenge...</p>
      </div>
    );
  }

  if (!canPlay) {
    return (
      <div className="rc-game-unavailable">
        <img
          src="/images/minigames/round-challenge.png"
          alt="Round Challenge"
          className="rc-game-promo-image"
        />
        <h3>Round Challenge</h3>
        <p>Challenge not available yet.</p>
        <p className="rc-game-hint">Check back when a challenge is generated for this round.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rc-game-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="rc-game">
      <div className="rc-game-intro">
        <h3>Round Challenge</h3>
        <p>
          {isRevealed
            ? "See how you did! The correct answers are shown below."
            : isLocked
            ? "Your answers are locked. Results will be shown when the round ends."
            : "Match each song to the Season 1 theme it belongs to."}
        </p>
      </div>

      {/* Song cards with dropdowns */}
      <div className="rc-game-songs">
        {songs.map((song) => {
          const assignedThemeId = getAssignedThemeId(song.id);
          const isCorrect = results ? results[song.id] : null;
          const correctThemeId = correctAnswers?.[song.id];
          const correctTheme = correctThemeId ? getThemeById(correctThemeId) : null;

          return (
            <div
              key={song.id}
              className={`rc-game-song-card ${
                isRevealed && isCorrect === true ? "correct" : ""
              } ${isRevealed && isCorrect === false ? "incorrect" : ""}`}
            >
              {/* Song info */}
              <div className="rc-game-song-info">
                <div className="rc-game-song-art">
                  {song.artwork_url ? (
                    <img src={song.artwork_url} alt={song.title} />
                  ) : (
                    <span className="rc-game-song-placeholder">🎵</span>
                  )}
                  {song.youtube_url && (
                    <a
                      href={song.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rc-game-song-play"
                      title="Listen on YouTube"
                    >
                      ▶
                    </a>
                  )}
                </div>
                <div className="rc-game-song-text">
                  <span className="rc-game-song-title">{song.title}</span>
                  <span className="rc-game-song-artist">{song.artist}</span>
                </div>
                {isRevealed && isCorrect !== null && (
                  <span className={`rc-game-result ${isCorrect ? "correct" : "incorrect"}`}>
                    {isCorrect ? "✓" : "✗"}
                  </span>
                )}
              </div>

              {/* Theme dropdown */}
              <div className="rc-game-song-select-wrapper">
                <label className="rc-game-song-select-label">Theme:</label>
                <select
                  className="rc-game-song-select"
                  value={assignedThemeId}
                  onChange={(e) => handleThemeSelect(song.id, e.target.value)}
                  disabled={isLocked || isRevealed}
                >
                  <option value="">Select a theme...</option>
                  {themes.map((theme) => {
                    const used = isThemeUsed(theme.id, song.id);
                    return (
                      <option key={theme.id} value={theme.id} disabled={used}>
                        {theme.title} {used ? "(used)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Show correct answer if wrong */}
              {isRevealed && isCorrect === false && correctTheme && (
                <div className="rc-game-correct-answer">
                  Correct: <strong>{correctTheme.title}</strong>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit button */}
      {!isLocked && !isRevealed && (
        <div className="rc-game-actions">
          <Button
            type="button"
            onClick={submitGuesses}
            disabled={isSubmitting || !allAssigned}
            style={{ width: "100%" }}
          >
            {isSubmitting ? "Submitting..." : "Submit Answers"}
          </Button>
          {!allAssigned && (
            <p className="rc-game-actions-hint">
              Assign all {songs.length} songs to submit
            </p>
          )}
        </div>
      )}

      {/* Score display */}
      {isRevealed && score !== null && (
        <div className="rc-game-score">
          Your Score: <span className="rc-game-score-value">{score}/{songs.length}</span>
        </div>
      )}

      {/* Locked message */}
      {isLocked && !isRevealed && (
        <div className="rc-game-locked">
          <p>Your answers are locked. Results will be shown when the round ends.</p>
        </div>
      )}

      {/* Song info popup */}
      {selectedSongInfo && (
        <div className="rc-game-popup" onClick={() => setSelectedSongInfo(null)}>
          <div className="rc-game-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="rc-game-popup-header">
              <div className="rc-game-popup-art">
                {selectedSongInfo.artwork_url ? (
                  <img src={selectedSongInfo.artwork_url} alt="" />
                ) : (
                  <span>🎵</span>
                )}
              </div>
              <div className="rc-game-popup-text">
                <span className="rc-game-popup-title">{selectedSongInfo.title}</span>
                <span className="rc-game-popup-artist">{selectedSongInfo.artist}</span>
              </div>
              <button
                type="button"
                className="rc-game-popup-close"
                onClick={() => setSelectedSongInfo(null)}
              >
                ✕
              </button>
            </div>
            {selectedSongInfo.youtube_url && (
              <a
                href={selectedSongInfo.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rc-game-popup-play"
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
