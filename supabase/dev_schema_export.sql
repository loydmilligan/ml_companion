-- =====================================================
-- TALKING MUSIC LEAGUE - COMPLETE SCHEMA EXPORT
-- Generated from production database via MCP
-- Run this in Supabase SQL Editor for dev project
-- =====================================================

-- =====================================================
-- PART 1: EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PART 2: TABLES (ordered by dependencies)
-- =====================================================
-- NOTE: Helper functions are created AFTER tables exist

-- profiles (references auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  display_name text,
  avatar_url text,
  season1_competitor_id text,
  music_league_username text,
  ntfy_topic text,
  chat_notify_enabled boolean DEFAULT true,
  email_notify_enabled boolean DEFAULT true,
  can_toggle_chat_notify boolean DEFAULT true,
  can_toggle_email_notify boolean DEFAULT true,
  ai_image_traits text,
  reaction_notify_enabled boolean DEFAULT true,
  can_toggle_reaction_notify boolean DEFAULT true,
  can_toggle_push_notify boolean DEFAULT false,
  can_toggle_ntfy_notify boolean DEFAULT false,
  push_notify_enabled boolean DEFAULT false,
  ntfy_notify_enabled boolean DEFAULT false,
  preferred_music_provider text DEFAULT 'spotify'::text CHECK (preferred_music_provider = ANY (ARRAY['spotify'::text, 'apple_music'::text, 'youtube_music'::text])),
  show_youtube_video boolean DEFAULT true,
  timeline_game_tester boolean DEFAULT false,
  dm_notify_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

COMMENT ON COLUMN public.profiles.preferred_music_provider IS 'User preferred music streaming service: spotify, apple_music, or youtube_music';
COMMENT ON COLUMN public.profiles.show_youtube_video IS 'Whether to show YouTube video link alongside music provider link';

-- family_groups
CREATE TABLE IF NOT EXISTS public.family_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES public.profiles(id),
  is_test_group boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

COMMENT ON COLUMN public.family_groups.is_test_group IS 'True if this is a test group (exclude from production reports)';

-- group_members
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.family_groups(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member'::text CHECK (role = ANY (ARRAY['lead'::text, 'member'::text])),
  created_at timestamptz DEFAULT now(),
  UNIQUE (group_id, member_id)
);

-- group_settings
CREATE TABLE IF NOT EXISTS public.group_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid UNIQUE REFERENCES public.family_groups(id) ON DELETE CASCADE,
  round_summary_model_key text,
  round_story_image_model_key text,
  round_theme_image_model_key text,
  awards_model_key text,
  trophy_image_model_key text,
  logo_palette text,
  ai_explain_enabled boolean DEFAULT true,
  ai_validate_enabled boolean DEFAULT true,
  ai_hint_enabled boolean DEFAULT true,
  ai_assistant_enabled boolean DEFAULT true,
  ai_validate_daily_limit integer DEFAULT 5,
  ai_chat_enabled boolean DEFAULT true,
  submitter_guess_enabled boolean DEFAULT true,
  round_challenge_enabled boolean DEFAULT true,
  timeline_game_enabled boolean DEFAULT false,
  timeline_game_phase text DEFAULT 'voting'::text,
  round_challenge_phase text NOT NULL DEFAULT 'open'::text CHECK (round_challenge_phase = ANY (ARRAY['open'::text, 'voting'::text, 'both'::text])),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON COLUMN public.group_settings.submitter_guess_enabled IS 'Enable/disable the Submitter Guess minigame in the peek panel during voting';
COMMENT ON COLUMN public.group_settings.round_challenge_enabled IS 'Enable/disable the Round Challenge minigame in the peek panel';

-- leagues
CREATE TABLE IF NOT EXISTS public.leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.family_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  season_number integer,
  narrative text,
  playlist_url text,
  current_story_intro text,
  current_round_riff text,
  current_minigame_summary text,
  current_story_updated_at timestamptz,
  current_story_round_id uuid,
  preseason_special jsonb,
  created_at timestamptz DEFAULT now()
);

COMMENT ON COLUMN public.leagues.preseason_special IS 'JSON object containing pre-season special card content (opening_monologue, submission_board, taste_tells, theme_fit, timing_energy, predictions, power_rankings)';

-- rounds
CREATE TABLE IF NOT EXISTS public.rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid REFERENCES public.leagues(id) ON DELETE CASCADE,
  theme text NOT NULL,
  theme_description text,
  theme_author text,
  external_round_id text,
  external_created_at timestamptz,
  external_playlist_url text,
  playlist_url text,
  youtube_playlist_url text,
  season_number integer,
  round_number integer,
  status text DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'voting'::text, 'revealed'::text, 'archived'::text])),
  submission_deadline timestamptz,
  voting_deadline timestamptz,
  reveal_until timestamptz,
  theme_image_url text,
  winners_image_url text,
  winners_image_visible boolean DEFAULT true,
  narrative text,
  comment_required boolean DEFAULT false,
  pulltab_image_light_url text,
  pulltab_image_dark_url text,
  test_reveal_duration_minutes integer,
  created_at timestamptz DEFAULT now()
);

COMMENT ON COLUMN public.rounds.reveal_until IS 'Timestamp when reveal period ends (set by votes_in processing)';
COMMENT ON COLUMN public.rounds.pulltab_image_light_url IS 'Light mode sidebar pulltab image URL for this round';
COMMENT ON COLUMN public.rounds.pulltab_image_dark_url IS 'Dark mode sidebar pulltab image URL for this round';
COMMENT ON COLUMN public.rounds.test_reveal_duration_minutes IS 'Test override: use this instead of 2 hours for reveal period';

-- Add FK from leagues to rounds after rounds is created
ALTER TABLE public.leagues ADD CONSTRAINT leagues_current_story_round_id_fkey
  FOREIGN KEY (current_story_round_id) REFERENCES public.rounds(id);

