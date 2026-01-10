/**
 * TEST-001: Test Dashboard Page
 *
 * Interactive test environment dashboard for simulating Music League round lifecycle.
 * Provides controls for creating rounds, simulating email events, and observing state changes.
 */

import { useState, useEffect, useCallback } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

// ============================================================================
// Types
// ============================================================================

interface RoundState {
  id: string;
  theme: string;
  status: "open" | "voting" | "revealed" | "archived";
  submissionCount: number;
  voteCount: number;
  revealRemainingMs?: number | null;
  revealRemainingMinutes?: number | null;
  hasCustomPulltab?: boolean;
  activity?: {
    submissions: string[];
    votes: string[];
  };
}

interface TestState {
  league: {
    id: string;
    name: string;
    seasonNumber: number;
    hasStory: boolean;
    storyRoundId: string | null;
  };
  rounds: RoundState[];
  members: Array<{ id: string; name: string; role: string }>;
  competitors: number;
  testUsers: Array<{ id: string; name: string }>;
}

interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  success: boolean;
  details?: string;
}

interface SimulationOptions {
  revealDurationMinutes?: number;
  useMockAI?: boolean;
}

// Test IDs matching the edge function
const TEST_LEAGUE_S2_ID = "00000000-0000-0000-0002-000000000002";
const TEST_USERS = [
  { id: "00000000-0000-0000-0000-000000000001", name: "Test Admin" },
  { id: "00000000-0000-0000-0000-000000000002", name: "Alice" },
  { id: "00000000-0000-0000-0000-000000000003", name: "Bob" },
  { id: "00000000-0000-0000-0000-000000000004", name: "Carol" },
  { id: "00000000-0000-0000-0000-000000000005", name: "Uncle Dave" },
];

const ROUND_THEMES = [
  "Songs That Make You Happy",
  "Cover Songs",
  "One-Hit Wonders",
  "Songs from Movies",
  "Deep Cuts",
  "Guilty Pleasures",
  "Summer Anthems",
];

// ============================================================================
// Component
// ============================================================================

