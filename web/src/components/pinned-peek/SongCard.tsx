import { useState } from "react";
import clsx from "clsx";

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

        {showSubmitter && song.submitter_name && (
          <p className="song-card-submitter">by {song.submitter_name}</p>
        )}

        <div className="song-card-actions">
          {song.link && (
            <a
              href={song.link}
              target="_blank"
              rel="noopener noreferrer"
              className="song-card-action spotify"
            >
              Listen
            </a>
          )}
          {onQuote && (
            <button
              type="button"
              className="song-card-action quote"
              onClick={onQuote}
            >
              @ Quote
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
