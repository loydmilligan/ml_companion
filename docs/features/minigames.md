# Minigames

**Version**: 0.2.0 | **Last Updated**: January 2025

Talking Music League includes two minigames that add extra engagement during rounds.

## Overview

| Game | Active Phase | Description |
|------|--------------|-------------|
| **Submitter Guess** | Voting | Guess who submitted each song |
| **Round Challenge** | Submission | Match songs to past themes |
| **Timeline Game** | Voting | Sort songs by release year |

---

## Submitter Guess

### Description

During the voting phase, players try to guess who submitted each song before results are revealed. This adds a social deduction element to the listening experience.

### Game Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Voting Phase Begins                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Player views submissions in Dashboard/Peek Panel                │
│  Each song card has a "Guess submitter" dropdown                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Player selects a competitor name for each song                  │
│  - Own song shows "Your song" (excluded from scoring)            │
│  - Guesses auto-save to database                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Results Revealed                              │
│  - Correct guesses highlighted in green                         │
│  - Score displayed: X / (total - own song)                      │
│  - Leaderboard shows top guessers                               │
└─────────────────────────────────────────────────────────────────┘
```

### User Interface

**Song Card Integration**:
- Dropdown appears below each song during voting
- Shows all competitors in the season
- Automatically excludes user's own submission
- Visual feedback on selection

**Scoring Display**:
- Progress shown as "3/9 guessed"
- After reveal: "Score: 5/9 correct"
- Percentage or raw score based on setting

**Leaderboard**:
- Top 3 guessers displayed on round cards
- Shows name and score
- Only appears after results revealed

### Database Schema

```sql
CREATE TABLE submitter_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  submission_id UUID REFERENCES submissions(id) NOT NULL,
  guessed_profile_id UUID REFERENCES profiles(id),
  guessed_competitor_name TEXT,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(round_id, user_id, submission_id)
);
```

### Settings

| Setting | Location | Default | Description |
|---------|----------|---------|-------------|
| `submitter_guess_enabled` | `group_settings` | `true` | Master toggle for the game |

**Admin Toggle**: Admin → AI Settings → "Submitter Guess Minigame"

### Hook: useSubmitterGuess

```typescript
const {
  guesses,           // Map of submission_id -> guessed_competitor_name
  score,             // Current score (after reveal)
  total,             // Total guessable songs
  loading,
  saveGuess,         // (submissionId, competitorName) => Promise
  isRevealed,        // Whether results are visible
} = useSubmitterGuess(roundId, userId);
```

---

## Round Challenge

### Description

During the submission phase, players match songs to themes from Season 1. Three songs are presented, each belonging to a different theme. Players must identify which theme each song fits.

### Game Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   Submission Phase Active                        │
│                   Player opens Peek Panel                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  "Round Challenge" button appears in Peek Panel                  │
│  Player taps to open the game modal                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Challenge Modal displays:                                       │
│  - 3 songs as compact thumbnail cards                           │
│  - 3 theme categories with icons and descriptions               │
│  - Tap-to-select or drag-and-drop interaction                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Player assigns songs to themes:                                 │
│  - Tap a song to select it                                      │
│  - Tap a theme to assign the selected song                      │
│  - Or drag song directly to theme                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Player submits guesses                                          │
│  - One submission per round per user                            │
│  - Cannot change after submit                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    After Round Closes                            │
│  - Correct answers revealed                                     │
│  - Score shown (0-3)                                           │
│  - Results appear in Current Season Story                       │
└─────────────────────────────────────────────────────────────────┘
```

### User Interface

**Compact Song Cards**:
- Square thumbnails (60px default)
- Album artwork with play button overlay
- Border colors indicate state:
  - Default: Gray border
  - Selected: Accent color border + glow
  - Correct: Green border
  - Incorrect: Red border

**Theme Cards**:
- Theme icon (custom per theme)
- Theme title
- Info button for hints/description
- Drop zone for song assignment

**Interaction Model**:
1. **Tap-to-select** (primary):
   - Tap song to select
   - Tap theme to assign
   - Tap selected song to deselect

2. **Drag-and-drop** (secondary):
   - Drag song directly to theme
   - Uses @dnd-kit library

### Database Schema

```sql
-- Challenge instance per round/group
CREATE TABLE round_challenge_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) NOT NULL,
  group_id UUID REFERENCES groups(id) NOT NULL,
  song_ids TEXT[] NOT NULL,           -- 3 song IDs
  category_ids TEXT[] NOT NULL,       -- 3 theme IDs
  correct_answers JSONB NOT NULL,     -- { song_id: category_id }
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(round_id, group_id)
);

-- Player guesses
CREATE TABLE round_challenge_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) NOT NULL,
  group_id UUID REFERENCES groups(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  song_id TEXT NOT NULL,
  guessed_theme_id TEXT NOT NULL,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(round_id, group_id, user_id, song_id)
);
```