-- submissions
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES public.rounds(id) ON DELETE CASCADE,
  submitter_id uuid REFERENCES public.profiles(id),
  title text NOT NULL,
  artist text,
  link text,
  submitter_name text,
  artwork_url text,
  source_uri text,
  album text,
  external_round_id text,
  external_submitter_id text,
  external_created_at timestamptz,
  external_comment text,
  external_visible_to_voters boolean,
  release_year integer,
  genres text,
  youtube_url text,
  spotify_url text,
  apple_music_url text,
  youtube_music_url text,
  song_link_url text,
  submitter_comment text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON COLUMN public.submissions.youtube_url IS 'Direct YouTube video URL';
COMMENT ON COLUMN public.submissions.spotify_url IS 'Direct Spotify track URL';
COMMENT ON COLUMN public.submissions.apple_music_url IS 'Direct Apple Music track URL';
COMMENT ON COLUMN public.submissions.youtube_music_url IS 'Direct YouTube Music track URL';
COMMENT ON COLUMN public.submissions.song_link_url IS 'Universal song.link page URL';

-- round_awards
CREATE TABLE IF NOT EXISTS public.round_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES public.rounds(id) ON DELETE CASCADE,
  award_id integer,
  award_name text NOT NULL,
  award_description text,
  trophy_url text,
  winner_name text,
  winner_profile_id uuid REFERENCES public.profiles(id),
  winner_submission_id uuid REFERENCES public.submissions(id),
  visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- comments
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id),
  body text NOT NULL,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- reactions
CREATE TABLE IF NOT EXISTS public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  reactor_id uuid REFERENCES public.profiles(id),
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- votes
CREATE TABLE IF NOT EXISTS public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE,
  voter_id uuid REFERENCES public.profiles(id),
  voter_name text,
  points integer NOT NULL DEFAULT 0,
  comment text,
  voter_external_id text,
  external_round_id text,
  external_spotify_uri text,
  external_created_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- invites
CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.family_groups(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  expires_at timestamptz,
  used_by uuid REFERENCES public.profiles(id),
  used_at timestamptz,
  invite_email text,
  email_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- group_messages
CREATE TABLE IF NOT EXISTS public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.family_groups(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id),
  body text NOT NULL,
  reply_to_id uuid REFERENCES public.group_messages(id),
  created_at timestamptz DEFAULT now()
);

-- message_reactions
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
  reactor_id uuid NOT NULL REFERENCES public.profiles(id),
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (message_id, reactor_id, emoji)
);

-- season_competitors
CREATE TABLE IF NOT EXISTS public.season_competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.family_groups(id) ON DELETE CASCADE,
  external_id text,
  name text NOT NULL,
  profile_id uuid REFERENCES public.profiles(id),
  ai_image_traits text,
  email_actor_name text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON COLUMN public.season_competitors.email_actor_name IS 'Actor name from Music League email notifications. Used for matching when name differs from display name.';

-- season_round_comments
CREATE TABLE IF NOT EXISTS public.season_round_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.family_groups(id) ON DELETE CASCADE,
  round_external_id text NOT NULL,
  author_id uuid REFERENCES public.profiles(id),
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- round_imports
CREATE TABLE IF NOT EXISTS public.round_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.family_groups(id) ON DELETE CASCADE,
  league_id uuid REFERENCES public.leagues(id) ON DELETE CASCADE,
  external_round_id text NOT NULL,
  name text NOT NULL,
  description text,
  playlist_url text,
  external_created_at timestamptz,
  round_id uuid REFERENCES public.rounds(id),
  imported_at timestamptz DEFAULT now()
);

-- round_chats
CREATE TABLE IF NOT EXISTS public.round_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES public.rounds(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id),
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- player_connections
CREATE TABLE IF NOT EXISTS public.player_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.family_groups(id) ON DELETE CASCADE,
  source_profile_id uuid REFERENCES public.profiles(id),
  target_profile_id uuid REFERENCES public.profiles(id),
  relation_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- round_challenges (legacy v1)
CREATE TABLE IF NOT EXISTS public.round_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES public.rounds(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.family_groups(id) ON DELETE CASCADE,
  song1_title text,
  song1_artist text,
  song1_spotify_url text,
  song1_youtube_url text,
  song1_correct_theme text,
  song2_title text,
  song2_artist text,
  song2_spotify_url text,
  song2_youtube_url text,
  song2_correct_theme text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- challenge_guesses (legacy v1)
CREATE TABLE IF NOT EXISTS public.challenge_guesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES public.round_challenges(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id),
  song_number integer CHECK (song_number = ANY (ARRAY[1, 2])),
  guessed_theme text NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- challenge_bonus_points
CREATE TABLE IF NOT EXISTS public.challenge_bonus_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES public.rounds(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id),
  points integer DEFAULT 0,
  reason text,
  awarded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- round_ai_cache
CREATE TABLE IF NOT EXISTS public.round_ai_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES public.rounds(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.family_groups(id) ON DELETE CASCADE,
  cache_type text NOT NULL CHECK (cache_type = ANY (ARRAY['explain'::text, 'hint'::text])),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- user_ai_usage
CREATE TABLE IF NOT EXISTS public.user_ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  group_id uuid REFERENCES public.family_groups(id),
  usage_type text NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- push_tokens
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform = ANY (ARRAY['web'::text, 'ios'::text, 'android'::text])),
  device_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

-- notification_preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  new_rounds boolean NOT NULL DEFAULT true,
  deadline_reminders boolean NOT NULL DEFAULT true,
  results_revealed boolean NOT NULL DEFAULT true,
  comments_on_submissions boolean NOT NULL DEFAULT true,
  chat_messages boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ml_email_events
CREATE TABLE IF NOT EXISTS public.ml_email_events (
  id text PRIMARY KEY,
  thread_id text,
  event_type text NOT NULL CHECK (event_type = ANY (ARRAY['round_start'::text, 'playlist_ready'::text, 'votes_in'::text, 'user_submitted'::text, 'user_voted'::text])),
  league_name text NOT NULL,
  round_name text,
  actor_name text,
  playlist_url text,
  from_email text,
  to_email text,
  raw_text text,
  received_at timestamptz,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz DEFAULT now()
);

-- round_user_activity
CREATE TABLE IF NOT EXISTS public.round_user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES public.rounds(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id),
  actor_name text NOT NULL,
  activity_type text NOT NULL CHECK (activity_type = ANY (ARRAY['submitted'::text, 'voted'::text])),
  event_id text,
  action_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- submitter_guesses
CREATE TABLE IF NOT EXISTS public.submitter_guesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES public.rounds(id) ON DELETE CASCADE,
  submission_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE,
  guesser_id uuid REFERENCES public.profiles(id),
  guessed_competitor_id uuid REFERENCES public.season_competitors(id),
  is_correct boolean,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.submitter_guesses IS 'Stores user guesses for who submitted each song during voting phase';

-- timeline_guesses
CREATE TABLE IF NOT EXISTS public.timeline_guesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES public.rounds(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.profiles(id),
  placement_order uuid[] NOT NULL,
  attempt_number integer NOT NULL CHECK (attempt_number = ANY (ARRAY[1, 2])),
  correct_count integer,
  created_at timestamptz DEFAULT now()
);

-- round_challenge_v2
CREATE TABLE IF NOT EXISTS public.round_challenge_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  songs jsonb NOT NULL,
  correct_answers jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round_id, group_id)
);

