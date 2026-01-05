import { corsHeaders } from "../_shared/cors.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface EmailEvent {
  id: string;
  event_type: "round_start" | "playlist_ready" | "votes_in" | "user_submitted" | "user_voted";
  league_name: string;
  round_name: string | null;
  actor_name: string | null;
  playlist_url: string | null;
  received_at: string | null;
}

interface ProcessResult {
  event_id: string;
  event_type: string;
  success: boolean;
  action: string;
  error?: string;
}

/**
 * Find a league by name
 */
async function findLeague(supabase: SupabaseClient, leagueName: string) {
  const { data, error } = await supabase
    .from("leagues")
    .select("id, group_id, name")
    .ilike("name", leagueName)
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Find a round by league and theme
 */
async function findRound(supabase: SupabaseClient, leagueId: string, theme: string) {
  const { data, error } = await supabase
    .from("rounds")
    .select("id, status, theme, league_id")
    .eq("league_id", leagueId)
    .ilike("theme", theme)
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Find the current active round for a league (most recent by round_number or created_at)
 */
async function findActiveRound(supabase: SupabaseClient, leagueId: string) {
  const { data, error } = await supabase
    .from("rounds")
    .select("id, status, theme, league_id")
    .eq("league_id", leagueId)
    .in("status", ["open", "voting"])
    .order("round_number", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Find competitor by name to get profile_id
 */
async function findCompetitor(supabase: SupabaseClient, groupId: string, actorName: string) {
  const { data, error } = await supabase
    .from("season_competitors")
    .select("id, profile_id, name")
    .eq("group_id", groupId)
    .ilike("name", actorName)
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Send push notification to a group
 */
async function sendPushNotification(
  supabase: SupabaseClient,
  supabaseUrl: string,
  serviceKey: string,
  groupId: string,
  notificationType: string,
  title: string,
  body: string
) {
  try {
    // Call the send-push-notification edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        notification_type: notificationType,
        title,
        body,
        group_id: groupId,
      }),
    });

    if (!response.ok) {
      console.error("Push notification failed:", await response.text());
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

/**
 * Trigger Spotify playlist ingestion
 */
async function triggerSpotifyIngestion(
  supabaseUrl: string,
  serviceKey: string,
  playlistUrl: string,
  roundId: string
) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/ingest-spotify-playlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        playlist_url: playlistUrl,
        round_id: roundId,
      }),
    });

    if (!response.ok) {
      console.error("Spotify ingestion failed:", await response.text());
      return false;
    }

    const result = await response.json();
    console.log("Spotify ingestion result:", result);
    return true;
  } catch (error) {
    console.error("Error triggering Spotify ingestion:", error);
    return false;
  }
}

/**
 * Process round_start event
 */
