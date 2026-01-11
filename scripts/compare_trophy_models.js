const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_INPUT = "web/src/data/awards.json";
const OUTPUT_DIR = process.env.OUTPUT_DIR ?? "generated";
const OUTPUT_FILE = process.env.OUTPUT_FILE ?? "award-trophy-model-compare.html";
const API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const CHEAP_MODEL = process.env.OPENROUTER_ROUND_IMAGE_MODEL ?? "";
const MID_MODEL = process.env.OPENROUTER_MID_MODEL ?? "";
const EXPENSIVE_MODEL = process.env.OPENROUTER_TROPHY_MODEL ?? "";
const SIZE = process.env.TROPHY_SIZE ?? "200x200";
const DELAY_MS = Number(process.env.OPENROUTER_DELAY_MS ?? "700");
const REFERER = process.env.OPENROUTER_REFERER ?? "";
const TITLE = process.env.OPENROUTER_TITLE ?? "";
const IMAGE_ASPECT_RATIO = process.env.IMAGE_ASPECT_RATIO ?? "";
const IMAGE_SIZE = process.env.IMAGE_SIZE ?? "";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseArgs = () => {
  const args = process.argv.slice(2);
  const input = args.find((arg) => !arg.startsWith("--")) ?? DEFAULT_INPUT;
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 10;
  return { input, limit: Number.isFinite(limit) ? limit : null };
};

