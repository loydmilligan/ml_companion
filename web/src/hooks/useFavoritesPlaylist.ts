import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export type PlaylistSong = {
  id: string;
  submission_id: string;
  source: "submitted" | "top_voted" | "manual";
  round_id: string | null;
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

export function useFavoritesPlaylist() {
  const { profile } = useAuth();
  const [playlist, setPlaylist] = useState<PlaylistSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = profile?.id;

  // Fetch playlist
  const fetchPlaylist = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("favorites_playlist")
      .select(`
        id,
        submission_id,
        source,
        round_id,
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
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching playlist:", fetchError);
      setError(fetchError.message);
    } else {
      setPlaylist(data as PlaylistSong[] || []);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  // Check if a submission is in the playlist
  const isInPlaylist = useCallback((submissionId: string): boolean => {
    return playlist.some(item => item.submission_id === submissionId);
  }, [playlist]);

  // Add to playlist
  const addToPlaylist = useCallback(async (submissionId: string) => {
    if (!userId) {
      setError("You must be logged in to add to playlist");
      return false;
    }

    const { error: insertError } = await supabase
      .from("favorites_playlist")
      .insert({
        profile_id: userId,
        submission_id: submissionId,
        source: "manual",
        round_id: null,
      });

    if (insertError) {
      console.error("Error adding to playlist:", insertError);
      setError(insertError.message);
      return false;
    }

    // Refresh playlist
    await fetchPlaylist();
    return true;
  }, [userId, fetchPlaylist]);

  // Remove from playlist
  const removeFromPlaylist = useCallback(async (submissionId: string) => {
    if (!userId) {
      setError("You must be logged in to remove from playlist");
      return false;
    }

    const { error: deleteError } = await supabase
      .from("favorites_playlist")
      .delete()
      .eq("profile_id", userId)
      .eq("submission_id", submissionId);

    if (deleteError) {
      console.error("Error removing from playlist:", deleteError);
      setError(deleteError.message);
      return false;
    }

    // Refresh playlist
    await fetchPlaylist();
    return true;
  }, [userId, fetchPlaylist]);

  // Seed playlist
  const seedPlaylist = useCallback(async () => {
    if (!userId) {
      setError("You must be logged in to seed playlist");
      return false;
    }

    setLoading(true);
    setError(null);

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setError("No active session");
      setLoading(false);
      return false;
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seed-favorites-playlist`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Seed playlist failed:", response.status, errorText);
      setError(`Failed to seed playlist: ${errorText}`);
      setLoading(false);
      return false;
    }

    const result = await response.json();
    console.log("Playlist seeded:", result);

    // Refresh playlist
    await fetchPlaylist();
    return true;
  }, [userId, fetchPlaylist]);

  return {
    playlist,
    loading,
    error,
    isInPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    seedPlaylist,
    refetch: fetchPlaylist,
  };
}
