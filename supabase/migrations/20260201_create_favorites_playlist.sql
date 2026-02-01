-- Create favorites_playlist table to store user's personalized playlist
-- Seeds with their submissions + top-voted songs from Seasons 1 & 2

CREATE TABLE IF NOT EXISTS favorites_playlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('submitted', 'top_voted', 'manual')),
  round_id uuid REFERENCES rounds(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, submission_id)
);

-- Indexes for performance
CREATE INDEX idx_favorites_playlist_profile ON favorites_playlist(profile_id);
CREATE INDEX idx_favorites_playlist_submission ON favorites_playlist(submission_id);

-- RLS policies
ALTER TABLE favorites_playlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own playlist"
  ON favorites_playlist FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert to their own playlist"
  ON favorites_playlist FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete from their own playlist"
  ON favorites_playlist FOR DELETE
  USING (auth.uid() = profile_id);

COMMENT ON TABLE favorites_playlist IS 'User personalized playlists seeded with submissions and top-voted songs from Seasons 1 & 2';
COMMENT ON COLUMN favorites_playlist.source IS 'How the song was added: submitted (user submitted it), top_voted (user gave most votes to it), manual (user added it)';
