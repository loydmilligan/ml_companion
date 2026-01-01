/**
 * TrackList - Song submissions list
 *
 * Displays up to 6 submissions with artwork,
 * title, artist, and points badge.
 */

import type { SubmissionWithVotes } from "../../types/cardstack.types";

interface TrackListProps {
  submissions: SubmissionWithVotes[];
}

export default function TrackList({ submissions }: TrackListProps) {
  if (submissions.length === 0) {
    return null;
  }

  return (
    <div className="track-list-section">
      <h3 className="section-label">
        <span className="label-icon" aria-hidden="true">🎵</span>
        Top Tracks
      </h3>
      <div className="track-list" role="list">
        {submissions.map((submission, index) => (
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

            {/* Points badge */}
            <div className="track-points">
              <span className="points-value">{submission.totalPoints}</span>
              <span className="points-label">pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
