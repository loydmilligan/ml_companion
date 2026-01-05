import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

type Competitor = {
  id: string;
  name: string;
  profile_id: string | null;
};

type Submission = {
  id: string;
  title: string;
  artist: string | null;
  artwork_url: string | null;
  submitter_name?: string | null;
};

type SavedGuess = {
  submission_id: string;
  guessed_competitor_id: string | null;
  is_correct: boolean | null;
};

type LeaderboardEntry = {
  guesser_id: string;
  guesser_name: string;
  correct_count: number;
  total_guesses: number;
};

type SubmitterGuessProps = {
  roundId: string;
  groupId: string;
  submissions: Submission[];
  isRevealed: boolean;
};

export default function SubmitterGuess({
  roundId,
  groupId,
  submissions,
  isRevealed,
}: SubmitterGuessProps) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [guesses, setGuesses] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Load competitors and user's saved guesses
  const loadData = useCallback(async () => {
    if (!groupId || !roundId || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch competitors for this group
    const { data: competitorData } = await supabase
      .from("season_competitors")
      .select("id,name,profile_id")
      .eq("group_id", groupId)
      .order("name");

    setCompetitors((competitorData as Competitor[]) ?? []);

    // Fetch user's saved guesses for this round
    const { data: guessData } = await supabase
      .from("submitter_guesses")
      .select("submission_id,guessed_competitor_id,is_correct")
      .eq("round_id", roundId)
      .eq("guesser_id", userId);

    if (guessData && guessData.length > 0) {
      const savedGuesses: Record<string, string> = {};
      const savedResults: Record<string, boolean | null> = {};

      (guessData as SavedGuess[]).forEach((g) => {
        if (g.guessed_competitor_id) {
          savedGuesses[g.submission_id] = g.guessed_competitor_id;
        }
        savedResults[g.submission_id] = g.is_correct;
      });

      setGuesses(savedGuesses);
      setResults(savedResults);
    }

    setLoading(false);
  }, [groupId, roundId, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When round is revealed, check correctness of guesses
  useEffect(() => {
    if (!isRevealed || submissions.length === 0 || competitors.length === 0) return;

    // Update results based on actual submitter names
    const newResults: Record<string, boolean | null> = {};

    submissions.forEach((sub) => {
      const guessedCompetitorId = guesses[sub.id];
      if (!guessedCompetitorId) {
        newResults[sub.id] = null;
        return;
      }

      const guessedCompetitor = competitors.find((c) => c.id === guessedCompetitorId);
      if (!guessedCompetitor || !sub.submitter_name) {
        newResults[sub.id] = null;
        return;
      }

      // Compare names (case-insensitive)
      const isCorrect =
        guessedCompetitor.name.toLowerCase().trim() ===
        sub.submitter_name.toLowerCase().trim();
      newResults[sub.id] = isCorrect;
    });

    setResults(newResults);
  }, [isRevealed, submissions, competitors, guesses]);

  // Fetch leaderboard when round is revealed
  useEffect(() => {
    if (!isRevealed || !roundId || !groupId) return;

    const fetchLeaderboard = async () => {
      // Get all guesses for this round with profile info
      const { data: allGuesses } = await supabase
        .from("submitter_guesses")
        .select(`
          guesser_id,
          is_correct,
          profiles!guesser_id(display_name)
        `)
        .eq("round_id", roundId);

      if (!allGuesses || allGuesses.length === 0) return;

      // Aggregate scores by guesser
      const scores: Record<string, { name: string; correct: number; total: number }> = {};

      allGuesses.forEach((g) => {
        const guesserId = g.guesser_id;
        const profile = g.profiles as { display_name: string } | null;
        const name = profile?.display_name ?? "Unknown";

        if (!scores[guesserId]) {
          scores[guesserId] = { name, correct: 0, total: 0 };
        }

        scores[guesserId].total += 1;
        if (g.is_correct === true) {
          scores[guesserId].correct += 1;
        }
      });

      // Convert to array and sort by correct count (descending)
      const leaderboardData: LeaderboardEntry[] = Object.entries(scores)
        .map(([id, { name, correct, total }]) => ({
          guesser_id: id,
          guesser_name: name,
          correct_count: correct,
          total_guesses: total,
        }))
        .sort((a, b) => b.correct_count - a.correct_count)
        .slice(0, 3); // Top 3 only

      setLeaderboard(leaderboardData);
    };

    fetchLeaderboard();
  }, [isRevealed, roundId, groupId]);

  const handleGuessChange = (submissionId: string, competitorId: string) => {
    setGuesses((prev) => ({ ...prev, [submissionId]: competitorId }));
  };

  const handleSaveGuess = async (submissionId: string) => {
    if (!userId || !roundId) return;

    const competitorId = guesses[submissionId];
    if (!competitorId) return;

    setSaving((prev) => ({ ...prev, [submissionId]: true }));

    try {
      const { error } = await supabase.from("submitter_guesses").upsert(
        {
          round_id: roundId,
          submission_id: submissionId,
          guesser_id: userId,
          guessed_competitor_id: competitorId,
          is_correct: null, // Will be set when round is revealed
        },
        { onConflict: "round_id,submission_id,guesser_id" }
      );

      if (error) {
        console.error("Error saving guess:", error);
      }
    } catch (err) {
      console.error("Error saving guess:", err);
    } finally {
      setSaving((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  const correctCount = Object.values(results).filter((r) => r === true).length;
  const totalGuessed = Object.values(guesses).filter(Boolean).length;

  if (!userId) {
    return (
      <div className="submitter-guess-section">
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Log in to play the submitter guessing game.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="submitter-guess-section">
        <div className="ai-assistant-loading">
          <div className="spinner" />
          <span>Loading game...</span>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return null;
  }

  return (
    <div className="submitter-guess-section">
      <div className="submitter-guess-header">
        <h3>Guess the Submitter</h3>
        {totalGuessed > 0 && (
          <span className="submitter-guess-score">
            {isRevealed ? `${correctCount}/${totalGuessed} correct` : `${totalGuessed} guessed`}
          </span>
        )}
      </div>

      <p className="submitter-guess-intro">
        {isRevealed
          ? "Results are in! See how well you know your league."
          : "Who submitted each song? Make your guesses before voting ends!"}
      </p>

      <div className="submitter-guess-list">
        {submissions.map((sub) => {
          const guessedId = guesses[sub.id];
          const result = results[sub.id];
          const isSaving = saving[sub.id];
          const guessedCompetitor = competitors.find((c) => c.id === guessedId);

          return (
            <div key={sub.id} className="submitter-guess-card">
              <div className="submitter-guess-song">
                {sub.artwork_url ? (
                  <img
                    src={sub.artwork_url}
                    alt={sub.title}
                    className="submitter-guess-artwork"
                  />
                ) : (
                  <div className="submitter-guess-artwork placeholder" />
                )}
                <div className="submitter-guess-song-info">
                  <p className="submitter-guess-title">{sub.title}</p>
                  <p className="submitter-guess-artist">{sub.artist ?? "Unknown"}</p>
                </div>
              </div>

              {isRevealed ? (
                <div
                  className={`submitter-guess-result ${
                    result === true ? "correct" : result === false ? "incorrect" : ""
                  }`}
                >
                  {result === true && (
                    <>
                      <span className="result-icon">✓</span>
                      <span>Correct! It was {sub.submitter_name}</span>
                    </>
                  )}
                  {result === false && (
                    <>
                      <span className="result-icon">✗</span>
                      <span>
                        Wrong! It was {sub.submitter_name}
                        {guessedCompetitor && ` (you guessed ${guessedCompetitor.name})`}
                      </span>
                    </>
                  )}
                  {result === null && guessedId && (
                    <span style={{ color: "var(--text-muted)" }}>
                      You guessed {guessedCompetitor?.name ?? "Unknown"}
                    </span>
                  )}
                  {result === null && !guessedId && (
                    <span style={{ color: "var(--text-muted)" }}>
                      Submitted by {sub.submitter_name ?? "Unknown"}
                    </span>
                  )}
                </div>
              ) : (
                <div className="submitter-guess-form">
                  <select
                    value={guessedId || ""}
                    onChange={(e) => handleGuessChange(sub.id, e.target.value)}
                    disabled={isSaving}
                  >
                    <option value="">Select a competitor...</option>
                    {competitors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleSaveGuess(sub.id)}
                    disabled={!guessedId || isSaving}
                    className="submitter-guess-save"
                  >
                    {isSaving ? "..." : "Save"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leaderboard - shown when revealed */}
      {isRevealed && leaderboard.length > 0 && (
        <div className="submitter-guess-leaderboard">
          <h4>Top Guessers</h4>
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
    </div>
  );
}
