import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export type ThemePlaylistItem = {
  id: string;
  submission_id: string;
  round_id: string;
  rank: number | null;
  created_at: string;
  submission: {
    id: string;
    title: string;
    artist: string | null;
    artwork_url: string | null;
    spotify_url: string | null;
    youtube_url: string | null;
    submitter_name: string | null;
  };
};

export function useThemePlaylist(roundId: string | null) {
  const { profile } = useAuth();
  const [playlist, setPlaylist] = useState<ThemePlaylistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = profile?.id;

  // Fetch playlist for current round
  const fetchPlaylist = useCallback(async () => {
    if (!userId || !roundId) {
      setPlaylist([]);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("theme_playlist")
      .select(`
        id,
        submission_id,
        round_id,
        rank,
        created_at,
        submission:submissions (
          id,
          title,
          artist,
          artwork_url,
          spotify_url,
          youtube_url,
          submitter_name
        )
      `)
      .eq("profile_id", userId)
      .eq("round_id", roundId)
      .order("rank", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("Error fetching theme playlist:", fetchError);
      setError(fetchError.message);
    } else {
      // Transform the data to match ThemePlaylistItem type
      const transformedData = (data || []).map(item => ({
        ...item,
        submission: Array.isArray(item.submission) ? item.submission[0] : item.submission
      })) as ThemePlaylistItem[];
      setPlaylist(transformedData);
    }

    setLoading(false);
  }, [userId, roundId]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  // Check if a submission is in the theme playlist
  const isInPlaylist = useCallback((submissionId: string): boolean => {
    return playlist.some(item => item.submission_id === submissionId);
  }, [playlist]);

  // Add to theme playlist
  const addToPlaylist = useCallback(async (submissionId: string) => {
    if (!userId) {
      setError("You must be logged in to add to theme playlist");
      return false;
    }

    if (!roundId) {
      setError("No active round for theme playlist");
      return false;
    }

    // Calculate next rank
    const maxRank = playlist.reduce((max, item) =>
      Math.max(max, item.rank ?? 0), 0);

    const { error: insertError } = await supabase
      .from("theme_playlist")
      .insert({
        profile_id: userId,
        submission_id: submissionId,
        round_id: roundId,
        rank: maxRank + 1,
      });

    if (insertError) {
      console.error("Error adding to theme playlist:", insertError);
      setError(insertError.message);
      return false;
    }

    // Refresh playlist
    await fetchPlaylist();
    return true;
  }, [userId, roundId, playlist, fetchPlaylist]);

  // Remove from theme playlist
  const removeFromPlaylist = useCallback(async (submissionId: string) => {
    if (!userId) {
      setError("You must be logged in to remove from theme playlist");
      return false;
    }

    if (!roundId) {
      setError("No active round");
      return false;
    }

    const { error: deleteError } = await supabase
      .from("theme_playlist")
      .delete()
      .eq("profile_id", userId)
      .eq("submission_id", submissionId)
      .eq("round_id", roundId);

    if (deleteError) {
      console.error("Error removing from theme playlist:", deleteError);
      setError(deleteError.message);
      return false;
    }

    // Refresh playlist
    await fetchPlaylist();
    return true;
  }, [userId, roundId, fetchPlaylist]);

  // Move item up in ranking
  const moveUp = useCallback(async (submissionId: string) => {
    const index = playlist.findIndex(item => item.submission_id === submissionId);
    if (index <= 0) return false; // Already at top or not found

    const currentItem = playlist[index];
    const previousItem = playlist[index - 1];

    // Swap ranks
    const { error: swapError } = await supabase.rpc('swap_theme_playlist_ranks', {
      item1_id: currentItem.id,
      item2_id: previousItem.id,
      item1_rank: previousItem.rank ?? index,
      item2_rank: currentItem.rank ?? index + 1,
    });

    if (swapError) {
      // Fallback: manual update
      await supabase
        .from("theme_playlist")
        .update({ rank: previousItem.rank ?? index })
        .eq("id", currentItem.id);

      await supabase
        .from("theme_playlist")
        .update({ rank: currentItem.rank ?? index + 1 })
        .eq("id", previousItem.id);
    }

    await fetchPlaylist();
    return true;
  }, [playlist, fetchPlaylist]);

  // Move item down in ranking
  const moveDown = useCallback(async (submissionId: string) => {
    const index = playlist.findIndex(item => item.submission_id === submissionId);
    if (index < 0 || index >= playlist.length - 1) return false; // At bottom or not found

    const currentItem = playlist[index];
    const nextItem = playlist[index + 1];

    // Swap ranks
    const { error: swapError } = await supabase.rpc('swap_theme_playlist_ranks', {
      item1_id: currentItem.id,
      item2_id: nextItem.id,
      item1_rank: nextItem.rank ?? index + 2,
      item2_rank: currentItem.rank ?? index + 1,
    });

    if (swapError) {
      // Fallback: manual update
      await supabase
        .from("theme_playlist")
        .update({ rank: nextItem.rank ?? index + 2 })
        .eq("id", currentItem.id);

      await supabase
        .from("theme_playlist")
        .update({ rank: currentItem.rank ?? index + 1 })
        .eq("id", nextItem.id);
    }

    await fetchPlaylist();
    return true;
  }, [playlist, fetchPlaylist]);

  return {
    playlist,
    loading,
    error,
    isInPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    moveUp,
    moveDown,
    refetch: fetchPlaylist,
  };
}
