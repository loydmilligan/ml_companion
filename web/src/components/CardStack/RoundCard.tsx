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
      </div>
    </article>
  );
}
