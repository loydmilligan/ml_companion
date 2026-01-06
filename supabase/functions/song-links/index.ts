import { corsHeaders } from "../_shared/cors.ts";
import { verifyAuth, unauthorizedResponse } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SONG_LINK_API = "https://api.song.link/v1-alpha.1/links";

interface SongLinkResponse {
  entityUniqueId: string;
  userCountry: string;
  pageUrl: string;
  entitiesByUniqueId: Record<string, {
    id: string;
    type: string;
    title?: string;
    artistName?: string;
    thumbnailUrl?: string;
    thumbnailWidth?: number;
    thumbnailHeight?: number;
    apiProvider: string;
    platforms: string[];
  }>;
  linksByPlatform: Record<string, {
    country: string;
    url: string;
    entityUniqueId: string;
  }>;
}

interface PlatformLinks {
  spotify?: string;
  appleMusic?: string;
  youtube?: string;
  youtubeMusic?: string;
  tidal?: string;
  deezer?: string;
  amazonMusic?: string;
  pandora?: string;
  songLink?: string; // The universal song.link page
}

interface ConvertResult {
  sourceUri: string;
  title?: string;
  artist?: string;
  thumbnail?: string;
  links: PlatformLinks;
  error?: string;
}

/**
 * Fetch links for a single Spotify URI/URL from song.link API
 */
async function fetchSongLinks(spotifyUri: string): Promise<ConvertResult> {
  try {
    // Convert URI to URL if needed
    let url = spotifyUri;
    if (spotifyUri.startsWith("spotify:track:")) {
      const trackId = spotifyUri.replace("spotify:track:", "");
      url = `https://open.spotify.com/track/${trackId}`;
    }

    const response = await fetch(`${SONG_LINK_API}?url=${encodeURIComponent(url)}`);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          sourceUri: spotifyUri,
          links: {},
          error: "Track not found on song.link",
        };
      }
      return {
        sourceUri: spotifyUri,
        links: {},
        error: `song.link API error: ${response.status}`,
      };
    }

    const data: SongLinkResponse = await response.json();

    // Extract metadata from the first entity
    const entities = Object.values(data.entitiesByUniqueId);
    const primaryEntity = entities.find(e => e.type === "song") || entities[0];

    // Build platform links
    const links: PlatformLinks = {
      songLink: data.pageUrl,
    };

    if (data.linksByPlatform.spotify) {
      links.spotify = data.linksByPlatform.spotify.url;
    }
    if (data.linksByPlatform.appleMusic) {
      links.appleMusic = data.linksByPlatform.appleMusic.url;
    }
    if (data.linksByPlatform.youtube) {
      links.youtube = data.linksByPlatform.youtube.url;
    }
    if (data.linksByPlatform.youtubeMusic) {
      links.youtubeMusic = data.linksByPlatform.youtubeMusic.url;
    }
    if (data.linksByPlatform.tidal) {
      links.tidal = data.linksByPlatform.tidal.url;
    }
    if (data.linksByPlatform.deezer) {
      links.deezer = data.linksByPlatform.deezer.url;
    }
    if (data.linksByPlatform.amazonMusic) {
      links.amazonMusic = data.linksByPlatform.amazonMusic.url;
    }
    if (data.linksByPlatform.pandora) {
      links.pandora = data.linksByPlatform.pandora.url;
    }

    return {
      sourceUri: spotifyUri,
      title: primaryEntity?.title,
      artist: primaryEntity?.artistName,
      thumbnail: primaryEntity?.thumbnailUrl,
      links,
    };
  } catch (err) {
    return {
      sourceUri: spotifyUri,
      links: {},
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Update a submission with the fetched links
 */
async function updateSubmissionLinks(
  supabase: ReturnType<typeof createClient>,
  submissionId: string,
  links: PlatformLinks
): Promise<boolean> {
  const { error } = await supabase
    .from("submissions")
    .update({
      spotify_url: links.spotify,
      youtube_url: links.youtube,
      apple_music_url: links.appleMusic,
      youtube_music_url: links.youtubeMusic,
      song_link_url: links.songLink,
    })
    .eq("id", submissionId);

  return !error;
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
  const mode = body?.mode ?? "convert";

  // Mode: convert - Convert a single Spotify URI to platform links
  if (mode === "convert") {
    const spotifyUri = body?.spotify_uri;
    if (!spotifyUri) {
      return new Response(
        JSON.stringify({ error: "Missing spotify_uri" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await fetchSongLinks(spotifyUri);
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Mode: convert_batch - Convert multiple URIs
  if (mode === "convert_batch") {
    const spotifyUris: string[] = body?.spotify_uris ?? [];
    if (!spotifyUris.length) {
      return new Response(
        JSON.stringify({ error: "Missing spotify_uris array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: max 10 per request
    const urisToProcess = spotifyUris.slice(0, 10);

    // Process with small delay between requests to respect rate limits
    const results: ConvertResult[] = [];
    for (const uri of urisToProcess) {
      const result = await fetchSongLinks(uri);
      results.push(result);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Response(
      JSON.stringify({ results, processed: results.length, total: spotifyUris.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Mode: backfill_round - Fetch links for all submissions in a round and update DB
  if (mode === "backfill_round") {
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

    // Get submissions that don't have links yet
    const { data: submissions, error: fetchError } = await supabase
      .from("submissions")
      .select("id, source_uri, title, artist")
      .eq("round_id", roundId)
      .not("source_uri", "is", null)
      .or("youtube_url.is.null,apple_music_url.is.null");

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const submission of submissions ?? []) {
      if (!submission.source_uri) continue;

      const linkResult = await fetchSongLinks(submission.source_uri);

      if (linkResult.error) {
        results.push({ id: submission.id, success: false, error: linkResult.error });
      } else {
        const updated = await updateSubmissionLinks(supabase, submission.id, linkResult.links);
        results.push({ id: submission.id, success: updated });
      }

      // Rate limit delay
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    const successCount = results.filter(r => r.success).length;
    return new Response(
      JSON.stringify({
        message: `Backfilled ${successCount}/${results.length} submissions`,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Mode: backfill_all - Fetch links for ALL submissions missing links
  if (mode === "backfill_all") {
    const limit = Math.min(body?.limit ?? 50, 100); // Max 100 per request

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get submissions that don't have links yet
    const { data: submissions, error: fetchError } = await supabase
      .from("submissions")
      .select("id, source_uri, title, artist")
      .not("source_uri", "is", null)
      .is("youtube_url", null)
      .limit(limit);

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { id: string; title: string; success: boolean; error?: string }[] = [];

    for (const submission of submissions ?? []) {
      if (!submission.source_uri) continue;

      const linkResult = await fetchSongLinks(submission.source_uri);

      if (linkResult.error) {
        results.push({
          id: submission.id,
          title: submission.title ?? "Unknown",
          success: false,
          error: linkResult.error
        });
      } else {
        const updated = await updateSubmissionLinks(supabase, submission.id, linkResult.links);
        results.push({
          id: submission.id,
          title: submission.title ?? "Unknown",
          success: updated
        });
      }

      // Rate limit delay
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    const successCount = results.filter(r => r.success).length;
    return new Response(
      JSON.stringify({
        message: `Backfilled ${successCount}/${results.length} submissions`,
        remaining: (submissions?.length ?? 0) >= limit,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ error: "Invalid mode. Use: convert, convert_batch, backfill_round, or backfill_all" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
