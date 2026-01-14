/**
 * TEST-001: Email Event Simulator
 *
 * Simulates the 5 email event types by directly executing the same actions
 * that would normally be triggered by email processing.
 *
 * This exercises the real code paths without needing actual emails.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getMockAIResponse } from "./mock-ai-responses.ts";
import { getRandomSongs, getSpotifyLink, type SampleSong } from "./sample-songs.ts";

// Track which songs have been used in the current round to avoid duplicates
const usedSongsPerRound: Map<string, Set<string>> = new Map();

export type EmailEventType =
  | "round_start"
  | "playlist_ready"
  | "user_submitted"
  | "user_voted"
  | "votes_in";

export interface SimulationResult {
  eventType: EmailEventType;
  success: boolean;
  action: string;
  roundId?: string;
  error?: string;
  timestamp: string;
}

export interface SimulationOptions {
  /** Override the 2-hour reveal period to this many minutes */
  revealDurationMinutes?: number;
  /** Skip AI story generation (use mock instead) */
  useMockAI?: boolean;
  /** Skip push notifications */
  skipPushNotifications?: boolean;
  /** Skip Spotify ingestion */
  skipSpotifyIngestion?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function findLeague(supabase: SupabaseClient, leagueId: string) {
  const { data, error } = await supabase
    .from("leagues")
    .select("id, group_id, name, season_number, current_story_round_id")
    .eq("id", leagueId)
    .single();

  if (error || !data) return null;
  return data;
}

async function findRound(supabase: SupabaseClient, roundId: string) {
  const { data, error } = await supabase
    .from("rounds")
    .select("id, league_id, theme, status, reveal_until")
    .eq("id", roundId)
    .single();

  if (error || !data) return null;
  return data;
}

