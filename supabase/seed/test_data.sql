-- TEST-001: Test Environment Seed Data
-- This file contains all test data for the automated test environment
-- Run via: supabase/functions/seed-test-data/index.ts edge function
--
-- NOTE: profiles table references auth.users(id), so auth users must be
-- created FIRST using the Supabase Admin API (service role) in the edge function.
-- This file assumes the auth.users entries already exist with matching UUIDs.

-- ============================================================================
-- PREDICTABLE TEST UUIDs (use these throughout test data)
-- ============================================================================
-- Test Users:
--   Admin:  00000000-0000-0000-0000-000000000001
--   Alice:  00000000-0000-0000-0000-000000000002
--   Bob:    00000000-0000-0000-0000-000000000003
--   Carol:  00000000-0000-0000-0000-000000000004
--   Dave:   00000000-0000-0000-0000-000000000005
--
-- Test Group: 00000000-0000-0000-0001-000000000001
-- Historical Season (League): 00000000-0000-0000-0002-000000000001
-- Current Season (League):    00000000-0000-0000-0002-000000000002

-- ============================================================================
-- SECTION 1: PROFILES (Test Users)
-- ============================================================================
-- These are inserted AFTER auth.users are created by the edge function

INSERT INTO profiles (
  id,
  email,
  display_name,
  avatar_url,
  season1_competitor_id,
  music_league_username,
  ai_image_traits,
  ntfy_topic,
  chat_notify_enabled,
  email_notify_enabled,
  can_toggle_chat_notify,
  can_toggle_email_notify,
  reaction_notify_enabled,
  can_toggle_reaction_notify,
  push_notify_enabled,
  ntfy_notify_enabled,
  can_toggle_push_notify,
  can_toggle_ntfy_notify,
  preferred_music_provider,
  show_youtube_video,
  dm_notify_enabled
) VALUES
-- Test Admin (group lead, parent figure)
(
  '00000000-0000-0000-0000-000000000001',
  'testadmin@test.local',
  'Test Admin',
  NULL, -- Avatar will be generated during setup
  'test-s1-admin',
  'test_admin_ml',
  'Middle-aged parent figure, warm smile, glasses, graying hair at temples, always wearing cozy sweaters',
  'test_admin_ntfy',
  true, true, true, true, true, true, true, true, true, true,
  'spotify',
  true,
  true
),
-- Alice (eldest child, music enthusiast)
(
  '00000000-0000-0000-0000-000000000002',
  'alice@test.local',
  'Alice',
  NULL,
  'test-s1-alice',
  'alice_test_ml',
  'Young adult woman, long curly auburn hair, artistic style, always has headphones around neck, eclectic fashion',
  'test_alice_ntfy',
  true, true, true, true, true, true, true, true, true, true,
  'spotify',
  true,
  true
),
-- Bob (middle child, competitive)
(
  '00000000-0000-0000-0000-000000000003',
  'bob@test.local',
  'Bob',
  NULL,
  'test-s1-bob',
  'bob_test_ml',
  'College-aged guy, short brown hair, athletic build, wears band t-shirts, competitive glint in eye',
  'test_bob_ntfy',
  true, true, true, true, true, true, true, true, true, true,
  'apple_music',
  false,
  true
),
-- Carol (youngest, trendsetter)
(
  '00000000-0000-0000-0000-000000000004',
  'carol@test.local',
  'Carol',
  NULL,
  'test-s1-carol',
  'carol_test_ml',
  'Teen girl, bright colored hair (changes often), Gen-Z style, always knows the latest music trends',
  'test_carol_ntfy',
  true, true, true, true, true, true, true, true, true, true,
  'youtube_music',
  true,
  true
),
-- Dave (uncle, classic rock lover)
(
  '00000000-0000-0000-0000-000000000005',
  'dave@test.local',
  'Uncle Dave',
  NULL,
  'test-s1-dave',
  'dave_test_ml',
  'Older uncle figure, beard, flannel shirts, vinyl collection visible behind him, knows every 70s-80s rock song',
  'test_dave_ntfy',
  true, false, true, true, true, true, false, true, true, true,
  'spotify',
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  ai_image_traits = EXCLUDED.ai_image_traits,
  music_league_username = EXCLUDED.music_league_username;

-- ============================================================================
-- SECTION 2: FAMILY GROUP
-- ============================================================================

INSERT INTO family_groups (id, name, owner_id, created_at) VALUES
(
  '00000000-0000-0000-0001-000000000001',
  'Test Family',
  '00000000-0000-0000-0000-000000000001',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ============================================================================
-- SECTION 3: GROUP MEMBERSHIPS
-- ============================================================================

INSERT INTO group_members (group_id, member_id, role) VALUES
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'lead'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000002', 'member'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000003', 'member'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000004', 'member'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000005', 'member')
ON CONFLICT (group_id, member_id) DO UPDATE SET role = EXCLUDED.role;

-- ============================================================================
-- SECTION 4: GROUP SETTINGS
-- ============================================================================

INSERT INTO group_settings (group_id, round_summary_model_key, round_story_image_model_key, round_theme_image_model_key, awards_model_key, trophy_image_model_key)
VALUES (
  '00000000-0000-0000-0001-000000000001',
  'anthropic/claude-3-5-sonnet:beta',
  'black-forest-labs/flux-1.1-pro',
  'black-forest-labs/flux-1.1-pro',
  'anthropic/claude-3-5-sonnet:beta',
  'black-forest-labs/flux-1.1-pro'
)
ON CONFLICT (group_id) DO UPDATE SET
  round_summary_model_key = EXCLUDED.round_summary_model_key;

-- ============================================================================
-- SECTION 5: PLAYER CONNECTIONS (Family Relationships)
-- ============================================================================

INSERT INTO player_connections (group_id, source_profile_id, target_profile_id, relation_type) VALUES
-- Test Admin is parent of Alice, Bob, Carol
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Parent'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Parent'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'Parent'),

