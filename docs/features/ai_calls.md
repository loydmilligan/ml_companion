# AI Features Reference

**Version**: 0.2.0 | **Last Updated**: January 2025

This document details all AI-powered features in Talking Music League, including API calls, prompts, and usage patterns.

## Overview

TML uses OpenRouter as a unified API gateway to access multiple AI models:
- **Text Generation**: Claude, GPT-4 for narratives and analysis
- **Image Generation**: DALL-E for banners, trophies, illustrations

All AI calls go through Supabase Edge Functions with JWT authentication.

---

## AI Edge Functions

| Function | Purpose |
|----------|---------|
| `openrouter-compare` | Song connection summaries |
| `openrouter-round-story` | Round/season narratives, images, awards |
| `ai-assistant` | Interactive AI features (explain, validate, hint, chat) |
| `round-challenge` | Generate challenge game content |

---

## openrouter-round-story

The main AI content generation function with multiple modes.

### Modes

| Mode | Output | X-Title |
|------|--------|---------|
| `story` | Round narrative + winners image prompt | "TML - Round Story" |
| `theme` | Theme banner image | "TML - Round Banner" |
| `trophy` | Award trophy image | "TML - Trophy Image" |
| `awards` | Round award selections | "TML - Round Awards" |
| `season_awards` | Season finale awards | "TML - Season Awards" |
| `season_narrative` | Season recap story | "TML - Season Story" |
| `current_season_story` | In-progress season update | "TML - Current Season" |
| `preseason_special` | Pre-vote analysis | "TML - Preseason" |
| `winners_image` | Winners illustration only | "TML - Winners Image" |

### story Mode

Generates the round narrative displayed on History page cards.

**Input**:
```json
{
  "mode": "story",
  "round": {
    "id": "uuid",
    "theme": "Primetime",
    "theme_description": "Songs from TV show theme songs",
    "round_number": 5
  },
  "league_name": "Family Music League",
  "submissions": [
    {
      "title": "Friends Theme",
      "artist": "The Rembrandts",
      "submitter_name": "John",
      "submitter_traits": "tall, glasses",
      "points": 15,
      "place": 1
    }
  ],
  "player_connections": [
    { "source": "John", "target": "Jane", "relation": "Spouse" }
  ]
}
```

**Output**:
```json
{
  "narrative": "Round 5 brought the nostalgia...",
  "winners_image_prompt": "Illustration of three people celebrating..."
}
```

### theme Mode

Generates theme banner image.

**Input**:
```json
{
  "mode": "theme",
  "round": {
    "theme": "Guilty Pleasures",
    "theme_description": "Songs you secretly love"
  },
  "league_name": "Family Music League"
}
```

**Output**:
```json
{
  "image_url": "https://storage.supabase.co/..."
}
```

### awards Mode

Selects appropriate awards from the catalog for a round.

**Input**:
```json
{
  "mode": "awards",
  "round": { "theme": "One-Hit Wonders" },
  "submissions": [...],
  "awards_catalog": [
    {
      "name": "Chart Topper",
      "description": "Most commercially successful pick",
      "type": "positive"
    }
  ]
}
```

**Output**:
```json
{
  "awards": [
    {
      "award_name": "Chart Topper",
      "recipient_name": "John",
      "song_title": "Macarena",
      "reasoning": "..."
    }
  ]
}
```

### current_season_story Mode

Generates narrative for in-progress seasons with three sections.

**Input**:
```json
{
  "mode": "current_season_story",
  "league_name": "Family Music League",
  "season_number": 2,
  "season_data": {
    "rounds_completed": 3,
    "leaderboard": [
      { "name": "John", "points": 45 },
      { "name": "Jane", "points": 42 }
    ]
  },
  "upcoming_round": {
    "theme": "Easy as 1, 2, 3",
    "round_number": 4,
    "theme_description": "Songs with numbers"
  },
  "latest_revealed_round": {
    "theme": "Primetime",
    "round_number": 3
  },
  "minigame_summary": {
    "topGuessers": [
      { "name": "Jane", "score": 8 }
    ]
  }
}
```

