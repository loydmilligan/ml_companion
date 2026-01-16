-- Migration: Add function to recalculate guess correctness
-- Purpose: Allow manual or automatic recalculation of submitter guess correctness
-- after CSV imports populate submitter_name on submissions

-- Function to recalculate guess correctness for a specific round
-- This mirrors the logic from update_guess_correctness trigger
CREATE OR REPLACE FUNCTION recalculate_guess_correctness(target_round_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE submitter_guesses sg
  SET is_correct = (
    sg.guessed_competitor_id = (
      SELECT sc.id
      FROM submissions s
      JOIN season_competitors sc ON (
        (s.submitter_id IS NOT NULL AND sc.profile_id = s.submitter_id)
        OR (s.submitter_name IS NOT NULL AND LOWER(sc.name) = LOWER(s.submitter_name))
      )
      WHERE s.id = sg.submission_id
      LIMIT 1
    )
  )
  WHERE sg.round_id = target_round_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Also refresh the accuracy stats materialized view if it exists
  BEGIN
    REFRESH MATERIALIZED VIEW guess_accuracy_stats;
  EXCEPTION WHEN undefined_table THEN
    -- View doesn't exist yet, skip
    NULL;
  END;

  RETURN updated_count;
END;
$$;

-- Function to recalculate guess correctness for ALL revealed rounds in a league
-- Useful after bulk CSV imports
CREATE OR REPLACE FUNCTION recalculate_all_guess_correctness(target_league_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  round_record RECORD;
  total_updated INTEGER := 0;
  round_updated INTEGER;
BEGIN
  FOR round_record IN
    SELECT id FROM rounds
    WHERE league_id = target_league_id
    AND status IN ('revealed', 'archived')
  LOOP
    SELECT recalculate_guess_correctness(round_record.id) INTO round_updated;
    total_updated := total_updated + round_updated;
  END LOOP;

  RETURN total_updated;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION recalculate_guess_correctness(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_all_guess_correctness(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION recalculate_guess_correctness(UUID) IS 'Recalculates is_correct for all submitter guesses in a specific round. Call after CSV import populates submitter_name.';
COMMENT ON FUNCTION recalculate_all_guess_correctness(UUID) IS 'Recalculates is_correct for all submitter guesses across all revealed/archived rounds in a league.';
