# Talking Music League

**Version**: 0.2.0 (Unreleased) | **Last Updated**: January 2025

A companion web app for Music League that enhances the social music experience with AI-powered features, minigames, activity tracking, and real-time chat.

## Overview

Talking Music League (TML) is a React PWA that sits alongside Music League, providing additional features for family and friend groups who play together. Key capabilities include:

- **AI-Generated Content**: Round narratives, theme banners, award trophies, and season recaps
- **Minigames**: Submitter Guess (voting phase) and Round Challenge (submission phase)
- **Activity Tracking**: See who has submitted and voted in real-time
- **Chat System**: Group chat with @AI mentions and reactions
- **Push Notifications**: FCM-based notifications for round events
- **Multi-Platform Music Links**: Spotify, Apple Music, YouTube Music integration

## Quick Links

| Document | Description |
|----------|-------------|
| [Quick Start](docs/setup/quick_start.md) | Get up and running quickly |
| [Architecture](docs/architecture/overview.md) | System architecture and components |
| [UI Specification](docs/design/ui_specification.md) | Design guidelines and screen layouts |
| [Admin Settings](docs/admin/admin_settings.md) | Admin panel configuration guide |
| [Minigames](docs/features/minigames.md) | Game flows and settings |
| [AI Features](docs/features/ai_calls.md) | AI integration reference |
| [Integrations](docs/integrations/overview.md) | External service integrations |
| [Edge Functions](docs/setup/edge_functions.md) | Supabase function reference |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| AI | OpenRouter API (Claude, GPT-4, image models) |
| Push Notifications | Firebase Cloud Messaging (FCM v1 API) |
| Automation | n8n workflows for email ingestion |
| Deployment | Docker Compose on Raspberry Pi |

## Project Structure

```
ml_companion/
├── web/                    # React frontend (Vite + PWA)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React context providers
│   │   ├── lib/            # Utilities and Supabase client
│   │   └── data/           # Static data files
│   └── public/             # Static assets
├── supabase/
│   └── functions/          # Deno Edge Functions
├── n8n/                    # Automation workflow exports
├── docs/                   # Documentation
└── CHANGELOG.md            # Version history
```

## Key Features

### For Players
- View round status and deadlines
- Track submission/voting activity
- Play minigames during rounds
- Chat with group members
- Get AI-powered theme hints
- Receive push notifications

### For Admins (Group Leads)
- Import seasons from Music League
- Generate AI content (banners, stories, awards)
- Manage round settings
- Track user activity
- Control AI features per group
- Send invite emails

## Documentation

Full documentation is in the `docs/` directory:

- **Setup**: Installation, edge functions, environment configuration
- **Architecture**: System design, data flow, component hierarchy
- **Features**: Detailed feature documentation
- **Admin**: Administration guides
- **Integrations**: Third-party service configurations

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

### Current Version (0.2.0 - Unreleased)
- Push notifications via FCM
- Submitter Guess and Round Challenge minigames
- YouTube sidebar player
- AI Assistant (theme explainer, song validator, hints)
- Activity tracking from email ingestion
- Season narratives and awards

### Previous Version (0.1.0 - December 2024)
- Initial release with core functionality
- Supabase auth, group management, chat
- AI-generated theme banners and round stories

## Development

```bash
# Install dependencies
cd web && npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Raspberry Pi (see CLAUDE.md for full workflow)
git push && ssh pi "cd ml_companion && git pull && docker compose down && docker compose build && docker compose up -d"
```

## License

Private project - not for redistribution.

---
*Built with Claude Code for the Mariani Music League*
