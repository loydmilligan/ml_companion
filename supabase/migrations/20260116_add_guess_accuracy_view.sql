-- Migration: Add materialized view for cross-round guess accuracy tracking
-- Purpose: Track how successful each user is at guessing each other person's songs
-- This accumulates data across rounds to show patterns like "Alice is good at guessing Bob's songs"

-- Materialized view for cross-round guess accuracy statistics
-- Tracks: guesser → actual submitter accuracy rates
CREATE MATERIALIZED VIEW IF NOT EXISTS guess_accuracy_stats AS
SELECT
  sg.guesser_id,
  p_guesser.display_name AS guesser_name,
  sc_actual.id AS submitter_competitor_id,
  sc_actual.name AS submitter_name,
  COUNT(*) AS total_guesses,
  COUNT(*) FILTER (WHERE sg.is_correct = true) AS correct_guesses,
  ROUND(
    (COUNT(*) FILTER (WHERE sg.is_correct = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 1
  ) AS accuracy_percent,
  sc_actual.group_id
FROM submitter_guesses sg
JOIN submissions sub ON sg.submission_id = sub.id
-- Join to find the actual submitter's competitor record
-- Match by profile_id or by name (same logic as update_guess_correctness trigger)
JOIN season_competitors sc_actual ON (
  (sub.submitter_id IS NOT NULL AND sc_actual.profile_id = sub.submitter_id)
  OR (sub.submitter_name IS NOT NULL AND LOWER(sc_actual.name) = LOWER(sub.submitter_name))
)
JOIN profiles p_guesser ON sg.guesser_id = p_guesser.id
WHERE sg.is_correct IS NOT NULL  -- Only include evaluated guesses (round revealed)
GROUP BY sg.guesser_id, p_guesser.display_name, sc_actual.id, sc_actual.name, sc_actual.group_id;

-- Index for fast lookups by group
CREATE INDEX IF NOT EXISTS idx_guess_accuracy_stats_group
ON guess_accuracy_stats(group_id);

-- Index for fast lookups by guesser
CREATE INDEX IF NOT EXISTS idx_guess_accuracy_stats_guesser
ON guess_accuracy_stats(guesser_id);

-- Function to refresh the materialized view
-- Should be called after rounds are revealed to update accuracy stats
CREATE OR REPLACE FUNCTION refresh_guess_accuracy_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW guess_accuracy_stats;
END;
$$;

-- Grant access to authenticated users
GRANT SELECT ON guess_accuracy_stats TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_guess_accuracy_stats() TO authenticated;

-- Add comment for documentation
COMMENT ON MATERIALIZED VIEW guess_accuracy_stats IS 'Cross-round tracking of how successful each user is at guessing each submitters songs. Refresh after rounds are revealed.';
