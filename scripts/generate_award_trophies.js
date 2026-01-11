const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_INPUT = "docs/awards/music_league_awards_complete.json";
const OUTPUT_DIR = process.env.OUTPUT_DIR ?? "generated/award-trophies";
const MODEL = process.env.OPENROUTER_TROPHY_MODEL ?? process.env.OPENROUTER_ROUND_IMAGE_MODEL ?? "";
const API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const SIZE = process.env.TROPHY_SIZE ?? "200x200";
const DELAY_MS = Number(process.env.OPENROUTER_DELAY_MS ?? "700");
const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const UPLOAD_BUCKET = process.env.UPLOAD_BUCKET ?? "";
const REFERER = process.env.OPENROUTER_REFERER ?? "";
const TITLE = process.env.OPENROUTER_TITLE ?? "";
const IMAGE_ASPECT_RATIO = process.env.IMAGE_ASPECT_RATIO ?? "";
const IMAGE_SIZE = process.env.IMAGE_SIZE ?? "";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const parseArgs = () => {
  const args = process.argv.slice(2);
  const input = args.find((arg) => !arg.startsWith("--")) ?? DEFAULT_INPUT;
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : null;
  return { input, limit: Number.isFinite(limit) ? limit : null };
};

const uploadToSupabase = async (objectPath, buffer) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !UPLOAD_BUCKET) return null;
  const cleanPath = objectPath.replace(/^\/+/, "");
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${UPLOAD_BUCKET}/${cleanPath}`;
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "image/png",
      "x-upsert": "true",
    },
    body: buffer,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed: ${response.status} ${text}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${UPLOAD_BUCKET}/${cleanPath}`;
};

const generateImage = async (prompt) => {
  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
  if (REFERER) headers["HTTP-Referer"] = REFERER;
  if (TITLE) headers["X-Title"] = TITLE;

  const body = {
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    modalities: ["image", "text"],
  };
  if (IMAGE_ASPECT_RATIO || IMAGE_SIZE) {
    body.image_config = {
      ...(IMAGE_ASPECT_RATIO ? { aspect_ratio: IMAGE_ASPECT_RATIO } : {}),
      ...(IMAGE_SIZE ? { image_size: IMAGE_SIZE } : {}),
    };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter error: ${response.status} ${text} (model: ${MODEL})`);
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
  const { input, limit } = parseArgs();
  if (!API_KEY || !MODEL) {
    throw new Error("Missing OPENROUTER_API_KEY or OPENROUTER_TROPHY_MODEL.");
  }

  const raw = await fs.readFile(input, "utf-8");
  const data = JSON.parse(raw);
  const awards = data?.awards ?? [];
  const selection = limit ? awards.slice(0, limit) : awards;

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const manifest = [];

  for (const award of selection) {
    const promptBase = award.trophy_prompt ?? "";
    const prompt = `${promptBase}. Stylized graphic art, bold comic-book or video-game icon style, clean vector-like shading, centered, clean white background, no text. Avoid photo-realism and 3D render look.`;
    const slug = slugify(`${award.id}-${award.name}`);
    const filename = `award-${slug}.png`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    const objectPath = `trophies/${filename}`;

    const b64 = await generateImage(prompt);
    if (!b64) {
      console.warn(`No image returned for award ${award.id}`);
      continue;
    }

    const buffer = b64.startsWith("data:image") ? Buffer.from(b64.split(",")[1] ?? "", "base64") : Buffer.from(b64, "base64");
    await fs.writeFile(outputPath, buffer);

    let publicUrl = null;
    if (UPLOAD_BUCKET) {
      publicUrl = await uploadToSupabase(objectPath, buffer);
    }

    manifest.push({
      id: award.id,
      name: award.name,
      prompt,
      file: outputPath,
      public_url: publicUrl,
    });

    if (DELAY_MS > 0) {
      await sleep(DELAY_MS);
    }
  }

  const manifestPath = path.join(OUTPUT_DIR, "manifest.json");
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Generated ${manifest.length} trophies. Manifest: ${manifestPath}`);
};

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
