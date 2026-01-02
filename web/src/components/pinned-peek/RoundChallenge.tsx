import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useYouTubeSidebar, extractYouTubeId } from "../youtube-sidebar";

type ChallengeSong = {
  title: string;
  artist: string;
  theme: string;
  spotify_url: string;
  youtube_url: string;
};

type SavedGuess = {
  song_number: number;
  guessed_theme: string;
  is_correct: boolean;
};

type RoundChallengeProps = {
  roundId: string | null;
  groupId: string | null;
  currentTheme: string | null;
  previousRoundChallenge?: {
    song1: { title: string; artist: string; theme: string } | null;
    song2: { title: string; artist: string; theme: string } | null;
  } | null;
};

const SEASON_1_THEMES: { name: string; description: string }[] = [
  { name: "Dance IF nobody's watching", description: "Dance music - but only songs you'd only dance to when alone" },
  { name: "Movie Stars", description: "Songs by artists who have also acted in movies" },
  { name: "Hit then quit it", description: "One-hit wonders - artists known for just one popular song" },
  { name: "Finding Emos", description: "Emo, emotional, or angsty music" },
  { name: "I like big butts and a can of limes", description: "Songs that reference body parts or food/drinks" },
  { name: "Turn that Sh!# down!", description: "Loud, aggressive, or intense music" },
  { name: "Most likely to...", description: "Songs that could complete the phrase 'most likely to...'" },
  { name: "Nada de ingles", description: "Songs not in English" },
  { name: "Eh for effort", description: "Songs where the artist tried something different or took a risk" },
];