### Settings

| Setting | Location | Default | Description |
|---------|----------|---------|-------------|
| `round_challenge_enabled` | `group_settings` | `true` | Master toggle for the game |

**Admin Controls**:
- Admin → Rounds → "Generate Challenge" button
- Admin can regenerate challenge songs
- Admin can edit Spotify/YouTube URLs for songs

### Theme Icons

Custom theme icons are stored in `web/public/images/minigames/themes/`:
- `round_1.png` through `round_11.png` (Season 1 themes)

### Hook: useRoundChallenge

```typescript
const {
  songs,             // ChallengeSong[] (3 songs)
  themes,            // ChallengeTheme[] (3 themes)
  assignments,       // Record<song_id, theme_id>
  loading,
  isLocked,          // Cannot change after submit
  isSubmitted,
  canPlay,           // false if already submitted
  results,           // Record<song_id, boolean> (after reveal)
  correctAnswers,    // Record<song_id, theme_id>
  score,             // 0-3
  assignSongToTheme, // (songId, themeId) => void
  removeSongFromTheme, // (songId) => void
  submitGuesses,     // () => Promise
} = useRoundChallenge(roundId, groupId, isRevealed);
```

---

## Timeline Game

### Description

During the voting phase, players sort songs by release year from oldest to newest. Tests music knowledge and release date awareness.

### Game Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Voting Phase Active                          │
│  Timeline Game button appears (if enabled for user)              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Player opens Timeline Game modal                                │
│  - All round submissions displayed as thumbnails                │
│  - Initially in random order                                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Player arranges songs oldest → newest:                          │
│  - Drag songs to reorder                                        │
│  - Tap song for info popup (title, artist, listen link)        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Player submits order                                            │
│  - 3 attempts allowed                                           │
│  - Hint after each attempt shows progress                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    After Results Revealed                        │
│  - Correct order shown with release years                       │
│  - Score based on correct positions                             │
│  - Leaderboard displayed                                        │
└─────────────────────────────────────────────────────────────────┘
```

### User Interface

**Compact Thumbnails**:
- Size adjusts based on song count (40-66px)
- Drag-and-drop reordering
- Tap for song info popup

**Attempt System**:
- 3 attempts maximum
- Hint message after each attempt
- Better scores with fewer attempts

**Results Display**:
- Correct positions highlighted
- Release years shown
- Personal score and leaderboard

### Database Schema

```sql
CREATE TABLE timeline_game_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  guessed_order TEXT[] NOT NULL,      -- Array of submission IDs
  score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(round_id, user_id, attempt_number)
);
```

### Settings

| Setting | Location | Default | Description |
|---------|----------|---------|-------------|
| `timeline_game_enabled` | `group_settings` | `false` | Master toggle |
| `timeline_game_tester` | `profiles` | `false` | Per-user beta access |

**Release Year Data**:
- `submissions.release_year` - Integer year
- Admin can edit in Admin → Rounds → Release Years

### Hook: useTimelineGame

```typescript
const {
  submissions,       // Submission[] with release_year
  currentOrder,      // string[] of submission IDs
  attemptNumber,     // 1-3
  hintMessage,       // Feedback after attempt
  isLocked,          // Max attempts reached
  loading,
  correctOrder,      // Revealed after round closes
  finalScore,
  setOrder,          // (order: string[]) => void
  submitOrder,       // () => Promise
  leaderboard,       // Top scorers
  canPlay,
  reload,
} = useTimelineGame(roundId, groupId, isRevealed);
```

---

## Admin Configuration

### Enabling/Disabling Games

In Admin → AI Settings tab:

- **Submitter Guess Minigame**: Toggle `submitter_guess_enabled`
- **Round Challenge**: Toggle `round_challenge_enabled`
- **Timeline Game**: Toggle `timeline_game_enabled` (beta)

### Managing Challenge Content

In Admin → Rounds tab:
- **Generate Challenge**: Creates new song/theme combinations
- **Edit Song Links**: Update Spotify/YouTube URLs
- **View Scores**: See player performance

### Managing Timeline Game

In Admin → Rounds tab:
- **Release Years**: Edit `release_year` for each submission
- **Testers**: Enable `timeline_game_tester` per user in Users tab
- **Reset Guesses**: Clear all guesses for a round

---

## Minigame Results in UI

### History Page Round Cards

Each round card shows:
- **Submitter Guess**: Top 3 guessers with scores
- **Round Challenge**: Mentioned in Current Season Story
- **Timeline Game**: Top 3 with scores (if enabled)

### Current Season Story

The AI-generated current season narrative includes:
- Guessing game performance summary
- Top guessers mentioned by name
- Fun statistics about guessing patterns

---

## Related Documentation

- [Architecture Overview](../architecture/overview.md)
- [Admin Settings Guide](../admin/admin_settings.md)
- [AI Features Reference](ai_calls.md)
