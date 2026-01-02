import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import SeasonImport from "../components/SeasonImport";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { uploadBase64Image } from "../lib/imageUpload";
import awardsCatalog from "../data/awards.json";

type LeagueSummary = {
  id: string;
  name: string;
  season_number: number | null;
  created_at: string;
  narrative: string | null;
};

type SeasonCompetitor = {
  id: string;
  name: string;
  profile_id: string | null;
  external_id: string | null;
  ai_image_traits: string | null;
};

type UserRow = {
  member_id: string;
  role: string | null;
  profiles: {
    id: string;
    display_name: string | null;
    email: string | null;
    chat_notify_enabled: boolean | null;
    email_notify_enabled: boolean | null;
    can_toggle_chat_notify: boolean | null;
    can_toggle_email_notify: boolean | null;
    reaction_notify_enabled: boolean | null;
    can_toggle_reaction_notify: boolean | null;
  } | null;
};

type RoundSummary = {
  id: string;
  league_id: string | null;
  theme: string;
  theme_description: string | null;
  theme_author: string | null;
  season_number: number | null;
  round_number: number | null;
  external_round_id: string | null;
  playlist_url: string | null;
  status: "open" | "voting" | "revealed" | "archived";
  submission_deadline: string | null;
  voting_deadline: string | null;
  theme_image_url: string | null;
  winners_image_url: string | null;
  narrative: string | null;
  created_at: string;
};

type InviteRow = {
  id: string;
  code: string;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  used_by: string | null;
};

type TabId = "users" | "invites" | "leagues" | "rounds" | "competitors" | "imports" | "ai-settings" | "bonus";

type BonusPointEntry = {
  id: string;
  points: number;
  reason: string | null;
  created_at: string;
  profiles: { display_name: string | null } | null;
  rounds: { theme: string } | null;
};

type RoundImportRow = {
  id: string;
  external_round_id: string;
  name: string;
  description: string | null;
  playlist_url: string | null;
  external_created_at: string | null;
  round_id: string | null;
};

type PlayerConnectionRow = {
  id: string;
  source_profile_id: string;
  target_profile_id: string;
  relation_type: string;
};

type ConnectionDraft = {
  targetId: string;
  relation: string;
};

const RELATIONSHIP_OPTIONS = [
  "Partner",
  "Spouse",
  "Sibling",
  "Parent",
  "Child",
  "Grandparent",
  "Grandchild",
  "Cousin",
  "Aunt/Uncle",
  "Niece/Nephew",
  "In-law",
  "Best friend",
  "Friend",
  "Neighbor",
  "Roommate",
  "Coworker",
  "Boss",
  "Direct report",
  "Mentor",
  "Student",
  "Teacher",
  "Bandmate",
  "Teammate",
  "Babysitter",
];

