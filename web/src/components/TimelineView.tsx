import { useState } from "react";
import "./TimelineView.css";

/**
 * TimelineView Component
 *
 * A mobile-first vertical timeline displaying Music League history.
 * Shows seasons as major markers with expandable rounds.
 *
 * Features:
 * - Vertical timeline with connecting line
 * - Seasons as major visual markers
 * - Rounds as collapsible cards
 * - Visual indicators for user submissions/wins
 * - Smooth expand/collapse animations
 * - Touch-friendly interactions
 *
 * @example
 * <TimelineView
 *   data={timelineData}
 *   currentUserId="user-123"
 *   onRoundClick={(roundId) => console.log(roundId)}
 * />
 */

// Types
export interface Song {
  id: string;
  title: string;
  artist: string;
  submitterName: string | null;
  submitterId?: string;
  points: number;
  artworkUrl?: string;
  link?: string;
}

export interface Round {
  id: string;
  theme: string;
  themeDescription?: string;
  roundNumber: number;
  startDate: string;
  endDate: string;
  status: "revealed" | "archived";
  winner?: Song;
  songs: Song[];
  userSubmitted?: boolean; // User submitted to this round
  userWon?: boolean; // User won this round
}

export interface Season {
  id: string;
  name: string;
  seasonNumber: number;
  rounds: Round[];
  totalRounds: number;
  startDate: string;
  endDate?: string;
}

export interface TimelineViewProps {
  data: Season[];
  currentUserId?: string;
  onRoundClick?: (roundId: string) => void;
  className?: string;
}

