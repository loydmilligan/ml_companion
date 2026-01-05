# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Push Notifications (FCM)
- **Firebase Cloud Messaging Integration**: Full push notification system
  - FCM v1 API support with service account authentication
  - Push notification toggle in Settings page with test button
  - Notification type preferences (new_round, results_revealed, new_chat, deadline_reminder)
  - PWA support with `vite-plugin-pwa` for iOS/Android installation
  - Service worker for background notification handling
  - Debug status panel for troubleshooting setup
  - Admin controls for user notification permissions
  - ntfy.sh fallback option with subscribe screenshot guide

#### Minigames
- **Submitter Guess Minigame** (Voting Phase): Guess who submitted each song
  - Integrated directly into SongCard components for streamlined UX
  - Dropdowns for each song showing all competitors
  - Automatic detection and exclusion of user's own song ("Your song" indicator)
  - Score tracking shows X/(total - own songs) to reflect guessable songs
  - Leaderboard shows top 3 guessers after results revealed
  - Persisted guesses via `submitter_guesses` table
  - `useSubmitterGuess` hook manages all guess state
  - Results displayed on History page round cards
- **Round Challenge Bonus Game** (Submission Phase): AI trivia game
  - Guess which Season 1 theme songs belonged to
  - Persistent challenges stored in database (same for all group members)
  - One guess per song per user
  - Previous round answers displayed after round closes
  - Admin can award bonus points
  - Admin toggle to enable/disable per group
  - Challenge regenerate button in admin panel

#### YouTube Integration
- **YouTube Sidebar Player**: In-app YouTube playback
  - Collapsible sidebar with embedded player
  - Play songs directly from song cards
  - YouTube playlist URL field for rounds (admin)
  - Playlist support in sidebar player
- **Song Link Management**: Enhanced media links on song cards
  - Icon buttons for Spotify, YouTube, and quote actions
  - Direct playback vs search fallback

#### Peek Panel Enhancements
- **Activity Tracker**: Show who has submitted/voted
  - All competitors displayed with urgency-based pill colors
  - Real-time status updates during round phases
- **ExpandableSection Component**: Collapsible sections for cleaner UI
- **`<peek_btn>` Tag Support**: Chat messages can include peek panel buttons
- **Phase-Appropriate Gauge**: Needle and stats match current round phase
- **Submitter Comments Display**: Shows submitter's comment on each song card with label

#### AI Features
- **AI-Powered Peek Panel Features**:
  - Theme Explainer: AI explains theme rules and edge cases
  - Rule Validator: Check if a song fits the current theme
  - Hint Generator: Get creative hints for finding songs
  - @AI chat mentions: Tag @AI in chat for contextual responses
- **Season Narratives**: AI-generated season recap stories stored on leagues table
- **Round Narratives**: AI-generated round stories stored on rounds table

#### Admin Panel
- **Button Status Colors**: Green if content exists, grey if not
- **Visual Feedback**: Banner, Story, Awards generation status indicators
- **Round Challenge Controls**: Generation button, Spotify/YouTube link editing
- **Comment Required Toggle**: Require comments on submissions per round
- **Email Invite System**: Send invite emails with group join link
- **Notification Admin Controls**: Manage user notification permissions

#### History Page
- **Minigame Results**: Display on round cards
- **Collapsible Story/Awards Sections**: Expandable content
- **Spotify Links on Cards**: Direct links to round playlists

#### Security
- **JWT Authentication**: All edge functions now require valid JWT tokens

### Changed
- **Deployment Workflow**: Updated to use Docker Compose on Raspberry Pi
  - Pi address: `192.168.4.158` (SSH alias: `pi`)
  - Production URL: `https://talking.mattmariani.com`
  - Local fallback: `http://192.168.4.158:3080`
- **Award Prompts**: Now include submitter name format for song-based awards
- **Renamed Harsh Awards**: Softer naming for negative awards
- **OpenRouter API Calls**: All calls now include X-Title header for app identification (format: "TML - [Feature Name]")
- **Environment Files**: Consolidated into single `.env.example`
- **Invite Email URL**: Now uses `talking.mattmariani.com`
- **Notification Settings UI**: Restructured with admin controls
- **CardStack Components**: Replaced MUI icons with inline SVGs

### Fixed
- TypeScript profile type handling in leaderboard
- Gauge display for voting phase
- Peek panel song links during voting phase
- Service worker registration and toggle state initialization
- ntfy_topic clearing when enabling ntfy option

### Database
- Added `narrative` column to `rounds` table
- Added `narrative` column to `leagues` table
- Added `round_challenges` table for bonus game songs
- Added `challenge_guesses` table for user guesses
- Added `challenge_bonus_points` table for admin bonus points
- Added `ai_chat_enabled` column to `group_settings` table
- Added `submitter_guesses` table for Submitter Guess minigame
- Added `submitter_guess_enabled` column to `group_settings` table
- Added `comment_required` column to `rounds` table
- Added `ml_email_events` table for email ingestion
- Added `round_user_activity` table for activity tracking
- Added push notification columns to `profiles` table

### Edge Functions
- `send-push-notification`: New FCM v1 API notification sender
- `process-email-events`: Email event processing and activity tracking
- `round-challenge`: Bonus game management
- `openrouter-round-story`: Updated with award prompts and season narrative mode
- `ai-assistant`: Added ai_chat_enabled support and X-Title headers
- All functions: Added JWT authentication and X-Title headers

## [0.1.0] - 2024-12-01

### Added
- Initial project setup
- Supabase authentication with Google and Apple Sign In
- Family group management
- Round tracking and submissions
- Chat functionality
- History page with round cards
- Admin panel for league management
- AI-generated theme banners and round stories
- Award system with trophy generation
