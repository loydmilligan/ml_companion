/**
 * HistoryPage - Card stack view for round history
 *
 * Displays completed rounds as swipeable cards with theme banners,
 * stats, track lists, stories, and awards. Past seasons show as
 * recap cards with summary statistics.
 */

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import CardStack from "../components/CardStack/CardStack";
import type {
  CardData,
  RoundCardData,
  SeasonRecapCardData,
  SubmissionWithVotes,
  LeaderboardEntry,
  VotingPattern,
  DistributionItem,
  SeasonAward,
} from "../types/cardstack.types";
import type { RoundAward, TopTrack } from "../types/history.types";

/* ========================================
   Type Definitions (local to this page)
   ======================================== */

type LeagueRow = {
  id: string;
  name: string;
  season_number: number | null;
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
  const [currentLeagueId, setCurrentLeagueId] = useState<string | null>(null);
  const [allRounds, setAllRounds] = useState<RoundRow[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Map<string, SubmissionRow[]>>(new Map());
  const [allVotes, setAllVotes] = useState<Map<string, VoteRow[]>>(new Map());
  const [allAwards, setAllAwards] = useState<Map<string, RoundAwardRow[]>>(new Map());
  const [pastSeasonStats, setPastSeasonStats] = useState<SeasonStatsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ========================================
     Data Loading Effects
     ======================================== */

  // Load leagues
  useEffect(() => {
    if (!group) return;

    const loadLeagues = async () => {
      const { data } = await supabase
        .from("leagues")
        .select("id,name,season_number")
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
          "id,theme,theme_description,theme_author,external_round_id,theme_image_url,winners_image_url,winners_image_visible,season_number,round_number,status,created_at,submission_deadline,voting_deadline,narrative"
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
  };

  // Load past season stats
  useEffect(() => {
    if (!group || leagues.length <= 1) {
      setPastSeasonStats([]);
      return;
    }

    const loadPastSeasons = async () => {
      const pastLeagues = leagues.slice(1); // Exclude current league
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
     Transform Data to CardData[]
     ======================================== */

  const cardData = useMemo((): CardData[] => {
    const cards: CardData[] = [];

    // Current season rounds
    allRounds.forEach((round) => {
      const submissions = allSubmissions.get(round.id) ?? [];

      // Calculate points for each submission
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

      // Get unique voters for player count
      const uniqueVoters = new Set<string>();
      submissions.forEach((sub) => {
        const votes = allVotes.get(sub.id) ?? [];
        votes.forEach((v) => {
          if (v.voter_name) uniqueVoters.add(v.voter_name);
        });
      });

      // Get awards
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

      const roundCard: RoundCardData = {
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
      };

      cards.push(roundCard);
    });

    // Past season recap cards
    pastSeasonStats.forEach((season) => {
      const recapCard: SeasonRecapCardData = {
        id: `season-${season.leagueId}`,
        type: "season-recap",
        seasonNumber: season.seasonNumber,
        leagueName: season.leagueName,
        totalRounds: season.totalRounds,
        totalSubmissions: season.totalSubmissions,
        totalVotes: season.totalVotes,
        topTracks: season.topTracks,
        roundThemes: season.roundThemes,
        leaderboard: season.leaderboard,
        seasonAwards: season.seasonAwards,
        votingPatterns: season.votingPatterns,
        genreDistribution: season.genreDistribution,
        decadeDistribution: season.decadeDistribution,
      };

      cards.push(recapCard);
    });

    return cards;
  }, [allRounds, allSubmissions, allVotes, allAwards, pastSeasonStats]);

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
      swipeEnabled={true}
    />
  );
}
