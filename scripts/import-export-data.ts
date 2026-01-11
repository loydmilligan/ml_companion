/**
 * Script to import Music League export data into Supabase
 *
 * Usage: npx ts-node scripts/import-export-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Group and league IDs for FamJam2
const GROUP_ID = 'b4e34838-b9e6-4b64-96f1-ff900592f9fb';
const SEASON_2_LEAGUE_ID = 'cd4d0aeb-eb3d-421f-a3f4-27cc80770e15';

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

async function getRoundIdMapping(leagueId: string): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('rounds')
    .select('id, external_round_id')
    .eq('league_id', leagueId);

  if (error) throw error;

  const mapping = new Map<string, string>();
  data?.forEach(r => {
    if (r.external_round_id) {
      mapping.set(r.external_round_id, r.id);
    }
  });

  return mapping;
}

async function importSubmissions(exportPath: string, roundMapping: Map<string, string>) {
  const content = fs.readFileSync(path.join(exportPath, 'submissions.csv'), 'utf-8');
  const rows = parseCSV(content);

  console.log(`Importing ${rows.length} submissions...`);

  const submissions = rows.map(row => {
    const roundId = roundMapping.get(row['Round ID']);
    if (!roundId) {
      console.warn(`  Skipping submission - no round found for ${row['Round ID']}`);
      return null;
    }

    return {
      round_id: roundId,
      title: row['Title'],
      artist: row['Artist(s)'],
      album: row['Album'],
      source_uri: row['Spotify URI'],
      external_round_id: row['Round ID'],
      external_submitter_id: row['Submitter ID'],
      external_created_at: row['Created'],
      external_comment: row['Comment'] || null,
      external_visible_to_voters: row['Visible To Voters'] === 'Yes',
    };
  }).filter(Boolean);

  // Insert in batches of 50
  for (let i = 0; i < submissions.length; i += 50) {
    const batch = submissions.slice(i, i + 50);
    const { error } = await supabase
      .from('submissions')
      .upsert(batch as any[], {
        onConflict: 'source_uri,round_id',
        ignoreDuplicates: true
      });

    if (error) {
      console.error(`  Error inserting batch ${i}-${i + batch.length}:`, error.message);
    } else {
      console.log(`  Inserted batch ${i}-${i + batch.length}`);
    }
  }

  console.log('Submissions import complete');
}

async function getSubmissionMapping(leagueId: string): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('submissions')
    .select('id, source_uri, round_id, rounds!inner(league_id)')
    .eq('rounds.league_id', leagueId);

  if (error) throw error;

  const mapping = new Map<string, string>();
  data?.forEach(s => {
    // Key: spotify_uri + round_id combo
    mapping.set(`${s.source_uri}|${s.round_id}`, s.id);
  });

  return mapping;
}

async function importVotes(exportPath: string, roundMapping: Map<string, string>) {
  const votesContent = fs.readFileSync(path.join(exportPath, 'votes.csv'), 'utf-8');
  const voteRows = parseCSV(votesContent);

  // Get submission mapping (spotify_uri -> submission_id)
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, source_uri, external_round_id');

  const submissionMap = new Map<string, string>();
  submissions?.forEach(s => {
    submissionMap.set(`${s.source_uri}|${s.external_round_id}`, s.id);
  });

  console.log(`Importing ${voteRows.length} votes...`);

  const votes = voteRows.map(row => {
    const submissionId = submissionMap.get(`${row['Spotify URI']}|${row['Round ID']}`);
    if (!submissionId) {
      return null;
    }

    return {
      submission_id: submissionId,
      voter_external_id: row['Voter ID'],
      points: parseInt(row['Points Assigned']) || 0,
      comment: row['Comment'] || null,
      external_round_id: row['Round ID'],
      external_spotify_uri: row['Spotify URI'],
      external_created_at: row['Created'],
    };
  }).filter(Boolean);

  // Insert in batches of 100
  for (let i = 0; i < votes.length; i += 100) {
    const batch = votes.slice(i, i + 100);
    const { error } = await supabase
      .from('votes')
      .insert(batch as any[]);

    if (error) {
      if (error.code === '23505') {
        console.log(`  Batch ${i}-${i + batch.length} already exists, skipping...`);
      } else {
        console.error(`  Error inserting votes batch ${i}-${i + batch.length}:`, error.message);
      }
    } else {
      console.log(`  Inserted votes batch ${i}-${i + batch.length}`);
    }
  }

  console.log('Votes import complete');
}

async function createSeason3League(): Promise<string> {
  // Check if Season 3 exists
  const { data: existing } = await supabase
    .from('leagues')
    .select('id')
    .eq('group_id', GROUP_ID)
    .eq('season_number', 3)
    .single();

  if (existing) {
    console.log('Season 3 league already exists:', existing.id);
    return existing.id;
  }

  // Create Season 3
  const { data, error } = await supabase
    .from('leagues')
    .insert({
      group_id: GROUP_ID,
      name: 'Fam Jam III: Third Time\'s the Charm',
      season_number: 3,
    })
    .select('id')
    .single();

  if (error) throw error;

  console.log('Created Season 3 league:', data.id);
  return data.id;
}

async function importSeason3Rounds(exportPath: string, leagueId: string): Promise<Map<string, string>> {
  const content = fs.readFileSync(path.join(exportPath, 'rounds.csv'), 'utf-8');
  const rows = parseCSV(content);

  console.log(`Importing ${rows.length} rounds for Season 3...`);

  const roundMapping = new Map<string, string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Check if round exists
    const { data: existing } = await supabase
      .from('rounds')
      .select('id')
      .eq('external_round_id', row['ID'])
      .single();

    if (existing) {
      roundMapping.set(row['ID'], existing.id);
      console.log(`  Round "${row['Name']}" already exists`);
      continue;
    }

    const { data, error } = await supabase
      .from('rounds')
      .insert({
        league_id: leagueId,
        theme: row['Name'],
        theme_description: row['Description'],
        status: 'archived',
        season_number: 3,
        round_number: i + 1,
        external_round_id: row['ID'],
        external_created_at: row['Created'],
        playlist_url: row['Playlist URL'],
        external_playlist_url: row['Playlist URL'],
      })
      .select('id')
      .single();

    if (error) {
      console.error(`  Error creating round "${row['Name']}":`, error.message);
    } else {
      roundMapping.set(row['ID'], data.id);
      console.log(`  Created round "${row['Name']}"`);
    }
  }

  return roundMapping;
}

async function main() {
  const export10Path = path.join(__dirname, '../web/public/data/export (10)');
  const export11Path = path.join(__dirname, '../web/public/data/export (11)');

  console.log('=== Importing Season 2 data (export 10) ===');
  const season2RoundMapping = await getRoundIdMapping(SEASON_2_LEAGUE_ID);
  console.log(`Found ${season2RoundMapping.size} rounds for Season 2`);

  await importSubmissions(export10Path, season2RoundMapping);
  await importVotes(export10Path, season2RoundMapping);

  console.log('\n=== Importing Season 3 data (export 11) ===');
  const season3LeagueId = await createSeason3League();
  const season3RoundMapping = await importSeason3Rounds(export11Path, season3LeagueId);

  await importSubmissions(export11Path, season3RoundMapping);
  await importVotes(export11Path, season3RoundMapping);

  console.log('\n=== Import complete ===');
}

main().catch(console.error);
