/**
 * CardHero - Theme banner section for round cards
 *
 * Displays the theme image with gradient overlay,
 * round badge, and theme title.
 */

import type { RoundStatus } from "../../types/history.types";

interface CardHeroProps {
  imageUrl: string | null;
  roundNumber: number | null;
  seasonNumber: number | null;
  theme: string;
  themeAuthor: string | null;
  status: RoundStatus;
}

export default function CardHero({
  imageUrl,
  roundNumber,
  seasonNumber,
  theme,
  themeAuthor,
  status,
}: CardHeroProps) {
  // Status badge style
  const getStatusClass = () => {
    switch (status) {
      case "revealed":
        return "badge-new";
      case "archived":
        return "badge-archived";
      default:
        return "badge-default";
    }
  };

  return (
    <div className="card-hero">
      {/* Theme banner image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${theme} theme artwork`}
          className="hero-image"
          loading="lazy"
        />
      ) : (
        <div className="hero-placeholder">
          <span className="placeholder-icon" aria-hidden="true">
            🎵
          </span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="hero-overlay" aria-hidden="true" />

      {/* Round badge */}
      <div className={`round-badge ${getStatusClass()}`}>
        {seasonNumber && `S${seasonNumber} `}
        {roundNumber && `R${roundNumber}`}
        {!seasonNumber && !roundNumber && "Round"}
      </div>

      {/* Theme title and author */}
      <div className="hero-content">
        <h2 className="theme-title">{theme}</h2>
        {themeAuthor && (
          <p className="theme-author">Theme by {themeAuthor}</p>
        )}
      </div>
    </div>
  );
}
