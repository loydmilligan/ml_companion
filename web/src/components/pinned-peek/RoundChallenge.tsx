import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useYouTubeSidebar, extractYouTubeId } from "../youtube-sidebar";

type ChallengeSong = {
  title: string;
  artist: string;
  theme: string;
  spotify_url: string;
  youtube_url: string;
};

type RoundChallengeProps = {
  roundId: string | null;
  currentTheme: string | null;
};

const SEASON_1_THEMES = [
  "Dance IF nobody's watching",
  "Movie Stars",
  "Hit then quit it",
  "Finding Emos",
  "I like big butts and a can of limes",
  "Turn that Sh!# down!",
  "Most likely to...",
  "Nada de ingles",
  "Eh for effort",
];

export default function RoundChallenge({ roundId, currentTheme }: RoundChallengeProps) {
  const { openSidebar } = useYouTubeSidebar();
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<ChallengeSong[]>([]);
  const [guesses, setGuesses] = useState<{ [key: number]: string }>({});
  const [results, setResults] = useState<{ [key: number]: boolean | null }>({});
  const [error, setError] = useState<string | null>(null);

  // Load challenge songs
  const loadChallenge = useCallback(async () => {
    if (!roundId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke("round-challenge", {
        body: {
          mode: "generate",
          current_theme: currentTheme || "",
        },
      });

      if (fetchError) throw fetchError;
      if (data?.songs && data.songs.length > 0) {
        setSongs(data.songs);
        setGuesses({});
        setResults({});
      } else {
        setError("Unable to generate challenge songs.");
      }
    } catch (err) {
      console.error("Error loading challenge:", err);
      setError("Failed to load challenge. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [roundId, currentTheme]);

  useEffect(() => {
    if (roundId && songs.length === 0) {
      loadChallenge();
    }
  }, [roundId, loadChallenge, songs.length]);

  const handleGuessChange = (songIndex: number, theme: string) => {
    setGuesses((prev) => ({ ...prev, [songIndex]: theme }));
  };

  const handleSubmitGuess = (songIndex: number) => {
    const song = songs[songIndex];
    const guess = guesses[songIndex];
    if (!song || !guess) return;

    const isCorrect = guess.toLowerCase().trim() === song.theme.toLowerCase().trim();
    setResults((prev) => ({ ...prev, [songIndex]: isCorrect }));
  };

  const handleYouTubeClick = (song: ChallengeSong) => {
    const videoId = extractYouTubeId(song.youtube_url);
    if (videoId) {
      openSidebar(videoId, `${song.title} - ${song.artist}`);
    }
  };

  const correctCount = Object.values(results).filter((r) => r === true).length;
  const totalGuessed = Object.values(results).filter((r) => r !== null).length;

  if (!roundId) return null;

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

      {loading ? (
        <div className="ai-assistant-loading">
          <div className="spinner" />
          <span>Loading challenge...</span>
        </div>
      ) : error ? (
        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          {error}
          <button
            onClick={loadChallenge}
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
                  >
                    <option value="">Select a theme...</option>
                    {SEASON_1_THEMES.map((theme) => (
                      <option key={theme} value={theme}>
                        {theme}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleSubmitGuess(index)}
                    disabled={!guesses[index]}
                  >
                    Guess
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
        <button
          onClick={loadChallenge}
          style={{
            padding: "10px 16px",
            background: "var(--navy)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Start Challenge
        </button>
      )}
    </div>
  );
}
