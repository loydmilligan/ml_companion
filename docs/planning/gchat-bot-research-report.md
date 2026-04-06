# Google Chat Bot Research Report

> Synthesized from 4 parallel research agents + Context7 documentation
> Created: 2026-03-22

---

## Executive Summary

**For your use case, incoming webhooks are the simplest and best solution.**

You don't need a full Chat App. Webhooks can:
- Post messages with cards, images, and buttons ✓
- Be triggered by your existing n8n workflow ✓
- Link to external forms ✓
- Display infographic images via URL ✓

Setup time: **5 minutes**. Cost: **Free**.

---

## The Two Options

| Approach | Setup Time | Complexity | Cost | Best For |
|----------|------------|------------|------|----------|
| **Incoming Webhook** | 5 min | Very Low | Free | One-way notifications, posting links/images |
| **Full Chat App** | 30-60 min | Medium | Free tier | Two-way interaction, reading messages |

**Your use case**: Post a link when voting starts, post an infographic when round reveals.

**Recommendation**: **Webhooks**. You don't need two-way communication.

---

## Webhook Implementation

### Step 1: Create Webhook (5 minutes)

1. Open Google Chat in browser (not mobile)
2. Navigate to target family space
3. Click expand arrow → **Apps & integrations**
4. Click **Add webhooks**
5. Enter name: "Music League Bot"
6. Copy the webhook URL

**URL format:**
```
https://chat.googleapis.com/v1/spaces/SPACE_ID/messages?key=KEY&token=TOKEN
```

### Step 2: Store Webhook URL

Add to Supabase secrets or n8n credentials:
```bash
supabase secrets set GCHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/..."
```

### Step 3: Post Messages

**Simple text:**
```bash
curl -X POST "$GCHAT_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text": "Voting is open for Round 5!"}'
```

**Card with button (for guessing link):**
```json
{
  "cardsV2": [{
    "cardId": "guess-prompt",
    "card": {
      "header": {
        "title": "🎵 Round 5: Guilty Pleasures",
        "subtitle": "Voting is open! Can you guess who picked what?"
      },
      "sections": [{
        "widgets": [{
          "textParagraph": {
            "text": "3 quick questions, instant results. Takes 30 seconds."
          }
        }, {
          "buttonList": {
            "buttons": [{
              "text": "Play Now",
              "onClick": {
                "openLink": {
                  "url": "https://yourapp.com/guess?round=5&token=abc123"
                }
              }
            }]
          }
        }]
      }]
    }
  }]
}
```

**Card with image (for infographic):**
```json
{
  "cardsV2": [{
    "cardId": "results",
    "card": {
      "header": {
        "title": "📊 Round 5 Results",
        "subtitle": "Theme: Guilty Pleasures"
      },
      "sections": [{
        "widgets": [{
          "image": {
            "imageUrl": "https://your-supabase.supabase.co/storage/v1/object/public/infographics/round5.png",
            "altText": "Round 5 voting results infographic"
          }
        }]
      }]
    }
  }]
}
```

---

## Integration with Your Stack

### n8n Already Has Google Chat Support

Your n8n instance already processes Music League emails. Add a Google Chat node to the existing workflow:

```
[Gmail Trigger] → [Switch by Event Type] → [Process Event]
                                                ↓
                                        [Google Chat Node]
                                                ↓
                                        [Post to Family Space]
```

**n8n Google Chat Node:**
- Native integration available
- Supports webhooks (just HTTP POST)
- Can format JSON payloads

### Workflow: Voting Phase Starts

```
1. n8n detects "playlist_ready" email from Music League
2. Edge function processes event, updates Supabase
3. Edge function generates magic links for each family member
4. n8n posts card to GChat with "Play Now" button
```

### Workflow: Round Reveals

```
1. n8n detects "votes_in" email from Music League
2. Edge function processes results
3. Edge function generates infographic, uploads to Supabase Storage
4. n8n posts card to GChat with infographic image
```

---

## Technical Constraints

### Webhook Limitations (All Fine for Your Use Case)

