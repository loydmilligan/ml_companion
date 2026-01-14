-- ============================================================================
-- SUPABASE DEV SCHEMA
-- Complete schema definition for development database
-- Generated from production schema analysis
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- BASE TABLES (no foreign key dependencies)
-- ============================================================================

-- User profiles (references auth.users from Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  season1_competitor_id TEXT,
  music_league_username TEXT,
  ntfy_topic TEXT,
  chat_notify_enabled BOOLEAN DEFAULT true,
  email_notify_enabled BOOLEAN DEFAULT true,
  can_toggle_chat_notify BOOLEAN DEFAULT true,
  can_toggle_email_notify BOOLEAN DEFAULT true,
  ai_image_traits TEXT,
  dm_notify_enabled BOOLEAN DEFAULT true,
  timeline_game_tester BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Family groups (top-level organizational unit)
CREATE TABLE family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id),
  is_test_group BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- LEVEL 1 TABLES (depend on base tables only)
-- ============================================================================

-- Group settings
CREATE TABLE group_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  round_summary_model_key TEXT,
  round_story_image_model_key TEXT,
  round_theme_image_model_key TEXT,
  awards_model_key TEXT,
  trophy_image_model_key TEXT,
  logo_palette TEXT,
  timeline_game_enabled BOOLEAN DEFAULT false,
  timeline_game_phase TEXT DEFAULT 'voting' CHECK (timeline_game_phase IN ('voting', 'revealed', 'both')),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (group_id)
);

-- Group members (many-to-many relationship)
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('lead', 'member')) NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (group_id, member_id)
);

-- Player connections (relationships between profiles)
CREATE TABLE player_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  source_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (group_id, source_profile_id, target_profile_id, relation_type)
);

-- Invites
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  used_by UUID REFERENCES profiles(id),
  used_at TIMESTAMPTZ
);

-- Group messages (chat)
CREATE TABLE group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Season competitors
CREATE TABLE season_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  external_id TEXT,
  name TEXT NOT NULL,
  profile_id UUID REFERENCES profiles(id),
  ai_image_traits TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Leagues (Music League competitions)
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  season_number INTEGER NOT NULL,
  current_story_intro TEXT,
  current_round_riff TEXT,
  current_minigame_summary TEXT,
  current_story_updated_at TIMESTAMPTZ,
  current_story_round_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  new_rounds BOOLEAN NOT NULL DEFAULT true,
  deadline_reminders BOOLEAN NOT NULL DEFAULT true,
  results_revealed BOOLEAN NOT NULL DEFAULT true,
  comments_on_submissions BOOLEAN NOT NULL DEFAULT true,
  chat_messages BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversations (for DMs)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- LEVEL 2 TABLES (depend on level 1 tables)
-- ============================================================================

-- Add foreign key for leagues.current_story_round_id (will be added after rounds table)
-- This is done at the end to avoid circular dependency

-- Conversation participants
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (conversation_id, participant_id)
);

-- Rounds (competition rounds within leagues)
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  theme TEXT NOT NULL,
  theme_description TEXT,
  theme_author TEXT,
  external_round_id TEXT,
  external_created_at TIMESTAMPTZ,
  external_playlist_url TEXT,
  playlist_url TEXT,
  season_number INTEGER,
  round_number INTEGER,
  status TEXT CHECK (status IN ('open', 'voting', 'revealed', 'archived')) DEFAULT 'open',
  submission_deadline TIMESTAMPTZ,
  voting_deadline TIMESTAMPTZ,
  theme_image_url TEXT,
  winners_image_url TEXT,
  winners_image_visible BOOLEAN DEFAULT true,
  pulltab_image_light_url TEXT,
  pulltab_image_dark_url TEXT,
  reveal_until TIMESTAMPTZ,
  test_reveal_duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Round imports
CREATE TABLE round_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  external_round_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  playlist_url TEXT,
  external_created_at TIMESTAMPTZ,
  round_id UUID REFERENCES rounds(id),
  imported_at TIMESTAMPTZ DEFAULT now()
);

