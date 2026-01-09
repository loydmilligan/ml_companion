# Architecture Overview

**Version**: 0.2.0 | **Last Updated**: January 2025

This document describes the system architecture of Talking Music League, including component hierarchy, data flow, and deployment topology.

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Services](#backend-services)
4. [Data Flow](#data-flow)
5. [Component Hierarchy](#component-hierarchy)
6. [Deployment Architecture](#deployment-architecture)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client (Browser/PWA)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   React UI  │  │   Service   │  │    FCM      │  │  IndexedDB │ │
│  │  Components │  │   Worker    │  │   Client    │  │   Cache    │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
└─────────┼────────────────┼────────────────┼───────────────┼─────────┘
          │                │                │               │
          ▼                ▼                ▼               │
┌─────────────────────────────────────────────────────────────────────┐
│                           Supabase                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  PostgreSQL │  │    Auth     │  │   Storage   │  │    Edge    │ │
│  │  Database   │  │  (Google/   │  │  (Avatars,  │  │  Functions │ │
│  │             │  │   Apple)    │  │   Images)   │  │            │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────┬─────┘ │
└───────────────────────────────────────────────────────────┼─────────┘
                                                            │
          ┌─────────────────────────────────────────────────┼─────────┐
          │                                                 │         │
          ▼                    ▼                            ▼         │
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│   OpenRouter AI  │  │  Firebase (FCM)  │  │   External APIs      │ │
│  - Claude        │  │  - Push Notifs   │  │  - Spotify           │ │
│  - GPT-4         │  │                  │  │  - YouTube           │ │
│  - Image Models  │  │                  │  │  - song.link         │ │
└──────────────────┘  └──────────────────┘  └──────────────────────┘ │
                                                                      │
┌─────────────────────────────────────────────────────────────────────┘
│                          n8n (Automation)
│  ┌─────────────────────────────────────────────────────────────────┐
│  │  Gmail Trigger → Parse Emails → Insert to ml_email_events       │
│  └─────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────
```

## Frontend Architecture

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool and dev server |
| vite-plugin-pwa | 0.21.x | PWA capabilities |
| @dnd-kit/core | 6.x | Drag and drop for minigames |
| react-router-dom | 7.x | Client-side routing |
| @supabase/supabase-js | 2.x | Backend client |

### Directory Structure

```
web/src/
├── components/
│   ├── CardStack/          # History page card stack
│   │   ├── CardStack.tsx   # Main stack controller
│   │   ├── RoundCard.tsx   # Individual round cards
│   │   ├── CurrentSeasonCard.tsx
│   │   ├── SeasonRecapCard.tsx
│   │   └── PreseasonSpecialCard.tsx
│   ├── pinned-peek/        # Bottom panel components
│   │   ├── PeekPanel.tsx   # Main peek panel
│   │   ├── PinnedBar.tsx   # Collapsed bar
│   │   ├── AIAssistant.tsx # AI features
│   │   ├── ActivityTracker.tsx
│   │   ├── RoundChallengeModal.tsx
│   │   ├── TimelineGameModal.tsx
│   │   └── SubmitterGuess.tsx
│   ├── youtube-sidebar/    # YouTube player
│   └── [shared components]
├── pages/
│   ├── DashboardPage.tsx   # Home/current round
│   ├── HistoryPage.tsx     # Past rounds card stack
│   ├── ChatPage.tsx        # Group chat
│   ├── LeaderboardPage.tsx # Season standings
│   ├── AdminPage.tsx       # Admin controls
│   ├── SettingsPage.tsx    # User preferences
│   └── ProfilePage.tsx     # User profile
├── hooks/
│   └── usePushNotifications.ts
├── contexts/
│   ├── AuthContext.tsx     # Auth state
│   └── YouTubeSidebarContext.tsx
├── lib/
│   ├── supabase.ts         # Supabase client
│   └── imageUpload.ts      # Storage helpers
└── data/
    ├── awards.json         # Awards catalog
    └── round_challenge_song_list.json
```

### State Management

The app uses React Context for global state:

| Context | Purpose |
|---------|---------|
| `AuthContext` | User session, profile, group membership |
| `YouTubeSidebarContext` | YouTube player state |
| `PeekPanelContext` | Bottom panel open/closed state |

Local component state handles most UI state. No Redux or similar libraries are used.

### Routing

```
/                   → DashboardPage (redirects to /dashboard)
/dashboard          → Current round view
/history            → Past rounds card stack
/chat               → Group chat
/leaderboard        → Season standings
/admin              → Admin panel (lead role only)
/settings           → User preferences
/profile            → User profile
/auth               → Login page
/onboarding         → New user setup
/invite/:code       → Join group via invite
```

## Backend Services

### Supabase Configuration

| Service | Usage |
|---------|-------|
| **PostgreSQL** | All application data |
| **Auth** | Google and Apple Sign In |
| **Storage** | Avatar uploads, AI-generated images |
| **Edge Functions** | AI calls, notifications, external APIs |
| **Realtime** | Chat subscriptions (future) |

### Database Schema (Key Tables)

```sql
-- Core entities
groups          -- Family/friend groups
profiles        -- User profiles (extends auth.users)
group_members   -- Group membership with roles

-- League data
leagues         -- Music League leagues
rounds          -- Individual rounds
submissions     -- Song submissions per round
season_competitors  -- Player roster per season

-- Social features
chat_messages   -- Group chat
reactions       -- Message reactions

-- AI content
round_awards    -- Generated awards
round_ai_cache  -- Cached AI responses

-- Minigames
submitter_guesses       -- Submitter Guess game
round_challenge_v2      -- Round Challenge game state
round_challenge_guesses -- Challenge answers

-- Activity tracking
ml_email_events         -- Parsed Music League emails
round_user_activity     -- Submission/voting activity

-- Settings
group_settings  -- Per-group feature toggles
```

### Edge Functions

| Function | Purpose | Auth |
|----------|---------|------|
| `openrouter-compare` | Song connection summaries | JWT |
| `openrouter-round-story` | Round narratives, banners, trophies, awards | JWT |
| `round-challenge` | Bonus game management | JWT |
| `ai-assistant` | Theme explainer, validator, hints | JWT |
| `notify` | Legacy ntfy + email notifications | JWT |
| `send-push-notification` | FCM v1 API push | JWT |
| `process-email-events` | Email activity processing | JWT |
| `song-links` | Spotify → multi-platform links | JWT |
| `send-invite-email` | Email invitations | JWT |
| `ingest-spotify-playlist` | Playlist import | JWT |
| `youtube-playlist` | YouTube playlist creation | JWT |

See [Edge Functions Reference](../setup/edge_functions.md) for detailed documentation.

## Data Flow

### Round Lifecycle

```
1. Round Created (Admin imports or creates)
   └─→ rounds table updated
   └─→ Push notification: "New round started"

2. Submission Phase
   ├─→ Email ingestion tracks submissions
   ├─→ AI Assistant available for hints
   └─→ Round Challenge minigame active

3. Voting Phase
   ├─→ Email ingestion tracks votes
   ├─→ Submitter Guess minigame active
   └─→ Activity Tracker shows progress

4. Results Revealed
   ├─→ Push notification: "Results are in"
   ├─→ AI generates round story
   ├─→ AI selects awards
   ├─→ Minigame results calculated
   └─→ History page shows round card
```

### AI Content Generation Flow

```
Admin triggers generation
        │
        ▼
┌───────────────────┐
│  Edge Function    │
│  (openrouter-     │
│   round-story)    │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐     ┌───────────────────┐
│   OpenRouter API  │────▶│  Text Generation  │
│   (Claude/GPT)    │     │  (narrative,      │
└───────────────────┘     │   awards, etc.)   │
         │                └───────────────────┘
         │
         ▼
┌───────────────────┐     ┌───────────────────┐
│   OpenRouter API  │────▶│  Image Generation │
│   (DALL-E/etc.)   │     │  (banner, trophy) │
└───────────────────┘     └───────────────────┘
         │
         ▼
┌───────────────────┐
│  Supabase Storage │
│  (upload image)   │
└───────────────────┘
         │
         ▼
┌───────────────────┐
│  Database Update  │
│  (narrative,      │
│   image_url)      │
└───────────────────┘
```

## Component Hierarchy

### History Page (Card Stack)

```
HistoryPage
├── CardStack
│   ├── CurrentSeasonCard (if active season)
│   ├── SeasonRecapCard (for completed seasons)
│   ├── PreseasonSpecialCard (before voting starts)
│   └── RoundCard[] (for each revealed round)
│       ├── CardHero (theme banner)
│       ├── QuickStats (points, participation)
│       ├── AwardsPreview (award icons)
│       ├── StoryPanel (AI narrative)
│       └── TrackList (submissions)
└── PeekPanel (bottom sheet)
    ├── PinnedBar (collapsed)
    └── [expanded content]
```

### Dashboard Page

```
DashboardPage
├── TopBar
├── RoundInfo (theme, deadlines)
├── ProgressSection (submission/voting status)
├── SongCard[] (submissions during voting)
│   └── SubmitterGuess (minigame integration)
├── AIAssistant
├── ActivityTracker
└── PeekPanel
    ├── DeadlineBar
    ├── RoundCountdown
    └── Minigame buttons
```

### Admin Page

```
AdminPage
├── TabNavigation
└── [Tab Content]
    ├── Users (member management)
    ├── Invites (invite code management)
    ├── Leagues (league CRUD)
    ├── Rounds (round CRUD + AI generation)
    ├── Competitors (roster management)
    ├── Imports (season data import)
    ├── AI Settings (feature toggles)
    └── Bonus (bonus points, tracking)
```

## Deployment Architecture

### Production Environment

```
┌──────────────────────────────────────────────────────────────┐
│                    Cloudflare Tunnel                         │
│                talking.mattmariani.com                       │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   Raspberry Pi (192.168.4.158)               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Docker Compose                        │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │              web container                       │   │ │
│  │  │  - Node.js                                       │   │ │
│  │  │  - Vite preview server                          │   │ │
│  │  │  - Port 3080                                    │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Deployment Commands

```bash
# Standard deployment
git add -A && git commit -m "message" && git push
ssh pi "cd ml_companion && git pull && docker compose down && docker compose build && docker compose up -d"

# Verify deployment
# Use Chrome DevTools MCP to navigate to https://talking.mattmariani.com
# Take snapshot and check console for errors
```

### Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | web/.env | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | web/.env | Supabase public key |
| `VITE_FIREBASE_*` | web/.env | Firebase config for FCM |
| `OPENROUTER_API_KEY` | Supabase secrets | AI API access |
| `FCM_*` | Supabase secrets | Push notification credentials |
| `SMTP_*` | Supabase secrets | Email sending |
| `SPOTIFY_*` | Supabase secrets | Spotify API |
| `YOUTUBE_*` | Supabase secrets | YouTube API |

---

## Related Documentation

- [Edge Functions Reference](../setup/edge_functions.md)
- [UI Specification](../design/ui_specification.md)
- [Admin Settings Guide](../admin/admin_settings.md)
- [Integrations Overview](../integrations/overview.md)
