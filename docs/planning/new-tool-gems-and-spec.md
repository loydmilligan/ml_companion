# New Tool: Gems & Specification

> Extracted from TML codebase analysis + brainstorming session
> Created: 2026-03-22

---

## Part 1: Why TML's Submitter Guess Worked

### The Insight

The Submitter Guess minigame succeeded not because of clever game mechanics, but because it **surfaced relationship data that sparked conversation**.

When voting patterns were exposed ("who gave most votes to whom"), people immediately started creating narratives:
- "Matt and Mara are voting for each other again!"
- "Ron only likes classic rock!"
- "Nobody ever chooses Greg's songs!"

This is **conversation fuel** - data that gives people something to joke about, call out, or gently roast each other over. Music League is always better when people are chatting and interacting, and anything that triggers that is a positive.

### Why the Other Minigames Failed

| Game | What It Did | Why It Failed |
|------|-------------|---------------|
| Theme Matching | Match songs to Season 1 themes | Solitary puzzle, no social output |
| Timeline Game | Sort songs by release year | Fun mechanic, but nothing to talk about after |
| Submitter Guess | Guess who submitted each song | Revealed patterns about relationships |

The first two were **isolated experiences**. The third created **shared stories**.

### The Real Product

TML was built as a "companion chat app" but what actually resonated was:

> **A stats + games overlay that creates conversation fuel**

People don't need another place to chat. They want:
1. A **game** that adds stakes during voting
2. **Insights** into group dynamics and voting patterns
3. Something to **talk about** in their existing chat

---

## Part 2: Problems with TML

### Fragmentation
- Conversations spread across 3-4 places (Music League chat, TML chat, family group chat)
- TML competed for attention instead of feeding existing conversations

### Login Fatigue
- Music League login
- TML login
- Music service login (Spotify/Apple)
- Chat app login
- = Up to 4 accounts for one activity

### Complexity Sprawl
- 15 edge functions
- 33 database tables
- 10+ AI feature types
- Multiple notification channels
- Two admin panel versions

---

## Part 3: The New Model

### Core Philosophy

**Don't build an app. Create artifacts that live where conversations already happen.**

Instead of asking people to visit a new place, deliver:
- **Links** with embedded context (forms, polls)
- **Images** that spark discussion (infographics, stats)

### No Auth

Links contain embedded "auth" - no login required. If you have the link, you can participate.

### Meet People Where They Are

Bot posts to the existing group chat (Google Chat initially, GroupMe later). Content lives in the conversation, not in a separate app.

---

## Part 4: User Flow

### Voting Phase Starts

```
Music League email → n8n catches it
        ↓
Edge function updates Supabase
        ↓
Bot posts link to GChat
        ↓
Family member taps link
        ↓
2-3 swipeable questions:
  "Who submitted this song?" [photo cards]
        ↓
Submit answers
        ↓
Instant reward:
  "Your family has submitted 47 songs from the 80s.
   You've submitted zero. Ron has submitted 31."
        ↓
Done. Back to group chat. (30-60 seconds total)
```

### Round Reveals

```
Music League email → n8n catches it
        ↓
Edge function processes results
        ↓
Generates themed infographic (1-3 images)
        ↓
Bot posts images to GChat
        ↓
Family reacts, replies, discusses
```

---

## Part 5: Architecture

```
┌─────────────────────────────────────────────────────┐
│  ADMIN PANEL (simplified web UI)                    │
│  • Import voting/submission data                    │
│  • Manage users/competitors                         │
│  • Theme library (pre-built + AI-suggested)         │
│  • Queue: approve/assign themes per round           │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  SUPABASE (reused from TML, trimmed)                │
│  Tables:                                            │
│  • users, rounds, submissions, votes (from TML)     │
│  • themes, guesses, generated_content (new)         │
│  Edge Functions:                                    │
│  • process-email-events (reuse)                     │
│  • form-handler (new)                               │
│  • infographic-generator (new)                      │
│  • gchat-bot (new)                                  │
└─────────────────────────────────────────────────────┘
                         │
           ┌─────────────┴─────────────┐
           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────────┐
│  GCHAT BOT          │     │  FORM PAGE (no auth)    │
│  • Receives triggers│     │  • Magic link w/ context│
│  • Posts links      │     │  • 2-3 swipe questions  │
│  • Posts images     │     │  • Instant fun fact     │
└─────────────────────┘     └─────────────────────────┘
```

