const fs = require("node:fs/promises");
const path = require("node:path");

const API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const OUTPUT_DIR = process.env.OUTPUT_DIR ?? "generated/logo-ideas";
const MODELS = (process.env.OPENROUTER_LOGO_MODELS ??
  "google/nano-banana-3.0,openai/gpt-image-1-mini,black-forest-labs/flux.2-pro")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

const REFERER = process.env.OPENROUTER_REFERER ?? "https://talkingmusicleague.app";
const TITLE = process.env.OPENROUTER_TITLE ?? "Talking Music League trophies";
const IMAGE_ASPECT_RATIO = process.env.IMAGE_ASPECT_RATIO ?? "1:1";
const IMAGE_SIZE = process.env.IMAGE_SIZE ?? "1K";
const DELAY_MS = Number(process.env.OPENROUTER_DELAY_MS ?? "700");

const PROMPTS = [
  {
    id: "nostalgia",
    label: "Nostalgia",
    prompt:
      "Logo for 'Talking Music League'. Simple cassette + chat bubble icon, warm retro palette, clean vector style, flat colors, no gradients, transparent background. Provide square icon + wordmark.",
  },
  {
    id: "mtv-news",
    label: "MTV News vibe",
    prompt:
      "Logo for 'Talking Music League' with a bold 90s news vibe (MTV News style): chunky block letters, thick black outline, flat high-contrast colors, minimal shapes, transparent background. Provide square icon + wordmark.",
  },
  {
    id: "modern-badge",
    label: "Modern badge",
    prompt:
      "Minimal logo: vinyl record merged with a speech bubble, two-tone palette, clean geometric lines, flat vector style, transparent background. Provide square icon + wordmark.",
  },
  {
    id: "favicon-first",
    label: "Favicon-first",
    prompt:
      "Favicon-first logo: one or two bold shapes only (record arc + speech bubble dot), 2-3 striking colors, high contrast, flat vector style, no text. Provide 1:1 square icon.",
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const generateImage = async (model, prompt) => {
  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": REFERER,
    "X-Title": TITLE,
  };

  const body = {
    model,
    messages: [{ role: "user", content: prompt }],
    modalities: ["image", "text"],
    image_config: {
      aspect_ratio: IMAGE_ASPECT_RATIO,
      image_size: IMAGE_SIZE,
    },
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter error: ${response.status} ${text} (model: ${model})`);
  }

  const json = await response.json();
  const imageUrl = json?.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? "";
  if (!imageUrl) return null;
  if (imageUrl.startsWith("data:image")) {
    return imageUrl.split(",")[1] ?? null;
  }
  return imageUrl;
};

const main = async () => {
  if (!API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY.");
  }
  if (!MODELS.length) {
    throw new Error("Missing OPENROUTER_LOGO_MODELS.");
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const manifest = [];

  for (const model of MODELS) {
    const modelDir = path.join(OUTPUT_DIR, slugify(model));
    await fs.mkdir(modelDir, { recursive: true });
    for (const prompt of PROMPTS) {
      const b64 = await generateImage(model, prompt.prompt);
      if (!b64) {
        console.warn(`No image for ${model} / ${prompt.id}`);
        continue;
      }
      const filename = `${prompt.id}.png`;
      const outputPath = path.join(modelDir, filename);
      const buffer = Buffer.from(b64, "base64");
      await fs.writeFile(outputPath, buffer);
      manifest.push({
        model,
        prompt_id: prompt.id,
        prompt_label: prompt.label,
        file: outputPath,
      });
      if (DELAY_MS > 0) await sleep(DELAY_MS);
    }
  }

  const manifestPath = path.join(OUTPUT_DIR, "manifest.json");
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Generated ${manifest.length} logos. Manifest: ${manifestPath}`);
};

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
