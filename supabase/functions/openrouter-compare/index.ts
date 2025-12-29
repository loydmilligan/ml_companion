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
  const songA = body?.songA ?? "";
  const songB = body?.songB ?? "";

  if (!songA || !songB) {
    return new Response(
      JSON.stringify({ error: "Missing song details." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const prompt = `You are a music historian. Given two songs, find an interesting, concrete connection between them (shared samples, band members, producer, genre movement, touring together, label history, influence). Keep it to 2-3 sentences and avoid fluff.

Song A: ${songA}
Song B: ${songB}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 220,
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
  const content = json?.choices?.[0]?.message?.content ?? "No response";

  return new Response(
    JSON.stringify({ content }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
