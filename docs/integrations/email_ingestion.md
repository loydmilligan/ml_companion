# Music League Email Ingestion (Gmail -> n8n -> Supabase)

## Goal
Capture Music League notification emails and turn them into structured events in Supabase so the companion app can:
- Track round status changes automatically.
- Record user activity (submitted/voted/joined).
- Detect playlists and immediately ingest Spotify tracks.
- Reduce manual data entry while keeping manual fallback available.

## High-Level Flow
1. Gmail receives Music League emails.
2. n8n pulls the email payload (raw HTML + text + headers).
3. n8n parses the email into a normalized event payload.
4. n8n inserts the event directly into Supabase.

## Email Types and Actions

### 1) Round Starting
**Trigger:** Round opens for submissions.

**Typical Subject:**
- `{League Name} - Round Starting`

**HTML Body Signal:**
- `The <b>{Round Name}</b> round of the <b>{League Name}</b> league is open and ready for song submissions!`

**Extracted Fields:**
- `event_type = round_start`
- `league_name`
- `round_name`

**Action in App:**
- Update round state to “submissions open”.

### 2) Playlist Ready
**Trigger:** Submissions closed; playlist ready for listening/voting.

**Typical Subject:**
- `{League Name} - New Playlist`

**HTML Body Signal:**
- `The playlist for the <b>{Round Name}</b> round of the <b>{League Name}</b> league is ready for listening!`

**Extracted Fields:**
- `event_type = playlist_ready`
- `league_name`
- `round_name`
- `playlist_url` (Spotify)

**Action in App:**
- Update round state to “playlist ready / voting open”.
- Trigger Spotify playlist ingestion to pre-populate song list.

### 3) Votes Are In
**Trigger:** Voting is complete and results are available.

**Typical Subject:**
- `{League Name} - The Votes Are In`

**Text Body Signal:**
- `The votes are in for the round {Round Name}!`

**Extracted Fields:**
- `event_type = votes_in`
- `league_name`
- `round_name`

**Action in App:**
- Update round state to “voting closed / results ready”.
- Optional: attempt results import if a link is later extractable.

### 4) User Submitted
**Trigger:** A user submits a song.

**Typical Subject:**
- `{League Name} - User Submitted`

**Text Body Signal:**
- `User {Name} just submitted for the round {Round Name}!`

**Extracted Fields:**
- `event_type = user_submitted`
- `league_name`
- `round_name`
- `actor_name`

**Action in App:**
- Log activity in the timeline.
- Optional: mark user submission status.

### 5) User Voted
**Trigger:** A user casts votes.

**Typical Subject:**
- `{League Name} - User Voted`

**Text Body Signal:**
- `User {Name} just voted for the round {Round Name}!`

**Extracted Fields:**
- `event_type = user_voted`
- `league_name`
- `round_name`
- `actor_name`

**Action in App:**
- Log activity in the timeline.
- Optional: mark user vote status.

### 6) Someone Joined Your League
**Trigger:** New member joins league.

**Typical Subject:**
- `{League Name} - Someone Joined Your League`

**Text/HTML Signal:**
- `User {Name} just joined your league!`

**Extracted Fields:**
- `event_type = user_joined`
- `league_name`
- `actor_name`

**Action in App:**
- Log activity in the timeline.
- Optional: auto-add member to group roster.

## Parsing Strategy
We use the raw email payload from n8n. It provides:
- `headers.subject` (short, reliable signal for league name and event type)
- `text` (clean for submitted/voted/votes-in messages)
- `html` (required for round start and playlist ready; includes round name and playlist links)

### Key Parsing Notes
- **Round start:** Only reliably present in HTML.
- **Playlist ready:** Round name and Spotify link only in HTML.
- **Submitted / voted / votes in:** Cleanly parsed from `text`.
- **League name:** Parsed from `headers.subject` by splitting on " - " and removing "Subject: ".

### Example Normalized Payload
```json
{
  "event_type": "playlist_ready",
  "league_name": "Fam Jam II: The Gloves Are Off",
  "round_name": "Broken Hearts Club Playlist",
  "actor_name": null,
  "playlist_url": "https://open.spotify.com/playlist/707JoMEVFI2GK0Oi2a8HX4",
  "id": "19b6f275ed2c4c6f",
  "threadId": "19b6f275ed2c4c6f",
  "from": "notifications@musicleague.com",
  "to": "mattmariani@gmail.com",
  "text": "A new playlist has been created!"
}
```

## Supabase Ingestion Plan

### 1) Create a Table
Create a table to store normalized events. Suggested table name: `ml_email_events`.

Suggested columns:
- `id` (text, primary key) - Gmail message id.
- `thread_id` (text)
- `event_type` (text)
- `league_name` (text)
- `round_name` (text, nullable)
- `actor_name` (text, nullable)
- `playlist_url` (text, nullable)
- `from_email` (text)
- `to_email` (text)
- `raw_text` (text, nullable)
- `received_at` (timestamptz, nullable)
- `created_at` (timestamptz, default now())

### 2) Insert via n8n Supabase Node
Use the Supabase node instead of a file pipeline. This removes the stringify/append step.

Mapping example:
- `id` -> `$json.id`
- `thread_id` -> `$json.threadId`
- `event_type` -> `$json.event_type`
- `league_name` -> `$json.league_name`
- `round_name` -> `$json.round_name`
- `actor_name` -> `$json.actor_name`
- `playlist_url` -> `$json.playlist_url`
- `from_email` -> `$json.from`
- `to_email` -> `$json.to`
- `raw_text` -> `$json.text`
- `received_at` -> `$json.date` (if present)

### 3) Deduplication
Use `id` as the primary key. If the insert fails due to conflict, skip or update.

## Next Steps
1. Add the `ml_email_events` table in Supabase.
2. Wire the n8n Supabase node to insert events directly.
3. Add a lightweight ingestion job in the app to:
   - Pull new events.
   - Update round status.
   - Trigger playlist ingestion when `playlist_ready` is received.
4. Add monitoring to verify event volume and mapping accuracy.

## Notes
- The parsing rules are deterministic and do not require LLMs.
- The Supabase node removes the need for NDJSON or file-based syncing.
- Manual imports remain as a fallback for incomplete or unexpected emails.
