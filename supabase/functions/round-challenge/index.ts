import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const OPENROUTER_MODEL = Deno.env.get("OPENROUTER_MODEL") ?? "anthropic/claude-3.5-sonnet";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
  mode: "get_or_generate" | "regenerate" | "admin_update" | "save_guess" | "get_guesses";
  round_id?: string;
  group_id?: string;
  user_id?: string;
  current_theme?: string;
  song_number?: 1 | 2;
  guessed_theme?: string;
  // Admin update fields
  song1_spotify_url?: string;
  song1_youtube_url?: string;
  song2_spotify_url?: string;
  song2_youtube_url?: string;
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

  return `You are a music expert helping create a fun trivia game for a family music league.

The game is: "Guess which Season 1 theme this song would fit!"

Your job is to suggest 2 songs that COULD HAVE been submitted to these past themes, but probably weren't. The players will listen to the songs and try to guess which theme each one fits.

Season 1 themes to choose from:
${themesExcludingCurrent.map((t, i) => `${i + 1}. "${t}"`).join("\n")}

Requirements:
1. Choose 2 DIFFERENT songs that fit 2 DIFFERENT themes
2. Pick songs that are well-known enough that players might recognize them
3. The connection to the theme should be clever and interesting - not too obvious, but not too obscure either
4. The songs should make players think "Oh, that's a great pick for that theme!" when the answer is revealed
5. Songs should ideally be from different decades/genres for variety
6. DO NOT pick songs that are super obvious choices - pick creative interpretations

Theme interpretation hints:
- "Dance IF nobody's watching" = Songs about dancing freely, being uninhibited, solo dancing
- "Movie Stars" = Songs about celebrities, Hollywood, fame, or songs by actors who sing
- "Hit then quit it" = One-hit wonders, or songs about brief encounters/leaving
- "Finding Emos" = Emo music, emotional songs, songs with "emo" themes
- "I like big butts and a can of limes" = Songs about body parts, or songs with lime/lemon themes, tropical vibes
- "Turn that Sh!# down!" = Loud, intense songs, or songs someone might complain about
- "Most likely to..." = Songs about predictions, superlatives, being voted on
- "Nada de ingles" = Non-English songs
- "Eh for effort" = Canadian artists, or songs about trying

For each song, provide:
- title: exact song title
- artist: artist name
- theme: which Season 1 theme it fits (copy exactly from list above)
- spotify_url: a valid Spotify URL (format: https://open.spotify.com/track/[id])
- youtube_url: a valid YouTube URL (format: https://www.youtube.com/watch?v=[id])

IMPORTANT: Provide real, working URLs for actual songs on Spotify and YouTube. Look up the actual track IDs.

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
      "X-Title": "TML - Round Challenge",
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

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body: RequestBody = await req.json().catch(() => ({})) as RequestBody;
    const { mode, round_id, group_id, user_id, current_theme } = body;

    // Get or generate challenge for a round
    if (mode === "get_or_generate") {
      if (!round_id || !group_id) {
        return new Response(
          JSON.stringify({ error: "Missing round_id or group_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if challenge exists for this round
      const { data: existingChallenge } = await supabase
        .from("round_challenges")
        .select("*")
        .eq("round_id", round_id)
        .eq("group_id", group_id)
        .eq("active", true)
        .maybeSingle();

      if (existingChallenge) {
        // Return existing challenge
        const songs: SongSuggestion[] = [
          {
            title: existingChallenge.song1_title || "",
            artist: existingChallenge.song1_artist || "",
            theme: existingChallenge.song1_correct_theme || "",
            spotify_url: existingChallenge.song1_spotify_url || "",
            youtube_url: existingChallenge.song1_youtube_url || "",
          },
          {
            title: existingChallenge.song2_title || "",
            artist: existingChallenge.song2_artist || "",
            theme: existingChallenge.song2_correct_theme || "",
            spotify_url: existingChallenge.song2_spotify_url || "",
            youtube_url: existingChallenge.song2_youtube_url || "",
          },
        ];

        return new Response(
          JSON.stringify({
            challenge_id: existingChallenge.id,
            songs,
            themes: SEASON_1_THEMES,
            from_db: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // No existing challenge - generate new one
      if (!OPENROUTER_API_KEY) {
        return new Response(
          JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const prompt = buildGeneratePrompt(current_theme ?? "");
      const response = await callOpenRouter(prompt, 0.9, 500);

      let songs: SongSuggestion[] = [];
      try {
        const parsed = JSON.parse(response);
        songs = parsed.songs || [];
      } catch {
        return new Response(
          JSON.stringify({ error: "Failed to generate songs", raw: response }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (songs.length < 2) {
        return new Response(
          JSON.stringify({ error: "Not enough songs generated" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Save to database
      const { data: newChallenge, error: insertError } = await supabase
        .from("round_challenges")
        .insert({
          round_id,
          group_id,
          song1_title: songs[0].title,
          song1_artist: songs[0].artist,
          song1_spotify_url: songs[0].spotify_url,
          song1_youtube_url: songs[0].youtube_url,
          song1_correct_theme: songs[0].theme,
          song2_title: songs[1].title,
          song2_artist: songs[1].artist,
          song2_spotify_url: songs[1].spotify_url,
          song2_youtube_url: songs[1].youtube_url,
          song2_correct_theme: songs[1].theme,
          active: true,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Failed to save challenge:", insertError);
      }

      return new Response(
        JSON.stringify({
          challenge_id: newChallenge?.id ?? null,
          songs,
          themes: SEASON_1_THEMES,
          from_db: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Regenerate challenge - deactivate old one and create new
    if (mode === "regenerate") {
      if (!round_id || !group_id) {
        return new Response(
          JSON.stringify({ error: "Missing round_id or group_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!OPENROUTER_API_KEY) {
        return new Response(
          JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Deactivate any existing challenges for this round
      await supabase
        .from("round_challenges")
        .update({ active: false })
        .eq("round_id", round_id)
        .eq("group_id", group_id);

      // Generate new challenge
      const prompt = buildGeneratePrompt(current_theme ?? "");
      const response = await callOpenRouter(prompt, 0.95, 500); // Higher temp for variety

      let songs: SongSuggestion[] = [];
      try {
        const parsed = JSON.parse(response);
        songs = parsed.songs || [];
      } catch {
        return new Response(
          JSON.stringify({ error: "Failed to generate songs", raw: response }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (songs.length < 2) {
        return new Response(
          JSON.stringify({ error: "Not enough songs generated" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Save new challenge
      const { data: newChallenge, error: insertError } = await supabase
        .from("round_challenges")
        .insert({
          round_id,
          group_id,
          song1_title: songs[0].title,
          song1_artist: songs[0].artist,
          song1_spotify_url: songs[0].spotify_url,
          song1_youtube_url: songs[0].youtube_url,
          song1_correct_theme: songs[0].theme,
          song2_title: songs[1].title,
          song2_artist: songs[1].artist,
          song2_spotify_url: songs[1].spotify_url,
          song2_youtube_url: songs[1].youtube_url,
          song2_correct_theme: songs[1].theme,
          active: true,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Failed to save challenge:", insertError);
      }

      return new Response(
        JSON.stringify({
          challenge_id: newChallenge?.id ?? null,
          songs,
          themes: SEASON_1_THEMES,
          regenerated: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin update - save verified links
    if (mode === "admin_update") {
      if (!round_id || !group_id) {
        return new Response(
          JSON.stringify({ error: "Missing round_id or group_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updates: Record<string, string> = {};
      if (body.song1_spotify_url) updates.song1_spotify_url = body.song1_spotify_url;
      if (body.song1_youtube_url) updates.song1_youtube_url = body.song1_youtube_url;
      if (body.song2_spotify_url) updates.song2_spotify_url = body.song2_spotify_url;
      if (body.song2_youtube_url) updates.song2_youtube_url = body.song2_youtube_url;

      const { error } = await supabase
        .from("round_challenges")
        .update(updates)
        .eq("round_id", round_id)
        .eq("group_id", group_id)
        .eq("active", true);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save user guess
    if (mode === "save_guess") {
      const { song_number, guessed_theme } = body;

      if (!round_id || !group_id || !user_id || !song_number || !guessed_theme) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the challenge
      const { data: challenge } = await supabase
        .from("round_challenges")
        .select("id, song1_correct_theme, song2_correct_theme")
        .eq("round_id", round_id)
        .eq("group_id", group_id)
        .eq("active", true)
        .maybeSingle();

      if (!challenge) {
        return new Response(
          JSON.stringify({ error: "Challenge not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user already guessed this song
      const { data: existingGuess } = await supabase
        .from("challenge_guesses")
        .select("id")
        .eq("challenge_id", challenge.id)
        .eq("user_id", user_id)
        .eq("song_number", song_number)
        .maybeSingle();

      if (existingGuess) {
        return new Response(
          JSON.stringify({ error: "Already guessed this song", already_guessed: true }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if guess is correct
      const correctTheme = song_number === 1 ? challenge.song1_correct_theme : challenge.song2_correct_theme;
      const isCorrect = guessed_theme.toLowerCase().trim() === (correctTheme || "").toLowerCase().trim();

      // Save the guess
      const { error: guessError } = await supabase
        .from("challenge_guesses")
        .insert({
          challenge_id: challenge.id,
          user_id,
          song_number,
          guessed_theme,
          is_correct: isCorrect,
        });

      if (guessError) {
        return new Response(
          JSON.stringify({ error: guessError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          is_correct: isCorrect,
          correct_theme: correctTheme,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's guesses for a round
    if (mode === "get_guesses") {
      if (!round_id || !group_id || !user_id) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the challenge
      const { data: challenge } = await supabase
        .from("round_challenges")
        .select("id, song1_correct_theme, song2_correct_theme")
        .eq("round_id", round_id)
        .eq("group_id", group_id)
        .eq("active", true)
        .maybeSingle();

      if (!challenge) {
        return new Response(
          JSON.stringify({ guesses: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user's guesses
      const { data: guesses } = await supabase
        .from("challenge_guesses")
        .select("song_number, guessed_theme, is_correct")
        .eq("challenge_id", challenge.id)
        .eq("user_id", user_id);

      return new Response(
        JSON.stringify({
          guesses: guesses || [],
          correct_themes: {
            1: challenge.song1_correct_theme,
            2: challenge.song2_correct_theme,
          },
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
