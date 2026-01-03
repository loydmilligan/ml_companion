import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyAuth, unauthorizedResponse } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const OPENROUTER_MODEL = Deno.env.get("OPENROUTER_MODEL") ?? "anthropic/claude-3.5-sonnet";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type RoundInfo = {
  id?: string;
  theme: string;
  theme_description?: string | null;
  theme_author?: string | null;
};

type SongInfo = {
  title: string;
  artist?: string | null;
};

type ChatMessage = {
  body: string;
  author?: string | null;
};

type RequestBody = {
  mode: "explain_theme" | "validate_song" | "generate_hint" | "chat_response" | "get_settings";
  round?: RoundInfo;
  group_id?: string;
  user_id?: string;
  user_query?: string;
  song_info?: SongInfo;
  recent_messages?: ChatMessage[];
};

const buildExplainPrompt = (round: RoundInfo) => {
  return `You are a friendly helper for a family music league game. A player is asking about the current theme.

Theme: "${round.theme}"
${round.theme_description ? `Description: ${round.theme_description}` : ""}
${round.theme_author ? `Theme by: ${round.theme_author}` : ""}

Please share your thoughts on this theme:
1. What the theme seems to be asking for
2. Some general directions songs might take
3. A few possible interpretations or angles to consider

IMPORTANT: You are NOT the official rules judge. The theme creator and group have the final say on what fits. Your role is just to help brainstorm and share ideas - not to define strict rules. Be encouraging and suggest that players discuss edge cases with their group!

Keep your response friendly, encouraging, and under 200 words. Use phrases like "I think..." or "It seems like..." rather than definitive statements.`;
};

const buildValidatePrompt = (round: RoundInfo, song: SongInfo) => {
  return `You are a helpful assistant for a family music league game. A player wants your opinion on whether a song might fit the theme.

Theme: "${round.theme}"
${round.theme_description ? `Theme description: ${round.theme_description}` : ""}

Song: "${song.title}" by ${song.artist || "Unknown artist"}

Share your thoughts on whether this might fit. Consider:
1. How it might connect to the theme
2. Potential arguments for and against
3. Your overall impression

IMPORTANT: This is just your opinion to help the player think it through. The theme creator and group have the final say! Encourage them to discuss with their group if unsure.

Respond in this JSON format:
{"valid": true/false/null, "confidence": "high"/"medium"/"low", "reason": "your friendly thoughts"}

Use null for valid if it's truly ambiguous. Return ONLY the JSON.`;
};

const buildHintPrompt = (round: RoundInfo, existingQuery?: string) => {
  return `You are a creative hint generator for a family music league game.

Theme: "${round.theme}"
${round.theme_description ? `Description: ${round.theme_description}` : ""}

${existingQuery ? `User's question: ${existingQuery}` : "The user needs a hint to find a good song for this theme."}

Provide a helpful, creative hint that:
1. Points them in the right direction without giving away specific songs
2. Suggests genres, decades, or artists to explore
3. Mentions any clever angles or interpretations they might not have considered
4. Is encouraging and fun

Keep your hint under 100 words and don't reveal specific song titles unless absolutely necessary.`;
};

const buildChatPrompt = (round: RoundInfo, messages: ChatMessage[], query: string) => {
  const recentContext = messages
    .slice(-10)
    .map((m) => `${m.author || "Someone"}: ${m.body}`)
    .join("\n");

  return `You are a friendly AI assistant in a family music league chat. Your name is "League Bot".

Current round theme: "${round.theme}"
${round.theme_description ? `Theme description: ${round.theme_description}` : ""}

Recent chat messages:
${recentContext}

User's question to you: ${query}

Respond helpfully and briefly (under 100 words). Be friendly and fun!
You can help with:
- Sharing thoughts on the theme (but you're not the official judge!)
- Suggesting song ideas (without giving away your picks)
- Answering music trivia
- General league questions

Don't reveal other players' submissions or votes. Remind them that the group has the final say on rules!`;
};

