/**
 * RoundCard - Individual round card in the card stack
 *
 * Displays a completed round with theme banner, stats,
 * track list, story narrative, and awards.
 */

import { useMemo, useState, useRef, useEffect } from "react";
import type { RoundCardProps } from "../../types/cardstack.types";
import { CARD_TRANSFORMS } from "../../types/cardstack.types";
import CardHero from "./CardHero";
import QuickStats from "./QuickStats";
import TrackList from "./TrackList";
// Simple icon SVG components
const MenuBookIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
  </svg>
);

const EmojiEventsIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
  </svg>
);

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function RoundCard({
  data,
  position,
  isActive,
  dragOffset = 0,
  isDragging = false,
  isLead = false,
  adminCallbacks,
  generationState,
}: RoundCardProps) {
  // State for expandable sections
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const [isAwardsExpanded, setIsAwardsExpanded] = useState(false);
  const [awardModalData, setAwardModalData] = useState<{name: string; description: string; winner: string} | null>(null);

  // Refs for scrolling
  const storyRef = useRef<HTMLDivElement>(null);
  const awardsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll to section when expanded
  useEffect(() => {
    if (isStoryExpanded && storyRef.current && contentRef.current) {
      setTimeout(() => {
        storyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [isStoryExpanded]);

  useEffect(() => {
    if (isAwardsExpanded && awardsRef.current && contentRef.current) {
      setTimeout(() => {
        awardsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [isAwardsExpanded]);
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

  // Visible awards (max 3 for preview)
  const visibleAwards = useMemo(() => {
    return data.awards
      .filter((award) => award.visible !== false)
      .slice(0, 3);
  }, [data.awards]);

  // Top submissions (max 6 for display)
  const topSubmissions = useMemo(() => {
    return [...data.submissions]
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 6);
  }, [data.submissions]);

  // Check if we have story or awards content
  const hasStory = data.narrative || data.winnersImageUrl;
  const hasAwards = visibleAwards.length > 0;

  return (
    <article
      className={`round-card card-position-${position} ${isActive ? "active" : ""} ${isDragging ? "dragging" : ""}`}
      style={transformStyle}
      role="listitem"
      aria-label={`Round ${data.roundNumber}: ${data.theme}`}
    >
      {/* Hero section with theme banner */}
      <div className="card-hero-wrapper">
        <CardHero
          imageUrl={data.themeImageUrl}
          roundNumber={data.roundNumber}
          seasonNumber={data.seasonNumber}
          theme={data.theme}
          themeAuthor={data.themeAuthor}
          status={data.status}
        />
        {/* Hero action buttons */}
        <div className="hero-actions">
          {hasStory && (
            <button
              type="button"
              className={`hero-action-btn story-btn ${isStoryExpanded ? "expanded" : ""}`}
              onClick={() => setIsStoryExpanded(!isStoryExpanded)}
              aria-label={isStoryExpanded ? "Collapse story" : "Expand story"}
              aria-expanded={isStoryExpanded}
            >
              <MenuBookIcon />
            </button>
          )}
          {hasAwards && (
            <button
              type="button"
              className={`hero-action-btn awards-btn ${isAwardsExpanded ? "expanded" : ""}`}
              onClick={() => setIsAwardsExpanded(!isAwardsExpanded)}
              aria-label={isAwardsExpanded ? "Collapse awards" : "Expand awards"}
              aria-expanded={isAwardsExpanded}
            >
              <EmojiEventsIcon />
            </button>
          )}
          {(data.spotifyPlaylistUrl || data.playlistUrl) && (
            <a
              href={data.spotifyPlaylistUrl || data.playlistUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-action-btn spotify-btn"
              aria-label="Open playlist in Spotify"
            >
              <SpotifyIcon />
            </a>
          )}
          {data.youtubePlaylistUrl && (
            <a
              href={data.youtubePlaylistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-action-btn youtube-btn"
              aria-label="Open playlist on YouTube"
            >
              <YouTubeIcon />
            </a>
          )}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="card-content" ref={contentRef}>
        {/* Collapsible Story Section */}
        {hasStory && isStoryExpanded && (
          <div className="collapsible-section story-expanded" ref={storyRef}>
            <h3 className="section-label">
              <span className="label-icon" aria-hidden="true">📖</span>
              Round Story
            </h3>
            {data.narrative && (
              <div className="story-text">
                <p>{data.narrative}</p>
              </div>
            )}
            {data.winnersImageUrl && (
              <div className="winners-art-container">
                <img
                  src={data.winnersImageUrl}
                  alt="Round winners illustration"
                  className="winners-art"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        )}

        {/* Collapsible Awards Section */}
        {hasAwards && isAwardsExpanded && (
          <div className="collapsible-section awards-expanded" ref={awardsRef}>
            <h3 className="section-label">
              <span className="label-icon" aria-hidden="true">🏆</span>
              Awards
            </h3>
            <div className="awards-list" role="list">
              {visibleAwards.map((award) => (
                <button
                  type="button"
                  key={award.id}
                  className="award-item clickable"
                  role="listitem"
                  onClick={() => setAwardModalData({
                    name: award.awardName,
                    description: award.awardDescription || "",
                    winner: award.winnerName || ""
                  })}
                >
                  <div className="award-trophy">
                    {award.trophyUrl ? (
                      <img src={award.trophyUrl} alt="" className="trophy-image" loading="lazy" />
                    ) : (
                      <span className="trophy-emoji" aria-hidden="true">🏆</span>
                    )}
                  </div>
                  <div className="award-info">
                    <span className="award-name">{award.awardName}</span>
                    {award.awardDescription && (
                      <span className="award-description">{award.awardDescription}</span>
                    )}
                    {award.winnerName && (
                      <span className="award-winner">Won by {award.winnerName}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick stats */}
        <QuickStats
          songs={data.stats.songs}
          votes={data.stats.votes}
          players={data.stats.players}
        />

        {/* Track list */}
        {topSubmissions.length > 0 && (
          <TrackList submissions={topSubmissions} />
        )}

        {/* Minigame Results */}
        {data.minigameResults && data.minigameResults.length > 0 && (
          <div className="minigame-results">
            <h4 className="minigame-title">
              <span className="minigame-icon" aria-hidden="true">🎯</span>
              Top Guessers
            </h4>
            <div className="minigame-leaderboard">
              {data.minigameResults.map((guesser, index) => (
                <div key={guesser.name} className="minigame-entry">
                  <span className="minigame-rank">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                  </span>
                  <span className="minigame-name">{guesser.name}</span>
                  <span className="minigame-score">
                    {guesser.correctCount}/{guesser.totalGuesses}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voting Patterns - who gave most/least to whom */}
        {data.votingPatterns && data.votingPatterns.length > 0 && (
          <div className="voting-patterns">
            <h4 className="voting-patterns-title">
              <span className="voting-icon" aria-hidden="true">💌</span>
              Who Voted for Whom
            </h4>
            <div className="voting-patterns-list">
              {/* Group by voter */}
              {Array.from(
                data.votingPatterns.reduce((acc, pattern) => {
                  if (!acc.has(pattern.voterName)) {
                    acc.set(pattern.voterName, { most: null, least: null });
                  }
                  const entry = acc.get(pattern.voterName)!;
                  if (pattern.type === "most") {
                    entry.most = pattern;
                  } else {
                    entry.least = pattern;
                  }
                  return acc;
                }, new Map<string, { most: typeof data.votingPatterns[0] | null; least: typeof data.votingPatterns[0] | null }>())
              ).map(([voterName, { most, least }]) => (
                <div key={voterName} className="voting-pattern-row">
                  <span className="voter-name">{voterName}</span>
                  <div className="vote-targets">
                    {most && (
                      <span className="vote-target most">
                        <span className="arrow" aria-hidden="true">❤️</span>
                        {most.targetName}
                        <span className="points">({most.pointsGiven}pts)</span>
                      </span>
                    )}
                    {least && (
                      <span className="vote-target least">
                        <span className="arrow" aria-hidden="true">💔</span>
                        {least.targetName}
                        <span className="points">({least.pointsGiven}pts)</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin generation controls */}
        {isLead && adminCallbacks && (
          <div className="admin-generation-controls">
            <div className="admin-controls-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="admin-icon">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span>Admin</span>
            </div>
            {generationState?.statusMessage && (
              <p className="generation-status">{generationState.statusMessage}</p>
            )}
            <div className="admin-buttons">
              <button
                type="button"
                className="admin-gen-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  adminCallbacks.onGenerateThemeBanner?.(data.id);
                }}
                disabled={generationState?.isBannerLoading}
                title="Generate theme banner image"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                {generationState?.isBannerLoading ? "..." : "Banner"}
              </button>
              <button
                type="button"
                className="admin-gen-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  adminCallbacks.onGenerateStory?.(data.id);
                }}
                disabled={generationState?.isStoryLoading}
                title="Generate round story and winners art"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                {generationState?.isStoryLoading ? "..." : "Story"}
              </button>
              <button
                type="button"
                className="admin-gen-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  adminCallbacks.onGenerateAwards?.(data.id);
                }}
                disabled={generationState?.isAwardsLoading}
                title="Generate awards for this round"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="7" />
                  <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
                </svg>
                {generationState?.isAwardsLoading ? "..." : "Awards"}
              </button>
              <button
                type="button"
                className="admin-gen-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  adminCallbacks.onGenerateWinnersImage?.(data.id);
                }}
                disabled={generationState?.isWinnersImageLoading}
                title="Generate winners image only"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                {generationState?.isWinnersImageLoading ? "..." : "Image"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Award Detail Modal */}
      {awardModalData && (
        <div className="award-modal-overlay" onClick={() => setAwardModalData(null)}>
          <div className="award-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="award-modal-close"
              onClick={() => setAwardModalData(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="award-modal-title">{awardModalData.name}</h3>
            {awardModalData.description && (
              <p className="award-modal-description">{awardModalData.description}</p>
            )}
            {awardModalData.winner && (
              <p className="award-modal-winner">
                <span className="winner-label">Winner:</span> {awardModalData.winner}
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
