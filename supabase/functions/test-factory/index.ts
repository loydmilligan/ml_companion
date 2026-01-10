/**
 * TEST-001: Test Factory Edge Function
 *
 * Main API handler for test data generation and simulation.
 * Provides endpoints for creating test rounds, simulating email events,
 * advancing round states, and generating CSV data.
 *
 * Endpoints:
 * POST /test-factory
 * Body: { action: string, ...params }
 *
 * Actions:
 * - create-round: Create a new test round
 * - simulate-email: Simulate an email event
 * - advance-round: Move round to next state
 * - generate-csvs: Generate all 4 CSV files
 * - get-state: Get current test environment state
 * - reset: Reset test environment
 */

import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  simulateRoundStart,
  simulateUserSubmitted,
  simulatePlaylistReady,
  simulateUserVoted,
  simulateVotesIn,
  simulateCompleteRound,
  type SimulationOptions,
  type SimulationResult,
} from "./email-simulator.ts";
import {
  generateAllCSVs,
  generateSeason,
  TEST_USERS,
  type GenerationOptions,
} from "./csv-generators.ts";
import { getMockAIResponse } from "./mock-ai-responses.ts";

// Test IDs (must match seed-test-data function)
const TEST_GROUP_ID = "00000000-0000-0000-0001-000000000001";
const TEST_LEAGUE_S1_ID = "00000000-0000-0000-0002-000000000001";
const TEST_LEAGUE_S2_ID = "00000000-0000-0000-0002-000000000002";

interface ActionResponse {
  success: boolean;
  action: string;
  data?: unknown;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const body = await req.json();
    const { action, ...params } = body;

    let response: ActionResponse;

