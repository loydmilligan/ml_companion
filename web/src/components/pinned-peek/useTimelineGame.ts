import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

type TimelineSubmission = {
  id: string;
  title: string;
  artist: string | null;
  artwork_url: string | null;
  release_year: number | null;
};

type TimelineGuess = {
  id: string;
  attempt_number: number;
  placement_order: string[];
  correct_count: number | null;
};

export type LeaderboardEntry = {
  player_id: string;
  player_name: string;
  correct_count: number;
};

type UseTimelineGameReturn = {
  // Data
  submissions: TimelineSubmission[];
  currentOrder: string[];
  attemptNumber: number;
  hintMessage: string | null;
  isLocked: boolean;
  loading: boolean;

  // Correct order (visible after revealed)
  correctOrder: string[] | null;
  finalScore: number | null;

  // Actions
  setOrder: (ids: string[]) => void;
  submitOrder: () => Promise<void>;

  // Leaderboard
  leaderboard: LeaderboardEntry[];

  // Submission states
  isSubmitting: boolean;
  canPlay: boolean;
};

export function useTimelineGame(
  roundId: string | null,
  _groupId: string | null,
  isRevealed: boolean
): UseTimelineGameReturn {
  void _groupId; // Reserved for future leaderboard filtering
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [submissions, setSubmissions] = useState<TimelineSubmission[]>([]);
  const [currentOrder, setCurrentOrder] = useState<string[]>([]);
  const [savedGuesses, setSavedGuesses] = useState<TimelineGuess[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Load submissions and user's saved guesses
  const loadData = useCallback(async () => {
    if (!roundId || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch submissions with release year
      const { data: submissionData } = await supabase
        .from("submissions")
        .select("id,title,artist,artwork_url,release_year")
        .eq("round_id", roundId)
        .order("created_at", { ascending: true });

      const subs = (submissionData as TimelineSubmission[]) ?? [];
      setSubmissions(subs);

      // Initialize order with submission IDs (random shuffle for first attempt)
      if (subs.length > 0) {
        setCurrentOrder(shuffleArray(subs.map((s) => s.id)));
      }

      // Fetch user's saved guesses for this round
      const { data: guessData } = await supabase
        .from("timeline_guesses")
        .select("id,attempt_number,placement_order,correct_count")
        .eq("round_id", roundId)
        .eq("player_id", userId)
        .order("attempt_number", { ascending: true });

      const guesses = (guessData as TimelineGuess[]) ?? [];
      setSavedGuesses(guesses);

      // If user has saved guesses, restore their last order
      if (guesses.length > 0) {
        const lastGuess = guesses[guesses.length - 1];
        setCurrentOrder(lastGuess.placement_order);
      }
    } catch (err) {
      console.error("Error loading timeline game data:", err);
    } finally {
      setLoading(false);
    }
  }, [roundId, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch leaderboard when round is revealed
  useEffect(() => {
    if (!isRevealed || !roundId) return;

    const fetchLeaderboard = async () => {
      // Get all final guesses (attempt 2, or attempt 1 if no attempt 2)
      const { data: allGuesses } = await supabase
        .from("timeline_guesses")
        .select(`
          player_id,
          attempt_number,
          correct_count,
          profiles!player_id(display_name)
        `)
        .eq("round_id", roundId)
        .not("correct_count", "is", null);

      if (!allGuesses || allGuesses.length === 0) return;

      // Group by player and take highest attempt number
      const playerBest: Record<string, { name: string; score: number; attempt: number }> = {};

      allGuesses.forEach((g) => {
        const profileData = g.profiles as unknown;
        const profile = Array.isArray(profileData)
          ? (profileData[0] as { display_name: string } | undefined)
          : (profileData as { display_name: string } | null);
        const name = profile?.display_name ?? "Unknown";

        const existing = playerBest[g.player_id];
        if (!existing || g.attempt_number > existing.attempt) {
          playerBest[g.player_id] = {
            name,
            score: g.correct_count ?? 0,
            attempt: g.attempt_number,
          };
        }
      });

      // Convert to array and sort by score
      const leaderboardData: LeaderboardEntry[] = Object.entries(playerBest)
        .map(([id, { name, score }]) => ({
          player_id: id,
          player_name: name,
          correct_count: score,
        }))
        .sort((a, b) => b.correct_count - a.correct_count)
        .slice(0, 3);

      setLeaderboard(leaderboardData);
    };

    fetchLeaderboard();
  }, [isRevealed, roundId]);

  // Compute correct order (sorted by release_year)
  const correctOrder = useMemo(() => {
    if (!isRevealed || submissions.length === 0) return null;

    // Sort by release_year (nulls at end), then by title for ties
    const sorted = [...submissions].sort((a, b) => {
      if (a.release_year === null && b.release_year === null) {
        return a.title.localeCompare(b.title);
      }
      if (a.release_year === null) return 1;
      if (b.release_year === null) return -1;
      if (a.release_year === b.release_year) {
        return a.title.localeCompare(b.title);
      }
      return a.release_year - b.release_year;
    });

    return sorted.map((s) => s.id);
  }, [isRevealed, submissions]);

  // Compute current attempt number
  const attemptNumber = savedGuesses.length + 1;
  const isLocked = savedGuesses.length >= 2;

  // Compute hint message from first attempt
  const hintMessage = useMemo(() => {
    if (savedGuesses.length === 1) {
      const firstGuess = savedGuesses[0];
      const correctCount = firstGuess.correct_count ?? 0;
      const total = submissions.length;
      return `You have ${correctCount} of ${total} in the correct position. You have one chance to rearrange.`;
    }
    return null;
  }, [savedGuesses, submissions.length]);

  // Compute final score
  const finalScore = useMemo(() => {
    if (savedGuesses.length === 0) return null;
    const lastGuess = savedGuesses[savedGuesses.length - 1];
    return lastGuess.correct_count;
  }, [savedGuesses]);

  // Check if user can play (all songs have release_year)
  const canPlay = useMemo(() => {
    return submissions.length > 0 && submissions.every((s) => s.release_year !== null);
  }, [submissions]);

  // Set order handler
  const setOrder = useCallback((ids: string[]) => {
    if (!isLocked) {
      setCurrentOrder(ids);
    }
  }, [isLocked]);

  // Submit order handler
  const submitOrder = useCallback(async () => {
    if (!roundId || !userId || isLocked || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Calculate correct count
      const sortedCorrectOrder = [...submissions].sort((a, b) => {
        if (a.release_year === null && b.release_year === null) {
          return a.title.localeCompare(b.title);
        }
        if (a.release_year === null) return 1;
        if (b.release_year === null) return -1;
        if (a.release_year === b.release_year) {
          return a.title.localeCompare(b.title);
        }
        return a.release_year - b.release_year;
      });

      const correctOrderIds = sortedCorrectOrder.map((s) => s.id);
      let correctCount = 0;
      currentOrder.forEach((id, index) => {
        if (correctOrderIds[index] === id) {
          correctCount++;
        }
      });

      // Insert the guess
      const { data, error } = await supabase
        .from("timeline_guesses")
        .insert({
          round_id: roundId,
          player_id: userId,
          placement_order: currentOrder,
          attempt_number: attemptNumber,
          correct_count: correctCount,
        })
        .select("id,attempt_number,placement_order,correct_count")
        .single();

      if (error) {
        console.error("Error saving timeline guess:", error);
        return;
      }

      if (data) {
        setSavedGuesses((prev) => [...prev, data as TimelineGuess]);
      }
    } catch (err) {
      console.error("Error submitting timeline order:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [roundId, userId, isLocked, isSubmitting, currentOrder, attemptNumber, submissions]);

  return {
    submissions,
    currentOrder,
    attemptNumber,
    hintMessage,
    isLocked,
    loading,
    correctOrder,
    finalScore,
    setOrder,
    submitOrder,
    leaderboard,
    isSubmitting,
    canPlay,
  };
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
