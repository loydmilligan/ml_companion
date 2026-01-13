import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

// Type definitions for the JSON data
type Category = {
  id: string;
  original_title: string;
  revised_title: string;
  description: string;
  keyword_hints: string[];
};

type Song = {
  title: string;
  artist: string;
  category_id: string;
  note?: string;
  youtube_url?: string;
};

type SongListData = {
  meta: {
    description: string;
    total_songs: number;
    strategy: string;
  };
  categories: Category[];
  songs: Song[];
};

export type ChallengeSong = {
  id: string;
  title: string;
  artist: string;
  category_id: string;
  artwork_url: string | null;
  youtube_url: string | null;
};

export type ChallengeTheme = {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
};

type SavedGuess = {
  song_id: string;
  guessed_theme_id: string;
  is_correct: boolean | null;
};

export type UseRoundChallengeReturn = {
  // Data
  songs: ChallengeSong[];
  themes: ChallengeTheme[];
  assignments: Record<string, string>; // song_id -> theme_id
  loading: boolean;
  error: string | null;

  // State
  isLocked: boolean;
  isSubmitted: boolean;
  canPlay: boolean;

  // Results (only when revealed)
  results: Record<string, boolean> | null; // song_id -> is_correct
  correctAnswers: Record<string, string> | null; // song_id -> correct_theme_id
  score: number | null;

  // Actions
  assignSongToTheme: (songId: string, themeId: string) => void;
  removeSongFromTheme: (songId: string) => void;
  submitGuesses: () => Promise<void>;
  reload: () => Promise<void>;

  // Submission state
  isSubmitting: boolean;
};

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Select 3 random songs from different categories
function selectChallengeSongs(allSongs: Song[], categories: Category[]): { songs: Song[]; correctMap: Record<string, string> } {
  // Group songs by category
  const songsByCategory: Record<string, Song[]> = {};
  allSongs.forEach(song => {
    if (!songsByCategory[song.category_id]) {
      songsByCategory[song.category_id] = [];
    }
    songsByCategory[song.category_id].push(song);
  });

  // Shuffle categories and pick 3
  const shuffledCategories = shuffleArray(categories).slice(0, 3);

  // Pick one random song from each selected category
  const selectedSongs: Song[] = [];
  const correctMap: Record<string, string> = {};

  shuffledCategories.forEach(category => {
    const categorySongs = songsByCategory[category.id] || [];
    if (categorySongs.length > 0) {
      const randomSong = categorySongs[Math.floor(Math.random() * categorySongs.length)];
      selectedSongs.push(randomSong);
      // Use title as temporary ID until we have proper IDs
      correctMap[`${randomSong.title}-${randomSong.artist}`] = category.id;
    }
  });

  return { songs: shuffleArray(selectedSongs), correctMap };
}