-- round_challenge_guesses
CREATE TABLE IF NOT EXISTS public.round_challenge_guesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id text NOT NULL,
  guessed_theme_id text NOT NULL,
  is_correct boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round_id, group_id, user_id, song_id)
);

-- conversations (DMs)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- conversation_participants
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.profiles(id),
  last_read_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (conversation_id, participant_id)
);

-- direct_messages
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  body text NOT NULL,
  reply_to_id uuid REFERENCES public.direct_messages(id),
  created_at timestamptz DEFAULT now()
);

-- dm_reactions
CREATE TABLE IF NOT EXISTS public.dm_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  reactor_id uuid NOT NULL REFERENCES public.profiles(id),
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (message_id, reactor_id, emoji)
);

-- test_runs
CREATE TABLE IF NOT EXISTS public.test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running'::text CHECK (status = ANY (ARRAY['running'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
  league_id uuid REFERENCES public.leagues(id),
  round_id uuid REFERENCES public.rounds(id),
  theme text,
  total_actions integer DEFAULT 0,
  successful_actions integer DEFAULT 0,
  failed_actions integer DEFAULT 0,
  duration_ms integer,
  reveal_duration_minutes integer,
  user_count integer,
  last_error text,
  error_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- test_actions
CREATE TABLE IF NOT EXISTS public.test_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id uuid NOT NULL REFERENCES public.test_runs(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_params jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  success boolean,
  result jsonb,
  error text,
  sequence_number integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- test_daily_stats
CREATE TABLE IF NOT EXISTS public.test_daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  total_runs integer DEFAULT 0,
  completed_runs integer DEFAULT 0,
  failed_runs integer DEFAULT 0,
  total_actions integer DEFAULT 0,
  successful_actions integer DEFAULT 0,
  failed_actions integer DEFAULT 0,
  avg_run_duration_ms integer,
  avg_action_duration_ms integer,
  action_type_counts jsonb DEFAULT '{}'::jsonb,
  error_counts jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- round_challenge_admin_picks
CREATE TABLE IF NOT EXISTS public.round_challenge_admin_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_round_id uuid NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  source_round_id uuid NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  theme_id text NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE (target_round_id, submission_id)
);

COMMENT ON TABLE public.round_challenge_admin_picks IS 'Admin-selected songs from previous S2 rounds for the Round Challenge game. Songs are assigned to S1 themes.';
COMMENT ON COLUMN public.round_challenge_admin_picks.target_round_id IS 'The round where this game will be played (e.g., Round 2)';
COMMENT ON COLUMN public.round_challenge_admin_picks.source_round_id IS 'The round the songs come from (e.g., Round 1)';
COMMENT ON COLUMN public.round_challenge_admin_picks.theme_id IS 'Season 1 theme ID from the categories in round_challenge_song_list.json';

-- =====================================================
-- PART 3: HELPER FUNCTIONS (needed for RLS policies)
-- =====================================================
-- These are created AFTER tables exist

CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM group_members
    WHERE group_id = p_group_id
      AND member_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_owner(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM family_groups
    WHERE id = p_group_id
      AND owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conv_id AND participant_id = user_id
  );
$$;