const callOpenRouter = async (prompt: string, temperature = 0.7, maxTokens = 300, xTitle = "TML - AI Assistant") => {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": xTitle,
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

  // Verify JWT authentication
  const { user, error: authError } = await verifyAuth(req);
  if (authError) {
    return unauthorizedResponse(authError, corsHeaders);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body: RequestBody = await req.json().catch(() => ({})) as RequestBody;
    // Use authenticated user ID instead of trusting client-provided user_id
    const { mode, round, group_id, user_query, song_info, recent_messages } = body;
    const user_id = user.id;

    // Mode: get_settings - return AI settings for the group
    if (mode === "get_settings") {
      if (!group_id) {
        return new Response(
          JSON.stringify({ error: "Missing group_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: settings } = await supabase
        .from("group_settings")
        .select("ai_explain_enabled, ai_validate_enabled, ai_hint_enabled, ai_assistant_enabled, ai_validate_daily_limit, ai_chat_enabled")
        .eq("group_id", group_id)
        .maybeSingle();

      // Get user's daily usage for validate
      let usageToday = 0;
      if (user_id) {
        const today = new Date().toISOString().split("T")[0];
        const { data: usage } = await supabase
          .from("user_ai_usage")
          .select("count")
          .eq("user_id", user_id)
          .eq("group_id", group_id)
          .eq("usage_type", "validate_song")
          .eq("usage_date", today)
          .maybeSingle();
        usageToday = usage?.count ?? 0;
      }

      return new Response(
        JSON.stringify({
          settings: {
            ai_explain_enabled: settings?.ai_explain_enabled ?? true,
            ai_validate_enabled: settings?.ai_validate_enabled ?? true,
            ai_hint_enabled: settings?.ai_hint_enabled ?? true,
            ai_assistant_enabled: settings?.ai_assistant_enabled ?? true,
            ai_validate_daily_limit: settings?.ai_validate_daily_limit ?? 5,
            ai_chat_enabled: settings?.ai_chat_enabled ?? true,
          },
          usage: {
            validate_today: usageToday,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!round) {
      return new Response(
        JSON.stringify({ error: "Missing round information" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if AI assistant is enabled for this group
    if (group_id) {
      const { data: settings } = await supabase
        .from("group_settings")
        .select("ai_explain_enabled, ai_validate_enabled, ai_hint_enabled, ai_assistant_enabled, ai_validate_daily_limit, ai_chat_enabled")
        .eq("group_id", group_id)
        .maybeSingle();

      const aiEnabled = settings?.ai_assistant_enabled ?? true;
      if (!aiEnabled) {
        return new Response(
          JSON.stringify({ error: "AI Assistant is disabled for this group" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check specific feature toggles
      if (mode === "explain_theme" && !(settings?.ai_explain_enabled ?? true)) {
        return new Response(
          JSON.stringify({ error: "Theme explanation is disabled for this group" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (mode === "validate_song" && !(settings?.ai_validate_enabled ?? true)) {
        return new Response(
          JSON.stringify({ error: "Song validation is disabled for this group" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (mode === "generate_hint" && !(settings?.ai_hint_enabled ?? true)) {
        return new Response(
          JSON.stringify({ error: "Hint generation is disabled for this group" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (mode === "chat_response" && !(settings?.ai_chat_enabled ?? true)) {
        return new Response(
          JSON.stringify({ error: "Chat AI is disabled for this group" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check daily limit for validate_song
      if (mode === "validate_song" && user_id) {
        const dailyLimit = settings?.ai_validate_daily_limit ?? 5;
        const today = new Date().toISOString().split("T")[0];

        const { data: usage } = await supabase
          .from("user_ai_usage")
          .select("count")
          .eq("user_id", user_id)
          .eq("group_id", group_id)
          .eq("usage_type", "validate_song")
          .eq("usage_date", today)
          .maybeSingle();

        const usageCount = usage?.count ?? 0;
        if (usageCount >= dailyLimit) {
          return new Response(
            JSON.stringify({
              error: "Daily limit reached",
              message: `You've used all ${dailyLimit} song checks for today. Try again tomorrow!`,
              limit: dailyLimit,
              used: usageCount,
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    let result: Record<string, unknown> = {};

    switch (mode) {
      case "explain_theme": {
        // Check cache first
        if (round.id && group_id) {
          const { data: cached } = await supabase
            .from("round_ai_cache")
            .select("content")
            .eq("round_id", round.id)
            .eq("group_id", group_id)
            .eq("cache_type", "explain")
            .maybeSingle();

          if (cached?.content) {
            result = { explanation: cached.content, cached: true };
            break;
          }
        }

        const prompt = buildExplainPrompt(round);
        const explanation = await callOpenRouter(prompt, 0.7, 400, "TML - Explain Theme");

        // Cache the result
        if (round.id && group_id) {
          await supabase
            .from("round_ai_cache")
            .upsert({
              round_id: round.id,
              group_id,
              cache_type: "explain",
              content: explanation,
            }, { onConflict: "round_id,group_id,cache_type" });
        }

        result = { explanation };
        break;
      }

      case "validate_song": {
        if (!song_info) {
          return new Response(
            JSON.stringify({ error: "Missing song_info for validation" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const prompt = buildValidatePrompt(round, song_info);
        const response = await callOpenRouter(prompt, 0.3, 200, "TML - Check Song");

        // Track usage
        if (user_id && group_id) {
          const today = new Date().toISOString().split("T")[0];
          await supabase.rpc("increment_ai_usage", {
            p_user_id: user_id,
            p_group_id: group_id,
            p_usage_type: "validate_song",
            p_usage_date: today,
          }).catch(() => {
            // Fallback: upsert manually
            supabase
              .from("user_ai_usage")
              .upsert({
                user_id,
                group_id,
                usage_type: "validate_song",
                usage_date: today,
                count: 1,
              }, { onConflict: "user_id,group_id,usage_type,usage_date" })
              .then(({ error }) => {
                if (error) {
                  // If upsert fails, try incrementing
                  supabase
                    .from("user_ai_usage")
                    .update({ count: supabase.rpc("increment", { x: 1 }) })
                    .eq("user_id", user_id)
                    .eq("group_id", group_id)
                    .eq("usage_type", "validate_song")
                    .eq("usage_date", today);
                }
              });
          });
        }

        try {
          const parsed = JSON.parse(response);
          result = { validation: parsed };
        } catch {
          result = { validation: { valid: null, confidence: "low", reason: response } };
        }
        break;
      }

      case "generate_hint": {
        // Check cache first
        if (round.id && group_id) {
          const { data: cached } = await supabase
            .from("round_ai_cache")
            .select("content")
            .eq("round_id", round.id)
            .eq("group_id", group_id)
            .eq("cache_type", "hint")
            .maybeSingle();

          if (cached?.content) {
            result = { hint: cached.content, cached: true };
            break;
          }
        }

        const prompt = buildHintPrompt(round, user_query);
        const hint = await callOpenRouter(prompt, 0.9, 200, "TML - Get Hint");

        // Cache the result
        if (round.id && group_id) {
          await supabase
            .from("round_ai_cache")
            .upsert({
              round_id: round.id,
              group_id,
              cache_type: "hint",
              content: hint,
            }, { onConflict: "round_id,group_id,cache_type" });
        }

        result = { hint };
        break;
      }

      case "chat_response": {
        if (!user_query) {
          return new Response(
            JSON.stringify({ error: "Missing user_query for chat response" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const prompt = buildChatPrompt(round, recent_messages ?? [], user_query);
        const response = await callOpenRouter(prompt, 0.8, 200, "TML - AI Chat");
        result = { response };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown mode: ${mode}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
