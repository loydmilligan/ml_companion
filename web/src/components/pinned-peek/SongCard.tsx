import React, { useState } from "react";
import clsx from "clsx";
import { useYouTubeSidebar, extractYouTubeId } from "../youtube-sidebar";
import { useAuth } from "../../contexts/AuthContext";

type VoteRow = {
  voter_id: string | null;
  voter_name: string | null;
  points: number | null;
};

type SongCardProps = {
  song: {
    id: string;
    title: string;
    artist: string | null;
    link: string | null;
    artwork_url: string | null;
    submitter_name?: string | null;
    youtube_url?: string | null;
    spotify_url?: string | null;
    apple_music_url?: string | null;
    youtube_music_url?: string | null;
    source_uri?: string | null;
  };
  votes?: VoteRow[];
  rank?: number; // 1, 2, 3 for top songs
  showSubmitter: boolean;
  showVotes: boolean;
  onQuote?: () => void;
};

function getTrophyClass(rank: number): string {
  switch (rank) {
    case 1: return "gold";
    case 2: return "silver";
    case 3: return "bronze";
    default: return "";
  }
}

function getTrophyEmoji(rank: number): string {
  switch (rank) {
    case 1: return "🥇";
    case 2: return "🥈";
    case 3: return "🥉";
    default: return "";
  }
}

export default function SongCard({
  song,
  votes = [],
  rank,
  showSubmitter,
  showVotes,
  onQuote,
}: SongCardProps) {
  const [votersExpanded, setVotersExpanded] = useState(false);
  const { openSidebar } = useYouTubeSidebar();
  const { profile } = useAuth();

  // User preferences with defaults
  const preferredProvider = profile?.preferred_music_provider ?? "spotify";
  const showYoutubeVideo = profile?.show_youtube_video ?? true;

  // Helper to convert Spotify URI to URL
  const spotifyUriToUrl = (uri: string | null | undefined): string | null => {
    if (!uri) return null;
    if (uri.startsWith("spotify:track:")) {
      const trackId = uri.replace("spotify:track:", "");
      return `https://open.spotify.com/track/${trackId}`;
    }
    return null;
  };

  // Get URLs for each provider
  const spotifyUrl = song.spotify_url || spotifyUriToUrl(song.source_uri) || (song.link?.includes("spotify") ? song.link : null);
  const appleMusicUrl = song.apple_music_url;
  const youtubeMusicUrl = song.youtube_music_url;

  // Get the primary music link based on user preference
  const getPrimaryMusicLink = (): { url: string | null; provider: string; providerClass: string; icon: React.ReactNode } => {
    switch (preferredProvider) {
      case "apple_music":
        return {
          url: appleMusicUrl || spotifyUrl, // Fallback to Spotify if no Apple Music
          provider: appleMusicUrl ? "Apple Music" : "Spotify",
          providerClass: appleMusicUrl ? "apple_music" : "spotify",
          icon: appleMusicUrl ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.99c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.802.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.107 1.596-.35 2.296-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.785-.56-2.09-1.43-.357-1.013.082-2.16 1.047-2.66.37-.19.77-.3 1.17-.37.48-.09.96-.14 1.44-.225.48-.09.64-.36.64-.83V9.93c0-.18-.08-.26-.26-.24l-4.68 1.06c-.3.07-.36.15-.36.46v7.37c0 .42-.05.84-.24 1.23-.29.6-.77.97-1.4 1.15-.34.1-.7.15-1.05.17-.96.04-1.8-.56-2.1-1.43-.36-1.02.08-2.17 1.05-2.67.36-.19.76-.3 1.16-.37.5-.09.99-.15 1.48-.24.39-.07.58-.33.58-.73v-8.07c0-.37.1-.63.47-.73.5-.14 1.01-.26 1.52-.39l4.78-1.17c.32-.08.64-.17.96-.24.2-.05.33.04.36.25.01.07.01.13.01.2v5.7z"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          ),
        };
      case "youtube_music":
        return {
          url: youtubeMusicUrl || spotifyUrl, // Fallback to Spotify if no YT Music
          provider: youtubeMusicUrl ? "YouTube Music" : "Spotify",
          providerClass: youtubeMusicUrl ? "youtube_music" : "spotify",
          icon: youtubeMusicUrl ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228 18.228 15.432 18.228 12 15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          ),
        };
      default: // spotify
        return {
          url: spotifyUrl,
          provider: "Spotify",
          providerClass: "spotify",
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          ),
        };
    }
  };

  const primaryMusic = getPrimaryMusicLink();

  // Handle YouTube video playback - either direct URL or search
  const handleYouTubeClick = () => {
    if (song.youtube_url) {
      const videoId = extractYouTubeId(song.youtube_url);
      if (videoId) {
        openSidebar(videoId, `${song.title} - ${song.artist || "Unknown"}`);
        return;
      }
    }
    // Fallback to search
    window.open(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.title} ${song.artist || ""}`)}`,
      "_blank"
    );
  };

  const totalPoints = votes.reduce((sum, v) => sum + (v.points ?? 0), 0);
  const voterNames = votes
    .filter((v) => v.points && v.points > 0)
    .map((v) => v.voter_name || "Anonymous");

  const isRanked = rank && rank <= 3;

  return (
    <div
      className={clsx(
        "song-card",
        isRanked && "ranked",
        isRanked && `rank-${rank}`
      )}
    >
      {isRanked && (
        <div className={clsx("song-card-trophy", getTrophyClass(rank))}>
          {getTrophyEmoji(rank)}
        </div>
      )}

      {song.artwork_url ? (
        <img
          src={song.artwork_url}
          alt={song.title}
          className="song-card-artwork"
        />
      ) : (
        <div className="song-card-artwork" />
      )}

      <div className="song-card-info">
        <h4 className="song-card-title">{song.title}</h4>
        <p className="song-card-artist">{song.artist ?? "Unknown artist"}</p>

        {/* Show submitter name if revealed */}
        {showSubmitter && song.submitter_name && (
          <p className="song-card-submitter">by {song.submitter_name}</p>
        )}

        <div className="song-card-actions">
          {primaryMusic.url && (
            <a
              href={primaryMusic.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`song-card-action music-provider ${primaryMusic.providerClass}`}
              title={`Listen on ${primaryMusic.provider}`}
            >
              {primaryMusic.icon}
            </a>
          )}
          {showYoutubeVideo && (
            <button
              type="button"
              className={`song-card-action youtube ${song.youtube_url ? "has-link" : ""}`}
              onClick={handleYouTubeClick}
              title={song.youtube_url ? "Play on YouTube" : "Search on YouTube"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </button>
          )}
          {onQuote && (
            <button
              type="button"
              className="song-card-action quote"
              onClick={onQuote}
              title="Quote in chat"
            >
              @
            </button>
          )}
        </div>

        {showVotes && votes.length > 0 && (
          <div className={clsx("song-card-voters", votersExpanded && "expanded")}>
            <button
              type="button"
              className="song-card-voters-toggle"
              onClick={() => setVotersExpanded(!votersExpanded)}
            >
              <span>{totalPoints} pts</span>
              <span>•</span>
              <span>{voterNames.length} voters</span>
              <span>{votersExpanded ? "▲" : "▼"}</span>
            </button>

            <div className="song-card-voters-list">
              {voterNames.map((name, index) => (
                <span key={index} className="song-card-voter">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
