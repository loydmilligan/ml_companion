/**
 * CurrentSeasonCard - Snapshot narrative for the ongoing season
 *
 * Highlights season storylines, round-two riffs, and minigame takeaways
 * without duplicating round-card stats.
 */

import { useMemo } from "react";
import type { CurrentSeasonCardProps } from "../../types/cardstack.types";
import { CARD_TRANSFORMS } from "../../types/cardstack.types";

export default function CurrentSeasonCard({
  data,
  position,
  isActive,
  dragOffset = 0,
  isDragging = false,
  isLead = false,
  onRegenerateStory,
  isStoryLoading = false,
  storyStatus,
}: CurrentSeasonCardProps) {
  const transformStyle = useMemo(() => {
    const baseTransform = CARD_TRANSFORMS[position] || CARD_TRANSFORMS[3];
    const rotation = isDragging ? dragOffset / 20 : 0;
    const translateX = isActive ? dragOffset : 0;

    return {
      transform: `
        translateX(${translateX}px)
        translateY(${baseTransform.translateY}px)
        scale(${baseTransform.scale})
        rotate(${rotation}deg)
      `,
      opacity: baseTransform.opacity,
      zIndex: baseTransform.zIndex,
      transition: isDragging ? "none" : undefined,
    };
  }, [position, isActive, dragOffset, isDragging]);

  return (
    <article
      className={`current-season-card card-position-${position} ${isActive ? "active" : ""} ${isDragging ? "dragging" : ""}`}
      style={transformStyle}
      role="listitem"
      aria-label={`Season ${data.seasonNumber} story card`}
    >
      <div className="current-season-hero">
        <div className="current-season-overlay" aria-hidden="true" />
        <div className="current-season-hero-content">
          <span className="current-season-badge">Current Season</span>
          <h2 className="current-season-title">Season {data.seasonNumber}</h2>
          <p className="current-season-league">{data.leagueName}</p>
        </div>
      </div>

      <div className="card-content current-season-content">
        <section className="current-season-block">
          <h3 className="section-label">
            <span className="label-icon" aria-hidden="true">🎬</span>
            Season Storylines
          </h3>
          <p className="current-season-text">{data.seasonIntro}</p>
        </section>

        <section className="current-season-block">
          <h3 className="section-label">
            <span className="label-icon" aria-hidden="true">🎧</span>
            Up Next
          </h3>
          <p className="current-season-text">{data.roundTwoRiff}</p>
        </section>

        <section className="current-season-block">
          <h3 className="section-label">
            <span className="label-icon" aria-hidden="true">🎯</span>
            Guessing Game
          </h3>
          <p className="current-season-text">{data.minigameSummary}</p>
        </section>

        {/* Admin controls */}
        {isLead && onRegenerateStory && (
          <div className="admin-generation-controls">
            <div className="admin-controls-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="admin-icon">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span>Admin</span>
            </div>
            {storyStatus && (
              <p className="generation-status">{storyStatus}</p>
            )}
            <div className="admin-buttons">
              <button
                type="button"
                className="admin-gen-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerateStory(data.leagueId);
                }}
                disabled={isStoryLoading}
                title="Regenerate current season story"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                {isStoryLoading ? "..." : "Regenerate Story"}
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
