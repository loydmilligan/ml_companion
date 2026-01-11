#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${OPENROUTER_API_KEY:-}" ]]; then
  echo "Missing OPENROUTER_API_KEY env var." >&2
  exit 1
fi

models=(
  "openai/gpt-5-image-mini"
  "black-forest-labs/flux.2-pro"
  "google/gemini-2.5-flash-image"
)

prompts=(
  "Simple logo for Talking Music League: bold icon + wordmark, 2 colors max, favicon-friendly."
  "Retro music nostalgia logo for Talking Music League, minimal shapes, 2–3 colors, clean and legible."
  "Logo inspired by classic MTV News vibe, but original: chunky shapes, 2–3 colors, high contrast."
  "Modern playful logo: musical note + speech bubble concept, minimal geometry, 2–3 colors."
)

out_dir="generated/logo-ideas"
mkdir -p "$out_dir"

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-//;s/-$//'
}

for model in "${models[@]}"; do
  model_dir="$out_dir/$(slugify "$model")"
  mkdir -p "$model_dir"
  for prompt in "${prompts[@]}"; do
    slug="$(slugify "$prompt")"
    json_path="$model_dir/${slug}.json"
    png_path="$model_dir/${slug}.png"

    curl -sS https://openrouter.ai/api/v1/chat/completions \
      -H "Authorization: Bearer $OPENROUTER_API_KEY" \
      -H "Content-Type: application/json" \
      -H "HTTP-Referer: https://talkingmusicleague.app" \
      -H "X-Title: Talking Music League trophies" \
      -d "$(cat <<EOF
{
  "model": "$model",
  "modalities": ["image","text"],
  "messages": [
    {"role": "user", "content": "$prompt"}
  ]
}
EOF
)" > "$json_path"

    python3 - <<PY
import base64, json, re, sys
path = "$json_path"
out = "$png_path"
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)
images = data.get("choices", [{}])[0].get("message", {}).get("images", [])
if not images:
    print("No images for", path, file=sys.stderr)
    sys.exit(0)
url = images[0].get("image_url", {}).get("url", "")
m = re.match(r"data:image/\\w+;base64,(.+)", url)
if not m:
    print("No base64 image data for", path, file=sys.stderr)
    sys.exit(0)
with open(out, "wb") as f:
    f.write(base64.b64decode(m.group(1)))
print("Wrote", out)
PY
  done
done

echo "Done. Images saved under $out_dir"
