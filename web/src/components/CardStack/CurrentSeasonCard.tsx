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
            Opening Storylines
          </h3>
          <p className="current-season-text">{data.seasonIntro}</p>
        </section>

        <section className="current-season-block">
          <h3 className="section-label">
            <span className="label-icon" aria-hidden="true">🎧</span>
            Round 2 Riff
          </h3>
          <p className="current-season-text">{data.roundTwoRiff}</p>
        </section>

        <section className="current-season-block">
          <h3 className="section-label">
            <span className="label-icon" aria-hidden="true">🎯</span>
            Minigame Recap
          </h3>
          <p className="current-season-text">{data.minigameSummary}</p>
        </section>
      </div>
    </article>
  );
}
