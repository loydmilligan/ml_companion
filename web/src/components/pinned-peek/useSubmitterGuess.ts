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
  isLocked: boolean; // True after user has submitted their guess
};

export type LeaderboardEntry = {
  guesser_id: string;
  guesser_name: string;
  correct_count: number;
  total_guesses: number;
};

export type TopVoter = {
  name: string;
  points: number;
};

export type GuessAggregate = {
  competitorId: string;
  competitorName: string;
  count: number;
};

type UseSubmitterGuessReturn = {
  competitors: Competitor[];
  guessStates: Record<string, GuessState>;
  leaderboard: LeaderboardEntry[];
  topVotersPerSong: Record<string, TopVoter[]>;
  guessAggregatesPerSong: Record<string, GuessAggregate[]>;
  loading: boolean;
  correctCount: number;
  totalGuessed: number;
  maxPossibleGuesses: number;
  handleGuessChange: (submissionId: string, competitorId: string) => void;
  handleSubmitGuess: (submissionId: string) => Promise<void>;
  handleAdminUnlock: (submissionId: string) => void;
  isAdmin: boolean;
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
  const [topVotersPerSong, setTopVotersPerSong] = useState<Record<string, TopVoter[]>>({});
  const [userCompetitorName, setUserCompetitorName] = useState<string | null>(null);
  const [guessAggregatesPerSong, setGuessAggregatesPerSong] = useState<Record<string, GuessAggregate[]>>({});
  const [lockedSubmissions, setLockedSubmissions] = useState<Record<string, boolean>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch guess aggregates for given submissions (poll-style results)
  const fetchGuessAggregates = useCallback(async (
    submissionIds: string[],
    competitorsList: Competitor[]
  ) => {
    if (!roundId || submissionIds.length === 0) return;

    // Fetch all guesses for these submissions
    const { data: allGuesses } = await supabase
      .from("submitter_guesses")
      .select("submission_id, guessed_competitor_id")
      .eq("round_id", roundId)
      .in("submission_id", submissionIds);

    if (!allGuesses || allGuesses.length === 0) return;

    // Aggregate guesses by submission and competitor
    const aggregates: Record<string, Record<string, number>> = {};

    allGuesses.forEach((g) => {
      if (!g.guessed_competitor_id) return;

      if (!aggregates[g.submission_id]) {
        aggregates[g.submission_id] = {};
      }

      if (!aggregates[g.submission_id][g.guessed_competitor_id]) {
        aggregates[g.submission_id][g.guessed_competitor_id] = 0;
      }

      aggregates[g.submission_id][g.guessed_competitor_id]++;
    });

    // Convert to sorted arrays with competitor names
    const result: Record<string, GuessAggregate[]> = {};

    Object.entries(aggregates).forEach(([subId, competitorCounts]) => {
      const sorted = Object.entries(competitorCounts)
        .map(([competitorId, count]) => {
          const competitor = competitorsList.find((c) => c.id === competitorId);
          return {
            competitorId,
            competitorName: competitor?.name ?? "Unknown",
            count,
          };
        })
        .sort((a, b) => b.count - a.count); // Sort by count descending

      result[subId] = sorted;
    });

    setGuessAggregatesPerSong((prev) => ({ ...prev, ...result }));
  }, [roundId]);

  // Load competitors and user's saved guesses
  const loadData = useCallback(async () => {
    if (!groupId || !roundId || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Check if user is admin (member of group with role 'lead' or 'admin')
    const { data: memberData } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("profile_id", userId)
      .single();

    setIsAdmin(memberData?.role === "lead" || memberData?.role === "admin");

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
      const locked: Record<string, boolean> = {};

      (guessData as SavedGuess[]).forEach((g) => {
        if (g.guessed_competitor_id) {
          savedGuesses[g.submission_id] = g.guessed_competitor_id;
          locked[g.submission_id] = true; // Previously saved guesses are locked
        }
        savedResults[g.submission_id] = g.is_correct;
      });

      setGuesses(savedGuesses);
      setResults(savedResults);
      setLockedSubmissions(locked);

      // Fetch guess aggregates for songs the user has already guessed
      const submissionIds = Object.keys(savedGuesses);
      if (submissionIds.length > 0) {
        await fetchGuessAggregates(submissionIds, competitorsList);
      }
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

  // Fetch vote breakdown per song when revealed
  useEffect(() => {
    if (!isRevealed || submissions.length === 0) return;

    const fetchVoteBreakdown = async () => {
      const submissionIds = submissions.map((s) => s.id);

      const { data: voteData } = await supabase
        .from("votes")
        .select("submission_id, voter_name, points")
        .in("submission_id", submissionIds);

      if (!voteData || voteData.length === 0) return;

      // Group votes by submission and find top voter(s)
      const votesBySubmission: Record<string, { voter_name: string; points: number }[]> = {};
      voteData.forEach((v) => {
        if (!votesBySubmission[v.submission_id]) {
          votesBySubmission[v.submission_id] = [];
        }
        votesBySubmission[v.submission_id].push({ voter_name: v.voter_name, points: v.points });
      });

      // For each submission, find who gave the most votes
      const topVoters: Record<string, TopVoter[]> = {};

      Object.entries(votesBySubmission).forEach(([subId, votes]) => {
        // Find max points given
        const maxPoints = Math.max(...votes.map((v) => v.points));
        if (maxPoints <= 0) return;

        // Find all voters who gave max points (handles ties)
        const topForSong = votes
          .filter((v) => v.points === maxPoints)
          .map((v) => ({ name: v.voter_name, points: v.points }));

        topVoters[subId] = topForSong;
      });

      setTopVotersPerSong(topVoters);
    };

    fetchVoteBreakdown();
  }, [isRevealed, submissions]);

  const handleGuessChange = useCallback((submissionId: string, competitorId: string) => {
    // Only allow changes if not locked (or admin override)
    if (lockedSubmissions[submissionId] && !isAdmin) return;
    setGuesses((prev) => ({ ...prev, [submissionId]: competitorId }));
  }, [lockedSubmissions, isAdmin]);

  const handleSubmitGuess = useCallback(async (submissionId: string) => {
    if (!userId || !roundId) return;

    const competitorId = guesses[submissionId];
    if (!competitorId) return;

    // Prevent re-submission if locked (unless admin)
    if (lockedSubmissions[submissionId] && !isAdmin) return;

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
      } else {
        // Lock this submission after successful save
        setLockedSubmissions((prev) => ({ ...prev, [submissionId]: true }));

        // Fetch updated aggregates for this submission
        await fetchGuessAggregates([submissionId], competitors);
      }
    } catch (err) {
      console.error("Error saving guess:", err);
    } finally {
      setSaving((prev) => ({ ...prev, [submissionId]: false }));
    }
  }, [userId, roundId, guesses, lockedSubmissions, isAdmin, fetchGuessAggregates, competitors]);

  // Admin function to unlock a submission for re-guessing
  const handleAdminUnlock = useCallback((submissionId: string) => {
    if (!isAdmin) return;
    setLockedSubmissions((prev) => ({ ...prev, [submissionId]: false }));
  }, [isAdmin]);

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
      isLocked: lockedSubmissions[sub.id] || false,
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
    topVotersPerSong,
    guessAggregatesPerSong,
    loading,
    correctCount,
    totalGuessed,
    maxPossibleGuesses,
    handleGuessChange,
    handleSubmitGuess,
    handleAdminUnlock,
    isAdmin,
  };
}
