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
supabase functions deploy openrouter-compare
supabase functions deploy openrouter-round-story
supabase functions deploy round-challenge
supabase functions deploy ai-assistant
supabase functions deploy notify
```

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

## 7) Confirm Function URLs
In Supabase → Edge Functions, copy the function URL. The client uses `supabase.functions.invoke()` so no additional config is required.

## 8) Create the Avatars Storage Bucket
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
