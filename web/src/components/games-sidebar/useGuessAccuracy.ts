import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

export type AccuracyEntry = {
  guesserId: string;
  guesserName: string;
  submitterCompetitorId: string;
  submitterName: string;
  totalGuesses: number;
  correctGuesses: number;
  accuracyPercent: number;
};

export type PersonalAccuracy = {
  bestTarget: { name: string; accuracy: number; total: number } | null;
  worstTarget: { name: string; accuracy: number; total: number } | null;
};

type UseGuessAccuracyReturn = {
  matrix: AccuracyEntry[];
  personalAccuracy: Record<string, PersonalAccuracy>;
  loading: boolean;
  refresh: () => Promise<void>;
};

/**
 * Hook to fetch cross-round guess accuracy statistics.
 * Shows how successful each guesser is at identifying each submitter's songs.
 */
export function useGuessAccuracy(
  groupId: string | null,
  isRevealed: boolean
): UseGuessAccuracyReturn {
  const [matrix, setMatrix] = useState<AccuracyEntry[]>([]);
  const [personalAccuracy, setPersonalAccuracy] = useState<Record<string, PersonalAccuracy>>({});
  const [loading, setLoading] = useState(true);

  const fetchAccuracy = useCallback(async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Refresh the materialized view first
      await supabase.rpc("refresh_guess_accuracy_stats");

      // Fetch all accuracy data for this group
      const { data, error } = await supabase
        .from("guess_accuracy_stats")
        .select("*")
        .eq("group_id", groupId);

      if (error) {
        console.error("Error fetching guess accuracy:", error);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setMatrix([]);
        setPersonalAccuracy({});
        setLoading(false);
        return;
      }

      // Transform database rows to AccuracyEntry format
      const entries: AccuracyEntry[] = data.map((row) => ({
        guesserId: row.guesser_id,
        guesserName: row.guesser_name ?? "Unknown",
        submitterCompetitorId: row.submitter_competitor_id,
        submitterName: row.submitter_name ?? "Unknown",
        totalGuesses: Number(row.total_guesses),
        correctGuesses: Number(row.correct_guesses),
        accuracyPercent: Number(row.accuracy_percent),
      }));

      setMatrix(entries);

      // Calculate best/worst for each guesser
      const byGuesser: Record<string, AccuracyEntry[]> = {};
      entries.forEach((e) => {
        if (!byGuesser[e.guesserName]) byGuesser[e.guesserName] = [];
        byGuesser[e.guesserName].push(e);
      });

      const personal: Record<string, PersonalAccuracy> = {};
      Object.entries(byGuesser).forEach(([guesser, guesses]) => {
        // Only consider targets with 2+ guesses for meaningful data
        const significant = guesses.filter((g) => g.totalGuesses >= 2);
        if (significant.length === 0) {
          personal[guesser] = { bestTarget: null, worstTarget: null };
          return;
        }

        // Sort by accuracy (descending)
        const sorted = [...significant].sort((a, b) => b.accuracyPercent - a.accuracyPercent);

        personal[guesser] = {
          bestTarget: {
            name: sorted[0].submitterName,
            accuracy: sorted[0].accuracyPercent,
            total: sorted[0].totalGuesses,
          },
          worstTarget: sorted.length > 1
            ? {
                name: sorted[sorted.length - 1].submitterName,
                accuracy: sorted[sorted.length - 1].accuracyPercent,
                total: sorted[sorted.length - 1].totalGuesses,
              }
            : null,
        };
      });

      setPersonalAccuracy(personal);
    } catch (err) {
      console.error("Error in useGuessAccuracy:", err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Fetch on mount and when revealed status changes
  useEffect(() => {
    if (isRevealed) {
      fetchAccuracy();
    }
  }, [isRevealed, fetchAccuracy]);

  return { matrix, personalAccuracy, loading, refresh: fetchAccuracy };
}
