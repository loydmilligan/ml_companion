-- Migration: Add reveal timer settings to group_settings
-- Purpose: Allow admins to configure how long results stay visible after reveal
-- and whether each main sidebar tab respects the timer or switches immediately

-- Reveal timer duration in hours (default 8)
ALTER TABLE group_settings
ADD COLUMN IF NOT EXISTS reveal_timer_hours INTEGER DEFAULT 8;

-- Per-tab timer respect settings for MAIN SIDEBAR TABS
-- When true: tab stays on results until reveal_until expires
-- When false: tab switches to next round immediately when it starts
ALTER TABLE group_settings
ADD COLUMN IF NOT EXISTS playlist_tab_respect_timer BOOLEAN DEFAULT true;

ALTER TABLE group_settings
ADD COLUMN IF NOT EXISTS progress_tab_respect_timer BOOLEAN DEFAULT true;

ALTER TABLE group_settings
ADD COLUMN IF NOT EXISTS games_tab_respect_timer BOOLEAN DEFAULT true;

-- Drop old incorrectly-named columns if they exist (from previous migration attempt)
ALTER TABLE group_settings DROP COLUMN IF EXISTS guess_tab_respect_timer;
ALTER TABLE group_settings DROP COLUMN IF EXISTS timeline_tab_respect_timer;
ALTER TABLE group_settings DROP COLUMN IF EXISTS challenge_tab_respect_timer;

-- Add comment for documentation
COMMENT ON COLUMN group_settings.reveal_timer_hours IS 'How many hours results remain visible after votes_in email (default 8)';
COMMENT ON COLUMN group_settings.playlist_tab_respect_timer IS 'If true, Playlist tab respects reveal_until timer; if false, switches immediately on next round';
COMMENT ON COLUMN group_settings.progress_tab_respect_timer IS 'If true, Progress tab respects reveal_until timer; if false, switches immediately on next round';
COMMENT ON COLUMN group_settings.games_tab_respect_timer IS 'If true, Games tab respects reveal_until timer; if false, switches immediately on next round';
