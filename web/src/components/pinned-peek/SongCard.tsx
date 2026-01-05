import { useState } from "react";
import clsx from "clsx";
import { useYouTubeSidebar, extractYouTubeId } from "../youtube-sidebar";

type VoteRow = {
  voter_id: string | null;
  voter_name: string | null;
  points: number | null;
};

type Competitor = {
  id: string;
  name: string;
  profile_id: string | null;
};

type GuessState = {
  guessedCompetitorId: string | null;
  result: boolean | null; // true = correct, false = incorrect, null = not revealed
  isSaving: boolean;
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
    submitter_comment?: string | null;
  };
  votes?: VoteRow[];
  rank?: number; // 1, 2, 3 for top songs
  showSubmitter: boolean;
  showVotes: boolean;
  onQuote?: () => void;
  // Submitter guess props (optional)
  guessEnabled?: boolean;
  guessState?: GuessState;
  competitors?: Competitor[];
  isRevealed?: boolean;
  onGuessChange?: (competitorId: string) => void;
  onSaveGuess?: () => void;
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
  guessEnabled = false,
  guessState,
  competitors = [],
  isRevealed = false,
  onGuessChange,
  onSaveGuess,
}: SongCardProps) {
  const [votersExpanded, setVotersExpanded] = useState(false);
  const { openSidebar } = useYouTubeSidebar();

  // Find guessed competitor name for display
  const guessedCompetitor = guessState?.guessedCompetitorId
    ? competitors.find((c) => c.id === guessState.guessedCompetitorId)
    : null;

  // Get Spotify URL - prefer spotify_url, fall back to link if it's a Spotify link
  const spotifyUrl = song.spotify_url || (song.link?.includes("spotify") ? song.link : null);

  // Handle YouTube playback - either direct URL or search
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

        {/* Show submitter name if revealed, or guess UI if enabled during voting */}
        {showSubmitter && song.submitter_name && (
          <p className="song-card-submitter">by {song.submitter_name}</p>
        )}

        {/* Submitter guess UI - only during voting phase when enabled */}
        {guessEnabled && !isRevealed && onGuessChange && onSaveGuess && (
          <div className="song-card-guess">
            <select
              value={guessState?.guessedCompetitorId || ""}
              onChange={(e) => onGuessChange(e.target.value)}
              disabled={guessState?.isSaving}
              className="song-card-guess-select"
            >
              <option value="">Who submitted this?</option>
              {competitors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onSaveGuess}
              disabled={!guessState?.guessedCompetitorId || guessState?.isSaving}
              className="song-card-guess-save"
            >
              {guessState?.isSaving ? "..." : "Save"}
            </button>
          </div>
        )}

        {/* Guess result - shown after reveal */}
        {guessEnabled && isRevealed && guessState && (
          <div
            className={clsx(
              "song-card-guess-result",
              guessState.result === true && "correct",
              guessState.result === false && "incorrect"
            )}
          >
            {guessState.result === true && (
              <span>✓ Correct!</span>
            )}
            {guessState.result === false && guessedCompetitor && (
              <span>✗ You guessed {guessedCompetitor.name}</span>
            )}
            {guessState.result === null && guessState.guessedCompetitorId && guessedCompetitor && (
              <span style={{ color: "var(--text-muted)" }}>
                You guessed {guessedCompetitor.name}
              </span>
            )}
          </div>
        )}

        {song.submitter_comment && (
          <p className="song-card-comment">"{song.submitter_comment}"</p>
        )}

        <div className="song-card-actions">
          {spotifyUrl && (
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="song-card-action spotify"
              title="Listen on Spotify"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </a>
          )}
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
