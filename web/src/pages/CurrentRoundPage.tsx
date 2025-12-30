import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import StatusPill from "../components/StatusPill";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type RoundSummary = {
  id: string;
  theme: string;
  status: "open" | "voting" | "revealed" | "archived";
  season_number: number | null;
  round_number: number | null;
  submission_deadline: string | null;
  voting_deadline: string | null;
};

type LeagueSummary = {
  id: string;
  name: string;
  season_number: number | null;
};

const statusTone = {
  open: "info",
  voting: "warning",
  revealed: "success",
  archived: "info",
} as const;

export default function CurrentRoundPage() {
  const { group } = useAuth();
  const isLead = group?.role === "lead";
  const [league, setLeague] = useState<LeagueSummary | null>(null);
  const [round, setRound] = useState<RoundSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!group) return;

    const fetchData = async () => {
      setLoading(true);
      const { data: leagueData } = await supabase
        .from("leagues")
        .select("id,name,season_number")
        .eq("group_id", group.id)
        .order("season_number", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setLeague(leagueData ?? null);

      if (leagueData) {
        const { data: roundData } = await supabase
          .from("rounds")
          .select("id,theme,status,season_number,round_number,submission_deadline,voting_deadline")
          .eq("league_id", leagueData.id)
          .in("status", ["open", "voting"])
          .order("season_number", { ascending: false, nullsFirst: false })
          .order("round_number", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        setRound(roundData ?? null);
      } else {
        setRound(null);
      }
      setLoading(false);
    };

    fetchData();
  }, [group]);

  useEffect(() => {
    if (!round || !isLead) return;
    const now = new Date();
    const submissionDeadline = round.submission_deadline ? new Date(round.submission_deadline) : null;
    const votingDeadline = round.voting_deadline ? new Date(round.voting_deadline) : null;

    const advanceIfNeeded = async () => {
      if (round.status === "open" && submissionDeadline && now > submissionDeadline) {
        await supabase.from("rounds").update({ status: "voting" }).eq("id", round.id);
      }
      if (round.status === "voting" && votingDeadline && now > votingDeadline) {
        await supabase.from("rounds").update({ status: "revealed" }).eq("id", round.id);
      }
    };

    advanceIfNeeded();
  }, [round, isLead]);

  const snoozeDeadline = async (field: "submission_deadline" | "voting_deadline", hours: number) => {
    if (!round) return;
    const currentValue = round[field];
    const base = currentValue ? new Date(currentValue) : new Date();
    const next = new Date(base.getTime() + hours * 60 * 60 * 1000);
    await supabase.from("rounds").update({ [field]: next.toISOString() }).eq("id", round.id);
    setRound((prev) => (prev ? { ...prev, [field]: next.toISOString() } : prev));
  };

  const advancePhase = async () => {
    if (!round) return;
    const nextStatus =
      round.status === "open"
        ? "voting"
        : round.status === "voting"
        ? "revealed"
        : "archived";
    await supabase.from("rounds").update({ status: nextStatus }).eq("id", round.id);
    setRound((prev) => (prev ? { ...prev, status: nextStatus } : prev));
  };

  const now = Date.now();
  const submissionMs = round?.submission_deadline ? new Date(round.submission_deadline).getTime() : null;
  const votingMs = round?.voting_deadline ? new Date(round.voting_deadline).getTime() : null;

  const computeUrgency = (deadlineMs: number | null) => {
    if (!deadlineMs) return { pct: 0, level: "neutral" };
    const remaining = deadlineMs - now;
    if (remaining <= 0) return { pct: 100, level: "overdue" };
    const totalWindow = 1000 * 60 * 60 * 72;
    const pct = Math.min(100, Math.max(10, (1 - remaining / totalWindow) * 100));
    if (remaining <= 1000 * 60 * 60 * 6) return { pct, level: "urgent" };
    if (remaining <= 1000 * 60 * 60 * 24) return { pct, level: "warning" };
    return { pct, level: "safe" };
  };

  const submissionUrgency = computeUrgency(submissionMs);
  const votingUrgency = computeUrgency(votingMs);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Current Round</h1>
        <p>See the latest round status and open the full round detail.</p>
      </div>
      <Card className="dashboard-card highlight">
        <div className="dashboard-card-header">
          <h2>{league?.name ?? "League"}</h2>
          {round ? <StatusPill label={round.status.toUpperCase()} tone={statusTone[round.status]} /> : null}
        </div>
        {loading ? (
          <p className="muted">Loading round details...</p>
        ) : round ? (
          <>
            <h3 className="round-theme">{round.theme}</h3>
            {round.season_number || round.round_number ? (
              <p className="muted">
                Season {round.season_number ?? "—"} · Round {round.round_number ?? "—"}
              </p>
            ) : null}
            <div className="deadline-grid">
              <div className="deadline-card">
                <div className="deadline-header">
                  <span>Submission deadline</span>
                  <strong>{round.submission_deadline ?? "Set a deadline"}</strong>
                </div>
                <div className="deadline-bar">
                  <span
                    className={`deadline-fill ${submissionUrgency.level}`}
                    style={{ width: `${submissionUrgency.pct}%` }}
                  />
                </div>
              </div>
              <div className="deadline-card">
                <div className="deadline-header">
                  <span>Voting deadline</span>
                  <strong>{round.voting_deadline ?? "Set a deadline"}</strong>
                </div>
                <div className="deadline-bar">
                  <span
                    className={`deadline-fill ${votingUrgency.level}`}
                    style={{ width: `${votingUrgency.pct}%` }}
                  />
                </div>
              </div>
            </div>
            <Link className="text-link" to={`/app/round/${round.id}`}>
              Open round detail
            </Link>
          </>
        ) : (
          <p className="muted">No rounds yet. Ask an admin to add one.</p>
        )}
      </Card>

      {isLead && round ? (
        <Card className="dashboard-card">
          <h2>Admin Controls</h2>
          <p className="muted">Snooze deadlines or advance to the next phase.</p>
          <div className="admin-controls">
            <div className="admin-control-group">
              <span className="field-label">Snooze submissions</span>
              <div className="pill-row">
                {[2, 6, 12, 24].map((hours) => (
                  <button
                    key={`sub-${hours}`}
                    className="pill-button"
                    type="button"
                    onClick={() => snoozeDeadline("submission_deadline", hours)}
                  >
                    +{hours}h
                  </button>
                ))}
              </div>
            </div>
            <div className="admin-control-group">
              <span className="field-label">Snooze voting</span>
              <div className="pill-row">
                {[2, 6, 12, 24].map((hours) => (
                  <button
                    key={`vote-${hours}`}
                    className="pill-button"
                    type="button"
                    onClick={() => snoozeDeadline("voting_deadline", hours)}
                  >
                    +{hours}h
                  </button>
                ))}
              </div>
            </div>
            <button className="button button-secondary" type="button" onClick={advancePhase}>
              Advance Phase
            </button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
