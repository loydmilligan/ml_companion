import { corsHeaders } from "../_shared/cors.ts";
import { verifyAuth, unauthorizedResponse } from "../_shared/auth.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const OPENROUTER_MODEL = Deno.env.get("OPENROUTER_MODEL") ?? "anthropic/claude-3.5-sonnet";
const OPENROUTER_ROUND_IMAGE_MODEL = Deno.env.get("OPENROUTER_ROUND_IMAGE_MODEL");
const OPENROUTER_MID_MODEL = Deno.env.get("OPENROUTER_MID_MODEL");
const OPENROUTER_TROPHY_MODEL = Deno.env.get("OPENROUTER_TROPHY_MODEL");
const OPENROUTER_IMAGE_ASPECT_RATIO = Deno.env.get("OPENROUTER_IMAGE_ASPECT_RATIO");
const OPENROUTER_IMAGE_SIZE = Deno.env.get("OPENROUTER_IMAGE_SIZE");

type WinnerInput = {
  place: number;
  name: string | null;
  song: string;
  artist: string | null;
  traits: string | null;
};

type AwardInput = {
  id: number;
  name: string;
  description: string;
  category: string;
  measurement: Record<string, unknown>;
};

type ImageResult = {
  image_url: string | null;
  image_base64: string | null;
};

const buildThemePrompt = (round: Record<string, unknown> | null) => {
  const title = (round?.title as string | undefined) ?? "Music League";
  const description = (round?.description as string | undefined) ?? "";
  const author = (round?.author as string | undefined) ?? "";
  const detail = [description, author ? `Theme by ${author}` : ""].filter(Boolean).join(" ");
  return `Create a single, family-friendly illustration that captures the music league round theme.
Theme title: ${title}
${detail ? `Details: ${detail}` : ""}
Style: playful, warm, high energy, no text or logos.`;
};

const buildWinnersPrompt = (winners: WinnerInput[], themeTitle: string | null) => {
  const winnerLines = winners
    .map((winner) => {
      const name = winner.name ?? "Unknown";
      const artist = winner.artist ?? "Unknown artist";
      const traits = winner.traits ?? "No traits provided";
      return `Place ${winner.place}: ${name} — "${winner.song}" by ${artist}. Traits: ${traits}`;
    })
    .join("\n");
  return `Create a single, family-friendly illustration featuring three people in one shared scene.
${themeTitle ? `Round theme: ${themeTitle}` : ""}
Each person should be acting out the name of their song in a playful, literal way.
Use the following winner details exactly:
${winnerLines}
No text or captions in the image.`;
};

const resolveModelKey = (key?: string | null) => {
  switch (key) {
    case "OPENROUTER_MODEL":
      return OPENROUTER_MODEL;
    case "OPENROUTER_ROUND_IMAGE_MODEL":
      return OPENROUTER_ROUND_IMAGE_MODEL ?? null;
    case "OPENROUTER_MID_MODEL":
      return OPENROUTER_MID_MODEL ?? null;
    case "OPENROUTER_TROPHY_MODEL":
      return OPENROUTER_TROPHY_MODEL ?? null;
    default:
      return null;
  }
};