### What We Keep from TML

| Component | Keep | Notes |
|-----------|------|-------|
| Supabase project | Yes | Database, edge functions, storage |
| n8n email ingestion | Yes | Already detects round events |
| Core tables (users, rounds, votes, submissions) | Yes | Data model works |
| Auth system | No | Replace with magic links |
| Chat system | No | Use existing group chat |
| Complex minigames | No | Just the guessing game, simplified |
| AI narrative generation | Minimal | Just for theme suggestions + fun facts |
| Notification matrix | No | Bot posts to chat |
| Frontend app | Mostly no | Just admin panel + form page |

---

## Part 6: V0.1 Scope

**Timeline**: 1-2 weeks

### Deliverable 1: Guessing Link (Priority)

When voting starts, bot posts a link. Tapping it shows:
- 2-3 songs to guess submitters for (not your own songs)
- Swipeable cards with competitor photos/names
- On submit: instant fun fact from historical data

**Tech:**
- Simple web page (no auth, context in URL)
- Supabase edge function to record guesses
- Supabase edge function to generate fun fact

### Deliverable 2: Reveal Infographic

When round reveals, bot posts 1-3 images:
- Themed stats recap (e.g., "Guilty Pleasures", "Genre Therapy")
- Uses guess results + voting patterns
- Hybrid: template structure + AI flavor text

**Tech:**
- Image generation (canvas-based or AI-generated)
- Theme assigned via admin panel
- Bot posts to GChat

### Deliverable 3: Admin Panel (Minimal)

- Import round data (existing pattern)
- View/manage theme library
- Assign theme to upcoming round
- View guess completion rates

---

## Part 7: Success Metrics

### What "Working" Looks Like

Primary signals (observable in chat):
- Reactions/likes on bot's posts
- Replies to bot's posts
- Reposts of infographics

Secondary signals:
- Discussion sparked by the output
- People mentioning stats/patterns from the infographic

### Built-in Measurement

Track and adjust:
- Link open rate
- Question completion rate (1/3, 2/3, 3/3)
- Drop-off points

Iterate:
- If completion low → reduce questions
- If completion high → try adding more
- Find the sweet spot

---

## Part 8: Gems from TML (Technical Patterns)

### 8.1 Submitter Guess Schema

```sql
CREATE TABLE submitter_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  guesser_id UUID, -- Can be NULL for magic link users
  guesser_token TEXT, -- Magic link identifier
  guessed_competitor_id UUID REFERENCES season_competitors(id),
  is_correct BOOLEAN, -- NULL until revealed
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (round_id, submission_id, guesser_token)
);
```

**Key change from TML**: `guesser_token` instead of requiring auth. The magic link contains a unique token per user.

### 8.2 Auto-Evaluation Trigger

```sql
CREATE OR REPLACE FUNCTION evaluate_guesses_on_reveal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'revealed' AND OLD.status != 'revealed' THEN
    UPDATE submitter_guesses sg
    SET is_correct = (
      sg.guessed_competitor_id = (
        SELECT sc.id
        FROM submissions s
        JOIN season_competitors sc ON (
          sc.group_id = target_group_id
          AND (
            (s.submitter_id IS NOT NULL AND sc.profile_id = s.submitter_id)
            OR LOWER(sc.name) = LOWER(s.submitter_name)
          )
        )
        WHERE s.id = sg.submission_id
        LIMIT 1
      )
    )
    WHERE sg.round_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 8.3 Voting Analytics Queries

**Who votes for their own songs most:**
```sql
SELECT p.display_name, SUM(v.points) as self_points
FROM votes v
JOIN submissions s ON v.submission_id = s.id
JOIN profiles p ON v.voter_id = p.id
WHERE v.voter_id = s.submitter_id
GROUP BY p.id ORDER BY self_points DESC;
```

**Taste affinity (who votes for whom):**
```sql
SELECT
  voter.display_name as voter,
  submitter.display_name as submitter,
  SUM(v.points) as total_points
