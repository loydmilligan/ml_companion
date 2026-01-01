/**
 * AwardsPreview - Round awards display
 *
 * Shows up to 3 awards with trophy images,
 * award names, and winners.
 */

import type { RoundAward } from "../../types/history.types";

interface AwardsPreviewProps {
  awards: RoundAward[];
}

export default function AwardsPreview({ awards }: AwardsPreviewProps) {
  if (awards.length === 0) {
    return null;
  }

  return (
    <div className="awards-section">
      <h3 className="section-label">
        <span className="label-icon" aria-hidden="true">🏆</span>
        Awards
      </h3>
      <div className="awards-list" role="list">
        {awards.map((award) => (
          <div key={award.id} className="award-item" role="listitem">
            {/* Trophy image or fallback */}
            <div className="award-trophy">
              {award.trophyUrl ? (
                <img
                  src={award.trophyUrl}
                  alt=""
                  className="trophy-image"
                  loading="lazy"
                />
              ) : (
                <span className="trophy-emoji" aria-hidden="true">
                  🏆
                </span>
              )}
            </div>

            {/* Award info */}
            <div className="award-info">
              <span className="award-name">{award.awardName}</span>
              {award.awardDescription && (
                <span className="award-description">
                  {award.awardDescription}
                </span>
              )}
              {award.winnerName && (
                <span className="award-winner">
                  Won by {award.winnerName}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
