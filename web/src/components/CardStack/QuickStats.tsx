/**
 * QuickStats - 3-column stats display
 *
 * Shows songs, votes, and players counts
 * with gradient pill backgrounds.
 */

interface QuickStatsProps {
  songs: number;
  votes: number;
  players: number;
}

export default function QuickStats({ songs, votes, players }: QuickStatsProps) {
  return (
    <div className="quick-stats" role="group" aria-label="Round statistics">
      <div className="stat-pill blue">
        <span className="stat-value">{songs}</span>
        <span className="stat-label">Songs</span>
      </div>
      <div className="stat-pill green">
        <span className="stat-value">{votes}</span>
        <span className="stat-label">Votes</span>
      </div>
      <div className="stat-pill purple">
        <span className="stat-value">{players}</span>
        <span className="stat-label">Players</span>
      </div>
    </div>
  );
}
