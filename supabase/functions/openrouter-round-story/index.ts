import { corsHeaders } from "../_shared/cors.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const OPENROUTER_MODEL = Deno.env.get("OPENROUTER_MODEL") ?? "anthropic/claude-3.5-sonnet";

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

  const body = await req.json().catch(() => ({}));
  const round = body?.round ?? null;
  const songs = body?.songs ?? [];
  const votes = body?.votes ?? [];
  const prompt = `You are a music league storyteller and creative art director.

Given a round summary JSON, return:
1) "narrative": 5-7 sentences that recap the round, call out standout songs or trends, and highlight fun awards.
2) "image_prompt": a vivid, playful visual concept that blends the theme with the dominant genre or mood. Aim for something weird and fun but still family-friendly.

Return only JSON with keys: narrative, image_prompt.

Round JSON:
${JSON.stringify({ round, songs, votes })}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.85,
      max_tokens: 520,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return new Response(
      JSON.stringify({ error: "OpenRouter request failed", detail: text }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content ?? "";
  let parsed: { narrative?: string; image_prompt?: string } = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }

  return new Response(
    JSON.stringify({
      narrative: parsed.narrative ?? content,
      image_prompt: parsed.image_prompt ?? "",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
