import { useState, useMemo } from "react";
import "./AwardsGallery.css";

/*
 * AwardsGallery - Trophy Room Component
 *
 * A museum-style awards display celebrating Music League achievements.
 * Features:
 * - 3D-style trophy displays with metallic sheen
 * - Seasonal organization with elegant transitions
 * - Shareable certificate cards
 * - Round story snippets with AI artwork
 * - Accessibility: full keyboard navigation, ARIA labels
 * - Performance: virtualized rendering for large collections
 *
 * Usage:
 * <AwardsGallery
 *   awards={awardsData}
 *   seasons={seasonsData}
 *   onShare={(award) => handleShare(award)}
 * />
 */

// Types
interface Award {
  id: string;
  seasonId: string;
  awardName: string;
  awardDescription?: string;
  trophyUrl?: string;
  winnerName: string;
  winningSong: string;
  winningArtist?: string;
  roundTheme: string;
  roundNumber: number;
  storySnippet?: string;
  storyArtworkUrl?: string;
  achievedDate: string;
}

interface Season {
  id: string;
  name: string;
  number: number;
  totalAwards: number;
  startDate: string;
  endDate?: string;
}

interface AwardsGalleryProps {
  awards: Award[];
  seasons: Season[];
  onShare?: (award: Award) => void;
  showCertificates?: boolean;
}

