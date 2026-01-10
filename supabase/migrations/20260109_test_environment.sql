-- TEST-001: Test Environment Schema Changes
-- Adds columns needed for test environment and pulltab image swapping

-- ============================================================================
-- ROUNDS TABLE: Pulltab images and test timing
-- ============================================================================

-- Pulltab sidebar images (swapped when round transitions)
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS pulltab_image_light_url TEXT;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS pulltab_image_dark_url TEXT;

-- Reveal until timestamp (for reveal period countdown)
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS reveal_until TIMESTAMPTZ;

-- Test environment: override 2-hour reveal to configurable minutes
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS test_reveal_duration_minutes INTEGER;

-- ============================================================================
-- FAMILY_GROUPS TABLE: Test group flag
-- ============================================================================

-- Mark groups as test groups (for filtering in production)
ALTER TABLE family_groups ADD COLUMN IF NOT EXISTS is_test_group BOOLEAN DEFAULT false;

-- ============================================================================
-- COMMENTS: Documentation
-- ============================================================================

COMMENT ON COLUMN rounds.pulltab_image_light_url IS 'Light mode sidebar pulltab image URL for this round';
COMMENT ON COLUMN rounds.pulltab_image_dark_url IS 'Dark mode sidebar pulltab image URL for this round';
COMMENT ON COLUMN rounds.reveal_until IS 'Timestamp when reveal period ends (set by votes_in processing)';
COMMENT ON COLUMN rounds.test_reveal_duration_minutes IS 'Test override: use this instead of 2 hours for reveal period';
COMMENT ON COLUMN family_groups.is_test_group IS 'True if this is a test group (exclude from production reports)';
