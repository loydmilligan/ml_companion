-- Fix is_dlc flag for songs that only appear in DLC packs
-- Bug: 176 songs have is_dlc=false but ALL their games entries contain "DLC"
-- This causes them to show up even when "No DLC" filter is enabled

-- Update songs where:
-- 1. is_dlc is currently false
-- 2. ALL games in the array contain "DLC" in their name
UPDATE rhythm_game_songs
SET is_dlc = true
WHERE is_dlc = false
  AND NOT EXISTS (
    -- Check if there's at least one game that does NOT contain 'DLC'
    SELECT 1
    FROM unnest(games) AS game_name
    WHERE game_name NOT LIKE '%DLC%'
  );

-- Verify the fix with a count
-- Before: 176 songs had is_dlc=false with only DLC games
-- After: All such songs should have is_dlc=true
