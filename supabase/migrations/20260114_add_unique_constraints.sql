-- Add unique constraint for votes by voter_id (profile UUID)
-- This prevents the same user from voting twice on the same submission
-- Note: We already have (submission_id, voter_external_id) for imported historical data
ALTER TABLE votes
ADD CONSTRAINT votes_submission_voter_id_unique
UNIQUE (submission_id, voter_id);

-- Add unique constraint for round themes within a league
-- This prevents duplicate rounds with the same theme
ALTER TABLE rounds
ADD CONSTRAINT rounds_league_theme_unique
UNIQUE (league_id, theme);