export function useRoundChallenge(
  roundId: string | null,
  groupId: string | null,
  isRevealed: boolean
): UseRoundChallengeReturn {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [songListData, setSongListData] = useState<SongListData | null>(null);
  const [challengeSongs, setChallengeSongs] = useState<ChallengeSong[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState<Record<string, string> | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [savedGuesses, setSavedGuesses] = useState<SavedGuess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load the song list JSON
  const loadSongList = useCallback(async () => {
    try {
      const response = await fetch("/data/round_challenge_song_list.json");
      if (!response.ok) {
        throw new Error("Failed to load song list");
      }
      const data: SongListData = await response.json();
      setSongListData(data);
      return data;
    } catch (err) {
      console.error("Error loading song list:", err);
      setError("Failed to load challenge data");
      return null;
    }
  }, []);

  // Load saved guesses from database
  const loadSavedGuesses = useCallback(async () => {
    if (!roundId || !groupId || !userId) return [];

    try {
      const { data } = await supabase
        .from("round_challenge_guesses")
        .select("song_id, guessed_theme_id, is_correct")
        .eq("round_id", roundId)
        .eq("group_id", groupId)
        .eq("user_id", userId);

      return (data as SavedGuess[]) ?? [];
    } catch (err) {
      console.error("Error loading saved guesses:", err);
      return [];
    }
  }, [roundId, groupId, userId]);

  // Initialize the game
  const loadData = useCallback(async () => {
    if (!roundId || !groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load song list data (always needed for theme descriptions)
      const data = await loadSongList();
      if (!data) {
        setLoading(false);
        return;
      }

      // First, check for admin picks for this round
      const { data: adminPicks } = await supabase
        .from("round_challenge_admin_picks")
        .select(`
          submission_id,
          theme_id,
          submissions!inner(id, title, artist, artwork_url, youtube_url)
        `)
        .eq("target_round_id", roundId);

      let songs: ChallengeSong[];
      let correctMap: Record<string, string>;

      if (adminPicks && adminPicks.length > 0) {
        // Use admin picks - these are songs from a previous S2 round
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        songs = adminPicks.map((pick: any) => {
          const sub = pick.submissions;
          return {
            id: sub.id,
            title: sub.title,
            artist: sub.artist ?? "Unknown",
            category_id: pick.theme_id,
            artwork_url: sub.artwork_url,
            youtube_url: sub.youtube_url,
          };
        });

        // Build correct answers map from admin picks
        correctMap = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        adminPicks.forEach((pick: any) => {
          correctMap[pick.submission_id] = pick.theme_id;
        });

        // Note: We don't save to round_challenge_v2 when using admin picks
        // The admin picks table IS the source of truth
      } else {
        // Fallback to existing behavior - check for round_challenge_v2 or generate new
        const { data: existingChallenge } = await supabase
          .from("round_challenge_v2")
          .select("*")
          .eq("round_id", roundId)
          .eq("group_id", groupId)
          .maybeSingle();

        if (existingChallenge) {
          // Use existing challenge
          songs = existingChallenge.songs as ChallengeSong[];
          correctMap = existingChallenge.correct_answers as Record<string, string>;
        } else {
          // Generate new challenge from JSON song list
          const { songs: selectedSongs, correctMap: newCorrectMap } = selectChallengeSongs(data.songs, data.categories);

          // Convert to ChallengeSong format with IDs
          songs = selectedSongs.map((s, idx) => ({
            id: `song-${idx}-${s.title.replace(/\s/g, '-').toLowerCase()}`,
            title: s.title,
            artist: s.artist,
            category_id: s.category_id,
            artwork_url: null, // Will be fetched later or use placeholder
            youtube_url: s.youtube_url ?? null,
          }));

          // Update correctMap with new IDs
          correctMap = {};
          songs.forEach(s => {
            const key = `${s.title}-${s.artist}`;
            if (newCorrectMap[key]) {
              correctMap[s.id] = newCorrectMap[key];
            } else {
              correctMap[s.id] = s.category_id;
            }
          });

          // Save the challenge to database
          await supabase
            .from("round_challenge_v2")
            .insert({
              round_id: roundId,
              group_id: groupId,
              songs: songs,
              correct_answers: correctMap,
            });
        }
      }

      setChallengeSongs(songs);
      setCorrectAnswers(correctMap);

      // Load user's saved guesses
      const guesses = await loadSavedGuesses();
      setSavedGuesses(guesses);

      // Restore assignments from saved guesses
      if (guesses.length > 0) {
        const restoredAssignments: Record<string, string> = {};
        guesses.forEach(g => {
          restoredAssignments[g.song_id] = g.guessed_theme_id;
        });
        setAssignments(restoredAssignments);
      }
    } catch (err) {
      console.error("Error loading round challenge:", err);
      setError("Failed to load challenge");
    } finally {
      setLoading(false);
    }
  }, [roundId, groupId, loadSongList, loadSavedGuesses]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute themes from song list data
  const themes: ChallengeTheme[] = useMemo(() => {
    if (!songListData) return [];

    return songListData.categories.map(cat => ({
      id: cat.id,
      title: cat.revised_title || cat.original_title,
      description: cat.description,
      thumbnail_url: `/images/minigames/themes/${cat.id}.png`,
    }));
  }, [songListData]);

  // Check if user has already submitted
  const isSubmitted = savedGuesses.length === challengeSongs.length && challengeSongs.length > 0;
  const isLocked = isSubmitted;
  const canPlay = challengeSongs.length > 0 && themes.length > 0;

  // Compute results (only when revealed)
  const results = useMemo(() => {
    if (!isRevealed || !correctAnswers || savedGuesses.length === 0) return null;

    const resultMap: Record<string, boolean> = {};
    savedGuesses.forEach(g => {
      resultMap[g.song_id] = g.is_correct ?? false;
    });
    return resultMap;
  }, [isRevealed, correctAnswers, savedGuesses]);

  // Compute score
  const score = useMemo(() => {
    if (!results) return null;
    return Object.values(results).filter(r => r).length;
  }, [results]);

  // Assign song to theme
  const assignSongToTheme = useCallback((songId: string, themeId: string) => {
    if (isLocked) return;

    setAssignments(prev => ({
      ...prev,
      [songId]: themeId,
    }));
  }, [isLocked]);

  // Remove song from theme
  const removeSongFromTheme = useCallback((songId: string) => {
    if (isLocked) return;

    setAssignments(prev => {
      const newAssignments = { ...prev };
      delete newAssignments[songId];
      return newAssignments;
    });
  }, [isLocked]);

  // Submit guesses
  const submitGuesses = useCallback(async () => {
    if (!roundId || !groupId || !userId || !correctAnswers || isLocked || isSubmitting) return;

    // Check all songs are assigned
    const allAssigned = challengeSongs.every(s => assignments[s.id]);
    if (!allAssigned) {
      setError("Please assign all songs to themes before submitting");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Calculate correctness for each guess
      const guessesToSave = challengeSongs.map(song => ({
        round_id: roundId,
        group_id: groupId,
        user_id: userId,
        song_id: song.id,
        guessed_theme_id: assignments[song.id],
        is_correct: assignments[song.id] === correctAnswers[song.id],
      }));

      // Save all guesses
      const { error: saveError } = await supabase
        .from("round_challenge_guesses")
        .insert(guessesToSave);

      if (saveError) {
        throw saveError;
      }

      // Update saved guesses state
      setSavedGuesses(guessesToSave.map(g => ({
        song_id: g.song_id,
        guessed_theme_id: g.guessed_theme_id,
        is_correct: g.is_correct,
      })));
    } catch (err) {
      console.error("Error submitting guesses:", err);
      setError("Failed to submit guesses. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [roundId, groupId, userId, correctAnswers, isLocked, isSubmitting, challengeSongs, assignments]);

  return {
    songs: challengeSongs,
    themes,
    assignments,
    loading,
    error,
    isLocked,
    isSubmitted,
    canPlay,
    results,
    correctAnswers: isRevealed ? correctAnswers : null,
    score,
    assignSongToTheme,
    removeSongFromTheme,
    submitGuesses,
    reload: loadData,
    isSubmitting,
  };
}
