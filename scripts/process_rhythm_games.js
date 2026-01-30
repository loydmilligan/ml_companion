#!/usr/bin/env node
/**
 * Process Guitar Hero and Rock Band CSV files to generate SQL seed data
 * for the rhythm_game_songs table.
 *
 * Usage: node scripts/process_rhythm_games.js > supabase/seed/rhythm_game_songs.sql
 */

const fs = require('fs');
const path = require('path');

// Games that count as "disc" songs (not DLC) for GH 1/2/3
const GH_DISC_GAMES = [
  'Guitar Hero',
  'Guitar Hero II',
  'Guitar Hero III: Legends Of Rock'
];

// Games that are DLC or expansion packs
const DLC_GAMES = [
  'Guitar Hero II DLC',
  'Guitar Hero World Tour DLC',
  'Guitar Hero Encore: Rocks The 80s', // Expansion
  'Guitar Hero: On Tour', // Handheld spinoff
  'Guitar Hero: Van Halen', // Spinoff
  'Guitar Hero World Tour',
  'Guitar Hero: Warriors Of Rock',
  'Guitar Hero 5',
  'Guitar Hero Live'
];

// Master dict: key = normalized(artist + title), value = song object
const songs = new Map();

function normalize(str) {
  return str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

function escapeSQL(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

function parseGuitarHeroCSV(content) {
  // The CSV is malformed - all on one line with no proper line breaks
  // Format: Year,"Song Title","Artist","Master Recording?","Game"
  // Each record starts with a 4-digit year

  const records = [];
  const regex = /(\d{4}),"([^"]+)","([^"]+)","([^"]+)","([^"]+)"/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    records.push({
      year: parseInt(match[1]),
      title: match[2],
      artist: match[3],
      masterRecording: match[4] === 'Yes',
      game: match[5]
    });
  }

  return records;
}

function parseRockBandCSV(content) {
  // Rock Band 2 CSV format (from rockband_list_2.csv):
  // ,✓,Song,Artist,Year,Release Date,Genre,...,Origin,...
  const lines = content.split('\n');
  const records = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV with quotes
    const parts = parseCSVLine(line);
    if (parts.length < 10) continue;

    const song = parts[2];
    const artist = parts[3];
    const year = parseInt(parts[4]) || null;
    const genre = parts[6] || '';
    const origin = parts[9] || ''; // e.g., "RB1", "DLC1/2", etc.

    if (!song || !artist || song === 'nan') continue;

    // Determine if it's a disc song or DLC
    const isDisc = origin.includes('RB1') || origin.includes('RB2') || origin.includes('RB3') || origin.includes('RB4');
    const isDLC = origin.includes('DLC') || origin.includes('RBN');

    records.push({
      title: song,
      artist: artist,
      year: year,
      genre: genre,
      game: origin.includes('RB1') ? 'Rock Band' :
            origin.includes('RB2') ? 'Rock Band 2' :
            origin.includes('RB3') ? 'Rock Band 3' :
            origin.includes('RB4') ? 'Rock Band 4' : 'Rock Band DLC',
      isDLC: isDLC && !isDisc
    });
  }

  return records;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

function addSong(record, isGuitarHero = true, isDLC = false) {
  const key = normalize(record.artist + ' ' + record.title);

  if (!songs.has(key)) {
    songs.set(key, {
      title: record.title,
      artist: record.artist,
      year: record.year || null,
      genre: record.genre || null,
      isGuitarHero: false,
      isRockBand: false,
      isDiscSong: false, // Track if song appears on any disc
      games: new Set()
    });
  }

  const song = songs.get(key);

  if (isGuitarHero) {
    song.isGuitarHero = true;
    // Check if this is a disc game (not DLC)
    if (GH_DISC_GAMES.includes(record.game)) {
      song.isDiscSong = true;
    }
  } else {
    song.isRockBand = true;
    // Rock Band disc songs
    if (!record.isDLC) {
      song.isDiscSong = true;
    }
  }

  song.games.add(record.game);

  // Update genre if we don't have one
  if (!song.genre && record.genre) {
    song.genre = record.genre;
  }
}

// Process Guitar Hero data
const ghPath = path.join(__dirname, '../docs/round_5_feature/gh_list.csv');
if (fs.existsSync(ghPath)) {
  const ghContent = fs.readFileSync(ghPath, 'utf-8');
  const ghRecords = parseGuitarHeroCSV(ghContent);
  process.stderr.write(`Parsed ${ghRecords.length} Guitar Hero records\n`);

  for (const record of ghRecords) {
    addSong(record, true);
  }
}

// Process Rock Band data
const rbPath = path.join(__dirname, '../docs/round_5_feature/rockband_list_2.csv');
if (fs.existsSync(rbPath)) {
  const rbContent = fs.readFileSync(rbPath, 'utf-8');
  const rbRecords = parseRockBandCSV(rbContent);
  process.stderr.write(`Parsed ${rbRecords.length} Rock Band records\n`);

  for (const record of rbRecords) {
    addSong(record, false, record.isDLC);
  }
}

// Generate SQL
console.log('-- Rhythm Game Songs Seed Data');
console.log('-- Generated by scripts/process_rhythm_games.js');
console.log('-- Run: node scripts/process_rhythm_games.js > supabase/seed/rhythm_game_songs.sql');
console.log('');
console.log('-- Clear existing data');
console.log('TRUNCATE rhythm_game_songs CASCADE;');
console.log('');
console.log('-- Insert songs');

let count = 0;
const values = [];

for (const [key, song] of songs) {
  // PostgreSQL arrays need single quotes for string elements
  const gamesArray = Array.from(song.games).map(g => `'${escapeSQL(g)}'`).join(',');
  const isDLC = !song.isDiscSong; // If not on any disc, it's DLC

  values.push(`('${escapeSQL(song.title)}', '${escapeSQL(song.artist)}', ${song.year || 'NULL'}, ${song.genre ? `'${escapeSQL(song.genre)}'` : 'NULL'}, ${song.isGuitarHero}, ${song.isRockBand}, ${isDLC}, ARRAY[${gamesArray}])`);
  count++;
}

// Output as batched inserts for better performance
const batchSize = 100;
for (let i = 0; i < values.length; i += batchSize) {
  const batch = values.slice(i, i + batchSize);
  console.log(`INSERT INTO rhythm_game_songs (title, artist, year, genre, is_guitar_hero, is_rock_band, is_dlc, games) VALUES`);
  console.log(batch.join(',\n') + ';');
  console.log('');
}

process.stderr.write(`\nGenerated ${count} unique songs\n`);
