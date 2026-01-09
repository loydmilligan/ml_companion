# n8n Email Ingestion Workflow

**Version**: 0.2.0 | **Last Updated**: January 2025

This document describes the n8n workflow that automatically ingests Music League notification emails and converts them into activity tracking records.

## Overview

Music League sends email notifications for various events:
- Round starting
- Playlist ready (submission phase complete)
- Votes are in (results revealed)
- User submitted a song
- User voted

The n8n workflow polls Gmail for these emails, parses them, and inserts records into the Supabase `ml_email_events` table. A Supabase edge function then processes these events into user activity records.

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           n8n Workflow                               │
│                                                                      │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐ │
│  │ Gmail Trigger│────▶│ Switch Node  │────▶│ Field Extraction     │ │
│  │ (1 min poll) │     │ (by subject) │     │ (league, round, etc.)│ │
│  └──────────────┘     └──────────────┘     └───────────┬──────────┘ │
│                                                        │            │
│                                                        ▼            │
│                                            ┌──────────────────────┐ │
│                                            │   Supabase Insert    │ │
│                                            │   (ml_email_events)  │ │
│                                            └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Supabase Edge Function                            │
│                    (process-email-events)                            │
│                                                                      │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐ │
│  │ Read events  │────▶│ Match actors │────▶│ Create activity      │ │
│  │              │     │ to profiles  │     │ records              │ │
│  └──────────────┘     └──────────────┘     └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Gmail Trigger Configuration

**Node Type**: Gmail Trigger

**Settings**:
| Setting | Value |
|---------|-------|
| Poll Times | Every minute |
| Simple | false |
| Filter | `from:notifications@musicleague.com` |
| Label | INBOX (or specific label) |

**Output Fields**:
- `id` - Gmail message ID
- `subject` - Email subject line
- `snippet` - Email preview text
- `payload.body.data` - Base64 encoded email body

## Switch Node (Event Type Detection)

The switch node routes emails based on subject line patterns:

| Condition | Event Type | Example Subject |
|-----------|------------|-----------------|
| Contains "Round Starting" | `round_start` | "Round Starting in Family League" |
| Contains "New Playlist" | `playlist_ready` | "New Playlist Ready to Listen" |
| Contains "Votes Are In" | `votes_in` | "Votes Are In for Round 5" |
| Contains "submitted" | `user_submitted` | "John submitted their song" |
| Contains "voted" | `user_voted` | "John voted in Round 5" |

## Field Extraction

Each branch extracts relevant fields using JavaScript expressions:

### Round Start Event
```javascript
{
  event_type: "round_start",
  league_name: extractLeagueName(subject),
  round_name: extractRoundName(body),
  email_date: date,
  raw_subject: subject,
  raw_body: body
}
```

### Playlist Ready Event
```javascript
{
  event_type: "playlist_ready",
  league_name: extractLeagueName(subject),
  round_name: extractRoundName(body),
  playlist_url: extractPlaylistUrl(body),
  email_date: date,
  raw_subject: subject
}
```

### Votes In Event
```javascript
{
  event_type: "votes_in",
  league_name: extractLeagueName(subject),
  round_name: extractRoundName(body),
  email_date: date,
  raw_subject: subject
}
```

### User Submitted Event
```javascript
{
  event_type: "user_submitted",
  league_name: extractLeagueName(subject),
  round_name: extractRoundName(body),
  actor_name: extractActorName(subject),  // "John submitted..."
  email_date: date,
  raw_subject: subject
}
```

### User Voted Event
```javascript
{
  event_type: "user_voted",
  league_name: extractLeagueName(subject),
  round_name: extractRoundName(body),
  actor_name: extractActorName(subject),  // "John voted..."
  email_date: date,
  raw_subject: subject
}
```

## Supabase Insert

**Node Type**: Supabase

**Operation**: Insert

**Table**: `ml_email_events`

