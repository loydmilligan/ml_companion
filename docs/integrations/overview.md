# Integrations Overview

**Version**: 0.2.0 | **Last Updated**: January 2025

Talking Music League integrates with several external services to provide its functionality.

## Integration Summary

| Service | Purpose | Required |
|---------|---------|----------|
| **Supabase** | Database, auth, storage, edge functions | Yes |
| **OpenRouter** | AI text and image generation | Yes (for AI features) |
| **Firebase** | Push notifications (FCM) | Optional |
| **Spotify** | Playlist import, track metadata | Optional |
| **YouTube** | Video links, playlist creation | Optional |
| **song.link** | Multi-platform music links | Optional |
| **n8n** | Email automation | Optional |
| **ntfy** | Push notifications (legacy) | Optional |
| **Gmail SMTP** | Email sending | Optional |

---

## Core Integrations

### Supabase

**Purpose**: Backend-as-a-service providing all core infrastructure.

**Components Used**:
- **PostgreSQL**: All application data
- **Auth**: Google and Apple Sign In
- **Storage**: Avatar uploads, AI-generated images
- **Edge Functions**: Serverless functions for AI, notifications, external APIs
- **Realtime**: Chat message subscriptions (planned)

**Configuration**:
```env
# web/.env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Documentation**: [Supabase Docs](https://supabase.com/docs)

---

### OpenRouter

**Purpose**: Unified API for multiple AI models (Claude, GPT-4, DALL-E, etc.)

**Features Used**:
- Text generation (round narratives, theme explanations, song validation)
- Image generation (theme banners, award trophies, winners illustrations)
- Structured output for awards selection

**Models Configured**:
| Secret | Purpose | Example Model |
|--------|---------|---------------|
| `OPENROUTER_MODEL` | Primary text | `anthropic/claude-3.5-sonnet` |
| `OPENROUTER_ROUND_IMAGE_MODEL` | Theme banners | `openai/dall-e-3` |
| `OPENROUTER_TROPHY_MODEL` | Award trophies | `openai/dall-e-3` |
| `OPENROUTER_MID_MODEL` | Fast operations | `anthropic/claude-3-haiku` |

**Configuration**:
```bash
supabase secrets set OPENROUTER_API_KEY=sk-or-...
supabase secrets set OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

**X-Title Headers**: All API calls include app identification for tracking:
- "TML - Round Story"
- "TML - Round Banner"
- "TML - Song Compare"
- "TML - AI Chat"
- etc.

**Documentation**: [OpenRouter Docs](https://openrouter.ai/docs)

---

### Firebase Cloud Messaging (FCM)

**Purpose**: Push notifications to mobile and desktop browsers.

**Features**:
- New round notifications
- Results revealed notifications
- Chat message notifications (planned)
- Deadline reminders (planned)

**Configuration**:
```bash
# Supabase secrets
supabase secrets set FCM_PROJECT_ID=your-project-id
supabase secrets set FCM_SERVICE_ACCOUNT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com
supabase secrets set FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# web/.env (for client-side FCM)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

**Documentation**: [FCM v1 API Docs](https://firebase.google.com/docs/cloud-messaging)

---

## Music Service Integrations

### Spotify

**Purpose**: Import playlists, get track metadata.

**Features**:
- Import tracks from Spotify playlists into rounds
- Extract track metadata (title, artist, album, artwork, release year)
- Get Spotify URLs for song cards

**Configuration**:
```bash
supabase secrets set SPOTIFY_CLIENT_ID=...
supabase secrets set SPOTIFY_CLIENT_SECRET=...
```

Uses Client Credentials flow (no user auth required).

**Edge Function**: `ingest-spotify-playlist`

**Documentation**: [Spotify Web API](https://developer.spotify.com/documentation/web-api)

---

### YouTube

**Purpose**: Video playback and playlist creation.

**Features**:
- In-app YouTube player (sidebar)
- Create YouTube playlists from round submissions
- Video links on song cards

**Configuration**:
```bash
supabase secrets set YOUTUBE_CLIENT_ID=...
supabase secrets set YOUTUBE_CLIENT_SECRET=...
supabase secrets set YOUTUBE_REFRESH_TOKEN=...
```

Requires OAuth2 refresh token from an authorized YouTube account.

**Edge Function**: `youtube-playlist`

**Documentation**: [YouTube Data API](https://developers.google.com/youtube/v3)

---

### song.link (Odesli)

**Purpose**: Convert Spotify URIs to multi-platform links.

**Features**:
- Convert single track or batch
- Get links for: Spotify, Apple Music, YouTube, YouTube Music
- Universal song.link page URL

**No configuration required** - uses public API.

**Edge Function**: `song-links`

**Returned Links**:
| Field | Example |
|-------|---------|
| `spotify_url` | `https://open.spotify.com/track/xxx` |
| `apple_music_url` | `https://music.apple.com/us/album/xxx` |
| `youtube_url` | `https://www.youtube.com/watch?v=xxx` |
| `youtube_music_url` | `https://music.youtube.com/watch?v=xxx` |
| `song_link_url` | `https://song.link/xxx` |

**Documentation**: [song.link API](https://odesli.co/)

---

## Automation Integrations

### n8n

**Purpose**: Workflow automation for email ingestion.

**Features**:
- Poll Gmail for Music League notification emails
- Parse email content to extract events
- Insert activity records into Supabase

**Workflow**: See [n8n Email Ingestion](n8n_email_ingestion.md) for detailed documentation.

**Configuration**: Self-hosted n8n instance with Gmail OAuth credentials.

**Documentation**: [n8n Docs](https://docs.n8n.io/)

---

## Legacy/Optional Integrations

### ntfy

**Purpose**: Alternative push notification system via ntfy.sh.

**Features**:
- Topic-based notifications
- No app installation required
- Browser and mobile support

**Configuration**:
```bash
supabase secrets set NTFY_SERVER_URL=https://ntfy.sh
supabase secrets set NTFY_TOPIC=your-topic
supabase secrets set NTFY_USERNAME=... (optional)
supabase secrets set NTFY_PASSWORD=... (optional)
```

**Edge Function**: `notify`

**Documentation**: [ntfy Docs](https://ntfy.sh/docs/)

---

### Gmail SMTP

**Purpose**: Send email notifications and invites.

**Features**:
- Email notifications (chat, round events)
- Invite emails with group join links

**Configuration**:
```bash
supabase secrets set SMTP_HOST=smtp.gmail.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USERNAME=your-email@gmail.com
supabase secrets set SMTP_PASSWORD=app-password
supabase secrets set SMTP_FROM_EMAIL=your-email@gmail.com
```

Requires Gmail App Password (not regular password).

**Edge Functions**: `notify`, `send-invite-email`

---

## Integration Matrix

| Feature | Supabase | OpenRouter | FCM | Spotify | YouTube | song.link |
|---------|:--------:|:----------:|:---:|:-------:|:-------:|:---------:|
| Core app | x | | | | | |
| AI narratives | x | x | | | | |
| Push notifications | x | | x | | | |
| Music links | x | | | x | x | x |
| Playlist import | x | | | x | | |
| YouTube player | x | | | | x | |

---

## Related Documentation

- [Edge Functions Reference](../setup/edge_functions.md)
- [n8n Email Ingestion](n8n_email_ingestion.md)
- [Architecture Overview](../architecture/overview.md)