FROM votes v
JOIN submissions s ON v.submission_id = s.id
JOIN profiles voter ON v.voter_id = voter.id
JOIN profiles submitter ON s.submitter_id = submitter.id
WHERE v.voter_id != s.submitter_id
GROUP BY voter.id, submitter.id
ORDER BY voter, total_points DESC;
```

### 8.4 Playlist Creation (song.link)

```typescript
// No auth required - public API
async function getMultiPlatformLinks(spotifyUrl: string) {
  const response = await fetch(
    `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(spotifyUrl)}`
  );
  const data = await response.json();
  return {
    universal: data.pageUrl,
    spotify: data.linksByPlatform.spotify?.url,
    appleMusic: data.linksByPlatform.appleMusic?.url,
    youtube: data.linksByPlatform.youtube?.url,
  };
}
```

### 8.5 n8n Email Ingestion (Reuse)

Already working in TML:
- Polls Gmail for Music League emails
- Detects: round_start, playlist_ready, votes_in, user_submitted, user_voted
- Triggers edge function to process events

Just wire up the bot trigger to the existing event flow.

---

## Part 9: Theme Library (Starter Ideas)

| Theme | Angle | Data Used |
|-------|-------|-----------|
| Guilty Pleasures | Songs that got votes despite "uncool" genre | Genre vs. votes |
| Genre Therapy | The genre your family secretly loves/hates | Genre frequency |
| The Usual Suspects | Predictable picks vs. surprises | Historical patterns |
| Self-Love Index | Who votes for their own songs | Self-vote data |
| Taste Twins | Who votes similarly to whom | Vote correlation |
| Dark Horse | Low-expected songs that crushed it | Prediction vs. result |
| Decade Wars | 80s vs 90s vs 2000s vs today | Release year data |
| The Streak | Who's on a winning/losing streak | Recent round history |

---

## Part 10: Open Questions

1. **Magic link format**: How to embed user identity in URL without making it guessable?
   - Option: UUID token per user per round
   - Option: Signed JWT in URL

2. **GChat bot setup**: Need to research Google Chat bot API
   - Webhook-based?
   - OAuth required?
   - Rate limits?

3. **Image generation**: Template-based vs AI-generated?
   - Start with templates (faster, more control)
   - Add AI flavor text later

4. **Historical data migration**: 2 years of data to clean and import
   - Already in Supabase? Or in CSVs?
   - Need to verify schema compatibility

---

## Part 11: Next Steps

1. **Create new repo** (or branch) for simplified tool
2. **Set up GChat bot** - research API, create test bot
3. **Build form page** - simple, swipeable, no auth
4. **Wire up n8n** - trigger bot on round events
5. **Build infographic generator** - start with one template
6. **Test with family** - one round, measure engagement
7. **Iterate** - adjust question count, theme, format based on feedback

---

## Appendix: Files to Reference from TML

### Database Patterns
- `supabase/migrations/20260115_add_guess_aggregates_function.sql` - SECURITY DEFINER pattern
- `supabase/migrations/20260116_add_guess_accuracy_view.sql` - Materialized view
- `supabase/migrations/20260116_add_recalculate_guess_correctness.sql` - Bulk recalculation

### Edge Functions
- `supabase/functions/process-email-events/` - n8n integration (reuse)
- `supabase/functions/song-links/` - Multi-platform links (reuse)
- `supabase/functions/ai-assistant/` - Fun fact generation (adapt)

### Frontend Patterns
- `web/src/components/pinned-peek/useSubmitterGuess.ts` - Guess logic (adapt)
- `web/src/components/games-sidebar/GuessSongCard.tsx` - Swipe UI patterns (adapt)

### Data Import
- `web/src/pages/admin/SeasonImport.tsx` - CSV import pattern (reuse)
