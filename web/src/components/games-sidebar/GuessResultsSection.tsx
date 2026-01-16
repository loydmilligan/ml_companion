import { useGuessAccuracy, type PersonalAccuracy } from "./useGuessAccuracy";
import type { LeaderboardEntry } from "../pinned-peek/useSubmitterGuess";
import "./GuessResultsSection.css";

type Props = {
  groupId: string | null;
  leaderboard: LeaderboardEntry[];
  correctCount: number;
  maxPossibleGuesses: number;
  userDisplayName: string;
  isRevealed: boolean;
};

export default function GuessResultsSection({
  groupId,
  leaderboard,
  correctCount,
  maxPossibleGuesses,
  userDisplayName,
  isRevealed,
}: Props) {
  const { personalAccuracy, loading } = useGuessAccuracy(groupId, isRevealed);

  // Find user's accuracy data
  const userAccuracy: PersonalAccuracy | null = personalAccuracy[userDisplayName] ?? null;

  // Get all guessers sorted by best accuracy
  const allGuessers = Object.entries(personalAccuracy)
    .filter(([, acc]) => acc.bestTarget !== null)
    .sort((a, b) => {
      const aAcc = a[1].bestTarget?.accuracy ?? 0;
      const bAcc = b[1].bestTarget?.accuracy ?? 0;
      return bAcc - aAcc;
    });

  if (loading) {
    return <div className="results-loading">Loading results...</div>;
  }

  return (
    <div className="guess-results-section">
      {/* Personal Results */}
      <div className="results-personal">
        <h4>Your Results</h4>
        <div className="results-score">
          <span className="score-big">{correctCount}/{maxPossibleGuesses}</span>
          <span className="score-label">correct this round</span>
        </div>
        {userAccuracy && (
          <div className="results-patterns">
            {userAccuracy.bestTarget && (
              <p className="pattern-good">
                You're great at guessing <strong>{userAccuracy.bestTarget.name}</strong>'s songs
                <span className="pattern-stat">
                  ({userAccuracy.bestTarget.accuracy}% over {userAccuracy.bestTarget.total} guesses)
                </span>
              </p>
            )}
            {userAccuracy.worstTarget && (
              <p className="pattern-bad">
                <strong>{userAccuracy.worstTarget.name}</strong> keeps fooling you
                <span className="pattern-stat">
                  ({userAccuracy.worstTarget.accuracy}% over {userAccuracy.worstTarget.total} guesses)
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* League Leaderboard - This Round */}
      {leaderboard.length > 0 && (
        <div className="results-league">
          <h4>Top Guessers This Round</h4>
          <div className="leaderboard-list">
            {leaderboard.map((entry, index) => (
              <div key={entry.guesser_id} className="leaderboard-entry">
                <span className="leaderboard-rank">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                </span>
                <span className="leaderboard-name">{entry.guesser_name}</span>
                <span className="leaderboard-score">
                  {entry.correct_count}/{entry.total_guesses}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accuracy Matrix - All Time */}
      {allGuessers.length > 0 && (
        <div className="results-matrix">
          <h4>Who Can Guess Whom? (All-Time)</h4>
          <p className="matrix-hint">
            Based on guesses across all revealed rounds
          </p>
          <div className="accuracy-grid">
            <table>
              <thead>
                <tr>
                  <th>Guesser</th>
                  <th>Best At Guessing</th>
                  <th>Worst At Guessing</th>
                </tr>
              </thead>
              <tbody>
                {allGuessers.map(([guesser, acc]) => (
                  <tr key={guesser} className={guesser === userDisplayName ? "current-user" : ""}>
                    <td className="guesser-name">
                      {guesser}
                      {guesser === userDisplayName && <span className="you-badge">You</span>}
                    </td>
                    <td className="accuracy-good">
                      {acc.bestTarget
                        ? `${acc.bestTarget.name} (${acc.bestTarget.accuracy}%)`
                        : "-"}
                    </td>
                    <td className="accuracy-bad">
                      {acc.worstTarget
                        ? `${acc.worstTarget.name} (${acc.worstTarget.accuracy}%)`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Show message if no accuracy data yet */}
      {allGuessers.length === 0 && (
        <div className="results-empty">
          <p>Accuracy tracking will appear after a few rounds!</p>
          <p className="hint">Each person needs at least 2 guesses per submitter to show patterns.</p>
        </div>
      )}
    </div>
  );
}
