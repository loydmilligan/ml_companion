-- Migration: Add reveal timer settings to group_settings
-- Purpose: Allow admins to configure how long results stay visible after reveal
-- and whether each game tab respects the timer or switches immediately

-- Reveal timer duration in hours (default 8)
ALTER TABLE group_settings
ADD COLUMN IF NOT EXISTS reveal_timer_hours INTEGER DEFAULT 8;

-- Per-tab timer respect settings
-- When true: tab stays on results until reveal_until expires
-- When false: tab switches to next round immediately when it starts
ALTER TABLE group_settings
ADD COLUMN IF NOT EXISTS guess_tab_respect_timer BOOLEAN DEFAULT true;

ALTER TABLE group_settings
ADD COLUMN IF NOT EXISTS timeline_tab_respect_timer BOOLEAN DEFAULT true;

ALTER TABLE group_settings
ADD COLUMN IF NOT EXISTS challenge_tab_respect_timer BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN group_settings.reveal_timer_hours IS 'How many hours results remain visible after votes_in email (default 8)';
COMMENT ON COLUMN group_settings.guess_tab_respect_timer IS 'If true, Guess tab respects reveal_until timer; if false, switches immediately on next round';
COMMENT ON COLUMN group_settings.timeline_tab_respect_timer IS 'If true, Timeline tab respects reveal_until timer; if false, switches immediately on next round';
COMMENT ON COLUMN group_settings.challenge_tab_respect_timer IS 'If true, Challenge tab respects reveal_until timer; if false, switches immediately on next round';
