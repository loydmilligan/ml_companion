/**
 * Script to import Season 1 votes from export (10)
 *
 * Usage: npx ts-node scripts/import-season1-votes.ts
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

// Season 1 league ID
const SEASON_1_LEAGUE_ID = '6308061a-9150-4ad0-af62-8ccd124f0303';

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

async function importVotes(exportPath: string) {
  const votesContent = fs.readFileSync(path.join(exportPath, 'votes.csv'), 'utf-8');
  const voteRows = parseCSV(votesContent);

  // Get submission mapping for Season 1 (spotify_uri + external_round_id -> submission_id)
  const { data: submissions, error: subError } = await supabase
    .from('submissions')
    .select('id, source_uri, external_round_id, rounds!inner(league_id)')
    .eq('rounds.league_id', SEASON_1_LEAGUE_ID);

  if (subError) {
    console.error('Error fetching submissions:', subError);
    return;
  }

  const submissionMap = new Map<string, string>();
  submissions?.forEach(s => {
    submissionMap.set(`${s.source_uri}|${s.external_round_id}`, s.id);
  });

  console.log(`Found ${submissionMap.size} Season 1 submissions`);
  console.log(`Importing ${voteRows.length} votes...`);

  let skipped = 0;
  const votes = voteRows.map(row => {
    const key = `${row['Spotify URI']}|${row['Round ID']}`;
    const submissionId = submissionMap.get(key);
    if (!submissionId) {
      skipped++;
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

  console.log(`Skipped ${skipped} votes (no matching submission)`);
  console.log(`Inserting ${votes.length} votes...`);

  // Insert in batches of 50
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < votes.length; i += 50) {
    const batch = votes.slice(i, i + 50);
    const { error } = await supabase
      .from('votes')
      .insert(batch as any[]);

    if (error) {
      if (error.code === '23505') {
        console.log(`  Batch ${i}-${i + batch.length} already exists, skipping...`);
      } else {
        console.error(`  Error inserting votes batch ${i}-${i + batch.length}:`, error.message);
        errors++;
      }
    } else {
      inserted += batch.length;
      console.log(`  Inserted batch ${i}-${i + batch.length}`);
    }
  }

  console.log(`\nVotes import complete: ${inserted} inserted, ${errors} errors`);
}

async function main() {
  const export10Path = path.join(__dirname, '../web/public/data/export (10)');

  console.log('=== Importing Season 1 votes (export 10) ===');
  await importVotes(export10Path);
}

main().catch(console.error);