| Limitation | Impact on You |
|------------|---------------|
| One-way only (can't read messages) | ✓ Fine - you only need to post |
| 1 request/second rate limit | ✓ Fine - you post a few times per round |
| Can't upload files directly | ✓ Fine - host images on Supabase Storage |
| Can't interact with button clicks | ✓ Fine - buttons open external URLs |
| Requires Google Workspace | ⚠️ Verify family members have Workspace accounts |

### Message Constraints

| Constraint | Value |
|------------|-------|
| Max message size | 32 KB |
| Max widgets per card | 100 |
| Image format | PNG or JPG, HTTPS URL required |
| Image size | Recommended < 2 MB |
| Rate limit | 1 request/second per space |

### Image Hosting

Images must be hosted externally. Use Supabase Storage:

```typescript
// Upload infographic to Supabase Storage
const { data, error } = await supabase.storage
  .from('infographics')
  .upload(`round-${roundId}.png`, imageBuffer, {
    contentType: 'image/png',
    upsert: true
  });

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('infographics')
  .getPublicUrl(`round-${roundId}.png`);

// Use in GChat card
const cardPayload = {
  cardsV2: [{
    card: {
      sections: [{
        widgets: [{
          image: { imageUrl: publicUrl }
        }]
      }]
    }
  }]
};
```

---

## If You Need More Later: Full Chat App

If you later want two-way interaction (users respond in chat, bot reads messages), upgrade to a full Chat App:

### Setup (30-60 minutes)

1. Create Google Cloud project
2. Enable Google Chat API
3. Create service account with `chat.bot` scope
4. Deploy Cloud Run function
5. Configure Chat API with function URL
6. Add bot to space as member

### Cost

**Free tier covers:**
- 2 million invocations/month
- 400,000 GB-seconds compute
- Light-to-moderate usage: $0/month

### When You'd Need This

- Users reply to bot in chat and bot responds
- Bot reads other messages in the space
- Interactive card buttons that trigger bot actions (not just open URLs)
- Publishing to Google Workspace Marketplace

**For your v0.1**: Webhooks are sufficient. Don't over-engineer.

---

## Recommendation

### Phase 1 (Now): Webhooks + n8n

```
┌─────────────────────────────────────────────────────────────┐
│  Music League Email                                          │
│       ↓                                                      │
│  n8n Workflow (existing)                                     │
│       ↓                                                      │
│  Process Event → Generate Magic Links                        │
│       ↓                                                      │
│  POST to GChat Webhook                                       │
│       ↓                                                      │
│  Card appears in family chat with "Play Now" button          │
└─────────────────────────────────────────────────────────────┘
```

**Why:**
- Uses your existing n8n infrastructure
- Zero new services to set up
- 5-minute webhook setup
- Free forever

### Phase 2 (If Needed): Upgrade to Chat App

Only if you need:
- Bot to respond to messages in chat
- Interactive card buttons that trigger bot logic
- Reading conversation history

---

## Quick Start Checklist

- [ ] Open Google Chat space in browser
- [ ] Add webhook: Apps & integrations → Add webhooks
- [ ] Name it "Music League Bot", copy URL
- [ ] Store URL in Supabase secrets
- [ ] Add Google Chat HTTP node to n8n workflow
- [ ] Test with simple text message
- [ ] Build card payloads for guessing link and infographic
- [ ] Wire up to existing email event triggers

---

## Card Templates

### Template 1: Guessing Game Prompt

```json
{
  "cardsV2": [{
    "cardId": "guess-{{roundId}}",
    "card": {
      "header": {
        "title": "🎵 {{roundTheme}}",
        "subtitle": "Round {{roundNumber}} • Voting is open"
      },
      "sections": [{
        "widgets": [{
          "textParagraph": {
            "text": "Can you guess who submitted each song? <b>3 quick questions</b>, takes 30 seconds."
          }
        }, {
          "buttonList": {
            "buttons": [{
              "text": "🎮 Play Now",
              "onClick": {
                "openLink": {
                  "url": "{{magicLinkUrl}}"
                }
              }
            }]
          }
        }]
      }]
    }
  }]
}
```

### Template 2: Results Infographic

```json
{
  "cardsV2": [{
    "cardId": "results-{{roundId}}",
    "card": {
      "header": {
        "title": "📊 Results: {{roundTheme}}",
        "subtitle": "Round {{roundNumber}} • {{themeLabel}}"
      },
      "sections": [{
        "widgets": [{
          "image": {
            "imageUrl": "{{infographicUrl}}",
            "altText": "Round {{roundNumber}} results"
          }
        }, {
          "textParagraph": {
            "text": "{{funnyStat}}"
          }
        }]
      }]
    }
  }]
}
```

### Template 3: Fun Fact (Instant Reward)

```json
{
  "text": "🎵 *Fun Fact:* Your family has submitted {{totalSongs}} songs across {{totalRounds}} rounds. The most-played decade? The *{{topDecade}}s* with {{decadeCount}} songs!"
}
```

---

## Appendix: Alternative Platforms

If Google Chat doesn't work out (e.g., family members don't have Workspace accounts):

### GroupMe

| Aspect | Details |
|--------|---------|
| Auth | Simple access token (no OAuth) |
| Setup | Create bot at dev.groupme.com, get bot ID |
| Posting | `POST https://api.groupme.com/v3/bots/post` |
| Images | Upload to image service, include URL in message |
| No-code | MeBots.io, GroupMeBots.com |

**Simpler than GChat** but different platform - requires family to use GroupMe.

### Discord

| Aspect | Details |
|--------|---------|
| Auth | Bot token or webhook URL |
| Setup | Create bot in Discord Developer Portal |
| Posting | Webhooks similar to GChat |
| Images | Embed URLs in message |

**More features** but likely overkill for family use.

---

## Sources

- [Google Chat Webhook Quickstart](https://developers.google.com/workspace/chat/quickstart/webhooks)
- [Google Chat Cards v2 Reference](https://developers.google.com/workspace/chat/api/reference/rest/v1/cards)
- [Google Chat Usage Limits](https://developers.google.com/workspace/chat/limits)
- [n8n Google Chat Integration](https://n8n.io/integrations/google-chat/)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