export default function TimelineView({
  data,
  currentUserId,
  onRoundClick,
  className = "",
}: TimelineViewProps) {
  // Track expanded rounds by ID
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());

  const toggleRound = (roundId: string) => {
    setExpandedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(roundId)) {
        next.delete(roundId);
      } else {
        next.add(roundId);
      }
      return next;
    });
  };

  const handleRoundClick = (roundId: string) => {
    toggleRound(roundId);
    onRoundClick?.(roundId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDateRange = (start: string, end: string) => {
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  return (
    <div className={`timeline-view ${className}`}>
      <div className="timeline-track" />

      {data.map((season, seasonIndex) => (
        <div key={season.id} className="timeline-season">
          {/* Season Header - Major Marker */}
          <div className="timeline-marker season-marker">
            <div className="marker-dot season-dot">
              <span className="season-number">{season.seasonNumber}</span>
            </div>
            <div className="marker-content season-header">
              <h2 className="season-title">{season.name}</h2>
              <p className="season-meta">
                {season.totalRounds} rounds
                {season.endDate && (
                  <span className="season-dates">
                    {" • "}
                    {formatDateRange(season.startDate, season.endDate)}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Rounds within Season */}
          <div className="timeline-rounds">
            {season.rounds.map((round, roundIndex) => {
              const isExpanded = expandedRounds.has(round.id);
              const isFirst = roundIndex === 0;
              const isLast = roundIndex === season.rounds.length - 1;

              return (
                <div
                  key={round.id}
                  className={`timeline-round ${isFirst ? "first" : ""} ${isLast ? "last" : ""}`}
                >
                  {/* Round Marker */}
                  <div className="timeline-marker round-marker">
                    <div
                      className={`marker-dot round-dot ${round.userWon ? "won" : ""} ${
                        round.userSubmitted ? "submitted" : ""
                      }`}
                    >
                      <span className="round-number">{round.roundNumber}</span>
                    </div>

                    {/* Round Card */}
                    <button
                      className={`round-card ${isExpanded ? "expanded" : ""}`}
                      onClick={() => handleRoundClick(round.id)}
                      type="button"
                    >
                      <div className="round-header">
                        <div className="round-info">
                          <h3 className="round-theme">{round.theme}</h3>
                          {round.themeDescription && (
                            <p className="round-description">{round.themeDescription}</p>
                          )}
                          <p className="round-dates">{formatDateRange(round.startDate, round.endDate)}</p>
                        </div>

                        {/* Winner Preview */}
                        {round.winner && (
                          <div className="round-winner-preview">
                            {round.winner.artworkUrl && (
                              <img
                                src={round.winner.artworkUrl}
                                alt={`${round.winner.title} artwork`}
                                className="winner-artwork"
                              />
                            )}
                            <div className="winner-info">
                              <span className="winner-label">Winner</span>
                              <strong className="winner-title">{round.winner.title}</strong>
                              <span className="winner-artist">{round.winner.artist}</span>
                              {round.winner.submitterName && (
                                <span className="winner-submitter">by {round.winner.submitterName}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* User Badges */}
                        <div className="round-badges">
                          {round.userWon && <span className="badge badge-won">You Won</span>}
                          {round.userSubmitted && !round.userWon && (
                            <span className="badge badge-submitted">You Played</span>
                          )}
                        </div>

                        {/* Expand Icon */}
                        <div className={`expand-icon ${isExpanded ? "expanded" : ""}`}>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path
                              d="M5 7.5L10 12.5L15 7.5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Expanded Content - All Songs */}
                      <div className={`round-songs ${isExpanded ? "visible" : ""}`}>
                        <div className="songs-header">
                          <h4>All Submissions</h4>
                          <span className="song-count">{round.songs.length} songs</span>
                        </div>
                        <div className="songs-list">
                          {round.songs.map((song, index) => {
                            const isUserSubmission =
                              currentUserId && song.submitterId === currentUserId;
                            const position = index + 1;

                            return (
                              <div
                                key={song.id}
                                className={`song-item ${isUserSubmission ? "user-song" : ""}`}
                              >
                                <span className="song-position">{position}</span>
                                {song.artworkUrl && (
                                  <img
                                    src={song.artworkUrl}
                                    alt={`${song.title} artwork`}
                                    className="song-artwork"
                                  />
                                )}
                                <div className="song-info">
                                  <strong className="song-title">{song.title}</strong>
                                  <span className="song-artist">{song.artist}</span>
                                  {song.submitterName && (
                                    <span className="song-submitter">
                                      {isUserSubmission ? "Your pick" : song.submitterName}
                                    </span>
                                  )}
                                </div>
                                <div className="song-stats">
                                  <span className="song-points">{song.points} pts</span>
                                  {song.link && (
                                    <a
                                      href={song.link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="song-link"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Listen
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add spacing between seasons */}
          {seasonIndex < data.length - 1 && <div className="season-spacer" />}
        </div>
      ))}
    </div>
  );
}

/**
 * USAGE EXAMPLE:
 *
 * const mockData: Season[] = [
 *   {
 *     id: "season-1",
 *     name: "Winter Vibes 2024",
 *     seasonNumber: 1,
 *     totalRounds: 8,
 *     startDate: "2024-01-01",
 *     endDate: "2024-03-31",
 *     rounds: [
 *       {
 *         id: "round-1",
 *         theme: "Songs that make you feel nostalgic",
 *         themeDescription: "Pick a track that takes you back",
 *         roundNumber: 1,
 *         startDate: "2024-01-01",
 *         endDate: "2024-01-15",
 *         status: "revealed",
 *         userSubmitted: true,
 *         userWon: false,
 *         winner: {
 *           id: "song-1",
 *           title: "September",
 *           artist: "Earth, Wind & Fire",
 *           submitterName: "Dad",
 *           points: 45,
 *           artworkUrl: "https://example.com/artwork.jpg"
 *         },
 *         songs: [
 *           {
 *             id: "song-1",
 *             title: "September",
 *             artist: "Earth, Wind & Fire",
 *             submitterName: "Dad",
 *             points: 45
 *           },
 *           // ... more songs
 *         ]
 *       }
 *     ]
 *   }
 * ];
 *
 * <TimelineView
 *   data={mockData}
 *   currentUserId="user-123"
 *   onRoundClick={(id) => console.log("Round clicked:", id)}
 * />
 */