**Output**:
```json
{
  "seasonIntro": "Three rounds in and the standings are heating up...",
  "roundTwoRiff": "Next up: Easy as 1, 2, 3. Consider tracks like...",
  "minigameSummary": "Jane dominated the guessing game with 8 correct..."
}
```

### winners_image Mode

Generates winners illustration separately (avoids timeouts).

**Input**:
```json
{
  "mode": "winners_image",
  "winners": [
    {
      "place": 1,
      "name": "John",
      "song": "Friends Theme",
      "artist": "The Rembrandts",
      "traits": "tall, glasses, curly hair"
    }
  ],
  "round": { "title": "Primetime" }
}
```

**Output**:
```json
{
  "image_url": "https://storage.supabase.co/..."
}
```

---

## ai-assistant

Interactive AI features in the Peek Panel.

### Modes

| Mode | Purpose | X-Title |
|------|---------|---------|
| `get_settings` | Fetch group AI settings | - |
| `explain_theme` | Explain theme rules | "TML - Explain Theme" |
| `validate_song` | Check if song fits theme | "TML - Check Song" |
| `generate_hint` | Creative song-finding hints | "TML - Get Hint" |
| `chat_response` | Respond to @AI mentions | "TML - AI Chat" |

### explain_theme Mode

**Input**:
```json
{
  "mode": "explain_theme",
  "round": {
    "id": "uuid",
    "theme": "Guilty Pleasures",
    "theme_description": "Songs you secretly love",
    "theme_author": "Jane"
  },
  "group_id": "uuid",
  "user_id": "uuid"
}
```

**Output**:
```json
{
  "explanation": "This theme is all about those songs you might not admit to loving in public..."
}
```

**Caching**: Explanations are cached in `round_ai_cache` table per round/group.

### validate_song Mode

**Input**:
```json
{
  "mode": "validate_song",
  "round": {
    "theme": "One-Hit Wonders",
    "theme_description": "Artists with only one major hit"
  },
  "song": {
    "title": "Macarena",
    "artist": "Los del Rio"
  },
  "group_id": "uuid",
  "user_id": "uuid"
}
```

**Output**:
```json
{
  "valid": true,
  "confidence": "high",
  "reason": "Los del Rio is a classic one-hit wonder. Macarena was their only major US chart success."
}
```

**Daily Limit**: Enforced via `user_ai_usage` table, default 5 per day.

### generate_hint Mode

**Input**:
```json
{
  "mode": "generate_hint",
  "round": {
    "theme": "Songs About Cities",
    "theme_description": "Songs that reference specific cities"
  },
  "group_id": "uuid",
  "user_id": "uuid"
}
```

**Output**:
```json
{
  "hint": "Think about iconic cities in music history: New York, LA, Chicago... Even smaller cities have their anthems. Don't forget international destinations!"
}
```

**Caching**: Hints cached per round/group.

### chat_response Mode

Triggered when users @mention AI in chat.

**Input**:
```json
{
  "mode": "chat_response",
  "message": "@AI what's a good song about rain?",
  "chat_history": [
    { "author": "John", "text": "I'm stuck on this theme" },
    { "author": "Jane", "text": "Try thinking about weather" }
  ],
  "round": {
    "theme": "Weather Report",
    "theme_description": "Songs about weather"
  },
  "group_id": "uuid",
  "user_id": "uuid"
}
```

**Output**:
```json
{
  "response": "Great question! For weather songs, consider classics like 'Purple Rain' by Prince, 'Here Comes the Sun' by The Beatles, or 'Riders on the Storm' by The Doors. Each brings a different mood!"
}
```

---

## openrouter-compare

Generates song connection summaries when users compare submissions.

**Input**:
```json
{
  "songs": [
    { "title": "Bohemian Rhapsody", "artist": "Queen" },
    { "title": "Stairway to Heaven", "artist": "Led Zeppelin" }
  ],
  "theme": "Epic Rock Anthems"
}
```

**Output**:
```json
{
  "connection": "Both songs represent the pinnacle of 70s progressive rock ambition..."
}
```