const generateImage = async (model, prompt) => {
  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
  if (REFERER) headers["HTTP-Referer"] = REFERER;
  if (TITLE) headers["X-Title"] = TITLE;

  const body = {
    model,
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

const buildPrompt = (promptBase) =>
  `${promptBase}. Stylized graphic art, bold comic-book or video-game icon style, clean vector-like shading, centered, clean white background, no text. Avoid photo-realism and 3D render look.`;

const buildHtml = (rows, cheapModel, midModel, expensiveModel) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Trophy Model Comparison</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "Space Grotesk", "Segoe UI", sans-serif;
      }
      body {
        margin: 0;
        background: #f6f1ea;
        color: #1b1b1b;
      }
      header {
        padding: 28px 32px 12px;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 26px;
      }
      .meta {
        color: #5a5046;
        font-size: 14px;
      }
      main {
        padding: 16px 32px 32px;
        display: grid;
        gap: 16px;
      }
      .card {
        background: #ffffff;
        border-radius: 16px;
        padding: 16px;
        display: grid;
        gap: 12px;
        border: 1px solid rgba(20, 20, 20, 0.08);
      }
      .row {
        display: grid;
        gap: 12px;
        grid-template-columns: minmax(120px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr);
      }
      .cell {
        background: #f9f6f2;
        border-radius: 12px;
        padding: 10px;
        display: grid;
        justify-items: center;
        gap: 8px;
        border: 1px solid rgba(20, 20, 20, 0.08);
      }
      img {
        width: 120px;
        height: 120px;
        object-fit: cover;
        border-radius: 10px;
        border: 1px solid rgba(20, 20, 20, 0.08);
        background: #fff;
      }
      .label {
        font-size: 12px;
        color: #4a4037;
        text-align: center;
      }
      .award-title {
        font-weight: 700;
      }
      .thumbs {
        display: flex;
        gap: 6px;
      }
      .thumb {
        border: 1px solid rgba(20, 20, 20, 0.2);
        background: #fff;
        border-radius: 8px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 14px;
      }
      .thumb.active {
        background: #1b1b1b;
        color: #fff;
      }
      .footer {
        padding: 12px 32px 28px;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
      }
      .button {
        background: #1b1b1b;
        color: #fff;
        border: none;
        border-radius: 10px;
        padding: 10px 14px;
        cursor: pointer;
        font-weight: 600;
      }
      .button.secondary {
        background: #fff;
        color: #1b1b1b;
        border: 1px solid rgba(20, 20, 20, 0.2);
      }
      .status {
        color: #5a5046;
        font-size: 13px;
      }
      @media (max-width: 960px) {
        .row {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Trophy Model Comparison</h1>
      <div class="meta">Left: ${cheapModel} · Middle: ${midModel} · Right: ${expensiveModel}</div>
      <div class="meta">Click a thumb in each row, then export ratings JSON.</div>
    </header>
    <main>
      ${rows
        .map(
          (row) => `
          <section class="card" data-award-id="${row.id}">
            <div class="award-title">${row.name}</div>
            <div class="row">
              <div class="cell">
                <img src="${row.cheap_src}" alt="${row.name} cheap" />
                <div class="label">${cheapModel}</div>
                <div class="thumbs">
                  <button class="thumb" data-choice="left">👍</button>
                </div>
              </div>
              <div class="cell">
                <img src="${row.mid_src}" alt="${row.name} middle" />
                <div class="label">${midModel}</div>
                <div class="thumbs">
                  <button class="thumb" data-choice="middle">👍</button>
                </div>
              </div>
              <div class="cell">
                <img src="${row.expensive_src}" alt="${row.name} expensive" />
                <div class="label">${expensiveModel}</div>
                <div class="thumbs">
                  <button class="thumb" data-choice="right">👍</button>
                </div>
              </div>
            </div>
          </section>
        `
        )
        .join("")}
    </main>
    <div class="footer">
      <button class="button" id="export">Export ratings JSON</button>
      <button class="button secondary" id="clear">Clear selections</button>
      <span class="status" id="status">0 / ${rows.length} rows rated</span>
    </div>
    <script>
      const rows = Array.from(document.querySelectorAll(".card"));
      const status = document.getElementById("status");
      const updateStatus = () => {
        const rated = rows.filter((row) => row.dataset.choice).length;
        status.textContent = rated + " / " + rows.length + " rows rated";
      };
      rows.forEach((row) => {
        const buttons = Array.from(row.querySelectorAll(".thumb"));
        buttons.forEach((btn) => {
          btn.addEventListener("click", () => {
            buttons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            row.dataset.choice = btn.dataset.choice;
            updateStatus();
          });
        });
      });
      document.getElementById("clear").addEventListener("click", () => {
        rows.forEach((row) => {
          row.dataset.choice = "";
          row.querySelectorAll(".thumb").forEach((btn) => btn.classList.remove("active"));
        });
        updateStatus();
      });
      document.getElementById("export").addEventListener("click", () => {
        const payload = rows.map((row) => ({
            award_id: Number(row.dataset.awardId),
            award_name: row.querySelector(".award-title")?.textContent ?? "",
            choice: row.dataset.choice ?? "",
            models: {
              left: "${cheapModel}",
              middle: "${midModel}",
              right: "${expensiveModel}"
            }
          }));
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "trophy-model-ratings.json";
        link.click();
        URL.revokeObjectURL(url);
      });
      updateStatus();
    </script>
  </body>
</html>`;

const main = async () => {
  const { input, limit } = parseArgs();
  if (!API_KEY || !CHEAP_MODEL || !MID_MODEL || !EXPENSIVE_MODEL) {
    throw new Error("Missing OPENROUTER_API_KEY, OPENROUTER_ROUND_IMAGE_MODEL, OPENROUTER_MID_MODEL, or OPENROUTER_TROPHY_MODEL.");
  }

  const raw = await fs.readFile(input, "utf-8");
  const data = JSON.parse(raw);
  const awards = data?.awards ?? [];
  const selection = limit ? awards.slice(0, limit) : awards;
  const rows = [];

  for (const award of selection) {
    const prompt = buildPrompt(award.trophy_prompt ?? "");
    const cheap = await generateImage(CHEAP_MODEL, prompt);
    const mid = await generateImage(MID_MODEL, prompt);
    const expensive = await generateImage(EXPENSIVE_MODEL, prompt);
  const asSrc = (value) => {
    if (!value) return "";
    if (value.startsWith("data:image")) return value;
    return `data:image/png;base64,${value}`;
  };
    rows.push({
      id: award.id,
      name: award.name,
      cheap_src: asSrc(cheap ?? ""),
      mid_src: asSrc(mid ?? ""),
      expensive_src: asSrc(expensive ?? ""),
    });
    if (DELAY_MS > 0) {
      await sleep(DELAY_MS);
    }
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(OUTPUT_DIR, OUTPUT_FILE);
  await fs.writeFile(outputPath, buildHtml(rows, CHEAP_MODEL, MID_MODEL, EXPENSIVE_MODEL));
  console.log(`Wrote comparison file: ${outputPath}`);
};

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
