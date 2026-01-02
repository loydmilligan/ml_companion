# Supabase Edge Functions Setup

This project uses Supabase Edge Functions for:
- OpenRouter song-connection summaries
- OpenRouter round-story summaries (with awards, banners, narratives)
- Round Challenge game (AI-generated trivia)
- AI Assistant (theme explainer, rule validator, hint generator)
- Notifications (ntfy + optional Gmail SMTP)

## Edge Functions Overview

| Function | Purpose |
|----------|---------|
| `openrouter-compare` | Song connection summaries |
| `openrouter-round-story` | Round narratives, theme banners, awards, trophies, season narratives |
| `round-challenge` | Bonus game - guess which Season 1 theme songs belonged to |
| `ai-assistant` | Theme explanations, song validation, creative hints |
| `notify` | Push notifications via ntfy and email |

## 1) Install Supabase CLI
- Follow Supabase CLI install instructions for your OS.
- Verify:

```bash
supabase --version
```

## 2) Login and Link the Project
From the repo root:

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

You can find the project ref in Supabase → Project Settings → General.

## 3) Set Edge Function Secrets
Copy values from `supabase/.env.example` and set them as Supabase secrets:

```bash
supabase secrets set OPENROUTER_API_KEY=... OPENROUTER_MODEL=...
supabase secrets set OPENROUTER_ROUND_IMAGE_MODEL=...

supabase secrets set NTFY_SERVER_URL=... NTFY_TOPIC=... \
  NTFY_USERNAME=... NTFY_PASSWORD=...

supabase secrets set SMTP_USERNAME=... SMTP_PASSWORD=... SMTP_FROM_EMAIL=...
```

## 4) Deploy the Functions
```bash
# Deploy all functions at once (recommended)
supabase functions deploy ai-assistant openrouter-round-story openrouter-compare round-challenge notify --no-verify-jwt

# Or deploy individually
supabase functions deploy openrouter-compare --no-verify-jwt
supabase functions deploy openrouter-round-story --no-verify-jwt
supabase functions deploy round-challenge --no-verify-jwt
supabase functions deploy ai-assistant --no-verify-jwt
supabase functions deploy notify --no-verify-jwt
```

**Note:** The `--no-verify-jwt` flag is used because these functions handle their own authentication or are called from the server side.

## 5) Round Challenge Function

The `round-challenge` function manages the bonus trivia game where users guess which Season 1 theme songs belonged to.

**Modes:**
- `get_or_generate` - Returns existing challenge or generates new one via AI
- `admin_update` - Admin can update Spotify/YouTube URLs
- `save_guess` - Save user's guess (one per song per user)
- `get_guesses` - Retrieve user's previous guesses

**Database Tables:**
- `round_challenges` - Stores challenge songs per round
- `challenge_guesses` - User guesses with correctness
- `challenge_bonus_points` - Admin-awarded bonus points

## 6) OpenRouter Round Story Function

The `openrouter-round-story` function handles multiple AI generation modes:

**Modes:**
- `story` (default) - Generate round narrative and image prompt
- `theme` - Generate theme banner image
- `trophy` - Generate award trophy image
- `awards` - Select round awards from catalog
- `season_awards` - Select season finale awards
- `season_narrative` - Generate season recap narrative

**Environment Variables:**
- `OPENROUTER_MODEL` - Primary text model
- `OPENROUTER_ROUND_IMAGE_MODEL` - Image generation model
- `OPENROUTER_TROPHY_MODEL` - Trophy image model
- `OPENROUTER_MID_MODEL` - Mid-tier model for faster operations

## 7) AI Assistant Function

The `ai-assistant` function provides AI-powered features for the peek panel and chat:

**Modes:**
- `explain_theme` - AI explains theme rules and edge cases
- `validate_song` - Check if a specific song fits the theme (with daily limit)
- `generate_hint` - Creative hints for finding songs
- `chat_response` - Respond to @AI mentions in chat with context
- `get_settings` - Retrieve AI feature settings for a group

**Group Settings (stored in `group_settings` table):**
- `ai_assistant_enabled` - Master toggle for all AI features
- `ai_explain_enabled` - Toggle theme explainer
- `ai_validate_enabled` - Toggle song validation
- `ai_hint_enabled` - Toggle hint generator
- `ai_chat_enabled` - Toggle @AI chat mentions
- `ai_validate_daily_limit` - Daily limit for song validations (default: 5)

**Caching:**
- Theme explanations and hints are cached in `round_ai_cache` table
- Cached per round/group combination
- Song validations are not cached (personalized queries)

**Usage Tracking:**
- Song validation usage tracked in `user_ai_usage` table
- Enforces daily limits per user/group

## 8) OpenRouter X-Title Headers

All OpenRouter API calls include an `X-Title` header for app identification and usage tracking:

| Function | X-Title Value |
|----------|---------------|
| `openrouter-round-story` (story mode) | "TML - Round Story" |
| `openrouter-round-story` (theme mode) | "TML - Round Banner" |
| `openrouter-round-story` (trophy mode) | "TML - Trophy Image" |
| `openrouter-round-story` (awards mode) | "TML - Round Awards" |
| `openrouter-round-story` (season_awards) | "TML - Season Awards" |
| `openrouter-round-story` (season_narrative) | "TML - Season Story" |
| `openrouter-compare` | "TML - Song Compare" |
| `round-challenge` | "TML - Round Challenge" |
| `ai-assistant` (explain) | "TML - Explain Theme" |
| `ai-assistant` (validate) | "TML - Check Song" |
| `ai-assistant` (hint) | "TML - Get Hint" |
| `ai-assistant` (chat) | "TML - AI Chat" |

## 9) Confirm Function URLs
In Supabase → Edge Functions, copy the function URL. The client uses `supabase.functions.invoke()` so no additional config is required.

## 10) Create the Avatars Storage Bucket
In Supabase → Storage:
- Create a bucket named `avatars` (public bucket).
- Add a policy to allow authenticated users to upload.

Suggested policy (SQL editor):

```sql
create policy "Avatar uploads" on storage.objects
  for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);

create policy "Avatar reads" on storage.objects
  for select
  using (bucket_id = 'avatars');
```
