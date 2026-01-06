-- Timeline Game Guesses Table
CREATE TABLE timeline_guesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES rounds(id) ON DELETE CASCADE,
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  -- Store ordered submission IDs as array (position 0 = earliest)
  placement_order uuid[] NOT NULL,
  attempt_number int NOT NULL CHECK (attempt_number IN (1, 2)),
  correct_count int,  -- Populated on submit
  created_at timestamptz DEFAULT now(),
  UNIQUE (round_id, player_id, attempt_number)
);

-- Enable RLS
ALTER TABLE timeline_guesses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own guesses"
  ON timeline_guesses FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Users can insert their own guesses"
  ON timeline_guesses FOR INSERT
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "Users can view all guesses after round revealed"
  ON timeline_guesses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rounds
      WHERE rounds.id = timeline_guesses.round_id
      AND rounds.status = 'revealed'
    )
  );

-- Group Settings columns for Timeline Game
ALTER TABLE group_settings
  ADD COLUMN IF NOT EXISTS timeline_game_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS timeline_game_phase text DEFAULT 'voting';

-- Add check constraint separately (PostgreSQL doesn't support IF NOT EXISTS for constraints)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'group_settings_timeline_game_phase_check'
  ) THEN
    ALTER TABLE group_settings
      ADD CONSTRAINT group_settings_timeline_game_phase_check
      CHECK (timeline_game_phase IN ('voting', 'revealed', 'both'));
  END IF;
END $$;

-- User Feature Flag for testing
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS timeline_game_tester boolean DEFAULT false;

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_timeline_guesses_round_player
  ON timeline_guesses(round_id, player_id);
