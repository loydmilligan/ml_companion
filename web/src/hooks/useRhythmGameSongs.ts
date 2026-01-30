import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";

// Types for rhythm game songs
export type RhythmGameSong = {
  id: string;
  title: string;
  artist: string;
  year: number | null;
  genre: string | null;
  is_guitar_hero: boolean;
  is_rock_band: boolean;
  is_dlc: boolean;
  games: string[];
  created_at: string;
  // Spotify data (fetched lazily)
  spotify_track_id?: string | null;
  spotify_url?: string | null;
  artwork_url?: string | null;
};

export type RhythmGameFavorite = {
  id: string;
  profile_id: string;
  song_id: string;
  rank: number | null;
  created_at: string;
};

export type RhythmGameFilters = {
  search: string;
  showGuitarHero: boolean;
  showRockBand: boolean;
  hideDLC: boolean;
  genres: string[]; // Changed from single to array
  decades: string[]; // e.g., ["1970s", "1980s"]
  yearRange: [number, number] | null; // e.g., [1975, 1985]
  useDecades: boolean; // true = decades pills, false = timeline slider
};

const DEFAULT_FILTERS: RhythmGameFilters = {
  search: "",
  showGuitarHero: true,
  showRockBand: true,
  hideDLC: false,
  genres: [],
  decades: [],
  yearRange: null,
  useDecades: true,
};

/**
 * Hook for fetching and filtering rhythm game songs
 */
export function useRhythmGameSongs(filters: RhythmGameFilters = DEFAULT_FILTERS) {
  const [songs, setSongs] = useState<RhythmGameSong[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all songs once (they're static reference data)
  useEffect(() => {
    let active = true;

    async function fetchSongs() {
      setLoading(true);
      setError(null);

      // Supabase has a server-side max-rows limit (default 1000)
      // Fetch in chunks to get all ~5000 songs
      const allSongs: RhythmGameSong[] = [];
      const CHUNK_SIZE = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore && active) {
        const { data, error: fetchError } = await supabase
          .from("rhythm_game_songs")
          .select("*")
          .order("artist", { ascending: true })
          .order("title", { ascending: true })
          .range(offset, offset + CHUNK_SIZE - 1);

        if (!active) return;

        if (fetchError) {
          setError(fetchError.message);
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          allSongs.push(...data);
          hasMore = data.length === CHUNK_SIZE;
          offset += CHUNK_SIZE;
        } else {
          hasMore = false;
        }
      }

      if (!active) return;

      setSongs(allSongs);

      // Extract unique genres
      const uniqueGenres = [...new Set(allSongs
        .map(s => s.genre)
        .filter((g): g is string => g !== null && g !== "")
      )].sort();
      setGenres(uniqueGenres);

      setLoading(false);
    }

    fetchSongs();

    return () => {
      active = false;
    };
  }, []);

  // Calculate year range from all songs
  const yearRange = useMemo((): [number, number] => {
    const years = songs.filter(s => s.year).map(s => s.year!);
    return years.length ? [Math.min(...years), Math.max(...years)] : [1950, new Date().getFullYear()];
  }, [songs]);

  // Filter songs based on current filters
  const filteredSongs = useMemo(() => {
    return songs.filter(song => {
      // Search filter (title or artist)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = song.title.toLowerCase().includes(searchLower);
        const matchesArtist = song.artist.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesArtist) return false;
      }

      // Franchise filters
      if (!filters.showGuitarHero && song.is_guitar_hero && !song.is_rock_band) return false;
      if (!filters.showRockBand && song.is_rock_band && !song.is_guitar_hero) return false;
      if (!filters.showGuitarHero && !filters.showRockBand) return false;

      // DLC filter
      if (filters.hideDLC && song.is_dlc) return false;

      // Genre filters (multiple selection)
      if (filters.genres.length > 0 && !filters.genres.includes(song.genre || "")) return false;

      // Year filters
      if (song.year) {
        // Decade filters
        if (filters.useDecades && filters.decades.length > 0) {
          const decade = Math.floor(song.year / 10) * 10;
          const decadeStr = `${decade}s`;
          if (!filters.decades.includes(decadeStr)) return false;
        }

        // Year range filter (timeline slider)
        if (!filters.useDecades && filters.yearRange) {
          const [min, max] = filters.yearRange;
          if (song.year < min || song.year > max) return false;
        }
      }

      return true;
    });
  }, [songs, filters]);

  return {
    songs: filteredSongs,
    allSongs: songs,
    genres,
    yearRange,
    loading,
    error,
    totalCount: songs.length,
    filteredCount: filteredSongs.length,
  };
}

/**
 * Hook for managing user's favorite rhythm game songs with ranking support
 */