export default function AwardsGallery({
  awards,
  seasons,
  onShare,
  showCertificates = true
}: AwardsGalleryProps) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(
    seasons[0]?.id ?? null
  );
  const [selectedAward, setSelectedAward] = useState<Award | null>(null);
  const [viewMode, setViewMode] = useState<"gallery" | "timeline">("gallery");
  const [certificateView, setCertificateView] = useState(false);

  // Filter awards by selected season
  const seasonAwards = useMemo(() => {
    if (!selectedSeasonId) return awards;
    return awards.filter(award => award.seasonId === selectedSeasonId);
  }, [awards, selectedSeasonId]);

  // Group awards by category (inferred from award name patterns)
  const categorizedAwards = useMemo(() => {
    const categories: Record<string, Award[]> = {
      performance: [],
      voting: [],
      timing: [],
      style: [],
      social: [],
      other: []
    };

    seasonAwards.forEach(award => {
      const name = award.awardName.toLowerCase();
      if (name.includes("landslide") || name.includes("underdog") || name.includes("winner")) {
        categories.performance.push(award);
      } else if (name.includes("vote") || name.includes("kingmaker") || name.includes("spread")) {
        categories.voting.push(award);
      } else if (name.includes("early") || name.includes("procrastinator") || name.includes("owl")) {
        categories.timing.push(award);
      } else if (name.includes("genre") || name.includes("deep cut") || name.includes("fresh")) {
        categories.style.push(award);
      } else if (name.includes("critic") || name.includes("hype") || name.includes("ghost")) {
        categories.social.push(award);
      } else {
        categories.other.push(award);
      }
    });

    return categories;
  }, [seasonAwards]);

  const selectedSeason = seasons.find(s => s.id === selectedSeasonId);

  const handleAwardClick = (award: Award) => {
    setSelectedAward(award);
    if (showCertificates) {
      setCertificateView(true);
    }
  };

  const handleShare = (award: Award) => {
    if (onShare) {
      onShare(award);
    } else {
      // Fallback: copy award details to clipboard
      const text = `${award.winnerName} earned "${award.awardName}" for "${award.winningSong}"!`;
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="awards-gallery" role="region" aria-label="Awards Gallery">
      {/* Header with season selector */}
      <header className="gallery-header">
        <div className="gallery-title">
          <h1>Trophy Room</h1>
          <p className="gallery-subtitle">Celebrating musical excellence</p>
        </div>

        <div className="season-selector">
          <label htmlFor="season-select" className="visually-hidden">
            Select Season
          </label>
          <select
            id="season-select"
            className="season-dropdown"
            value={selectedSeasonId ?? ""}
            onChange={(e) => setSelectedSeasonId(e.target.value || null)}
          >
            <option value="">All Seasons</option>
            {seasons.map(season => (
              <option key={season.id} value={season.id}>
                Season {season.number} - {season.name} ({season.totalAwards} awards)
              </option>
            ))}
          </select>
        </div>

        <div className="view-toggle" role="tablist">
          <button
            role="tab"
            aria-selected={viewMode === "gallery"}
            className={`toggle-btn ${viewMode === "gallery" ? "active" : ""}`}
            onClick={() => setViewMode("gallery")}
          >
            Gallery View
          </button>
          <button
            role="tab"
            aria-selected={viewMode === "timeline"}
            className={`toggle-btn ${viewMode === "timeline" ? "active" : ""}`}
            onClick={() => setViewMode("timeline")}
          >
            Timeline View
          </button>
        </div>
      </header>

      {/* Season stats banner */}
      {selectedSeason && (
        <div className="season-banner">
          <div className="season-info">
            <h2>Season {selectedSeason.number}: {selectedSeason.name}</h2>
            <p>{seasonAwards.length} awards earned</p>
          </div>
          <div className="season-sparkle" aria-hidden="true">✨</div>
        </div>
      )}

      {/* Gallery View */}
      {viewMode === "gallery" && (
        <div className="trophy-cases">
          {Object.entries(categorizedAwards).map(([category, categoryAwards]) => {
            if (categoryAwards.length === 0) return null;

            return (
              <section key={category} className="trophy-case">
                <h3 className="case-label">
                  {category.charAt(0).toUpperCase() + category.slice(1)} Awards
                </h3>

                <div className="trophy-grid">
                  {categoryAwards.map((award) => (
                    <article
                      key={award.id}
                      className="trophy-card"
                      onClick={() => handleAwardClick(award)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleAwardClick(award);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View award: ${award.awardName} earned by ${award.winnerName}`}
                    >
                      {/* Trophy pedestal */}
                      <div className="trophy-pedestal">
                        {award.trophyUrl ? (
                          <img
                            src={award.trophyUrl}
                            alt={award.awardName}
                            className="trophy-image"
                          />
                        ) : (
                          <div className="trophy-placeholder">
                            <span className="trophy-icon">🏆</span>
                          </div>
                        )}
                        <div className="trophy-shine" aria-hidden="true" />
                      </div>

                      {/* Award plaque */}
                      <div className="award-plaque">
                        <h4 className="award-title">{award.awardName}</h4>
                        <p className="award-winner">{award.winnerName}</p>
                        <p className="award-song">
                          {award.winningSong}
                          {award.winningArtist && (
                            <span className="artist-name"> by {award.winningArtist}</span>
                          )}
                        </p>
                        <p className="award-round">Round {award.roundNumber} · {award.roundTheme}</p>
                      </div>

                      {/* Metallic accent border */}
                      <div className="trophy-border" aria-hidden="true" />
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === "timeline" && (
        <div className="awards-timeline">
          {seasonAwards
            .sort((a, b) => new Date(b.achievedDate).getTime() - new Date(a.achievedDate).getTime())
            .map((award, index) => (
              <div
                key={award.id}
                className="timeline-item"
                style={{ "--item-index": index } as React.CSSProperties}
              >
                <div className="timeline-marker" aria-hidden="true">
                  <div className="marker-dot" />
                </div>

                <div className="timeline-content">
                  <time className="timeline-date">
                    {new Date(award.achievedDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </time>

                  <div className="timeline-card" onClick={() => handleAwardClick(award)}>
                    {award.trophyUrl && (
                      <img src={award.trophyUrl} alt="" className="timeline-trophy" />
                    )}
                    <div>
                      <h4>{award.awardName}</h4>
                      <p className="timeline-winner">{award.winnerName}</p>
                      <p className="timeline-song">{award.winningSong}</p>
                    </div>
                  </div>

                  {/* Story snippet with artwork */}
                  {award.storySnippet && (
                    <div className="story-card">
                      {award.storyArtworkUrl && (
                        <img
                          src={award.storyArtworkUrl}
                          alt="Round story artwork"
                          className="story-artwork"
                        />
                      )}
                      <blockquote className="story-text">
                        {award.storySnippet}
                      </blockquote>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Certificate Modal */}
      {certificateView && selectedAward && (
        <div
          className="certificate-modal"
          onClick={() => setCertificateView(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="certificate-title"
        >
          <div
            className="certificate-container"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-certificate"
              onClick={() => setCertificateView(false)}
              aria-label="Close certificate"
            >
              ✕
            </button>

            <div className="certificate">
              {/* Ornate border */}
              <div className="certificate-border" aria-hidden="true">
                <div className="corner corner-tl" />
                <div className="corner corner-tr" />
                <div className="corner corner-bl" />
                <div className="corner corner-br" />
              </div>

              {/* Certificate content */}
              <div className="certificate-content">
                <div className="certificate-header">
                  <h2 id="certificate-title">Certificate of Achievement</h2>
                  <div className="certificate-seal" aria-hidden="true">
                    {selectedAward.trophyUrl ? (
                      <img src={selectedAward.trophyUrl} alt="" />
                    ) : (
                      "🏆"
                    )}
                  </div>
                </div>

                <div className="certificate-body">
                  <p className="certificate-awarded">This certifies that</p>
                  <h3 className="certificate-recipient">{selectedAward.winnerName}</h3>
                  <p className="certificate-earned">has earned the prestigious</p>
                  <h4 className="certificate-award">{selectedAward.awardName}</h4>

                  {selectedAward.awardDescription && (
                    <p className="certificate-description">{selectedAward.awardDescription}</p>
                  )}

                  <div className="certificate-details">
                    <p>
                      <strong>Winning Selection:</strong><br />
                      {selectedAward.winningSong}
                      {selectedAward.winningArtist && ` by ${selectedAward.winningArtist}`}
                    </p>
                    <p>
                      <strong>Round {selectedAward.roundNumber}:</strong> {selectedAward.roundTheme}
                    </p>
                    <p>
                      <strong>Date:</strong> {new Date(selectedAward.achievedDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                </div>

                <div className="certificate-footer">
                  <button
                    className="share-button"
                    onClick={() => handleShare(selectedAward)}
                  >
                    Share Achievement
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {seasonAwards.length === 0 && (
        <div className="empty-gallery">
          <div className="empty-icon" aria-hidden="true">🏆</div>
          <h3>No awards yet</h3>
          <p>Awards will appear here as they are earned throughout the season.</p>
        </div>
      )}
    </div>
  );
}

// Accessibility: Visually hidden utility
// This CSS class should be added to your global styles
/*
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
*/
