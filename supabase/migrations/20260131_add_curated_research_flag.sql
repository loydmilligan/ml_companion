-- Add has_curated_research flag to rounds table
-- This determines whether to show curated song list vs search-first mode

ALTER TABLE rounds
ADD COLUMN has_curated_research boolean DEFAULT false;

-- Set Round 5 (Cover Songs) to have curated research
UPDATE rounds
SET has_curated_research = true
WHERE theme = 'Cover Songs';

-- Comment
COMMENT ON COLUMN rounds.has_curated_research IS 'True if this round has a curated song database (e.g. rhythm game songs). False shows search-first UI.';