    switch (action) {
      case "create-round":
        response = await handleCreateRound(supabase, params);
        break;

      case "simulate-email":
        response = await handleSimulateEmail(supabase, params);
        break;

      case "advance-round":
        response = await handleAdvanceRound(supabase, params);
        break;

      case "complete-round":
        response = await handleCompleteRound(supabase, params);
        break;

      case "generate-csvs":
        response = await handleGenerateCSVs(params);
        break;

      case "get-state":
        response = await handleGetState(supabase, params);
        break;

      case "get-rounds":
        response = await handleGetRounds(supabase, params);
        break;

      case "reset-round":
        response = await handleResetRound(supabase, params);
        break;

      default:
        response = {
          success: false,
          action: action || "unknown",
          error: `Unknown action: ${action}. Valid actions: create-round, simulate-email, advance-round, complete-round, generate-csvs, get-state, get-rounds, reset-round`,
        };
    }

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: response.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        action: "error",
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ============================================================================
// Action Handlers
// ============================================================================

/**
 * Create a new test round.
 */
async function handleCreateRound(
  supabase: ReturnType<typeof createClient>,
  params: {
    leagueId?: string;
    theme: string;
    options?: SimulationOptions;
  }
): Promise<ActionResponse> {
  const leagueId = params.leagueId || TEST_LEAGUE_S2_ID;
  const result = await simulateRoundStart(
    supabase,
    leagueId,
    params.theme,
    params.options || {}
  );

  return {
    success: result.success,
    action: "create-round",
    data: result,
    error: result.error,
  };
}

/**
 * Simulate an email event.
 */
async function handleSimulateEmail(
  supabase: ReturnType<typeof createClient>,
  params: {
    eventType: string;
    roundId: string;
    actorName?: string;
    options?: SimulationOptions;
  }
): Promise<ActionResponse> {
  const { eventType, roundId, actorName, options = {} } = params;

  let result: SimulationResult;

  switch (eventType) {
    case "round_start":
      // For round_start, we need leagueId and theme, not roundId
      return {
        success: false,
        action: "simulate-email",
        error: "Use 'create-round' action for round_start events",
      };

    case "user_submitted":
      if (!actorName) {
        return {
          success: false,
          action: "simulate-email",
          error: "actorName is required for user_submitted event",
        };
      }
      result = await simulateUserSubmitted(supabase, roundId, actorName, options);
      break;

    case "playlist_ready":
      result = await simulatePlaylistReady(supabase, roundId, options);
      break;

    case "user_voted":
      if (!actorName) {
        return {
          success: false,
          action: "simulate-email",
          error: "actorName is required for user_voted event",
        };
      }
      result = await simulateUserVoted(supabase, roundId, actorName, options);
      break;

    case "votes_in":
      result = await simulateVotesIn(supabase, roundId, options);
      break;

    default:
      return {
        success: false,
        action: "simulate-email",
        error: `Unknown event type: ${eventType}. Valid types: round_start, user_submitted, playlist_ready, user_voted, votes_in`,
      };
  }

  return {
    success: result.success,
    action: "simulate-email",
    data: result,
    error: result.error,
  };
}

/**
 * Advance a round to the next state.
 */
async function handleAdvanceRound(
  supabase: ReturnType<typeof createClient>,
  params: {
    roundId: string;
    targetStatus?: string;
    options?: SimulationOptions;
  }
): Promise<ActionResponse> {
  const { roundId, targetStatus, options = {} } = params;

  // Get current round
  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .select("id, status, theme, league_id")
    .eq("id", roundId)
    .single();

  if (roundError || !round) {
    return {
      success: false,
      action: "advance-round",
      error: `Round not found: ${roundId}`,
    };
  }

  const currentStatus = round.status;
  const nextStatus = targetStatus || getNextStatus(currentStatus);

  if (!nextStatus) {
    return {
      success: false,
      action: "advance-round",
      error: `Round is already at final status: ${currentStatus}`,
    };
  }

  // Execute the appropriate simulation based on target status
  let result: SimulationResult;

  switch (nextStatus) {
    case "voting":
      result = await simulatePlaylistReady(supabase, roundId, options);
      break;

    case "revealed":
      result = await simulateVotesIn(supabase, roundId, options);
      break;

    case "archived":
      // Direct update to archived
      const { error } = await supabase
        .from("rounds")
        .update({ status: "archived" })
        .eq("id", roundId);

      result = {
        eventType: "votes_in",
        success: !error,
        action: "updated_to_archived",
        roundId,
        error: error?.message,
        timestamp: new Date().toISOString(),
      };
      break;

    default:
      return {
        success: false,
        action: "advance-round",
        error: `Cannot advance to status: ${nextStatus}`,
      };
  }

  return {
    success: result.success,
    action: "advance-round",
    data: {
      previousStatus: currentStatus,
      newStatus: nextStatus,
      result,
    },
    error: result.error,
  };
}

/**
 * Run a complete round simulation with all users.
 */
async function handleCompleteRound(
  supabase: ReturnType<typeof createClient>,
  params: {
    leagueId?: string;
    theme: string;
    userNames?: string[];
    options?: SimulationOptions;
  }
): Promise<ActionResponse> {
  const leagueId = params.leagueId || TEST_LEAGUE_S2_ID;
  const userNames = params.userNames || TEST_USERS.map(u => u.name);
  const options = params.options || { useMockAI: true, revealDurationMinutes: 5 };

  const results = await simulateCompleteRound(
    supabase,
    leagueId,
    params.theme,
    userNames,
    options
  );

  const success = results.every(r => r.success);

  return {
    success,
    action: "complete-round",
    data: {
      leagueId,
      theme: params.theme,
      userCount: userNames.length,
      results,
    },
    error: success ? undefined : "Some simulation steps failed",
  };
}

/**
 * Generate CSV files for season import.
 */
async function handleGenerateCSVs(
  params: {
    roundCount?: number;
    options?: GenerationOptions;
  }
): Promise<ActionResponse> {
  const roundCount = params.roundCount || 5;
  const options = params.options || {};

  const csvs = generateAllCSVs(roundCount, TEST_USERS, options);

  return {
    success: true,
    action: "generate-csvs",
    data: {
      roundCount,
      files: {
        "rounds.csv": csvs.roundsCSV,
        "submissions.csv": csvs.submissionsCSV,
        "votes.csv": csvs.votesCSV,
        "competitors.csv": csvs.competitorsCSV,
      },
      summary: {
        roundsLines: csvs.roundsCSV.split("\n").length,
        submissionsLines: csvs.submissionsCSV.split("\n").length,
        votesLines: csvs.votesCSV.split("\n").length,
        competitorsLines: csvs.competitorsCSV.split("\n").length,
      },
    },
  };
}

/**
 * Get current test environment state.
 */
async function handleGetState(
  supabase: ReturnType<typeof createClient>,
  params: {
    leagueId?: string;
  }
): Promise<ActionResponse> {
  const leagueId = params.leagueId || TEST_LEAGUE_S2_ID;

  // Get league
  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select(`
      id, name, season_number, group_id,
      current_story_intro, current_round_riff,
      current_minigame_summary, current_story_round_id
    `)
    .eq("id", leagueId)
    .single();

  if (leagueError) {
    return {
      success: false,
      action: "get-state",
      error: `League not found: ${leagueId}`,
    };
  }

  // Get rounds
  const { data: rounds } = await supabase
    .from("rounds")
    .select(`
      id, theme, status, reveal_until,
      pulltab_image_light_url, pulltab_image_dark_url,
      test_reveal_duration_minutes, created_at
    `)
    .eq("league_id", leagueId)
    .order("created_at", { ascending: true });

  // Get group members
  const { data: members } = await supabase
    .from("group_members")
    .select(`
      member_id, role,
      profiles:member_id (id, display_name, email)
    `)
    .eq("group_id", league.group_id);

  // Get season competitors
  const { data: competitors } = await supabase
    .from("season_competitors")
    .select("external_id, name, profile_id")
    .eq("group_id", league.group_id);

  // Calculate round statistics
  const roundStats = rounds?.map(round => {
    const revealRemaining = round.reveal_until
      ? Math.max(0, new Date(round.reveal_until).getTime() - Date.now())
      : null;

    return {
      id: round.id,
      theme: round.theme,
      status: round.status,
      revealRemainingMs: revealRemaining,
      revealRemainingMinutes: revealRemaining ? Math.ceil(revealRemaining / 60000) : null,
      hasCustomPulltab: !!(round.pulltab_image_light_url || round.pulltab_image_dark_url),
    };
  });

  return {
    success: true,
    action: "get-state",
    data: {
      league: {
        id: league.id,
        name: league.name,
        seasonNumber: league.season_number,
        hasStory: !!league.current_story_intro,
        storyRoundId: league.current_story_round_id,
      },
      rounds: roundStats,
      members: members?.map(m => ({
        id: m.member_id,
        name: (m.profiles as { display_name: string })?.display_name,
        role: m.role,
      })),
      competitors: competitors?.length || 0,
      testUsers: TEST_USERS.map(u => ({ id: u.id, name: u.name })),
    },
  };
}

/**
 * Get all rounds for a league.
 */
async function handleGetRounds(
  supabase: ReturnType<typeof createClient>,
  params: {
    leagueId?: string;
  }
): Promise<ActionResponse> {
  const leagueId = params.leagueId || TEST_LEAGUE_S2_ID;

  const { data: rounds, error } = await supabase
    .from("rounds")
    .select(`
      id, theme, status, reveal_until,
      pulltab_image_light_url, pulltab_image_dark_url,
      test_reveal_duration_minutes, created_at
    `)
    .eq("league_id", leagueId)
    .order("created_at", { ascending: true });

  if (error) {
    return {
      success: false,
      action: "get-rounds",
      error: error.message,
    };
  }

  // Get activity for each round
  const roundsWithActivity = await Promise.all(
    (rounds || []).map(async (round) => {
      const { data: activity } = await supabase
        .from("round_user_activity")
        .select("actor_name, activity_type, action_at")
        .eq("round_id", round.id);

      const submissions = activity?.filter(a => a.activity_type === "submitted") || [];
      const votes = activity?.filter(a => a.activity_type === "voted") || [];

      return {
        ...round,
        submissionCount: submissions.length,
        voteCount: votes.length,
        activity: {
          submissions: submissions.map(s => s.actor_name),
          votes: votes.map(v => v.actor_name),
        },
      };
    })
  );

  return {
    success: true,
    action: "get-rounds",
    data: {
      leagueId,
      rounds: roundsWithActivity,
    },
  };
}

/**
 * Reset a specific round to a given state.
 */
async function handleResetRound(
  supabase: ReturnType<typeof createClient>,
  params: {
    roundId: string;
    toStatus?: string;
  }
): Promise<ActionResponse> {
  const { roundId, toStatus = "open" } = params;

  // Delete activity for this round
  await supabase
    .from("round_user_activity")
    .delete()
    .eq("round_id", roundId);

  // Reset round status
  const updates: Record<string, unknown> = {
    status: toStatus,
    reveal_until: null,
    test_reveal_duration_minutes: null,
  };

  if (toStatus === "open") {
    updates.pulltab_image_light_url = null;
    updates.pulltab_image_dark_url = null;
  }

  const { error } = await supabase
    .from("rounds")
    .update(updates)
    .eq("id", roundId);

  if (error) {
    return {
      success: false,
      action: "reset-round",
      error: error.message,
    };
  }

  return {
    success: true,
    action: "reset-round",
    data: {
      roundId,
      newStatus: toStatus,
      activityCleared: true,
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getNextStatus(currentStatus: string): string | null {
  const statusOrder = ["open", "voting", "revealed", "archived"];
  const currentIndex = statusOrder.indexOf(currentStatus);

  if (currentIndex === -1 || currentIndex === statusOrder.length - 1) {
    return null;
  }

  return statusOrder[currentIndex + 1];
}
