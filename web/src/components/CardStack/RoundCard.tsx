/**
 * RoundCard - Individual round card in the card stack
 *
 * Displays a completed round with theme banner, stats,
 * track list, story narrative, and awards.
 */

import { useMemo } from "react";
import type { RoundCardProps } from "../../types/cardstack.types";
import { CARD_TRANSFORMS } from "../../types/cardstack.types";
import CardHero from "./CardHero";
import QuickStats from "./QuickStats";
import TrackList from "./TrackList";
import StoryPanel from "./StoryPanel";
import AwardsPreview from "./AwardsPreview";

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

  return (
    <article
      className={`round-card card-position-${position} ${isActive ? "active" : ""} ${isDragging ? "dragging" : ""}`}
      style={transformStyle}
      role="listitem"
      aria-label={`Round ${data.roundNumber}: ${data.theme}`}
    >
      {/* Hero section with theme banner */}
      <CardHero
        imageUrl={data.themeImageUrl}
        roundNumber={data.roundNumber}
        seasonNumber={data.seasonNumber}
        theme={data.theme}
        themeAuthor={data.themeAuthor}
        status={data.status}
      />

      {/* Scrollable content area */}
      <div className="card-content">
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

        {/* Story panel with narrative and winners art */}
        {(data.narrative || data.winnersImageUrl) && (
          <StoryPanel
            narrative={data.narrative}
            winnersImageUrl={data.winnersImageUrl}
          />
        )}

        {/* Awards preview */}
        {visibleAwards.length > 0 && (
          <AwardsPreview awards={visibleAwards} />
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
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
