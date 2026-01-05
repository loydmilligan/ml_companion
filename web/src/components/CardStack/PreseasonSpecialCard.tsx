/**
 * PreseasonSpecialCard - Pre-vote analysis card
 *
 * Displays extensive pre-season special content including opening monologue,
 * submission board analysis, taste tells, theme fit, timing, predictions,
 * and soft power rankings. Shown once at the start of a new season.
 * Sections are collapsible and collapsed by default.
 */

import { useMemo } from "react";
import type { PreseasonSpecialCardProps } from "../../types/cardstack.types";
import { CARD_TRANSFORMS } from "../../types/cardstack.types";

interface CollapsibleSectionProps {
  icon: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

function CollapsibleSection({ icon, title, children, className = "" }: CollapsibleSectionProps) {
  return (
    <details className={`preseason-block ${className}`}>
      <summary className="section-label collapsible-header">
        <span className="label-icon" aria-hidden="true">{icon}</span>
        {title}
        <span className="collapse-indicator" aria-hidden="true">▶</span>
      </summary>
      <div className="collapsible-content">
        {children}
      </div>
    </details>
  );
}

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
        <CollapsibleSection icon="🎬" title="Season Opening Monologue" className="preseason-monologue">
          <p className="preseason-text">{data.openingMonologue}</p>
        </CollapsibleSection>

        <CollapsibleSection icon="📋" title="The Submission Board">
          <p className="preseason-text">{data.submissionBoard}</p>
        </CollapsibleSection>

        <CollapsibleSection icon="🎵" title="Artist & Taste Tells">
          <p className="preseason-text">{data.tasteTells}</p>
        </CollapsibleSection>

        <CollapsibleSection icon="🎯" title="Theme Fit">
          <p className="preseason-text">{data.themeFit}</p>
        </CollapsibleSection>

        <CollapsibleSection icon="⏱️" title="Timing & Energy">
          <p className="preseason-text">{data.timingEnergy}</p>
        </CollapsibleSection>

        <CollapsibleSection icon="🔮" title="Pre-Vote Predictions" className="preseason-predictions">
          <p className="preseason-text">{data.predictions}</p>
        </CollapsibleSection>

        <CollapsibleSection icon="📊" title="Soft Power Rankings" className="preseason-rankings">
          <p className="preseason-text preseason-rankings-text">{data.powerRankings}</p>
        </CollapsibleSection>
      </div>
    </article>
  );
}
