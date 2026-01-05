/**
 * HistoryPage - Card stack view for round history
 *
 * Displays completed rounds as swipeable cards with theme banners,
 * stats, track lists, stories, and awards. Past seasons show as
 * recap cards with summary statistics.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { uploadBase64Image } from "../lib/imageUpload";
import CardStack from "../components/CardStack/CardStack";
import type {
  CardData,
  RoundCardData,
  SeasonRecapCardData,
  CurrentSeasonCardData,
  SubmissionWithVotes,
  LeaderboardEntry,
  VotingPattern,
  DistributionItem,
  SeasonAward,
  AdminGenerationCallbacks,
  AdminGenerationState,
} from "../types/cardstack.types";
import type { RoundAward, TopTrack } from "../types/history.types";
import awardsData from "../data/awards.json";

/* ========================================
   Type Definitions (local to this page)
   ======================================== */

type LeagueRow = {
  id: string;
  name: string;
  season_number: number | null;
  narrative: string | null;
  playlist_url: string | null;
};

type RoundRow = {
  id: string;
  theme: string;
  theme_description: string | null;
  theme_author: string | null;
  external_round_id: string | null;
  theme_image_url: string | null;
  winners_image_url: string | null;
  winners_image_visible: boolean | null;
  season_number: number | null;
  round_number: number | null;
  status: string;
  created_at: string;
  submission_deadline: string | null;
  voting_deadline: string | null;
  narrative: string | null;
  playlist_url: string | null;
};

type SubmissionRow = {
  id: string;
  title: string;
  artist: string | null;
  link: string | null;
  submitter_name: string | null;
  artwork_url: string | null;
  release_year: number | null;
  genres: string | null;
  source_uri: string | null;
  created_at: string;
};

type VoteRow = {
  submission_id: string;
  voter_name: string | null;
  points: number | null;
  comment: string | null;
};

type RoundAwardRow = {
  id: string;
  round_id: string;
  award_id: number | null;
  award_name: string;
  award_description: string | null;
  trophy_url: string | null;
  winner_name: string | null;
  visible: boolean | null;
};

type MinigameLeaderboardEntry = {
  guesser_id: string;
  name: string;
  correctCount: number;
  totalGuesses: number;
};

type SeasonStatsRow = {
  leagueId: string;
  leagueName: string;
  seasonNumber: number;
  totalRounds: number;
  totalSubmissions: number;
  totalVotes: number;
  topTracks: TopTrack[];
  roundThemes: string[];
  leaderboard: LeaderboardEntry[];
  seasonAwards: SeasonAward[];
  votingPatterns: VotingPattern[];
  genreDistribution: DistributionItem[];
  decadeDistribution: DistributionItem[];
};

/* ========================================
   Main Component
   ======================================== */

