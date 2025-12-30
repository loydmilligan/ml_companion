import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import SeasonImport from "../components/SeasonImport";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type LeagueSummary = {
  id: string;
  name: string;
  season_number: number | null;
  created_at: string;
};

type SeasonCompetitor = {
  id: string;
  name: string;
  profile_id: string | null;
  external_id: string | null;
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

type TabId = "users" | "invites" | "leagues" | "rounds" | "competitors" | "imports";

type RoundImportRow = {
  id: string;
  external_round_id: string;
  name: string;
  description: string | null;
  playlist_url: string | null;
  external_created_at: string | null;
  round_id: string | null;
};

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
      .select("id,name,profile_id,external_id")
      .eq("group_id", groupId)
      .order("name");
    setSeasonCompetitors((competitorData as SeasonCompetitor[]) ?? []);
  };

  useEffect(() => {
    if (!group) return;

    const fetchData = async () => {
      const { data: leagueData } = await supabase
        .from("leagues")
        .select("id,name,season_number,created_at")
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
        .select("id,league_id,theme,theme_description,theme_author,season_number,round_number,external_round_id,playlist_url,status,submission_deadline,voting_deadline,created_at")
        .in("league_id", leagueIds)
        .order("created_at", { ascending: false });

      setRounds((roundData as RoundSummary[]) ?? []);
      } else {
        setRounds([]);
      }

      const { data: userData } = await supabase
        .from("group_members")
        .select(
          "member_id, role, profiles(id,display_name,email,chat_notify_enabled,email_notify_enabled,can_toggle_chat_notify,can_toggle_email_notify)"
        )
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });

      setUsers((userData as UserRow[]) ?? []);
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
          .order("created_at", { ascending: false });
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
        .select("id,name,profile_id,external_id")
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
      .select("id,name,profile_id,external_id")
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
              const isOwner = group?.owner_id && userId === group.owner_id;
              const isSelf = profile?.id && userId === profile.id;
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
                      </div>
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
                          <Button type="button" variant="secondary" onClick={() => deleteRound(round.id)}>
                            Delete
                          </Button>
                        </div>
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
                <div key={competitor.id} className={`competitor-pill pill ${styleClass}`}>
                  <div>
                    <strong>{competitor.name}</strong>
                    <span className="muted">{linkedProfile?.display_name ? `Linked to ${linkedProfile.display_name}` : "Unlinked"}</span>
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
    </div>
  );
}
