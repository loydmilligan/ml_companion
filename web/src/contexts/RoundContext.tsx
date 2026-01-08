import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

type RoundSummary = {
  id: string;
  theme: string;
  theme_description: string | null;
  theme_author: string | null;
  status: "open" | "voting" | "revealed" | "archived";
  season_number: number | null;
  round_number: number | null;
  submission_deadline: string | null;
  voting_deadline: string | null;
  reveal_until: string | null;
  playlist_url: string | null;
  external_playlist_url: string | null;
  youtube_playlist_url: string | null;
  theme_image_url: string | null;
};

type SubmissionRow = {
  id: string;
  title: string;
  artist: string | null;
  link: string | null;
  artwork_url: string | null;
  release_year: number | null;
  genres: string | null;
  submitter_name?: string | null;
  youtube_url?: string | null;
  spotify_url?: string | null;
  submitter_comment?: string | null;
};

type VoteRow = {
  submission_id: string;
  voter_id: string | null;
  voter_name: string | null;
  points: number | null;
};

type RoundAwardRow = {
  id: string;
  award_name: string;
  award_description: string | null;
  trophy_url: string | null;
  winner_name: string | null;
};

type ActivityRecord = {
  id: string;
  actor_name: string;
  activity_type: "submitted" | "voted";
  profile_id: string | null;
};

type Competitor = {
  id: string;
  name: string;
  profile_id: string | null;
};

type UrgencyLevel = "safe" | "warning" | "urgent" | "overdue" | "neutral";

type RoundContextValue = {
  round: RoundSummary | null;
  submissions: SubmissionRow[];
  votes: VoteRow[];
  awards: RoundAwardRow[];
  activity: ActivityRecord[];
  competitors: Competitor[];
  loading: boolean;
  submittedCount: number;
  votedCount: number;
  totalMembers: number;
  submissionUrgency: { pct: number; level: UrgencyLevel };
  votingUrgency: { pct: number; level: UrgencyLevel };
  isVotingComplete: boolean;
  refreshRound: () => Promise<void>;
  setThemeImageUrl: (url: string) => void;
};

const RoundContext = createContext<RoundContextValue | null>(null);

function computeUrgency(deadlineMs: number | null): { pct: number; level: UrgencyLevel } {
  if (!deadlineMs) return { pct: 0, level: "neutral" };
  const now = Date.now();
  const remaining = deadlineMs - now;
  if (remaining <= 0) return { pct: 100, level: "overdue" };
  const totalWindow = 1000 * 60 * 60 * 72; // 72 hours
  const pct = Math.min(100, Math.max(5, (1 - remaining / totalWindow) * 100));
  if (remaining <= 1000 * 60 * 60 * 6) return { pct, level: "urgent" };
  if (remaining <= 1000 * 60 * 60 * 24) return { pct, level: "warning" };
  return { pct, level: "safe" };
}

