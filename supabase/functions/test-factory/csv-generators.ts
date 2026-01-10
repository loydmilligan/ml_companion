/**
 * TEST-001: CSV Data Generators
 *
 * Generates the 4 CSV files needed for Music League season import:
 * - rounds.csv
 * - submissions.csv
 * - votes.csv
 * - competitors.csv
 *
 * Uses real Spotify URIs from sample-songs.ts pool.
 */

import {
  SAMPLE_SONGS,
  getDecadeBalancedSongs,
  getSpotifyLink,
  type SampleSong,
} from "./sample-songs.ts";

// ============================================================================
// CSV Row Types (matching SeasonImport.tsx expectations)
// ============================================================================

export interface RoundRow {
  ID: string;
  Created: string;
  Name: string;
  Description: string;
  "Playlist URL": string;
}

export interface SubmissionRow {
  "Spotify URI": string;
  Title: string;
  Album: string;
  "Artist(s)": string;
  "Submitter ID": string;
  Created: string;
  Comment: string;
  "Round ID": string;
  "Visible To Voters": string;
}

export interface VoteRow {
  "Spotify URI": string;
  "Voter ID": string;
  Created: string;
  "Points Assigned": string;
  Comment: string;
  "Round ID": string;
}

export interface CompetitorRow {
  ID: string;
  Name: string;
}

// ============================================================================
// Test User Configuration
// ============================================================================

export interface TestUser {
  id: string;
  name: string;
  competitorId: string;
}

export const TEST_USERS: TestUser[] = [
  { id: "00000000-0000-0000-0000-000000000001", name: "Test Admin", competitorId: "test-s2-admin" },
  { id: "00000000-0000-0000-0000-000000000002", name: "Alice", competitorId: "test-s2-alice" },
  { id: "00000000-0000-0000-0000-000000000003", name: "Bob", competitorId: "test-s2-bob" },
  { id: "00000000-0000-0000-0000-000000000004", name: "Carol", competitorId: "test-s2-carol" },
  { id: "00000000-0000-0000-0000-000000000005", name: "Uncle Dave", competitorId: "test-s2-dave" },
];

// ============================================================================
// Round Theme Generator
// ============================================================================

const ROUND_THEMES = [
  { name: "Songs That Make You Happy", description: "Pick a song that never fails to put a smile on your face." },
  { name: "Cover Songs", description: "Submit a cover version that rivals or surpasses the original." },
  { name: "One-Hit Wonders", description: "Songs by artists who never had another big hit." },
  { name: "Songs from Movies", description: "Iconic songs featured in films." },
  { name: "Songs About Places", description: "Songs that mention specific cities, countries, or locations." },
  { name: "Deep Cuts", description: "Non-single album tracks that deserve more love." },
  { name: "Guilty Pleasures", description: "Songs you secretly love but might be embarrassed to admit." },
  { name: "Songs from Your Birth Year", description: "Pick a song released the year you were born." },
  { name: "Summer Anthems", description: "Songs that capture the feeling of summer." },
  { name: "Songs Over 7 Minutes", description: "Epic tracks that take their time." },
  { name: "Debut Singles", description: "The first single released by an artist or band." },
  { name: "Songs with Names in the Title", description: "Songs that include a person's name." },
  { name: "Instrumentals Only", description: "Songs without vocals." },
  { name: "Songs from This Decade", description: "Tracks released in the 2020s." },
  { name: "Songs That Tell a Story", description: "Narrative songs with a beginning, middle, and end." },
];

// ============================================================================
// Sample Submission Comments
// ============================================================================

const SUBMISSION_COMMENTS = [
  "This song always gets me in the right mood!",
  "Classic choice that I hope everyone appreciates.",
  "A bit obscure but worth discovering.",
  "I've loved this one since I was a kid.",
  "Perfect for this theme, couldn't resist.",
  "Taking a risk here but I believe in it.",
  "This one's a personal favorite.",
  "Hope you all enjoy this hidden gem!",
  "Couldn't think of a better fit.",
  "This brings back so many memories.",
  "",
  "",
  "", // Some empty comments for realism
];

// ============================================================================
// Sample Vote Comments
// ============================================================================

const VOTE_COMMENTS = [
  "Absolute banger!",
  "Great choice, love this one.",
  "Never heard this before but it's amazing!",
  "Classic! Can't go wrong with this.",
  "This is exactly what I expected from you.",
  "Solid pick, well done.",
  "Surprised me in the best way.",
  "Perfect song for the theme.",
  "Had to give this max points.",
  "Really digging this selection.",
  "",
  "",
  "",
  "", // Many empty comments for realism
];