**X-Title**: "TML - Song Compare"

---

## round-challenge

Generates Round Challenge bonus game content.

**Modes**:
- `get_or_generate`: Get existing or create new challenge
- `admin_update`: Admin edits song URLs
- `save_guess`: Save player guess
- `get_guesses`: Retrieve player guesses

**Input (get_or_generate)**:
```json
{
  "mode": "get_or_generate",
  "round_id": "uuid",
  "group_id": "uuid"
}
```

**Output**:
```json
{
  "songs": [
    {
      "id": "song1",
      "title": "Africa",
      "artist": "Toto",
      "category_id": "round_4"
    }
  ],
  "categories": [
    {
      "id": "round_4",
      "title": "Guilty Pleasures",
      "description": "Songs you secretly love"
    }
  ],
  "correct_answers": {
    "song1": "round_4"
  }
}
```

**X-Title**: "TML - Round Challenge"

---

## Model Configuration

### Environment Secrets

| Secret | Purpose | Example |
|--------|---------|---------|
| `OPENROUTER_API_KEY` | API authentication | `sk-or-v1-xxx` |
| `OPENROUTER_MODEL` | Primary text model | `anthropic/claude-3.5-sonnet` |
| `OPENROUTER_MID_MODEL` | Fast text model | `anthropic/claude-3-haiku` |
| `OPENROUTER_ROUND_IMAGE_MODEL` | Theme/winners images | `openai/dall-e-3` |
| `OPENROUTER_TROPHY_MODEL` | Trophy images | `openai/dall-e-3` |

### Model Selection by Task

| Task | Model Used |
|------|------------|
| Round narratives | `OPENROUTER_MODEL` |
| Theme explanations | `OPENROUTER_MODEL` |
| Song validation | `OPENROUTER_MID_MODEL` |
| Chat responses | `OPENROUTER_MID_MODEL` |
| Theme banners | `OPENROUTER_ROUND_IMAGE_MODEL` |
| Trophy images | `OPENROUTER_TROPHY_MODEL` |
| Winners illustrations | `OPENROUTER_ROUND_IMAGE_MODEL` |

---

## Usage Tracking

### X-Title Headers

All OpenRouter calls include `X-Title` header for tracking:

```
"TML - Round Story"
"TML - Round Banner"
"TML - Trophy Image"
"TML - Round Awards"
"TML - Season Awards"
"TML - Season Story"
"TML - Song Compare"
"TML - Round Challenge"
"TML - Explain Theme"
"TML - Check Song"
"TML - Get Hint"
"TML - AI Chat"
```

### Caching

| Feature | Cache Location | Key |
|---------|----------------|-----|
| Theme explanations | `round_ai_cache` | round_id + group_id + 'explain' |
| Song hints | `round_ai_cache` | round_id + group_id + 'hint' |
| Song validation | Not cached | Per-request |

### Rate Limiting

| Feature | Limit | Tracking |
|---------|-------|----------|
| Song validation | 5/day per user | `user_ai_usage` table |
| Other features | No limit | - |

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Rate limit exceeded" | OpenRouter quota | Wait or upgrade plan |
| "Model unavailable" | Model temporarily down | Try different model |
| "Invalid API key" | Misconfigured secret | Check `OPENROUTER_API_KEY` |
| "Content filtered" | Image generation blocked | Adjust prompt |

### Retry Logic

Edge functions implement:
- 3 retry attempts for transient errors
- Exponential backoff
- Fallback to cached content where available

---

## Testing

### Test AI Generation

```bash
# Test round story generation
curl -X POST "https://your-project.supabase.co/functions/v1/openrouter-round-story" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"mode": "story", "round": {"theme": "Test"}, "submissions": []}'
```

### Check Edge Function Logs

```bash
supabase functions logs openrouter-round-story --follow
supabase functions logs ai-assistant --follow
```

---

## Related Documentation

- [Edge Functions Reference](../setup/edge_functions.md)
- [Admin Settings Guide](../admin/admin_settings.md)
- [Architecture Overview](../architecture/overview.md)
- [Integrations Overview](../integrations/overview.md)
