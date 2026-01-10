/**
 * TEST-001: Test Dashboard Page
 *
 * Redesigned test environment dashboard with:
 * - Three-column layout (Phase blocks | Bulk actions | Logs)
 * - Tab navigation (Control Panel | Season Summary | Analytics | App Preview)
 * - Round tabs at bottom for multi-round testing
 * - Visual phase progression with jump buttons
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";
import {
  getPhaseStatus,
  UserGrid,
  JumpButton,
  TEST_USERS,
  TEST_LEAGUE_S2_ID,
  ROUND_THEMES,
  type PhaseType,
  type PhaseStatus,
  type RoundState,
  type TestState,
  type LogEntry,
  type AnalyticsSummary,
} from "../components/test";

// ============================================================================
// Types
// ============================================================================

type MainTab = "control" | "summary" | "analytics" | "preview";

interface SimulationOptions {
  revealDurationMinutes?: number;
  useMockAI?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function TestDashboardPage() {
  // State
  const [state, setState] = useState<TestState | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>("control");
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [newTheme, setNewTheme] = useState(ROUND_THEMES[0]);
  const [revealMinutes, setRevealMinutes] = useState(120);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [preseasonComplete, setPreseasonComplete] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [analyticsDays, setAnalyticsDays] = useState(7);

  // Derived state
  const selectedRound = useMemo(
    () => state?.rounds?.find((r) => r.id === selectedRoundId) ?? null,
    [state?.rounds, selectedRoundId]
  );

  const currentPhase = useMemo<PhaseType>(() => {
    if (!selectedRound) return preseasonComplete ? "submission" : "preseason";
    const statusMap: Record<string, PhaseType> = {
      open: "submission",
      voting: "voting",
      revealed: "reveal",
      archived: "archived",
    };
    return statusMap[selectedRound.status] || "submission";
  }, [selectedRound, preseasonComplete]);

  // ============================================================================
  // Logging
  // ============================================================================

  const addLog = useCallback(
    (action: string, success: boolean, details?: string, phase?: PhaseType) => {
      const entry: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action,
        success,
        details,
        phase,
      };
      setLogs((prev) => [entry, ...prev].slice(0, 200));
    },
    []
  );

  // ============================================================================
  // API Calls
  // ============================================================================

  const callFactory = useCallback(
    async (action: string, params: Record<string, unknown> = {}) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("test-factory", {
          body: { action, ...params },
        });

        if (error) {
          addLog(action, false, error.message);
          return null;
        }

        if (!data.success) {
          addLog(action, false, data.error);
          return null;
        }

        addLog(action, true, JSON.stringify(data.data, null, 2));
        return data.data;
      } catch (err) {
        addLog(action, false, String(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [addLog]
  );

  const loadState = useCallback(async () => {
    const data = await callFactory("get-state", { leagueId: TEST_LEAGUE_S2_ID });
    if (data) {
      setState(data);
      // Check if preseason is complete (users exist)
      if (data.testUsers?.length > 0) {
        setPreseasonComplete(true);
      }
    }
  }, [callFactory]);

  const loadAnalytics = useCallback(async () => {
    const data = await callFactory("get-analytics", { days: analyticsDays });
    if (data) {
      setAnalytics(data);
    }
  }, [callFactory, analyticsDays]);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadState, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadState]);

  useEffect(() => {
    if (activeTab === "analytics") {
      loadAnalytics();
    }
  }, [activeTab, loadAnalytics]);

  // Auto-select first round
  useEffect(() => {
    if (!selectedRoundId && state?.rounds?.length) {
      setSelectedRoundId(state.rounds[0].id);
    }
  }, [state?.rounds, selectedRoundId]);

  // ============================================================================
  // Action Handlers
  // ============================================================================

  const handleSeedTestData = async () => {
    const { data, error } = await supabase.functions.invoke("seed-test-data", {
      body: { reset: true },
    });
    if (error) {
      addLog("seed-test-data", false, error.message, "preseason");
    } else {
      addLog("seed-test-data", data.success, JSON.stringify(data, null, 2), "preseason");
      setPreseasonComplete(true);
      await loadState();
    }
  };

  const handleCreateRound = async () => {
    const result = await callFactory("create-round", {
      leagueId: TEST_LEAGUE_S2_ID,
      theme: newTheme,
    });
    if (result?.roundId) {
      setSelectedRoundId(result.roundId);
      await loadState();
    }
  };

  const handleSimulateSubmission = async (userName: string) => {
    if (!selectedRoundId) return;
    await callFactory("simulate-email", {
      eventType: "user_submitted",
      roundId: selectedRoundId,
      actorName: userName,
    });
    await loadState();
  };

  const handleSimulateAllSubmissions = async () => {
    if (!selectedRoundId) return;
    for (const user of TEST_USERS) {
      await callFactory("simulate-email", {
        eventType: "user_submitted",
        roundId: selectedRoundId,
        actorName: user.name,
      });
    }
    await loadState();
  };

  const handlePlaylistReady = async () => {
    if (!selectedRoundId) return;
    await callFactory("simulate-email", {
      eventType: "playlist_ready",
      roundId: selectedRoundId,
    });
    await loadState();
  };

  const handleSimulateVote = async (userName: string) => {
    if (!selectedRoundId) return;
    await callFactory("simulate-email", {
      eventType: "user_voted",
      roundId: selectedRoundId,
      actorName: userName,
    });
    await loadState();
  };

  const handleSimulateAllVotes = async () => {
    if (!selectedRoundId) return;
    for (const user of TEST_USERS) {
      await callFactory("simulate-email", {
        eventType: "user_voted",
        roundId: selectedRoundId,
        actorName: user.name,
      });
    }
    await loadState();
  };

  const handleVotesIn = async () => {
    if (!selectedRoundId) return;
    const options: SimulationOptions = {
      revealDurationMinutes: revealMinutes,
      useMockAI: true,
    };
    await callFactory("simulate-email", {
      eventType: "votes_in",
      roundId: selectedRoundId,
      options,
    });
    await loadState();
  };

  const handleAdvanceRound = async () => {
    if (!selectedRoundId) return;
    const options: SimulationOptions = {
      revealDurationMinutes: revealMinutes,
      useMockAI: true,
    };
    await callFactory("advance-round", {
      roundId: selectedRoundId,
      options,
    });
    await loadState();
  };

  const handleCompleteRound = async () => {
    const options: SimulationOptions = {
      revealDurationMinutes: revealMinutes,
      useMockAI: true,
    };
    const result = await callFactory("complete-round", {
      leagueId: TEST_LEAGUE_S2_ID,
      theme: newTheme,
      userNames: TEST_USERS.map((u) => u.name),
      options,
    });
    if (result) {
      await loadState();
    }
  };

  const handleResetRound = async () => {
    if (!selectedRoundId) return;
    await callFactory("reset-round", { roundId: selectedRoundId });
    await loadState();
  };

  const handleResetAllTestData = async () => {
    if (!confirm("Are you sure you want to delete ALL test data? This will remove all rounds, submissions, votes, and test analytics for the test league.")) {
      return;
    }
    setLoading(true);
    addLog("reset-all-test-data", true, "Starting full reset...", "preseason");

    try {
      // Delete test analytics first (no FK constraints)
      const { error: statsError } = await supabase
        .from("test_daily_stats")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all
      if (statsError) throw new Error(`test_daily_stats: ${statsError.message}`);

      // Delete test_actions (depends on test_runs)
      const { error: actionsError } = await supabase
        .from("test_actions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (actionsError) throw new Error(`test_actions: ${actionsError.message}`);

      // Delete test_runs
      const { error: runsError } = await supabase
        .from("test_runs")
        .delete()
        .eq("league_id", TEST_LEAGUE_S2_ID);
      if (runsError) throw new Error(`test_runs: ${runsError.message}`);

      // Get all rounds for the test league
      const { data: rounds, error: roundsQueryError } = await supabase
        .from("rounds")
        .select("id")
        .eq("league_id", TEST_LEAGUE_S2_ID);
      if (roundsQueryError) throw new Error(`rounds query: ${roundsQueryError.message}`);

      const roundIds = rounds?.map(r => r.id) || [];

      if (roundIds.length > 0) {
        // Delete dependent data for these rounds
        for (const table of [
          "votes",
          "submitter_guesses",
          "timeline_guesses",
          "round_awards",
          "round_user_activity",
          "round_ai_cache",
          "round_challenges",
          "round_challenge_v2",
          "round_challenge_guesses",
          "round_chats",
        ]) {
          const { error } = await supabase
            .from(table)
            .delete()
            .in("round_id", roundIds);
          if (error) {
            console.warn(`Warning deleting ${table}:`, error.message);
          }
        }

        // Delete submissions (after votes which depend on submission_id)
        const { error: subsError } = await supabase
          .from("submissions")
          .delete()
          .in("round_id", roundIds);
        if (subsError) throw new Error(`submissions: ${subsError.message}`);

        // Delete rounds themselves
        const { error: roundsError } = await supabase
          .from("rounds")
          .delete()
          .eq("league_id", TEST_LEAGUE_S2_ID);
        if (roundsError) throw new Error(`rounds: ${roundsError.message}`);
      }

      addLog("reset-all-test-data", true, `Deleted ${roundIds.length} rounds and all associated data`, "preseason");
      setPreseasonComplete(false);
      setSelectedRoundId(null);
      setLogs([]);
      await loadState();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      addLog("reset-all-test-data", false, message, "preseason");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCSVs = async () => {
    const result = await callFactory("generate-csvs", { roundCount: 5 });
    if (result?.files) {
      for (const [name, content] of Object.entries(result.files)) {
        const blob = new Blob([content as string], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleExportAnalytics = async () => {
    const result = await callFactory("export-analytics", { days: 30 });
    if (result) {
      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `test-analytics-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleExportLiveDataBackup = async () => {
    setLoading(true);

    try {
      // Get all non-test leagues
      const { data: leagues, error: leaguesError } = await supabase
        .from("leagues")
        .select("*")
        .not("id", "like", "00000000-0000-0000-0002-%");
      if (leaguesError) throw leaguesError;

      const leagueIds = leagues?.map(l => l.id) || [];

      // Get all rounds for these leagues
      const { data: rounds, error: roundsError } = await supabase
        .from("rounds")
        .select("*")
        .in("league_id", leagueIds);
      if (roundsError) throw roundsError;

      const roundIds = rounds?.map(r => r.id) || [];

      // Get all submissions for these rounds
      const { data: submissions, error: subsError } = await supabase
        .from("submissions")
        .select("*")
        .in("round_id", roundIds);
      if (subsError) throw subsError;

      const submissionIds = submissions?.map(s => s.id) || [];

      // Get all votes for these submissions
      const { data: votes, error: votesError } = await supabase
        .from("votes")
        .select("*")
        .in("submission_id", submissionIds);
      if (votesError) throw votesError;

      // Get round awards
      const { data: awards, error: awardsError } = await supabase
        .from("round_awards")
        .select("*")
        .in("round_id", roundIds);
      if (awardsError) throw awardsError;

      // Get family groups (non-test)
      const { data: groups, error: groupsError } = await supabase
        .from("family_groups")
        .select("*")
        .eq("is_test_group", false);
      if (groupsError) throw groupsError;

      // Get season competitors for these groups
      const groupIds = groups?.map(g => g.id) || [];
      const { data: competitors, error: compsError } = await supabase
        .from("season_competitors")
        .select("*")
        .in("group_id", groupIds);
      if (compsError) throw compsError;

      const backup = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        stats: {
          leagues: leagues?.length || 0,
          rounds: rounds?.length || 0,
          submissions: submissions?.length || 0,
          votes: votes?.length || 0,
          awards: awards?.length || 0,
          groups: groups?.length || 0,
          competitors: competitors?.length || 0,
        },
        data: {
          leagues,
          rounds,
          submissions,
          votes,
          awards,
          groups,
          competitors,
        },
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tml-live-data-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      addLog(
        "export-live-backup",
        true,
        `Backup complete: ${backup.stats.leagues} leagues, ${backup.stats.rounds} rounds, ${backup.stats.submissions} submissions, ${backup.stats.votes} votes`,
        "preseason"
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      addLog("export-live-backup", false, message, "preseason");
    } finally {
      setLoading(false);
    }
  };

  // Jump handlers
  const handleJumpToSubmission = async () => {
    if (!preseasonComplete) {
      await handleSeedTestData();
    }
    await handleCreateRound();
  };

  const handleJumpToPlaylist = async () => {
    await handleSimulateAllSubmissions();
    await handlePlaylistReady();
  };

  const handleJumpToVoting = async () => {
    await handleJumpToPlaylist();
  };

  const handleJumpToReveal = async () => {
    await handleSimulateAllVotes();
    await handleVotesIn();
  };

  const handleJumpToArchive = async () => {
    await handleAdvanceRound();
  };

  // ============================================================================
  // Helpers
  // ============================================================================

  const getPhaseStatusForRound = (phase: PhaseType): PhaseStatus => {
    return getPhaseStatus(phase, selectedRound?.status ?? null, preseasonComplete);
  };

  const getSubmissions = (): Record<string, { song?: string; artist?: string }> => {
    const submissions: Record<string, { song?: string; artist?: string }> = {};
    if (selectedRound?.activity?.submissions) {
      for (const name of selectedRound.activity.submissions) {
        submissions[name] = { song: "✓ Submitted" };
      }
    }
    return submissions;
  };

  const getVotes = (): Record<string, Array<{ recipient: string; points: number }>> => {
    const votes: Record<string, Array<{ recipient: string; points: number }>> = {};
    if (selectedRound?.activity?.votes) {
      for (const name of selectedRound.activity.votes) {
        votes[name] = [{ recipient: "Other", points: 5 }]; // Placeholder
      }
    }
    return votes;
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div style={{ padding: "1rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>TML Testing Dashboard</h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.9rem" }}>
            League: <strong>{state?.league?.name || "Loading..."}</strong>
          </span>
          <span style={{ fontSize: "0.9rem" }}>
            Season: <strong>{state?.league?.seasonNumber || "-"}</strong>
          </span>
          <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <Button
            onClick={loadState}
            disabled={loading}
            style={{ padding: "0.25rem 0.75rem", fontSize: "0.85rem" }}
          >
            Refresh
          </Button>
          <Button
            onClick={handleExportLiveDataBackup}
            disabled={loading}
            style={{
              padding: "0.25rem 0.75rem",
              fontSize: "0.85rem",
              backgroundColor: "#16a34a",
              borderColor: "#16a34a",
              color: "white",
            }}
          >
            Backup Live Data
          </Button>
          <Button
            onClick={handleResetAllTestData}
            disabled={loading}
            style={{
              padding: "0.25rem 0.75rem",
              fontSize: "0.85rem",
              backgroundColor: "#dc2626",
              borderColor: "#dc2626",
              color: "white",
            }}
          >
            Reset Test Data
          </Button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          borderBottom: "2px solid var(--color-border)",
          paddingBottom: "0.5rem",
        }}
      >
        <TabButton active={activeTab === "control"} onClick={() => setActiveTab("control")}>
          Control Panel
        </TabButton>
        <TabButton active={activeTab === "summary"} onClick={() => setActiveTab("summary")}>
          Season Summary
        </TabButton>
        <TabButton active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")}>
          Analytics
        </TabButton>
        <TabButton active={activeTab === "preview"} onClick={() => setActiveTab("preview")} disabled>
          App Preview (Soon)
        </TabButton>
      </div>

      {/* Tab Content */}
      {activeTab === "control" && (
        <ControlPanelTab
          state={state}
          selectedRound={selectedRound}
          selectedRoundId={selectedRoundId}
          currentPhase={currentPhase}
          preseasonComplete={preseasonComplete}
          loading={loading}
          logs={logs}
          newTheme={newTheme}
          revealMinutes={revealMinutes}
          setNewTheme={setNewTheme}
          setRevealMinutes={setRevealMinutes}
          setSelectedRoundId={setSelectedRoundId}
          getPhaseStatusForRound={getPhaseStatusForRound}
          getSubmissions={getSubmissions}
          getVotes={getVotes}
          onSeedTestData={handleSeedTestData}
          onCreateRound={handleCreateRound}
          onSimulateSubmission={handleSimulateSubmission}
          onSimulateAllSubmissions={handleSimulateAllSubmissions}
          onPlaylistReady={handlePlaylistReady}
          onSimulateVote={handleSimulateVote}
          onSimulateAllVotes={handleSimulateAllVotes}
          onVotesIn={handleVotesIn}
          onAdvanceRound={handleAdvanceRound}
          onCompleteRound={handleCompleteRound}
          onResetRound={handleResetRound}
          onGenerateCSVs={handleGenerateCSVs}
          onJumpToSubmission={handleJumpToSubmission}
          onJumpToPlaylist={handleJumpToPlaylist}
          onJumpToVoting={handleJumpToVoting}
          onJumpToReveal={handleJumpToReveal}
          onJumpToArchive={handleJumpToArchive}
        />
      )}

      {activeTab === "summary" && (
        <SeasonSummaryTab state={state} />
      )}

      {activeTab === "analytics" && (
        <AnalyticsTab
          analytics={analytics}
          analyticsDays={analyticsDays}
          setAnalyticsDays={setAnalyticsDays}
          loading={loading}
          onRefresh={loadAnalytics}
          onExport={handleExportAnalytics}
        />
      )}

      {activeTab === "preview" && (
        <Card style={{ padding: "2rem", textAlign: "center" }}>
          <h3>App Preview</h3>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Coming soon: Live preview of the app UI based on current test state.
          </p>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Control Panel Tab
// ============================================================================

interface ControlPanelTabProps {
  state: TestState | null;
  selectedRound: RoundState | null;
  selectedRoundId: string | null;
  currentPhase: PhaseType;
  preseasonComplete: boolean;
  loading: boolean;
  logs: LogEntry[];
  newTheme: string;
  revealMinutes: number;
  setNewTheme: (theme: string) => void;
  setRevealMinutes: (minutes: number) => void;
  setSelectedRoundId: (id: string | null) => void;
  getPhaseStatusForRound: (phase: PhaseType) => PhaseStatus;
  getSubmissions: () => Record<string, { song?: string }>;
  getVotes: () => Record<string, Array<{ recipient: string; points: number }>>;
  onSeedTestData: () => void;
  onCreateRound: () => void;
  onSimulateSubmission: (userName: string) => void;
  onSimulateAllSubmissions: () => void;
  onPlaylistReady: () => void;
  onSimulateVote: (userName: string) => void;
  onSimulateAllVotes: () => void;
  onVotesIn: () => void;
  onAdvanceRound: () => void;
  onCompleteRound: () => void;
  onResetRound: () => void;
  onGenerateCSVs: () => void;
  onJumpToSubmission: () => void;
  onJumpToPlaylist: () => void;
  onJumpToVoting: () => void;
  onJumpToReveal: () => void;
  onJumpToArchive: () => void;
}

// Phase explanations for the left column
const PHASE_EXPLANATIONS: Record<PhaseType, { title: string; steps: string[] }> = {
  preseason: {
    title: "Setup & Data Generation",
    steps: [
      "1. Generate test users (5 players)",
      "2. Create family group relationships",
      "3. Optionally import S1 historical data",
    ],
  },
  submission: {
    title: "Song Submission Period",
    steps: [
      "1. Create a new round with theme",
      "2. Each user submits one song",
      "3. Spotify metadata auto-fetched",
    ],
  },
  playlist: {
    title: "Playlist Generation",
    steps: [
      "1. All submissions collected",
      "2. Spotify playlist created",
      "3. Music service links generated",
    ],
  },
  voting: {
    title: "Voting Period",
    steps: [
      "1. Users listen to playlist",
      "2. Each user votes on all songs",
      "3. Points: (n-1)/2 rounded up per song",
    ],
  },
  reveal: {
    title: "Results & Reveal",
    steps: [
      "1. AI generates round story",
      "2. Awards calculated",
      "3. Timed reveal (submitters hidden)",
    ],
  },
  archived: {
    title: "Round Complete",
    steps: [
      "1. Full results visible",
      "2. All submitters revealed",
      "3. Round added to history",
    ],
  },
};

function ControlPanelTab({
  state,
  selectedRound,
  selectedRoundId,
  currentPhase,
  preseasonComplete,
  loading,
  logs,
  newTheme,
  revealMinutes,
  setNewTheme,
  setRevealMinutes,
  setSelectedRoundId,
  getPhaseStatusForRound,
  getSubmissions,
  getVotes,
  onSeedTestData,
  onCreateRound,
  onSimulateSubmission,
  onSimulateAllSubmissions,
  onPlaylistReady: _onPlaylistReady,
  onSimulateVote,
  onSimulateAllVotes,
  onVotesIn: _onVotesIn,
  onAdvanceRound: _onAdvanceRound,
  onCompleteRound,
  onResetRound,
  onGenerateCSVs,
  onJumpToSubmission,
  onJumpToPlaylist,
  onJumpToVoting,
  onJumpToReveal,
  onJumpToArchive,
}: ControlPanelTabProps) {
  // Column styles
  const colExplain = { width: "180px", flexShrink: 0 };
  const colStatus = { flex: 1, minWidth: "200px" };
  const colActions = { width: "220px", flexShrink: 0 };
  const colLogs = { width: "260px", flexShrink: 0 };

  return (
    <>
      {/* Header Row */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "0.5rem",
          padding: "0.5rem",
          backgroundColor: "var(--color-surface-hover)",
          borderRadius: "8px",
          fontWeight: "bold",
          fontSize: "0.8rem",
          color: "var(--color-text-secondary)",
          textTransform: "uppercase",
        }}
      >
        <div style={colExplain}>Instructions</div>
        <div style={colStatus}>Status</div>
        <div style={colActions}>Actions</div>
        <div style={colLogs}>Log</div>
      </div>

      {/* PRESEASON ROW */}
      <PhaseRow
        phase="preseason"
        title="1. PRESEASON"
        explanation={PHASE_EXPLANATIONS.preseason}
        status={getPhaseStatusForRound("preseason")}
        logs={logs}
        colStyles={{ colExplain, colStatus, colActions, colLogs }}
        statusContent={
          preseasonComplete ? (
            <div style={{ fontSize: "0.85rem" }}>
              <div>✓ Users: {state?.testUsers?.length || 0} created</div>
              <div>✓ Family: Test Family</div>
            </div>
          ) : (
            <div style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
              Click "Generate" to set up test data
            </div>
          )
        }
        actionsContent={
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <ActionBtn onClick={onSeedTestData} disabled={loading || preseasonComplete}>
              {preseasonComplete ? "✓ Generated" : "Generate Users"}
            </ActionBtn>
            <ActionBtn onClick={onGenerateCSVs} disabled={loading} small>
              Export S1 CSVs
            </ActionBtn>
          </div>
        }
      />

      <JumpButton
        fromPhase="preseason"
        toPhase="submission"
        onClick={onJumpToSubmission}
        disabled={loading}
        loading={loading && currentPhase === "preseason"}
      />

      {/* SUBMISSION ROW */}
      <PhaseRow
        phase="submission"
        title="2. SUBMISSION"
        explanation={PHASE_EXPLANATIONS.submission}
        status={getPhaseStatusForRound("submission")}
        logs={logs}
        colStyles={{ colExplain, colStatus, colActions, colLogs }}
        statusContent={
          selectedRound && selectedRound.status === "open" ? (
            <div style={{ fontSize: "0.85rem" }}>
              <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
                {selectedRound.submissionCount}/{TEST_USERS.length} submitted
              </div>
              <UserGrid
                type="submission"
                submissions={getSubmissions()}
                onSubmit={onSimulateSubmission}
                disabled={loading}
                loading={loading}
              />
            </div>
          ) : (
            <div style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
              {selectedRound ? "✓ Submissions complete" : "Create a round first"}
            </div>
          )
        }
        actionsContent={
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ marginBottom: "0.25rem" }}>
              <select
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                style={{ width: "100%", padding: "0.35rem", fontSize: "0.8rem" }}
              >
                {ROUND_THEMES.map((theme) => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
            </div>
            <ActionBtn onClick={onCreateRound} disabled={loading || !preseasonComplete}>
              Create Round
            </ActionBtn>
            <ActionBtn
              onClick={onSimulateAllSubmissions}
              disabled={loading || !selectedRound || selectedRound.status !== "open"}
              small
            >
              Submit All
            </ActionBtn>
          </div>
        }
      />

      <JumpButton
        fromPhase="submission"
        toPhase="playlist"
        onClick={onJumpToPlaylist}
        disabled={loading || !selectedRound || selectedRound.status !== "open"}
        loading={loading && currentPhase === "submission"}
      />

      {/* PLAYLIST ROW */}
      <PhaseRow
        phase="playlist"
        title="3. PLAYLIST"
        explanation={PHASE_EXPLANATIONS.playlist}
        status={getPhaseStatusForRound("playlist")}
        logs={logs}
        colStyles={{ colExplain, colStatus, colActions, colLogs }}
        statusContent={
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            {selectedRound?.status !== "open"
              ? "✓ Spotify playlist created"
              : "Waiting for all submissions..."}
          </div>
        }
        actionsContent={
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
            Auto-generated when all submit
          </div>
        }
      />

      <JumpButton
        fromPhase="playlist"
        toPhase="voting"
        onClick={onJumpToVoting}
        disabled={loading || !selectedRound || selectedRound.status === "open"}
        loading={loading && currentPhase === "playlist"}
      />

      {/* VOTING ROW */}
      <PhaseRow
        phase="voting"
        title="4. VOTING"
        explanation={PHASE_EXPLANATIONS.voting}
        status={getPhaseStatusForRound("voting")}
        logs={logs}
        colStyles={{ colExplain, colStatus, colActions, colLogs }}
        statusContent={
          selectedRound?.status === "voting" ? (
            <div style={{ fontSize: "0.85rem" }}>
              <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
                {selectedRound.voteCount}/{TEST_USERS.length} voted
              </div>
              <UserGrid
                type="voting"
                votes={getVotes()}
                onVote={onSimulateVote}
                disabled={loading}
                loading={loading}
              />
            </div>
          ) : (
            <div style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
              {selectedRound?.status === "revealed" || selectedRound?.status === "archived"
                ? "✓ Voting complete"
                : "Waiting for playlist phase..."}
            </div>
          )
        }
        actionsContent={
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <ActionBtn
              onClick={onSimulateAllVotes}
              disabled={loading || !selectedRound || selectedRound.status !== "voting"}
            >
              Vote All
            </ActionBtn>
          </div>
        }
      />

      <JumpButton
        fromPhase="voting"
        toPhase="reveal"
        onClick={onJumpToReveal}
        disabled={loading || !selectedRound || selectedRound.status !== "voting"}
        loading={loading && currentPhase === "voting"}
      />

      {/* REVEAL ROW */}
      <PhaseRow
        phase="reveal"
        title="5. REVEAL"
        explanation={PHASE_EXPLANATIONS.reveal}
        status={getPhaseStatusForRound("reveal")}
        logs={logs}
        colStyles={{ colExplain, colStatus, colActions, colLogs }}
        statusContent={
          <div style={{ fontSize: "0.85rem" }}>
            {selectedRound?.status === "revealed" ? (
              <>
                <div>✓ AI Story generated</div>
                <div>✓ Awards calculated</div>
                {selectedRound.revealRemainingMinutes && (
                  <div style={{ color: "#f59e0b", fontWeight: "bold" }}>
                    {selectedRound.revealRemainingMinutes} min remaining
                  </div>
                )}
              </>
            ) : (
              <span style={{ color: "var(--color-text-secondary)" }}>
                Waiting for all votes...
              </span>
            )}
          </div>
        }
        actionsContent={
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
              Reveal duration:
            </div>
            <input
              type="number"
              value={revealMinutes}
              onChange={(e) => setRevealMinutes(Number(e.target.value))}
              min={1}
              max={1440}
              style={{ width: "80px", padding: "0.25rem", fontSize: "0.8rem" }}
            />
            <span style={{ fontSize: "0.75rem" }}>minutes</span>
          </div>
        }
      />

      <JumpButton
        fromPhase="reveal"
        toPhase="archived"
        onClick={onJumpToArchive}
        disabled={loading || !selectedRound || selectedRound.status !== "revealed"}
        loading={loading && currentPhase === "reveal"}
      />

      {/* ARCHIVED ROW */}
      <PhaseRow
        phase="archived"
        title="6. ARCHIVED"
        explanation={PHASE_EXPLANATIONS.archived}
        status={getPhaseStatusForRound("archived")}
        logs={logs}
        colStyles={{ colExplain, colStatus, colActions, colLogs }}
        statusContent={
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            {selectedRound?.status === "archived"
              ? "✓ Round complete - full results visible"
              : "Waiting for reveal to end..."}
          </div>
        }
        actionsContent={
          selectedRound && (
            <ActionBtn onClick={onResetRound} disabled={loading} danger>
              Reset Round
            </ActionBtn>
          )
        }
      />

      {/* Round Tabs */}
      <div style={{ marginTop: "1.5rem" }}>
        <RoundTabs
          rounds={state?.rounds || []}
          selectedRoundId={selectedRoundId}
          onSelectRound={setSelectedRoundId}
          onAddRound={onCreateRound}
          onRunRound={onCompleteRound}
          loading={loading}
        />
      </div>
    </>
  );
}

// ============================================================================
// PhaseRow Component
// ============================================================================

interface PhaseRowProps {
  phase: PhaseType;
  title: string;
  explanation: { title: string; steps: string[] };
  status: PhaseStatus;
  logs: LogEntry[];
  colStyles: {
    colExplain: React.CSSProperties;
    colStatus: React.CSSProperties;
    colActions: React.CSSProperties;
    colLogs: React.CSSProperties;
  };
  statusContent: React.ReactNode;
  actionsContent: React.ReactNode;
}

function PhaseRow({
  phase,
  title,
  explanation,
  status,
  logs,
  colStyles,
  statusContent,
  actionsContent,
}: PhaseRowProps) {
  const { colExplain, colStatus, colActions, colLogs } = colStyles;

  const statusColors: Record<PhaseStatus, string> = {
    future: "var(--color-border)",
    current: "#3b82f6",
    complete: "#22c55e",
    past: "#86efac",
  };

  const phaseLogs = logs.filter(
    (e) => e.phase === phase || (!e.phase && isPhaseAction(e.action, phase))
  );

  return (
    <div
      style={{
        display: "flex",
        gap: "0.75rem",
        padding: "0.75rem",
        marginBottom: "0.25rem",
        backgroundColor: status === "current" ? "#eff6ff" : "var(--color-surface)",
        border: `2px solid ${statusColors[status]}`,
        borderRadius: "8px",
        borderStyle: status === "future" ? "dashed" : "solid",
        opacity: status === "future" ? 0.6 : 1,
      }}
    >
      {/* Explanation Column */}
      <div style={{ ...colExplain, fontSize: "0.75rem" }}>
        <div style={{ fontWeight: "bold", marginBottom: "0.35rem", color: statusColors[status] }}>
          {title}
        </div>
        <div style={{ color: "var(--color-text-secondary)" }}>
          {explanation.steps.map((step, i) => (
            <div key={i} style={{ marginBottom: "0.15rem" }}>{step}</div>
          ))}
        </div>
      </div>

      {/* Status Column */}
      <div style={{ ...colStatus, borderLeft: "1px solid var(--color-border)", paddingLeft: "0.75rem" }}>
        {statusContent}
      </div>

      {/* Actions Column */}
      <div style={{ ...colActions, borderLeft: "1px solid var(--color-border)", paddingLeft: "0.75rem" }}>
        {actionsContent}
      </div>

      {/* Logs Column */}
      <div style={{ ...colLogs, borderLeft: "1px solid var(--color-border)", paddingLeft: "0.75rem" }}>
        <div
          style={{
            maxHeight: "100px",
            overflowY: "auto",
            fontSize: "0.7rem",
            fontFamily: "monospace",
          }}
        >
          {phaseLogs.length === 0 ? (
            <span style={{ color: "var(--color-text-secondary)" }}>No activity</span>
          ) : (
            phaseLogs.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                style={{
                  color: entry.success ? "#22c55e" : "#ef4444",
                  marginBottom: "0.15rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {entry.success ? "✓" : "✗"} {entry.action}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to check if action belongs to phase
function isPhaseAction(action: string, phase: PhaseType): boolean {
  const phaseActions: Record<PhaseType, string[]> = {
    preseason: ["seed", "generate", "import", "export"],
    submission: ["round", "submit", "submission"],
    playlist: ["playlist", "links"],
    voting: ["vote", "voted"],
    reveal: ["reveal", "story", "award", "banner"],
    archived: ["archive", "complete", "reset"],
  };
  const actionLower = action.toLowerCase();
  return phaseActions[phase]?.some((a) => actionLower.includes(a)) ?? false;
}

// ============================================================================
// Action Button Helper
// ============================================================================

function ActionBtn({
  onClick,
  disabled,
  children,
  small,
  danger,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  small?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? "0.25rem 0.5rem" : "0.4rem 0.75rem",
        fontSize: small ? "0.75rem" : "0.8rem",
        border: "1px solid var(--color-border)",
        borderRadius: "4px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        backgroundColor: danger ? "#fee2e2" : "var(--color-surface)",
        color: danger ? "#dc2626" : "var(--color-text)",
      }}
    >
      {children}
    </button>
  );
}

// ============================================================================
// Season Summary Tab
// ============================================================================

function SeasonSummaryTab({ state }: { state: TestState | null }) {
  if (!state) {
    return (
      <Card style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>Loading...</p>
      </Card>
    );
  }

  const completedRounds = state.rounds.filter((r) => r.status === "archived").length;
  const activeRounds = state.rounds.filter((r) => r.status !== "archived").length;

  return (
    <div>
      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <MetricCard label="Total Rounds" value={state.rounds.length} subtext="This season" />
        <MetricCard
          label="Completed"
          value={completedRounds}
          subtext="Archived rounds"
          color="#22c55e"
        />
        <MetricCard
          label="Active"
          value={activeRounds}
          subtext="In progress"
          color="#f59e0b"
        />
        <MetricCard
          label="Competitors"
          value={state.competitors}
          subtext="Unique participants"
        />
      </div>

      {/* Rounds Table */}
      <Card>
        <h3 style={{ marginBottom: "1rem" }}>All Rounds</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Theme</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Submissions</th>
              <th style={thStyle}>Votes</th>
            </tr>
          </thead>
          <tbody>
            {state.rounds.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "var(--color-text-secondary)" }}>
                  No rounds yet
                </td>
              </tr>
            ) : (
              state.rounds.map((round, idx) => (
                <tr key={round.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={tdStyle}>{idx + 1}</td>
                  <td style={tdStyle}>{round.theme}</td>
                  <td style={tdStyle}>
                    <StatusBadge status={round.status} />
                  </td>
                  <td style={tdStyle}>{round.submissionCount}/{TEST_USERS.length}</td>
                  <td style={tdStyle}>{round.voteCount}/{TEST_USERS.length}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================================================
// Analytics Tab
// ============================================================================

interface AnalyticsTabProps {
  analytics: AnalyticsSummary | null;
  analyticsDays: number;
  setAnalyticsDays: (days: number) => void;
  loading: boolean;
  onRefresh: () => void;
  onExport: () => void;
}

function AnalyticsTab({
  analytics,
  analyticsDays,
  setAnalyticsDays,
  loading,
  onRefresh,
  onExport,
}: AnalyticsTabProps) {
  return (
    <div>
      {/* Controls */}
      <Card style={{ marginBottom: "1rem", padding: "0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <label>
              Time Range:{" "}
              <select
                value={analyticsDays}
                onChange={(e) => setAnalyticsDays(Number(e.target.value))}
                style={{ padding: "0.25rem" }}
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
              </select>
            </label>
            <Button
              onClick={onRefresh}
              disabled={loading}
              style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
            >
              Refresh
            </Button>
          </div>
          <Button onClick={onExport} disabled={loading}>
            Export (30 days)
          </Button>
        </div>
      </Card>

      {!analytics ? (
        <Card style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-secondary)" }}>Loading analytics...</p>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <MetricCard
              label="Total Runs"
              value={analytics.totalRuns}
              subtext={`${analytics.completedRuns} completed, ${analytics.failedRuns} failed`}
            />
            <MetricCard
              label="Success Rate"
              value={`${analytics.successRate.toFixed(1)}%`}
              subtext="Test runs completed successfully"
              color={
                analytics.successRate >= 80
                  ? "#22c55e"
                  : analytics.successRate >= 50
                  ? "#f59e0b"
                  : "#ef4444"
              }
            />
            <MetricCard
              label="Total Actions"
              value={analytics.totalActions}
              subtext={`${analytics.actionSuccessRate.toFixed(1)}% success rate`}
            />
            <MetricCard
              label="Avg Duration"
              value={formatDuration(analytics.avgRunDurationMs)}
              subtext={`Action avg: ${formatDuration(analytics.avgActionDurationMs)}`}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {/* Daily Trend */}
            <Card>
              <h3 style={{ marginBottom: "0.5rem" }}>Daily Trend</h3>
              {analytics.dailyTrend.length === 0 ? (
                <p style={{ color: "var(--color-text-secondary)" }}>No data</p>
              ) : (
                <div style={{ height: "200px", display: "flex", alignItems: "flex-end", gap: "4px" }}>
                  {analytics.dailyTrend.map((day) => {
                    const maxRuns = Math.max(...analytics.dailyTrend.map((d) => d.runs), 1);
                    const height = (day.runs / maxRuns) * 100;
                    return (
                      <div
                        key={day.date}
                        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: `${height}%`,
                            minHeight: "4px",
                            backgroundColor:
                              day.successRate >= 80
                                ? "#22c55e"
                                : day.successRate >= 50
                                ? "#f59e0b"
                                : "#ef4444",
                            borderRadius: "2px 2px 0 0",
                          }}
                          title={`${day.date}: ${day.runs} runs, ${day.successRate.toFixed(0)}% success`}
                        />
                        <span
                          style={{
                            fontSize: "0.7rem",
                            marginTop: "0.25rem",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {new Date(day.date).getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Actions by Type */}
            <Card>
              <h3 style={{ marginBottom: "0.5rem" }}>Actions by Type</h3>
              {Object.keys(analytics.actionsByType).length === 0 ? (
                <p style={{ color: "var(--color-text-secondary)" }}>No actions</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {Object.entries(analytics.actionsByType).map(([type, data]) => {
                    const successRate = data.total > 0 ? (data.success / data.total) * 100 : 0;
                    return (
                      <div key={type}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                          <span>{type}</span>
                          <span>
                            {data.total} ({successRate.toFixed(0)}%)
                          </span>
                        </div>
                        <div
                          style={{
                            height: "8px",
                            backgroundColor: "var(--color-border)",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${successRate}%`,
                              height: "100%",
                              backgroundColor:
                                successRate >= 80 ? "#22c55e" : successRate >= 50 ? "#f59e0b" : "#ef4444",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Top Errors */}
            <Card>
              <h3 style={{ marginBottom: "0.5rem" }}>Top Errors</h3>
              {analytics.topErrors.length === 0 ? (
                <p style={{ color: "var(--color-text-secondary)" }}>No errors</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {analytics.topErrors.map((err, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "0.5rem",
                        backgroundColor: "var(--color-surface-hover)",
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div style={{ color: "#ef4444", fontWeight: "bold" }}>{err.count}x</div>
                      <div style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{err.error}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Runs */}
            <Card>
              <h3 style={{ marginBottom: "0.5rem" }}>Recent Runs</h3>
              {analytics.recentRuns.length === 0 ? (
                <p style={{ color: "var(--color-text-secondary)" }}>No runs</p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {analytics.recentRuns.map((run) => (
                    <div
                      key={run.id}
                      style={{
                        padding: "0.5rem",
                        border: "1px solid var(--color-border)",
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "bold" }}>{run.theme || "Untitled"}</span>
                        <StatusBadge status={run.status} />
                      </div>
                      <div style={{ color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
                        {new Date(run.started_at).toLocaleString()} |{" "}
                        {run.successful_actions}/{run.total_actions} actions
                        {run.duration_ms && ` | ${formatDuration(run.duration_ms)}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Round Tabs Component
// ============================================================================

interface RoundTabsProps {
  rounds: RoundState[];
  selectedRoundId: string | null;
  onSelectRound: (id: string) => void;
  onAddRound: () => void;
  onRunRound: () => void;
  loading: boolean;
}

function RoundTabs({
  rounds,
  selectedRoundId,
  onSelectRound,
  onAddRound,
  onRunRound,
  loading,
}: RoundTabsProps) {
  return (
    <Card style={{ padding: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <span style={{ fontWeight: "bold", marginRight: "0.5rem" }}>Rounds:</span>
        {rounds.map((round, idx) => (
          <div
            key={round.id}
            onClick={() => onSelectRound(round.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              border: `2px solid ${selectedRoundId === round.id ? "var(--color-primary)" : "var(--color-border)"}`,
              borderRadius: "8px",
              cursor: "pointer",
              backgroundColor:
                selectedRoundId === round.id ? "var(--color-surface-hover)" : "var(--color-surface)",
            }}
          >
            <span>Round {idx + 1}</span>
            <StatusBadge status={round.status} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRunRound();
              }}
              disabled={loading || round.status === "archived"}
              style={{
                background: "none",
                border: "none",
                cursor: round.status === "archived" ? "not-allowed" : "pointer",
                fontSize: "1rem",
                opacity: round.status === "archived" ? 0.3 : 1,
              }}
              title="Auto-run round"
            >
              ▶
            </button>
          </div>
        ))}
        <button
          onClick={onAddRound}
          disabled={loading}
          style={{
            padding: "0.5rem 1rem",
            border: "2px dashed var(--color-border)",
            borderRadius: "8px",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          + Add Round
        </button>
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
        ▶ = Generate/Automate entire round (fills phases top to bottom)
      </div>
    </Card>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function TabButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "0.5rem 1rem",
        border: "none",
        borderBottom: active ? "3px solid var(--color-primary)" : "3px solid transparent",
        backgroundColor: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: active ? "bold" : "normal",
        color: disabled ? "var(--color-text-secondary)" : active ? "var(--color-primary)" : "var(--color-text)",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "#22c55e",
    voting: "#f59e0b",
    revealed: "#3b82f6",
    archived: "#6b7280",
    running: "#3b82f6",
    completed: "#22c55e",
    failed: "#ef4444",
    cancelled: "#6b7280",
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.125rem 0.5rem",
        borderRadius: "4px",
        backgroundColor: colors[status] || "#6b7280",
        color: "white",
        fontSize: "0.75rem",
        fontWeight: "bold",
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  color,
}: {
  label: string;
  value: string | number;
  subtext: string;
  color?: string;
}) {
  return (
    <Card style={{ padding: "1rem" }}>
      <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: color || "var(--color-text)" }}>
        {value}
      </div>
      <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
        {subtext}
      </div>
    </Card>
  );
}

function formatDuration(ms: number): string {
  if (!ms || ms === 0) return "0s";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

// ============================================================================
// Styles
// ============================================================================

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem",
  fontWeight: "bold",
  fontSize: "0.85rem",
};

const tdStyle: React.CSSProperties = {
  padding: "0.5rem",
  verticalAlign: "middle",
};
