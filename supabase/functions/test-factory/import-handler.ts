/**
 * TEST-003: Historical Data Import Handler
 *
 * Generates and imports historical season data directly to the database,
 * bypassing the need for CSV download/upload workflow.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  generateSeason,
  TEST_USERS,
  type RoundRow,
  type SubmissionRow,
  type VoteRow,
  type CompetitorRow,
  type GenerationOptions,
} from "./csv-generators.ts";

// Test data constants
const TEST_GROUP_ID = "00000000-0000-0000-0001-000000000001";
const TEST_LEAGUE_S1_ID = "00000000-0000-0000-0002-000000000001";

export interface ImportResult {
  success: boolean;
  rounds: number;
  submissions: number;
  votes: number;
  competitors: number;
  roundIds: string[];
  errors?: string[];
}

export interface ImportOptions {
  roundCount?: number;
  groupId?: string;
  leagueId?: string;
  includeVotes?: boolean;
}

/**
 * Generate and import historical season data directly to database.
 */
export async function importHistoricalData(
  supabase: SupabaseClient,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const {
    roundCount = 5,
    groupId = TEST_GROUP_ID,
    leagueId = TEST_LEAGUE_S1_ID,
    includeVotes = true,
  } = options;

  const errors: string[] = [];
  const roundIds: string[] = [];

  console.log(`[ImportHandler] Starting import: ${roundCount} rounds for league ${leagueId}`);

  try {
    // 1. Generate season data
    const generationOptions: GenerationOptions = {
      includeVotes,
    };
    const { rounds, submissions, votes, competitors } = generateSeason(
      roundCount,
      TEST_USERS,
      generationOptions
    );

    console.log(`[ImportHandler] Generated: ${rounds.length} rounds, ${submissions.length} submissions, ${votes.length} votes`);

    // 2. Import competitors
    const competitorResult = await importCompetitors(supabase, groupId, competitors);
    if (!competitorResult.success) {
      errors.push(`Competitors: ${competitorResult.error}`);
    }

    // 3. Import rounds and get ID mapping
    const roundResult = await importRounds(supabase, leagueId, rounds);
    if (!roundResult.success) {
      errors.push(`Rounds: ${roundResult.error}`);
    }
    roundIds.push(...Object.values(roundResult.roundIdMap));

    // 4. Import submissions with round mapping
    const submissionResult = await importSubmissions(
      supabase,
      roundResult.roundIdMap,
      submissions,
      competitors
    );
    if (!submissionResult.success) {
      errors.push(`Submissions: ${submissionResult.error}`);
    }

    // 5. Import votes with submission mapping
    if (includeVotes && votes.length > 0) {
      const voteResult = await importVotes(
        supabase,
        roundResult.roundIdMap,
        submissionResult.submissionIdMap,
        votes,
        competitors
      );
      if (!voteResult.success) {
        errors.push(`Votes: ${voteResult.error}`);
      }
    }

    console.log(`[ImportHandler] Import complete. Errors: ${errors.length}`);

    return {
      success: errors.length === 0,
      rounds: rounds.length,
      submissions: submissions.length,
      votes: votes.length,
      competitors: competitors.length,
      roundIds,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error(`[ImportHandler] Fatal error:`, error);
    return {
      success: false,
      rounds: 0,
      submissions: 0,
      votes: 0,
      competitors: 0,
      roundIds: [],
      errors: [error.message],
    };
  }
}

/**
 * Import competitors to season_competitors table.
 */
async function importCompetitors(
  supabase: SupabaseClient,
  groupId: string,
  competitors: CompetitorRow[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Map competitor external IDs to profile IDs
    const competitorData = competitors.map((c) => {
      const testUser = TEST_USERS.find((u) => u.competitorId === c.ID);
      return {
        group_id: groupId,
        external_id: c.ID,
        name: c.Name,
        profile_id: testUser?.id || null,
      };
    });

    const { error } = await supabase
      .from("season_competitors")
      .upsert(competitorData, { onConflict: "group_id,external_id" });

    if (error) {
      return { success: false, error: error.message };
    }

    console.log(`[ImportHandler] Imported ${competitors.length} competitors`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Import rounds to rounds table.
 * Returns mapping of external_id -> round UUID.
 */
async function importRounds(
  supabase: SupabaseClient,
  leagueId: string,
  rounds: RoundRow[]
): Promise<{ success: boolean; roundIdMap: Record<string, string>; error?: string }> {
  const roundIdMap: Record<string, string> = {};

  try {
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];

      // Check if round already exists
      const { data: existing } = await supabase
        .from("rounds")
        .select("id")
        .eq("league_id", leagueId)
        .eq("external_round_id", round.ID)
        .single();

      if (existing) {
        roundIdMap[round.ID] = existing.id;
        continue;
      }

      // Create new round
      const { data: newRound, error } = await supabase
        .from("rounds")
        .insert({
          league_id: leagueId,
          external_round_id: round.ID,
          theme: round.Name,
          theme_description: round.Description,
          playlist_url: round["Playlist URL"],
          round_number: i + 1,
          status: "archived",
          created_at: round.Created,
        })
        .select("id")
        .single();

      if (error) {
        return { success: false, roundIdMap, error: error.message };
      }

      roundIdMap[round.ID] = newRound.id;
    }

    console.log(`[ImportHandler] Imported ${rounds.length} rounds`);
    return { success: true, roundIdMap };
  } catch (error) {
    return { success: false, roundIdMap, error: error.message };
  }
}

/**
 * Import submissions to submissions table.
 * Returns mapping of (round_id::spotify_uri) -> submission UUID.
 */
async function importSubmissions(
  supabase: SupabaseClient,
  roundIdMap: Record<string, string>,
  submissions: SubmissionRow[],
  competitors: CompetitorRow[]
): Promise<{ success: boolean; submissionIdMap: Record<string, string>; error?: string }> {
  const submissionIdMap: Record<string, string> = {};
  const competitorMap = new Map(competitors.map((c) => [c.ID, c.Name]));

  try {
    // Group submissions by round for batch processing
    const submissionsByRound = new Map<string, SubmissionRow[]>();
    for (const sub of submissions) {
      const existing = submissionsByRound.get(sub["Round ID"]) || [];
      existing.push(sub);
      submissionsByRound.set(sub["Round ID"], existing);
    }

    for (const [externalRoundId, roundSubmissions] of submissionsByRound) {
      const roundId = roundIdMap[externalRoundId];
      if (!roundId) {
        console.warn(`[ImportHandler] No round mapping for ${externalRoundId}`);
        continue;
      }

      const submissionData = roundSubmissions.map((sub) => {
        const testUser = TEST_USERS.find((u) => u.competitorId === sub["Submitter ID"]);
        // Extract track ID from Spotify URI
        const trackId = sub["Spotify URI"].replace("spotify:track:", "");
        const spotifyLink = `https://open.spotify.com/track/${trackId}`;

        return {
          round_id: roundId,
          submitter_name: competitorMap.get(sub["Submitter ID"]) || sub["Submitter ID"],
          profile_id: testUser?.id || null,
          title: sub.Title,
          artist: sub["Artist(s)"],
          link: spotifyLink,
          source_uri: sub["Spotify URI"],
          submitter_comment: sub.Comment || null,
          created_at: sub.Created,
        };
      });

      const { data: inserted, error } = await supabase
        .from("submissions")
        .upsert(submissionData, { onConflict: "round_id,source_uri" })
        .select("id, round_id, source_uri");

      if (error) {
        return { success: false, submissionIdMap, error: error.message };
      }

      // Build submission ID map
      if (inserted) {
        for (const sub of inserted) {
          const key = `${sub.round_id}::${sub.source_uri}`;
          submissionIdMap[key] = sub.id;
        }
      }
    }

    console.log(`[ImportHandler] Imported ${submissions.length} submissions`);
    return { success: true, submissionIdMap };
  } catch (error) {
    return { success: false, submissionIdMap, error: error.message };
  }
}

/**
 * Import votes to votes table.
 */
async function importVotes(
  supabase: SupabaseClient,
  roundIdMap: Record<string, string>,
  submissionIdMap: Record<string, string>,
  votes: VoteRow[],
  competitors: CompetitorRow[]
): Promise<{ success: boolean; error?: string }> {
  const competitorMap = new Map(competitors.map((c) => [c.ID, c.Name]));

  try {
    // Process votes in chunks
    const CHUNK_SIZE = 200;
    const voteData: Array<{
      submission_id: string;
      voter_name: string;
      voter_external_id: string;
      profile_id: string | null;
      points: number;
      comment: string | null;
      created_at: string;
    }> = [];

    for (const vote of votes) {
      const roundId = roundIdMap[vote["Round ID"]];
      if (!roundId) continue;

      // Find submission by matching spotify URI and round
      const submissionKey = `${roundId}::${vote["Spotify URI"]}`;
      const submissionId = submissionIdMap[submissionKey];
      if (!submissionId) {
        console.warn(`[ImportHandler] No submission for vote: ${submissionKey}`);
        continue;
      }

      const testUser = TEST_USERS.find((u) => u.competitorId === vote["Voter ID"]);

      voteData.push({
        submission_id: submissionId,
        voter_name: competitorMap.get(vote["Voter ID"]) || vote["Voter ID"],
        voter_external_id: vote["Voter ID"],
        profile_id: testUser?.id || null,
        points: parseInt(vote["Points Assigned"], 10),
        comment: vote.Comment || null,
        created_at: vote.Created,
      });
    }

    // Insert in chunks
    for (let i = 0; i < voteData.length; i += CHUNK_SIZE) {
      const chunk = voteData.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase
        .from("votes")
        .upsert(chunk, { onConflict: "submission_id,voter_external_id" });

      if (error) {
        return { success: false, error: error.message };
      }
    }

    console.log(`[ImportHandler] Imported ${voteData.length} votes`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Auto-link competitors to profiles by matching names.
 */
export async function linkCompetitorsToProfiles(
  supabase: SupabaseClient,
  groupId: string = TEST_GROUP_ID
): Promise<{ success: boolean; linked: number; error?: string }> {
  try {
    // Get unlinked competitors
    const { data: competitors, error: fetchError } = await supabase
      .from("season_competitors")
      .select("id, name, profile_id")
      .eq("group_id", groupId)
      .is("profile_id", null);

    if (fetchError) {
      return { success: false, linked: 0, error: fetchError.message };
    }

    if (!competitors || competitors.length === 0) {
      return { success: true, linked: 0 };
    }

    // Get profiles in the group
    const { data: members, error: memberError } = await supabase
      .from("group_members")
      .select("profiles:member_id(id, display_name)")
      .eq("group_id", groupId);

    if (memberError) {
      return { success: false, linked: 0, error: memberError.message };
    }

    let linked = 0;
    for (const comp of competitors) {
      // Try to match by name (case-insensitive)
      const match = members?.find(
        (m) =>
          m.profiles &&
          (m.profiles as { display_name?: string }).display_name?.toLowerCase() ===
            comp.name.toLowerCase()
      );

      if (match && match.profiles) {
        const { error: updateError } = await supabase
          .from("season_competitors")
          .update({ profile_id: (match.profiles as { id: string }).id })
          .eq("id", comp.id);

        if (!updateError) {
          linked++;
        }
      }
    }

    console.log(`[ImportHandler] Linked ${linked} competitors to profiles`);
    return { success: true, linked };
  } catch (error) {
    return { success: false, linked: 0, error: error.message };
  }
}
