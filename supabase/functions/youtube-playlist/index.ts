import { corsHeaders } from "../_shared/cors.ts";
import { verifyAuth, unauthorizedResponse } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const YOUTUBE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

interface VideoInfo {
  videoId: string;
  title: string;
  artist: string | null;
  submitter: string | null;
}

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url: string): string | null {
  if (!url) return null;

  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Get access token using refresh token
 */
async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("YOUTUBE_CLIENT_ID");
  const clientSecret = Deno.env.get("YOUTUBE_CLIENT_SECRET");
  const refreshToken = Deno.env.get("YOUTUBE_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing YouTube API credentials. Set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN.");
  }

  const response = await fetch(YOUTUBE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a YouTube playlist
 */
async function createPlaylist(
  accessToken: string,
  title: string,
  description: string
): Promise<string> {
  const response = await fetch(`${YOUTUBE_API_BASE}/playlists?part=snippet,status`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      snippet: {
        title,
        description,
      },
      status: {
        privacyStatus: "unlisted", // Can be "public", "unlisted", or "private"
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create playlist: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Add a video to a playlist
 */
async function addVideoToPlaylist(
  accessToken: string,
  playlistId: string,
  videoId: string
): Promise<boolean> {
  const response = await fetch(`${YOUTUBE_API_BASE}/playlistItems?part=snippet`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      snippet: {
        playlistId,
        resourceId: {
          kind: "youtube#video",
          videoId,
        },
      },
    }),
  });

  if (!response.ok) {
    console.error(`Failed to add video ${videoId}:`, await response.text());
    return false;
  }

  return true;
}

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

  const body = await req.json().catch(() => ({}));
  const mode = body?.mode ?? "preview";
  const roundId = body?.round_id;

  if (!roundId) {
    return new Response(
      JSON.stringify({ error: "Missing round_id" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get round details
  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .select("id, theme, season_id, seasons(name, league_id, leagues(name))")
    .eq("id", roundId)
    .single();

  if (roundError || !round) {
    return new Response(
      JSON.stringify({ error: "Round not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get submissions with YouTube URLs
  const { data: submissions, error: subError } = await supabase
    .from("submissions")
    .select("id, title, artist, youtube_url, submitter_name")
    .eq("round_id", roundId)
    .not("youtube_url", "is", null)
    .order("created_at", { ascending: true });

  if (subError) {
    return new Response(
      JSON.stringify({ error: subError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Extract video info
  const videos: VideoInfo[] = [];
  for (const sub of submissions ?? []) {
    const videoId = extractVideoId(sub.youtube_url);
    if (videoId) {
      videos.push({
        videoId,
        title: sub.title,
        artist: sub.artist,
        submitter: sub.submitter_name,
      });
    }
  }

  if (videos.length === 0) {
    return new Response(
      JSON.stringify({ error: "No YouTube videos found for this round" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Preview mode - just return the videos
  if (mode === "preview") {
    return new Response(
      JSON.stringify({
        round: {
          id: round.id,
          theme: round.theme,
          season: round.seasons?.name,
          league: round.seasons?.leagues?.name,
        },
        videos,
        count: videos.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create mode - actually create the playlist
  if (mode === "create") {
    try {
      const accessToken = await getAccessToken();

      // Build playlist title and description
      const leagueName = round.seasons?.leagues?.name ?? "Music League";
      const seasonName = round.seasons?.name ?? "Season";
      const theme = round.theme ?? "Round";

      const playlistTitle = `${theme} - ${leagueName}`;
      const playlistDescription = `${seasonName} - ${theme}\n\nGenerated from Talking Music League`;

      // Create the playlist
      const playlistId = await createPlaylist(accessToken, playlistTitle, playlistDescription);

      // Add videos to playlist
      const results: { videoId: string; title: string; added: boolean }[] = [];
      for (const video of videos) {
        const added = await addVideoToPlaylist(accessToken, playlistId, video.videoId);
        results.push({
          videoId: video.videoId,
          title: video.title,
          added,
        });
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const successCount = results.filter(r => r.added).length;
      const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;

      // Optionally store the playlist URL in the round
      await supabase
        .from("rounds")
        .update({ youtube_playlist_url: playlistUrl })
        .eq("id", roundId);

      return new Response(
        JSON.stringify({
          success: true,
          playlistId,
          playlistUrl,
          videosAdded: successCount,
          totalVideos: videos.length,
          results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: err instanceof Error ? err.message : "Failed to create playlist",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: "Invalid mode. Use: preview or create" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
