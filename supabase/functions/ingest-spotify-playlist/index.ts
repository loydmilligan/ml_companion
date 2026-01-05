import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SPOTIFY_CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID");
const SPOTIFY_CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET");

interface SpotifyTrack {
  track: {
    id: string;
    name: string;
    uri: string;
    external_urls: { spotify: string };
    album: {
      name: string;
      images: Array<{ url: string; height: number; width: number }>;
      release_date: string;
    };
    artists: Array<{ name: string }>;
  };
}

interface SpotifyTracksResponse {
  items: SpotifyTrack[];
  next: string | null;
}

interface IngestRequest {
  playlist_url: string;
  round_id: string;
}

/**
 * Get Spotify access token using Client Credentials flow
 */
async function getSpotifyAccessToken(): Promise<string> {
  console.log("Getting Spotify access token...");
  console.log("SPOTIFY_CLIENT_ID set:", !!SPOTIFY_CLIENT_ID);
  console.log("SPOTIFY_CLIENT_SECRET set:", !!SPOTIFY_CLIENT_SECRET);

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error("Spotify credentials not configured");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Spotify token error:", response.status, error);
    throw new Error(`Failed to get Spotify token: ${error}`);
  }

  const data = await response.json();
  console.log("Successfully got Spotify access token");
  return data.access_token;
}

/**
 * Extract playlist ID from Spotify URL
 * Handles formats like:
 * - https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
 * - spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
 */
function extractPlaylistId(url: string): string | null {
  // Handle web URL
  const webMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
  if (webMatch) return webMatch[1];

  // Handle URI
  const uriMatch = url.match(/playlist:([a-zA-Z0-9]+)/);
  if (uriMatch) return uriMatch[1];

  return null;
}

/**
 * Extract release year from Spotify date (can be "2024", "2024-01", or "2024-01-15")
 */
function extractReleaseYear(releaseDate: string): number | null {
  if (!releaseDate) return null;
  const year = parseInt(releaseDate.substring(0, 4), 10);
  return isNaN(year) ? null : year;
}

/**
 * Fetch all tracks from a Spotify playlist
 */
async function fetchPlaylistTracks(
  accessToken: string,
  playlistId: string
): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = [];
  let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(id,name,uri,external_urls,album(name,images,release_date),artists(name))),next&limit=100`;

  while (url) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch playlist: ${error}`);
    }

    const data: SpotifyTracksResponse = await response.json();
    tracks.push(...data.items.filter((item) => item.track)); // Filter out null tracks
    url = data.next;
  }

  return tracks;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Check Spotify configuration
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return new Response(
      JSON.stringify({ error: "Spotify not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Parse request body
  let body: IngestRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { playlist_url, round_id } = body;

  if (!playlist_url || !round_id) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: playlist_url, round_id" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Extract playlist ID
  const playlistId = extractPlaylistId(playlist_url);
  if (!playlistId) {
    return new Response(
      JSON.stringify({ error: "Invalid Spotify playlist URL" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Starting playlist ingestion for round ${round_id}, playlist: ${playlist_url}`);
    console.log(`Extracted playlist ID: ${playlistId}`);

    // Get Spotify access token
    const accessToken = await getSpotifyAccessToken();

    // Fetch playlist tracks
    console.log("Fetching playlist tracks...");
    const tracks = await fetchPlaylistTracks(accessToken, playlistId);
    console.log(`Fetched ${tracks.length} tracks from playlist`);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for existing submissions to avoid duplicates
    const { data: existingSubmissions } = await supabase
      .from("submissions")
      .select("source_uri")
      .eq("round_id", round_id);

    const existingUris = new Set(
      (existingSubmissions || []).map((s) => s.source_uri)
    );

    // Prepare submissions
    const submissions = tracks
      .filter((item) => !existingUris.has(item.track.uri))
      .map((item) => ({
        round_id,
        title: item.track.name,
        artist: item.track.artists.map((a) => a.name).join(", "),
        album: item.track.album.name,
        link: item.track.external_urls.spotify,
        source_uri: item.track.uri,
        artwork_url: item.track.album.images[0]?.url || null,
        release_year: extractReleaseYear(item.track.album.release_date),
        // submitter_name and submitter_id left null - populated later from vote data
      }));

    // Insert submissions
    let inserted = 0;
    let skipped = existingUris.size;

    if (submissions.length > 0) {
      const { data, error } = await supabase
        .from("submissions")
        .insert(submissions)
        .select();

      if (error) {
        console.error("Error inserting submissions:", error);
        return new Response(
          JSON.stringify({ error: `Failed to insert submissions: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      inserted = data?.length || 0;
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        playlist_id: playlistId,
        total_tracks: tracks.length,
        inserted,
        skipped,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Spotify ingestion error:", error);
    return new Response(
      JSON.stringify({ error: `Ingestion failed: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
