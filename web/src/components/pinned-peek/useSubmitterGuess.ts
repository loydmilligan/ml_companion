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
  submitter_name?: string | null;
};

type SavedGuess = {
  submission_id: string;
  guessed_competitor_id: string | null;
  is_correct: boolean | null;
};

export type GuessState = {
  guessedCompetitorId: string | null;
  result: boolean | null;
  isSaving: boolean;
  isOwnSong: boolean;
};

export type LeaderboardEntry = {
  guesser_id: string;
  guesser_name: string;
  correct_count: number;
  total_guesses: number;
};

type UseSubmitterGuessReturn = {
  competitors: Competitor[];
  guessStates: Record<string, GuessState>;
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  correctCount: number;
  totalGuessed: number;
  maxPossibleGuesses: number;
  handleGuessChange: (submissionId: string, competitorId: string) => void;
  handleSaveGuess: (submissionId: string) => Promise<void>;
};

export function useSubmitterGuess(
  roundId: string | null,
  groupId: string | null,
  submissions: Submission[],
  isRevealed: boolean
): UseSubmitterGuessReturn {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [guesses, setGuesses] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userCompetitorName, setUserCompetitorName] = useState<string | null>(null);

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

    const competitorsList = (competitorData as Competitor[]) ?? [];
    setCompetitors(competitorsList);

    // Find the current user's competitor name (to identify their own song)
    const userCompetitor = competitorsList.find((c) => c.profile_id === userId);
    setUserCompetitorName(userCompetitor?.name ?? null);

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
        // profiles can be object or array depending on Supabase version
        const profileData = g.profiles as unknown;
        const profile = Array.isArray(profileData)
          ? (profileData[0] as { display_name: string } | undefined)
          : (profileData as { display_name: string } | null);
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

  const handleGuessChange = useCallback((submissionId: string, competitorId: string) => {
    setGuesses((prev) => ({ ...prev, [submissionId]: competitorId }));
  }, []);

  const handleSaveGuess = useCallback(async (submissionId: string) => {
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
  }, [userId, roundId, guesses]);

  // Build guess states object for each submission
  const guessStates: Record<string, GuessState> = {};
  let ownSongCount = 0;
  submissions.forEach((sub) => {
    // Check if this is the user's own song (case-insensitive match)
    const isOwnSong = userCompetitorName
      ? sub.submitter_name?.toLowerCase().trim() === userCompetitorName.toLowerCase().trim()
      : false;
    if (isOwnSong) ownSongCount++;

    guessStates[sub.id] = {
      guessedCompetitorId: guesses[sub.id] || null,
      result: results[sub.id] ?? null,
      isSaving: saving[sub.id] || false,
      isOwnSong,
    };
  });

  const correctCount = Object.values(results).filter((r) => r === true).length;
  const totalGuessed = Object.values(guesses).filter(Boolean).length;
  // Max possible guesses is total submissions minus user's own song(s)
  const maxPossibleGuesses = submissions.length - ownSongCount;

  return {
    competitors,
    guessStates,
    leaderboard,
    loading,
    correctCount,
    totalGuessed,
    maxPossibleGuesses,
    handleGuessChange,
    handleSaveGuess,
  };
}
