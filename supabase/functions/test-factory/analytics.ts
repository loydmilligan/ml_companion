/**
 * TEST-001: Analytics Recording & Retrieval
 *
 * Tracks test run metrics for comprehensive analytics dashboard.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// Types
// ============================================================================

export interface TestRun {
  id: string;
  started_at: string;
  completed_at?: string;
  status: "running" | "completed" | "failed" | "cancelled";
  league_id?: string;
  round_id?: string;
  theme?: string;
  total_actions: number;
  successful_actions: number;
  failed_actions: number;
  duration_ms?: number;
  reveal_duration_minutes?: number;
  user_count?: number;
  last_error?: string;
  error_count: number;
}

export interface TestAction {
  id: string;
  test_run_id: string;
  action_type: string;
  action_params?: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  success?: boolean;
  result?: unknown;
  error?: string;
  sequence_number: number;
}

export interface DailyStats {
  date: string;
  total_runs: number;
  completed_runs: number;
  failed_runs: number;
  total_actions: number;
  successful_actions: number;
  failed_actions: number;
  avg_run_duration_ms?: number;
  avg_action_duration_ms?: number;
  action_type_counts: Record<string, number>;
  error_counts: Record<string, number>;
}

export interface AnalyticsSummary {
  // Current period
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  successRate: number;

  // Action breakdown
  totalActions: number;
  actionSuccessRate: number;
  actionsByType: Record<string, { total: number; success: number; avgDurationMs: number }>;

  // Timing
  avgRunDurationMs: number;
  avgActionDurationMs: number;

  // Trends (last 7 days)
  dailyTrend: Array<{
    date: string;
    runs: number;
    successRate: number;
    avgDuration: number;
  }>;

  // Errors
  topErrors: Array<{ error: string; count: number }>;

  // Recent runs
  recentRuns: TestRun[];
}

// ============================================================================
// Test Run Management
// ============================================================================

let currentSequence = 0;

/**
 * Start a new test run and return its ID.
 */
