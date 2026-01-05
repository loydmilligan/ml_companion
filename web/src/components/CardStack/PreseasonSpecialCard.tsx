/**
 * PreseasonSpecialCard - Pre-vote analysis card
 *
 * Displays extensive pre-season special content including opening monologue,
 * submission board analysis, taste tells, theme fit, timing, predictions,
 * and soft power rankings. Shown once at the start of a new season.
 */

import { useMemo } from "react";
import type { PreseasonSpecialCardProps } from "../../types/cardstack.types";
import { CARD_TRANSFORMS } from "../../types/cardstack.types";

export default function PreseasonSpecialCard({
  data,
  position,
  isActive,
  dragOffset = 0,
  isDragging = false,
}: PreseasonSpecialCardProps) {
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
      className={`preseason-special-card card-position-${position} ${isActive ? "active" : ""} ${isDragging ? "dragging" : ""}`}
      style={transformStyle}
      role="listitem"
      aria-label={`Pre-Season Special for ${data.roundTheme}`}
    >
      <div className="preseason-hero">
        <div className="preseason-overlay" aria-hidden="true" />
        <div className="preseason-hero-content">
          <span className="preseason-badge">Pre-Season Special</span>
          <h2 className="preseason-title">Season {data.seasonNumber}</h2>
          <p className="preseason-theme">{data.roundTheme}</p>
        </div>
      </div>

      <div className="card-content preseason-content">
        <section className="preseason-block preseason-monologue">
          <h3 className="section-label">
            <span className="label-icon" aria-hidden="true">🎬</span>
            Season Opening Monologue
          </h3>
          <p className="preseason-text">{data.openingMonologue}</p>
        </section>

        <section className="preseason-block">
          <h3 className="section-label">
            <span className="label-icon" aria-hidden="true">📋</span>
            The Submission Board
          </h3>
          <p className="preseason-text">{data.submissionBoard}</p>
        </section>

        <section className="preseason-block">
          <h3 className="section-label">
            <span className="label-icon" aria-hidden="true">🎵</span>
            Artist & Taste Tells
          </h3>
          <p className="preseason-text">{data.tasteTells}</p>
        </section>

        <section className="preseason-block">
          <h3 className="section-label">
            <span className="label-icon" aria-hidden="true">🎯</span>
            Theme Fit
          </h3>
          <p className="preseason-text">{data.themeFit}</p>
        </section>

        <section className="preseason-block">
          <h3 className="section-label">
            <span className="label-icon" aria-hidden="true">⏱️</span>
            Timing & Energy
          </h3>
          <p className="preseason-text">{data.timingEnergy}</p>
        </section>

        <section className="preseason-block preseason-predictions">
          <h3 className="section-label">
            <span className="label-icon" aria-hidden="true">🔮</span>
            Pre-Vote Predictions
          </h3>
          <p className="preseason-text">{data.predictions}</p>
        </section>

        <section className="preseason-block preseason-rankings">
          <h3 className="section-label">
            <span className="label-icon" aria-hidden="true">📊</span>
            Soft Power Rankings
          </h3>
          <p className="preseason-text preseason-rankings-text">{data.powerRankings}</p>
        </section>
      </div>
    </article>
  );
}
