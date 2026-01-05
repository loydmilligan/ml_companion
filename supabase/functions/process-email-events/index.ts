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
    .select("id, group_id, name, season_number, current_story_round_id")
    .ilike("name", leagueName)
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

type SeasonStoryPayload = {
  seasonData: Record<string, unknown>;
  latestRound: Record<string, unknown>;
  minigameSummary: Record<string, unknown>;
};

const normalizeName = (value: string | null | undefined) => value ?? "Unknown";

async function buildSeasonStoryPayload(
  supabase: SupabaseClient,
  leagueId: string,
  roundId: string
): Promise<SeasonStoryPayload | null> {
  const { data: roundsData } = await supabase
    .from("rounds")
    .select("id, theme, theme_author, round_number, created_at, status")
    .eq("league_id", leagueId)
    .in("status", ["revealed", "archived"])
    .order("round_number", { ascending: true, nullsFirst: false });

  if (!roundsData || roundsData.length === 0) {
    return null;
  }

  const roundIds = roundsData.map((round: any) => round.id);
  const { data: submissionsData } = await supabase
    .from("submissions")
    .select("id, round_id, submitter_name, created_at, title")
    .in("round_id", roundIds);

  const submissionIds = (submissionsData ?? []).map((s: any) => s.id);
  const { data: votesData } = submissionIds.length
    ? await supabase
      .from("votes")
      .select("submission_id, points")
      .in("submission_id", submissionIds)
    : { data: [] };

  const submissionById = new Map<string, any>();
  const roundSubmissions = new Map<string, any[]>();
  (submissionsData ?? []).forEach((submission: any) => {
    submissionById.set(submission.id, submission);
    const list = roundSubmissions.get(submission.round_id) ?? [];
    list.push(submission);
    roundSubmissions.set(submission.round_id, list);
  });

  const pointsBySubmission = new Map<string, number>();
  (votesData ?? []).forEach((vote: any) => {
    pointsBySubmission.set(
      vote.submission_id,
      (pointsBySubmission.get(vote.submission_id) ?? 0) + (vote.points ?? 0)
    );
  });

  const pointsBySubmitter = new Map<string, number>();
  (submissionsData ?? []).forEach((submission: any) => {
    const name = normalizeName(submission.submitter_name);
    const points = pointsBySubmission.get(submission.id) ?? 0;
    pointsBySubmitter.set(name, (pointsBySubmitter.get(name) ?? 0) + points);
  });

  const standings = Array.from(pointsBySubmitter.entries())
    .map(([name, totalPoints]) => ({ name, totalPoints }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const latestRound = roundsData.find((round: any) => round.id === roundId) ?? roundsData[roundsData.length - 1];
  const latestRoundSubmissions = roundSubmissions.get(latestRound.id) ?? [];

  let earlySubmitter: string | null = null;
  let lateSubmitter: string | null = null;
  if (latestRoundSubmissions.length > 0) {
    const sortedByTime = [...latestRoundSubmissions].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return aTime - bTime;
    });
    earlySubmitter = normalizeName(sortedByTime[0]?.submitter_name);
    lateSubmitter = normalizeName(sortedByTime[sortedByTime.length - 1]?.submitter_name);
  }

  let roundWinner: { name: string; points: number } | null = null;
  if (latestRoundSubmissions.length > 0) {
    const winnerSubmission = latestRoundSubmissions.reduce((best, submission) => {
      const bestPoints = pointsBySubmission.get(best.id) ?? 0;
      const currentPoints = pointsBySubmission.get(submission.id) ?? 0;
      return currentPoints > bestPoints ? submission : best;
    }, latestRoundSubmissions[0]);
    roundWinner = {
      name: normalizeName(winnerSubmission.submitter_name),
      points: pointsBySubmission.get(winnerSubmission.id) ?? 0,
    };
  }

  const { data: guessData } = await supabase
    .from("submitter_guesses")
    .select("submission_id, guesser_id, is_correct, profiles!guesser_id(display_name)")
    .eq("round_id", latestRound.id);

  const guesserStats = new Map<string, { name: string; correct: number; total: number }>();
  const submissionCorrect = new Map<string, number>();
  (guessData ?? []).forEach((guess: any) => {
    const profileData = guess.profiles as { display_name?: string } | { display_name?: string }[] | null;
    const profile = Array.isArray(profileData) ? profileData[0] : profileData;
    const name = normalizeName(profile?.display_name);
    const stats = guesserStats.get(guess.guesser_id) ?? { name, correct: 0, total: 0 };
    stats.total += 1;
    if (guess.is_correct === true) {
      stats.correct += 1;
      submissionCorrect.set(
        guess.submission_id,
        (submissionCorrect.get(guess.submission_id) ?? 0) + 1
      );
    }
    guesserStats.set(guess.guesser_id, stats);
  });

  const guesserList = Array.from(guesserStats.values()).sort((a, b) => b.correct - a.correct);
  const topGuesser = guesserList[0] ?? null;
  const bottomGuesser = guesserList[guesserList.length - 1] ?? null;

  let easiestSubmission: { title: string; submitter: string } | null = null;
  let hardestSubmission: { title: string; submitter: string } | null = null;
  if (latestRoundSubmissions.length > 0) {
    const scored = latestRoundSubmissions.map((submission) => ({
      submission,
      correct: submissionCorrect.get(submission.id) ?? 0,
    }));
    const sortedByCorrect = [...scored].sort((a, b) => a.correct - b.correct);
    const hardest = sortedByCorrect[0];
    const easiest = sortedByCorrect[sortedByCorrect.length - 1];
    if (hardest) {
      hardestSubmission = {
        title: hardest.submission.title ?? "Unknown",
        submitter: normalizeName(hardest.submission.submitter_name),
      };
    }
    if (easiest) {
      easiestSubmission = {
        title: easiest.submission.title ?? "Unknown",
        submitter: normalizeName(easiest.submission.submitter_name),
      };
    }
  }

  return {
    seasonData: {
      rounds_completed: roundsData.length,
      standings,
      early_submitter: earlySubmitter,
      late_submitter: lateSubmitter,
      latest_round_winner: roundWinner,
    },
    latestRound: {
      id: latestRound.id,
      theme: latestRound.theme ?? null,
      theme_author: latestRound.theme_author ?? null,
      round_number: latestRound.round_number ?? null,
    },
    minigameSummary: {
      top_guesser: topGuesser,
      bottom_guesser: bottomGuesser,
      hardest_submission: hardestSubmission,
      easiest_submission: easiestSubmission,
    },
  };
}

