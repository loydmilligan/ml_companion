# Admin Settings Guide

**Version**: 0.2.0 | **Last Updated**: January 2025

This guide covers all administrative settings and controls available to group leads in Talking Music League.

## Access Requirements

Only users with `role = 'lead'` in `group_members` can access the Admin page.

---

## Admin Page Tabs

The Admin page is organized into tabs:

| Tab | Purpose |
|-----|---------|
| **Users** | Member management, notification permissions |
| **Invites** | Invite code management, email invites |
| **Leagues** | League CRUD, season narratives |
| **Rounds** | Round CRUD, AI generation, content management |
| **Competitors** | Season roster management |
| **Imports** | Season data import from Music League |
| **AI Settings** | Feature toggles for AI and minigames |
| **Bonus** | Bonus points, activity tracking |

---

## Users Tab

### Member List

Displays all group members with:
- Display name and email
- Role (lead/member)
- Notification permission status

### Notification Permissions

Per-user toggles that admins can control:

| Permission | Column | Effect |
|------------|--------|--------|
| Email notifications | `can_toggle_email_notify` | User can toggle email notifications |
| Chat notifications | `can_toggle_chat_notify` | User can toggle chat notifications |
| Reaction notifications | `can_toggle_reaction_notify` | User can toggle reaction notifications |
| ntfy notifications | `can_toggle_ntfy_notify` | User sees ntfy option in settings |
| Push notifications | `can_toggle_push_notify` | User can enable push (beta) |

### Timeline Game Beta

- `timeline_game_tester` toggle per user
- Enables Timeline Game for testing users

### Player Connections

Define relationships between players for AI narratives:
- Select source player
- Select target player
- Choose relationship type (Partner, Sibling, Friend, etc.)

Stored in `player_connections` table, used by AI for personalized narratives.

---

## Invites Tab

### Create Invite

1. Click "Generate Invite Link"
2. Share the generated link
3. Link expires after use or set time

### Email Invite

1. Enter recipient email
2. Click "Send Invite Email"
3. Sends styled HTML email via SMTP

### Manage Invites

- View all active invites
- See usage status (used/unused)
- Delete expired or unwanted invites

---

## Leagues Tab

### Create League

Fields:
- **Name**: League display name
- **Season Number**: Integer season number

### Edit League

- Update name and season number
- View/edit season narrative

### Generate Season Content

Buttons with status indicators (green = exists, grey = not generated):

| Button | Generates |
|--------|-----------|
| **Season Narrative** | AI-written season recap story |
| **Season Awards** | Season finale awards selection |

### Delete League

Removes league and all associated rounds (with confirmation).

---

## Rounds Tab

### Create Round

Fields:
- **Theme**: Round theme/title
- **Description**: Theme explanation
- **Author**: Who suggested the theme
- **Season/Round Number**: Position in season
- **Playlist URL**: Spotify playlist link
- **Submission Deadline**: datetime
- **Voting Deadline**: datetime

### Edit Round

All creation fields plus:
- **Status**: open, voting, revealed, archived
- **YouTube Playlist URL**: For YouTube player
- **Comment Required**: Require comments on submissions

### AI Generation Buttons

Each button shows status (green = generated, grey = pending):

| Button | Generates | Stored In |
|--------|-----------|-----------|
| **Generate Banner** | Theme banner image | `rounds.theme_image_url` |
| **Generate Story** | Round narrative | `rounds.narrative` |
| **Generate Winners Image** | Winners illustration | `rounds.winners_image_url` |
| **Generate Awards** | Round awards selection | `round_awards` table |
| **Generate Challenge** | Round Challenge game | `round_challenge_v2` |

### Song Links Management

For each submission:
- Edit YouTube URL
- Edit Spotify URL
- Edit Apple Music URL
- Edit YouTube Music URL
- Edit submitter comment
- **Backfill Links**: Auto-fetch from song.link API

### YouTube Playlist Generator

- **Preview**: Show available videos
- **Create**: Generate YouTube playlist from submissions

### Release Years (Timeline Game)

Edit `release_year` for each submission for Timeline Game sorting.

---

## Competitors Tab

### Add Competitor

Enter name to add to season roster.

### Import from Music League

Paste competitor list from Music League to bulk import.

### Edit Competitor

- **Name**: Display name
- **AI Image Traits**: Description for AI image generation (e.g., "tall, glasses, curly hair")
- **Profile Link**: Connect to registered user profile

### Manage Roster

- View all competitors
- Delete competitors
- Link/unlink to user profiles

---

## Imports Tab

### Season Import

Bulk import round data from Music League:
1. Paste round data (theme, playlist URL, dates)
2. Review parsed data
3. Confirm import

