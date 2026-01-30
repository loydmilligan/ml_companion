-- Rhythm Game Research Feature
-- Tables for Guitar Hero / Rock Band song lookup and user favorites

-- Main song lookup table
CREATE TABLE IF NOT EXISTS rhythm_game_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL,
  year int,
  genre text,
  is_guitar_hero boolean DEFAULT false,
  is_rock_band boolean DEFAULT false,
  is_dlc boolean DEFAULT false,
  games text[] DEFAULT '{}', -- Array of specific game names (e.g., "Guitar Hero", "Guitar Hero II", "Rock Band")
  created_at timestamptz DEFAULT now()
);

-- User favorites table
CREATE TABLE IF NOT EXISTS rhythm_game_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES rhythm_game_songs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, song_id)
);

-- Indexes for search and filtering
CREATE INDEX IF NOT EXISTS idx_rhythm_game_songs_search
  ON rhythm_game_songs USING gin(to_tsvector('english', title || ' ' || artist));
CREATE INDEX IF NOT EXISTS idx_rhythm_game_songs_artist ON rhythm_game_songs(lower(artist));
CREATE INDEX IF NOT EXISTS idx_rhythm_game_songs_genre ON rhythm_game_songs(genre);
CREATE INDEX IF NOT EXISTS idx_rhythm_game_songs_franchises ON rhythm_game_songs(is_guitar_hero, is_rock_band);
CREATE INDEX IF NOT EXISTS idx_rhythm_game_favorites_profile ON rhythm_game_favorites(profile_id);

-- RLS Policies
ALTER TABLE rhythm_game_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rhythm_game_favorites ENABLE ROW LEVEL SECURITY;

-- Songs table: Read-only for all authenticated users
CREATE POLICY "Authenticated users can read songs"
  ON rhythm_game_songs FOR SELECT
  TO authenticated
  USING (true);

-- Favorites table: Users can manage their own favorites
CREATE POLICY "Users can view their own favorites"
  ON rhythm_game_favorites FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can add favorites"
  ON rhythm_game_favorites FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can remove their favorites"
  ON rhythm_game_favorites FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Comments
COMMENT ON TABLE rhythm_game_songs IS 'Lookup table for Guitar Hero and Rock Band songs for the Shred Dead Redemption round';
COMMENT ON TABLE rhythm_game_favorites IS 'User-saved favorite songs from the rhythm game research feature';
COMMENT ON COLUMN rhythm_game_songs.games IS 'Array of game names where this song appears (e.g., Guitar Hero, Guitar Hero II, Rock Band)';
COMMENT ON COLUMN rhythm_game_songs.is_dlc IS 'True if song is DLC/expansion pack content (not on original disc)';
