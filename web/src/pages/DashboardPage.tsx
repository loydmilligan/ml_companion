import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Papa from "papaparse";
import Card from "../components/Card";
import StatusPill from "../components/StatusPill";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import SeasonRecap from "../components/SeasonRecap";
import SeasonPersonalStats from "../components/SeasonPersonalStats";
import SeasonImport from "../components/SeasonImport";
import SongConnectionWidget from "../components/SongConnectionWidget";
import SeasonRounds from "../components/SeasonRounds";

type RoundSummary = {
  id: string;
  theme: string;
  status: "open" | "voting" | "revealed" | "archived";
  submission_deadline: string | null;
  voting_deadline: string | null;
};

type LeagueSummary = {
  id: string;
  name: string;
};

type GroupMessage = {
  id: string;
  body: string;
  created_at: string;
  profiles?: {
    display_name: string | null;
  } | null;
};

type SeasonCompetitor = {
  id: string;
  name: string;
};

const statusTone = {
  open: "info",
  voting: "warning",
  revealed: "success",
  archived: "info",
} as const;

export default function DashboardPage() {
  const { group, profile } = useAuth();
  const isLead = group?.role === "lead";
  const [league, setLeague] = useState<LeagueSummary | null>(null);
  const [round, setRound] = useState<RoundSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLeagueForm, setShowLeagueForm] = useState(false);
  const [leagueName, setLeagueName] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showRoundForm, setShowRoundForm] = useState(false);
  const [roundTheme, setRoundTheme] = useState("");
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [votingDeadline, setVotingDeadline] = useState("");
  const [recentMessages, setRecentMessages] = useState<GroupMessage[]>([]);
  const [seasonCompetitors, setSeasonCompetitors] = useState<SeasonCompetitor[]>([]);
  const [newCompetitor, setNewCompetitor] = useState("");
  const [importingCompetitors, setImportingCompetitors] = useState(false);

  useEffect(() => {
    if (!group) return;

    const fetchData = async () => {
      setLoading(true);
      const { data: leagueData } = await supabase
        .from("leagues")
        .select("id,name")
        .eq("group_id", group.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setLeague(leagueData ?? null);

      if (leagueData) {
        const { data: roundData } = await supabase
          .from("rounds")
          .select("id,theme,status,submission_deadline,voting_deadline")
          .eq("league_id", leagueData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        setRound(roundData ?? null);
      } else {
        setRound(null);
      }

      const { data: messageData } = await supabase
        .from("group_messages")
        .select("id,body,created_at, profiles(display_name)")
        .eq("group_id", group.id)
        .order("created_at", { ascending: false })
        .limit(3);

      setRecentMessages((messageData as GroupMessage[]) ?? []);

      const { data: competitorData } = await supabase
        .from("season_competitors")
        .select("id,name")
        .eq("group_id", group.id)
        .order("name");

      setSeasonCompetitors((competitorData as SeasonCompetitor[]) ?? []);
      setLoading(false);
    };

    fetchData();
  }, [group]);

  const handleCreateLeague = async () => {
    if (!group || !leagueName.trim()) return;
    const { error } = await supabase.from("leagues").insert({
      group_id: group.id,
      name: leagueName.trim(),
    });

    if (!error) {
      setLeagueName("");
      setShowLeagueForm(false);
      const { data } = await supabase
        .from("leagues")
        .select("id,name")
        .eq("group_id", group.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setLeague(data ?? null);
    }
  };

  const handleCreateRound = async () => {
    if (!league || !roundTheme.trim()) return;
    const { error } = await supabase.from("rounds").insert({
      league_id: league.id,
      theme: roundTheme.trim(),
      submission_deadline: submissionDeadline || null,
      voting_deadline: votingDeadline || null,
      status: "open",
    });

    if (!error) {
      setRoundTheme("");
      setSubmissionDeadline("");
      setVotingDeadline("");
      setShowRoundForm(false);
      await supabase.functions.invoke("notify", {
        body: {
          title: "New round created",
          message: `Round \"${roundTheme.trim()}\" is ready.`,
          recipients: profile?.email ? [profile.email] : [],
        },
      });
      const { data } = await supabase
        .from("rounds")
        .select("id,theme,status,submission_deadline,voting_deadline")
        .eq("league_id", league.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setRound(data ?? null);
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
    const { error } = await supabase.from("season_competitors").insert({
      group_id: group.id,
      name: newCompetitor.trim(),
    });
    if (!error) {
      setNewCompetitor("");
      const { data } = await supabase
        .from("season_competitors")
        .select("id,name")
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
    const parsed = Papa.parse<{ ID: string; Name: string }>(text, { header: true, skipEmptyLines: true });

    const { data: existing } = await supabase
      .from("season_competitors")
      .select("external_id")
      .eq("group_id", group.id);

    const existingIds = new Set((existing ?? []).map((row) => row.external_id));
    const rows = parsed.data
      .filter((row) => row.ID && row.Name && !existingIds.has(row.ID))
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
      .select("id,name")
      .eq("group_id", group.id)
      .order("name");
    setSeasonCompetitors((data as SeasonCompetitor[]) ?? []);
    setImportingCompetitors(false);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back</h1>
          <p>Keep the league moving with the next best action.</p>
        </div>
        <div className="dashboard-actions">
          {league && isLead ? (
            <Button variant="secondary" type="button" onClick={handleGenerateInvite}>
              Generate Invite
            </Button>
          ) : null}
          {league && isLead ? (
            <Button type="button" onClick={() => setShowRoundForm((prev) => !prev)}>
              Add Round
            </Button>
          ) : null}
          {!league && isLead ? (
            <Button type="button" onClick={() => setShowLeagueForm((prev) => !prev)}>
              Link League
            </Button>
          ) : null}
        </div>
      </div>

      <div className="dashboard-grid">
        {inviteError && !inviteLink ? (
          <Card className="dashboard-card highlight">
            <h2>Invite issue</h2>
            <p className="muted">{inviteError}</p>
          </Card>
        ) : null}

        {showRoundForm && league && isLead ? (
          <Card className="dashboard-card highlight">
            <h2>New round</h2>
            <p className="muted">Set the theme and deadlines for this round.</p>
            <input
              className="field-input"
              placeholder="Theme name"
              value={roundTheme}
              onChange={(event) => setRoundTheme(event.target.value)}
            />
            <div className="form-row">
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
            </div>
            <Button type="button" onClick={handleCreateRound} disabled={!roundTheme.trim()}>
              Save Round
            </Button>
          </Card>
        ) : null}
        {showLeagueForm && !league ? (
          <Card className="dashboard-card highlight">
            <h2>Link your league</h2>
            <p className="muted">Add a league name to unlock round tracking.</p>
            <input
              className="field-input"
              placeholder="Mariani Music League"
              value={leagueName}
              onChange={(event) => setLeagueName(event.target.value)}
            />
            <Button type="button" onClick={handleCreateLeague} disabled={!leagueName.trim()}>
              Save League
            </Button>
          </Card>
        ) : null}

        {inviteLink ? (
          <Card className="dashboard-card highlight">
            <h2>Invite ready</h2>
            <p className="muted">Share this link with family members to join.</p>
            <div className="invite-link">{inviteLink}</div>
            <Button type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(inviteLink)}>
              Copy Invite Link
            </Button>
            {inviteError ? <div className="auth-error">{inviteError}</div> : null}
          </Card>
        ) : null}

        <Card className="dashboard-card highlight">
          <div className="dashboard-card-header">
            <h2>Current Round</h2>
            {round ? <StatusPill label={round.status.toUpperCase()} tone={statusTone[round.status]} /> : null}
          </div>
          {loading ? (
            <p>Loading round details...</p>
          ) : round ? (
            <>
              <h3 className="round-theme">{round.theme}</h3>
              <div className="round-meta">
                <span>Submission: {round.submission_deadline ?? "Set a deadline"}</span>
                <span>Voting: {round.voting_deadline ?? "Set a deadline"}</span>
              </div>
              <Link className="text-link" to={`/app/rounds/${round.id}`}>
                View round details
              </Link>
            </>
          ) : (
            <p>No rounds yet. Add your first round to get the family voting.</p>
          )}
        </Card>

        <Card className="dashboard-card">
          <h2>Group Chat</h2>
          {recentMessages.length ? (
            <div className="chat-preview">
              {recentMessages.map((item) => (
                <div key={item.id} className="chat-preview-item">
                  <strong>{item.profiles?.display_name ?? "Family"}</strong>
                  <span>{item.body}</span>
                </div>
              ))}
              <Link className="text-link" to="/app/chat">
                Open group chat
              </Link>
            </div>
          ) : (
            <p className="muted">No messages yet. Start the conversation.</p>
          )}
        </Card>

        <Card className="dashboard-card">
          <h2>League Snapshot</h2>
          {league ? (
            <>
              <p className="muted">Linked league</p>
              <h3>{league.name}</h3>
              <p className="muted">Use this space to track submissions and comments.</p>
            </>
          ) : (
            <p>Link your first league to unlock the main dashboard view.</p>
          )}
        </Card>

        <Card className="dashboard-card">
          <h2>Getting Started</h2>
          <ol className="steps">
            <li className={league ? "done" : "active"}>Create or link your league.</li>
            <li className={!league ? "" : round ? "done" : "active"}>Add the current round.</li>
            <li className={!round ? "" : "active"}>Invite family and start the discussion.</li>
          </ol>
        </Card>

        {isLead ? (
          <Card className="dashboard-card">
          <h2>Season Competitors</h2>
          <p className="muted">Add everyone participating this season.</p>
          <div className="competitor-list">
            {seasonCompetitors.map((competitor) => (
              <span key={competitor.id} className="pill mint">
                {competitor.name}
              </span>
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleImportSeasonOneCompetitors}
            disabled={importingCompetitors}
          >
            {importingCompetitors ? "Importing..." : "Import Season 1 Competitors"}
          </Button>
          <div className="competitor-form">
            <input
              className="field-input"
              placeholder="Add competitor name"
              value={newCompetitor}
              onChange={(event) => setNewCompetitor(event.target.value)}
            />
            <Button type="button" variant="secondary" onClick={handleAddCompetitor} disabled={!newCompetitor.trim()}>
              Add
            </Button>
          </div>
          </Card>
        ) : null}

        {isLead ? <SeasonImport leagueId={league?.id ?? null} groupId={group?.id ?? null} /> : null}
        <SongConnectionWidget />
      </div>

      <SeasonRecap />
      <SeasonPersonalStats />
      <SeasonRounds />
    </div>
  );
}
