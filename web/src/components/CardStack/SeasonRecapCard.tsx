/**
 * SeasonRecapCard - Season summary card for past seasons
 *
 * Displays season statistics, leaderboard, awards, voting patterns,
 * genre/decade distribution, top tracks, and round themes.
 */

import { useMemo, useState } from "react";
import type { SeasonRecapCardProps } from "../../types/cardstack.types";
import { CARD_TRANSFORMS } from "../../types/cardstack.types";
import MenuBookIcon from "@mui/icons-material/MenuBook";

// Simple Spotify icon SVG component
const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

export default function SeasonRecapCard({
  data,
  position,
  isActive,
  dragOffset = 0,
  isDragging = false,
  onThemeClick,
}: SeasonRecapCardProps) {
  // State for expandable season story
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);

  // Calculate transform style based on position and drag state
  const transformStyle = useMemo(() => {
    const baseTransform = CARD_TRANSFORMS[position] || CARD_TRANSFORMS[3];
    const rotation = isDragging ? dragOffset / 20 : 0;

    // Apply drag offset only to active card
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

  // Group voting patterns by voter for display
  const votingPatternsByVoter = useMemo(() => {
    if (!data.votingPatterns) return [];
    const grouped = new Map<string, { most?: string; mostPts?: number; least?: string; leastPts?: number }>();

    data.votingPatterns.forEach((pattern) => {
      const existing = grouped.get(pattern.voterName) || {};
      if (pattern.type === "most") {
        existing.most = pattern.targetName;
        existing.mostPts = pattern.pointsGiven;
      } else {
        existing.least = pattern.targetName;
        existing.leastPts = pattern.pointsGiven;
      }
      grouped.set(pattern.voterName, existing);
    });

    return Array.from(grouped.entries()).map(([voter, targets]) => ({
      voter,
      ...targets,
    }));
  }, [data.votingPatterns]);

  return (
    <article
      className={`season-recap-card card-position-${position} ${isActive ? "active" : ""} ${isDragging ? "dragging" : ""}`}
      style={transformStyle}
      role="listitem"
      aria-label={`Season ${data.seasonNumber} Recap`}
    >
      {/* Hero section with season info */}
      <div className="recap-hero">
        <div className="recap-hero-overlay" aria-hidden="true" />
        {/* Hero action buttons - top left */}
        <div className="hero-actions">
          {data.seasonNarrative && (
            <button
              type="button"
              className={`hero-action-btn story-btn ${isStoryExpanded ? "expanded" : ""}`}
              onClick={() => setIsStoryExpanded(!isStoryExpanded)}
              aria-label={isStoryExpanded ? "Collapse season story" : "Expand season story"}
              aria-expanded={isStoryExpanded}
            >
              <MenuBookIcon />
            </button>
          )}
          {data.playlistUrl && (
            <a
              href={data.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-action-btn spotify-btn"
              aria-label="Open season playlist in Spotify"
            >
              <SpotifyIcon />
            </a>
          )}
        </div>
        <div className="recap-hero-content">
          <span className="recap-badge">Season Recap</span>
          <h2 className="season-title">Season {data.seasonNumber}</h2>
          <p className="league-name">{data.leagueName}</p>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="card-content">
        {/* Season Narrative - expandable via book icon */}
        {data.seasonNarrative && isStoryExpanded && (
          <div className="recap-narrative story-expanded">
            <h3 className="section-label">
              <span className="label-icon" aria-hidden="true">📖</span>
              Season Story
            </h3>
            <p className="narrative-text">{data.seasonNarrative}</p>
          </div>
        )}

        {/* Season stats grid */}
        <div className="recap-stats-grid" role="group" aria-label="Season statistics">
          <div className="recap-stat-box">
            <span className="recap-stat-value">{data.totalRounds}</span>
            <span className="recap-stat-label">Rounds</span>
          </div>
          <div className="recap-stat-box">
            <span className="recap-stat-value">{data.totalSubmissions}</span>
            <span className="recap-stat-label">Songs</span>
          </div>
          <div className="recap-stat-box">
            <span className="recap-stat-value">{data.totalVotes}</span>
            <span className="recap-stat-label">Points</span>
          </div>
        </div>

        {/* Season Awards */}
        {data.seasonAwards && data.seasonAwards.length > 0 && (
          <div className="recap-awards">
            <h3 className="section-label">
              <span className="label-icon" aria-hidden="true">🏆</span>
              Season Awards
            </h3>
            <div className="awards-list" role="list">
              {data.seasonAwards.map((award, index) => (
                <div key={index} className="season-award-item" role="listitem">
                  <div className="award-trophy">
                    {award.trophyUrl ? (
                      <img src={award.trophyUrl} alt="" className="trophy-image" loading="lazy" />
                    ) : (
                      <span className="trophy-emoji" aria-hidden="true">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🏅"}
                      </span>
                    )}
                  </div>
                  <div className="award-info">
                    <span className="award-name">{award.awardName}</span>
                    {award.awardDescription && (
                      <span className="award-description">{award.awardDescription}</span>
                    )}
                    {award.winnerName && (
                      <span className="award-winner">{award.winnerName}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {data.leaderboard && data.leaderboard.length > 0 && (
          <div className="recap-leaderboard">
            <h3 className="section-label">
              <span className="label-icon" aria-hidden="true">📊</span>
              Final Standings
            </h3>
            <div className="leaderboard-list" role="list">
              {data.leaderboard.slice(0, 8).map((entry) => (
                <div
                  key={entry.name}
                  className={`leaderboard-item rank-${entry.rank}`}
                  role="listitem"
                >
                  <span className="leaderboard-rank">
                    {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                  </span>
                  <span className="leaderboard-name">{entry.name}</span>
                  <span className="leaderboard-stats">
                    <span className="leaderboard-points">{entry.totalPoints} pts</span>
                    {entry.wins > 0 && (
                      <span className="leaderboard-wins">{entry.wins}W</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voting Patterns */}
        {votingPatternsByVoter.length > 0 && (
          <div className="recap-voting-patterns">
            <h3 className="section-label">
              <span className="label-icon" aria-hidden="true">🎯</span>
              Voting Patterns
            </h3>
            <div className="voting-patterns-list" role="list">
              {votingPatternsByVoter.map((pattern) => (
                <div key={pattern.voter} className="voting-pattern-item" role="listitem">
                  <span className="voter-name">{pattern.voter}</span>
                  <div className="vote-targets">
                    {pattern.most && (
                      <span className="vote-target most">
                        <span className="target-arrow">→</span>
                        <span className="target-name">{pattern.most}</span>
                        <span className="target-pts">{pattern.mostPts}</span>
                      </span>
                    )}
                    {pattern.least && (
                      <span className="vote-target least">
                        <span className="target-arrow">⤳</span>
                        <span className="target-name">{pattern.least}</span>
                        <span className="target-pts">{pattern.leastPts}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Genre & Decade Distribution */}
        {((data.genreDistribution && data.genreDistribution.length > 0) ||
          (data.decadeDistribution && data.decadeDistribution.length > 0)) && (
          <div className="recap-distribution">
            <h3 className="section-label">
              <span className="label-icon" aria-hidden="true">🎵</span>
              Music Breakdown
            </h3>

            {/* Decade bars */}
            {data.decadeDistribution && data.decadeDistribution.length > 0 && (
              <div className="distribution-section">
                <h4 className="distribution-subtitle">By Decade</h4>
                <div className="distribution-bars">
                  {data.decadeDistribution.map((item) => (
                    <div key={item.label} className="distribution-bar-item">
                      <span className="bar-label">{item.label}</span>
                      <div className="bar-container">
                        <div
                          className="bar-fill decade-bar"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="bar-count">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Genre pills */}
            {data.genreDistribution && data.genreDistribution.length > 0 && (
              <div className="distribution-section">
                <h4 className="distribution-subtitle">Top Genres</h4>
                <div className="genre-pills">
                  {data.genreDistribution.slice(0, 6).map((item) => (
                    <span key={item.label} className="genre-pill">
                      {item.label}
                      <span className="genre-count">{item.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top tracks list */}
        {data.topTracks.length > 0 && (
          <div className="recap-top-tracks">
            <h3 className="section-label">
              <span className="label-icon" aria-hidden="true">⭐</span>
              Top Tracks
            </h3>
            <div className="top-tracks-list" role="list">
              {data.topTracks.slice(0, 5).map((track, index) => (
                <div key={`${track.title}-${index}`} className="top-track-item" role="listitem">
                  <span className="top-track-rank">{index + 1}</span>
                  <div className="top-track-artwork">
                    {track.artworkUrl ? (
                      <img
                        src={track.artworkUrl}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <div className="artwork-placeholder">🎵</div>
                    )}
                  </div>
                  <div className="top-track-info">
                    <span className="top-track-title">{track.title}</span>
                    <span className="top-track-artist">
                      {track.artist || "Unknown Artist"}
                    </span>
                    {track.submitterName && (
                      <span className="top-track-submitter">
                        by {track.submitterName}
                      </span>
                    )}
                  </div>
                  <div className="top-track-points">
                    <span className="points-value">{track.points}</span>
                    <span className="points-label">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Round themes list */}
        {data.roundThemes.length > 0 && (
          <div className="recap-themes">
            <h3 className="section-label">
              <span className="label-icon" aria-hidden="true">🎯</span>
              Round Themes {onThemeClick && <span className="muted">(tap to jump)</span>}
            </h3>
            <div className="themes-list">
              {data.roundThemes.map((theme, index) => (
                <button
                  key={index}
                  type="button"
                  className={`theme-pill ${onThemeClick ? "clickable" : ""}`}
                  onClick={() => onThemeClick?.(theme)}
                  disabled={!onThemeClick}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