export default function HistoryPage() {
  const { group } = useAuth();
  const isLead = group?.role === "lead";

  // Data state
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);
  const [, setCurrentLeagueId] = useState<string | null>(null);
  const [allRounds, setAllRounds] = useState<RoundRow[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Map<string, SubmissionRow[]>>(new Map());
  const [allVotes, setAllVotes] = useState<Map<string, VoteRow[]>>(new Map());
  const [allAwards, setAllAwards] = useState<Map<string, RoundAwardRow[]>>(new Map());
  const [allMinigameResults, setAllMinigameResults] = useState<Map<string, MinigameLeaderboardEntry[]>>(new Map());
  const [pastSeasonStats, setPastSeasonStats] = useState<SeasonStatsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin generation state
  const [generationState, setGenerationState] = useState<Map<string, AdminGenerationState>>(new Map());

  /* ========================================
     Data Loading Effects
     ======================================== */

  // Load leagues
  useEffect(() => {
    if (!group) return;

    const loadLeagues = async () => {
      const { data } = await supabase
        .from("leagues")
        .select("id,name,season_number,narrative,playlist_url")
        .eq("group_id", group.id)
        .order("season_number", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      const list = (data as LeagueRow[]) ?? [];
      setLeagues(list);
      setCurrentLeagueId(list[0]?.id ?? null);
    };

    loadLeagues();
  }, [group]);

  // Load completed rounds from all leagues
  useEffect(() => {
    if (leagues.length === 0) return;

    const loadRounds = async () => {
      setIsLoading(true);

      // Get all league IDs
      const leagueIds = leagues.map((l) => l.id);

      // Load all completed rounds from all leagues
      const { data } = await supabase
        .from("rounds")
        .select(
          "id,theme,theme_description,theme_author,external_round_id,theme_image_url,winners_image_url,winners_image_visible,season_number,round_number,status,created_at,submission_deadline,voting_deadline,narrative,playlist_url"
        )
        .in("league_id", leagueIds)
        .in("status", ["revealed", "archived"])
        .order("season_number", { ascending: false, nullsFirst: false })
        .order("round_number", { ascending: false, nullsFirst: false });

      const rounds = (data as RoundRow[]) ?? [];
      setAllRounds(rounds);

      // Load submissions, votes, and awards for all rounds
      if (rounds.length > 0) {
        await loadRoundDetails(rounds);
      }

      setIsLoading(false);
    };

    loadRounds();
  }, [leagues]);

  // Load submissions, votes, and awards for all rounds
  const loadRoundDetails = async (rounds: RoundRow[]) => {
    const roundIds = rounds.map((r) => r.id);

    // Load all submissions
    const { data: submissionsData } = await supabase
      .from("submissions")
      .select(
        "id,title,artist,link,submitter_name,artwork_url,release_year,genres,source_uri,created_at,round_id"
      )
      .in("round_id", roundIds)
      .order("created_at", { ascending: true });

    // Group submissions by round
    const submissionsByRound = new Map<string, SubmissionRow[]>();
    (submissionsData ?? []).forEach((sub: any) => {
      const existing = submissionsByRound.get(sub.round_id) ?? [];
      existing.push(sub);
      submissionsByRound.set(sub.round_id, existing);
    });
    setAllSubmissions(submissionsByRound);

    // Load all votes
    const allSubmissionIds = (submissionsData ?? []).map((s: any) => s.id);
    if (allSubmissionIds.length > 0) {
      const { data: votesData } = await supabase
        .from("votes")
        .select("submission_id,voter_name,points,comment")
        .in("submission_id", allSubmissionIds);

      // Group votes by submission (for later lookup)
      const votesBySubmission = new Map<string, VoteRow[]>();
      (votesData ?? []).forEach((vote: VoteRow) => {
        const existing = votesBySubmission.get(vote.submission_id) ?? [];
        existing.push(vote);
        votesBySubmission.set(vote.submission_id, existing);
      });
      setAllVotes(votesBySubmission);
    }

    // Load all awards
    const { data: awardsData } = await supabase
      .from("round_awards")
      .select("id,round_id,award_id,award_name,award_description,trophy_url,winner_name,visible")
      .in("round_id", roundIds)
      .order("visible", { ascending: false })
      .order("award_id", { ascending: true, nullsFirst: true });

    // Group awards by round
    const awardsByRound = new Map<string, RoundAwardRow[]>();
    (awardsData ?? []).forEach((award: any) => {
      const existing = awardsByRound.get(award.round_id) ?? [];
      existing.push(award);
      awardsByRound.set(award.round_id, existing);
    });
    setAllAwards(awardsByRound);

    // Load minigame guesses for all rounds
    const { data: guessesData } = await supabase
      .from("submitter_guesses")
      .select(`
        round_id,
        guesser_id,
        is_correct,
        profiles!guesser_id(display_name)
      `)
      .in("round_id", roundIds);

    // Group and aggregate guesses by round
    const guessesByRound = new Map<string, MinigameLeaderboardEntry[]>();
    const roundGuesserMap = new Map<string, Map<string, { name: string; correct: number; total: number }>>();

    (guessesData ?? []).forEach((guess: any) => {
      const roundId = guess.round_id;
      const guesserId = guess.guesser_id;
      // Handle both array and object forms for profiles
      const profileData = guess.profiles as unknown;
      const profile = Array.isArray(profileData)
        ? (profileData[0] as { display_name: string } | undefined)
        : (profileData as { display_name: string } | null);
      const name = profile?.display_name ?? "Unknown";

      if (!roundGuesserMap.has(roundId)) {
        roundGuesserMap.set(roundId, new Map());
      }
      const guesserMap = roundGuesserMap.get(roundId)!;

      if (!guesserMap.has(guesserId)) {
        guesserMap.set(guesserId, { name, correct: 0, total: 0 });
      }
      const entry = guesserMap.get(guesserId)!;
      entry.total += 1;
      if (guess.is_correct === true) {
        entry.correct += 1;
      }
    });

    // Convert to leaderboard entries sorted by correct count
    roundGuesserMap.forEach((guesserMap, roundId) => {
      const leaderboard: MinigameLeaderboardEntry[] = Array.from(guesserMap.entries())
        .map(([guesserId, { name, correct, total }]) => ({
          guesser_id: guesserId,
          name,
          correctCount: correct,
          totalGuesses: total,
        }))
        .sort((a, b) => b.correctCount - a.correctCount)
        .slice(0, 3); // Top 3 only

      if (leaderboard.length > 0) {
        guessesByRound.set(roundId, leaderboard);
      }
    });

    setAllMinigameResults(guessesByRound);
  };

  // Load past season stats
  useEffect(() => {
    if (!group || leagues.length === 0) {
      setPastSeasonStats([]);
      return;
    }

    const loadPastSeasons = async () => {
      const pastLeagues = leagues; // Include all leagues (current and past)
      const stats: SeasonStatsRow[] = [];

      for (const league of pastLeagues) {
        // Get rounds for this league
        const { data: roundData } = await supabase
          .from("rounds")
          .select("id,theme")
          .eq("league_id", league.id)
          .in("status", ["revealed", "archived"]);

        const roundIds = (roundData ?? []).map((r: any) => r.id);
        const roundThemes = (roundData ?? []).map((r: any) => r.theme);

        if (roundIds.length === 0) continue;

        // Get submissions with genres and release year
        const { data: submissionsData } = await supabase
          .from("submissions")
          .select("id,title,artist,artwork_url,submitter_name,genres,release_year,round_id")
          .in("round_id", roundIds);

        const submissionIds = (submissionsData ?? []).map((s: any) => s.id);

        // Get votes with voter info
        let totalVotes = 0;
        const voteTotals = new Map<string, number>();
        const submissionToSubmitter = new Map<string, string>();
        const playerPoints = new Map<string, number>();
        const voterToTarget = new Map<string, Map<string, number>>();

        // Map submissions to submitters
        (submissionsData ?? []).forEach((s: any) => {
          if (s.submitter_name) {
            submissionToSubmitter.set(s.id, s.submitter_name);
          }
        });

        if (submissionIds.length > 0) {
          const { data: votesData } = await supabase
            .from("votes")
            .select("submission_id,voter_name,points")
            .in("submission_id", submissionIds);

          (votesData ?? []).forEach((vote: any) => {
            const points = vote.points ?? 0;
            totalVotes += points;
            voteTotals.set(
              vote.submission_id,
              (voteTotals.get(vote.submission_id) ?? 0) + points
            );

            // Track points received per player (for leaderboard)
            const submitter = submissionToSubmitter.get(vote.submission_id);
            if (submitter) {
              playerPoints.set(submitter, (playerPoints.get(submitter) ?? 0) + points);
            }

            // Track voting patterns (voter -> target -> points)
            if (vote.voter_name && submitter) {
              if (!voterToTarget.has(vote.voter_name)) {
                voterToTarget.set(vote.voter_name, new Map());
              }
              const targetMap = voterToTarget.get(vote.voter_name)!;
              targetMap.set(submitter, (targetMap.get(submitter) ?? 0) + points);
            }
          });
        }

        // Calculate top tracks
        const topTracks: TopTrack[] = (submissionsData ?? [])
          .map((s: any) => ({
            title: s.title,
            artist: s.artist ?? undefined,
            artworkUrl: s.artwork_url ?? undefined,
            points: voteTotals.get(s.id) ?? 0,
            submitterName: s.submitter_name ?? undefined,
          }))
          .sort((a, b) => b.points - a.points)
          .slice(0, 5);

        // Calculate leaderboard - count wins per player
        const playerWins = new Map<string, number>();
        const roundSubmissions = new Map<string, { submitter: string; points: number }[]>();

        // Group submissions by round
        (submissionsData ?? []).forEach((s: any) => {
          const roundId = s.round_id;
          if (!roundSubmissions.has(roundId)) {
            roundSubmissions.set(roundId, []);
          }
          roundSubmissions.get(roundId)!.push({
            submitter: s.submitter_name ?? "Unknown",
            points: voteTotals.get(s.id) ?? 0,
          });
        });

        // Find winner of each round
        roundSubmissions.forEach((subs) => {
          if (subs.length > 0) {
            const winner = subs.reduce((a, b) => (a.points >= b.points ? a : b));
            playerWins.set(winner.submitter, (playerWins.get(winner.submitter) ?? 0) + 1);
          }
        });

        // Build leaderboard
        const leaderboard: LeaderboardEntry[] = Array.from(playerPoints.entries())
          .map(([name, totalPoints]) => ({
            name,
            totalPoints,
            wins: playerWins.get(name) ?? 0,
            rank: 0,
          }))
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .map((entry, index) => ({ ...entry, rank: index + 1 }));

        // Calculate voting patterns (most/least for each voter)
        const votingPatterns: VotingPattern[] = [];
        voterToTarget.forEach((targetMap, voterName) => {
          const entries = Array.from(targetMap.entries())
            .filter(([targetName]) => targetName !== voterName); // Exclude self-votes

          if (entries.length > 0) {
            const sortedByPoints = [...entries].sort((a, b) => b[1] - a[1]);
            const most = sortedByPoints[0];
            const least = sortedByPoints[sortedByPoints.length - 1];

            votingPatterns.push({
              voterName,
              targetName: most[0],
              pointsGiven: most[1],
              type: "most",
            });

            if (most[0] !== least[0]) {
              votingPatterns.push({
                voterName,
                targetName: least[0],
                pointsGiven: least[1],
                type: "least",
              });
            }
          }
        });

        // Calculate genre distribution
        const genreCounts = new Map<string, number>();
        (submissionsData ?? []).forEach((s: any) => {
          if (s.genres) {
            // Genres might be comma-separated
            const genres = s.genres.split(",").map((g: string) => g.trim());
            genres.forEach((genre: string) => {
              if (genre) {
                genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
              }
            });
          }
        });

        const totalGenreCount = Array.from(genreCounts.values()).reduce((a, b) => a + b, 0);
        const genreDistribution: DistributionItem[] = Array.from(genreCounts.entries())
          .map(([label, count]) => ({
            label,
            count,
            percentage: totalGenreCount > 0 ? Math.round((count / totalGenreCount) * 100) : 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8); // Top 8 genres

        // Calculate decade distribution
        const decadeCounts = new Map<string, number>();
        (submissionsData ?? []).forEach((s: any) => {
          if (s.release_year) {
            const decade = `${Math.floor(s.release_year / 10) * 10}s`;
            decadeCounts.set(decade, (decadeCounts.get(decade) ?? 0) + 1);
          }
        });

        const totalDecadeCount = Array.from(decadeCounts.values()).reduce((a, b) => a + b, 0);
        const decadeDistribution: DistributionItem[] = Array.from(decadeCounts.entries())
          .map(([label, count]) => ({
            label,
            count,
            percentage: totalDecadeCount > 0 ? Math.round((count / totalDecadeCount) * 100) : 0,
          }))
          .sort((a, b) => {
            // Sort by decade chronologically
            const aYear = parseInt(a.label);
            const bYear = parseInt(b.label);
            return aYear - bYear;
          });

        // Season awards - use the champion and maybe top 3 awards
        const seasonAwards: SeasonAward[] = [];
        if (leaderboard.length > 0) {
          seasonAwards.push({
            awardName: "Season Champion",
            awardDescription: `Winner of Season ${league.season_number ?? 0}`,
            winnerName: leaderboard[0].name,
          });
        }
        if (leaderboard.length > 1) {
          seasonAwards.push({
            awardName: "Runner Up",
            awardDescription: "Second place overall",
            winnerName: leaderboard[1].name,
          });
        }
        // Most wins award
        const mostWins = leaderboard.reduce(
          (max, entry) => (entry.wins > max.wins ? entry : max),
          leaderboard[0] || { wins: 0, name: "" }
        );
        if (mostWins.wins > 0 && mostWins.name !== leaderboard[0]?.name) {
          seasonAwards.push({
            awardName: "Most Round Wins",
            awardDescription: `${mostWins.wins} first place finishes`,
            winnerName: mostWins.name,
          });
        }

        stats.push({
          leagueId: league.id,
          leagueName: league.name,
          seasonNumber: league.season_number ?? 0,
          totalRounds: roundIds.length,
          totalSubmissions: submissionsData?.length ?? 0,
          totalVotes,
          topTracks,
          roundThemes,
          leaderboard,
          seasonAwards,
          votingPatterns,
          genreDistribution,
          decadeDistribution,
        });
      }

      setPastSeasonStats(stats);
    };

    loadPastSeasons();
  }, [group, leagues]);

  /* ========================================
     Admin Generation Callbacks
     ======================================== */

  const updateGenerationState = useCallback((roundId: string, update: Partial<AdminGenerationState>) => {
    setGenerationState((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(roundId) ?? {};
      newMap.set(roundId, { ...current, ...update });
      return newMap;
    });
  }, []);

  const handleGenerateThemeBanner = useCallback(async (roundId: string) => {
    if (!group) return;
    const round = allRounds.find((r) => r.id === roundId);
    if (!round) return;

    updateGenerationState(roundId, { isBannerLoading: true, statusMessage: "Generating banner..." });

    try {
      const { data, error } = await supabase.functions.invoke("openrouter-round-story", {
        body: {
          mode: "theme",
          round: {
            title: round.theme,
            description: round.theme_description,
            author: round.theme_author,
          },
          image_model_key: "OPENROUTER_MID_MODEL",
        },
      });

      if (error) throw error;

      const imageBase64 = data?.image_base64 ?? null;
      const imageUrl = data?.image_url ?? null;

      if (!imageBase64 && !imageUrl) {
        updateGenerationState(roundId, { isBannerLoading: false, statusMessage: "No image returned." });
        return;
      }

      let finalUrl = imageUrl;
      if (imageBase64) {
        const filePath = `round-images/${roundId}/theme-${Date.now()}.png`;
        const upload = await uploadBase64Image("round-art", filePath, imageBase64);
        if (upload.publicUrl) {
          finalUrl = upload.publicUrl;
        } else {
          updateGenerationState(roundId, { isBannerLoading: false, statusMessage: upload.error ?? "Upload failed." });
          return;
        }
      }

      if (finalUrl) {
        await supabase.from("rounds").update({ theme_image_url: finalUrl }).eq("id", roundId);
        setAllRounds((prev) => prev.map((r) => r.id === roundId ? { ...r, theme_image_url: finalUrl } : r));
        updateGenerationState(roundId, { isBannerLoading: false, statusMessage: "Banner saved!" });
      }
    } catch {
      updateGenerationState(roundId, { isBannerLoading: false, statusMessage: "Failed to generate." });
    }
  }, [group, allRounds, updateGenerationState]);

  const handleGenerateStory = useCallback(async (roundId: string) => {
    if (!group) return;
    const round = allRounds.find((r) => r.id === roundId);
    if (!round) return;

    updateGenerationState(roundId, { isStoryLoading: true, statusMessage: "Loading data..." });

    try {
      // Fetch submissions for this round
      const { data: submissions } = await supabase
        .from("submissions")
        .select("id,title,artist,submitter_name,artwork_url,external_comment")
        .eq("round_id", roundId);

      if (!submissions || submissions.length === 0) {
        updateGenerationState(roundId, { isStoryLoading: false, statusMessage: "No submissions found." });
        return;
      }

      // Fetch votes for these submissions
      const submissionIds = submissions.map((s) => s.id);
      const { data: votes } = await supabase
        .from("votes")
        .select("submission_id,voter_name,points,comment")
        .in("submission_id", submissionIds);

      // Calculate totals per submission
      type VoteEntry = { submission_id: string; voter_name: string | null; points: number; comment: string | null };
      const votesBySubmission = new Map<string, { total: number; votes: VoteEntry[] }>();
      (votes ?? []).forEach((vote) => {
        const existing = votesBySubmission.get(vote.submission_id) || { total: 0, votes: [] };
        existing.total += vote.points;
        existing.votes.push(vote);
        votesBySubmission.set(vote.submission_id, existing);
      });

      // Get top 3 winners
      const ranked = submissions
        .map((s) => ({ ...s, totalPoints: votesBySubmission.get(s.id)?.total ?? 0 }))
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 3);

      // Get competitor traits for winners
      const winnerNames = ranked.map((r) => r.submitter_name).filter(Boolean);
      const { data: competitors } = await supabase
        .from("season_competitors")
        .select("name,ai_image_traits")
        .eq("group_id", group.id)
        .in("name", winnerNames);

      const traitsByName = new Map<string, string>();
      (competitors ?? []).forEach((c) => {
        if (c.ai_image_traits) traitsByName.set(c.name, c.ai_image_traits);
      });

      const winners = ranked.map((r, i) => ({
        place: i + 1,
        name: r.submitter_name,
        song: r.title,
        artist: r.artist,
        traits: traitsByName.get(r.submitter_name ?? "") ?? null,
      }));

      // Prepare songs and votes for the edge function
      const songsForApi = submissions.map((s) => ({
        title: s.title,
        artist: s.artist,
        submitter: s.submitter_name,
        comment: s.external_comment,
        points: votesBySubmission.get(s.id)?.total ?? 0,
      }));

      const votesForApi = (votes ?? []).map((v) => ({
        submission_id: v.submission_id,
        voter: v.voter_name,
        points: v.points,
        comment: v.comment,
      }));

      updateGenerationState(roundId, { statusMessage: "Generating story..." });

      const { data, error } = await supabase.functions.invoke("openrouter-round-story", {
        body: {
          mode: "story",
          round: {
            title: round.theme,
            description: round.theme_description,
            author: round.theme_author,
          },
          songs: songsForApi,
          votes: votesForApi,
          winners,
          text_model_key: "OPENROUTER_MODEL",
          image_model_key: "OPENROUTER_MID_MODEL",
        },
      });

      if (error) throw error;

      const narrative = data?.narrative ?? null;
      const imageBase64 = data?.image_base64 ?? null;
      const imageUrl = data?.image_url ?? null;

      let finalImageUrl = imageUrl;
      if (imageBase64) {
        const filePath = `round-images/${roundId}/winners-${Date.now()}.png`;
        const upload = await uploadBase64Image("round-art", filePath, imageBase64);
        if (upload.publicUrl) {
          finalImageUrl = upload.publicUrl;
        }
      }

      // Update round with narrative and image
      const updates: Record<string, string | null> = {};
      if (narrative) updates.narrative = narrative;
      if (finalImageUrl) updates.winners_image_url = finalImageUrl;

      if (Object.keys(updates).length > 0) {
        await supabase.from("rounds").update(updates).eq("id", roundId);
        setAllRounds((prev) =>
          prev.map((r) =>
            r.id === roundId
              ? { ...r, narrative: updates.narrative ?? r.narrative, winners_image_url: updates.winners_image_url ?? r.winners_image_url }
              : r
          )
        );
        updateGenerationState(roundId, { isStoryLoading: false, statusMessage: "Story saved!" });
      } else {
        updateGenerationState(roundId, { isStoryLoading: false, statusMessage: "No content generated." });
      }
    } catch {
      updateGenerationState(roundId, { isStoryLoading: false, statusMessage: "Failed to generate." });
    }
  }, [group, allRounds, updateGenerationState]);

  const handleGenerateAwards = useCallback(async (roundId: string) => {
    if (!group) return;
    const round = allRounds.find((r) => r.id === roundId);
    if (!round) return;

    updateGenerationState(roundId, { isAwardsLoading: true, statusMessage: "Loading data..." });

    try {
      // Fetch submissions for this round
      const { data: submissions } = await supabase
        .from("submissions")
        .select("id,title,artist,submitter_name,external_comment,release_year,genres")
        .eq("round_id", roundId);

      if (!submissions || submissions.length === 0) {
        updateGenerationState(roundId, { isAwardsLoading: false, statusMessage: "No submissions found." });
        return;
      }

      // Fetch votes for these submissions
      const submissionIds = submissions.map((s) => s.id);
      const { data: votes } = await supabase
        .from("votes")
        .select("submission_id,voter_name,points,comment")
        .in("submission_id", submissionIds);

      // Get recent award IDs to avoid repetition
      const { data: recentAwards } = await supabase
        .from("round_awards")
        .select("award_id")
        .order("created_at", { ascending: false })
        .limit(20);

      const recentAwardIds = (recentAwards ?? []).map((a) => a.award_id).filter(Boolean);

      // Prepare data for the edge function
      const songsForApi = submissions.map((s) => ({
        title: s.title,
        artist: s.artist,
        submitter: s.submitter_name,
        comment: s.external_comment,
        release_year: s.release_year,
        genres: s.genres,
      }));

      const votesForApi = (votes ?? []).map((v) => ({
        submission_id: v.submission_id,
        voter: v.voter_name,
        points: v.points,
        comment: v.comment,
      }));

      updateGenerationState(roundId, { statusMessage: "Generating awards..." });

      const { data, error } = await supabase.functions.invoke("openrouter-round-story", {
        body: {
          mode: "awards",
          round: {
            title: round.theme,
            description: round.theme_description,
            author: round.theme_author,
          },
          songs: songsForApi,
          votes: votesForApi,
          awards: awardsData.awards,
          recent_awards: recentAwardIds,
          awards_model_key: "OPENROUTER_MODEL",
        },
      });

      if (error) throw error;

      const generatedAwards = data?.awards ?? [];
      if (generatedAwards.length === 0) {
        updateGenerationState(roundId, { isAwardsLoading: false, statusMessage: "No awards generated." });
        return;
      }

      // Insert awards into database
      const awardsToInsert = generatedAwards.map((a: { award_id: number; award_name: string; reason: string; winner_name: string }) => ({
        round_id: roundId,
        award_id: a.award_id,
        award_name: a.award_name,
        award_description: a.reason,
        winner_name: a.winner_name,
        visible: false,
      }));

      await supabase.from("round_awards").insert(awardsToInsert);
      updateGenerationState(roundId, { isAwardsLoading: false, statusMessage: `${generatedAwards.length} awards saved!` });

      // Reload awards for this round
      const { data: newAwards } = await supabase
        .from("round_awards")
        .select("id,round_id,award_id,award_name,award_description,trophy_url,winner_name,visible")
        .eq("round_id", roundId)
        .order("visible", { ascending: false })
        .order("award_id", { ascending: true, nullsFirst: true });

      if (newAwards) {
        setAllAwards((prev) => {
          const newMap = new Map(prev);
          newMap.set(roundId, newAwards);
          return newMap;
        });
      }
    } catch {
      updateGenerationState(roundId, { isAwardsLoading: false, statusMessage: "Failed to generate." });
    }
  }, [group, allRounds, updateGenerationState]);

  const adminCallbacks: AdminGenerationCallbacks = useMemo(() => ({
    onGenerateThemeBanner: handleGenerateThemeBanner,
    onGenerateStory: handleGenerateStory,
    onGenerateAwards: handleGenerateAwards,
  }), [handleGenerateThemeBanner, handleGenerateStory, handleGenerateAwards]);

  /* ========================================
     Transform Data to CardData[]
     ======================================== */

  const cardData = useMemo((): CardData[] => {
    // Helper to build round card (inside useMemo to use current state)
    const buildRoundCard = (round: RoundRow): RoundCardData => {
      const submissions = allSubmissions.get(round.id) ?? [];

      const submissionsWithVotes: SubmissionWithVotes[] = submissions.map((sub) => {
        const votes = allVotes.get(sub.id) ?? [];
        const totalPoints = votes.reduce((sum, v) => sum + (v.points ?? 0), 0);

        return {
          id: sub.id,
          title: sub.title,
          artist: sub.artist ?? undefined,
          link: sub.link ?? undefined,
          submitterName: sub.submitter_name ?? undefined,
          artworkUrl: sub.artwork_url ?? undefined,
          releaseYear: sub.release_year ?? undefined,
          genres: sub.genres ?? undefined,
          sourceUri: sub.source_uri ?? undefined,
          createdAt: sub.created_at,
          totalPoints,
          voteCount: votes.length,
        };
      });

      const uniqueVoters = new Set<string>();
      submissions.forEach((sub) => {
        const votes = allVotes.get(sub.id) ?? [];
        votes.forEach((v) => {
          if (v.voter_name) uniqueVoters.add(v.voter_name);
        });
      });

      const roundAwards = allAwards.get(round.id) ?? [];
      const awards: RoundAward[] = roundAwards.map((a) => ({
        id: a.id,
        awardId: a.award_id ?? undefined,
        awardName: a.award_name,
        awardDescription: a.award_description ?? undefined,
        trophyUrl: a.trophy_url ?? undefined,
        winnerName: a.winner_name ?? undefined,
        visible: a.visible ?? true,
      }));

      const totalVotes = submissionsWithVotes.reduce((sum, s) => sum + s.totalPoints, 0);

      // Get minigame results for this round
      const minigameLeaderboard = allMinigameResults.get(round.id) ?? [];
      const minigameResults = minigameLeaderboard.length > 0
        ? minigameLeaderboard.map((entry) => ({
            name: entry.name,
            correctCount: entry.correctCount,
            totalGuesses: entry.totalGuesses,
          }))
        : undefined;

      return {
        id: round.id,
        type: "round",
        theme: round.theme,
        themeDescription: round.theme_description,
        themeAuthor: round.theme_author,
        themeImageUrl: round.theme_image_url,
        winnersImageUrl: round.winners_image_visible !== false ? round.winners_image_url : null,
        roundNumber: round.round_number,
        seasonNumber: round.season_number,
        status: round.status as any,
        submissions: submissionsWithVotes,
        awards,
        narrative: round.narrative,
        stats: {
          songs: submissions.length,
          votes: totalVotes,
          players: Math.max(uniqueVoters.size, submissions.length),
        },
        playlistUrl: round.playlist_url,
        minigameResults,
      };
    };

    const cards: CardData[] = [];

    // Group rounds by season
    const roundsBySeason = new Map<number, RoundRow[]>();
    allRounds.forEach((round) => {
      const seasonNum = round.season_number ?? 0;
      const existing = roundsBySeason.get(seasonNum) ?? [];
      existing.push(round);
      roundsBySeason.set(seasonNum, existing);
    });

    // Get sorted season numbers (descending - newest first)
    const seasonNumbers = Array.from(roundsBySeason.keys()).sort((a, b) => b - a);

    // Build cards: for each season, add recap card first, then round cards
    seasonNumbers.forEach((seasonNum) => {
      const seasonRounds = roundsBySeason.get(seasonNum) ?? [];
      const isCurrentSeason = seasonNum === seasonNumbers[0];
      const currentLeague = leagues.find((l) => l.season_number === seasonNum);

      // Sort rounds by round_number descending within season
      seasonRounds.sort((a, b) => (b.round_number ?? 0) - (a.round_number ?? 0));

      if (isCurrentSeason && seasonRounds.length > 0) {
        const currentSeasonCard: CurrentSeasonCardData = {
          id: `current-season-${seasonNum}`,
          type: "current-season",
          seasonNumber: seasonNum,
          leagueName: currentLeague?.name ?? `Season ${seasonNum}`,
          seasonIntro:
            `Season ${seasonNum} got off to an exciting start when a surprise winner came out of the pack with a nontraditional pick. ` +
            `Strong showings from Bleck and Bleck kept the board tight, while the early birds locked in submissions before the procrastinator scramble hit. ` +
            `There is a little extra edge this year for anyone looking to rewrite last season's ending.`,
          roundTwoRiff:
            `Round 2 keeps the momentum with a wink to Sasha's Season 1 theme, flipping that original spark into a sharper Season ${seasonNum} sequel. ` +
            `It is equal parts nostalgia and dare, the kind of prompt that rewards a left turn but still tips its hat to the old lanes.`,
          minigameSummary:
            `Minigame recap: Matt and Lori were dialed in, while a few of us whiffed the tougher curveballs. ` +
            `Most guesses piled onto Sasha, but Bleck's submission stayed the hardest to pin down.`,
        };
        cards.push(currentSeasonCard);
      }

      // Add season recap card first (for all seasons with data)
      const seasonStats = pastSeasonStats.find((s) => s.seasonNumber === seasonNum);
      if (seasonStats) {
          // Find the league to get the narrative
          const league = leagues.find((l) => l.id === seasonStats.leagueId);
          const recapCard: SeasonRecapCardData = {
            id: `season-${seasonStats.leagueId}`,
            type: "season-recap",
            seasonNumber: seasonStats.seasonNumber,
            leagueName: seasonStats.leagueName,
            totalRounds: seasonStats.totalRounds,
            totalSubmissions: seasonStats.totalSubmissions,
            totalVotes: seasonStats.totalVotes,
            topTracks: seasonStats.topTracks,
            roundThemes: seasonStats.roundThemes,
            leaderboard: seasonStats.leaderboard,
            seasonAwards: seasonStats.seasonAwards,
            votingPatterns: seasonStats.votingPatterns,
            genreDistribution: seasonStats.genreDistribution,
            decadeDistribution: seasonStats.decadeDistribution,
            seasonNarrative: league?.narrative ?? null,
            playlistUrl: league?.playlist_url ?? null,
          };
          cards.push(recapCard);
      }

      // Add round cards for this season
      seasonRounds.forEach((round) => {
        cards.push(buildRoundCard(round));
      });
    });

    return cards;
  }, [allRounds, allSubmissions, allVotes, allAwards, allMinigameResults, pastSeasonStats, leagues]);

  /* ========================================
     Event Handlers
     ======================================== */

  const handleCardChange = (index: number, card: CardData) => {
    // Could be used for analytics or loading additional data
    console.log("Card changed:", index, card.id);
  };

  const handleCardTap = (card: CardData) => {
    // Could open a detail modal or navigate to full round view
    console.log("Card tapped:", card.id);
  };

  // Handle theme click from season recap - find and return the card index
  const handleThemeClick = (theme: string, seasonNumber: number): number | null => {
    // Find the round card matching this theme and season
    const index = cardData.findIndex((card) => {
      if (card.type !== "round") return false;
      return card.theme === theme && card.seasonNumber === seasonNumber;
    });
    return index >= 0 ? index : null;
  };

  /* ========================================
     Render
     ======================================== */

  if (!group) {
    return (
      <div className="history-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="history-loading">
        <p>Loading history...</p>
      </div>
    );
  }

  if (cardData.length === 0) {
    return (
      <div className="history-empty">
        <p>No completed rounds yet</p>
      </div>
    );
  }

  return (
    <CardStack
      cards={cardData}
      onCardChange={handleCardChange}
      onCardTap={handleCardTap}
      onThemeClick={handleThemeClick}
      swipeEnabled={true}
      isLead={isLead}
      adminCallbacks={adminCallbacks}
      generationState={generationState}
    />
  );
}
