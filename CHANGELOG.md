# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.3] - 2026-01-16

### Fixed
- **Round Challenge Tab**: Now available during revealed phase so users can view their challenge results

## [1.2.2] - 2026-01-16

### Fixed
- **Reveal Timer Settings**: Corrected timer respect options to control main sidebar tabs (Playlist, Progress, Games) instead of sub-tabs within Games
- **Save Button**: Added dedicated "Save Timer Settings" button for clarity
- Migration now properly drops old incorrectly-named columns

## [1.2.1] - 2026-01-16

### Fixed
- **Guess Correctness Timing**: Fixed issue where submitter guess correctness couldn't be calculated at reveal time because `submitter_name` was not yet populated from CSV import
  - Added `recalculate_guess_correctness()` database function for per-round recalculation
  - Added `recalculate_all_guess_correctness()` for bulk recalculation across all rounds
  - SeasonImport now automatically recalculates guess correctness after importing votes
  - Added manual "Recalculate Guess Correctness" button in Admin Imports section

## [1.2.0] - 2026-01-16

### Added

#### Configurable Reveal Timer
- **Reveal Timer Settings**: Configurable timer for when submitter guesses are revealed (1-24 hours, default 8)
  - Added `reveal_timer_hours` setting to `group_settings` table
  - Per-tab timer respect checkboxes for Guess, Timeline, and Challenge tabs
  - Admin UI in group settings panel for reveal timer configuration
  - Updated `process-email-events` edge function to use configurable timer instead of hardcoded 2 hours

#### Enhanced Guess Results
- **GuessResultsSection Component**: Comprehensive results display for Submitter Guess game
  - Personal results showing score and correct guesses
  - Best and worst targets (who was easiest/hardest to guess)
  - Full leaderboard with all participants ranked
  - Accuracy matrix showing who guessed whom correctly
  - Created `guess_accuracy_stats` materialized view for cross-round tracking
- **Challenge Game Leaderboard**: Top 3 players displayed when round is revealed
  - Added `ChallengeLeaderboardEntry` type and leaderboard state
  - Dark mode compatible styling

## [1.1.0] - 2026-01-15

### Added

#### Submitter Guess Enhancements
- **Poll-style Results**: After submitting a guess, see aggregate guesses from all users
  - Shows percentage bars for each competitor guessed
  - Displays count and percentage (e.g., "Alice 3 (60%)")
- **Locked Guesses**: Guesses are locked after submission - no changing allowed
- **Admin Override**: Admins see ✏️ button to unlock and change their guesses
- **Button renamed**: "Save" → "Submit" to indicate finality
- **Vote Breakdown**: Shows top voter(s) per song after reveal (e.g., "Top voter: Bob (5pts)")

#### History Page
- **TOC Modal**: Table of contents for navigating round history
- **Per-round Voting Patterns**: Display voting breakdown per round
- **Chat Tags**: Round reference tags in chat messages

#### Test Dashboard
- **Historical Data Import**: Generate and import historical season data directly
- **Testing Tab**: New admin tab with test dashboard link and seed button

### Fixed
- Use correct column name `member_id` for admin check in games
- Use correct kebab-case card type strings in HistoryPage
- Deduplicate votes when calculating voting patterns
- Test dashboard submission and round management issues
- Add fallback for crypto.randomUUID in non-secure contexts

## [1.0.1] - 2026-01-14

### Fixed
- CI/CD workflow for production deployment via Cloudflare tunnel

## [1.0.0] - 2026-01-14

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
