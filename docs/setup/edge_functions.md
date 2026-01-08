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
| `openrouter-round-story` | Round narratives, theme banners, awards, trophies, season narratives, current season stories |
| `round-challenge` | Bonus game - guess which Season 1 theme songs belonged to |
| `ai-assistant` | Theme explanations, song validation, creative hints |
| `notify` | Legacy notifications via ntfy and email |
| `send-push-notification` | FCM v1 API push notifications |
| `process-email-events` | Email event processing and activity tracking |
| `song-links` | Convert Spotify URIs to multi-platform links via song.link API |
| `send-invite-email` | Send email invitations to join groups |
| `ingest-spotify-playlist` | Import tracks from Spotify playlists into a round |
| `youtube-playlist` | Create YouTube playlists from round submissions |

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
supabase functions deploy ai-assistant openrouter-round-story openrouter-compare round-challenge notify send-push-notification process-email-events song-links send-invite-email ingest-spotify-playlist youtube-playlist --no-verify-jwt

# Or deploy individually
supabase functions deploy openrouter-compare --no-verify-jwt
supabase functions deploy openrouter-round-story --no-verify-jwt
supabase functions deploy round-challenge --no-verify-jwt
supabase functions deploy ai-assistant --no-verify-jwt
supabase functions deploy notify --no-verify-jwt
supabase functions deploy send-push-notification --no-verify-jwt
supabase functions deploy process-email-events --no-verify-jwt
supabase functions deploy song-links --no-verify-jwt
supabase functions deploy send-invite-email --no-verify-jwt
supabase functions deploy ingest-spotify-playlist --no-verify-jwt
supabase functions deploy youtube-playlist --no-verify-jwt
```

**Note:** All functions implement JWT authentication internally. The `--no-verify-jwt` flag is used because Supabase's default verification is bypassed in favor of custom auth handling.

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
- `story` (default) - Generate round narrative and winners image prompt
- `theme` - Generate theme banner image
- `trophy` - Generate award trophy image
- `awards` - Select round awards from catalog
- `season_awards` - Select season finale awards
- `season_narrative` - Generate season recap narrative for completed seasons
- `current_season_story` - Generate ongoing season narrative with upcoming round preview
- `preseason_special` - Generate pre-season special content before voting begins
- `winners_image` - Generate winners illustration only (separate from story to avoid timeout)

**Mode Details:**

### `current_season_story`
Generates a 3-section card for in-progress seasons:
1. **Season Storylines** - Current standings, hot streaks, momentum
2. **Up Next** - Preview upcoming theme, song suggestions, strategy based on standings
3. **Guessing Game** - Minigame results from last revealed round

Input body:
```json
{
  "mode": "current_season_story",
  "league_name": "Revenge of the Hip Jammers",
  "season_number": 2,
  "season_data": { "rounds_completed": 1, "leaderboard": [...] },
  "upcoming_round": { "theme": "Easy as 1, 2, 3", "round_number": 2, ... },
  "latest_revealed_round": { "theme": "Primetime", "round_number": 1 },
  "minigame_summary": { "topGuessers": [...] }
}
```

### `preseason_special`
Generates a comprehensive pre-vote analysis with 7 sections:
1. Season Opening Monologue
2. The Submission Board
3. Artist & Taste Tells
4. Theme Fit Analysis
5. Submission Timing & Comment Energy
6. Pre-Vote Predictions
7. Soft Power Rankings

### `winners_image`
Generates winners illustration separately to avoid timeouts when generating both text and image:
```json
{
  "mode": "winners_image",
  "winners": [{ "place": 1, "name": "...", "song": "...", "artist": "...", "traits": "..." }],
  "round": { "title": "Theme Name" }
}
```

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

## 10) Send Push Notification Function

The `send-push-notification` function handles Firebase Cloud Messaging (FCM) v1 API push notifications.

**Features:**
- FCM v1 API with service account authentication
- Notification type filtering (new_round, results_revealed, new_chat, deadline_reminder)
- User preference checking before sending
- Group-based notification targeting

**Required Secrets:**
```bash
supabase secrets set FCM_PROJECT_ID=...
supabase secrets set FCM_SERVICE_ACCOUNT_EMAIL=...
supabase secrets set FCM_PRIVATE_KEY=...
```

**Database Requirements:**
- `profiles.push_token` - Stores user's FCM token
- `profiles.push_enabled` - Master push toggle
- `profiles.push_new_round` - Notify on new rounds
- `profiles.push_results_revealed` - Notify on results
- `profiles.push_new_chat` - Notify on chat messages
- `profiles.push_deadline_reminder` - Notify on deadlines

## 11) Process Email Events Function

The `process-email-events` function handles Music League email ingestion and activity tracking.

**Features:**
- Processes events from `ml_email_events` table
- Matches actor names to season competitors
- Creates activity records in `round_user_activity` table
- Supports: round_start, playlist_ready, votes_in, user_submitted, user_voted

**Database Requirements:**
- `ml_email_events` - Stores parsed email events from n8n
- `round_user_activity` - Tracks user submission/voting activity
- `season_competitors` - Maps actor names to profiles

## 12) Song Links Function

The `song-links` function converts Spotify URIs to multi-platform links using the song.link API.

**Modes:**
- `convert` - Convert a single Spotify URI to platform links
- `convert_batch` - Convert multiple URIs (max 10 per request)
- `backfill_round` - Fetch links for all submissions in a round and update DB
- `backfill_all` - Fetch links for all submissions missing links (max 100 per request)

**Returns:**
- Spotify URL
- Apple Music URL
- YouTube URL
- YouTube Music URL
- Universal song.link page URL

**Database Updates:**
- `submissions.spotify_url` - Direct Spotify track URL
- `submissions.apple_music_url` - Direct Apple Music track URL
- `submissions.youtube_url` - Direct YouTube video URL
- `submissions.youtube_music_url` - Direct YouTube Music track URL
- `submissions.song_link_url` - Universal song.link page

**User Preferences (profiles table):**
- `preferred_music_provider` - User's preferred service: spotify, apple_music, or youtube_music
- `show_youtube_video` - Whether to show YouTube video button alongside music provider

## 13) Send Invite Email Function

The `send-invite-email` function sends email invitations to join groups.

**Features:**
- Sends styled HTML email invitations via SMTP (Gmail)
- Falls back gracefully if SMTP not configured
- Records invite email and sent timestamp

**Input:**
```json
{
  "invite_id": "uuid",
  "email": "recipient@example.com",
  "group_name": "Family League",
  "inviter_name": "John" // optional
}
```

**Required Secrets:**
```bash
supabase secrets set SMTP_USERNAME=... SMTP_PASSWORD=... SMTP_FROM_EMAIL=...
supabase secrets set SMTP_HOST=smtp.gmail.com SMTP_PORT=587
```

**Database Updates:**
- `invites.invite_email` - Stores recipient email
- `invites.email_sent_at` - Timestamp when email was sent

## 14) Ingest Spotify Playlist Function

The `ingest-spotify-playlist` function imports tracks from Spotify playlists into a round.

**Features:**
- Uses Spotify Client Credentials flow (no user auth required)
- Extracts track metadata: title, artist, album, artwork, release year
- Skips duplicate tracks already in the round
- Handles pagination for large playlists

**Input:**
```json
{
  "playlist_url": "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
  "round_id": "uuid"
}
```

**Returns:**
```json
{
  "status": "ok",
  "playlist_id": "37i9dQZF1DXcBWIGoYBM5M",
  "total_tracks": 50,
  "inserted": 48,
  "skipped": 2
}
```

**Required Secrets:**
```bash
supabase secrets set SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=...
```

**Database Updates:**
- Creates new rows in `submissions` table with Spotify metadata

## 15) YouTube Playlist Function

The `youtube-playlist` function creates YouTube playlists from round submissions.

**Modes:**
- `preview` - Returns list of videos without creating playlist
- `create` - Creates actual YouTube playlist and adds videos

**Input:**
```json
{
  "mode": "create",
  "round_id": "uuid"
}
```

**Returns (create mode):**
```json
{
  "success": true,
  "playlistId": "PLxxx...",
  "playlistUrl": "https://www.youtube.com/playlist?list=PLxxx...",
  "videosAdded": 10,
  "totalVideos": 12
}
```

**Required Secrets:**
```bash
supabase secrets set YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... YOUTUBE_REFRESH_TOKEN=...
```

**Database Updates:**
- `rounds.youtube_playlist_url` - Stores created playlist URL

**Note:** Requires OAuth2 refresh token from a YouTube account. Videos are extracted from `submissions.youtube_url` field.

## 16) Create the Avatars Storage Bucket
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
