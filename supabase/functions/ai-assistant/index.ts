import { corsHeaders } from "../_shared/cors.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const OPENROUTER_MODEL = Deno.env.get("OPENROUTER_MODEL") ?? "anthropic/claude-3.5-sonnet";

type RoundInfo = {
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
  mode: "explain_theme" | "validate_song" | "generate_hint" | "chat_response";
  round?: RoundInfo;
  user_query?: string;
  song_info?: SongInfo;
  recent_messages?: ChatMessage[];
};

const buildExplainPrompt = (round: RoundInfo) => {
  return `You are a helpful assistant for a family music league game.

Explain the following theme clearly, including:
1. What the theme means
2. What types of songs would qualify
3. Edge cases to consider
4. A few example songs that would fit

Theme: "${round.theme}"
${round.theme_description ? `Description: ${round.theme_description}` : ""}
${round.theme_author ? `Theme by: ${round.theme_author}` : ""}

Keep your response friendly, helpful, and under 200 words.`;
};

const buildValidatePrompt = (round: RoundInfo, song: SongInfo) => {
  return `You are a rules judge for a family music league game.

Theme: "${round.theme}"
${round.theme_description ? `Theme description: ${round.theme_description}` : ""}

Song to validate: "${song.title}" by ${song.artist || "Unknown artist"}

Determine if this song fits the theme. Consider:
1. Does it literally match the theme requirements?
2. Are there any edge cases or ambiguities?
3. What's your confidence level?

Respond in this JSON format:
{"valid": true/false, "confidence": "high"/"medium"/"low", "reason": "brief explanation"}

Return ONLY the JSON, no other text.`;
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
- Explaining the theme
- Suggesting song ideas (without giving away your picks)
- Answering music trivia
- General league questions

Don't reveal other players' submissions or votes.`;
};

const callOpenRouter = async (prompt: string, temperature = 0.7, maxTokens = 300) => {
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
    const { mode, round, user_query, song_info, recent_messages } = body;

    if (!round) {
      return new Response(
        JSON.stringify({ error: "Missing round information" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: Record<string, unknown> = {};

    switch (mode) {
      case "explain_theme": {
        const prompt = buildExplainPrompt(round);
        const explanation = await callOpenRouter(prompt, 0.7, 400);
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
        const response = await callOpenRouter(prompt, 0.3, 200);
        try {
          const parsed = JSON.parse(response);
          result = { validation: parsed };
        } catch {
          result = { validation: { valid: null, confidence: "low", reason: response } };
        }
        break;
      }

      case "generate_hint": {
        const prompt = buildHintPrompt(round, user_query);
        const hint = await callOpenRouter(prompt, 0.9, 200);
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
        const response = await callOpenRouter(prompt, 0.8, 200);
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