async function findActiveRound(supabase: SupabaseClient, leagueId: string) {
  const { data } = await supabase
    .from("rounds")
    .select("id, league_id, theme, status, reveal_until")
    .eq("league_id", leagueId)
    .in("status", ["open", "voting"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data || null;
}

async function findCompetitor(
  supabase: SupabaseClient,
  groupId: string,
  actorName: string
) {
  const { data } = await supabase
    .from("season_competitors")
    .select("id, name, profile_id")
    .eq("group_id", groupId)
    .ilike("name", actorName)
    .limit(1)
    .single();

  return data || null;
}

function log(message: string, data?: unknown) {
  console.log(`[EmailSimulator] ${message}`, data ? JSON.stringify(data) : "");
}

/**
 * Get a unique song for a round (no duplicates within same round)
 */
function getUniqueSongForRound(roundId: string): SampleSong | null {
  if (!usedSongsPerRound.has(roundId)) {
    usedSongsPerRound.set(roundId, new Set());
  }
  const usedSongs = usedSongsPerRound.get(roundId)!;

  // Get random songs and find one that hasn't been used
  const songs = getRandomSongs(20);
  for (const song of songs) {
    if (!usedSongs.has(song.uri)) {
      usedSongs.add(song.uri);
      return song;
    }
  }

  // Fallback: get more songs if all 20 were used
  const moreSongs = getRandomSongs(50);
  for (const song of moreSongs) {
    if (!usedSongs.has(song.uri)) {
      usedSongs.add(song.uri);
      return song;
    }
  }

  return null;
}

// ============================================================================
// Event Simulators
// ============================================================================

/**
 * Simulate round_start event.
 * Creates a new round with status "open" or updates existing round.
 */
export async function simulateRoundStart(
  supabase: SupabaseClient,
  leagueId: string,
  roundTheme: string,
  options: SimulationOptions = {}
): Promise<SimulationResult> {
  log("Simulating round_start", { leagueId, roundTheme });

  const league = await findLeague(supabase, leagueId);
  if (!league) {
    return {
      eventType: "round_start",
      success: false,
      action: "skip",
      error: "League not found",
      timestamp: new Date().toISOString(),
    };
  }

  // Check if round already exists
  const { data: existingRound } = await supabase
    .from("rounds")
    .select("id, status")
    .eq("league_id", leagueId)
    .ilike("theme", roundTheme)
    .limit(1)
    .single();

  if (existingRound) {
    if (existingRound.status !== "open") {
      await supabase
        .from("rounds")
        .update({ status: "open" })
        .eq("id", existingRound.id);
      return {
        eventType: "round_start",
        success: true,
        action: "updated_status_to_open",
        roundId: existingRound.id,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      eventType: "round_start",
      success: true,
      action: "round_already_exists",
      roundId: existingRound.id,
      timestamp: new Date().toISOString(),
    };
  }

  // Create new round
  const { data: newRound, error } = await supabase
    .from("rounds")
    .insert({
      league_id: leagueId,
      theme: roundTheme,
      status: "open",
    })
    .select()
    .single();

  if (error || !newRound) {
    return {
      eventType: "round_start",
      success: false,
      action: "create_round_failed",
      error: error?.message,
      timestamp: new Date().toISOString(),
    };
  }

  log("Created round", { roundId: newRound.id, theme: roundTheme });

  return {
    eventType: "round_start",
    success: true,
    action: "created_round",
    roundId: newRound.id,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Simulate user_submitted event.
 * Creates actual submission with song data AND records activity.
 */
export async function simulateUserSubmitted(
  supabase: SupabaseClient,
  roundId: string,
  actorName: string,
  options: SimulationOptions = {}
): Promise<SimulationResult> {
  log("Simulating user_submitted", { roundId, actorName });

  const round = await findRound(supabase, roundId);
  if (!round) {
    return {
      eventType: "user_submitted",
      success: false,
      action: "skip",
      error: "Round not found",
      timestamp: new Date().toISOString(),
    };
  }

  const league = await findLeague(supabase, round.league_id);
  if (!league) {
    return {
      eventType: "user_submitted",
      success: false,
      action: "skip",
      error: "League not found",
      timestamp: new Date().toISOString(),
    };
  }

  // Find competitor to get profile_id
  const competitor = await findCompetitor(supabase, league.group_id, actorName);

  // Get a unique song for this submission
  const song = getUniqueSongForRound(roundId);
  if (!song) {
    return {
      eventType: "user_submitted",
      success: false,
      action: "no_songs_available",
      roundId,
      error: "No unique songs available for this round",
      timestamp: new Date().toISOString(),
    };
  }

  // Create the actual submission with song data
  const spotifyLink = getSpotifyLink(song.uri);

  const { error: submissionError } = await supabase.from("submissions").upsert(
    {
      round_id: roundId,
      submitter_name: actorName,
      profile_id: competitor?.profile_id || null,
      title: song.title,
      artist: song.artist,
      link: spotifyLink,
      source_uri: song.uri,
      artwork_url: `https://via.placeholder.com/300x300.png?text=${encodeURIComponent(song.title.slice(0, 15))}`,
      created_at: new Date().toISOString(),
    },
    {
      onConflict: "round_id,source_uri",
    }
  );

  if (submissionError) {
    log("Failed to create submission", { error: submissionError.message });
    return {
      eventType: "user_submitted",
      success: false,
      action: "create_submission_failed",
      roundId,
      error: submissionError.message,
      timestamp: new Date().toISOString(),
    };
  }

  // Insert activity record
  const { error: activityError } = await supabase.from("round_user_activity").upsert(
    {
      round_id: roundId,
      actor_name: actorName,
      profile_id: competitor?.profile_id || null,
      activity_type: "submitted",
      event_id: `sim-${Date.now()}`,
      action_at: new Date().toISOString(),
    },
    {
      onConflict: "round_id,actor_name,activity_type",
    }
  );

  if (activityError) {
    log("Failed to record activity", { error: activityError.message });
    // Don't fail the whole operation - submission was created
  }

  log("Created submission", { roundId, actorName, song: song.title });

  return {
    eventType: "user_submitted",
    success: true,
    action: "created_submission",
    roundId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Simulate playlist_ready event.
 * Transitions round to voting phase.
 */
export async function simulatePlaylistReady(
  supabase: SupabaseClient,
  roundId: string,
  options: SimulationOptions = {}
): Promise<SimulationResult> {
  log("Simulating playlist_ready", { roundId });

  const round = await findRound(supabase, roundId);
  if (!round) {
    return {
      eventType: "playlist_ready",
      success: false,
      action: "skip",
      error: "Round not found",
      timestamp: new Date().toISOString(),
    };
  }

  // Update round status to voting
  const { error } = await supabase
    .from("rounds")
    .update({ status: "voting" })
    .eq("id", roundId);

  if (error) {
    return {
      eventType: "playlist_ready",
      success: false,
      action: "update_failed",
      roundId,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  // Note: In test mode, we skip actual Spotify ingestion
  // The submissions should already be populated from CSV import
  if (!options.skipSpotifyIngestion) {
    log("Spotify ingestion skipped (test mode)", { roundId });
  }

  log("Updated round to voting", { roundId });

  return {
    eventType: "playlist_ready",
    success: true,
    action: "updated_to_voting",
    roundId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Simulate user_voted event.
 * Records user voting activity.
 */
export async function simulateUserVoted(
  supabase: SupabaseClient,
  roundId: string,
  actorName: string,
  options: SimulationOptions = {}
): Promise<SimulationResult> {
  log("Simulating user_voted", { roundId, actorName });

  const round = await findRound(supabase, roundId);
  if (!round) {
    return {
      eventType: "user_voted",
      success: false,
      action: "skip",
      error: "Round not found",
      timestamp: new Date().toISOString(),
    };
  }

  const league = await findLeague(supabase, round.league_id);
  if (!league) {
    return {
      eventType: "user_voted",
      success: false,
      action: "skip",
      error: "League not found",
      timestamp: new Date().toISOString(),
    };
  }

  // Find competitor to get profile_id
  const competitor = await findCompetitor(supabase, league.group_id, actorName);

  // Insert activity record
  const { error } = await supabase.from("round_user_activity").upsert(
    {
      round_id: roundId,
      actor_name: actorName,
      profile_id: competitor?.profile_id || null,
      activity_type: "voted",
      event_id: `sim-${Date.now()}`,
      action_at: new Date().toISOString(),
    },
    {
      onConflict: "round_id,actor_name,activity_type",
    }
  );

  if (error) {
    return {
      eventType: "user_voted",
      success: false,
      action: "insert_activity_failed",
      roundId,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  log("Recorded vote", { roundId, actorName });

  return {
    eventType: "user_voted",
    success: true,
    action: "recorded_vote",
    roundId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Simulate votes_in event.
 * Transitions round to revealed, sets reveal timer, triggers AI story.
 */
export async function simulateVotesIn(
  supabase: SupabaseClient,
  roundId: string,
  options: SimulationOptions = {}
): Promise<SimulationResult> {
  log("Simulating votes_in", { roundId, options });

  const round = await findRound(supabase, roundId);
  if (!round) {
    return {
      eventType: "votes_in",
      success: false,
      action: "skip",
      error: "Round not found",
      timestamp: new Date().toISOString(),
    };
  }

  const league = await findLeague(supabase, round.league_id);
  if (!league) {
    return {
      eventType: "votes_in",
      success: false,
      action: "skip",
      error: "League not found",
      timestamp: new Date().toISOString(),
    };
  }

  // Calculate reveal_until based on options
  const revealDuration = options.revealDurationMinutes ?? 120; // Default 2 hours
  const revealUntil = new Date(
    Date.now() + revealDuration * 60 * 1000
  ).toISOString();

  // Update round status and reveal timer
  const { error } = await supabase
    .from("rounds")
    .update({
      status: "revealed",
      reveal_until: revealUntil,
      test_reveal_duration_minutes: options.revealDurationMinutes ?? null,
    })
    .eq("id", roundId);

  if (error) {
    return {
      eventType: "votes_in",
      success: false,
      action: "update_failed",
      roundId,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  log("Updated round to revealed", { roundId, revealUntil });

  // Use mock AI response instead of calling real API
  if (options.useMockAI !== false) {
    const mockResponse = getMockAIResponse(round.theme);

    await supabase.from("leagues").update({
      current_story_intro: mockResponse.season_intro,
      current_round_riff: mockResponse.round_two_riff,
      current_minigame_summary: mockResponse.minigame_summary,
      current_story_updated_at: new Date().toISOString(),
      current_story_round_id: roundId,
    }).eq("id", league.id);

    log("Applied mock AI story", { leagueId: league.id });
  }

  return {
    eventType: "votes_in",
    success: true,
    action: "updated_to_revealed",
    roundId,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Batch Simulation
// ============================================================================

/**
 * Simulate a complete round flow from start to revealed.
 */
export async function simulateCompleteRound(
  supabase: SupabaseClient,
  leagueId: string,
  roundTheme: string,
  userNames: string[],
  options: SimulationOptions = {}
): Promise<SimulationResult[]> {
  const results: SimulationResult[] = [];

  // 1. Round start
  const startResult = await simulateRoundStart(supabase, leagueId, roundTheme, options);
  results.push(startResult);
  if (!startResult.success || !startResult.roundId) {
    return results;
  }
  const roundId = startResult.roundId;

  // 2. All users submit
  for (const userName of userNames) {
    const submitResult = await simulateUserSubmitted(supabase, roundId, userName, options);
    results.push(submitResult);
  }

  // 3. Playlist ready
  const playlistResult = await simulatePlaylistReady(supabase, roundId, options);
  results.push(playlistResult);

  // 4. All users vote
  for (const userName of userNames) {
    const voteResult = await simulateUserVoted(supabase, roundId, userName, options);
    results.push(voteResult);
  }

  // 5. Votes in
  const votesInResult = await simulateVotesIn(supabase, roundId, options);
  results.push(votesInResult);

  return results;
}