-- Direct messages
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  reply_to_id UUID REFERENCES direct_messages(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- LEVEL 3 TABLES (depend on level 2 tables)
-- ============================================================================

-- Submissions (songs submitted to rounds)
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  submitter_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  album TEXT,
  artist TEXT,
  link TEXT,
  submitter_name TEXT,
  artwork_url TEXT,
  source_uri TEXT,
  external_round_id TEXT,
  external_submitter_id TEXT,
  external_created_at TIMESTAMPTZ,
  external_comment TEXT,
  external_visible_to_voters BOOLEAN,
  release_year INTEGER,
  genres TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Round chats
CREATE TABLE round_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Round user activity
CREATE TABLE round_user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  actor_name TEXT NOT NULL,
  profile_id UUID REFERENCES profiles(id),
  activity_type TEXT CHECK (activity_type IN ('submitted', 'voted')) NOT NULL,
  event_id TEXT,
  action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (round_id, actor_name, activity_type)
);

-- Season round comments
CREATE TABLE season_round_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  round_external_id TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Timeline guesses (minigame)
CREATE TABLE timeline_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  placement_order UUID[] NOT NULL,
  attempt_number INTEGER NOT NULL CHECK (attempt_number IN (1, 2)),
  correct_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (round_id, player_id, attempt_number)
);

-- DM reactions
CREATE TABLE dm_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
  reactor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (message_id, reactor_id, emoji)
);

-- ============================================================================
-- LEVEL 4 TABLES (depend on level 3 tables)
-- ============================================================================

-- Votes (votes on submissions)
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES profiles(id),
  voter_name TEXT,
  voter_external_id TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  comment TEXT,
  external_round_id TEXT,
  external_spotify_uri TEXT,
  external_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Comments (on submissions)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Round awards
CREATE TABLE round_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  award_id INTEGER,
  award_name TEXT NOT NULL,
  award_description TEXT,
  trophy_url TEXT,
  winner_name TEXT,
  winner_profile_id UUID REFERENCES profiles(id),
  winner_submission_id UUID REFERENCES submissions(id),
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- LEVEL 5 TABLES (depend on level 4 tables)
-- ============================================================================

-- Reactions (on comments)
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reactor_id UUID REFERENCES profiles(id),
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ADD CIRCULAR FOREIGN KEY
-- ============================================================================

-- Add the foreign key constraint for leagues.current_story_round_id
-- This was deferred to avoid circular dependency
ALTER TABLE leagues
  ADD CONSTRAINT leagues_current_story_round_id_fkey
  FOREIGN KEY (current_story_round_id)
  REFERENCES rounds(id);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Notification preferences
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Conversations and DMs
CREATE INDEX idx_conversations_group_id ON conversations(group_id);
CREATE INDEX idx_conv_participants_participant ON conversation_participants(participant_id);
CREATE INDEX idx_conv_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_direct_messages_conversation ON direct_messages(conversation_id);
CREATE INDEX idx_direct_messages_created_at ON direct_messages(created_at DESC);
CREATE INDEX idx_dm_reactions_message ON dm_reactions(message_id);

-- Timeline game
CREATE INDEX idx_timeline_guesses_round_player ON timeline_guesses(round_id, player_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN rounds.pulltab_image_light_url IS 'Light mode sidebar pulltab image URL for this round';
COMMENT ON COLUMN rounds.pulltab_image_dark_url IS 'Dark mode sidebar pulltab image URL for this round';
COMMENT ON COLUMN rounds.reveal_until IS 'Timestamp when reveal period ends (set by votes_in processing)';
COMMENT ON COLUMN rounds.test_reveal_duration_minutes IS 'Test override: use this instead of 2 hours for reveal period';
COMMENT ON COLUMN family_groups.is_test_group IS 'True if this is a test group (exclude from production reports)';

-- ============================================================================
-- SCHEMA SUMMARY
-- ============================================================================
-- Total tables: 27
--
-- Base tables (0 FK dependencies):
--   1. profiles
--   2. family_groups
--
-- Level 1 (depend on base):
--   3. group_settings
--   4. group_members
--   5. player_connections
--   6. invites
--   7. group_messages
--   8. season_competitors
--   9. leagues
--  10. notification_preferences
--  11. conversations
--
-- Level 2 (depend on level 1):
--  12. conversation_participants
--  13. rounds
--  14. round_imports
--  15. direct_messages
--
-- Level 3 (depend on level 2):
--  16. submissions
--  17. round_chats
--  18. round_user_activity
--  19. season_round_comments
--  20. timeline_guesses
--  21. dm_reactions
--
-- Level 4 (depend on level 3):
--  22. votes
--  23. comments
--  24. round_awards
--
-- Level 5 (depend on level 4):
--  25. reactions
--
-- ============================================================================