const generateImage = async (prompt: string, modelOverride?: string | null, xTitle?: string): Promise<ImageResult> => {
  const model = modelOverride ?? OPENROUTER_ROUND_IMAGE_MODEL ?? null;
  if (!OPENROUTER_API_KEY || !model) {
    return { image_url: null, image_base64: null };
  }

  const body: Record<string, unknown> = {
    model,
    messages: [{ role: "user", content: prompt }],
    modalities: ["image", "text"],
  };
  if (OPENROUTER_IMAGE_ASPECT_RATIO || OPENROUTER_IMAGE_SIZE) {
    body.image_config = {
      ...(OPENROUTER_IMAGE_ASPECT_RATIO ? { aspect_ratio: OPENROUTER_IMAGE_ASPECT_RATIO } : {}),
      ...(OPENROUTER_IMAGE_SIZE ? { image_size: OPENROUTER_IMAGE_SIZE } : {}),
    };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": xTitle ?? "TML - Image Generation",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return { image_url: null, image_base64: null };
  }

  const json = await response.json();
  const imageUrl = json?.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? "";
  if (!imageUrl) {
    return { image_url: null, image_base64: null };
  }
  if (imageUrl.startsWith("data:image")) {
    const base64 = imageUrl.split(",")[1] ?? null;
    return { image_url: null, image_base64: base64 };
  }
  return {
    image_url: imageUrl,
    image_base64: null,
  };
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

  if (!OPENROUTER_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const mode = body?.mode ?? "story";
  const round = body?.round ?? null;
  const songs = body?.songs ?? [];
  const votes = body?.votes ?? [];
  const winners = (body?.winners ?? []) as WinnerInput[];
  const awards = (body?.awards ?? []) as AwardInput[];
  const recentAwards = (body?.recent_awards ?? []) as number[];
  const textModelKey = body?.text_model_key ?? null;
  const imageModelKey = body?.image_model_key ?? null;
  const awardsModelKey = body?.awards_model_key ?? null;

  const textModel = resolveModelKey(textModelKey) ?? OPENROUTER_MODEL;
  const imageModel = resolveModelKey(imageModelKey);
  const awardsModel = resolveModelKey(awardsModelKey) ?? OPENROUTER_MODEL;

  if (mode === "theme") {
    const themePrompt = buildThemePrompt(round);
    const image = await generateImage(themePrompt, imageModel, "TML - Round Banner");
    return new Response(
      JSON.stringify({ image_url: image.image_url, image_base64: image.image_base64 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (mode === "trophy") {
    const trophyPrompt = body?.trophy_prompt ?? null;
    if (!trophyPrompt) {
      return new Response(
        JSON.stringify({ error: "Missing trophy_prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const trophyModel = resolveModelKey(body?.trophy_model_key) ?? OPENROUTER_TROPHY_MODEL ?? OPENROUTER_ROUND_IMAGE_MODEL ?? null;
    const image = await generateImage(trophyPrompt, trophyModel, "TML - Trophy Image");
    return new Response(
      JSON.stringify({ image_url: image.image_url, image_base64: image.image_base64 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (mode === "season_awards") {
    const seasonData = body?.season_data ?? {};
    const seasonAwards = (body?.season_awards ?? []) as AwardInput[];

    const seasonAwardsPrompt = `You are an awards judge for a music league season finale.

Use the provided season statistics and the season awards catalog to select 3-5 awards that best recognize the season's achievements.
- Only select awards whose criteria appear satisfied by the data.
- Each award should go to the most deserving player based on the data.

For winner_name format:
- If award is for a specific song: "Song Title - Artist (by SubmitterName)"
- If award is for a person's overall performance: "PersonName"

Return JSON ONLY in this format:
{"awards":[{"award_id":101,"award_name":"...","winner_name":"...","reason":"..."}]}

Season statistics:
${JSON.stringify(seasonData)}

Season awards catalog:
${JSON.stringify(seasonAwards)}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "TML - Season Awards",
      },
      body: JSON.stringify({
        model: awardsModel,
        messages: [{ role: "user", content: seasonAwardsPrompt }],
        temperature: 0.4,
        max_tokens: 600,
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
    let parsed: { awards?: Array<Record<string, unknown>> } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    return new Response(
      JSON.stringify({ awards: parsed.awards ?? [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (mode === "season_narrative") {
    const seasonData = body?.season_data ?? {};
    const leagueName = body?.league_name ?? "Music League";

    const seasonNarrativePrompt = `You are a sports broadcaster and storyteller recapping an entire music league season.

Write a compelling 6-10 sentence narrative that:
- Celebrates the season's journey and evolution
- Highlights standout players, memorable moments, and key trends
- Notes any rivalries, surprise winners, or genre shifts
- Ends on an uplifting note about what made this season special

Keep the tone warm, family-friendly, and celebratory.

League name: ${leagueName}

Season statistics and highlights:
${JSON.stringify(seasonData)}

Return JSON ONLY with key: narrative`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "TML - Season Story",
      },
      body: JSON.stringify({
        model: textModel,
        messages: [{ role: "user", content: seasonNarrativePrompt }],
        temperature: 0.85,
        max_tokens: 800,
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
    let parsed: { narrative?: string } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { narrative: content };
    }

    return new Response(
      JSON.stringify({ narrative: parsed.narrative ?? content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (mode === "awards") {
    const awardsPrompt = `You are an awards judge for a music league round.

Use the provided round data and the awards catalog to select 2-5 awards that best fit this round.
- Only select awards whose criteria appear satisfied by the data.
- Avoid awards that appear in the recent_awards list.
- Prefer the most deserving awards; if several are tied, pick any.

For winner_name format:
- If award is for a specific song: "Song Title - Artist (by SubmitterName)"
- If award is for a person's overall performance: "PersonName"

Return JSON ONLY in this format:
{"awards":[{"award_id":1,"award_name":"...","winner_name":"...","reason":"..."}]}

Round data:
${JSON.stringify({ round, songs, votes })}

Awards catalog:
${JSON.stringify(awards)}

recent_awards:
${JSON.stringify(recentAwards)}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "TML - Round Awards",
      },
      body: JSON.stringify({
        model: awardsModel,
        messages: [{ role: "user", content: awardsPrompt }],
        temperature: 0.4,
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
    let parsed: { awards?: Array<Record<string, unknown>> } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    return new Response(
      JSON.stringify({ awards: parsed.awards ?? [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

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
      "X-Title": "TML - Round Story",
    },
    body: JSON.stringify({
      model: textModel,
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

  let imageResult: ImageResult = { image_url: null, image_base64: null };
  if (winners.length) {
    const imagePrompt = buildWinnersPrompt(winners, round?.title ?? null);
    imageResult = await generateImage(imagePrompt, imageModel, "TML - Winners Image");
  }

  return new Response(
    JSON.stringify({
      narrative: parsed.narrative ?? content,
      image_url: imageResult.image_url,
      image_base64: imageResult.image_base64,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
