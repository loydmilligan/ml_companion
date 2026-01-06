/**
 * TrackList - Song submissions list
 *
 * Displays up to 6 submissions with artwork,
 * title, artist, points badge, and platform links.
 */

import type { SubmissionWithVotes } from "../../types/cardstack.types";
import { useAuth } from "../../contexts/AuthContext";

// Platform icons
const SpotifyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const AppleMusicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.8.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.296-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.8-.6-1.965-1.483-.18-.965.39-1.922 1.343-2.196.334-.096.676-.17 1.016-.246.378-.085.757-.16 1.123-.28.252-.083.39-.256.425-.518.01-.078.015-.158.015-.237V9.456c0-.09-.012-.18-.04-.265-.04-.126-.14-.2-.27-.18-.097.016-.195.04-.29.063L11.3 10.2c-.015.004-.03.01-.046.014-.147.044-.218.136-.23.29-.003.034-.005.07-.005.104v7.57c0 .2-.015.4-.054.594-.078.39-.237.743-.516 1.028-.42.43-.934.663-1.528.752-.404.06-.81.06-1.206-.032-.93-.215-1.57-1.044-1.526-1.975.037-.78.496-1.46 1.318-1.747.36-.125.73-.21 1.1-.304.296-.075.594-.14.88-.238.303-.104.453-.3.477-.622.005-.06.007-.12.007-.18V7.51c0-.197.033-.39.1-.578.083-.228.232-.392.46-.468.12-.04.243-.07.368-.093l7.453-1.63c.096-.02.193-.035.29-.04.25-.012.426.134.47.383.016.09.022.18.022.27v4.76z"/>
  </svg>
);

const YoutubeMusicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface TrackListProps {
  submissions: SubmissionWithVotes[];
}

export default function TrackList({ submissions }: TrackListProps) {
  const { profile } = useAuth();
  const preferredProvider = profile?.preferred_music_provider ?? "spotify";
  const showYoutubeVideo = profile?.show_youtube_video ?? true;

  if (submissions.length === 0) {
    return null;
  }

  // Get primary music link based on user preference
  const getPrimaryLink = (submission: SubmissionWithVotes) => {
    switch (preferredProvider) {
      case "apple_music":
        return {
          url: submission.appleMusicUrl || submission.spotifyUrl || submission.link,
          provider: submission.appleMusicUrl ? "apple_music" : "spotify",
          icon: submission.appleMusicUrl ? <AppleMusicIcon /> : <SpotifyIcon />,
        };
      case "youtube_music":
        return {
          url: submission.youtubeMusicUrl || submission.spotifyUrl || submission.link,
          provider: submission.youtubeMusicUrl ? "youtube_music" : "spotify",
          icon: submission.youtubeMusicUrl ? <YoutubeMusicIcon /> : <SpotifyIcon />,
        };
      default:
        return {
          url: submission.spotifyUrl || submission.link,
          provider: "spotify",
          icon: <SpotifyIcon />,
        };
    }
  };

  return (
    <div className="track-list-section">
      <h3 className="section-label">
        <span className="label-icon" aria-hidden="true">🎵</span>
        Top Tracks
      </h3>
      <div className="track-list" role="list">
        {submissions.map((submission, index) => {
          const primaryLink = getPrimaryLink(submission);
          const hasYoutubeVideo = showYoutubeVideo && submission.youtubeUrl;

          return (
            <div
              key={submission.id}
              className="track-item"
              role="listitem"
            >
              {/* Rank number */}
              <span className="track-rank" aria-label={`Rank ${index + 1}`}>
                {index + 1}
              </span>

              {/* Album artwork */}
              <div className="track-artwork-container">
                {submission.artworkUrl ? (
                  <img
                    src={submission.artworkUrl}
                    alt=""
                    className="track-artwork"
                    loading="lazy"
                  />
                ) : (
                  <div className="track-artwork-placeholder">
                    <span aria-hidden="true">🎵</span>
                  </div>
                )}
              </div>

              {/* Track info */}
              <div className="track-info">
                <span className="track-title">{submission.title}</span>
                <span className="track-artist">
                  {submission.artist || "Unknown Artist"}
                </span>
                {submission.submitterName && (
                  <span className="track-submitter">
                    by {submission.submitterName}
                  </span>
                )}
              </div>

              {/* Platform links */}
              <div className="track-links">
                {primaryLink.url && (
                  <a
                    href={primaryLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`track-link-btn ${primaryLink.provider}`}
                    aria-label={`Open in ${primaryLink.provider.replace("_", " ")}`}
                  >
                    {primaryLink.icon}
                  </a>
                )}
                {hasYoutubeVideo && (
                  <a
                    href={submission.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="track-link-btn youtube"
                    aria-label="Watch on YouTube"
                  >
                    <YoutubeIcon />
                  </a>
                )}
              </div>

              {/* Points badge */}
              <div className="track-points">
                <span className="points-value">{submission.totalPoints}</span>
                <span className="points-label">pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