**Fields Mapped**:
| Database Column | Source |
|-----------------|--------|
| `event_type` | Extracted event type |
| `league_name` | Extracted league name |
| `round_name` | Extracted round name |
| `actor_name` | Extracted actor name (for user events) |
| `playlist_url` | Extracted URL (for playlist ready) |
| `email_date` | Email timestamp |
| `raw_subject` | Original subject line |
| `raw_body` | Original body (for debugging) |
| `gmail_id` | Gmail message ID (for deduplication) |
| `processed` | `false` (set to true after processing) |

## Database Schema

### ml_email_events Table

```sql
CREATE TABLE ml_email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  league_name TEXT,
  round_name TEXT,
  actor_name TEXT,
  playlist_url TEXT,
  email_date TIMESTAMPTZ,
  raw_subject TEXT,
  raw_body TEXT,
  gmail_id TEXT UNIQUE,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ml_email_events_processed ON ml_email_events(processed);
CREATE INDEX idx_ml_email_events_event_type ON ml_email_events(event_type);
```

### round_user_activity Table

```sql
CREATE TABLE round_user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id),
  actor_name TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'submitted' or 'voted'
  profile_id UUID REFERENCES profiles(id),
  event_id TEXT, -- Reference to ml_email_events.id or 'manual'
  action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(round_id, actor_name, activity_type)
);

CREATE INDEX idx_round_user_activity_round ON round_user_activity(round_id);
```

## Edge Function Processing

The `process-email-events` edge function:

1. **Fetches unprocessed events**:
   ```sql
   SELECT * FROM ml_email_events WHERE processed = false ORDER BY email_date
   ```

2. **Matches actor names to profiles**:
   - Looks up `season_competitors` by name
   - Links to `profile_id` if competitor is linked to a user

3. **Creates activity records**:
   - For `user_submitted`: Creates `round_user_activity` with `activity_type = 'submitted'`
   - For `user_voted`: Creates `round_user_activity` with `activity_type = 'voted'`

4. **Marks events as processed**:
   ```sql
   UPDATE ml_email_events SET processed = true, processed_at = now() WHERE id = ?
   ```

## Setup Instructions

### 1. Configure Gmail OAuth

In n8n:
1. Go to Credentials → Create New → Gmail OAuth2
2. Follow Google OAuth setup
3. Grant access to read emails

### 2. Import the Workflow

1. Export the workflow from `n8n/music league emails.json`
2. In n8n: Workflows → Import from File
3. Configure the Gmail credential

### 3. Configure Supabase Connection

1. Create Supabase credential in n8n
2. Use service role key (not anon key) for inserts

### 4. Activate the Workflow

1. Test with a sample email first
2. Enable the workflow
3. Monitor executions for errors

### 5. Deploy Edge Function

```bash
supabase functions deploy process-email-events --no-verify-jwt
```

## Monitoring

### Check Workflow Executions
In n8n: Executions tab shows all runs with success/failure status.

### Check Email Events
```sql
SELECT event_type, league_name, actor_name, processed, created_at
FROM ml_email_events
ORDER BY created_at DESC
LIMIT 20;
```

### Check Activity Records
```sql
SELECT r.theme, a.actor_name, a.activity_type, a.action_at
FROM round_user_activity a
JOIN rounds r ON a.round_id = r.id
ORDER BY a.created_at DESC
LIMIT 20;
```

## Troubleshooting

### Emails not being detected

- Verify Gmail filter matches Music League emails
- Check Gmail label configuration
- Review n8n execution logs

### Duplicate events

- The `gmail_id` UNIQUE constraint prevents duplicates
- If duplicates appear, check the extraction logic

### Actor names not matching

- Names must match `season_competitors.name` exactly
- Check case sensitivity
- Admin can manually link via Activity Tracker in Admin page

### Events not processing

- Check edge function logs: `supabase functions logs process-email-events`
- Verify round matching logic (league_name + round_name)
- Check for RLS policy issues

---

## Related Documentation

- [Edge Functions Reference](../setup/edge_functions.md)
- [Integrations Overview](overview.md)
- [Admin Settings Guide](../admin/admin_settings.md)