-- =====================================================
-- PART 4: ADDITIONAL INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_group_messages_reply_to ON public.group_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_conversations_group_id ON public.conversations(group_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conversation ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_participant ON public.conversation_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON public.direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_reactions_message ON public.dm_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON public.push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_last_used ON public.push_tokens(last_used_at);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS ml_email_events_created_at_idx ON public.ml_email_events(created_at DESC);
CREATE INDEX IF NOT EXISTS ml_email_events_event_type_idx ON public.ml_email_events(event_type);
CREATE INDEX IF NOT EXISTS ml_email_events_league_name_idx ON public.ml_email_events(league_name);
CREATE INDEX IF NOT EXISTS ml_email_events_processed_at_idx ON public.ml_email_events(processed_at);
CREATE INDEX IF NOT EXISTS round_user_activity_round_id_idx ON public.round_user_activity(round_id);
CREATE INDEX IF NOT EXISTS round_user_activity_activity_type_idx ON public.round_user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_submitter_guesses_round ON public.submitter_guesses(round_id);
CREATE INDEX IF NOT EXISTS idx_submitter_guesses_guesser ON public.submitter_guesses(guesser_id);
CREATE INDEX IF NOT EXISTS idx_timeline_guesses_round_player ON public.timeline_guesses(round_id, player_id);
CREATE INDEX IF NOT EXISTS idx_round_challenge_v2_round_group ON public.round_challenge_v2(round_id, group_id);
CREATE INDEX IF NOT EXISTS idx_round_challenge_guesses_round_user ON public.round_challenge_guesses(round_id, group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_status ON public.test_runs(status);
CREATE INDEX IF NOT EXISTS idx_test_runs_started_at ON public.test_runs(started_at);
CREATE INDEX IF NOT EXISTS idx_test_runs_league ON public.test_runs(league_id);
CREATE INDEX IF NOT EXISTS idx_test_actions_run ON public.test_actions(test_run_id);
CREATE INDEX IF NOT EXISTS idx_test_actions_type ON public.test_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_test_daily_stats_date ON public.test_daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_round_challenge_admin_picks_target ON public.round_challenge_admin_picks(target_round_id);
CREATE INDEX IF NOT EXISTS idx_season_competitors_email_actor_name ON public.season_competitors(group_id, email_actor_name);

-- Unique indexes for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS leagues_group_season_unique ON public.leagues(group_id, season_number);
CREATE UNIQUE INDEX IF NOT EXISTS rounds_league_external_unique ON public.rounds(league_id, external_round_id);
CREATE UNIQUE INDEX IF NOT EXISTS submissions_round_source_unique ON public.submissions(round_id, source_uri);
CREATE UNIQUE INDEX IF NOT EXISTS votes_submission_voter_external_unique ON public.votes(submission_id, voter_external_id);
CREATE UNIQUE INDEX IF NOT EXISTS round_imports_group_external_unique ON public.round_imports(league_id, external_round_id);
CREATE UNIQUE INDEX IF NOT EXISTS player_connections_unique ON public.player_connections(group_id, source_profile_id, target_profile_id, relation_type);
CREATE UNIQUE INDEX IF NOT EXISTS round_ai_cache_unique ON public.round_ai_cache(round_id, group_id, cache_type);
CREATE UNIQUE INDEX IF NOT EXISTS user_ai_usage_unique ON public.user_ai_usage(user_id, group_id, usage_type, usage_date);
CREATE UNIQUE INDEX IF NOT EXISTS challenge_guesses_unique ON public.challenge_guesses(challenge_id, user_id, song_number);
CREATE UNIQUE INDEX IF NOT EXISTS round_awards_round_award_unique ON public.round_awards(round_id, award_id);
CREATE UNIQUE INDEX IF NOT EXISTS round_user_activity_round_id_actor_name_activity_type_key ON public.round_user_activity(round_id, actor_name, activity_type);
CREATE UNIQUE INDEX IF NOT EXISTS submitter_guesses_round_id_submission_id_guesser_id_key ON public.submitter_guesses(round_id, submission_id, guesser_id);
CREATE UNIQUE INDEX IF NOT EXISTS timeline_guesses_round_id_player_id_attempt_number_key ON public.timeline_guesses(round_id, player_id, attempt_number);
CREATE UNIQUE INDEX IF NOT EXISTS season_competitors_group_external_unique ON public.season_competitors(group_id, external_id);

-- =====================================================
-- PART 5: ADDITIONAL FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.accept_invite(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite invites%rowtype;
BEGIN
  SELECT * INTO v_invite FROM invites WHERE code = p_code;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  IF v_invite.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invite already used';
  END IF;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'Invite expired';
  END IF;

  INSERT INTO group_members (group_id, member_id, role)
  VALUES (v_invite.group_id, auth.uid(), 'member')
  ON CONFLICT DO NOTHING;

  UPDATE invites
  SET used_by = auth.uid(), used_at = now()
  WHERE id = v_invite.id;

  RETURN jsonb_build_object('group_id', v_invite.group_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_dm_conversation(p_group_id uuid, p_other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
  v_current_user_id UUID;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND member_id = v_current_user_id
  ) THEN
    RAISE EXCEPTION 'User not in group';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND member_id = p_other_user_id
  ) THEN
    RAISE EXCEPTION 'Other user not in group';
  END IF;

  SELECT c.id INTO v_conversation_id
  FROM conversations c
  JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.participant_id = v_current_user_id
  JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.participant_id = p_other_user_id
  WHERE c.group_id = p_group_id
  AND (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) = 2
  LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  INSERT INTO conversations (group_id, created_by)
  VALUES (p_group_id, v_current_user_id)
  RETURNING id INTO v_conversation_id;

  INSERT INTO conversation_participants (conversation_id, participant_id)
  VALUES
    (v_conversation_id, v_current_user_id),
    (v_conversation_id, p_other_user_id);

  RETURN v_conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_dm_conversation(user1_id uuid, user2_id uuid, p_group_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conv_id UUID;
BEGIN
  SELECT c.id INTO conv_id
  FROM conversations c
  JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.participant_id = user1_id
  JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.participant_id = user2_id
  WHERE c.group_id = p_group_id
  AND (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) = 2
  LIMIT 1;

  RETURN conv_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dm_unread_counts(p_user_id uuid)
RETURNS TABLE(conversation_id uuid, unread_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.conversation_id,
    COUNT(dm.id)::BIGINT as unread_count
  FROM conversation_participants cp
  LEFT JOIN direct_messages dm ON dm.conversation_id = cp.conversation_id
    AND dm.created_at > cp.last_read_at
    AND dm.author_id != cp.participant_id
  WHERE cp.participant_id = p_user_id
  GROUP BY cp.conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id uuid, p_group_id uuid, p_usage_type text, p_usage_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_ai_usage (user_id, group_id, usage_type, usage_date, count)
  VALUES (p_user_id, p_group_id, p_usage_type, p_usage_date, 1)
  ON CONFLICT (user_id, group_id, usage_type, usage_date)
  DO UPDATE SET count = user_ai_usage.count + 1;
END;
$$;

-- Trigger function for updating guess correctness
CREATE OR REPLACE FUNCTION public.update_guess_correctness()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'revealed' AND (OLD.status IS NULL OR OLD.status != 'revealed') THEN
    UPDATE submitter_guesses sg
    SET is_correct = (
      sg.guessed_competitor_id = (
        SELECT sc.id
        FROM submissions s
        JOIN season_competitors sc ON (
          (s.submitter_id IS NOT NULL AND sc.profile_id = s.submitter_id)
          OR (s.submitter_name IS NOT NULL AND LOWER(sc.name) = LOWER(s.submitter_name))
        )
        WHERE s.id = sg.submission_id
        LIMIT 1
      )
    )
    WHERE sg.round_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger function for test daily stats
CREATE OR REPLACE FUNCTION public.update_test_daily_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO test_daily_stats (date, total_runs, completed_runs, failed_runs)
  VALUES (
    DATE(NEW.completed_at),
    1,
    CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END
  )
  ON CONFLICT (date) DO UPDATE SET
    total_runs = test_daily_stats.total_runs + 1,
    completed_runs = test_daily_stats.completed_runs + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    failed_runs = test_daily_stats.failed_runs + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- =====================================================
-- PART 6: TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_guess_correctness_trigger ON public.rounds;
CREATE TRIGGER update_guess_correctness_trigger
  AFTER UPDATE ON public.rounds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_guess_correctness();

DROP TRIGGER IF EXISTS update_test_daily_stats_trigger ON public.test_runs;
CREATE TRIGGER update_test_daily_stats_trigger
  AFTER UPDATE ON public.test_runs
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL)
  EXECUTE FUNCTION public.update_test_daily_stats();

-- =====================================================
-- PART 7: ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_round_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submitter_guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_challenge_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_challenge_guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_challenge_admin_picks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 8: RLS POLICIES
-- =====================================================

-- profiles policies
CREATE POLICY "Profiles viewable by group members" ON public.profiles FOR SELECT
  USING ((id = auth.uid()) OR (EXISTS ( SELECT 1 FROM group_members gm WHERE ((gm.member_id = profiles.id) AND is_group_member(gm.group_id)))));
CREATE POLICY "Profiles insert own" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Profiles update own" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Profiles update by owner" ON public.profiles FOR UPDATE
  USING (EXISTS ( SELECT 1 FROM (group_members gm JOIN family_groups fg ON ((fg.id = gm.group_id))) WHERE ((gm.member_id = profiles.id) AND (fg.owner_id = auth.uid()))));

-- family_groups policies
CREATE POLICY "Family groups viewable by members" ON public.family_groups FOR SELECT
  USING ((owner_id = auth.uid()) OR is_group_member(id));
CREATE POLICY "Family groups insert by owner" ON public.family_groups FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Family groups update by owner" ON public.family_groups FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Family groups delete by owner" ON public.family_groups FOR DELETE USING (owner_id = auth.uid());

-- group_members policies
CREATE POLICY "Group members viewable by members" ON public.group_members FOR SELECT
  USING ((member_id = auth.uid()) OR is_group_member(group_id));
CREATE POLICY "Group members managed by owner" ON public.group_members FOR INSERT
  WITH CHECK (EXISTS ( SELECT 1 FROM family_groups fg WHERE ((fg.id = group_members.group_id) AND (fg.owner_id = auth.uid()))));
CREATE POLICY "Group members update by owner" ON public.group_members FOR UPDATE
  USING (EXISTS ( SELECT 1 FROM family_groups fg WHERE ((fg.id = group_members.group_id) AND (fg.owner_id = auth.uid()))));
CREATE POLICY "Group members delete by owner" ON public.group_members FOR DELETE
  USING (EXISTS ( SELECT 1 FROM family_groups fg WHERE ((fg.id = group_members.group_id) AND (fg.owner_id = auth.uid()))));

-- group_settings policies
CREATE POLICY "Group settings viewable by members" ON public.group_settings FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "Group settings insert by owner" ON public.group_settings FOR INSERT WITH CHECK (is_group_owner(group_id));
CREATE POLICY "Group settings update by owner" ON public.group_settings FOR UPDATE USING (is_group_owner(group_id));
CREATE POLICY "Group settings delete by owner" ON public.group_settings FOR DELETE USING (is_group_owner(group_id));

-- leagues policies
CREATE POLICY "Leagues viewable by group members" ON public.leagues FOR SELECT
  USING (EXISTS ( SELECT 1 FROM group_members gm WHERE ((gm.group_id = leagues.group_id) AND (gm.member_id = auth.uid()))));
CREATE POLICY "Leagues managed by owner" ON public.leagues FOR INSERT WITH CHECK (is_group_owner(group_id));
CREATE POLICY "Leagues update by owner" ON public.leagues FOR UPDATE USING (is_group_owner(group_id));
CREATE POLICY "Leagues delete by owner" ON public.leagues FOR DELETE USING (is_group_owner(group_id));

-- rounds policies
CREATE POLICY "Rounds viewable by group members" ON public.rounds FOR SELECT
  USING (EXISTS ( SELECT 1 FROM (leagues l JOIN group_members gm ON ((gm.group_id = l.group_id))) WHERE ((l.id = rounds.league_id) AND (gm.member_id = auth.uid()))));
CREATE POLICY "Rounds managed by owner" ON public.rounds FOR INSERT
  WITH CHECK (EXISTS ( SELECT 1 FROM leagues l WHERE ((l.id = rounds.league_id) AND is_group_owner(l.group_id))));
CREATE POLICY "Rounds update by owner" ON public.rounds FOR UPDATE
  USING (EXISTS ( SELECT 1 FROM leagues l WHERE ((l.id = rounds.league_id) AND is_group_owner(l.group_id))));
CREATE POLICY "Rounds delete by owner" ON public.rounds FOR DELETE
  USING (EXISTS ( SELECT 1 FROM leagues l WHERE ((l.id = rounds.league_id) AND is_group_owner(l.group_id))));

-- submissions policies
CREATE POLICY "Submissions viewable by group members" ON public.submissions FOR SELECT
  USING (EXISTS ( SELECT 1 FROM ((rounds r JOIN leagues l ON ((l.id = r.league_id))) JOIN group_members gm ON ((gm.group_id = l.group_id))) WHERE ((r.id = submissions.round_id) AND (gm.member_id = auth.uid()))));
CREATE POLICY "Submissions insert by members" ON public.submissions FOR INSERT
  WITH CHECK (EXISTS ( SELECT 1 FROM (rounds r JOIN leagues l ON ((l.id = r.league_id))) WHERE ((r.id = submissions.round_id) AND is_group_owner(l.group_id))));
CREATE POLICY "Submissions update by owner" ON public.submissions FOR UPDATE
  USING (EXISTS ( SELECT 1 FROM (rounds r JOIN leagues l ON ((l.id = r.league_id))) WHERE ((r.id = submissions.round_id) AND is_group_owner(l.group_id))));
CREATE POLICY "Submissions delete by owner" ON public.submissions FOR DELETE
  USING (EXISTS ( SELECT 1 FROM (rounds r JOIN leagues l ON ((l.id = r.league_id))) WHERE ((r.id = submissions.round_id) AND is_group_owner(l.group_id))));

-- comments policies
CREATE POLICY "Comments viewable by group members" ON public.comments FOR SELECT
  USING (EXISTS ( SELECT 1 FROM (((submissions s JOIN rounds r ON ((r.id = s.round_id))) JOIN leagues l ON ((l.id = r.league_id))) JOIN group_members gm ON ((gm.group_id = l.group_id))) WHERE ((s.id = comments.submission_id) AND (gm.member_id = auth.uid()))));
CREATE POLICY "Comments insert by members" ON public.comments FOR INSERT
  WITH CHECK (EXISTS ( SELECT 1 FROM (((submissions s JOIN rounds r ON ((r.id = s.round_id))) JOIN leagues l ON ((l.id = r.league_id))) JOIN group_members gm ON ((gm.group_id = l.group_id))) WHERE ((s.id = comments.submission_id) AND (gm.member_id = auth.uid()))));
CREATE POLICY "Comments update by owner" ON public.comments FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Comments delete by owner" ON public.comments FOR DELETE USING (author_id = auth.uid());

-- reactions policies
CREATE POLICY "Reactions viewable by group members" ON public.reactions FOR SELECT
  USING (EXISTS ( SELECT 1 FROM ((((comments c JOIN submissions s ON ((s.id = c.submission_id))) JOIN rounds r ON ((r.id = s.round_id))) JOIN leagues l ON ((l.id = r.league_id))) JOIN group_members gm ON ((gm.group_id = l.group_id))) WHERE ((c.id = reactions.comment_id) AND (gm.member_id = auth.uid()))));
CREATE POLICY "Reactions insert by members" ON public.reactions FOR INSERT
  WITH CHECK (EXISTS ( SELECT 1 FROM ((((comments c JOIN submissions s ON ((s.id = c.submission_id))) JOIN rounds r ON ((r.id = s.round_id))) JOIN leagues l ON ((l.id = r.league_id))) JOIN group_members gm ON ((gm.group_id = l.group_id))) WHERE ((c.id = reactions.comment_id) AND (gm.member_id = auth.uid()))));
CREATE POLICY "Reactions delete by owner" ON public.reactions FOR DELETE USING (reactor_id = auth.uid());

-- votes policies
CREATE POLICY "Votes viewable by group members" ON public.votes FOR SELECT
  USING (EXISTS ( SELECT 1 FROM (((submissions s JOIN rounds r ON ((r.id = s.round_id))) JOIN leagues l ON ((l.id = r.league_id))) JOIN group_members gm ON ((gm.group_id = l.group_id))) WHERE ((s.id = votes.submission_id) AND (gm.member_id = auth.uid()))));
CREATE POLICY "Votes insert by members" ON public.votes FOR INSERT
  WITH CHECK (EXISTS ( SELECT 1 FROM ((submissions s JOIN rounds r ON ((r.id = s.round_id))) JOIN leagues l ON ((l.id = r.league_id))) WHERE ((s.id = votes.submission_id) AND is_group_owner(l.group_id))));
CREATE POLICY "Votes update by voter" ON public.votes FOR UPDATE
  USING ((voter_id = auth.uid()) OR is_group_owner(( SELECT l.group_id FROM ((submissions s JOIN rounds r ON ((r.id = s.round_id))) JOIN leagues l ON ((l.id = r.league_id))) WHERE (s.id = votes.submission_id) LIMIT 1)));
CREATE POLICY "Votes delete by voter" ON public.votes FOR DELETE
  USING ((voter_id = auth.uid()) OR is_group_owner(( SELECT l.group_id FROM ((submissions s JOIN rounds r ON ((r.id = s.round_id))) JOIN leagues l ON ((l.id = r.league_id))) WHERE (s.id = votes.submission_id) LIMIT 1)));

-- invites policies
CREATE POLICY "Invites viewable by group members" ON public.invites FOR SELECT
  USING (is_group_member(group_id) OR (created_by = auth.uid()));
CREATE POLICY "Invites managed by owner" ON public.invites FOR INSERT
  WITH CHECK (EXISTS ( SELECT 1 FROM family_groups fg WHERE ((fg.id = invites.group_id) AND (fg.owner_id = auth.uid()))));

-- group_messages policies
CREATE POLICY "Group messages viewable by members" ON public.group_messages FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "Group messages insert by members" ON public.group_messages FOR INSERT WITH CHECK (is_group_member(group_id));
CREATE POLICY "Group messages update by author" ON public.group_messages FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Group messages delete by author" ON public.group_messages FOR DELETE USING (author_id = auth.uid());

-- message_reactions policies
CREATE POLICY "Users can view reactions in their groups" ON public.message_reactions FOR SELECT
  USING (EXISTS ( SELECT 1 FROM (group_messages gm JOIN group_members mem ON ((mem.group_id = gm.group_id))) WHERE ((gm.id = message_reactions.message_id) AND (mem.member_id = auth.uid()))));
CREATE POLICY "Users can add reactions in their groups" ON public.message_reactions FOR INSERT
  WITH CHECK ((reactor_id = auth.uid()) AND (EXISTS ( SELECT 1 FROM (group_messages gm JOIN group_members mem ON ((mem.group_id = gm.group_id))) WHERE ((gm.id = message_reactions.message_id) AND (mem.member_id = auth.uid())))));
CREATE POLICY "Users can delete own reactions" ON public.message_reactions FOR DELETE USING (reactor_id = auth.uid());

-- season_competitors policies
CREATE POLICY "Season competitors viewable by members" ON public.season_competitors FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "Season competitors managed by owner" ON public.season_competitors FOR INSERT WITH CHECK (is_group_owner(group_id));
CREATE POLICY "Season competitors update by owner" ON public.season_competitors FOR UPDATE USING (is_group_owner(group_id));
CREATE POLICY "Season competitors delete by owner" ON public.season_competitors FOR DELETE USING (is_group_owner(group_id));

-- season_round_comments policies
CREATE POLICY "Season round comments viewable by members" ON public.season_round_comments FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "Season round comments insert by members" ON public.season_round_comments FOR INSERT WITH CHECK (is_group_member(group_id));
CREATE POLICY "Season round comments update by author" ON public.season_round_comments FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Season round comments delete by author" ON public.season_round_comments FOR DELETE USING (author_id = auth.uid());

-- round_imports policies
CREATE POLICY "Round imports viewable by owner" ON public.round_imports FOR SELECT USING (is_group_owner(group_id));
CREATE POLICY "Round imports insert by owner" ON public.round_imports FOR INSERT WITH CHECK (is_group_owner(group_id));
CREATE POLICY "Round imports update by owner" ON public.round_imports FOR UPDATE USING (is_group_owner(group_id));
CREATE POLICY "Round imports delete by owner" ON public.round_imports FOR DELETE USING (is_group_owner(group_id));

-- round_chats policies
CREATE POLICY "Round chats viewable by members" ON public.round_chats FOR SELECT
  USING (EXISTS ( SELECT 1 FROM ((rounds r JOIN leagues l ON ((l.id = r.league_id))) JOIN group_members gm ON ((gm.group_id = l.group_id))) WHERE ((r.id = round_chats.round_id) AND (gm.member_id = auth.uid()))));
CREATE POLICY "Round chats insert by members" ON public.round_chats FOR INSERT
  WITH CHECK (EXISTS ( SELECT 1 FROM ((rounds r JOIN leagues l ON ((l.id = r.league_id))) JOIN group_members gm ON ((gm.group_id = l.group_id))) WHERE ((r.id = round_chats.round_id) AND (gm.member_id = auth.uid()))));
CREATE POLICY "Round chats update by author" ON public.round_chats FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Round chats delete by author" ON public.round_chats FOR DELETE USING (author_id = auth.uid());

-- round_awards policies
CREATE POLICY "Round awards viewable by group members" ON public.round_awards FOR SELECT
  USING (EXISTS ( SELECT 1 FROM ((rounds r JOIN leagues l ON ((l.id = r.league_id))) JOIN group_members gm ON ((gm.group_id = l.group_id))) WHERE ((r.id = round_awards.round_id) AND (gm.member_id = auth.uid()))));
CREATE POLICY "Round awards insert by owner" ON public.round_awards FOR INSERT
  WITH CHECK (EXISTS ( SELECT 1 FROM (rounds r JOIN leagues l ON ((l.id = r.league_id))) WHERE ((r.id = round_awards.round_id) AND is_group_owner(l.group_id))));
CREATE POLICY "Round awards update by owner" ON public.round_awards FOR UPDATE
  USING (EXISTS ( SELECT 1 FROM (rounds r JOIN leagues l ON ((l.id = r.league_id))) WHERE ((r.id = round_awards.round_id) AND is_group_owner(l.group_id))));
CREATE POLICY "Round awards delete by owner" ON public.round_awards FOR DELETE
  USING (EXISTS ( SELECT 1 FROM (rounds r JOIN leagues l ON ((l.id = r.league_id))) WHERE ((r.id = round_awards.round_id) AND is_group_owner(l.group_id))));

-- player_connections policies
CREATE POLICY "Player connections viewable by owner" ON public.player_connections FOR SELECT USING (is_group_owner(group_id));
CREATE POLICY "Player connections insert by owner" ON public.player_connections FOR INSERT WITH CHECK (is_group_owner(group_id));
CREATE POLICY "Player connections update by owner" ON public.player_connections FOR UPDATE USING (is_group_owner(group_id));
CREATE POLICY "Player connections delete by owner" ON public.player_connections FOR DELETE USING (is_group_owner(group_id));

-- push_tokens policies
CREATE POLICY "Users can view own push tokens" ON public.push_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own push tokens" ON public.push_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own push tokens" ON public.push_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own push tokens" ON public.push_tokens FOR DELETE USING (auth.uid() = user_id);

-- notification_preferences policies
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- ml_email_events policies
CREATE POLICY "Authenticated users can read email events" ON public.ml_email_events FOR SELECT TO authenticated USING (true);

-- round_user_activity policies
CREATE POLICY "Authenticated users can read activity" ON public.round_user_activity FOR SELECT TO authenticated USING (true);
CREATE POLICY "Group members can view round activity" ON public.round_user_activity FOR SELECT
  USING (EXISTS ( SELECT 1 FROM ((rounds r JOIN leagues l ON ((r.league_id = l.id))) JOIN group_members gm ON ((l.group_id = gm.group_id))) WHERE ((r.id = round_user_activity.round_id) AND (gm.member_id = auth.uid()))));
CREATE POLICY "Group leads can insert round activity" ON public.round_user_activity FOR INSERT
  WITH CHECK (EXISTS ( SELECT 1 FROM ((rounds r JOIN leagues l ON ((r.league_id = l.id))) JOIN group_members gm ON ((l.group_id = gm.group_id))) WHERE ((r.id = round_user_activity.round_id) AND (gm.member_id = auth.uid()) AND (gm.role = 'lead'::text))));
CREATE POLICY "Group leads can update round activity" ON public.round_user_activity FOR UPDATE
  USING (EXISTS ( SELECT 1 FROM ((rounds r JOIN leagues l ON ((r.league_id = l.id))) JOIN group_members gm ON ((l.group_id = gm.group_id))) WHERE ((r.id = round_user_activity.round_id) AND (gm.member_id = auth.uid()) AND (gm.role = 'lead'::text))));
CREATE POLICY "Group leads can delete round activity" ON public.round_user_activity FOR DELETE
  USING (EXISTS ( SELECT 1 FROM ((rounds r JOIN leagues l ON ((r.league_id = l.id))) JOIN group_members gm ON ((l.group_id = gm.group_id))) WHERE ((r.id = round_user_activity.round_id) AND (gm.member_id = auth.uid()) AND (gm.role = 'lead'::text))));
CREATE POLICY "Service role can insert activity" ON public.round_user_activity FOR INSERT TO service_role WITH CHECK (true);

-- submitter_guesses policies
CREATE POLICY "Users can view own guesses" ON public.submitter_guesses FOR SELECT USING (auth.uid() = guesser_id);
CREATE POLICY "Users can read their own guesses" ON public.submitter_guesses FOR SELECT TO authenticated USING (guesser_id = auth.uid());
CREATE POLICY "Users can read all guesses after round revealed" ON public.submitter_guesses FOR SELECT TO authenticated
  USING (EXISTS ( SELECT 1 FROM rounds r WHERE ((r.id = submitter_guesses.round_id) AND (r.status = 'revealed'::text))));
CREATE POLICY "Users can insert own guesses" ON public.submitter_guesses FOR INSERT WITH CHECK (auth.uid() = guesser_id);
CREATE POLICY "Users can insert their own guesses" ON public.submitter_guesses FOR INSERT TO authenticated WITH CHECK (guesser_id = auth.uid());
CREATE POLICY "Users can update own guesses" ON public.submitter_guesses FOR UPDATE USING (auth.uid() = guesser_id);

-- timeline_guesses policies
CREATE POLICY "Users can view their own guesses" ON public.timeline_guesses FOR SELECT USING (player_id = auth.uid());
CREATE POLICY "Users can view all guesses after round revealed" ON public.timeline_guesses FOR SELECT
  USING (EXISTS ( SELECT 1 FROM rounds WHERE ((rounds.id = timeline_guesses.round_id) AND (rounds.status = 'revealed'::text))));
CREATE POLICY "Users can insert their own guesses" ON public.timeline_guesses FOR INSERT WITH CHECK (player_id = auth.uid());
CREATE POLICY "Users can delete their own guesses" ON public.timeline_guesses FOR DELETE USING (player_id = auth.uid());
CREATE POLICY "Group leads can delete guesses" ON public.timeline_guesses FOR DELETE
  USING (EXISTS ( SELECT 1 FROM ((rounds r JOIN leagues l ON ((l.id = r.league_id))) JOIN group_members gm ON ((gm.group_id = l.group_id))) WHERE ((r.id = timeline_guesses.round_id) AND (gm.member_id = auth.uid()) AND (gm.role = 'lead'::text))));

-- round_challenge_v2 policies
CREATE POLICY "Users can view challenges for their groups" ON public.round_challenge_v2 FOR SELECT TO authenticated
  USING (group_id IN ( SELECT group_members.group_id FROM group_members WHERE (group_members.member_id = auth.uid())));
CREATE POLICY "Users can insert challenges for their groups" ON public.round_challenge_v2 FOR INSERT TO authenticated
  WITH CHECK (group_id IN ( SELECT group_members.group_id FROM group_members WHERE (group_members.member_id = auth.uid())));

-- round_challenge_guesses policies
CREATE POLICY "Users can view their own guesses" ON public.round_challenge_guesses FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own guesses" ON public.round_challenge_guesses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- conversations policies
CREATE POLICY "Users can view conversations they participate in" ON public.conversations FOR SELECT
  USING (EXISTS ( SELECT 1 FROM conversation_participants WHERE ((conversation_participants.conversation_id = conversations.id) AND (conversation_participants.participant_id = auth.uid()))));
CREATE POLICY "Users can create conversations in their group" ON public.conversations FOR INSERT
  WITH CHECK ((created_by = auth.uid()) AND (EXISTS ( SELECT 1 FROM group_members WHERE ((group_members.group_id = conversations.group_id) AND (group_members.member_id = auth.uid())))));

-- conversation_participants policies
CREATE POLICY "Users can view participants of their conversations" ON public.conversation_participants FOR SELECT
  USING (is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "Users can add participants to conversations they created" ON public.conversation_participants FOR INSERT
  WITH CHECK ((EXISTS ( SELECT 1 FROM conversations c WHERE ((c.id = conversation_participants.conversation_id) AND (c.created_by = auth.uid())))) OR (participant_id = auth.uid()));
CREATE POLICY "Users can update their own participation" ON public.conversation_participants FOR UPDATE USING (participant_id = auth.uid());

-- direct_messages policies
CREATE POLICY "Users can view messages in their conversations" ON public.direct_messages FOR SELECT
  USING (EXISTS ( SELECT 1 FROM conversation_participants WHERE ((conversation_participants.conversation_id = direct_messages.conversation_id) AND (conversation_participants.participant_id = auth.uid()))));
CREATE POLICY "Users can send messages to their conversations" ON public.direct_messages FOR INSERT
  WITH CHECK ((author_id = auth.uid()) AND (EXISTS ( SELECT 1 FROM conversation_participants WHERE ((conversation_participants.conversation_id = direct_messages.conversation_id) AND (conversation_participants.participant_id = auth.uid())))));

-- dm_reactions policies
CREATE POLICY "Users can view reactions in their conversations" ON public.dm_reactions FOR SELECT
  USING (EXISTS ( SELECT 1 FROM (direct_messages dm JOIN conversation_participants cp ON ((cp.conversation_id = dm.conversation_id))) WHERE ((dm.id = dm_reactions.message_id) AND (cp.participant_id = auth.uid()))));
CREATE POLICY "Users can add reactions to messages in their conversations" ON public.dm_reactions FOR INSERT
  WITH CHECK ((reactor_id = auth.uid()) AND (EXISTS ( SELECT 1 FROM (direct_messages dm JOIN conversation_participants cp ON ((cp.conversation_id = dm.conversation_id))) WHERE ((dm.id = dm_reactions.message_id) AND (cp.participant_id = auth.uid())))));
CREATE POLICY "Users can delete their own reactions" ON public.dm_reactions FOR DELETE USING (reactor_id = auth.uid());

-- test tables policies (permissive for testing)
CREATE POLICY "test_runs_all" ON public.test_runs FOR ALL USING (true);
CREATE POLICY "test_actions_all" ON public.test_actions FOR ALL USING (true);
CREATE POLICY "test_daily_stats_all" ON public.test_daily_stats FOR ALL USING (true);

-- round_challenge_admin_picks policies
CREATE POLICY "Users can read admin picks" ON public.round_challenge_admin_picks FOR SELECT USING (true);
CREATE POLICY "Admins can manage picks" ON public.round_challenge_admin_picks FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- PART 9: REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

-- =====================================================
-- SCHEMA EXPORT COMPLETE
-- =====================================================