export async function startTestRun(
  supabase: SupabaseClient,
  params: {
    leagueId?: string;
    theme?: string;
    revealDurationMinutes?: number;
    userCount?: number;
  }
): Promise<string> {
  currentSequence = 0;

  const { data, error } = await supabase
    .from("test_runs")
    .insert({
      league_id: params.leagueId,
      theme: params.theme,
      reveal_duration_minutes: params.revealDurationMinutes,
      user_count: params.userCount,
      status: "running",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[Analytics] Failed to start test run:", error);
    throw error;
  }

  return data.id;
}

/**
 * Record an action within a test run.
 */
export async function recordAction(
  supabase: SupabaseClient,
  testRunId: string,
  actionType: string,
  actionParams: Record<string, unknown>,
  executor: () => Promise<{ success: boolean; data?: unknown; error?: string }>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  currentSequence++;
  const startTime = Date.now();

  // Insert action record
  const { data: actionRecord, error: insertError } = await supabase
    .from("test_actions")
    .insert({
      test_run_id: testRunId,
      action_type: actionType,
      action_params: actionParams,
      sequence_number: currentSequence,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[Analytics] Failed to record action start:", insertError);
  }

  // Execute the action
  let result: { success: boolean; data?: unknown; error?: string };
  try {
    result = await executor();
  } catch (err) {
    result = { success: false, error: String(err) };
  }

  const endTime = Date.now();
  const durationMs = endTime - startTime;

  // Update action with results
  if (actionRecord) {
    await supabase
      .from("test_actions")
      .update({
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        success: result.success,
        result: result.data,
        error: result.error,
      })
      .eq("id", actionRecord.id);
  }

  // Update test run counters
  await supabase.rpc("increment_test_run_counters", {
    run_id: testRunId,
    is_success: result.success,
    action_error: result.error,
  }).catch(() => {
    // Fallback if RPC doesn't exist
    supabase
      .from("test_runs")
      .update({
        total_actions: currentSequence,
        successful_actions: result.success ? currentSequence : currentSequence - 1,
        failed_actions: result.success ? 0 : 1,
        last_error: result.error,
        error_count: result.success ? 0 : 1,
      })
      .eq("id", testRunId);
  });

  return result;
}

/**
 * Complete a test run.
 */
export async function completeTestRun(
  supabase: SupabaseClient,
  testRunId: string,
  roundId?: string,
  failed = false
): Promise<void> {
  // Get run start time for duration calculation
  const { data: run } = await supabase
    .from("test_runs")
    .select("started_at, total_actions, successful_actions, failed_actions")
    .eq("id", testRunId)
    .single();

  const durationMs = run
    ? Date.now() - new Date(run.started_at).getTime()
    : undefined;

  await supabase
    .from("test_runs")
    .update({
      completed_at: new Date().toISOString(),
      status: failed ? "failed" : "completed",
      round_id: roundId,
      duration_ms: durationMs,
    })
    .eq("id", testRunId);
}

// ============================================================================
// Analytics Retrieval
// ============================================================================

/**
 * Get comprehensive analytics summary.
 */
export async function getAnalyticsSummary(
  supabase: SupabaseClient,
  days = 7
): Promise<AnalyticsSummary> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  // Get test runs for the period
  const { data: runs } = await supabase
    .from("test_runs")
    .select("*")
    .gte("started_at", startDateStr)
    .order("started_at", { ascending: false });

  // Get actions for the period
  const { data: actions } = await supabase
    .from("test_actions")
    .select("*")
    .gte("started_at", startDateStr);

  // Get daily stats
  const { data: dailyStats } = await supabase
    .from("test_daily_stats")
    .select("*")
    .gte("date", startDate.toISOString().split("T")[0])
    .order("date", { ascending: true });

  // Calculate summary
  const totalRuns = runs?.length || 0;
  const completedRuns = runs?.filter(r => r.status === "completed").length || 0;
  const failedRuns = runs?.filter(r => r.status === "failed").length || 0;

  const totalActions = actions?.length || 0;
  const successfulActions = actions?.filter(a => a.success).length || 0;

  // Action breakdown by type
  const actionsByType: Record<string, { total: number; success: number; avgDurationMs: number }> = {};
  for (const action of actions || []) {
    if (!actionsByType[action.action_type]) {
      actionsByType[action.action_type] = { total: 0, success: 0, avgDurationMs: 0 };
    }
    actionsByType[action.action_type].total++;
    if (action.success) actionsByType[action.action_type].success++;
    if (action.duration_ms) {
      const current = actionsByType[action.action_type];
      current.avgDurationMs = (current.avgDurationMs * (current.total - 1) + action.duration_ms) / current.total;
    }
  }

  // Calculate averages
  const runsWithDuration = runs?.filter(r => r.duration_ms) || [];
  const avgRunDurationMs = runsWithDuration.length > 0
    ? runsWithDuration.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / runsWithDuration.length
    : 0;

  const actionsWithDuration = actions?.filter(a => a.duration_ms) || [];
  const avgActionDurationMs = actionsWithDuration.length > 0
    ? actionsWithDuration.reduce((sum, a) => sum + (a.duration_ms || 0), 0) / actionsWithDuration.length
    : 0;

  // Daily trend
  const dailyTrend = (dailyStats || []).map(d => ({
    date: d.date,
    runs: d.total_runs,
    successRate: d.total_runs > 0 ? (d.completed_runs / d.total_runs) * 100 : 0,
    avgDuration: d.avg_run_duration_ms || 0,
  }));

  // Top errors
  const errorCounts: Record<string, number> = {};
  for (const action of actions || []) {
    if (action.error) {
      const shortError = action.error.substring(0, 100);
      errorCounts[shortError] = (errorCounts[shortError] || 0) + 1;
    }
  }
  const topErrors = Object.entries(errorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([error, count]) => ({ error, count }));

  // Recent runs (last 10)
  const recentRuns = (runs || []).slice(0, 10) as TestRun[];

  return {
    totalRuns,
    completedRuns,
    failedRuns,
    successRate: totalRuns > 0 ? (completedRuns / totalRuns) * 100 : 0,
    totalActions,
    actionSuccessRate: totalActions > 0 ? (successfulActions / totalActions) * 100 : 0,
    actionsByType,
    avgRunDurationMs,
    avgActionDurationMs,
    dailyTrend,
    topErrors,
    recentRuns,
  };
}

/**
 * Get test runs with optional filtering.
 */
export async function getTestRuns(
  supabase: SupabaseClient,
  options: {
    limit?: number;
    status?: string;
    leagueId?: string;
  } = {}
): Promise<TestRun[]> {
  let query = supabase
    .from("test_runs")
    .select("*")
    .order("started_at", { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.status) {
    query = query.eq("status", options.status);
  }
  if (options.leagueId) {
    query = query.eq("league_id", options.leagueId);
  }

  const { data } = await query;
  return (data || []) as TestRun[];
}

/**
 * Get actions for a specific test run.
 */
export async function getTestRunActions(
  supabase: SupabaseClient,
  testRunId: string
): Promise<TestAction[]> {
  const { data } = await supabase
    .from("test_actions")
    .select("*")
    .eq("test_run_id", testRunId)
    .order("sequence_number", { ascending: true });

  return (data || []) as TestAction[];
}

/**
 * Export analytics data as JSON.
 */
export async function exportAnalytics(
  supabase: SupabaseClient,
  days = 30
): Promise<{
  exportedAt: string;
  period: { start: string; end: string };
  summary: AnalyticsSummary;
  runs: TestRun[];
  actions: TestAction[];
}> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const summary = await getAnalyticsSummary(supabase, days);

  const { data: runs } = await supabase
    .from("test_runs")
    .select("*")
    .gte("started_at", startDate.toISOString())
    .order("started_at", { ascending: false });

  const { data: actions } = await supabase
    .from("test_actions")
    .select("*")
    .gte("started_at", startDate.toISOString())
    .order("started_at", { ascending: false });

  return {
    exportedAt: new Date().toISOString(),
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    summary,
    runs: (runs || []) as TestRun[],
    actions: (actions || []) as TestAction[],
  };
}
