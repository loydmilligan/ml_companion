-- Add round_id to rhythm_game_favorites to make favorites round-specific
-- This allows users to build different favorite lists for different rounds

-- Add round_id column (nullable for backward compatibility with existing favorites)
ALTER TABLE rhythm_game_favorites
ADD COLUMN round_id uuid REFERENCES rounds(id) ON DELETE CASCADE;

-- Create index for efficient round-based queries
CREATE INDEX IF NOT EXISTS idx_rhythm_game_favorites_round
  ON rhythm_game_favorites(profile_id, round_id);

-- Update the unique constraint to include round_id
-- This allows the same song to be favorited in different rounds
ALTER TABLE rhythm_game_favorites
DROP CONSTRAINT rhythm_game_favorites_profile_id_song_id_key;

ALTER TABLE rhythm_game_favorites
ADD CONSTRAINT rhythm_game_favorites_profile_round_song_key
  UNIQUE(profile_id, round_id, song_id);

-- Comment
COMMENT ON COLUMN rhythm_game_favorites.round_id IS 'Round this favorite belongs to. NULL = legacy global favorite.';
