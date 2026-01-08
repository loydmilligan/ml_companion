# Round Lifecycle Flow

This document details all automated processes and integrations that keep the Talking Music League app in sync with Music League during a round's lifecycle.

---

## Flow Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ROUND LIFECYCLE                                    │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 1: OPEN (Submissions)
┌─────────────────────────────────────────────────────────────────────────────┐
│  Music League Email: "Round Starting"                                        │
│  └─> n8n parses → ml_email_events table (event_type: "round_start")         │
│      └─> process-email-events: processRoundStart()                          │
│          ├─> Creates round in DB (status: "open")                           │
│          └─> Sends push notification: "New Round: {theme}"                  │
│                                                                              │
│  During Submissions:                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Music League Email: "User Submitted"                                   ││
│  │  └─> n8n parses → ml_email_events (event_type: "user_submitted")        ││
│  │      └─> process-email-events: processUserSubmitted()                   ││
│  │          └─> Creates record in round_user_activity table                ││
│  │              (actor_name, activity_type: "submitted", action_at)        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
PHASE 2: VOTING (Playlist Ready)
┌─────────────────────────────────────────────────────────────────────────────┐
│  Music League Email: "New Playlist"                                          │
│  └─> n8n parses → ml_email_events (event_type: "playlist_ready")            │
│      └─> process-email-events: processPlaylistReady()                       │
│          ├─> Updates round status: "voting"                                 │
│          ├─> Stores playlist_url in round                                   │
│          ├─> Triggers: ingest-spotify-playlist                              │
│          │   └─> Fetches all tracks from Spotify API                        │
│          │   └─> Creates submissions in DB (title, artist, album,           │
│          │       artwork_url, release_year, spotify_url)                    │
│          │   └─> submitter_name left NULL (populated by vote import)        │
│          └─> Sends push notification: "Playlist Ready!"                     │
│                                                                              │
│  During Voting:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Music League Email: "User Voted"                                       ││
│  │  └─> n8n parses → ml_email_events (event_type: "user_voted")            ││
│  │      └─> process-email-events: processUserVoted()                       ││
│  │          └─> Creates record in round_user_activity table                ││
│  │              (actor_name, activity_type: "voted", action_at)            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
PHASE 3: REVEALED (Votes Are In)
┌─────────────────────────────────────────────────────────────────────────────┐
│  Music League Email: "The Votes Are In"                                      │
│  └─> n8n parses → ml_email_events (event_type: "votes_in")                  │
│      └─> process-email-events: processVotesIn()                             │
│          ├─> Updates round status: "revealed"                               │
│          ├─> Sets reveal_until: NOW() + 2 hours                             │
│          ├─> Sends push notification: "Results Are In!"                     │
│          └─> Triggers: updateCurrentSeasonStory()                           │
│              └─> Calls openrouter-round-story (mode: "current_season_story")│
│                  └─> AI generates 3 sections:                               │
│                      - Season So Far / Midseason Report                     │
│                      - Round Riff (recap of this round)                     │
│                      - Guessing Game (minigame summary)                     │
│              └─> Stores in leagues table:                                   │
│                  - current_story_intro                                      │
│                  - current_round_riff                                       │
│                  - current_minigame_summary                                 │
│                  - current_story_round_id                                   │
│                                                                              │
│  *** MANUAL STEP REQUIRED ***                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Admin must download CSV exports from Music League website:             ││
│  │  - votes.csv                                                            ││
│  │  - submissions.csv (for submitter_name mapping)                         ││
│  │  - competitors.csv                                                      ││
│  │                                                                         ││
│  │  Admin uploads via: Settings > Season Import                            ││
│  │  └─> SeasonImport.tsx processes CSVs:                                   ││
│  │      ├─> Upserts season_competitors (name <-> external_id mapping)      ││
│  │      ├─> Updates submissions with submitter_name                        ││
│  │      └─> Inserts votes (submission_id, voter_name, points, comment)     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  UI: Countdown timer shows time until peek panel switches (reveal_until)    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (after reveal_until expires)
PHASE 4: TRANSITION TO NEXT ROUND
┌─────────────────────────────────────────────────────────────────────────────┐
│  When reveal_until expires:                                                  │
│  └─> Frontend detects new "open" or "voting" round becomes active           │
│      (RoundContext queries for rounds with status IN ("open","voting",      │
│       "revealed") and picks the first one by round_number)                  │
│                                                                              │
│  The revealed round remains accessible in History tab                        │
│  └─> Round status can be manually changed to "archived" later               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Function Reference

### 1. Email Ingestion (n8n → Supabase)

**File:** `supabase/functions/process-email-events/index.ts`

| Email Type | Event Type | Function | Actions |
|------------|-----------|----------|---------|
| Round Starting | `round_start` | `processRoundStart()` | Create/update round, send push |
| New Playlist | `playlist_ready` | `processPlaylistReady()` | Update to voting, ingest Spotify, send push |
| User Submitted | `user_submitted` | `processUserSubmitted()` | Log activity |
| User Voted | `user_voted` | `processUserVoted()` | Log activity |
| Votes Are In | `votes_in` | `processVotesIn()` | Update to revealed, set reveal_until, generate AI story, send push |

