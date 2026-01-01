import { corsHeaders } from "../_shared/cors.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const OPENROUTER_MODEL = Deno.env.get("OPENROUTER_MODEL") ?? "anthropic/claude-3.5-sonnet";

// Season 1 themes for the challenge game
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

type RequestBody = {
  mode: "generate" | "validate_guess";
  current_theme?: string;
  song_number?: 1 | 2;
  guessed_theme?: string;
  correct_theme?: string;
};

type SongSuggestion = {
  title: string;
  artist: string;
  theme: string;
  spotify_url: string;
  youtube_url: string;
};

const buildGeneratePrompt = (currentTheme: string) => {
  const themesExcludingCurrent = SEASON_1_THEMES.filter(
    (t) => t.toLowerCase() !== currentTheme.toLowerCase()
  );

  return `You are a music expert helping with a fun family game.

Pick 2 songs that each fit one of these Season 1 music league themes:
${themesExcludingCurrent.map((t, i) => `${i + 1}. "${t}"`).join("\n")}

Requirements:
1. Choose 2 DIFFERENT songs from 2 DIFFERENT themes
2. Songs should be well-known enough that people might recognize them
3. The connection to the theme should be interesting but not too obvious
4. Songs should be from different decades/genres for variety

For each song, provide:
- title: exact song title
- artist: artist name
- theme: which Season 1 theme it fits
- spotify_url: a valid Spotify URL (format: https://open.spotify.com/track/[id])
- youtube_url: a valid YouTube URL (format: https://www.youtube.com/watch?v=[id])

IMPORTANT: Provide real, working URLs for actual songs on Spotify and YouTube.

Respond in this exact JSON format:
{
  "songs": [
    {"title": "...", "artist": "...", "theme": "...", "spotify_url": "...", "youtube_url": "..."},
    {"title": "...", "artist": "...", "theme": "...", "spotify_url": "...", "youtube_url": "..."}
  ]
}

Return ONLY the JSON, no other text.`;
};

const callOpenRouter = async (prompt: string, temperature = 0.9, maxTokens = 500) => {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter request failed: ${text}`);
  }

  const json = await response.json();
  return json?.choices?.[0]?.message?.content ?? "";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!OPENROUTER_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: RequestBody = await req.json().catch(() => ({})) as RequestBody;
    const { mode, current_theme, song_number, guessed_theme, correct_theme } = body;

    if (mode === "generate") {
      const prompt = buildGeneratePrompt(current_theme ?? "");
      const response = await callOpenRouter(prompt, 0.9, 500);

      let songs: SongSuggestion[] = [];
      try {
        const parsed = JSON.parse(response);
        songs = parsed.songs || [];
      } catch {
        // If parsing fails, return an error
        return new Response(
          JSON.stringify({ error: "Failed to generate songs", raw: response }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          songs,
          themes: SEASON_1_THEMES,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode === "validate_guess") {
      if (!guessed_theme || !correct_theme) {
        return new Response(
          JSON.stringify({ error: "Missing guessed_theme or correct_theme" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isCorrect =
        guessed_theme.toLowerCase().trim() === correct_theme.toLowerCase().trim();

      return new Response(
        JSON.stringify({
          is_correct: isCorrect,
          correct_theme: correct_theme,
          guessed_theme: guessed_theme,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown mode: ${mode}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
