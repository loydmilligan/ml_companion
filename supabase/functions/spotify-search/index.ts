import { corsHeaders } from "../_shared/cors.ts";
import { verifyAuth, unauthorizedResponse } from "../_shared/auth.ts";

// Spotify API types
interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    images: Array<{ url: string; height: number; width: number }>;
  };
  external_urls: {
    spotify: string;
  };
  popularity: number; // 0-100 popularity score
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

interface SearchResult {
  trackId: string | null;
  spotifyUrl: string | null;
  artworkUrl: string | null;
  title: string;
  artist: string;
  confidence: "high" | "medium" | "low";
  popularity: number | null; // 0-100 popularity score from Spotify
}

// In-memory token cache (edge function instances last ~5 minutes)
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get Spotify access token using client credentials flow
 */
async function getSpotifyToken(): Promise<string> {
  // Check cache
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Missing Spotify credentials");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Spotify auth failed: ${response.status}`);
  }

  const data: SpotifyTokenResponse = await response.json();

  // Cache token (expires in 1 hour, we'll cache for 55 minutes to be safe)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + 55 * 60 * 1000,
  };

  return data.access_token;
}

/**
 * Search Spotify for a track by artist and title
 */
async function searchSpotifyTrack(
  artist: string,
  title: string
): Promise<SearchResult> {
  const token = await getSpotifyToken();

  // Clean up search query
  const query = `artist:${artist} track:${title}`;

  const response = await fetch(
    `https://api.spotify.com/v1/search?${new URLSearchParams({
      q: query,
      type: "track",
      limit: "5",
    })}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    return {
      trackId: null,
      spotifyUrl: null,
      artworkUrl: null,
      title,
      artist,
      confidence: "low",
      popularity: null,
    };
  }

  const data: SpotifySearchResponse = await response.json();

  if (!data.tracks.items.length) {
    return {
      trackId: null,
      spotifyUrl: null,
      artworkUrl: null,
      title,
      artist,
      confidence: "low",
      popularity: null,
    };
  }

  // Find best match
  const track = data.tracks.items[0];

  // Determine confidence based on string similarity
  const titleMatch = track.name.toLowerCase().includes(title.toLowerCase()) ||
    title.toLowerCase().includes(track.name.toLowerCase());
  const artistMatch = track.artists.some(a =>
    a.name.toLowerCase().includes(artist.toLowerCase()) ||
    artist.toLowerCase().includes(a.name.toLowerCase())
  );

  let confidence: "high" | "medium" | "low" = "low";
  if (titleMatch && artistMatch) {
    confidence = "high";
  } else if (titleMatch || artistMatch) {
    confidence = "medium";
  }

  // Get largest artwork (usually 640x640)
  const artwork = track.album.images[0]?.url || null;

  return {
    trackId: track.id,
    spotifyUrl: track.external_urls.spotify,
    artworkUrl: artwork,
    title: track.name,
    artist: track.artists.map(a => a.name).join(", "),
    confidence,
    popularity: track.popularity,
  };
}

/**
 * General Spotify search - returns multiple results for user browsing
 */
async function generalSpotifySearch(
  query: string,
  limit: number = 20
): Promise<SearchResult[]> {
  const token = await getSpotifyToken();

  const response = await fetch(
    `https://api.spotify.com/v1/search?${new URLSearchParams({
      q: query,
      type: "track",
      limit: limit.toString(),
    })}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Spotify search failed: ${response.status}`);
  }

  const data: SpotifySearchResponse = await response.json();

  return data.tracks.items.map(track => ({
    trackId: track.id,
    spotifyUrl: track.external_urls.spotify,
    artworkUrl: track.album.images[0]?.url || null,
    title: track.name,
    artist: track.artists.map(a => a.name).join(", "),
    confidence: "high",
    popularity: track.popularity,
  }));
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

  try {
    const body = await req.json().catch(() => ({}));

    // General search (new feature for browse/search UI)
    if (body.query) {
      const limit = body.limit || 20;
      const results = await generalSpotifySearch(body.query, limit);
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Single search (existing feature for lookups)
    if (body.artist && body.title) {
      const result = await searchSpotifyTrack(body.artist, body.title);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Batch search (existing feature)
    if (body.songs && Array.isArray(body.songs)) {
      const results = [];
      for (const song of body.songs.slice(0, 20)) { // Limit to 20 per request
        if (!song.artist || !song.title) continue;

        const result = await searchSpotifyTrack(song.artist, song.title);
        results.push({
          ...result,
          originalId: song.id,
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Missing query, artist/title, or songs array" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Spotify search error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
