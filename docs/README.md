# Documentation Index

**Version**: 0.2.0 | **Last Updated**: January 2025

Use this index to navigate the project documentation.

## Quick Start

| Document | Description |
|----------|-------------|
| [Quick Start Guide](setup/quick_start.md) | Get up and running quickly |
| [Architecture Overview](architecture/overview.md) | System design and components |

---

## Architecture

- [architecture/overview.md](architecture/overview.md): System architecture, component hierarchy, data flow, deployment

---

## Setup & Configuration

- [setup/quick_start.md](setup/quick_start.md): Installation and first-run setup
- [setup/edge_functions.md](setup/edge_functions.md): Supabase Edge Functions reference
- [setup/supabase.md](setup/supabase.md): Supabase auth, schema, and RLS setup
- [setup/web_app.md](setup/web_app.md): React app setup and configuration
- [setup/apple_login.md](setup/apple_login.md): Apple Sign In setup with troubleshooting

---

## Features

- [features/minigames.md](features/minigames.md): Submitter Guess, Round Challenge, Timeline Game
- [features/ai_calls.md](features/ai_calls.md): AI integration reference (narratives, validation, hints)

---

## Administration

- [admin/admin_settings.md](admin/admin_settings.md): Admin panel configuration and workflows

---

## Integrations

- [integrations/overview.md](integrations/overview.md): All external service integrations
- [integrations/n8n_email_ingestion.md](integrations/n8n_email_ingestion.md): Email automation workflow

---

## Design

- [design/ui_specification.md](design/ui_specification.md): UX flows, screens, and visual guidance
- [design/peek_card_enhancements.md](design/peek_card_enhancements.md): AI features for peek panel
- [design/chat_first_wireframe.md](design/chat_first_wireframe.md): Chat-first UI design

---

## Requirements & Planning

- [requirements/feature_specification.md](requirements/feature_specification.md): Requirements and user stories
- [planning/project_plan.md](planning/project_plan.md): Roadmap, architecture notes, and atomic tasks

---

## Overview (Historical)

- [overview/initial_discussion.md](overview/initial_discussion.md): Early context and scoping
- [overview/research_and_ideation.md](overview/research_and_ideation.md): Market, competitor, and concept research

---

## Workflow

- [workflow/implementation_workflow.md](workflow/implementation_workflow.md): Iterative AI development process

---

## Issues & Changelog

- [issues.md](issues.md): Reviewed issues and severity tracking
- [../CHANGELOG.md](../CHANGELOG.md): Version history and recent changes

---

## Feature Quick Reference

### Minigames

| Game | Phase | Description |
|------|-------|-------------|
| Submitter Guess | Voting | Guess who submitted each song |
| Round Challenge | Submission | Match songs to Season 1 themes |
| Timeline Game | Voting | Sort songs by release year (beta) |

### AI Features

| Feature | Description |
|---------|-------------|
| Theme Explainer | AI explains theme rules and edge cases |
| Song Validator | Check if a song fits the current theme |
| Hint Generator | Creative hints for finding songs |
| Round Narratives | AI-generated round stories |
| Season Narratives | AI-generated season recap stories |
| Awards Generation | AI selects appropriate awards from catalog |
| @AI Chat | AI responds to mentions in group chat |

### Integrations

| Service | Purpose |
|---------|---------|
| Supabase | Database, auth, storage, edge functions |
| OpenRouter | AI text and image generation |
| Firebase | Push notifications (FCM) |
| Spotify | Playlist import, track metadata |
| YouTube | Video player, playlist creation |
| n8n | Email automation for activity tracking |