export default function RoundChallenge({ roundId, groupId, currentTheme, previousRoundChallenge }: RoundChallengeProps) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const { openSidebar } = useYouTubeSidebar();
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<ChallengeSong[]>([]);
  const [guesses, setGuesses] = useState<{ [key: number]: string }>({});
  const [results, setResults] = useState<{ [key: number]: boolean | null }>({});
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [submitting, setSubmitting] = useState<{ [key: number]: boolean }>({});

  // Load challenge and user's previous guesses
  const loadChallenge = useCallback(async () => {
    if (!roundId || !groupId) return;

    setLoading(true);
    setError(null);

    try {
      // Get or generate challenge
      const { data, error: fetchError } = await supabase.functions.invoke("round-challenge", {
        body: {
          mode: "get_or_generate",
          round_id: roundId,
          group_id: groupId,
          current_theme: currentTheme || "",
        },
      });

      if (fetchError) throw fetchError;
      if (data?.songs && data.songs.length > 0) {
        setSongs(data.songs);

        // Load user's previous guesses if logged in
        if (userId) {
          const { data: guessData } = await supabase.functions.invoke("round-challenge", {
            body: {
              mode: "get_guesses",
              round_id: roundId,
              group_id: groupId,
              user_id: userId,
            },
          });

          if (guessData?.guesses && guessData.guesses.length > 0) {
            const savedGuesses: { [key: number]: string } = {};
            const savedResults: { [key: number]: boolean | null } = {};

            guessData.guesses.forEach((g: SavedGuess) => {
              const idx = g.song_number - 1;
              savedGuesses[idx] = g.guessed_theme;
              savedResults[idx] = g.is_correct;
            });

            setGuesses(savedGuesses);
            setResults(savedResults);
          }
        }
        setHasLoaded(true);
      } else if (data?.error) {
        setError(data.error);
      } else {
        setError("Unable to load challenge songs.");
      }
    } catch (err) {
      console.error("Error loading challenge:", err);
      setError("Failed to load challenge. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [roundId, groupId, currentTheme, userId]);

  useEffect(() => {
    if (roundId && groupId && !hasLoaded) {
      loadChallenge();
    }
  }, [roundId, groupId, loadChallenge, hasLoaded]);

  const handleGuessChange = (songIndex: number, theme: string) => {
    setGuesses((prev) => ({ ...prev, [songIndex]: theme }));
  };

  const handleSubmitGuess = async (songIndex: number) => {
    const song = songs[songIndex];
    const guess = guesses[songIndex];
    if (!song || !guess || !roundId || !groupId || !userId) return;

    setSubmitting((prev) => ({ ...prev, [songIndex]: true }));

    try {
      const { data, error: submitError } = await supabase.functions.invoke("round-challenge", {
        body: {
          mode: "save_guess",
          round_id: roundId,
          group_id: groupId,
          user_id: userId,
          song_number: songIndex + 1,
          guessed_theme: guess,
        },
      });

      if (submitError) throw submitError;

      if (data?.already_guessed) {
        // User already guessed this song - load their previous guess
        setResults((prev) => ({
          ...prev,
          [songIndex]: guess.toLowerCase().trim() === song.theme.toLowerCase().trim(),
        }));
      } else {
        setResults((prev) => ({ ...prev, [songIndex]: data?.is_correct ?? false }));
      }
    } catch (err) {
      console.error("Error submitting guess:", err);
      // Fallback to local validation
      const isCorrect = guess.toLowerCase().trim() === song.theme.toLowerCase().trim();
      setResults((prev) => ({ ...prev, [songIndex]: isCorrect }));
    } finally {
      setSubmitting((prev) => ({ ...prev, [songIndex]: false }));
    }
  };

  const handleYouTubeClick = (song: ChallengeSong) => {
    const videoId = extractYouTubeId(song.youtube_url);
    if (videoId) {
      openSidebar(videoId, `${song.title} - ${song.artist}`);
    }
  };

  const correctCount = Object.values(results).filter((r) => r === true).length;
  const totalGuessed = Object.values(results).filter((r) => r !== null).length;

  if (!roundId || !groupId) return null;

  return (
    <div className="round-challenge-section">
      <div className="round-challenge-header">
        <h3>Round Challenge</h3>
        {totalGuessed > 0 && (
          <span className="round-challenge-score">
            {correctCount}/{totalGuessed} correct
          </span>
        )}
      </div>

      <p className="round-challenge-intro">
        Guess which Season 1 theme each song belonged to!
      </p>

      {loading ? (
        <div className="ai-assistant-loading">
          <div className="spinner" />
          <span>Loading challenge...</span>
        </div>
      ) : error ? (
        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          {error}
          <button
            onClick={() => {
              setHasLoaded(false);
              loadChallenge();
            }}
            style={{
              marginLeft: 8,
              padding: "4px 8px",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      ) : songs.length > 0 ? (
        <div className="round-challenge-songs">
          {songs.map((song, index) => (
            <div key={index} className="challenge-song-card">
              <div className="challenge-song-info">
                <p className="challenge-song-title">{song.title}</p>
                <p className="challenge-song-artist">{song.artist}</p>
              </div>

              <div className="challenge-song-links">
                <a
                  href={song.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="challenge-link-btn spotify"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  Spotify
                </a>
                <button
                  type="button"
                  className="challenge-link-btn youtube"
                  onClick={() => handleYouTubeClick(song)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube
                </button>
              </div>

              {results[index] === null || results[index] === undefined ? (
                <div className="challenge-guess-form">
                  <select
                    value={guesses[index] || ""}
                    onChange={(e) => handleGuessChange(index, e.target.value)}
                    disabled={submitting[index]}
                  >
                    <option value="">Select a theme...</option>
                    {SEASON_1_THEMES.map((theme) => (
                      <option key={theme.name} value={theme.name} title={theme.description}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleSubmitGuess(index)}
                    disabled={!guesses[index] || submitting[index]}
                  >
                    {submitting[index] ? "..." : "Guess"}
                  </button>
                </div>
              ) : (
                <div className={`challenge-result ${results[index] ? "correct" : "incorrect"}`}>
                  {results[index] ? (
                    <>Correct! It was "{song.theme}"</>
                  ) : (
                    <>Wrong! It was "{song.theme}" (you guessed "{guesses[index]}")</>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Challenge not available yet.
        </p>
      )}

      {/* Previous round answers */}
      {previousRoundChallenge && (previousRoundChallenge.song1 || previousRoundChallenge.song2) && (
        <div className="previous-challenge-answers">
          <h4>Last Round's Answers</h4>
          {previousRoundChallenge.song1 && (
            <p className="previous-answer">
              <strong>{previousRoundChallenge.song1.title}</strong> - {previousRoundChallenge.song1.artist}
              <span className="answer-theme">{previousRoundChallenge.song1.theme}</span>
            </p>
          )}
          {previousRoundChallenge.song2 && (
            <p className="previous-answer">
              <strong>{previousRoundChallenge.song2.title}</strong> - {previousRoundChallenge.song2.artist}
              <span className="answer-theme">{previousRoundChallenge.song2.theme}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