async function updateCurrentSeasonStory(
  supabase: SupabaseClient,
  supabaseUrl: string,
  serviceKey: string,
  league: { id: string; name: string; season_number: number | null; current_story_round_id?: string | null },
  roundId: string
) {
  if (league.current_story_round_id === roundId) {
    return;
  }

  const payload = await buildSeasonStoryPayload(supabase, league.id, roundId);
  if (!payload) return;

  const response = await fetch(`${supabaseUrl}/functions/v1/openrouter-round-story`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      mode: "current_season_story",
      league_name: league.name,
      season_number: league.season_number,
      season_data: payload.seasonData,
      latest_round: payload.latestRound,
      minigame_summary: payload.minigameSummary,
    }),
  });

  if (!response.ok) {
    console.error("Current season story generation failed:", await response.text());
    return;
  }

  const json = await response.json();
  const seasonIntro = json?.season_intro ?? null;
  const roundRiff = json?.round_two_riff ?? null;
  const minigameSummary = json?.minigame_summary ?? null;

  if (!seasonIntro && !roundRiff && !minigameSummary) {
    return;
  }

  await supabase
    .from("leagues")
    .update({
      current_story_intro: seasonIntro,
      current_round_riff: roundRiff,
      current_minigame_summary: minigameSummary,
      current_story_updated_at: new Date().toISOString(),
      current_story_round_id: roundId,
    })
    .eq("id", league.id);
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

  await updateCurrentSeasonStory(supabase, supabaseUrl, serviceKey, league, round.id);

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
