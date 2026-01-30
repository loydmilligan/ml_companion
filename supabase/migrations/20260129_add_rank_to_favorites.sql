-- Add ranking support to rhythm_game_favorites
-- Allows users to order their favorite songs

-- Add rank column (nullable for existing favorites)
ALTER TABLE rhythm_game_favorites
ADD COLUMN rank int;

-- Create index for efficient ranking queries
CREATE INDEX IF NOT EXISTS idx_rhythm_game_favorites_rank
  ON rhythm_game_favorites(profile_id, rank);

-- Add RLS policy for updating ranks
CREATE POLICY "Users can update their own favorite ranks"
  ON rhythm_game_favorites FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Comment
COMMENT ON COLUMN rhythm_game_favorites.rank IS 'User-defined ranking position (lower = higher priority). NULL = unranked.';
