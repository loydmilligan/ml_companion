import { useState } from "react";
import "./PlaylistView.css";

/**
 * PlaylistView Component
 *
 * A music-first history view designed to feel like a playlist interface.
 * Features:
 * - Expandable season/round sections
 * - Album art dominant design with dark theme
 * - Spotify-style track list items
 * - Quick actions: play on Spotify, quote in chat
 * - Filtering: your submissions, winners only, by artist
 *
 * Usage:
 * <PlaylistView
 *   seasons={seasonData}
 *   currentUserId="user-123"
 *   onPlaySpotify={(trackUri) => window.open(trackUri)}
 *   onQuoteInChat={(songId, quote) => sendToChat(quote)}
 * />
 */

interface Track {
  id: string;
  title: string;
  artist: string;
  submitter_name: string;
  submitter_id: string;
  artwork_url: string | null;
  source_uri: string | null;
  link: string | null;
  points: number;
  is_winner?: boolean;
}

interface Round {
  id: string;
  theme: string;
  round_number: number;
  tracks: Track[];
}

interface Season {
  id: string;
  name: string;
  season_number: number;
  rounds: Round[];
}

interface PlaylistViewProps {
  seasons: Season[];
  currentUserId?: string;
  onPlaySpotify?: (uri: string) => void;
  onQuoteInChat?: (songId: string, quote: string) => void;
}

type FilterType = "all" | "mine" | "winners" | "artist";