### Round Import Status

Shows imported rounds with:
- External round ID
- Name/theme
- Playlist URL
- Linked status

---

## AI Settings Tab

### Group-Wide Toggles

| Setting | Column | Effect |
|---------|--------|--------|
| AI Assistant | `ai_assistant_enabled` | Master toggle for all AI features |
| Theme Explainer | `ai_explain_enabled` | AI theme explanations |
| Song Validator | `ai_validate_enabled` | AI song fit checking |
| Hint Generator | `ai_hint_enabled` | AI song finding hints |
| @AI Chat | `ai_chat_enabled` | @AI mentions in chat |

### AI Usage Limits

| Setting | Column | Default |
|---------|--------|---------|
| Daily validation limit | `ai_validate_daily_limit` | 5 |

### Minigame Toggles

| Setting | Column | Effect |
|---------|--------|--------|
| Submitter Guess | `submitter_guess_enabled` | Enable guess-the-submitter game |
| Round Challenge | `round_challenge_enabled` | Enable theme matching game |
| Timeline Game | `timeline_game_enabled` | Enable release year sorting (beta) |

---

## Bonus Tab

### Activity Tracking

Manual override for submission/voting activity:

1. Select a round
2. For each competitor:
   - Toggle "Submitted" checkbox
   - Set submission timestamp
   - Toggle "Voted" checkbox
   - Set voting timestamp
3. Save changes

Used when email ingestion misses events.

### Bonus Points

Award arbitrary bonus points:
1. Select round
2. Select user
3. Enter points and reason
4. Save

Stored in `challenge_bonus_points` table.

---

## Settings Storage

### group_settings Table

```sql
CREATE TABLE group_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) NOT NULL UNIQUE,

  -- AI toggles
  ai_assistant_enabled BOOLEAN DEFAULT true,
  ai_explain_enabled BOOLEAN DEFAULT true,
  ai_validate_enabled BOOLEAN DEFAULT true,
  ai_hint_enabled BOOLEAN DEFAULT true,
  ai_chat_enabled BOOLEAN DEFAULT true,
  ai_validate_daily_limit INTEGER DEFAULT 5,

  -- Minigame toggles
  submitter_guess_enabled BOOLEAN DEFAULT true,
  round_challenge_enabled BOOLEAN DEFAULT true,
  timeline_game_enabled BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### profiles Table (Admin-Controlled)

```sql
-- Notification permissions (admin controls)
can_toggle_email_notify BOOLEAN DEFAULT true,
can_toggle_chat_notify BOOLEAN DEFAULT true,
can_toggle_reaction_notify BOOLEAN DEFAULT true,
can_toggle_ntfy_notify BOOLEAN DEFAULT false,
can_toggle_push_notify BOOLEAN DEFAULT false,

-- Beta access
timeline_game_tester BOOLEAN DEFAULT false
```

---

## Admin Workflows

### Setting Up a New Season

1. **Create League**: Leagues tab → Add league with season number
2. **Add Competitors**: Competitors tab → Add or import roster
3. **Create Rounds**: Rounds tab → Add rounds with themes and dates
4. **Generate Content**: Generate banners and challenges as rounds progress

### Processing Round Results

1. **Update Status**: Change round status to "revealed"
2. **Generate Story**: Click "Generate Story" button
3. **Generate Awards**: Click "Generate Awards" button
4. **Generate Winners Image**: Click "Generate Winners Image" button
5. **Verify**: Check History page for correct display

### Managing Activity Tracking

1. **Automatic**: n8n workflow captures email events
2. **Manual Override**: Bonus tab → Activity Tracking
3. **Verify**: Activity Tracker in Peek Panel shows correct status

---

## Troubleshooting

### AI Generation Fails

- Check edge function logs: `supabase functions logs openrouter-round-story`
- Verify `OPENROUTER_API_KEY` secret is set
- Check model availability on OpenRouter

### Invite Emails Not Sending

- Verify SMTP secrets are configured
- Check `SMTP_FROM_EMAIL` is authorized
- Review edge function logs

### Activity Not Tracking

- Check n8n workflow is running
- Verify email parsing is correct
- Use manual override in Bonus tab

### Minigame Not Appearing

- Check group settings toggle is enabled
- For Timeline Game: verify user has `timeline_game_tester = true`
- Ensure round is in correct phase

---

## Related Documentation

- [Architecture Overview](../architecture/overview.md)
- [Minigames Documentation](../features/minigames.md)
- [AI Features Reference](../features/ai_calls.md)
- [Edge Functions Reference](../setup/edge_functions.md)