export default function TestDashboardPage() {
  const { user } = useAuth();
  const [state, setState] = useState<TestState | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [newTheme, setNewTheme] = useState(ROUND_THEMES[0]);
  const [revealMinutes, setRevealMinutes] = useState(5);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Add log entry
  const addLog = useCallback((action: string, success: boolean, details?: string) => {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      success,
      details,
    };
    setLogs((prev) => [entry, ...prev].slice(0, 100));
  }, []);

  // Call test-factory edge function
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

  // Load current state
  const loadState = useCallback(async () => {
    const data = await callFactory("get-state", { leagueId: TEST_LEAGUE_S2_ID });
    if (data) {
      setState(data);
    }
  }, [callFactory]);

  // Initial load and auto-refresh
  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadState, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadState]);

  // Action handlers
  const handleSeedTestData = async () => {
    const { data, error } = await supabase.functions.invoke("seed-test-data", {
      body: { reset: true },
    });
    if (error) {
      addLog("seed-test-data", false, error.message);
    } else {
      addLog("seed-test-data", data.success, JSON.stringify(data, null, 2));
      await loadState();
    }
  };

  const handleCreateRound = async () => {
    const result = await callFactory("create-round", {
      leagueId: TEST_LEAGUE_S2_ID,
      theme: newTheme,
    });
    if (result) {
      await loadState();
      if (result.roundId) {
        setSelectedRound(result.roundId);
      }
    }
  };

  const handleSimulateSubmission = async (userName: string) => {
    if (!selectedRound) return;
    await callFactory("simulate-email", {
      eventType: "user_submitted",
      roundId: selectedRound,
      actorName: userName,
    });
    await loadState();
  };

  const handleSimulateAllSubmissions = async () => {
    if (!selectedRound) return;
    for (const user of TEST_USERS) {
      await callFactory("simulate-email", {
        eventType: "user_submitted",
        roundId: selectedRound,
        actorName: user.name,
      });
    }
    await loadState();
  };

  const handlePlaylistReady = async () => {
    if (!selectedRound) return;
    await callFactory("simulate-email", {
      eventType: "playlist_ready",
      roundId: selectedRound,
    });
    await loadState();
  };

  const handleSimulateVote = async (userName: string) => {
    if (!selectedRound) return;
    await callFactory("simulate-email", {
      eventType: "user_voted",
      roundId: selectedRound,
      actorName: userName,
    });
    await loadState();
  };

  const handleSimulateAllVotes = async () => {
    if (!selectedRound) return;
    for (const user of TEST_USERS) {
      await callFactory("simulate-email", {
        eventType: "user_voted",
        roundId: selectedRound,
        actorName: user.name,
      });
    }
    await loadState();
  };

  const handleVotesIn = async () => {
    if (!selectedRound) return;
    const options: SimulationOptions = {
      revealDurationMinutes: revealMinutes,
      useMockAI: true,
    };
    await callFactory("simulate-email", {
      eventType: "votes_in",
      roundId: selectedRound,
      options,
    });
    await loadState();
  };

  const handleAdvanceRound = async () => {
    if (!selectedRound) return;
    const options: SimulationOptions = {
      revealDurationMinutes: revealMinutes,
      useMockAI: true,
    };
    await callFactory("advance-round", {
      roundId: selectedRound,
      options,
    });
    await loadState();
  };

  const handleCompleteRound = async () => {
    const options: SimulationOptions = {
      revealDurationMinutes: revealMinutes,
      useMockAI: true,
    };
    await callFactory("complete-round", {
      leagueId: TEST_LEAGUE_S2_ID,
      theme: newTheme,
      userNames: TEST_USERS.map((u) => u.name),
      options,
    });
    await loadState();
  };

  const handleResetRound = async () => {
    if (!selectedRound) return;
    await callFactory("reset-round", {
      roundId: selectedRound,
    });
    await loadState();
  };

  const handleGenerateCSVs = async () => {
    const result = await callFactory("generate-csvs", { roundCount: 5 });
    if (result?.files) {
      // Download CSVs
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

  // Get selected round data
  const currentRound = state?.rounds?.find((r) => r.id === selectedRound);

  return (
    <div className="test-dashboard" style={{ padding: "1rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "1rem" }}>Test Dashboard (TEST-001)</h1>

      {/* Status Bar */}
      <Card style={{ marginBottom: "1rem", padding: "0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>League:</strong> {state?.league?.name || "Loading..."} (Season{" "}
            {state?.league?.seasonNumber})
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <label style={{ fontSize: "0.9rem" }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />{" "}
              Auto-refresh
            </label>
            <Button size="small" onClick={loadState} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Left Column: Display Panel */}
        <div>
          {/* Rounds List */}
          <Card style={{ marginBottom: "1rem" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>Rounds</h3>
            {state?.rounds?.length === 0 && (
              <p style={{ color: "var(--color-text-secondary)" }}>No rounds yet. Create one!</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {state?.rounds?.map((round) => (
                <div
                  key={round.id}
                  onClick={() => setSelectedRound(round.id)}
                  style={{
                    padding: "0.75rem",
                    border: `2px solid ${selectedRound === round.id ? "var(--color-primary)" : "var(--color-border)"}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedRound === round.id
                        ? "var(--color-surface-hover)"
                        : "var(--color-surface)",
                  }}
                >
                  <div style={{ fontWeight: "bold" }}>{round.theme}</div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem", fontSize: "0.9rem" }}>
                    <span>
                      Status: <StatusBadge status={round.status} />
                    </span>
                    <span>Submissions: {round.submissionCount}/5</span>
                    <span>Votes: {round.voteCount}/5</span>
                  </div>
                  {round.status === "revealed" && round.revealRemainingMinutes != null && (
                    <div style={{ marginTop: "0.25rem", color: "var(--color-warning)" }}>
                      Reveal expires in: {round.revealRemainingMinutes} min
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Selected Round Details */}
          {currentRound && (
            <Card style={{ marginBottom: "1rem" }}>
              <h3 style={{ marginBottom: "0.5rem" }}>Round: {currentRound.theme}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <strong>Submissions:</strong>
                  <ul style={{ margin: "0.25rem 0", paddingLeft: "1.5rem" }}>
                    {TEST_USERS.map((user) => (
                      <li
                        key={user.id}
                        style={{
                          color: currentRound.activity?.submissions.includes(user.name)
                            ? "var(--color-success)"
                            : "var(--color-text-secondary)",
                        }}
                      >
                        {user.name}{" "}
                        {currentRound.activity?.submissions.includes(user.name) ? "X" : "-"}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Votes:</strong>
                  <ul style={{ margin: "0.25rem 0", paddingLeft: "1.5rem" }}>
                    {TEST_USERS.map((user) => (
                      <li
                        key={user.id}
                        style={{
                          color: currentRound.activity?.votes.includes(user.name)
                            ? "var(--color-success)"
                            : "var(--color-text-secondary)",
                        }}
                      >
                        {user.name} {currentRound.activity?.votes.includes(user.name) ? "X" : "-"}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Log Viewer */}
          <Card>
            <h3 style={{ marginBottom: "0.5rem" }}>Action Log</h3>
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                fontSize: "0.85rem",
                fontFamily: "monospace",
              }}
            >
              {logs.length === 0 && (
                <p style={{ color: "var(--color-text-secondary)" }}>No actions yet.</p>
              )}
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: "0.25rem 0",
                    borderBottom: "1px solid var(--color-border)",
                    color: log.success ? "var(--color-success)" : "var(--color-error)",
                  }}
                >
                  <div>
                    [{new Date(log.timestamp).toLocaleTimeString()}] {log.action}:{" "}
                    {log.success ? "OK" : "FAIL"}
                  </div>
                  {log.details && (
                    <pre
                      style={{
                        margin: 0,
                        fontSize: "0.75rem",
                        whiteSpace: "pre-wrap",
                        maxHeight: "100px",
                        overflow: "auto",
                      }}
                    >
                      {log.details}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Control Panel */}
        <div>
          {/* Setup Section */}
          <Card style={{ marginBottom: "1rem" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>Setup</h3>
            <Button onClick={handleSeedTestData} disabled={loading} style={{ marginBottom: "0.5rem" }}>
              Seed Test Data (Reset & Create Users)
            </Button>
            <div style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
              Creates 5 test users, family group, leagues, and competitors.
            </div>
          </Card>

          {/* Create Round Section */}
          <Card style={{ marginBottom: "1rem" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>Create Round</h3>
            <div style={{ marginBottom: "0.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>Theme:</label>
              <select
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                style={{ width: "100%", padding: "0.5rem" }}
              >
                {ROUND_THEMES.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button onClick={handleCreateRound} disabled={loading}>
                Create Round
              </Button>
              <Button onClick={handleCompleteRound} disabled={loading} variant="secondary">
                Run Complete Round
              </Button>
            </div>
          </Card>

          {/* Simulate Events Section */}
          <Card style={{ marginBottom: "1rem" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>Simulate Events</h3>
            {!selectedRound && (
              <p style={{ color: "var(--color-text-secondary)" }}>Select a round first.</p>
            )}
            {selectedRound && currentRound && (
              <>
                {/* Submission Controls */}
                {currentRound.status === "open" && (
                  <div style={{ marginBottom: "1rem" }}>
                    <strong>Submissions:</strong>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.25rem" }}>
                      {TEST_USERS.map((user) => (
                        <Button
                          key={user.id}
                          size="small"
                          onClick={() => handleSimulateSubmission(user.name)}
                          disabled={loading || currentRound.activity?.submissions.includes(user.name)}
                        >
                          {user.name}
                        </Button>
                      ))}
                    </div>
                    <Button
                      onClick={handleSimulateAllSubmissions}
                      disabled={loading}
                      style={{ marginTop: "0.5rem" }}
                    >
                      All Submit
                    </Button>
                    <Button
                      onClick={handlePlaylistReady}
                      disabled={loading}
                      variant="primary"
                      style={{ marginLeft: "0.5rem" }}
                    >
                      Playlist Ready → Voting
                    </Button>
                  </div>
                )}

                {/* Voting Controls */}
                {currentRound.status === "voting" && (
                  <div style={{ marginBottom: "1rem" }}>
                    <strong>Votes:</strong>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.25rem" }}>
                      {TEST_USERS.map((user) => (
                        <Button
                          key={user.id}
                          size="small"
                          onClick={() => handleSimulateVote(user.name)}
                          disabled={loading || currentRound.activity?.votes.includes(user.name)}
                        >
                          {user.name}
                        </Button>
                      ))}
                    </div>
                    <Button onClick={handleSimulateAllVotes} disabled={loading} style={{ marginTop: "0.5rem" }}>
                      All Vote
                    </Button>
                    <Button
                      onClick={handleVotesIn}
                      disabled={loading}
                      variant="primary"
                      style={{ marginLeft: "0.5rem" }}
                    >
                      Votes In → Revealed
                    </Button>
                  </div>
                )}

                {/* Reveal Controls */}
                {currentRound.status === "revealed" && (
                  <div style={{ marginBottom: "1rem" }}>
                    <p>Round is in reveal period.</p>
                    <Button onClick={handleAdvanceRound} disabled={loading} variant="primary">
                      Archive Round
                    </Button>
                  </div>
                )}

                {/* Archived */}
                {currentRound.status === "archived" && (
                  <div style={{ marginBottom: "1rem" }}>
                    <p>Round is archived.</p>
                  </div>
                )}

                {/* Reset Button */}
                <div style={{ marginTop: "1rem", borderTop: "1px solid var(--color-border)", paddingTop: "0.5rem" }}>
                  <Button onClick={handleResetRound} disabled={loading} variant="danger">
                    Reset Round to Open
                  </Button>
                </div>
              </>
            )}
          </Card>

          {/* Options Section */}
          <Card style={{ marginBottom: "1rem" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>Options</h3>
            <div style={{ marginBottom: "0.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>
                Reveal Duration (minutes):
              </label>
              <input
                type="number"
                value={revealMinutes}
                onChange={(e) => setRevealMinutes(Number(e.target.value))}
                min={1}
                max={120}
                style={{ width: "100px", padding: "0.5rem" }}
              />
              <span style={{ marginLeft: "0.5rem", fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
                (Default: 120 min / 2 hours)
              </span>
            </div>
          </Card>

          {/* CSV Generation */}
          <Card>
            <h3 style={{ marginBottom: "0.5rem" }}>CSV Generation</h3>
            <Button onClick={handleGenerateCSVs} disabled={loading}>
              Generate & Download CSVs (5 rounds)
            </Button>
            <div style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
              Downloads: rounds.csv, submissions.csv, votes.csv, competitors.csv
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "#22c55e",
    voting: "#f59e0b",
    revealed: "#3b82f6",
    archived: "#6b7280",
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.125rem 0.5rem",
        borderRadius: "4px",
        backgroundColor: colors[status] || "#6b7280",
        color: "white",
        fontSize: "0.8rem",
        fontWeight: "bold",
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}
