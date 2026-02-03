import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export type SpotifySearchResult = {
  trackId: string | null;
  spotifyUrl: string | null;
  artworkUrl: string | null;
  title: string;
  artist: string;
  confidence: "high" | "medium" | "low";
  popularity: number | null;
};

export function useSpotifySearch() {
  const [results, setResults] = useState<SpotifySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You must be logged in to search");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/spotify-search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ query, limit: 20 }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Spotify search failed:", response.status, errorText);
        setError(`Search failed: ${response.status}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("Spotify search error:", err);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clear,
  };
}
