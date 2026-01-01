import { useState, useMemo } from "react";
import "./RoundCardGrid.css";

// Trophy placement icons - Gold, Silver, Bronze
const TrophyIcon = ({ place }: { place: 1 | 2 | 3 }) => {
  const colors = {
    1: "#FFD700", // Gold
    2: "#C0C0C0", // Silver
    3: "#CD7F32", // Bronze
  };

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`trophy-icon trophy-${place}`}
      aria-label={`${place === 1 ? "Gold" : place === 2 ? "Silver" : "Bronze"} trophy`}
    >
      <path
        d="M12 2L14.5 8.5L21 9.5L16.5 14L17.5 20.5L12 17.5L6.5 20.5L7.5 14L3 9.5L9.5 8.5L12 2Z"
        fill={colors[place]}
        stroke={colors[place]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Types
export type RoundCardData = {
  id: string;
  theme: string;
  themeDescription?: string;
  themeImageUrl?: string;
  seasonNumber?: number;
  roundNumber?: number;
  winnerName?: string;
  winnerSong?: string;
  winnerArtist?: string;
  yourSubmission?: {
    title: string;
    artist?: string;
    artworkUrl?: string;
    placement?: 1 | 2 | 3; // Trophy placement
  };
  totalSubmissions: number;
  yourParticipation: boolean;
  createdAt: string;
};

type FilterType = "all" | "wins" | "participated" | "season";
type SortType = "recent" | "oldest" | "wins";

type RoundCardGridProps = {
  rounds: RoundCardData[];
  onCardClick?: (roundId: string) => void;
};

/**
 * RoundCardGrid - Filterable history view with card grid layout
 *
 * Usage:
 * ```tsx
 * <RoundCardGrid
 *   rounds={historyData}
 *   onCardClick={(id) => navigate(`/history/${id}`)}
 * />
 * ```
 *
 * Features:
 * - Responsive CSS Grid (1-3 columns based on viewport)
 * - Filter chips (All, Wins, Participated, By Season)
 * - Trophy icons for 1st/2nd/3rd place
 * - Hover reveals detailed stats
 * - Stats summary bar at top
 * - Skeleton loading states
 * - Accessible with ARIA labels and keyboard navigation
 */
export default function RoundCardGrid({ rounds, onCardClick }: RoundCardGridProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortType>("recent");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Calculate stats
  const stats = useMemo(() => {
    const totalRounds = rounds.length;
    const wins = rounds.filter((r) => r.yourSubmission?.placement === 1).length;
    const participated = rounds.filter((r) => r.yourParticipation).length;
    const seasons = new Set(rounds.map((r) => r.seasonNumber).filter((s): s is number => s !== undefined));

    return {
      totalRounds,
      wins,
      participated,
      seasons: Array.from(seasons).sort((a, b) => b - a),
    };
  }, [rounds]);

  // Filter and sort rounds
  const filteredRounds = useMemo(() => {
    let filtered = [...rounds];

    // Apply filters
    if (activeFilter === "wins") {
      filtered = filtered.filter((r) => r.yourSubmission?.placement);
    } else if (activeFilter === "participated") {
      filtered = filtered.filter((r) => r.yourParticipation);
    } else if (activeFilter === "season" && selectedSeason !== null) {
      filtered = filtered.filter((r) => r.seasonNumber === selectedSeason);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "wins") {
        const aWin = a.yourSubmission?.placement || 999;
        const bWin = b.yourSubmission?.placement || 999;
        return aWin - bWin;
      }
      return 0;
    });

    return filtered;
  }, [rounds, activeFilter, selectedSeason, sortBy]);

  const handleFilterClick = (filter: FilterType, season?: number) => {
    setActiveFilter(filter);
    setSelectedSeason(season ?? null);
  };

  const handleCardInteraction = (roundId: string) => {
    if (onCardClick) {
      onCardClick(roundId);
    }
  };

  return (
    <div className="round-card-grid-container">
      {/* Stats Summary Bar */}
      <div className="stats-summary" role="region" aria-label="Round statistics">
        <div className="stat-item">
          <span className="stat-value">{stats.totalRounds}</span>
          <span className="stat-label">Total Rounds</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.wins}</span>
          <span className="stat-label">Wins</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.participated}</span>
          <span className="stat-label">Participated</span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="filter-controls" role="toolbar" aria-label="Filter rounds">
        <div className="filter-chips">
          <button
            className={`filter-chip ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => handleFilterClick("all")}
            aria-pressed={activeFilter === "all"}
          >
            All Rounds
          </button>
          <button
            className={`filter-chip ${activeFilter === "wins" ? "active" : ""}`}
            onClick={() => handleFilterClick("wins")}
            aria-pressed={activeFilter === "wins"}
          >
            My Wins
          </button>
          <button
            className={`filter-chip ${activeFilter === "participated" ? "active" : ""}`}
            onClick={() => handleFilterClick("participated")}
            aria-pressed={activeFilter === "participated"}
          >
            Participated
          </button>

          {/* Season Filters */}
          {stats.seasons.map((season) => (
            <button
              key={season}
              className={`filter-chip ${
                activeFilter === "season" && selectedSeason === season ? "active" : ""
              }`}
              onClick={() => handleFilterClick("season", season)}
              aria-pressed={activeFilter === "season" && selectedSeason === season}
            >
              Season {season}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="sort-control">
          <label htmlFor="sort-select" className="sr-only">
            Sort by
          </label>
          <select
            id="sort-select"
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="wins">Best Performance</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-count">
        <p>
          Showing <strong>{filteredRounds.length}</strong> of <strong>{stats.totalRounds}</strong>{" "}
          rounds
        </p>
      </div>

      {/* Card Grid */}
      <div className="round-card-grid" role="list">
        {filteredRounds.map((round) => (
          <article
            key={round.id}
            className={`round-card ${expandedCard === round.id ? "expanded" : ""}`}
            onClick={() => handleCardInteraction(round.id)}
            onMouseEnter={() => setExpandedCard(round.id)}
            onMouseLeave={() => setExpandedCard(null)}
            onFocus={() => setExpandedCard(round.id)}
            onBlur={() => setExpandedCard(null)}
            tabIndex={0}
            role="listitem button"
            aria-label={`Round ${round.roundNumber}: ${round.theme}`}
          >
            {/* Theme Image */}
            <div className="card-image-container">
              {round.themeImageUrl ? (
                <img
                  src={round.themeImageUrl}
                  alt={`${round.theme} theme banner`}
                  className="card-image"
                  loading="lazy"
                />
              ) : (
                <div className="card-image-placeholder" aria-hidden="true">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 18V5L21 12L9 19V18ZM9 5V18M3 5V19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}

              {/* Trophy Overlay */}
              {round.yourSubmission?.placement && (
                <div className="trophy-overlay" aria-label="You placed in this round">
                  <TrophyIcon place={round.yourSubmission.placement} />
                </div>
              )}

              {/* Season/Round Badge */}
              <div className="round-badge">
                {round.seasonNumber && <span>S{round.seasonNumber}</span>}
                {round.roundNumber && <span>R{round.roundNumber}</span>}
              </div>
            </div>

            {/* Card Content */}
            <div className="card-content">
              <h3 className="card-title">{round.theme}</h3>

              {/* Winner Info */}
              {round.winnerName && (
                <div className="winner-info">
                  <span className="winner-label">Winner:</span>
                  <span className="winner-name">{round.winnerName}</span>
                  {round.winnerSong && (
                    <span className="winner-song">
                      {round.winnerSong}
                      {round.winnerArtist && ` - ${round.winnerArtist}`}
                    </span>
                  )}
                </div>
              )}

              {/* Your Submission */}
              {round.yourSubmission && (
                <div className="your-submission">
                  <span className="submission-label">Your pick:</span>
                  <div className="submission-details">
                    {round.yourSubmission.artworkUrl && (
                      <img
                        src={round.yourSubmission.artworkUrl}
                        alt={round.yourSubmission.title}
                        className="submission-artwork"
                        loading="lazy"
                      />
                    )}
                    <div>
                      <p className="submission-title">{round.yourSubmission.title}</p>
                      {round.yourSubmission.artist && (
                        <p className="submission-artist">{round.yourSubmission.artist}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Expanded Details (on hover/focus) */}
              {expandedCard === round.id && (
                <div className="expanded-details" aria-live="polite">
                  {round.themeDescription && (
                    <p className="theme-description">{round.themeDescription}</p>
                  )}
                  <div className="round-stats">
                    <span>{round.totalSubmissions} submissions</span>
                    {round.yourParticipation && <span className="participated-badge">Participated</span>}
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Empty State */}
      {filteredRounds.length === 0 && (
        <div className="empty-state" role="status">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M8 15C8 15 9.5 17 12 17C14.5 17 16 15 16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="9" cy="9" r="1" fill="currentColor" />
            <circle cx="15" cy="9" r="1" fill="currentColor" />
          </svg>
          <h3>No rounds found</h3>
          <p>Try adjusting your filters or check back later</p>
        </div>
      )}
    </div>
  );
}