export function RoundProvider({ children }: { children: ReactNode }) {
  const { group } = useAuth();
  const [round, setRound] = useState<RoundSummary | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [awards, setAwards] = useState<RoundAwardRow[]>([]);
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);

  const loadRound = useCallback(async () => {
    if (!group) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Get league
    const { data: leagueData } = await supabase
      .from("leagues")
      .select("id")
      .eq("group_id", group.id)
      .order("season_number", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!leagueData) {
      setRound(null);
      setSubmissions([]);
      setLoading(false);
      return;
    }

    // Get current round - prioritize active rounds (open/voting) over revealed
    // First try to find an open or voting round (highest round_number = most recent)
    let { data: roundData } = await supabase
      .from("rounds")
      .select(
        "id,theme,theme_description,theme_author,status,season_number,round_number,submission_deadline,voting_deadline,reveal_until,playlist_url,external_playlist_url,youtube_playlist_url,theme_image_url"
      )
      .eq("league_id", leagueData.id)
      .in("status", ["open", "voting"])
      .order("round_number", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // If no active round, fall back to revealed round (highest round_number = most recent)
    if (!roundData) {
      const { data: revealedRound } = await supabase
        .from("rounds")
        .select(
          "id,theme,theme_description,theme_author,status,season_number,round_number,submission_deadline,voting_deadline,reveal_until,playlist_url,external_playlist_url,youtube_playlist_url,theme_image_url"
        )
        .eq("league_id", leagueData.id)
        .eq("status", "revealed")
        .order("round_number", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      roundData = revealedRound;
    }

    setRound((roundData as RoundSummary) ?? null);

    if (roundData) {
      // Run all queries in parallel for better performance
      const [submissionResult, awardResult, memberResult, activityResult] = await Promise.all([
        // Get submissions
        supabase
          .from("submissions")
          .select("id,title,artist,link,artwork_url,release_year,genres,submitter_name,youtube_url,spotify_url,submitter_comment")
          .eq("round_id", roundData.id)
          .order("created_at", { ascending: true }),
        // Get awards if revealed
        roundData.status === "revealed"
          ? supabase
              .from("round_awards")
              .select("id,award_name,award_description,trophy_url,winner_name")
              .eq("round_id", roundData.id)
              .eq("visible", true)
              .limit(3)
          : Promise.resolve({ data: null }),
        // Get competitors (from season_competitors - the source of truth for league members)
        supabase
          .from("season_competitors")
          .select("id,name,profile_id")
          .eq("group_id", group.id)
          .order("name", { ascending: true }),
        // Get activity from email events (during open/voting phases)
        roundData.status === "open" || roundData.status === "voting"
          ? supabase
              .from("round_user_activity")
              .select("id,actor_name,activity_type,profile_id")
              .eq("round_id", roundData.id)
              .order("created_at", { ascending: true })
          : Promise.resolve({ data: null }),
      ]);

      const submissionData = submissionResult.data;
      const competitorData = (memberResult.data as Competitor[]) ?? [];
      setSubmissions((submissionData as SubmissionRow[]) ?? []);
      setAwards((awardResult.data as RoundAwardRow[]) ?? []);
      setCompetitors(competitorData);
      setTotalMembers(competitorData.length);
      setActivity((activityResult.data as ActivityRecord[]) ?? []);

      // Get votes if voting phase or revealed (needs submission IDs)
      if (roundData.status === "voting" || roundData.status === "revealed") {
        const submissionIds = (submissionData ?? []).map((s: { id: string }) => s.id);
        if (submissionIds.length > 0) {
          const { data: voteData } = await supabase
            .from("votes")
            .select("submission_id,voter_id,voter_name,points")
            .in("submission_id", submissionIds);
          setVotes((voteData as VoteRow[]) ?? []);
        } else {
          setVotes([]);
        }
      } else {
        setVotes([]);
      }
    } else {
      setSubmissions([]);
      setVotes([]);
      setAwards([]);
      setActivity([]);
      // Still get competitors even without a round
      const { data: competitorData } = await supabase
        .from("season_competitors")
        .select("id,name,profile_id")
        .eq("group_id", group.id)
        .order("name", { ascending: true });
      const competitorsList = (competitorData as Competitor[]) ?? [];
      setCompetitors(competitorsList);
      setTotalMembers(competitorsList.length);
    }

    setLoading(false);
  }, [group]);

  // Silent refresh - only updates state if data changed
  const silentRefresh = useCallback(async () => {
    if (!group) return;

    // Get league
    const { data: leagueData } = await supabase
      .from("leagues")
      .select("id")
      .eq("group_id", group.id)
      .order("season_number", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!leagueData) return;

    // Check current round - prioritize active rounds (open/voting) over revealed
    let { data: roundData } = await supabase
      .from("rounds")
      .select("id,status")
      .eq("league_id", leagueData.id)
      .in("status", ["open", "voting"])
      .order("round_number", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    // Fall back to revealed round if no active round
    if (!roundData) {
      const { data: revealedRound } = await supabase
        .from("rounds")
        .select("id,status")
        .eq("league_id", leagueData.id)
        .eq("status", "revealed")
        .order("round_number", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      roundData = revealedRound;
    }

    // If round changed or status changed, do a full reload
    if (roundData?.id !== round?.id || roundData?.status !== round?.status) {
      loadRound();
      return;
    }

    if (!roundData) return;

    // Check submission count
    const { count: subCount } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("round_id", roundData.id);

    // If submission count changed, reload
    if (subCount !== submissions.length) {
      loadRound();
    }
  }, [group, round?.id, round?.status, submissions.length, loadRound]);

  useEffect(() => {
    loadRound();
  }, [loadRound]);

  // Refresh periodically with silent check
  useEffect(() => {
    if (!group) return;
    const interval = setInterval(silentRefresh, 30000);
    return () => clearInterval(interval);
  }, [group, silentRefresh]);

  const setThemeImageUrl = useCallback((url: string) => {
    setRound((prev) => (prev ? { ...prev, theme_image_url: url } : prev));
  }, []);

  // Calculate derived values
  const submissionMs = round?.submission_deadline ? new Date(round.submission_deadline).getTime() : null;
  const votingMs = round?.voting_deadline ? new Date(round.voting_deadline).getTime() : null;

  const submissionUrgency = computeUrgency(submissionMs);
  const votingUrgency = computeUrgency(votingMs);

  // Use activity data from email events for accurate counts
  const submittedCount = activity.filter((a) => a.activity_type === "submitted").length;
  const votedCount = activity.filter((a) => a.activity_type === "voted").length;
  const isVotingComplete = round?.status === "revealed" || round?.status === "archived";

  return (
    <RoundContext.Provider
      value={{
        round,
        submissions,
        votes,
        awards,
        activity,
        competitors,
        loading,
        submittedCount,
        votedCount,
        totalMembers,
        submissionUrgency,
        votingUrgency,
        isVotingComplete,
        refreshRound: loadRound,
        setThemeImageUrl,
      }}
    >
      {children}
    </RoundContext.Provider>
  );
}

export function useRound() {
  const context = useContext(RoundContext);
  if (!context) {
    throw new Error("useRound must be used within a RoundProvider");
  }
  return context;
}

export default RoundContext;