async function processRoundStart(
  supabase: SupabaseClient,
  supabaseUrl: string,
  serviceKey: string,
  event: EmailEvent
): Promise<ProcessResult> {
  const league = await findLeague(supabase, event.league_name);
  if (!league) {
    return { event_id: event.id, event_type: event.event_type, success: false, action: "skip", error: "League not found" };
  }

  // Check if round already exists
  if (event.round_name) {
    const existingRound = await findRound(supabase, league.id, event.round_name);
    if (existingRound) {
      // Round exists - just update status if needed
      if (existingRound.status !== "open") {
        await supabase
          .from("rounds")
          .update({ status: "open" })
          .eq("id", existingRound.id);
        return { event_id: event.id, event_type: event.event_type, success: true, action: "updated_status_to_open" };
      }
      return { event_id: event.id, event_type: event.event_type, success: true, action: "round_already_exists" };
    }

    // Create new round
    const { data: newRound, error } = await supabase
      .from("rounds")
      .insert({
        league_id: league.id,
        theme: event.round_name,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      return { event_id: event.id, event_type: event.event_type, success: false, action: "create_round_failed", error: error.message };
    }

    // Send push notification
    await sendPushNotification(
      supabase,
      supabaseUrl,
      serviceKey,
      league.group_id,
      "new_round",
      `New Round: ${event.round_name}`,
      "Time to find your song!"
    );

    return { event_id: event.id, event_type: event.event_type, success: true, action: "created_round" };
  }

  return { event_id: event.id, event_type: event.event_type, success: false, action: "skip", error: "No round name" };
}

/**
 * Process playlist_ready event
 */
async function processPlaylistReady(
  supabase: SupabaseClient,
  supabaseUrl: string,
  serviceKey: string,
  event: EmailEvent
): Promise<ProcessResult> {
  const league = await findLeague(supabase, event.league_name);
  if (!league) {
    return { event_id: event.id, event_type: event.event_type, success: false, action: "skip", error: "League not found" };
  }

  // Find round by theme or get active round
  let round = event.round_name ? await findRound(supabase, league.id, event.round_name) : null;
  if (!round) {
    round = await findActiveRound(supabase, league.id);
  }

  if (!round) {
    return { event_id: event.id, event_type: event.event_type, success: false, action: "skip", error: "Round not found" };
  }

  // Update round status and playlist URL
  const updateData: Record<string, unknown> = { status: "voting" };
  if (event.playlist_url) {
    updateData.external_playlist_url = event.playlist_url;
    updateData.playlist_url = event.playlist_url;
  }

  await supabase
    .from("rounds")
    .update(updateData)
    .eq("id", round.id);

  // Trigger Spotify ingestion if we have a playlist URL
  if (event.playlist_url) {
    await triggerSpotifyIngestion(supabaseUrl, serviceKey, event.playlist_url, round.id);
  }

  // Send push notification
  await sendPushNotification(
    supabase,
    supabaseUrl,
    serviceKey,
    league.group_id,
    "new_round",
    "Playlist Ready!",
    `Listen and vote for ${round.theme}`
  );

  return { event_id: event.id, event_type: event.event_type, success: true, action: "updated_to_voting" };
}

/**
 * Process votes_in event
 */
async function processVotesIn(
  supabase: SupabaseClient,
  supabaseUrl: string,
  serviceKey: string,
  event: EmailEvent
): Promise<ProcessResult> {
  const league = await findLeague(supabase, event.league_name);
  if (!league) {
    return { event_id: event.id, event_type: event.event_type, success: false, action: "skip", error: "League not found" };
  }

  // Find round by theme or get active round
  let round = event.round_name ? await findRound(supabase, league.id, event.round_name) : null;
  if (!round) {
    round = await findActiveRound(supabase, league.id);
  }

  if (!round) {
    return { event_id: event.id, event_type: event.event_type, success: false, action: "skip", error: "Round not found" };
  }

  // Update round status and set reveal_until (2 hours from now)
  const revealUntil = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  await supabase
    .from("rounds")
    .update({ status: "revealed", reveal_until: revealUntil })
    .eq("id", round.id);

  // Send push notification
  await sendPushNotification(
    supabase,
    supabaseUrl,
    serviceKey,
    league.group_id,
    "results_revealed",
    "Results Are In!",
    `See who won ${round.theme}`
  );

  // Note: AI narrative and awards generation could be triggered here
  // For now, those are triggered manually from admin

  return { event_id: event.id, event_type: event.event_type, success: true, action: "updated_to_revealed" };
}

/**
 * Process user_submitted event
 */
async function processUserSubmitted(
  supabase: SupabaseClient,
  event: EmailEvent,
  groupId: string
): Promise<ProcessResult> {
  if (!event.actor_name || !event.round_name) {
    return { event_id: event.id, event_type: event.event_type, success: false, action: "skip", error: "Missing actor or round name" };
  }

  const league = await findLeague(supabase, event.league_name);
  if (!league) {
    return { event_id: event.id, event_type: event.event_type, success: false, action: "skip", error: "League not found" };
  }

  // Find round
  let round = await findRound(supabase, league.id, event.round_name);
  if (!round) {
    round = await findActiveRound(supabase, league.id);
  }

  if (!round) {
    return { event_id: event.id, event_type: event.event_type, success: false, action: "skip", error: "Round not found" };
  }

  // Find competitor to get profile_id
  const competitor = await findCompetitor(supabase, league.group_id, event.actor_name);

  // Insert activity record
  const { error } = await supabase
    .from("round_user_activity")
    .upsert({
      round_id: round.id,
      actor_name: event.actor_name,
      profile_id: competitor?.profile_id || null,
      activity_type: "submitted",
      event_id: event.id,
    }, {
      onConflict: "round_id,actor_name,activity_type",
    });

  if (error) {
    return { event_id: event.id, event_type: event.event_type, success: false, action: "insert_activity_failed", error: error.message };
  }

  return { event_id: event.id, event_type: event.event_type, success: true, action: "recorded_submission" };
}

/**
 * Process user_voted event
 */
async function processUserVoted(
  supabase: SupabaseClient,
  event: EmailEvent,
  groupId: string
): Promise<ProcessResult> {
  if (!event.actor_name || !event.round_name) {
    return { event_id: event.id, event_type: event.event_type, success: false, action: "skip", error: "Missing actor or round name" };
  }

  const league = await findLeague(supabase, event.league_name);
  if (!league) {
    return { event_id: event.id, event_type: event.event_type, success: false, action: "skip", error: "League not found" };
  }

  // Find round
  let round = await findRound(supabase, league.id, event.round_name);
  if (!round) {
    round = await findActiveRound(supabase, league.id);
  }

  if (!round) {
    return { event_id: event.id, event_type: event.event_type, success: false, action: "skip", error: "Round not found" };
  }

  // Find competitor to get profile_id
  const competitor = await findCompetitor(supabase, league.group_id, event.actor_name);

  // Insert activity record
  const { error } = await supabase
    .from("round_user_activity")
    .upsert({
      round_id: round.id,
      actor_name: event.actor_name,
      profile_id: competitor?.profile_id || null,
      activity_type: "voted",
      event_id: event.id,
    }, {
      onConflict: "round_id,actor_name,activity_type",
    });

  if (error) {
    return { event_id: event.id, event_type: event.event_type, success: false, action: "insert_activity_failed", error: error.message };
  }

  return { event_id: event.id, event_type: event.event_type, success: true, action: "recorded_vote" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Optional: Accept specific event IDs to process
  let eventIds: string[] | null = null;
  try {
    const body = await req.json();
    if (body.event_ids && Array.isArray(body.event_ids)) {
      eventIds = body.event_ids;
    }
  } catch {
    // No body or invalid JSON - process all unprocessed events
  }

  // Query unprocessed events
  let query = supabase
    .from("ml_email_events")
    .select("*")
    .is("processed_at", null)
    .order("received_at", { ascending: true })
    .limit(50);

  if (eventIds) {
    query = query.in("id", eventIds);
  }

  const { data: events, error: fetchError } = await query;

  if (fetchError) {
    return new Response(
      JSON.stringify({ error: `Failed to fetch events: ${fetchError.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!events || events.length === 0) {
    return new Response(
      JSON.stringify({ status: "ok", processed: 0, message: "No events to process" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const results: ProcessResult[] = [];

  for (const event of events as EmailEvent[]) {
    let result: ProcessResult;

    try {
      switch (event.event_type) {
        case "round_start":
          result = await processRoundStart(supabase, supabaseUrl, supabaseServiceKey, event);
          break;
        case "playlist_ready":
          result = await processPlaylistReady(supabase, supabaseUrl, supabaseServiceKey, event);
          break;
        case "votes_in":
          result = await processVotesIn(supabase, supabaseUrl, supabaseServiceKey, event);
          break;
        case "user_submitted":
          result = await processUserSubmitted(supabase, event, "");
          break;
        case "user_voted":
          result = await processUserVoted(supabase, event, "");
          break;
        default:
          result = { event_id: event.id, event_type: event.event_type, success: false, action: "skip", error: "Unknown event type" };
      }
    } catch (error) {
      result = { event_id: event.id, event_type: event.event_type, success: false, action: "error", error: error.message };
    }

    // Mark event as processed
    await supabase
      .from("ml_email_events")
      .update({
        processed_at: new Date().toISOString(),
        processing_error: result.success ? null : result.error,
      })
      .eq("id", event.id);

    results.push(result);
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return new Response(
    JSON.stringify({
      status: "ok",
      processed: events.length,
      successful,
      failed,
      results,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
