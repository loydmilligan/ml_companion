-- Migration: Add get_guess_aggregates function
-- Purpose: Allow users to see aggregate guesses for submissions they've already guessed on
-- This uses SECURITY DEFINER to bypass RLS while enforcing security in the function logic
-- Fixes: Infinite recursion error when using self-referential RLS policy

CREATE OR REPLACE FUNCTION get_guess_aggregates(
  p_round_id UUID,
  p_submission_ids UUID[]
)
RETURNS TABLE (
  submission_id UUID,
  guessed_competitor_id UUID,
  guess_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return aggregates for submissions the current user has guessed on
  -- This is the security check that replaces the RLS policy
  RETURN QUERY
  SELECT
    sg.submission_id,
    sg.guessed_competitor_id,
    COUNT(*) as guess_count
  FROM submitter_guesses sg
  WHERE sg.round_id = p_round_id
    AND sg.submission_id = ANY(p_submission_ids)
    -- Security: Only return data for submissions the user has already guessed on
    AND EXISTS (
      SELECT 1 FROM submitter_guesses my_guess
      WHERE my_guess.submission_id = sg.submission_id
        AND my_guess.round_id = p_round_id
        AND my_guess.guesser_id = auth.uid()
    )
  GROUP BY sg.submission_id, sg.guessed_competitor_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_guess_aggregates(UUID, UUID[]) TO authenticated;