export default function PlaylistView({
  seasons,
  currentUserId,
  onPlaySpotify,
  onQuoteInChat
}: PlaylistViewProps) {
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [artistFilter, setArtistFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const toggleSeason = (seasonId: string) => {
    const newExpanded = new Set(expandedSeasons);
    if (newExpanded.has(seasonId)) {
      newExpanded.delete(seasonId);
    } else {
      newExpanded.add(seasonId);
    }
    setExpandedSeasons(newExpanded);
  };

  const toggleRound = (roundId: string) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(roundId)) {
      newExpanded.delete(roundId);
    } else {
      newExpanded.add(roundId);
    }
    setExpandedRounds(newExpanded);
  };

  const filterTracks = (tracks: Track[]) => {
    return tracks.filter(track => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          track.title.toLowerCase().includes(query) ||
          track.artist.toLowerCase().includes(query) ||
          track.submitter_name.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Type filters
      if (filterType === "mine" && track.submitter_id !== currentUserId) return false;
      if (filterType === "winners" && !track.is_winner) return false;
      if (filterType === "artist" && artistFilter && track.artist !== artistFilter) return false;

      return true;
    });
  };

  const handlePlaySpotify = (track: Track) => {
    if (track.source_uri) {
      onPlaySpotify?.(track.source_uri);
    } else if (track.link) {
      window.open(track.link, "_blank");
    }
  };

  const handleQuote = (track: Track) => {
    const quote = `"${track.title}" by ${track.artist} (submitted by ${track.submitter_name})`;
    onQuoteInChat?.(track.id, quote);
  };

  // Get unique artists for filter dropdown
  const allArtists = new Set<string>();
  seasons.forEach(season =>
    season.rounds.forEach(round =>
      round.tracks.forEach(track => allArtists.add(track.artist))
    )
  );

  return (
    <div className="playlist-view">
      {/* Header */}
      <div className="playlist-header">
        <div className="playlist-header-content">
          <h1 className="playlist-title">Your Music League History</h1>
          <p className="playlist-subtitle">Every song, every round, every season</p>
        </div>
      </div>

      {/* Filters */}
      <div className="playlist-filters">
        <div className="filter-group">
          <button
            className={`filter-btn ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Tracks
          </button>
          <button
            className={`filter-btn ${filterType === "mine" ? "active" : ""}`}
            onClick={() => setFilterType("mine")}
          >
            My Submissions
          </button>
          <button
            className={`filter-btn ${filterType === "winners" ? "active" : ""}`}
            onClick={() => setFilterType("winners")}
          >
            Winners Only
          </button>
          <button
            className={`filter-btn ${filterType === "artist" ? "active" : ""}`}
            onClick={() => setFilterType("artist")}
          >
            By Artist
          </button>
        </div>

        {filterType === "artist" && (
          <select
            className="artist-select"
            value={artistFilter}
            onChange={(e) => setArtistFilter(e.target.value)}
          >
            <option value="">Select an artist...</option>
            {Array.from(allArtists).sort().map(artist => (
              <option key={artist} value={artist}>{artist}</option>
            ))}
          </select>
        )}

        <input
          type="text"
          className="search-input"
          placeholder="Search songs, artists, or submitters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Season List */}
      <div className="playlist-content">
        {seasons.map(season => {
          const isSeasonExpanded = expandedSeasons.has(season.id);

          return (
            <div key={season.id} className="season-section">
              {/* Season Header */}
              <button
                className="season-header"
                onClick={() => toggleSeason(season.id)}
              >
                <div className="season-info">
                  <span className="season-number">Season {season.season_number}</span>
                  <h2 className="season-name">{season.name}</h2>
                  <span className="season-stats">
                    {season.rounds.length} rounds
                  </span>
                </div>
                <svg
                  className={`expand-icon ${isSeasonExpanded ? "expanded" : ""}`}
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>

              {/* Rounds */}
              {isSeasonExpanded && (
                <div className="rounds-container">
                  {season.rounds.map(round => {
                    const isRoundExpanded = expandedRounds.has(round.id);
                    const filteredTracks = filterTracks(round.tracks);

                    return (
                      <div key={round.id} className="round-section">
                        {/* Round Header */}
                        <button
                          className="round-header"
                          onClick={() => toggleRound(round.id)}
                        >
                          <div className="round-info">
                            <span className="round-number">Round {round.round_number}</span>
                            <h3 className="round-theme">{round.theme}</h3>
                            <span className="track-count">
                              {filteredTracks.length} {filteredTracks.length === 1 ? "track" : "tracks"}
                            </span>
                          </div>
                          <svg
                            className={`expand-icon ${isRoundExpanded ? "expanded" : ""}`}
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>

                        {/* Track List */}
                        {isRoundExpanded && (
                          <div className="track-list">
                            {filteredTracks.length > 0 ? (
                              filteredTracks.map((track, index) => (
                                <div key={track.id} className="track-item">
                                  {/* Track Number */}
                                  <div className="track-index">
                                    {index + 1}
                                  </div>

                                  {/* Album Art */}
                                  <div className="track-artwork">
                                    {track.artwork_url ? (
                                      <img src={track.artwork_url} alt={track.title} />
                                    ) : (
                                      <div className="artwork-placeholder">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                          <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                      </div>
                                    )}
                                  </div>

                                  {/* Track Info */}
                                  <div className="track-info">
                                    <div className="track-title">
                                      {track.title}
                                      {track.is_winner && (
                                        <span className="winner-badge">
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                          </svg>
                                        </span>
                                      )}
                                    </div>
                                    <div className="track-meta">
                                      <span className="track-artist">{track.artist}</span>
                                      <span className="meta-separator">•</span>
                                      <span className="track-submitter">{track.submitter_name}</span>
                                    </div>
                                  </div>

                                  {/* Points */}
                                  <div className="track-points">
                                    {track.points} pts
                                  </div>

                                  {/* Actions */}
                                  <div className="track-actions">
                                    <button
                                      className="action-btn play-btn"
                                      onClick={() => handlePlaySpotify(track)}
                                      title="Play on Spotify"
                                    >
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                    </button>
                                    <button
                                      className="action-btn quote-btn"
                                      onClick={() => handleQuote(track)}
                                      title="Quote in chat"
                                    >
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="2"/>
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="empty-state">
                                <p>No tracks match your filters</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