export function useRhythmGameFavorites(userId: string | null) {
  const [favorites, setFavorites] = useState<RhythmGameFavorite[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's favorites with ranking
  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("rhythm_game_favorites")
      .select("*")
      .eq("profile_id", userId)
      .order("rank", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (!error && data) {
      setFavorites(data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Computed favoriteIds set for quick lookups
  const favoriteIds = useMemo(() => {
    return new Set(favorites.map(f => f.song_id));
  }, [favorites]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (songId: string) => {
    if (!userId) return;

    const existingFavorite = favorites.find(f => f.song_id === songId);

    if (existingFavorite) {
      // Remove favorite
      const { error } = await supabase
        .from("rhythm_game_favorites")
        .delete()
        .eq("profile_id", userId)
        .eq("song_id", songId);

      if (!error) {
        setFavorites(prev => prev.filter(f => f.song_id !== songId));
      }
    } else {
      // Add favorite - assign next rank
      const maxRank = favorites.reduce((max, f) => {
        return f.rank !== null && f.rank > max ? f.rank : max;
      }, 0);

      const { data, error } = await supabase
        .from("rhythm_game_favorites")
        .insert({
          profile_id: userId,
          song_id: songId,
          rank: maxRank + 1
        })
        .select()
        .single();

      if (!error && data) {
        setFavorites(prev => [...prev, data].sort((a, b) => {
          if (a.rank === null && b.rank === null) return 0;
          if (a.rank === null) return 1;
          if (b.rank === null) return -1;
          return a.rank - b.rank;
        }));
      }
    }
  }, [userId, favorites]);

  // Move favorite up in ranking (decrease rank number)
  const moveFavoriteUp = useCallback(async (songId: string) => {
    if (!userId) return;

    const currentIndex = favorites.findIndex(f => f.song_id === songId);
    if (currentIndex <= 0) return; // Already at top or not found

    const current = favorites[currentIndex];
    const above = favorites[currentIndex - 1];

    // Swap ranks
    const { error: error1 } = await supabase
      .from("rhythm_game_favorites")
      .update({ rank: above.rank })
      .eq("id", current.id);

    const { error: error2 } = await supabase
      .from("rhythm_game_favorites")
      .update({ rank: current.rank })
      .eq("id", above.id);

    if (!error1 && !error2) {
      // Update local state
      setFavorites(prev => {
        const next = [...prev];
        [next[currentIndex], next[currentIndex - 1]] = [next[currentIndex - 1], next[currentIndex]];
        return next;
      });
    }
  }, [userId, favorites]);

  // Move favorite down in ranking (increase rank number)
  const moveFavoriteDown = useCallback(async (songId: string) => {
    if (!userId) return;

    const currentIndex = favorites.findIndex(f => f.song_id === songId);
    if (currentIndex < 0 || currentIndex >= favorites.length - 1) return; // At bottom or not found

    const current = favorites[currentIndex];
    const below = favorites[currentIndex + 1];

    // Swap ranks
    const { error: error1 } = await supabase
      .from("rhythm_game_favorites")
      .update({ rank: below.rank })
      .eq("id", current.id);

    const { error: error2 } = await supabase
      .from("rhythm_game_favorites")
      .update({ rank: current.rank })
      .eq("id", below.id);

    if (!error1 && !error2) {
      // Update local state
      setFavorites(prev => {
        const next = [...prev];
        [next[currentIndex], next[currentIndex + 1]] = [next[currentIndex + 1], next[currentIndex]];
        return next;
      });
    }
  }, [userId, favorites]);

  const isFavorite = useCallback((songId: string) => {
    return favoriteIds.has(songId);
  }, [favoriteIds]);

  const getFavoriteRank = useCallback((songId: string): number | null => {
    const favorite = favorites.find(f => f.song_id === songId);
    return favorite?.rank ?? null;
  }, [favorites]);

  return {
    favorites,
    favoriteIds,
    loading,
    toggleFavorite,
    moveFavoriteUp,
    moveFavoriteDown,
    isFavorite,
    getFavoriteRank,
    favoriteCount: favorites.length,
  };
}

/**
 * Generate a Spotify search URL for a song
 */
export function getSpotifySearchUrl(song: RhythmGameSong): string {
  const query = encodeURIComponent(`${song.title} ${song.artist}`);
  return `https://open.spotify.com/search/${query}`;
}

/**
 * Generate a YouTube Music search URL for a song
 */
export function getYouTubeMusicSearchUrl(song: RhythmGameSong): string {
  const query = encodeURIComponent(`${song.title} ${song.artist}`);
  return `https://music.youtube.com/search?q=${query}`;
}

/**
 * Generate an Apple Music search URL for a song
 */
export function getAppleMusicSearchUrl(song: RhythmGameSong): string {
  const query = encodeURIComponent(`${song.title} ${song.artist}`);
  return `https://music.apple.com/search?term=${query}`;
}

/**
 * Format song for chat mention
 */
export function formatSongForMention(song: RhythmGameSong): string {
  const games = song.games.slice(0, 2).join(", ");
  const moreGames = song.games.length > 2 ? ` +${song.games.length - 2} more` : "";
  return `${song.artist} - "${song.title}" (${games}${moreGames})`;
}

/**
 * Fetch Spotify data for a song (track ID, artwork, direct link)
 * Uses localStorage for caching
 */
export async function fetchSpotifyData(
  song: RhythmGameSong
): Promise<{ spotify_track_id: string | null; spotify_url: string | null; artwork_url: string | null }> {
  // Check cache
  const cacheKey = `spotify_${song.id}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Invalid cache, continue to fetch
    }
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { spotify_track_id: null, spotify_url: null, artwork_url: null };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/spotify-search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          artist: song.artist,
          title: song.title,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Spotify search failed: ${response.status}`);
    }

    const result = await response.json();

    const spotifyData = {
      spotify_track_id: result.trackId || null,
      spotify_url: result.spotifyUrl || null,
      artwork_url: result.artworkUrl || null,
    };

    // Cache for 7 days
    localStorage.setItem(cacheKey, JSON.stringify(spotifyData));

    return spotifyData;
  } catch (error) {
    console.error("Error fetching Spotify data:", error);
    return { spotify_track_id: null, spotify_url: null, artwork_url: null };
  }
}