-- Alice, Bob, Carol are children of Test Admin
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Child'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Child'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Child'),

-- Alice, Bob, Carol are siblings
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Sibling'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'Sibling'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Sibling'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Sibling'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Sibling'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'Sibling'),

-- Uncle Dave is sibling of Test Admin
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Sibling'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Sibling'),

-- Uncle Dave is uncle to Alice, Bob, Carol
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'Aunt/Uncle'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'Aunt/Uncle'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 'Aunt/Uncle'),

-- Alice, Bob, Carol are niece/nephew of Uncle Dave
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'Niece/Nephew'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 'Niece/Nephew'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'Niece/Nephew')
ON CONFLICT (group_id, source_profile_id, target_profile_id, relation_type) DO NOTHING;

-- ============================================================================
-- SECTION 6: SEASON COMPETITORS (Maps names to profiles for AI traits)
-- ============================================================================

INSERT INTO season_competitors (group_id, external_id, name, profile_id, ai_image_traits) VALUES
-- Historical Season (S1)
('00000000-0000-0000-0001-000000000001', 'test-s1-admin', 'Test Admin', '00000000-0000-0000-0000-000000000001',
 'Middle-aged parent figure, warm smile, glasses, graying hair at temples, always wearing cozy sweaters'),
('00000000-0000-0000-0001-000000000001', 'test-s1-alice', 'Alice', '00000000-0000-0000-0000-000000000002',
 'Young adult woman, long curly auburn hair, artistic style, always has headphones around neck, eclectic fashion'),
('00000000-0000-0000-0001-000000000001', 'test-s1-bob', 'Bob', '00000000-0000-0000-0000-000000000003',
 'College-aged guy, short brown hair, athletic build, wears band t-shirts, competitive glint in eye'),
('00000000-0000-0000-0001-000000000001', 'test-s1-carol', 'Carol', '00000000-0000-0000-0000-000000000004',
 'Teen girl, bright colored hair (changes often), Gen-Z style, always knows the latest music trends'),
('00000000-0000-0000-0001-000000000001', 'test-s1-dave', 'Uncle Dave', '00000000-0000-0000-0000-000000000005',
 'Older uncle figure, beard, flannel shirts, vinyl collection visible behind him, knows every 70s-80s rock song'),

-- Current Season (S2) - same people, different IDs (simulating new Music League season)
('00000000-0000-0000-0001-000000000001', 'test-s2-admin', 'Test Admin', '00000000-0000-0000-0000-000000000001',
 'Middle-aged parent figure, warm smile, glasses, graying hair at temples, always wearing cozy sweaters'),
('00000000-0000-0000-0001-000000000001', 'test-s2-alice', 'Alice', '00000000-0000-0000-0000-000000000002',
 'Young adult woman, long curly auburn hair, artistic style, always has headphones around neck, eclectic fashion'),
('00000000-0000-0000-0001-000000000001', 'test-s2-bob', 'Bob', '00000000-0000-0000-0000-000000000003',
 'College-aged guy, short brown hair, athletic build, wears band t-shirts, competitive glint in eye'),
('00000000-0000-0000-0001-000000000001', 'test-s2-carol', 'Carol', '00000000-0000-0000-0000-000000000004',
 'Teen girl, bright colored hair (changes often), Gen-Z style, always knows the latest music trends'),
('00000000-0000-0000-0001-000000000001', 'test-s2-dave', 'Uncle Dave', '00000000-0000-0000-0000-000000000005',
 'Older uncle figure, beard, flannel shirts, vinyl collection visible behind him, knows every 70s-80s rock song')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 7: LEAGUES (Seasons)
-- ============================================================================

INSERT INTO leagues (id, group_id, name, season_number) VALUES
-- Historical Season (complete)
('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', 'Test Family Jam Season 1', 1),
-- Current Season (in progress)
('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000001', 'Test Family Jam Season 2', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ============================================================================
-- SECTION 8: NOTIFICATION PREFERENCES
-- ============================================================================

INSERT INTO notification_preferences (user_id, new_rounds, deadline_reminders, results_revealed, comments_on_submissions, chat_messages)
VALUES
('00000000-0000-0000-0000-000000000001', true, true, true, true, true),
('00000000-0000-0000-0000-000000000002', true, true, true, true, true),
('00000000-0000-0000-0000-000000000003', true, true, true, true, false),
('00000000-0000-0000-0000-000000000004', true, true, true, true, true),
('00000000-0000-0000-0000-000000000005', true, false, true, false, false)
ON CONFLICT (user_id) DO UPDATE SET
  new_rounds = EXCLUDED.new_rounds,
  deadline_reminders = EXCLUDED.deadline_reminders;

-- ============================================================================
-- NOTE: Rounds, Submissions, Votes, and Awards are generated dynamically
-- by the test-factory edge function using real Spotify URIs and mock data.
-- This seed file only sets up the base user/group infrastructure.
-- ============================================================================