// ============================================================================
// Utility Functions
// ============================================================================

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateExternalId(): string {
  return `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatDate(date: Date): string {
  return date.toISOString();
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

// ============================================================================
// CSV Generators
// ============================================================================

export interface GeneratedRoundData {
  round: RoundRow;
  submissions: SubmissionRow[];
  votes: VoteRow[];
}

export interface GenerationOptions {
  /** Starting date for the season */
  startDate?: Date;
  /** Days between rounds */
  daysBetweenRounds?: number;
  /** Max points per vote (Music League style: 1-10) */
  maxPointsPerVote?: number;
  /** Generate votes for all submissions */
  includeVotes?: boolean;
}

/**
 * Generate competitors.csv data from test users.
 */
export function generateCompetitors(users: TestUser[] = TEST_USERS): CompetitorRow[] {
  return users.map((user) => ({
    ID: user.competitorId,
    Name: user.name,
  }));
}

/**
 * Generate a single round with submissions and votes.
 */
export function generateRound(
  roundNumber: number,
  users: TestUser[],
  options: GenerationOptions = {}
): GeneratedRoundData {
  const {
    startDate = new Date(),
    daysBetweenRounds = 14,
    maxPointsPerVote = 10,
    includeVotes = true,
  } = options;

  // Select theme
  const theme = ROUND_THEMES[roundNumber % ROUND_THEMES.length];
  const roundId = generateExternalId();
  const roundStartDate = addDays(startDate, roundNumber * daysBetweenRounds);

  // Get songs for this round (one per user)
  const songs = getDecadeBalancedSongs(users.length);

  // Generate round row
  const round: RoundRow = {
    ID: roundId,
    Created: formatDate(roundStartDate),
    Name: theme.name,
    Description: theme.description,
    "Playlist URL": `https://open.spotify.com/playlist/test-playlist-${roundNumber}`,
  };

  // Generate submissions (one per user)
  const submissions: SubmissionRow[] = users.map((user, index) => {
    const song = songs[index];
    const submissionTime = addHours(roundStartDate, 2 + index * 12); // Staggered submissions

    return {
      "Spotify URI": song.uri,
      Title: song.title,
      Album: song.album,
      "Artist(s)": song.artist,
      "Submitter ID": user.competitorId,
      Created: formatDate(submissionTime),
      Comment: randomElement(SUBMISSION_COMMENTS),
      "Round ID": roundId,
      "Visible To Voters": "true",
    };
  });

  // Generate votes (each user votes on all other submissions)
  const votes: VoteRow[] = [];
  if (includeVotes) {
    for (const voter of users) {
      // Get submissions not by this voter
      const otherSubmissions = submissions.filter(
        (sub) => sub["Submitter ID"] !== voter.competitorId
      );

      // Distribute points (not uniform - some favorites, some low scores)
      const pointsPool = generateVotePoints(otherSubmissions.length, maxPointsPerVote);
      const voteTime = addDays(roundStartDate, 7); // Voting happens a week later

      otherSubmissions.forEach((submission, index) => {
        votes.push({
          "Spotify URI": submission["Spotify URI"],
          "Voter ID": voter.competitorId,
          Created: formatDate(addHours(voteTime, voter.id.charCodeAt(voter.id.length - 1) % 24)),
          "Points Assigned": String(pointsPool[index]),
          Comment: randomElement(VOTE_COMMENTS),
          "Round ID": roundId,
        });
      });
    }
  }

  return { round, submissions, votes };
}

/**
 * Generate realistic vote point distribution.
 * Not uniform - creates favorites and lower scores.
 */
function generateVotePoints(count: number, maxPoints: number): number[] {
  const points: number[] = [];

  for (let i = 0; i < count; i++) {
    // Weighted towards middle values with some extremes
    const rand = Math.random();
    let value: number;
    if (rand < 0.1) {
      value = maxPoints; // 10% chance of max points
    } else if (rand < 0.2) {
      value = 1 + Math.floor(Math.random() * 3); // 10% low scores (1-3)
    } else {
      value = 4 + Math.floor(Math.random() * 5); // 80% middle scores (4-8)
    }
    points.push(value);
  }

  return points.sort(() => Math.random() - 0.5); // Shuffle
}

/**
 * Generate a complete season with multiple rounds.
 */
export function generateSeason(
  roundCount: number,
  users: TestUser[] = TEST_USERS,
  options: GenerationOptions = {}
): {
  rounds: RoundRow[];
  submissions: SubmissionRow[];
  votes: VoteRow[];
  competitors: CompetitorRow[];
} {
  const rounds: RoundRow[] = [];
  const submissions: SubmissionRow[] = [];
  const votes: VoteRow[] = [];

  for (let i = 0; i < roundCount; i++) {
    const roundData = generateRound(i, users, options);
    rounds.push(roundData.round);
    submissions.push(...roundData.submissions);
    votes.push(...roundData.votes);
  }

  const competitors = generateCompetitors(users);

  return { rounds, submissions, votes, competitors };
}

/**
 * Convert array of objects to CSV string.
 */
export function toCSV<T extends Record<string, unknown>>(rows: T[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = String(row[header] ?? "");
          // Escape quotes and wrap in quotes if contains comma
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    ),
  ];

  return lines.join("\n");
}

/**
 * Generate all 4 CSV files as strings.
 */
export function generateAllCSVs(
  roundCount: number,
  users: TestUser[] = TEST_USERS,
  options: GenerationOptions = {}
): {
  roundsCSV: string;
  submissionsCSV: string;
  votesCSV: string;
  competitorsCSV: string;
} {
  const { rounds, submissions, votes, competitors } = generateSeason(
    roundCount,
    users,
    options
  );

  return {
    roundsCSV: toCSV(rounds),
    submissionsCSV: toCSV(submissions),
    votesCSV: toCSV(votes),
    competitorsCSV: toCSV(competitors),
  };
}