---

### 2. Spotify Playlist Ingestion

**File:** `supabase/functions/ingest-spotify-playlist/index.ts`

**Trigger:** Called by `processPlaylistReady()` when playlist_ready email is received

**Process:**
1. Extract playlist ID from Spotify URL
2. Authenticate with Spotify API (Client Credentials flow)
3. Fetch all tracks with pagination
4. For each track, create submission record:
   - `title` - track name
   - `artist` - comma-separated artist names
   - `album` - album name
   - `link` - Spotify track URL
   - `source_uri` - Spotify URI (for deduplication)
   - `artwork_url` - album cover image
   - `release_year` - extracted from release_date
   - `submitter_name` - **NULL** (populated later by vote import)

**Note:** Submitter names are NOT available from Spotify data. They must be imported from Music League CSV exports.

---

### 3. Push Notifications

**File:** `supabase/functions/send-push-notification/index.ts`

**Notification Types:**
| Type | Trigger | Title | Body |
|------|---------|-------|------|
| `new_round` | Round Starting email | "New Round: {theme}" | "Time to find your song!" |
| `new_round` | Playlist Ready email | "Playlist Ready!" | "Listen and vote for {theme}" |
| `results_revealed` | Votes Are In email | "Results Are In!" | "See who won {theme}" |

**Process:**
1. Get group members from `group_members` table
2. Check `notification_preferences` for each user
3. Get FCM tokens from `push_tokens` table
4. Send via Firebase Cloud Messaging v1 API
5. Remove invalid tokens automatically

---

### 4. AI Story Generation

**File:** `supabase/functions/openrouter-round-story/index.ts`

**Mode:** `current_season_story` (triggered by votes_in email)

**Input Data Built by `buildSeasonStoryPayload()`:**
- `seasonData`: rounds completed, standings, early/late submitters, round winner
- `latestRound`: theme, theme_author, round_number
- `minigameSummary`: top/bottom guessers, easiest/hardest submissions

**Output:**
```json
{
  "season_intro": "...",      // Season So Far / Midseason Report
  "round_two_riff": "...",    // Quippy take on the round
  "minigame_summary": "..."   // Guessing game results
}
```

**Stored in `leagues` table:**
- `current_story_intro`
- `current_round_riff`
- `current_minigame_summary`
- `current_story_updated_at`
- `current_story_round_id`

---

### 5. Manual Vote Import (Required)

**File:** `web/src/components/SeasonImport.tsx`

**Why Manual?** Music League does not expose vote data via API. Votes must be exported as CSV from the Music League website.

**Required CSV Files:**
1. `rounds.csv` - Round IDs and names
2. `submissions.csv` - Maps Spotify URI to submitter
3. `votes.csv` - Points assigned per submission
4. `competitors.csv` - Maps competitor ID to name

**Process:**
1. Parse all CSVs
2. Upsert `season_competitors` (builds name lookup)
3. Upsert `round_imports` (maps external IDs to internal)
4. Upsert `submissions` with `submitter_name`
5. Upsert `votes` with `voter_name`, `points`, `comment`

---

### 6. YouTube Playlist Generation (Manual Trigger)

**File:** `supabase/functions/youtube-playlist/index.ts`

**Trigger:** Manual via Admin UI (not automated)

**Process:**
1. Get submissions with `youtube_url` for round
2. Create YouTube playlist via YouTube Data API
3. Add videos to playlist
4. Store `youtube_playlist_url` in round

---

## Database Tables Involved

| Table | Purpose |
|-------|---------|
| `ml_email_events` | Raw email events from n8n |
| `rounds` | Round metadata (theme, status, deadlines, reveal_until) |
| `submissions` | Songs with metadata and submitter info |
| `votes` | Points assigned per submission |
| `round_user_activity` | Submission/voting timestamps |
| `season_competitors` | Name <-> external_id mapping |
| `leagues` | AI-generated current season story |
| `push_tokens` | FCM device tokens |
| `notification_preferences` | User notification settings |
| `group_members` | League membership |

---

## Round Status State Machine

```
round_start email       playlist_ready email      votes_in email
       │                        │                       │
       ▼                        ▼                       ▼
    ┌──────┐               ┌─────────┐            ┌──────────┐
    │ open │ ─────────────>│ voting  │ ──────────>│ revealed │
    └──────┘               └─────────┘            └──────────┘
                                                       │
                                              (manual or time-based)
                                                       ▼
                                                 ┌──────────┐
                                                 │ archived │
                                                 └──────────┘
```

---

## What's NOT Automated (Manual Steps)

1. **Vote Data Import** - Must download CSVs from Music League website and upload via Settings
2. **YouTube Playlist Creation** - Manual trigger in Admin
3. **Round Archival** - Manual status change
4. **Pre-season Special Generation** - Manual trigger
5. **Theme Image Generation** - Manual trigger

---

## Timing Summary

| Event | Timing |
|-------|--------|
| Round start → playlist ready | ~1 week (ML configured) |
| Playlist ready → votes in | ~1 week (ML configured) |
| Votes in → reveal_until | 2 hours (hardcoded) |
| reveal_until → next round | Immediate (UI switches) |
