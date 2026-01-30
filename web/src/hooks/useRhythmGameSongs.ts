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
};

export type RhythmGameFavorite = {
  id: string;
  profile_id: string;
  song_id: string;
  created_at: string;
};

export type RhythmGameFilters = {
  search: string;
  showGuitarHero: boolean;
  showRockBand: boolean;
  hideDLC: boolean;
  genre: string | null;
};

const DEFAULT_FILTERS: RhythmGameFilters = {
  search: "",
  showGuitarHero: true,
  showRockBand: true,
  hideDLC: false,
  genre: null,
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

      const { data, error: fetchError } = await supabase
        .from("rhythm_game_songs")
        .select("*")
        .order("artist", { ascending: true })
        .order("title", { ascending: true });

      if (!active) return;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setSongs(data || []);

      // Extract unique genres
      const uniqueGenres = [...new Set((data || [])
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

      // Genre filter
      if (filters.genre && song.genre !== filters.genre) return false;

      return true;
    });
  }, [songs, filters]);

  return {
    songs: filteredSongs,
    allSongs: songs,
    genres,
    loading,
    error,
    totalCount: songs.length,
    filteredCount: filteredSongs.length,
  };
}

/**
 * Hook for managing user's favorite rhythm game songs
 */
export function useRhythmGameFavorites(userId: string | null) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch user's favorites
  useEffect(() => {
    if (!userId) {
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchFavorites() {
      setLoading(true);

      const { data, error } = await supabase
        .from("rhythm_game_favorites")
        .select("song_id")
        .eq("profile_id", userId);

      if (!active) return;

      if (!error && data) {
        setFavoriteIds(new Set(data.map(f => f.song_id)));
      }
      setLoading(false);
    }

    fetchFavorites();

    return () => {
      active = false;
    };
  }, [userId]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (songId: string) => {
    if (!userId) return;

    const isFavorite = favoriteIds.has(songId);

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFavorite) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });

    if (isFavorite) {
      // Remove favorite
      const { error } = await supabase
        .from("rhythm_game_favorites")
        .delete()
        .eq("profile_id", userId)
        .eq("song_id", songId);

      if (error) {
        // Revert on error
        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.add(songId);
          return next;
        });
      }
    } else {
      // Add favorite
      const { error } = await supabase
        .from("rhythm_game_favorites")
        .insert({ profile_id: userId, song_id: songId });

      if (error) {
        // Revert on error
        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.delete(songId);
          return next;
        });
      }
    }
  }, [userId, favoriteIds]);

  const isFavorite = useCallback((songId: string) => {
    return favoriteIds.has(songId);
  }, [favoriteIds]);

  return {
    favoriteIds,
    loading,
    toggleFavorite,
    isFavorite,
    favoriteCount: favoriteIds.size,
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
