import { useState, useEffect } from "react";
import clsx from "clsx";
import type { RhythmGameSong } from "../../hooks/useRhythmGameSongs";
import {
  getSpotifySearchUrl,
  getYouTubeMusicSearchUrl,
  getAppleMusicSearchUrl,
  formatSongForMention,
  fetchSpotifyData,
} from "../../hooks/useRhythmGameSongs";
import { useAuth } from "../../contexts/AuthContext";

type ResearchSongCardProps = {
  song: RhythmGameSong;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onMention?: (text: string) => void;
  rankPosition?: number; // Display position (1-based) in favorites list
  totalFavorites?: number; // Total number of favorites
  onMoveUp?: () => void; // Move up in ranking (only for favorites)
  onMoveDown?: () => void; // Move down in ranking (only for favorites)
};

// SVG Icons
const GuitarHeroIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="franchise-icon gh-icon" aria-label="Guitar Hero">
    <title>Guitar Hero</title>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-3.5l6-4.5-6-4.5v9z"/>
  </svg>
);

const RockBandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="franchise-icon rb-icon" aria-label="Rock Band">
    <title>Rock Band</title>
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4"/>
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const SpotifyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

export default function ResearchSongCard({
  song,
  isFavorite,
  onToggleFavorite,
  onMention,
  rankPosition,
  totalFavorites,
  onMoveUp,
  onMoveDown,
}: ResearchSongCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [spotifyData, setSpotifyData] = useState<{
    spotify_url: string | null;
    artwork_url: string | null;
  } | null>(null);
  const [loadingSpotify, setLoadingSpotify] = useState(false);
  const { profile } = useAuth();

  // Lazy-load Spotify data when card becomes visible
  useEffect(() => {
    if (song.spotify_url && song.artwork_url) {
      setSpotifyData({
        spotify_url: song.spotify_url,
        artwork_url: song.artwork_url,
      });
      return;
    }

    let cancelled = false;

    async function loadSpotifyData() {
      if (loadingSpotify || spotifyData) return;

      setLoadingSpotify(true);
      const data = await fetchSpotifyData(song);

      if (!cancelled) {
        setSpotifyData({
          spotify_url: data.spotify_url,
          artwork_url: data.artwork_url,
        });
        setLoadingSpotify(false);
      }
    }

    loadSpotifyData();

    return () => {
      cancelled = true;
    };
  }, [song]);

  // Get the appropriate music service URL based on user preference
  const preferredProvider = profile?.preferred_music_provider ?? "spotify";

  const getMusicUrl = () => {
    // Use real Spotify link if available
    if (preferredProvider === "spotify" && spotifyData?.spotify_url) {
      return spotifyData.spotify_url;
    }

    // Fallback to search URLs
    switch (preferredProvider) {
      case "apple_music":
        return getAppleMusicSearchUrl(song);
      case "youtube_music":
        return getYouTubeMusicSearchUrl(song);
      default:
        return getSpotifySearchUrl(song);
    }
  };

  const handleMention = () => {
    if (onMention) {
      onMention(formatSongForMention(song));
    }
  };

  return (
    <div className={clsx("research-song-card", expanded && "expanded", rankPosition && "ranked")}>
      <div className="research-song-card-main">
        {/* Rank badge for favorites */}
        {rankPosition && (
          <div className="rank-badge" title={`Rank #${rankPosition} of ${totalFavorites}`}>
            {rankPosition}
          </div>
        )}

        {/* Album artwork */}
        {spotifyData?.artwork_url ? (
          <img
            src={spotifyData.artwork_url}
            alt={`${song.title} album art`}
            className="research-song-artwork"
          />
        ) : (
          <div className="research-song-artwork research-song-artwork-placeholder">
            {loadingSpotify ? "..." : "♪"}
          </div>
        )}

        {/* Franchise icons */}
        <div className="research-song-card-icons">
          {song.is_guitar_hero && <GuitarHeroIcon />}
          {song.is_rock_band && <RockBandIcon />}
        </div>

        {/* Song info */}
        <div className="research-song-card-info" onClick={() => setExpanded(!expanded)}>
          <div className="research-song-card-title">
            {song.title}
            {song.is_dlc && <span className="dlc-badge">DLC</span>}
          </div>
          <div className="research-song-card-artist">{song.artist}</div>
          <div className="research-song-card-meta">
            {song.year && <span>{song.year}</span>}
            {song.genre && <span className="genre-tag">{song.genre}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="research-song-card-actions">
          {/* Ranking arrows (only for favorites) */}
          {(onMoveUp || onMoveDown) && (
            <div className="rank-controls">
              <button
                type="button"
                className="rank-arrow rank-arrow-up"
                onClick={onMoveUp}
                disabled={!onMoveUp}
                title="Move up in ranking"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                type="button"
                className="rank-arrow rank-arrow-down"
                onClick={onMoveDown}
                disabled={!onMoveDown}
                title="Move down in ranking"
                aria-label="Move down"
              >
                ▼
              </button>
            </div>
          )}

          <button
            type="button"
            className={clsx("research-action-btn favorite-btn", isFavorite && "is-favorite")}
            onClick={onToggleFavorite}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <HeartIcon filled={isFavorite} />
          </button>
          <a
            href={getMusicUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="research-action-btn music-link"
            title={`Search on ${preferredProvider === "apple_music" ? "Apple Music" : preferredProvider === "youtube_music" ? "YouTube Music" : "Spotify"}`}
          >
            <SpotifyIcon />
          </a>
          {onMention && (
            <button
              type="button"
              className="research-action-btn mention-btn"
              onClick={handleMention}
              title="Share in chat"
            >
              @
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="research-song-card-details">
          <div className="games-list">
            <strong>Appears in:</strong>
            <ul>
              {song.games.map((game, i) => (
                <li key={i}>{game}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
