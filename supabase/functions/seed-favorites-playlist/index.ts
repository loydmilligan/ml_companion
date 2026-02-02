import { corsHeaders } from "../_shared/cors.ts";
import { verifyAuth, unauthorizedResponse } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verify JWT authentication
  const { user, error: authError } = await verifyAuth(req);
  if (authError) {
    return unauthorizedResponse(authError, corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const profileId = user.id;

  try {
    console.log(`Seeding favorites playlist for user ${profileId}`);

    // Get all Season 1 & 2 rounds
    const { data: rounds, error: roundsError } = await supabase
      .from("rounds")
      .select("id, season_number, round_number, theme")
      .in("season_number", [1, 2])
      .order("season_number", { ascending: true })
      .order("round_number", { ascending: true });

    if (roundsError) {
      console.error("Error fetching rounds:", roundsError);
      return new Response(
        JSON.stringify({ error: roundsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${rounds?.length || 0} rounds in Seasons 1 & 2`);

    const playlistEntries: Array<{
      profile_id: string;
      submission_id: string;
      source: string;
      round_id: string;
    }> = [];

    // 1. Find all submissions by this user in Seasons 1 & 2
    const { data: userSubmissions, error: submissionsError } = await supabase
      .from("submissions")
      .select("id, round_id, title, artist")
      .eq("submitter_id", profileId)
      .in("round_id", rounds.map(r => r.id));

    if (submissionsError) {
      console.error("Error fetching user submissions:", submissionsError);
    } else {
      console.log(`Found ${userSubmissions?.length || 0} submissions by user`);
      for (const submission of userSubmissions || []) {
        playlistEntries.push({
          profile_id: profileId,
          submission_id: submission.id,
          source: "submitted",
          round_id: submission.round_id,
        });
      }
    }

    // 2. For each round, find the submission(s) the user gave the most votes to
    for (const round of rounds || []) {
      // Get all votes by this user in this round, ordered by points descending
      const { data: userVotes } = await supabase
        .from("votes")
        .select("submission_id, points, submission:submissions(id, round_id)")
        .eq("voter_id", profileId)
        .order("points", { ascending: false });

      if (!userVotes || userVotes.length === 0) continue;

      // Filter to only votes in this round
      // Note: Supabase joins return arrays, so unwrap submission
      const roundVotes = userVotes.filter(v => {
        const sub = Array.isArray(v.submission) ? v.submission[0] : v.submission;
        return sub && sub.round_id === round.id;
      });

      if (roundVotes.length === 0) continue;

      // Get the max points given in this round
      const maxPoints = roundVotes[0].points;

      // Get all submissions that received the max points
      const topVotedInRound = roundVotes.filter(v => v.points === maxPoints);

      for (const vote of topVotedInRound) {
        // Don't add if it's already in the list (user submitted it)
        if (!playlistEntries.some(e => e.submission_id === vote.submission_id)) {
          playlistEntries.push({
            profile_id: profileId,
            submission_id: vote.submission_id,
            source: "top_voted",
            round_id: round.id,
          });
        }
      }
    }

    console.log(`Prepared ${playlistEntries.length} playlist entries`);

    // Clear existing auto-seeded entries (keep manual ones)
    const { error: deleteError } = await supabase
      .from("favorites_playlist")
      .delete()
      .eq("profile_id", profileId)
      .in("source", ["submitted", "top_voted"]);

    if (deleteError) {
      console.error("Error clearing old entries:", deleteError);
    }

    // Insert new entries
    if (playlistEntries.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from("favorites_playlist")
        .insert(playlistEntries)
        .select();

      if (insertError) {
        console.error("Error inserting playlist entries:", insertError);
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Inserted ${inserted?.length || 0} playlist entries`);

      return new Response(
        JSON.stringify({
          success: true,
          entries_added: inserted?.length || 0,
          breakdown: {
            submitted: playlistEntries.filter(e => e.source === "submitted").length,
            top_voted: playlistEntries.filter(e => e.source === "top_voted").length,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: true,
          entries_added: 0,
          message: "No submissions or votes found in Seasons 1 & 2",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("Seed playlist error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Failed to seed playlist",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