export default function AdminPage() {
  const { group, profile } = useAuth();
  const isLead = group?.role === "lead";
  const [activeTab, setActiveTab] = useState<TabId>("users");
  const [leagues, setLeagues] = useState<LeagueSummary[]>([]);
  const [leagueName, setLeagueName] = useState("");
  const [leagueSeasonNumber, setLeagueSeasonNumber] = useState("");
  const [leagueError, setLeagueError] = useState<string | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [roundTheme, setRoundTheme] = useState("");
  const [roundDescription, setRoundDescription] = useState("");
  const [roundAuthor, setRoundAuthor] = useState("");
  const [roundSeasonNumber, setRoundSeasonNumber] = useState("");
  const [roundNumber, setRoundNumber] = useState("");
  const [roundPlaylistUrl, setRoundPlaylistUrl] = useState("");
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [votingDeadline, setVotingDeadline] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [seasonCompetitors, setSeasonCompetitors] = useState<SeasonCompetitor[]>([]);
  const [newCompetitor, setNewCompetitor] = useState("");
  const [importingCompetitors, setImportingCompetitors] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roundImports, setRoundImports] = useState<RoundImportRow[]>([]);
  const [competitorTraitsDrafts, setCompetitorTraitsDrafts] = useState<Record<string, string>>({});
  const [playerConnections, setPlayerConnections] = useState<PlayerConnectionRow[]>([]);
  const [connectionDrafts, setConnectionDrafts] = useState<Record<string, ConnectionDraft>>({});
  const [, setGroupSettings] = useState<GroupSettings | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<GroupSettings | null>(null);
  const [bannerStatusByRound, setBannerStatusByRound] = useState<Record<string, string>>({});
  const [bannerLoadingId, setBannerLoadingId] = useState<string | null>(null);
  const [storyStatusByRound, setStoryStatusByRound] = useState<Record<string, string>>({});
  const [storyLoadingId, setStoryLoadingId] = useState<string | null>(null);
  const [awardsStatusByRound, setAwardsStatusByRound] = useState<Record<string, string>>({});
  const [awardsLoadingId, setAwardsLoadingId] = useState<string | null>(null);
  const [leagueAwardsStatus, setLeagueAwardsStatus] = useState<Record<string, string>>({});
  const [leagueAwardsLoadingId, setLeagueAwardsLoadingId] = useState<string | null>(null);
  const [seasonAwardsStatus, setSeasonAwardsStatus] = useState<Record<string, string>>({});
  const [seasonAwardsLoadingId, setSeasonAwardsLoadingId] = useState<string | null>(null);
  const [seasonNarrativeStatus, setSeasonNarrativeStatus] = useState<Record<string, string>>({});
  const [seasonNarrativeLoadingId, setSeasonNarrativeLoadingId] = useState<string | null>(null);
  const [editingLeagueId, setEditingLeagueId] = useState<string | null>(null);
  const [editingLeagueName, setEditingLeagueName] = useState("");
  const [editingLeagueSeason, setEditingLeagueSeason] = useState("");
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [editingRound, setEditingRound] = useState<{
    theme: string;
    theme_description: string;
    theme_author: string;
    season_number: string;
    round_number: string;
    playlist_url: string;
    status: RoundSummary["status"];
    submission_deadline: string;
    voting_deadline: string;
  } | null>(null);
  const [bonusPoints, setBonusPoints] = useState<BonusPointEntry[]>([]);
  const [bonusPointsDraft, setBonusPointsDraft] = useState<Record<string, { points: string; reason: string }>>({});
  const [roundAwardCounts, setRoundAwardCounts] = useState<Record<string, number>>({});
  const [seasonAwardCounts, setSeasonAwardCounts] = useState<Record<string, number>>({});
  // Round Challenge state
  const [challengeSongs, setChallengeSongs] = useState<{
    song1: { title: string; artist: string; spotify_url: string; youtube_url: string; theme: string };
    song2: { title: string; artist: string; spotify_url: string; youtube_url: string; theme: string };
  } | null>(null);
  const [challengeRoundId, setChallengeRoundId] = useState<string | null>(null);
  const [challengeLinksEditing, setChallengeLinksEditing] = useState<{
    song1_spotify_url: string;
    song1_youtube_url: string;
    song2_spotify_url: string;
    song2_youtube_url: string;
  }>({ song1_spotify_url: "", song1_youtube_url: "", song2_spotify_url: "", song2_youtube_url: "" });
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengeSaving, setChallengeSaving] = useState(false);
  const [roundChallengeExists, setRoundChallengeExists] = useState<Record<string, boolean>>({});
  const [challengeGenLoadingId, setChallengeGenLoadingId] = useState<string | null>(null);
  const [challengeStatusByRound, setChallengeStatusByRound] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!selectedLeagueId) return;
    const league = leagues.find((row) => row.id === selectedLeagueId);
    if (league && !roundSeasonNumber) {
      setRoundSeasonNumber(String(league.season_number ?? ""));
    }
    if (group?.id) {
      fetchRoundImports(group.id, selectedLeagueId);
    }
  }, [selectedLeagueId, leagues, roundSeasonNumber]);

  const fetchCompetitors = async (groupId: string) => {
    const { data: competitorData } = await supabase
      .from("season_competitors")
      .select("id,name,profile_id,external_id,ai_image_traits")
      .eq("group_id", groupId)
      .order("name");
    setSeasonCompetitors((competitorData as SeasonCompetitor[]) ?? []);
  };

  useEffect(() => {
    if (!group) return;

    const fetchData = async () => {
      const { data: leagueData } = await supabase
        .from("leagues")
        .select("id,name,season_number,created_at,narrative")
        .eq("group_id", group.id)
        .order("season_number", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      const leagueList = (leagueData as LeagueSummary[]) ?? [];
      setLeagues(leagueList);
      setSelectedLeagueId((prev) => prev ?? leagueList[0]?.id ?? null);
      if (!leagueSeasonNumber) {
        if (leagueList.length) {
          const nextSeason = Math.max(...leagueList.map((row) => row.season_number ?? 0)) + 1;
          setLeagueSeasonNumber(String(nextSeason));
        } else {
          setLeagueSeasonNumber("1");
        }
      }

      await fetchCompetitors(group.id);
      await fetchRoundImports(group.id, leagueList[0]?.id ?? null);

      const { data: inviteData } = await supabase
        .from("invites")
        .select("id,code,created_at,expires_at,used_at,used_by")
        .eq("group_id", group.id)
        .is("used_at", null)
        .order("created_at", { ascending: false });

      setInvites((inviteData as InviteRow[]) ?? []);

      const leagueIds = leagueList.map((row) => row.id);
      if (leagueIds.length) {
      const { data: roundData } = await supabase
        .from("rounds")
        .select("id,league_id,theme,theme_description,theme_author,season_number,round_number,external_round_id,playlist_url,status,submission_deadline,voting_deadline,theme_image_url,winners_image_url,narrative,created_at")
        .in("league_id", leagueIds)
        .order("season_number", { ascending: false, nullsFirst: false })
        .order("round_number", { ascending: true, nullsFirst: false });

      const roundList = (roundData as RoundSummary[]) ?? [];
      setRounds(roundList);

      // Fetch award counts per round
      if (roundList.length > 0) {
        const roundIds = roundList.map((r) => r.id);
        const { data: awardData } = await supabase
          .from("round_awards")
          .select("round_id")
          .in("round_id", roundIds);

        const counts: Record<string, number> = {};
        (awardData ?? []).forEach((a) => {
          if (a.round_id) {
            counts[a.round_id] = (counts[a.round_id] || 0) + 1;
          }
        });
        setRoundAwardCounts(counts);

        // Fetch season award counts (awards without round_id, grouped by league)
        const { data: seasonAwardData } = await supabase
          .from("round_awards")
          .select("round_id,award_name")
          .is("round_id", null);

        // Season awards go to first round of each league for tracking
        const seasonCounts: Record<string, number> = {};
        leagueList.forEach((league) => {
          const leagueRounds = roundList.filter((r) => r.league_id === league.id);
          const hasSeasonAwards = (seasonAwardData ?? []).length > 0 && leagueRounds.length > 0;
          if (hasSeasonAwards) {
            // Check if this league's first round has season awards stored
            const firstRound = leagueRounds[leagueRounds.length - 1]; // Get earliest round
            seasonCounts[league.id] = counts[firstRound?.id] || 0;
          }
        });
        setSeasonAwardCounts(seasonCounts);

        // Fetch which rounds have challenges
        const { data: challengeData } = await supabase
          .from("round_challenges")
          .select("round_id")
          .in("round_id", roundIds)
          .eq("active", true);

        const challengeExists: Record<string, boolean> = {};
        (challengeData ?? []).forEach((c) => {
          if (c.round_id) {
            challengeExists[c.round_id] = true;
          }
        });
        setRoundChallengeExists(challengeExists);
      }
      } else {
        setRounds([]);
      }

      const { data: userData } = await supabase
        .from("group_members")
        .select(
          "member_id, role, profiles(id,display_name,email,chat_notify_enabled,email_notify_enabled,can_toggle_chat_notify,can_toggle_email_notify,reaction_notify_enabled,can_toggle_reaction_notify)"
        )
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });

      setUsers((userData as unknown as UserRow[]) ?? []);

      const { data: connectionData } = await supabase
        .from("player_connections")
        .select("id,source_profile_id,target_profile_id,relation_type")
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });
      setPlayerConnections((connectionData as PlayerConnectionRow[]) ?? []);

      // Fetch bonus points
      const { data: bonusData } = await supabase
        .from("challenge_bonus_points")
        .select("id,points,reason,created_at,profiles(display_name),rounds(theme)")
        .order("created_at", { ascending: false })
        .limit(50);
      setBonusPoints((bonusData as unknown as BonusPointEntry[]) ?? []);

      const { data: settingsData } = await supabase
        .from("group_settings")
        .select(
          "id,group_id,round_summary_model_key,round_story_image_model_key,round_theme_image_model_key,awards_model_key,trophy_image_model_key,logo_palette,ai_assistant_enabled,ai_explain_enabled,ai_validate_enabled,ai_hint_enabled,ai_validate_daily_limit,ai_chat_enabled"
        )
        .eq("group_id", group.id)
        .maybeSingle();
      const fallback: GroupSettings = {
        id: settingsData?.id ?? "",
        group_id: group.id,
        round_summary_model_key: settingsData?.round_summary_model_key ?? "OPENROUTER_MODEL",
        round_story_image_model_key: settingsData?.round_story_image_model_key ?? "OPENROUTER_MID_MODEL",
        round_theme_image_model_key: settingsData?.round_theme_image_model_key ?? "OPENROUTER_MID_MODEL",
        awards_model_key: settingsData?.awards_model_key ?? "OPENROUTER_MODEL",
        trophy_image_model_key: settingsData?.trophy_image_model_key ?? "OPENROUTER_MID_MODEL",
        logo_palette: settingsData?.logo_palette ?? "ocean-coral",
        ai_assistant_enabled: settingsData?.ai_assistant_enabled ?? true,
        ai_explain_enabled: settingsData?.ai_explain_enabled ?? true,
        ai_validate_enabled: settingsData?.ai_validate_enabled ?? true,
        ai_hint_enabled: settingsData?.ai_hint_enabled ?? true,
        ai_validate_daily_limit: settingsData?.ai_validate_daily_limit ?? 5,
        ai_chat_enabled: settingsData?.ai_chat_enabled ?? true,
      };
      setGroupSettings(fallback);
      setSettingsDraft(fallback);
    };

    fetchData();
  }, [group]);

  const fetchRoundImports = async (groupId: string, leagueId?: string | null) => {
    if (!leagueId && !selectedLeagueId) {
      setRoundImports([]);
      return;
    }
    const targetLeague = leagueId ?? selectedLeagueId ?? null;
    const { data } = await supabase
      .from("round_imports")
      .select("id,external_round_id,name,description,playlist_url,external_created_at,round_id")
      .eq("group_id", groupId)
      .eq("league_id", targetLeague)
      .order("external_created_at", { ascending: false });
    setRoundImports((data as RoundImportRow[]) ?? []);
  };

  const usersById = useMemo(() => {
    const map = new Map<string, UserRow["profiles"]>();
    users.forEach((user) => {
      if (user.profiles?.id) {
        map.set(user.profiles.id, user.profiles);
      }
    });
    return map;
  }, [users]);

  const connectionsBySource = useMemo(() => {
    const map = new Map<string, PlayerConnectionRow[]>();
    playerConnections.forEach((connection) => {
      const list = map.get(connection.source_profile_id) ?? [];
      list.push(connection);
      map.set(connection.source_profile_id, list);
    });
    return map;
  }, [playerConnections]);

  const getConnectionDraft = (userId: string) =>
    connectionDrafts[userId] ?? { targetId: "", relation: "" };

  const updateConnectionDraft = (userId: string, updates: Partial<ConnectionDraft>) => {
    setConnectionDrafts((prev) => ({
      ...prev,
      [userId]: { ...getConnectionDraft(userId), ...updates },
    }));
  };

  const getCompetitorTraitsDraft = (competitorId: string, fallback: string | null) =>
    competitorTraitsDrafts[competitorId] ?? fallback ?? "";

  const handleCreateLeague = async () => {
    if (!group || !leagueName.trim()) return;
    setLeagueError(null);
    const seasonNumber = leagueSeasonNumber ? Number(leagueSeasonNumber) : null;
    if (!seasonNumber || Number.isNaN(seasonNumber)) {
      setLeagueError("Season number is required.");
      return;
    }
    if (leagues.some((league) => league.season_number === seasonNumber)) {
      setLeagueError("Season number must be unique for this group.");
      return;
    }
    const { error } = await supabase.from("leagues").insert({
      group_id: group.id,
      name: leagueName.trim(),
      season_number: seasonNumber,
    });

    if (!error) {
      setLeagueName("");
      setLeagueSeasonNumber(String(seasonNumber + 1));
      const { data } = await supabase
        .from("leagues")
        .select("id,name,season_number,created_at")
        .eq("group_id", group.id)
        .order("season_number", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      const leagueList = (data as LeagueSummary[]) ?? [];
      setLeagues(leagueList);
      setSelectedLeagueId(leagueList[0]?.id ?? null);
    }
  };

  const handleCreateRound = async () => {
    if (!selectedLeagueId || !roundTheme.trim()) return;
    const selectedLeague = leagues.find((league) => league.id === selectedLeagueId);
    const { error } = await supabase.from("rounds").insert({
      league_id: selectedLeagueId,
      theme: roundTheme.trim(),
      theme_description: roundDescription.trim() || null,
      theme_author: roundAuthor.trim() || null,
      season_number: roundSeasonNumber ? Number(roundSeasonNumber) : selectedLeague?.season_number ?? null,
      round_number: roundNumber ? Number(roundNumber) : null,
      playlist_url: roundPlaylistUrl.trim() || null,
      submission_deadline: submissionDeadline || null,
      voting_deadline: votingDeadline || null,
      status: "open",
    });

    if (!error) {
      setRoundTheme("");
      setRoundDescription("");
      setRoundAuthor("");
      setRoundSeasonNumber("");
      setRoundNumber("");
      setRoundPlaylistUrl("");
      setSubmissionDeadline("");
      setVotingDeadline("");
      const leagueIds = leagues.map((row) => row.id);
      if (leagueIds.length) {
        const { data } = await supabase
          .from("rounds")
          .select("id,league_id,theme,theme_description,theme_author,season_number,round_number,external_round_id,playlist_url,status,submission_deadline,voting_deadline,created_at")
          .in("league_id", leagueIds)
          .order("season_number", { ascending: false, nullsFirst: false })
          .order("round_number", { ascending: true, nullsFirst: false });
        setRounds((data as RoundSummary[]) ?? []);
      }
      await supabase.functions.invoke("notify", {
        body: {
          title: "New round created",
          message: `Round "${roundTheme.trim()}" is ready.`,
          recipients: profile?.email ? [profile.email] : [],
        },
      });
    }
  };

  const handleGenerateInvite = async () => {
    if (!group) return;
    setInviteError(null);
    const code = crypto.randomUUID().split("-")[0];
    const { error } = await supabase.from("invites").insert({
      group_id: group.id,
      code,
      created_by: profile?.id,
    });

    if (error) {
      setInviteError(error.message);
      return;
    }

    const baseUrl = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin;
    const link = `${baseUrl}/invite?code=${code}`;
    setInviteLink(link);
    await navigator.clipboard.writeText(link);
    const { data } = await supabase
      .from("invites")
      .select("id,code,created_at,expires_at,used_at,used_by")
      .eq("group_id", group.id)
      .is("used_at", null)
      .order("created_at", { ascending: false });
    setInvites((data as InviteRow[]) ?? []);
    await supabase.functions.invoke("notify", {
      body: {
        title: "Invite created",
        message: `Invite link generated for ${group.name}.`,
        recipients: profile?.email ? [profile.email] : [],
      },
    });
  };

  const handleAddCompetitor = async () => {
    if (!group || !newCompetitor.trim()) return;
    const nameKey = newCompetitor.trim().toLowerCase();
    if (seasonCompetitors.some((competitor) => competitor.name.trim().toLowerCase() === nameKey)) {
      setNewCompetitor("");
      return;
    }
    const { error } = await supabase.from("season_competitors").insert({
      group_id: group.id,
      name: newCompetitor.trim(),
    });
    if (!error) {
      setNewCompetitor("");
      const { data } = await supabase
        .from("season_competitors")
        .select("id,name,profile_id,external_id,ai_image_traits")
        .eq("group_id", group.id)
        .order("name");
      setSeasonCompetitors((data as SeasonCompetitor[]) ?? []);
    }
  };

  const handleImportSeasonOneCompetitors = async () => {
    if (!group) return;
    setImportingCompetitors(true);
    const response = await fetch("/data/competitors.csv");
    const text = await response.text();
    const parsed = await import("papaparse").then((mod) =>
      mod.default.parse<{ ID: string; Name: string }>(text, { header: true, skipEmptyLines: true })
    );

    const { data: existing } = await supabase
      .from("season_competitors")
      .select("external_id")
      .eq("group_id", group.id);

    const existingIds = new Set((existing ?? []).map((row) => row.external_id));
    const existingNames = new Set(seasonCompetitors.map((row) => row.name.trim().toLowerCase()));
    const rows = parsed.data
      .filter((row) => row.ID && row.Name && !existingIds.has(row.ID))
      .filter((row) => !existingNames.has(row.Name.trim().toLowerCase()))
      .map((row) => ({
        group_id: group.id,
        external_id: row.ID,
        name: row.Name,
      }));

    if (rows.length) {
      await supabase.from("season_competitors").insert(rows);
    }

    const { data } = await supabase
      .from("season_competitors")
      .select("id,name,profile_id,external_id,ai_image_traits")
      .eq("group_id", group.id)
      .order("name");
    setSeasonCompetitors((data as SeasonCompetitor[]) ?? []);
    setImportingCompetitors(false);
  };

  const updateUser = async (userId: string, updates: Partial<UserRow["profiles"]>) => {
    if (!userId) return;
    const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
    if (error) return;
    setUsers((prev) =>
      prev.map((user) =>
        user.profiles?.id === userId ? { ...user, profiles: { ...user.profiles, ...updates } } : user
      )
    );
  };

  const removeUser = async (userId: string) => {
    if (!group) return;
    const confirmRemove = window.confirm("Remove this member from the family group?");
    if (!confirmRemove) return;
    const { error } = await supabase.from("group_members").delete().eq("group_id", group.id).eq("member_id", userId);
    if (error) return;
    setUsers((prev) => prev.filter((user) => user.member_id !== userId));
  };

  const addConnection = async (userId: string) => {
    if (!group) return;
    const draft = getConnectionDraft(userId);
    if (!draft.targetId || !draft.relation) return;
    if (draft.targetId === userId) return;
    const existing = connectionsBySource.get(userId) ?? [];
    if (existing.length >= 5) return;
    if (existing.some((row) => row.target_profile_id === draft.targetId && row.relation_type === draft.relation)) {
      return;
    }

    const { data, error } = await supabase
      .from("player_connections")
      .insert({
        group_id: group.id,
        source_profile_id: userId,
        target_profile_id: draft.targetId,
        relation_type: draft.relation,
      })
      .select("id,source_profile_id,target_profile_id,relation_type")
      .maybeSingle();

    if (!error && data) {
      setPlayerConnections((prev) => [...prev, data as PlayerConnectionRow]);
      updateConnectionDraft(userId, { targetId: "", relation: "" });
    }
  };

  const removeConnection = async (connectionId: string) => {
    const { error } = await supabase.from("player_connections").delete().eq("id", connectionId);
    if (!error) {
      setPlayerConnections((prev) => prev.filter((row) => row.id !== connectionId));
    }
  };

  const updateCompetitorTraits = async (competitorId: string, traits: string) => {
    if (!group) return;
    const { error } = await supabase
      .from("season_competitors")
      .update({ ai_image_traits: traits || null })
      .eq("id", competitorId)
      .eq("group_id", group.id);
    if (error) return;
    setSeasonCompetitors((prev) =>
      prev.map((row) => (row.id === competitorId ? { ...row, ai_image_traits: traits || null } : row))
    );
  };

  // Load round challenge for a specific round
  const loadRoundChallenge = async (roundId: string) => {
    if (!group) return;
    setChallengeLoading(true);
    setChallengeRoundId(roundId);
    try {
      const { data } = await supabase.functions.invoke("round-challenge", {
        body: {
          mode: "get_or_generate",
          round_id: roundId,
          group_id: group.id,
          current_theme: rounds.find((r) => r.id === roundId)?.theme ?? "",
        },
      });
      if (data?.songs && data.songs.length >= 2) {
        setChallengeSongs({
          song1: data.songs[0],
          song2: data.songs[1],
        });
        setChallengeLinksEditing({
          song1_spotify_url: data.songs[0].spotify_url ?? "",
          song1_youtube_url: data.songs[0].youtube_url ?? "",
          song2_spotify_url: data.songs[1].spotify_url ?? "",
          song2_youtube_url: data.songs[1].youtube_url ?? "",
        });
      }
    } catch (err) {
      console.error("Error loading challenge:", err);
    } finally {
      setChallengeLoading(false);
    }
  };

  // Save updated challenge links
  const saveChallengeLinks = async () => {
    if (!group || !challengeRoundId) return;
    setChallengeSaving(true);
    try {
      await supabase.functions.invoke("round-challenge", {
        body: {
          mode: "admin_update",
          round_id: challengeRoundId,
          group_id: group.id,
          song1_spotify_url: challengeLinksEditing.song1_spotify_url,
          song1_youtube_url: challengeLinksEditing.song1_youtube_url,
          song2_spotify_url: challengeLinksEditing.song2_spotify_url,
          song2_youtube_url: challengeLinksEditing.song2_youtube_url,
        },
      });
      // Reload to confirm changes
      await loadRoundChallenge(challengeRoundId);
    } catch (err) {
      console.error("Error saving challenge links:", err);
    } finally {
      setChallengeSaving(false);
    }
  };

  // Generate round challenge (bonus game)
  const generateRoundChallenge = async (round: RoundSummary) => {
    if (!group) return;
    setChallengeGenLoadingId(round.id);
    setChallengeStatusByRound((prev) => ({ ...prev, [round.id]: "Generating..." }));
    try {
      const { data, error } = await supabase.functions.invoke("round-challenge", {
        body: {
          mode: "get_or_generate",
          round_id: round.id,
          group_id: group.id,
          current_theme: round.theme ?? "",
        },
      });
      if (error) throw error;
      if (data?.songs && data.songs.length >= 2) {
        setRoundChallengeExists((prev) => ({ ...prev, [round.id]: true }));
        setChallengeStatusByRound((prev) => ({
          ...prev,
          [round.id]: `✓ ${data.songs[0].title} / ${data.songs[1].title}`,
        }));
      } else {
        setChallengeStatusByRound((prev) => ({ ...prev, [round.id]: "No songs generated" }));
      }
    } catch (err) {
      console.error("Error generating challenge:", err);
      setChallengeStatusByRound((prev) => ({ ...prev, [round.id]: "Generation failed" }));
    } finally {
      setChallengeGenLoadingId(null);
    }
  };

  const saveSettings = async () => {
    if (!group || !settingsDraft) return;
    const payload = {
      group_id: group.id,
      round_summary_model_key: settingsDraft.round_summary_model_key,
      round_story_image_model_key: settingsDraft.round_story_image_model_key,
      round_theme_image_model_key: settingsDraft.round_theme_image_model_key,
      awards_model_key: settingsDraft.awards_model_key,
      trophy_image_model_key: settingsDraft.trophy_image_model_key,
      logo_palette: settingsDraft.logo_palette,
      ai_assistant_enabled: settingsDraft.ai_assistant_enabled,
      ai_explain_enabled: settingsDraft.ai_explain_enabled,
      ai_validate_enabled: settingsDraft.ai_validate_enabled,
      ai_hint_enabled: settingsDraft.ai_hint_enabled,
      ai_validate_daily_limit: settingsDraft.ai_validate_daily_limit,
      ai_chat_enabled: settingsDraft.ai_chat_enabled,
    };
    const { data, error } = await supabase
      .from("group_settings")
      .upsert(payload, { onConflict: "group_id" })
      .select(
        "id,group_id,round_summary_model_key,round_story_image_model_key,round_theme_image_model_key,awards_model_key,trophy_image_model_key,logo_palette,ai_assistant_enabled,ai_explain_enabled,ai_validate_enabled,ai_hint_enabled,ai_validate_daily_limit,ai_chat_enabled"
      )
      .maybeSingle();
    if (!error && data) {
      setGroupSettings(data as GroupSettings);
      setSettingsDraft(data as GroupSettings);
    }
  };

  const generateThemeBanner = async (round: RoundSummary) => {
    if (!group) return;
    setBannerLoadingId(round.id);
    setBannerStatusByRound((prev) => ({ ...prev, [round.id]: "Generating..." }));
    const { data, error } = await supabase.functions.invoke("openrouter-round-story", {
      body: {
        mode: "theme",
        round: {
          title: round.theme,
          description: round.theme_description,
          author: round.theme_author,
        },
        image_model_key: settingsDraft?.round_theme_image_model_key ?? "OPENROUTER_MID_MODEL",
      },
    });
    if (error) {
      setBannerStatusByRound((prev) => ({ ...prev, [round.id]: "Failed to generate." }));
      setBannerLoadingId(null);
      return;
    }
    const imageBase64 = data?.image_base64 ?? null;
    const imageUrl = data?.image_url ?? null;
    if (!imageBase64 && !imageUrl) {
      setBannerStatusByRound((prev) => ({ ...prev, [round.id]: "No image returned." }));
      setBannerLoadingId(null);
      return;
    }
    let finalUrl = imageUrl;
    if (imageBase64) {
      const filePath = `round-images/${round.id}/theme-${Date.now()}.png`;
      const upload = await uploadBase64Image("round-art", filePath, imageBase64);
      if (upload.publicUrl) {
        finalUrl = upload.publicUrl;
      } else {
        setBannerStatusByRound((prev) => ({ ...prev, [round.id]: upload.error ?? "Upload failed." }));
        setBannerLoadingId(null);
        return;
      }
    }
    if (finalUrl) {
      const { error: updateError } = await supabase
        .from("rounds")
        .update({ theme_image_url: finalUrl })
        .eq("id", round.id);
      if (!updateError) {
        setRounds((prev) => prev.map((row) => (row.id === round.id ? { ...row, theme_image_url: finalUrl } : row)));
        setBannerStatusByRound((prev) => ({ ...prev, [round.id]: "Banner saved." }));
      } else {
        setBannerStatusByRound((prev) => ({ ...prev, [round.id]: "Failed to save banner." }));
      }
    }
    setBannerLoadingId(null);
  };

  const generateRoundStory = async (round: RoundSummary) => {
    if (!group) return;
    setStoryLoadingId(round.id);
    setStoryStatusByRound((prev) => ({ ...prev, [round.id]: "Loading data..." }));

    // Fetch submissions for this round
    const { data: submissions } = await supabase
      .from("submissions")
      .select("id,title,artist,submitter_name,artwork_url,external_comment")
      .eq("round_id", round.id);

    if (!submissions || submissions.length === 0) {
      setStoryStatusByRound((prev) => ({ ...prev, [round.id]: "No submissions found." }));
      setStoryLoadingId(null);
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
      .map((s) => ({
        ...s,
        totalPoints: votesBySubmission.get(s.id)?.total ?? 0,
      }))
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

    setStoryStatusByRound((prev) => ({ ...prev, [round.id]: "Generating story..." }));

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
        text_model_key: settingsDraft?.round_summary_model_key ?? "OPENROUTER_MODEL",
        image_model_key: settingsDraft?.round_story_image_model_key ?? "OPENROUTER_MID_MODEL",
      },
    });

    if (error) {
      setStoryStatusByRound((prev) => ({ ...prev, [round.id]: "Failed to generate." }));
      setStoryLoadingId(null);
      return;
    }

    const narrative = data?.narrative ?? null;
    const imageBase64 = data?.image_base64 ?? null;
    const imageUrl = data?.image_url ?? null;

    let finalImageUrl = imageUrl;
    if (imageBase64) {
      const filePath = `round-images/${round.id}/winners-${Date.now()}.png`;
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
      const { error: updateError } = await supabase
        .from("rounds")
        .update(updates)
        .eq("id", round.id);

      if (!updateError) {
        setRounds((prev) =>
          prev.map((r) =>
            r.id === round.id
              ? { ...r, narrative: updates.narrative ?? r.narrative, winners_image_url: updates.winners_image_url ?? r.winners_image_url }
              : r
          )
        );
        setStoryStatusByRound((prev) => ({ ...prev, [round.id]: "Story saved." }));
      } else {
        setStoryStatusByRound((prev) => ({ ...prev, [round.id]: "Failed to save." }));
      }
    } else {
      setStoryStatusByRound((prev) => ({ ...prev, [round.id]: "No content generated." }));
    }

    setStoryLoadingId(null);
  };

  const generateRoundAwards = async (round: RoundSummary) => {
    if (!group) return;
    setAwardsLoadingId(round.id);
    setAwardsStatusByRound((prev) => ({ ...prev, [round.id]: "Loading data..." }));

    // Fetch submissions for this round
    const { data: submissions } = await supabase
      .from("submissions")
      .select("id,title,artist,submitter_name,external_comment,release_year,genres")
      .eq("round_id", round.id);

    if (!submissions || submissions.length === 0) {
      setAwardsStatusByRound((prev) => ({ ...prev, [round.id]: "No submissions found." }));
      setAwardsLoadingId(null);
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

    setAwardsStatusByRound((prev) => ({ ...prev, [round.id]: "Generating awards..." }));

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
        awards: awardsCatalog.awards,
        recent_awards: recentAwardIds,
        awards_model_key: settingsDraft?.awards_model_key ?? "OPENROUTER_MODEL",
      },
    });

    if (error) {
      setAwardsStatusByRound((prev) => ({ ...prev, [round.id]: "Failed to generate." }));
      setAwardsLoadingId(null);
      return;
    }

    const generatedAwards = data?.awards ?? [];
    if (generatedAwards.length === 0) {
      setAwardsStatusByRound((prev) => ({ ...prev, [round.id]: "No awards selected." }));
      setAwardsLoadingId(null);
      return;
    }

    setAwardsStatusByRound((prev) => ({ ...prev, [round.id]: `Saving ${generatedAwards.length} awards...` }));

    // Insert awards into round_awards table
    let savedCount = 0;
    const savedAwardIds: string[] = [];
    for (const award of generatedAwards) {
      const catalogAward = awardsCatalog.awards.find((a) => a.id === award.award_id);
      const { data: insertData, error: insertError } = await supabase.from("round_awards").insert({
        round_id: round.id,
        award_id: award.award_id,
        award_name: award.award_name || catalogAward?.name,
        award_description: catalogAward?.description ?? null,
        winner_name: award.winner_name,
        visible: true,
      }).select("id").single();
      if (!insertError && insertData) {
        savedCount++;
        savedAwardIds.push(insertData.id);
      }
    }

    // Generate trophy images for saved awards
    if (savedCount > 0) {
      setAwardsStatusByRound((prev) => ({ ...prev, [round.id]: `Generating ${savedCount} trophy images...` }));

      for (let i = 0; i < savedAwardIds.length; i++) {
        const awardId = savedAwardIds[i];
        const award = generatedAwards[i];
        const catalogAward = awardsCatalog.awards.find((a) => a.id === award.award_id);

        if (!catalogAward?.trophy_prompt) continue;

        setAwardsStatusByRound((prev) => ({ ...prev, [round.id]: `Trophy ${i + 1}/${savedAwardIds.length}...` }));

        const { data: trophyData } = await supabase.functions.invoke("openrouter-round-story", {
          body: {
            mode: "trophy",
            trophy_prompt: catalogAward.trophy_prompt,
            trophy_model_key: settingsDraft?.trophy_image_model_key ?? "OPENROUTER_TROPHY_MODEL",
          },
        });

        if (trophyData?.image_base64 || trophyData?.image_url) {
          let trophyUrl = trophyData.image_url;
          if (trophyData.image_base64) {
            const filePath = `trophy-images/${awardId}/${Date.now()}.png`;
            const upload = await uploadBase64Image("round-art", filePath, trophyData.image_base64);
            if (upload.publicUrl) trophyUrl = upload.publicUrl;
          }
          if (trophyUrl) {
            await supabase.from("round_awards").update({ trophy_url: trophyUrl }).eq("id", awardId);
          }
        }
      }
    }

    setAwardsStatusByRound((prev) => ({
      ...prev,
      [round.id]: savedCount > 0 ? `${savedCount} awards with trophies saved.` : "Failed to save awards.",
    }));
    setAwardsLoadingId(null);
  };

  const generateLeagueAwards = async (league: LeagueSummary) => {
    if (!group) return;
    setLeagueAwardsLoadingId(league.id);
    setLeagueAwardsStatus((prev) => ({ ...prev, [league.id]: "Finding rounds..." }));

    // Get all rounds for this league
    const leagueRounds = rounds.filter((r) => r.league_id === league.id);
    if (leagueRounds.length === 0) {
      setLeagueAwardsStatus((prev) => ({ ...prev, [league.id]: "No rounds found." }));
      setLeagueAwardsLoadingId(null);
      return;
    }

    let totalGenerated = 0;
    for (let i = 0; i < leagueRounds.length; i++) {
      const round = leagueRounds[i];
      setLeagueAwardsStatus((prev) => ({
        ...prev,
        [league.id]: `Processing round ${i + 1}/${leagueRounds.length}: ${round.theme}`,
      }));

      // Generate awards for this round (reusing the same logic)
      const { data: submissions } = await supabase
        .from("submissions")
        .select("id,title,artist,submitter_name,external_comment,release_year,genres")
        .eq("round_id", round.id);

      if (!submissions || submissions.length === 0) continue;

      const submissionIds = submissions.map((s) => s.id);
      const { data: votes } = await supabase
        .from("votes")
        .select("submission_id,voter_name,points,comment")
        .in("submission_id", submissionIds);

      const { data: recentAwards } = await supabase
        .from("round_awards")
        .select("award_id")
        .order("created_at", { ascending: false })
        .limit(20);

      const recentAwardIds = (recentAwards ?? []).map((a) => a.award_id).filter(Boolean);

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
          awards: awardsCatalog.awards,
          recent_awards: recentAwardIds,
          awards_model_key: settingsDraft?.awards_model_key ?? "OPENROUTER_MODEL",
        },
      });

      if (error || !data?.awards?.length) continue;

      for (const award of data.awards) {
        const catalogAward = awardsCatalog.awards.find((a) => a.id === award.award_id);
        const { data: insertData, error: insertError } = await supabase.from("round_awards").insert({
          round_id: round.id,
          award_id: award.award_id,
          award_name: award.award_name || catalogAward?.name,
          award_description: catalogAward?.description ?? null,
          winner_name: award.winner_name,
          visible: true,
        }).select("id").single();

        if (!insertError && insertData) {
          totalGenerated++;

          // Generate trophy if prompt exists
          if (catalogAward?.trophy_prompt) {
            const { data: trophyData } = await supabase.functions.invoke("openrouter-round-story", {
              body: {
                mode: "trophy",
                trophy_prompt: catalogAward.trophy_prompt,
                trophy_model_key: settingsDraft?.trophy_image_model_key ?? "OPENROUTER_TROPHY_MODEL",
              },
            });

            if (trophyData?.image_base64 || trophyData?.image_url) {
              let trophyUrl = trophyData.image_url;
              if (trophyData.image_base64) {
                const filePath = `trophy-images/${insertData.id}/${Date.now()}.png`;
                const upload = await uploadBase64Image("round-art", filePath, trophyData.image_base64);
                if (upload.publicUrl) trophyUrl = upload.publicUrl;
              }
              if (trophyUrl) {
                await supabase.from("round_awards").update({ trophy_url: trophyUrl }).eq("id", insertData.id);
              }
            }
          }
        }
      }
    }

    setLeagueAwardsStatus((prev) => ({
      ...prev,
      [league.id]: totalGenerated > 0 ? `${totalGenerated} awards with trophies generated.` : "No awards generated.",
    }));
    setLeagueAwardsLoadingId(null);
  };

  const generateSeasonOnlyAwards = async (league: LeagueSummary) => {
    if (!group) return;
    setSeasonAwardsLoadingId(league.id);
    setSeasonAwardsStatus((prev) => ({ ...prev, [league.id]: "Computing season statistics..." }));

    // Get all rounds for this league
    const leagueRounds = rounds.filter((r) => r.league_id === league.id);
    if (leagueRounds.length === 0) {
      setSeasonAwardsStatus((prev) => ({ ...prev, [league.id]: "No rounds found." }));
      setSeasonAwardsLoadingId(null);
      return;
    }

    // Fetch all submissions and votes for the season
    const roundIds = leagueRounds.map((r) => r.id);
    const { data: submissions } = await supabase
      .from("submissions")
      .select("id,round_id,submitter_name,title,artist,genres,release_year")
      .in("round_id", roundIds);

    if (!submissions || submissions.length === 0) {
      setSeasonAwardsStatus((prev) => ({ ...prev, [league.id]: "No submissions found." }));
      setSeasonAwardsLoadingId(null);
      return;
    }

    const submissionIds = submissions.map((s) => s.id);
    const { data: votes } = await supabase
      .from("votes")
      .select("submission_id,voter_name,points,comment")
      .in("submission_id", submissionIds);

    // Compute player statistics
    const playerStats = new Map<string, {
      totalPoints: number;
      wins: number;
      podiums: number;
      roundsPlayed: number;
      genres: Set<string>;
      minYear: number;
      maxYear: number;
      pointsGiven: number;
      commentsGiven: number;
    }>();

    // Calculate points per submission
    const submissionPoints = new Map<string, number>();
    (votes ?? []).forEach((vote) => {
      const existing = submissionPoints.get(vote.submission_id) || 0;
      submissionPoints.set(vote.submission_id, existing + vote.points);
    });

    // Group submissions by round and calculate rankings
    const roundSubmissions = new Map<string, typeof submissions>();
    submissions.forEach((sub) => {
      const existing = roundSubmissions.get(sub.round_id) || [];
      existing.push(sub);
      roundSubmissions.set(sub.round_id, existing);
    });

    // Process each round
    roundSubmissions.forEach((subs) => {
      // Rank submissions by points
      const ranked = subs
        .map((s) => ({ ...s, points: submissionPoints.get(s.id) || 0 }))
        .sort((a, b) => b.points - a.points);

      ranked.forEach((sub, rank) => {
        const name = sub.submitter_name || "Unknown";
        const stats = playerStats.get(name) || {
          totalPoints: 0,
          wins: 0,
          podiums: 0,
          roundsPlayed: 0,
          genres: new Set<string>(),
          minYear: 9999,
          maxYear: 0,
          pointsGiven: 0,
          commentsGiven: 0,
        };

        stats.totalPoints += sub.points;
        stats.roundsPlayed += 1;
        if (rank === 0) stats.wins += 1;
        if (rank < 3) stats.podiums += 1;

        if (sub.genres) {
          sub.genres.split(",").forEach((g: string) => stats.genres.add(g.trim()));
        }
        if (sub.release_year) {
          stats.minYear = Math.min(stats.minYear, sub.release_year);
          stats.maxYear = Math.max(stats.maxYear, sub.release_year);
        }

        playerStats.set(name, stats);
      });
    });

    // Calculate voting statistics
    (votes ?? []).forEach((vote) => {
      const name = vote.voter_name || "Unknown";
      const stats = playerStats.get(name) || {
        totalPoints: 0,
        wins: 0,
        podiums: 0,
        roundsPlayed: 0,
        genres: new Set<string>(),
        minYear: 9999,
        maxYear: 0,
        pointsGiven: 0,
        commentsGiven: 0,
      };
      stats.pointsGiven += vote.points;
      if (vote.comment) stats.commentsGiven += 1;
      playerStats.set(name, stats);
    });

    // Convert to serializable format for the API
    const seasonData = {
      totalRounds: leagueRounds.length,
      totalSubmissions: submissions.length,
      totalVotes: (votes ?? []).length,
      players: Array.from(playerStats.entries()).map(([name, stats]) => ({
        name,
        totalPoints: stats.totalPoints,
        wins: stats.wins,
        podiums: stats.podiums,
        roundsPlayed: stats.roundsPlayed,
        uniqueGenres: stats.genres.size,
        yearSpread: stats.maxYear > 0 ? stats.maxYear - stats.minYear : 0,
        pointsGiven: stats.pointsGiven,
        commentsGiven: stats.commentsGiven,
      })),
    };

    setSeasonAwardsStatus((prev) => ({ ...prev, [league.id]: "Selecting season awards..." }));

    const { data, error } = await supabase.functions.invoke("openrouter-round-story", {
      body: {
        mode: "season_awards",
        season_data: seasonData,
        season_awards: awardsCatalog.season_awards,
        awards_model_key: settingsDraft?.awards_model_key ?? "OPENROUTER_MODEL",
      },
    });

    if (error || !data?.awards?.length) {
      setSeasonAwardsStatus((prev) => ({ ...prev, [league.id]: "No awards selected." }));
      setSeasonAwardsLoadingId(null);
      return;
    }

    setSeasonAwardsStatus((prev) => ({ ...prev, [league.id]: `Saving ${data.awards.length} season awards...` }));

    // Insert season awards (they're stored in round_awards but without a round_id, or we can use the first round)
    // For now, we'll associate them with the first round of the season
    const firstRound = leagueRounds[0];
    let savedCount = 0;

    for (const award of data.awards) {
      const catalogAward = awardsCatalog.season_awards?.find((a: { id: number }) => a.id === award.award_id);
      const { data: insertData, error: insertError } = await supabase.from("round_awards").insert({
        round_id: firstRound.id,
        award_id: award.award_id,
        award_name: award.award_name || catalogAward?.name,
        award_description: catalogAward?.description ?? null,
        winner_name: award.winner_name,
        visible: true,
      }).select("id").single();

      if (!insertError && insertData) {
        savedCount++;

        // Generate trophy if prompt exists
        if (catalogAward?.trophy_prompt) {
          setSeasonAwardsStatus((prev) => ({ ...prev, [league.id]: `Trophy ${savedCount}/${data.awards.length}...` }));

          const { data: trophyData } = await supabase.functions.invoke("openrouter-round-story", {
            body: {
              mode: "trophy",
              trophy_prompt: catalogAward.trophy_prompt,
              trophy_model_key: settingsDraft?.trophy_image_model_key ?? "OPENROUTER_TROPHY_MODEL",
            },
          });

          if (trophyData?.image_base64 || trophyData?.image_url) {
            let trophyUrl = trophyData.image_url;
            if (trophyData.image_base64) {
              const filePath = `trophy-images/${insertData.id}/${Date.now()}.png`;
              const upload = await uploadBase64Image("round-art", filePath, trophyData.image_base64);
              if (upload.publicUrl) trophyUrl = upload.publicUrl;
            }
            if (trophyUrl) {
              await supabase.from("round_awards").update({ trophy_url: trophyUrl }).eq("id", insertData.id);
            }
          }
        }
      }
    }

    setSeasonAwardsStatus((prev) => ({
      ...prev,
      [league.id]: savedCount > 0 ? `${savedCount} season awards saved.` : "Failed to save awards.",
    }));
    setSeasonAwardsLoadingId(null);
  };

  const generateSeasonNarrative = async (league: LeagueSummary) => {
    if (!group) return;
    setSeasonNarrativeLoadingId(league.id);
    setSeasonNarrativeStatus((prev) => ({ ...prev, [league.id]: "Gathering season data..." }));

    // Get all rounds for this league
    const leagueRounds = rounds.filter((r) => r.league_id === league.id);
    if (leagueRounds.length === 0) {
      setSeasonNarrativeStatus((prev) => ({ ...prev, [league.id]: "No rounds found." }));
      setSeasonNarrativeLoadingId(null);
      return;
    }

    // Fetch all submissions and votes for the season
    const roundIds = leagueRounds.map((r) => r.id);
    const { data: submissions } = await supabase
      .from("submissions")
      .select("id,round_id,submitter_name,title,artist,genres,release_year")
      .in("round_id", roundIds);

    if (!submissions || submissions.length === 0) {
      setSeasonNarrativeStatus((prev) => ({ ...prev, [league.id]: "No submissions found." }));
      setSeasonNarrativeLoadingId(null);
      return;
    }

    const submissionIds = submissions.map((s) => s.id);
    const { data: votes } = await supabase
      .from("votes")
      .select("submission_id,voter_name,points,comment")
      .in("submission_id", submissionIds);

    // Build season summary for narrative generation
    const roundSummaries = leagueRounds.map((round) => {
      const roundSubs = submissions.filter((s) => s.round_id === round.id);
      const roundSubIds = roundSubs.map((s) => s.id);
      const roundVotes = (votes ?? []).filter((v) => roundSubIds.includes(v.submission_id));

      // Find winner
      const subPoints = new Map<string, number>();
      roundVotes.forEach((v) => {
        subPoints.set(v.submission_id, (subPoints.get(v.submission_id) || 0) + v.points);
      });
      const topSub = roundSubs.reduce((best, s) => {
        const pts = subPoints.get(s.id) || 0;
        const bestPts = best ? (subPoints.get(best.id) || 0) : -1;
        return pts > bestPts ? s : best;
      }, null as typeof roundSubs[0] | null);

      return {
        theme: round.theme,
        winner: topSub ? { name: topSub.submitter_name, song: topSub.title, artist: topSub.artist } : null,
        submissionCount: roundSubs.length,
      };
    });

    // Compute player totals
    const playerPoints = new Map<string, number>();
    submissions.forEach((sub) => {
      const subVotes = (votes ?? []).filter((v) => v.submission_id === sub.id);
      const pts = subVotes.reduce((sum, v) => sum + v.points, 0);
      const name = sub.submitter_name || "Unknown";
      playerPoints.set(name, (playerPoints.get(name) || 0) + pts);
    });

    const seasonData = {
      leagueName: league.name,
      totalRounds: leagueRounds.length,
      totalSubmissions: submissions.length,
      rounds: roundSummaries,
      standings: Array.from(playerPoints.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, points]) => ({ name, points })),
    };

    setSeasonNarrativeStatus((prev) => ({ ...prev, [league.id]: "Generating narrative..." }));

    const { data, error } = await supabase.functions.invoke("openrouter-round-story", {
      body: {
        mode: "season_narrative",
        league_name: league.name,
        season_data: seasonData,
        text_model_key: settingsDraft?.round_summary_model_key ?? "OPENROUTER_MODEL",
      },
    });

    if (error || !data?.narrative) {
      setSeasonNarrativeStatus((prev) => ({ ...prev, [league.id]: "Failed to generate narrative." }));
      setSeasonNarrativeLoadingId(null);
      return;
    }

    // Save narrative to leagues table
    const { error: updateError } = await supabase
      .from("leagues")
      .update({ narrative: data.narrative })
      .eq("id", league.id);

    if (updateError) {
      setSeasonNarrativeStatus((prev) => ({ ...prev, [league.id]: "Failed to save narrative." }));
    } else {
      setLeagues((prev) =>
        prev.map((l) => (l.id === league.id ? { ...l, narrative: data.narrative } : l))
      );
      setSeasonNarrativeStatus((prev) => ({ ...prev, [league.id]: "Narrative saved!" }));
    }

    setSeasonNarrativeLoadingId(null);
  };

  const updateLeague = async () => {
    if (!editingLeagueId || !editingLeagueName.trim()) return;
    const seasonNumber = editingLeagueSeason ? Number(editingLeagueSeason) : null;
    if (!seasonNumber || Number.isNaN(seasonNumber)) {
      setLeagueError("Season number is required.");
      return;
    }
    if (leagues.some((league) => league.id !== editingLeagueId && league.season_number === seasonNumber)) {
      setLeagueError("Season number must be unique for this group.");
      return;
    }
    const { error } = await supabase
      .from("leagues")
      .update({ name: editingLeagueName.trim(), season_number: seasonNumber })
      .eq("id", editingLeagueId);
    if (error) return;
    setLeagues((prev) =>
      prev.map((league) =>
        league.id === editingLeagueId
          ? { ...league, name: editingLeagueName.trim(), season_number: seasonNumber }
          : league
      )
    );
    setEditingLeagueId(null);
    setEditingLeagueName("");
    setEditingLeagueSeason("");
    setLeagueError(null);
  };

  const startEditRound = (round: RoundSummary) => {
    setEditingRoundId(round.id);
    setEditingRound({
      theme: round.theme,
      theme_description: round.theme_description ?? "",
      theme_author: round.theme_author ?? "",
      season_number: round.season_number ? String(round.season_number) : "",
      round_number: round.round_number ? String(round.round_number) : "",
      playlist_url: round.playlist_url ?? "",
      status: round.status,
      submission_deadline: round.submission_deadline ? round.submission_deadline.slice(0, 16) : "",
      voting_deadline: round.voting_deadline ? round.voting_deadline.slice(0, 16) : "",
    });
  };

  const saveRoundEdit = async () => {
    if (!editingRoundId || !editingRound) return;
    const { error } = await supabase
      .from("rounds")
      .update({
        theme: editingRound.theme.trim(),
        theme_description: editingRound.theme_description.trim() || null,
        theme_author: editingRound.theme_author.trim() || null,
        season_number: editingRound.season_number ? Number(editingRound.season_number) : null,
        round_number: editingRound.round_number ? Number(editingRound.round_number) : null,
        playlist_url: editingRound.playlist_url.trim() || null,
        status: editingRound.status,
        submission_deadline: editingRound.submission_deadline || null,
        voting_deadline: editingRound.voting_deadline || null,
      })
      .eq("id", editingRoundId);
    if (error) return;
    setRounds((prev) =>
      prev.map((round) =>
        round.id === editingRoundId
          ? {
              ...round,
              theme: editingRound.theme.trim(),
              theme_description: editingRound.theme_description.trim() || null,
              theme_author: editingRound.theme_author.trim() || null,
              season_number: editingRound.season_number ? Number(editingRound.season_number) : null,
              round_number: editingRound.round_number ? Number(editingRound.round_number) : null,
              playlist_url: editingRound.playlist_url.trim() || null,
              status: editingRound.status,
              submission_deadline: editingRound.submission_deadline || null,
              voting_deadline: editingRound.voting_deadline || null,
            }
          : round
      )
    );
    setEditingRoundId(null);
    setEditingRound(null);
  };

  const revokeInvite = async (inviteId: string) => {
    const { error } = await supabase.from("invites").delete().eq("id", inviteId);
    if (error) return;
    setInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
  };

  const deleteRound = async (roundId: string) => {
    const confirmDelete = window.confirm("Delete this round and all submissions/votes?");
    if (!confirmDelete) return;
    const { error } = await supabase.from("rounds").delete().eq("id", roundId);
    if (error) return;
    setRounds((prev) => prev.filter((round) => round.id !== roundId));
  };

  const linkCompetitor = async (competitorId: string, userId: string | null) => {
    if (!group) return;
    if (userId) {
      await supabase.from("season_competitors").update({ profile_id: null }).eq("profile_id", userId);
      await supabase.from("season_competitors").update({ profile_id: userId }).eq("id", competitorId);
    } else {
      await supabase.from("season_competitors").update({ profile_id: null }).eq("id", competitorId);
    }
    const { data } = await supabase
      .from("season_competitors")
      .select("id,name,profile_id,external_id")
      .eq("group_id", group.id)
      .order("name");
    setSeasonCompetitors((data as SeasonCompetitor[]) ?? []);
  };

  const deleteCompetitor = async (competitorId: string) => {
    if (!group) return;
    const { error } = await supabase.from("season_competitors").delete().eq("id", competitorId);
    if (error) return;
    setSeasonCompetitors((prev) => prev.filter((c) => c.id !== competitorId));
  };

  const linkUserToCompetitor = async (userId: string, competitorId: string | null) => {
    if (!group) return;
    await supabase.from("season_competitors").update({ profile_id: null }).eq("profile_id", userId);
    if (competitorId) {
      await supabase.from("season_competitors").update({ profile_id: userId }).eq("id", competitorId);
    }
    const { data } = await supabase
      .from("season_competitors")
      .select("id,name,profile_id,external_id")
      .eq("group_id", group.id)
      .order("name");
    setSeasonCompetitors((data as SeasonCompetitor[]) ?? []);
  };

  const linkImportedRound = async (importId: string, roundId: string) => {
    const importRow = roundImports.find((row) => row.id === importId);
    if (!importRow) return;
    await supabase.from("round_imports").update({ round_id: roundId }).eq("id", importId);
    await supabase
      .from("rounds")
      .update({
        external_round_id: importRow.external_round_id,
        playlist_url: importRow.playlist_url,
      })
      .eq("id", roundId);
    if (group?.id) {
      fetchRoundImports(group.id);
    }
  };

  const createRoundsFromImports = async () => {
    if (!selectedLeagueId || !group) return;
    const league = leagues.find((row) => row.id === selectedLeagueId);
    const unmatched = roundImports.filter((row) => !row.round_id);
    if (!unmatched.length) return;
    const { data: existingRounds } = await supabase
      .from("rounds")
      .select("round_number")
      .eq("league_id", selectedLeagueId);
    const maxRoundNumber = Math.max(0, ...(existingRounds ?? []).map((row) => row.round_number ?? 0));
    let nextRound = maxRoundNumber + 1;
    for (const row of unmatched) {
      const { data: inserted, error } = await supabase
        .from("rounds")
        .insert({
          league_id: selectedLeagueId,
          theme: row.name,
          theme_description: row.description,
          external_round_id: row.external_round_id,
          external_created_at: row.external_created_at,
          external_playlist_url: row.playlist_url,
          playlist_url: row.playlist_url,
          season_number: league?.season_number ?? null,
          round_number: nextRound,
          status: "archived",
        })
        .select("id")
        .maybeSingle();
      if (!error && inserted?.id) {
        await supabase.from("round_imports").update({ round_id: inserted.id }).eq("id", row.id);
        nextRound += 1;
      }
    }
    if (group?.id) {
      fetchRoundImports(group.id);
    }
  };

  const copyMetadataCommand = async () => {
    const cmd = [
      'SEARXNG_URL="http://192.168.6.11:8888" \\',
      'SEARXNG_ENGINES="bandcamp,deezer,soundcloud,youtube,genius" \\',
      'SEARXNG_DELAY=1.0 \\',
      'SEARXNG_TIMEOUT=12 \\',
      "python scripts/build_track_metadata.py",
    ].join("\n");
    await navigator.clipboard.writeText(cmd);
  };

  if (!isLead) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Admin</h1>
          <p className="muted">Only admins can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Admin</h1>
        <p>Manage invites, rounds, and season data.</p>
      </div>

      <div className="admin-tabs">
        {([
          { id: "users", label: "Users" },
          { id: "invites", label: "Invites" },
          { id: "leagues", label: "Leagues" },
          { id: "rounds", label: "Rounds" },
          { id: "competitors", label: "Current competitors" },
          { id: "imports", label: "Imports" },
          { id: "ai-settings", label: "AI settings" },
          { id: "bonus", label: "Bonus Points" },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`admin-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "users" ? (
        <Card className="dashboard-card">
          <h2>Users</h2>
          <p className="muted">Notification controls, roles, and competitor links.</p>
          <div className="admin-users scroll-panel">
            {users.map((user) => {
              const userId = user.profiles?.id ?? "";
              const linkedCompetitor = seasonCompetitors.find((row) => row.profile_id === userId);
              const isOwner = Boolean(group?.owner_id && userId === group.owner_id);
              const isSelf = Boolean(profile?.id && userId === profile.id);
              const connections = connectionsBySource.get(userId) ?? [];
              const draft = getConnectionDraft(userId);
              return (
                <div key={user.member_id} className="admin-user-row">
                  <div>
                    <strong>{user.profiles?.display_name ?? "Member"}</strong>
                    <span className="muted">{user.profiles?.email ?? "No email"}</span>
                    <span className="muted">{user.role === "lead" ? "Admin" : "Member"}</span>
                  </div>
                  <div className="admin-user-actions">
                    <label className="field">
                      <span className="field-label">Current season competitor</span>
                      <select
                        className="field-input"
                        value={linkedCompetitor?.id ?? ""}
                        onChange={(event) =>
                          linkUserToCompetitor(userId, event.target.value ? event.target.value : null)
                        }
                      >
                        <option value="">Not linked</option>
                        {seasonCompetitors.map((competitor) => (
                          <option key={competitor.id} value={competitor.id}>
                            {competitor.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="admin-connections">
                      <span className="field-label">Player connections (max 5)</span>
                      {connections.length ? (
                        <div className="connection-list">
                          {connections.map((connection) => {
                            const target = usersById.get(connection.target_profile_id);
                            return (
                              <div key={connection.id} className="connection-row">
                                <span>
                                  {target?.display_name ?? target?.email ?? "Member"} · {connection.relation_type}
                                </span>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() => removeConnection(connection.id)}
                                >
                                  Remove
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="muted">No connections yet.</span>
                      )}
                      <div className="connection-controls">
                        <select
                          className="field-input"
                          value={draft.targetId}
                          onChange={(event) => updateConnectionDraft(userId, { targetId: event.target.value })}
                        >
                          <option value="">Select player</option>
                          {users
                            .filter((row) => row.profiles?.id && row.profiles.id !== userId)
                            .map((row) => (
                              <option key={row.profiles?.id} value={row.profiles?.id}>
                                {row.profiles?.display_name ?? row.profiles?.email ?? "Member"}
                              </option>
                            ))}
                        </select>
                        <select
                          className="field-input"
                          value={draft.relation}
                          onChange={(event) => updateConnectionDraft(userId, { relation: event.target.value })}
                        >
                          <option value="">Relation type</option>
                          {RELATIONSHIP_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => addConnection(userId)}
                          disabled={connections.length >= 5}
                        >
                          Add connection
                        </Button>
                      </div>
                    </div>
                    <div className="admin-user-toggles">
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={user.profiles?.chat_notify_enabled ?? false}
                          onChange={(event) =>
                            updateUser(user.profiles?.id ?? "", { chat_notify_enabled: event.target.checked })
                          }
                        />
                        <span>Chat notify</span>
                      </label>
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={user.profiles?.email_notify_enabled ?? false}
                          onChange={(event) =>
                            updateUser(user.profiles?.id ?? "", { email_notify_enabled: event.target.checked })
                          }
                        />
                        <span>Email notify</span>
                      </label>
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={user.profiles?.can_toggle_chat_notify ?? true}
                          onChange={(event) =>
                            updateUser(user.profiles?.id ?? "", { can_toggle_chat_notify: event.target.checked })
                          }
                        />
                        <span>Allow chat toggle</span>
                      </label>
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={user.profiles?.can_toggle_email_notify ?? true}
                          onChange={(event) =>
                            updateUser(user.profiles?.id ?? "", { can_toggle_email_notify: event.target.checked })
                          }
                        />
                        <span>Allow email toggle</span>
                      </label>
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={user.profiles?.reaction_notify_enabled ?? true}
                          onChange={(event) =>
                            updateUser(user.profiles?.id ?? "", { reaction_notify_enabled: event.target.checked })
                          }
                        />
                        <span>Reaction notify</span>
                      </label>
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={user.profiles?.can_toggle_reaction_notify ?? true}
                          onChange={(event) =>
                            updateUser(user.profiles?.id ?? "", { can_toggle_reaction_notify: event.target.checked })
                          }
                        />
                        <span>Allow reaction toggle</span>
                      </label>
                    </div>
                  </div>
                  <div className="admin-user-cta">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => removeUser(user.member_id)}
                      disabled={isOwner || isSelf}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {activeTab === "invites" ? (
        <Card className="dashboard-card">
          <h2>Invites</h2>
          <p className="muted">Share links with family, then track outstanding invites.</p>
          <Button type="button" variant="secondary" onClick={handleGenerateInvite}>
            Generate Invite
          </Button>
          {inviteLink ? <div className="invite-link">{inviteLink}</div> : null}
          {inviteError ? <div className="auth-error">{inviteError}</div> : null}
          <div className="invite-list">
            {invites.length ? (
              invites.map((invite) => {
                const baseUrl = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin;
                const link = `${baseUrl}/invite?code=${invite.code}`;
                return (
                  <div key={invite.id} className="invite-row">
                    <div>
                      <strong>{invite.code}</strong>
                      <span className="muted">Created {new Date(invite.created_at).toLocaleString()}</span>
                    </div>
                    <div className="invite-actions">
                      <Button type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(link)}>
                        Copy
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => revokeInvite(invite.id)}>
                        Revoke
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="muted">No outstanding invites.</p>
            )}
          </div>
        </Card>
      ) : null}

      {activeTab === "leagues" ? (
        <Card className="dashboard-card">
          <h2>Leagues</h2>
          <p className="muted">Keep league names tidy and easy to find.</p>
          <div className="admin-form">
            <input
              className="field-input"
              placeholder="League name"
              value={leagueName}
              onChange={(event) => setLeagueName(event.target.value)}
            />
            <input
              className="field-input"
              placeholder="Season #"
              value={leagueSeasonNumber}
              onChange={(event) => setLeagueSeasonNumber(event.target.value)}
            />
            <Button type="button" onClick={handleCreateLeague} disabled={!leagueName.trim()}>
              Create League
            </Button>
            {leagueError ? <div className="auth-error">{leagueError}</div> : null}
          </div>
          <div className="admin-list">
            {leagues.length ? (
              leagues.map((league) => (
                <div key={league.id} className="admin-list-row">
                  {editingLeagueId === league.id ? (
                    <>
                      <input
                        className="field-input"
                        value={editingLeagueName}
                        onChange={(event) => setEditingLeagueName(event.target.value)}
                      />
                      <input
                        className="field-input"
                        value={editingLeagueSeason}
                        onChange={(event) => setEditingLeagueSeason(event.target.value)}
                        placeholder="Season #"
                      />
                      <div className="admin-row-actions">
                        <Button type="button" onClick={updateLeague} disabled={!editingLeagueName.trim()}>
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setEditingLeagueId(null);
                            setEditingLeagueName("");
                            setEditingLeagueSeason("");
                            setLeagueError(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <strong>{league.name}</strong>
                        <span className="muted">Season {league.season_number ?? "—"}</span>
                        <span className="muted">Created {new Date(league.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="admin-row-actions">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setEditingLeagueId(league.id);
                            setEditingLeagueName(league.name);
                            setEditingLeagueSeason(String(league.season_number ?? ""));
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className={(() => {
                            const leagueRounds = rounds.filter((r) => r.league_id === league.id);
                            const allHaveAwards = leagueRounds.length > 0 && leagueRounds.every((r) => (roundAwardCounts[r.id] ?? 0) > 0);
                            return allHaveAwards ? "button-has-content" : "button-no-content";
                          })()}
                          onClick={() => generateLeagueAwards(league)}
                          disabled={leagueAwardsLoadingId === league.id}
                        >
                          {leagueAwardsLoadingId === league.id ? "Generating..." : "Round Awards"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className={(seasonAwardCounts[league.id] ?? 0) > 0 ? "button-has-content" : "button-no-content"}
                          onClick={() => generateSeasonOnlyAwards(league)}
                          disabled={seasonAwardsLoadingId === league.id}
                        >
                          {seasonAwardsLoadingId === league.id ? "Generating..." : "Season Awards"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className={league.narrative ? "button-has-content" : "button-no-content"}
                          onClick={() => generateSeasonNarrative(league)}
                          disabled={seasonNarrativeLoadingId === league.id}
                        >
                          {seasonNarrativeLoadingId === league.id ? "Generating..." : "Season Narrative"}
                        </Button>
                      </div>
                      {leagueAwardsStatus[league.id] ? (
                        <span className="muted">{leagueAwardsStatus[league.id]}</span>
                      ) : null}
                      {seasonAwardsStatus[league.id] ? (
                        <span className="muted">{seasonAwardsStatus[league.id]}</span>
                      ) : null}
                      {seasonNarrativeStatus[league.id] ? (
                        <span className="muted">{seasonNarrativeStatus[league.id]}</span>
                      ) : null}
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="muted">No leagues yet. Add one to start tracking rounds.</p>
            )}
          </div>
        </Card>
      ) : null}

      {activeTab === "rounds" ? (
        <Card className="dashboard-card">
          <h2>Rounds</h2>
          <p className="muted">Create and edit rounds without jumping back to the dashboard.</p>
          <div className="admin-form">
            <label className="field">
              <span className="field-label">League</span>
              <select
                className="field-input"
                value={selectedLeagueId ?? ""}
                onChange={(event) => setSelectedLeagueId(event.target.value || null)}
              >
                <option value="">Select league</option>
                {leagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name}
                  </option>
                ))}
              </select>
            </label>
            <input
              className="field-input"
              placeholder="Theme name"
              value={roundTheme}
              onChange={(event) => setRoundTheme(event.target.value)}
            />
            <div className="admin-row-meta">
              <input
                className="field-input"
                placeholder="Season #"
                value={roundSeasonNumber}
                onChange={(event) => setRoundSeasonNumber(event.target.value)}
              />
              <input
                className="field-input"
                placeholder="Round #"
                value={roundNumber}
                onChange={(event) => setRoundNumber(event.target.value)}
              />
            </div>
            <input
              className="field-input"
              placeholder="Theme author"
              value={roundAuthor}
              onChange={(event) => setRoundAuthor(event.target.value)}
            />
            <input
              className="field-input"
              placeholder="Playlist URL (Spotify or YouTube)"
              value={roundPlaylistUrl}
              onChange={(event) => setRoundPlaylistUrl(event.target.value)}
            />
            <textarea
              className="field-input"
              placeholder="Theme description"
              value={roundDescription}
              onChange={(event) => setRoundDescription(event.target.value)}
              rows={3}
            />
            <label className="field">
              <span className="field-label">Submission deadline</span>
              <input
                className="field-input"
                type="datetime-local"
                value={submissionDeadline}
                onChange={(event) => setSubmissionDeadline(event.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Voting deadline</span>
              <input
                className="field-input"
                type="datetime-local"
                value={votingDeadline}
                onChange={(event) => setVotingDeadline(event.target.value)}
              />
            </label>
            <Button type="button" onClick={handleCreateRound} disabled={!roundTheme.trim() || !selectedLeagueId}>
              Create Round
            </Button>
          </div>
          <div className="admin-list">
            {rounds.length ? (
              rounds.map((round) => {
                const leagueName = leagues.find((league) => league.id === round.league_id)?.name ?? "League";
                const isEditing = editingRoundId === round.id;
                return (
                  <div key={round.id} className="admin-list-row">
                    {isEditing && editingRound ? (
                      <div className="round-edit-grid">
                        <input
                          className="field-input"
                          value={editingRound.theme}
                          onChange={(event) =>
                            setEditingRound((prev) => (prev ? { ...prev, theme: event.target.value } : prev))
                          }
                        />
                        <div className="admin-row-meta">
                          <input
                            className="field-input"
                            value={editingRound.season_number}
                            onChange={(event) =>
                              setEditingRound((prev) =>
                                prev ? { ...prev, season_number: event.target.value } : prev
                              )
                            }
                            placeholder="Season #"
                          />
                          <input
                            className="field-input"
                            value={editingRound.round_number}
                            onChange={(event) =>
                              setEditingRound((prev) => (prev ? { ...prev, round_number: event.target.value } : prev))
                            }
                            placeholder="Round #"
                          />
                        </div>
                        <input
                          className="field-input"
                          value={editingRound.theme_author}
                          onChange={(event) =>
                            setEditingRound((prev) =>
                              prev ? { ...prev, theme_author: event.target.value } : prev
                            )
                          }
                        />
                        <textarea
                          className="field-input"
                          value={editingRound.theme_description}
                          onChange={(event) =>
                            setEditingRound((prev) =>
                              prev ? { ...prev, theme_description: event.target.value } : prev
                            )
                          }
                          rows={3}
                        />
                        <input
                          className="field-input"
                          value={editingRound.playlist_url}
                          onChange={(event) =>
                            setEditingRound((prev) =>
                              prev ? { ...prev, playlist_url: event.target.value } : prev
                            )
                          }
                          placeholder="Playlist URL"
                        />
                        <select
                          className="field-input"
                          value={editingRound.status}
                          onChange={(event) =>
                            setEditingRound((prev) =>
                              prev ? { ...prev, status: event.target.value as RoundSummary["status"] } : prev
                            )
                          }
                        >
                          <option value="open">Open</option>
                          <option value="voting">Voting</option>
                          <option value="revealed">Revealed</option>
                          <option value="archived">Archived</option>
                        </select>
                        <input
                          className="field-input"
                          type="datetime-local"
                          value={editingRound.submission_deadline}
                          onChange={(event) =>
                            setEditingRound((prev) =>
                              prev ? { ...prev, submission_deadline: event.target.value } : prev
                            )
                          }
                        />
                        <input
                          className="field-input"
                          type="datetime-local"
                          value={editingRound.voting_deadline}
                          onChange={(event) =>
                            setEditingRound((prev) =>
                              prev ? { ...prev, voting_deadline: event.target.value } : prev
                            )
                          }
                        />
                        <div className="admin-row-actions">
                          <Button type="button" onClick={saveRoundEdit} disabled={!editingRound.theme.trim()}>
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setEditingRoundId(null);
                              setEditingRound(null);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <strong>{round.theme}</strong>
                          <span className="muted">{leagueName}</span>
                          {round.theme_author ? <span className="muted">Theme by {round.theme_author}</span> : null}
                          {round.season_number || round.round_number ? (
                            <span className="muted">
                              Season {round.season_number ?? "—"} · Round {round.round_number ?? "—"}
                            </span>
                          ) : null}
                          <span className="muted">Status: {round.status}</span>
                        </div>
                        <div className="admin-row-meta">
                          <span className="muted">Submissions: {round.submission_deadline ?? "—"}</span>
                          <span className="muted">Voting: {round.voting_deadline ?? "—"}</span>
                        </div>
                        <div className="admin-row-actions">
                          <Button type="button" variant="secondary" onClick={() => startEditRound(round)}>
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className={round.theme_image_url ? "button-has-content" : "button-no-content"}
                            onClick={() => generateThemeBanner(round)}
                            disabled={bannerLoadingId === round.id}
                          >
                            {bannerLoadingId === round.id ? "Generating..." : "Banner"}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className={round.narrative ? "button-has-content" : "button-no-content"}
                            onClick={() => generateRoundStory(round)}
                            disabled={storyLoadingId === round.id}
                          >
                            {storyLoadingId === round.id ? "Generating..." : "Story"}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className={(roundAwardCounts[round.id] ?? 0) > 0 ? "button-has-content" : "button-no-content"}
                            onClick={() => generateRoundAwards(round)}
                            disabled={awardsLoadingId === round.id}
                          >
                            {awardsLoadingId === round.id ? "Generating..." : "Awards"}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className={roundChallengeExists[round.id] ? "button-has-content" : "button-no-content"}
                            onClick={() => generateRoundChallenge(round)}
                            disabled={challengeGenLoadingId === round.id}
                          >
                            {challengeGenLoadingId === round.id ? "Generating..." : "Challenge"}
                          </Button>
                          <Button type="button" variant="secondary" onClick={() => deleteRound(round.id)}>
                            Delete
                          </Button>
                        </div>
                        {bannerStatusByRound[round.id] ? (
                          <span className="muted">{bannerStatusByRound[round.id]}</span>
                        ) : null}
                        {storyStatusByRound[round.id] ? (
                          <span className="muted">{storyStatusByRound[round.id]}</span>
                        ) : null}
                        {awardsStatusByRound[round.id] ? (
                          <span className="muted">{awardsStatusByRound[round.id]}</span>
                        ) : null}
                        {challengeStatusByRound[round.id] ? (
                          <span className="muted">{challengeStatusByRound[round.id]}</span>
                        ) : null}
                      </>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="muted">No rounds yet.</p>
            )}
          </div>
        </Card>
      ) : null}

      {activeTab === "competitors" ? (
        <Card className="dashboard-card">
          <h2>Current Competitors</h2>
          <p className="muted">Link each competitor to a Talking Music League user.</p>
          <div className="competitor-list">
            {seasonCompetitors.map((competitor, index) => {
              const linkedProfile = competitor.profile_id ? usersById.get(competitor.profile_id) : null;
              const styleClass = competitor.profile_id
                ? "linked"
                : index % 2 === 0
                  ? "pastel-yellow"
                  : "pastel-purple";
              return (
                <div key={competitor.id} className={`competitor-pill ${styleClass}`}>
                  <div className="competitor-pill-header">
                    <div>
                      <strong>{competitor.name}</strong>
                      <span className="muted">
                        {linkedProfile?.display_name ? `Linked to ${linkedProfile.display_name}` : "Unlinked"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="competitor-delete-btn"
                      onClick={() => deleteCompetitor(competitor.id)}
                    >
                      Delete
                    </button>
                  </div>
                  <select
                    className="field-input"
                    value={competitor.profile_id ?? ""}
                    onChange={(event) =>
                      linkCompetitor(competitor.id, event.target.value ? event.target.value : null)
                    }
                  >
                    <option value="">Link to user</option>
                    {users.map((user) =>
                      user.profiles?.id ? (
                        <option key={user.profiles.id} value={user.profiles.id}>
                          {user.profiles.display_name ?? user.profiles.email ?? "Member"}
                        </option>
                      ) : null
                    )}
                  </select>
                  <label className="field">
                    <span className="field-label">AI image traits</span>
                    <textarea
                      className="field-input"
                      rows={3}
                      placeholder='{"Age":"27","Gender":"NB","Hair style with color":"cropped blonde","Personality trait":"Overconfident","Hobby or Job":"Accountant"}'
                      value={getCompetitorTraitsDraft(competitor.id, competitor.ai_image_traits)}
                      onChange={(event) =>
                        setCompetitorTraitsDrafts((prev) => ({
                          ...prev,
                          [competitor.id]: event.target.value,
                        }))
                      }
                    />
                    <span className="field-helper">
                      Use double quotes around keys and values; keep numbers in quotes for consistency.
                    </span>
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      updateCompetitorTraits(
                        competitor.id,
                        getCompetitorTraitsDraft(competitor.id, competitor.ai_image_traits).trim()
                      )
                    }
                  >
                    Save traits
                  </Button>
                </div>
              );
            })}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleImportSeasonOneCompetitors}
            disabled={importingCompetitors}
          >
            {importingCompetitors ? "Importing..." : "Import historical competitors"}
          </Button>
          <div className="competitor-form">
            <input
              className="field-input"
              placeholder="Add competitor name"
              value={newCompetitor}
              onChange={(event) => setNewCompetitor(event.target.value)}
            />
            <Button type="button" variant="secondary" onClick={handleAddCompetitor} disabled={!newCompetitor.trim()}>
              Add competitor
            </Button>
          </div>
        </Card>
      ) : null}

      {activeTab === "imports" ? (
        <div className="history-dashboard">
          <SeasonImport
            leagueId={selectedLeagueId}
            groupId={group?.id ?? null}
            onImportComplete={() => {
              if (group?.id) {
                fetchCompetitors(group.id);
                fetchRoundImports(group.id, selectedLeagueId);
              }
            }}
          />
          <Card className="dashboard-card">
            <h2>Active import target</h2>
            <p className="muted">Uploads will be attached to the selected league (season).</p>
            <select
              className="field-input"
              value={selectedLeagueId ?? ""}
              onChange={(event) => setSelectedLeagueId(event.target.value || null)}
            >
              <option value="">Select league</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  Season {league.season_number ?? "—"} · {league.name}
                </option>
              ))}
            </select>
            {selectedLeagueId ? (
              <span className="muted">
                Importing into Season {leagues.find((league) => league.id === selectedLeagueId)?.season_number ?? "—"}
              </span>
            ) : null}
          </Card>
          <Card className="dashboard-card">
            <h2>Release year mix</h2>
            <p className="muted">Run the metadata builder to refresh years + genres for history visuals.</p>
            <pre className="code-block">
{`SEARXNG_URL="http://192.168.6.11:8888" \\
SEARXNG_ENGINES="bandcamp,deezer,soundcloud,youtube,genius" \\
SEARXNG_DELAY=1.0 \\
SEARXNG_TIMEOUT=12 \\
python scripts/build_track_metadata.py`}
            </pre>
            <Button type="button" variant="secondary" onClick={copyMetadataCommand}>
              Copy command
            </Button>
          </Card>
          <Card className="dashboard-card">
            <h2>Round sync</h2>
            <p className="muted">
              Match uploaded rounds to your app rounds. Unmatched uploads stay here until linked.
            </p>
            <div className="admin-list">
              {roundImports.length ? (
                roundImports.map((row) => (
                  <div key={row.id} className="admin-list-row">
                    <div>
                      <strong>{row.name}</strong>
                      <span className="muted">External ID: {row.external_round_id}</span>
                      {row.external_created_at ? (
                        <span className="muted">
                          {new Date(row.external_created_at).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                    <div className="admin-row-meta">
                      <select
                        className="field-input"
                        value={row.round_id ?? ""}
                        onChange={(event) => linkImportedRound(row.id, event.target.value)}
                      >
                        <option value="">Unlinked</option>
                        {rounds.map((round) => (
                          <option key={round.id} value={round.id}>
                            {round.theme}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-row-actions">
                      <span className="pill">{row.round_id ? "Linked" : "Unlinked"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">No uploaded rounds yet.</p>
              )}
            </div>
            <Button type="button" variant="secondary" onClick={createRoundsFromImports} disabled={!roundImports.length}>
              Create rounds from unmatched
            </Button>
          </Card>
        </div>
      ) : null}

      {activeTab === "ai-settings" ? (
        <Card className="dashboard-card">
          <h2>AI Settings</h2>
          <p className="muted">Configure AI features and model settings.</p>

          {/* AI Assistant Feature Toggles */}
          <div className="admin-form" style={{ marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem" }}>Peek Panel AI Features</h3>
            <p className="muted" style={{ fontSize: "0.85rem", marginBottom: 12 }}>
              Control which AI features are available in the peek panel. The AI provides suggestions only - theme creators have the final say on rules.
            </p>

            <label className="field" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="checkbox"
                checked={settingsDraft?.ai_assistant_enabled ?? true}
                onChange={(e) =>
                  setSettingsDraft((prev) =>
                    prev ? { ...prev, ai_assistant_enabled: e.target.checked } : prev
                  )
                }
                style={{ width: 18, height: 18 }}
              />
              <div>
                <span className="field-label" style={{ margin: 0 }}>AI Assistant (master toggle)</span>
                <span className="field-helper" style={{ display: "block", marginTop: 2 }}>
                  Disable to hide all AI features in the peek panel
                </span>
              </div>
            </label>

            <label className="field" style={{ display: "flex", alignItems: "center", gap: 12, opacity: settingsDraft?.ai_assistant_enabled ? 1 : 0.5 }}>
              <input
                type="checkbox"
                checked={settingsDraft?.ai_explain_enabled ?? true}
                onChange={(e) =>
                  setSettingsDraft((prev) =>
                    prev ? { ...prev, ai_explain_enabled: e.target.checked } : prev
                  )
                }
                disabled={!settingsDraft?.ai_assistant_enabled}
                style={{ width: 18, height: 18 }}
              />
              <div>
                <span className="field-label" style={{ margin: 0 }}>Explain Theme</span>
                <span className="field-helper" style={{ display: "block", marginTop: 2 }}>
                  AI shares thoughts on the theme (generated once per round, shared by all)
                </span>
              </div>
            </label>

            <label className="field" style={{ display: "flex", alignItems: "center", gap: 12, opacity: settingsDraft?.ai_assistant_enabled ? 1 : 0.5 }}>
              <input
                type="checkbox"
                checked={settingsDraft?.ai_hint_enabled ?? true}
                onChange={(e) =>
                  setSettingsDraft((prev) =>
                    prev ? { ...prev, ai_hint_enabled: e.target.checked } : prev
                  )
                }
                disabled={!settingsDraft?.ai_assistant_enabled}
                style={{ width: 18, height: 18 }}
              />
              <div>
                <span className="field-label" style={{ margin: 0 }}>Get Hint</span>
                <span className="field-helper" style={{ display: "block", marginTop: 2 }}>
                  AI provides song-finding hints (generated once per round, shared by all)
                </span>
              </div>
            </label>

            <label className="field" style={{ display: "flex", alignItems: "center", gap: 12, opacity: settingsDraft?.ai_assistant_enabled ? 1 : 0.5 }}>
              <input
                type="checkbox"
                checked={settingsDraft?.ai_validate_enabled ?? true}
                onChange={(e) =>
                  setSettingsDraft((prev) =>
                    prev ? { ...prev, ai_validate_enabled: e.target.checked } : prev
                  )
                }
                disabled={!settingsDraft?.ai_assistant_enabled}
                style={{ width: 18, height: 18 }}
              />
              <div>
                <span className="field-label" style={{ margin: 0 }}>Check Song</span>
                <span className="field-helper" style={{ display: "block", marginTop: 2 }}>
                  AI gives opinion on whether a song might fit the theme
                </span>
              </div>
            </label>

            <label className="field" style={{ marginLeft: 30, opacity: (settingsDraft?.ai_assistant_enabled && settingsDraft?.ai_validate_enabled) ? 1 : 0.5 }}>
              <span className="field-label">Daily Check Limit (per user)</span>
              <input
                type="number"
                className="field-input"
                min="1"
                max="50"
                value={settingsDraft?.ai_validate_daily_limit ?? 5}
                onChange={(e) =>
                  setSettingsDraft((prev) =>
                    prev ? { ...prev, ai_validate_daily_limit: parseInt(e.target.value) || 5 } : prev
                  )
                }
                disabled={!settingsDraft?.ai_assistant_enabled || !settingsDraft?.ai_validate_enabled}
                style={{ width: 80 }}
              />
              <span className="field-helper">
                Limit how many songs each user can check per day (prevents API overuse)
              </span>
            </label>

            <label className="field" style={{ display: "flex", alignItems: "center", gap: 12, opacity: settingsDraft?.ai_assistant_enabled ? 1 : 0.5 }}>
              <input
                type="checkbox"
                checked={settingsDraft?.ai_chat_enabled ?? true}
                onChange={(e) =>
                  setSettingsDraft((prev) =>
                    prev ? { ...prev, ai_chat_enabled: e.target.checked } : prev
                  )
                }
                disabled={!settingsDraft?.ai_assistant_enabled}
                style={{ width: 18, height: 18 }}
              />
              <div>
                <span className="field-label" style={{ margin: 0 }}>Chat @AI Replies</span>
                <span className="field-helper" style={{ display: "block", marginTop: 2 }}>
                  AI responds to @AI mentions in chat. When disabled, shows &quot;away&quot; message.
                </span>
              </div>
            </label>
          </div>

          <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem" }}>Model Settings</h3>
          <p className="muted" style={{ marginBottom: 12 }}>Choose which model variable to use for each AI call.</p>
          <div className="admin-form">
            <label className="field">
              <span className="field-label">Round summary (text)</span>
              <select
                className="field-input"
                value={settingsDraft?.round_summary_model_key ?? "OPENROUTER_MODEL"}
                onChange={(event) =>
                  setSettingsDraft((prev) =>
                    prev ? { ...prev, round_summary_model_key: event.target.value } : prev
                  )
                }
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label} {option.image ? "· image" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Round story art (winners)</span>
              <select
                className="field-input"
                value={settingsDraft?.round_story_image_model_key ?? "OPENROUTER_MID_MODEL"}
                onChange={(event) =>
                  setSettingsDraft((prev) =>
                    prev ? { ...prev, round_story_image_model_key: event.target.value } : prev
                  )
                }
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label} {option.image ? "· image" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Round theme banner</span>
              <select
                className="field-input"
                value={settingsDraft?.round_theme_image_model_key ?? "OPENROUTER_MID_MODEL"}
                onChange={(event) =>
                  setSettingsDraft((prev) =>
                    prev ? { ...prev, round_theme_image_model_key: event.target.value } : prev
                  )
                }
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label} {option.image ? "· image" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Awards selection</span>
              <select
                className="field-input"
                value={settingsDraft?.awards_model_key ?? "OPENROUTER_MODEL"}
                onChange={(event) =>
                  setSettingsDraft((prev) => (prev ? { ...prev, awards_model_key: event.target.value } : prev))
                }
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label} {option.image ? "· image" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Trophy generator (script)</span>
              <select
                className="field-input"
                value={settingsDraft?.trophy_image_model_key ?? "OPENROUTER_MID_MODEL"}
                onChange={(event) =>
                  setSettingsDraft((prev) =>
                    prev ? { ...prev, trophy_image_model_key: event.target.value } : prev
                  )
                }
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label} {option.image ? "· image" : ""}
                  </option>
                ))}
              </select>
              <span className="field-helper">This is for the local trophy script.</span>
            </label>
            <label className="field">
              <span className="field-label">Logo palette</span>
              <select
                className="field-input"
                value={settingsDraft?.logo_palette ?? "ocean-coral"}
                onChange={(event) =>
                  setSettingsDraft((prev) => (prev ? { ...prev, logo_palette: event.target.value } : prev))
                }
              >
                {LOGO_PALETTE_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="field-helper">Controls the top-bar logo colors.</span>
            </label>
            <Button type="button" variant="secondary" onClick={saveSettings} disabled={!settingsDraft}>
              Save AI settings
            </Button>
          </div>
        </Card>
      ) : null}

      {activeTab === "bonus" ? (
        <Card className="dashboard-card">
          <h2>Bonus Points</h2>
          <p className="muted">Award bonus points for Round Challenge correct guesses and other achievements.</p>

          {/* Award Form */}
          <div className="admin-form" style={{ marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem" }}>Award Points</h3>
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr auto auto auto" }}>
              <select
                className="field-input"
                value={bonusPointsDraft["new"]?.reason ?? ""}
                onChange={(e) =>
                  setBonusPointsDraft((prev) => ({
                    ...prev,
                    new: { ...prev.new, reason: e.target.value, points: prev.new?.points ?? "1" },
                  }))
                }
              >
                <option value="">Select player...</option>
                {users.map((u) => (
                  <option key={u.member_id} value={u.profiles?.display_name ?? ""}>
                    {u.profiles?.display_name ?? "Unknown"}
                  </option>
                ))}
              </select>
              <select
                className="field-input"
                value={bonusPointsDraft["new"]?.reason?.split(":")[0] ?? ""}
                onChange={(e) => {
                  const player = bonusPointsDraft["new"]?.reason?.split(":")[0] ?? "";
                  setBonusPointsDraft((prev) => ({
                    ...prev,
                    new: { ...prev.new, reason: `${player}:${e.target.value}`, points: prev.new?.points ?? "1" },
                  }));
                }}
              >
                <option value="">Reason...</option>
                <option value="Round Challenge - 1 correct">Round Challenge - 1 correct</option>
                <option value="Round Challenge - 2 correct">Round Challenge - 2 correct</option>
                <option value="Perfect Round">Perfect Round</option>
                <option value="Bonus Award">Bonus Award</option>
              </select>
              <input
                className="field-input"
                type="number"
                min="1"
                max="10"
                value={bonusPointsDraft["new"]?.points ?? "1"}
                onChange={(e) =>
                  setBonusPointsDraft((prev) => ({
                    ...prev,
                    new: { ...prev.new, points: e.target.value, reason: prev.new?.reason ?? "" },
                  }))
                }
                style={{ width: 60 }}
                placeholder="Pts"
              />
              <Button
                type="button"
                onClick={async () => {
                  if (!group || !bonusPointsDraft["new"]?.reason) return;
                  const [player, reason] = (bonusPointsDraft["new"]?.reason ?? "").split(":");
                  const user = users.find((u) => u.profiles?.display_name === player);
                  if (!user?.profiles?.id) return;

                  await supabase.from("challenge_bonus_points").insert({
                    round_id: rounds[0]?.id ?? null,
                    user_id: user.profiles.id,
                    points: parseInt(bonusPointsDraft["new"]?.points ?? "1", 10),
                    reason: reason || "Bonus",
                    awarded_by: profile?.id ?? null,
                  });

                  setBonusPointsDraft({});
                  // Refresh bonus points
                  const { data } = await supabase
                    .from("challenge_bonus_points")
                    .select("id,points,reason,created_at,profiles(display_name),rounds(theme)")
                    .order("created_at", { ascending: false })
                    .limit(50);
                  setBonusPoints((data as unknown as BonusPointEntry[]) ?? []);
                }}
                disabled={!bonusPointsDraft["new"]?.reason}
              >
                Award
              </Button>
            </div>
          </div>

          {/* Round Challenge Song Links */}
          <div className="admin-form" style={{ marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem" }}>Edit Round Challenge Links</h3>
            <p className="muted" style={{ marginBottom: 12 }}>Select a round to view/edit the bonus challenge song links.</p>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <select
                className="field-input"
                value={challengeRoundId ?? ""}
                onChange={(e) => e.target.value && loadRoundChallenge(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">Select a round...</option>
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    S{r.season_number ?? "?"} R{r.round_number ?? "?"}: {r.theme}
                  </option>
                ))}
              </select>
            </div>

            {challengeLoading && (
              <div style={{ padding: 16, color: "var(--text-muted)" }}>Loading challenge...</div>
            )}

            {challengeSongs && !challengeLoading && (
              <div style={{ display: "grid", gap: 16 }}>
                {/* Song 1 */}
                <div style={{ padding: 12, background: "var(--bg-secondary)", borderRadius: 8 }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Song 1:</strong> {challengeSongs.song1.title} - {challengeSongs.song1.artist}
                    <span className="muted" style={{ marginLeft: 8 }}>({challengeSongs.song1.theme})</span>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <label className="field" style={{ margin: 0 }}>
                      <span className="field-label" style={{ fontSize: "0.8rem" }}>Spotify URL</span>
                      <input
                        className="field-input"
                        value={challengeLinksEditing.song1_spotify_url}
                        onChange={(e) => setChallengeLinksEditing((prev) => ({ ...prev, song1_spotify_url: e.target.value }))}
                        placeholder="https://open.spotify.com/track/..."
                      />
                    </label>
                    <label className="field" style={{ margin: 0 }}>
                      <span className="field-label" style={{ fontSize: "0.8rem" }}>YouTube URL</span>
                      <input
                        className="field-input"
                        value={challengeLinksEditing.song1_youtube_url}
                        onChange={(e) => setChallengeLinksEditing((prev) => ({ ...prev, song1_youtube_url: e.target.value }))}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </label>
                  </div>
                </div>

                {/* Song 2 */}
                <div style={{ padding: 12, background: "var(--bg-secondary)", borderRadius: 8 }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Song 2:</strong> {challengeSongs.song2.title} - {challengeSongs.song2.artist}
                    <span className="muted" style={{ marginLeft: 8 }}>({challengeSongs.song2.theme})</span>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <label className="field" style={{ margin: 0 }}>
                      <span className="field-label" style={{ fontSize: "0.8rem" }}>Spotify URL</span>
                      <input
                        className="field-input"
                        value={challengeLinksEditing.song2_spotify_url}
                        onChange={(e) => setChallengeLinksEditing((prev) => ({ ...prev, song2_spotify_url: e.target.value }))}
                        placeholder="https://open.spotify.com/track/..."
                      />
                    </label>
                    <label className="field" style={{ margin: 0 }}>
                      <span className="field-label" style={{ fontSize: "0.8rem" }}>YouTube URL</span>
                      <input
                        className="field-input"
                        value={challengeLinksEditing.song2_youtube_url}
                        onChange={(e) => setChallengeLinksEditing((prev) => ({ ...prev, song2_youtube_url: e.target.value }))}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </label>
                  </div>
                </div>

                <Button type="button" onClick={saveChallengeLinks} disabled={challengeSaving}>
                  {challengeSaving ? "Saving..." : "Save Links"}
                </Button>
              </div>
            )}
          </div>

          {/* Recent Points Awarded */}
          <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem" }}>Recent Points Awarded</h3>
          <div className="admin-list">
            {bonusPoints.length > 0 ? (
              bonusPoints.map((bp) => (
                <div key={bp.id} className="admin-list-row" style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <strong>{bp.profiles?.display_name ?? "Unknown"}</strong>
                    <span className="muted" style={{ marginLeft: 8 }}>
                      +{bp.points} pts - {bp.reason ?? "Bonus"}
                    </span>
                  </div>
                  <span className="muted">{new Date(bp.created_at).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <p className="muted">No bonus points awarded yet.</p>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
type GroupSettings = {
  id: string;
  group_id: string;
  round_summary_model_key: string | null;
  round_story_image_model_key: string | null;
  round_theme_image_model_key: string | null;
  awards_model_key: string | null;
  trophy_image_model_key: string | null;
  logo_palette: string | null;
  // AI Assistant feature toggles
  ai_assistant_enabled: boolean;
  ai_explain_enabled: boolean;
  ai_validate_enabled: boolean;
  ai_hint_enabled: boolean;
  ai_validate_daily_limit: number;
  ai_chat_enabled: boolean;
};

const MODEL_OPTIONS = [
  { key: "OPENROUTER_MODEL", label: "OPENROUTER_MODEL", image: false },
  { key: "OPENROUTER_ROUND_IMAGE_MODEL", label: "OPENROUTER_ROUND_IMAGE_MODEL", image: true },
  { key: "OPENROUTER_MID_MODEL", label: "OPENROUTER_MID_MODEL", image: true },
  { key: "OPENROUTER_TROPHY_MODEL", label: "OPENROUTER_TROPHY_MODEL", image: true },
] as const;

const LOGO_PALETTE_OPTIONS = [
  { key: "ocean-coral", label: "Ocean + Coral" },
  { key: "teal-mango", label: "Teal Night + Mango" },
  { key: "midnight-mint", label: "Midnight + Neon Mint" },
] as const;
