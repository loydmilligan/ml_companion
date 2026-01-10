/**
 * TEST-001: Sample Songs Pool
 *
 * Curated collection of 50+ real Spotify tracks spanning decades.
 * Used for generating realistic test submissions with actual artwork.
 *
 * Criteria for selection:
 * - Real Spotify URIs that resolve to actual tracks
 * - Variety of genres for diverse test scenarios
 * - Spread across decades for Timeline Game testing
 * - Mix of popular and obscure tracks
 */

export interface SampleSong {
  /** Spotify track URI (e.g., "spotify:track:xxx") */
  uri: string;
  /** Track title */
  title: string;
  /** Artist name(s) */
  artist: string;
  /** Album name */
  album: string;
  /** Release year (for Timeline Game) */
  releaseYear: number;
  /** Primary genre/style */
  genre: string;
}

/**
 * Pool of sample songs organized by decade.
 * All URIs are real Spotify tracks.
 */
export const SAMPLE_SONGS: SampleSong[] = [
  // ============================================================================
  // 1960s - Classic Rock, Soul, Motown
  // ============================================================================
  {
    uri: "spotify:track:0nJW01T7XtvILxQgC5J7Wh",
    title: "Respect",
    artist: "Aretha Franklin",
    album: "I Never Loved a Man the Way I Love You",
    releaseYear: 1967,
    genre: "Soul",
  },
  {
    uri: "spotify:track:3RiPr603aXAq4GU2P7skks",
    title: "A Day in the Life",
    artist: "The Beatles",
    album: "Sgt. Pepper's Lonely Hearts Club Band",
    releaseYear: 1967,
    genre: "Rock",
  },
  {
    uri: "spotify:track:6dGnYIeXmHdcikdzNNDMm2",
    title: "Gimme Shelter",
    artist: "The Rolling Stones",
    album: "Let It Bleed",
    releaseYear: 1969,
    genre: "Rock",
  },
  {
    uri: "spotify:track:5CQ30WqJwcep0pYcV4AMNc",
    title: "Somebody to Love",
    artist: "Jefferson Airplane",
    album: "Surrealistic Pillow",
    releaseYear: 1967,
    genre: "Psychedelic Rock",
  },
  {
    uri: "spotify:track:7oK9VyNzrYvRFo7nQEYkWN",
    title: "My Girl",
    artist: "The Temptations",
    album: "The Temptations Sing Smokey",
    releaseYear: 1965,
    genre: "Motown",
  },

  // ============================================================================
  // 1970s - Classic Rock, Disco, Punk
  // ============================================================================
  {
    uri: "spotify:track:4LRPiXqCikLlN15c3yImP7",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    album: "A Night at the Opera",
    releaseYear: 1975,
    genre: "Rock",
  },
  {
    uri: "spotify:track:7snQQk1zcKl8gZ92AnueZW",
    title: "Stairway to Heaven",
    artist: "Led Zeppelin",
    album: "Led Zeppelin IV",
    releaseYear: 1971,
    genre: "Rock",
  },
  {
    uri: "spotify:track:0RDJHkV20vJpXLx5GOWSD7",
    title: "Hotel California",
    artist: "Eagles",
    album: "Hotel California",
    releaseYear: 1977,
    genre: "Rock",
  },
  {
    uri: "spotify:track:2aoo2jlRnM3A0NyLQqMN2f",
    title: "Stayin' Alive",
    artist: "Bee Gees",
    album: "Saturday Night Fever",
    releaseYear: 1977,
    genre: "Disco",
  },
  {
    uri: "spotify:track:7F7K7rJzMa4dFSyHHrqvEJ",
    title: "Blitzkrieg Bop",
    artist: "Ramones",
    album: "Ramones",
    releaseYear: 1976,
    genre: "Punk",
  },
  {
    uri: "spotify:track:0GjEhVFGZW8afUYGChu3Rr",
    title: "Dreams",
    artist: "Fleetwood Mac",
    album: "Rumours",
    releaseYear: 1977,
    genre: "Rock",
  },
  {
    uri: "spotify:track:2TjdnqlpwOjhijHCwHCP2d",
    title: "Heroes",
    artist: "David Bowie",
    album: "Heroes",
    releaseYear: 1977,
    genre: "Art Rock",
  },

  // ============================================================================
  // 1980s - New Wave, Pop, Hair Metal, Hip-Hop
  // ============================================================================
  {
    uri: "spotify:track:2grjqo0Frpf2okIBiifQKs",
    title: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    album: "Appetite for Destruction",
    releaseYear: 1987,
    genre: "Hard Rock",
  },
  {
    uri: "spotify:track:1Cwn4EQE6lWIzAOEwZxzS4",
    title: "Take On Me",
    artist: "a-ha",
    album: "Hunting High and Low",
    releaseYear: 1985,
    genre: "Synth-pop",
  },
  {
    uri: "spotify:track:2WfaOiMkCvy7F5fcp2zZ8L",
    title: "Billie Jean",
    artist: "Michael Jackson",
    album: "Thriller",
    releaseYear: 1982,
    genre: "Pop",
  },
  {
    uri: "spotify:track:7lQlP72SJ4O1iVPTgs7MRy",
    title: "Blue Monday",
    artist: "New Order",
    album: "Power, Corruption & Lies",
    releaseYear: 1983,
    genre: "Electronic",
  },
  {
    uri: "spotify:track:2PpruBYCo4H7WOBJ7Q2EwM",
    title: "Walk This Way",
    artist: "Run-D.M.C.",
    album: "Raising Hell",
    releaseYear: 1986,
    genre: "Hip-Hop",
  },
  {
    uri: "spotify:track:3AA28KZvwAUcZuOKwyblJQ",
    title: "Every Breath You Take",
    artist: "The Police",
    album: "Synchronicity",
    releaseYear: 1983,
    genre: "Rock",
  },
  {
    uri: "spotify:track:7hQJA50XrCWABAu5v6QZ4i",
    title: "Don't Stop Believin'",
    artist: "Journey",
    album: "Escape",
    releaseYear: 1981,
    genre: "Rock",
  },

  // ============================================================================
  // 1990s - Grunge, Alternative, Hip-Hop, R&B
  // ============================================================================
  {
    uri: "spotify:track:1f3yAtsJtY87CTmM8RLnxf",
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    album: "Nevermind",
    releaseYear: 1991,
    genre: "Grunge",
  },
  {
    uri: "spotify:track:5ihDGnhQgMA0F0tk9fNLlA",
    title: "Creep",
    artist: "Radiohead",
    album: "Pablo Honey",
    releaseYear: 1993,
    genre: "Alternative Rock",
  },
  {
    uri: "spotify:track:1xQ6trAsedVPCdbtDAmk0c",
    title: "Wonderwall",
    artist: "Oasis",
    album: "(What's the Story) Morning Glory?",
    releaseYear: 1995,
    genre: "Britpop",
  },
  {
    uri: "spotify:track:3YRCqOhFifThpSRFJ1VWFM",
    title: "Losing My Religion",
    artist: "R.E.M.",
    album: "Out of Time",
    releaseYear: 1991,
    genre: "Alternative Rock",
  },
  {
    uri: "spotify:track:1v9rVNH8zSzexEWNs8QJCW",
    title: "Nuthin' but a 'G' Thang",
    artist: "Dr. Dre",
    album: "The Chronic",
    releaseYear: 1992,
    genre: "Hip-Hop",
  },
  {
    uri: "spotify:track:0ofHAoxe9vBkTCp2UQIavz",
    title: "No Diggity",
    artist: "Blackstreet",
    album: "Another Level",
    releaseYear: 1996,
    genre: "R&B",
  },
  {
    uri: "spotify:track:3AJwUDP919kvQ9QcozQPxg",
    title: "Bitter Sweet Symphony",
    artist: "The Verve",
    album: "Urban Hymns",
    releaseYear: 1997,
    genre: "Britpop",
  },
  {
    uri: "spotify:track:4pbJqGIASGPr0ZpGpnWkDn",
    title: "Zombie",
    artist: "The Cranberries",
    album: "No Need to Argue",
    releaseYear: 1994,
    genre: "Alternative Rock",
  },

  // ============================================================================
  // 2000s - Indie, Pop-Punk, Hip-Hop, R&B
  // ============================================================================
  {
    uri: "spotify:track:5W3cjX2J3tjhG8zb6u0qHn",
    title: "Seven Nation Army",
    artist: "The White Stripes",
    album: "Elephant",
    releaseYear: 2003,
    genre: "Garage Rock",
  },
  {
    uri: "spotify:track:40riOy7x9W7GXjyGp4pjAv",
    title: "Mr. Brightside",
    artist: "The Killers",
    album: "Hot Fuss",
    releaseYear: 2004,
    genre: "Indie Rock",
  },
  {
    uri: "spotify:track:5UWwZ5lm5PKu6eKsHAGxOk",
    title: "Crazy in Love",
    artist: "Beyoncé",
    album: "Dangerously in Love",
    releaseYear: 2003,
    genre: "R&B",
  },
  {
    uri: "spotify:track:5rb9QrpfcKFHM1EUbSIurX",
    title: "In da Club",
    artist: "50 Cent",
    album: "Get Rich or Die Tryin'",
    releaseYear: 2003,
    genre: "Hip-Hop",
  },
  {
    uri: "spotify:track:7LVHVU3tWfcxj5aiPFEW4Q",
    title: "Float On",
    artist: "Modest Mouse",
    album: "Good News for People Who Love Bad News",
    releaseYear: 2004,
    genre: "Indie Rock",
  },
  {
    uri: "spotify:track:0VjIjW4GlUZAMYd2vXMi3b",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    releaseYear: 2020,
    genre: "Synth-pop",
  },
  {
    uri: "spotify:track:7GhIk7Il098yCjg4BQjzvb",
    title: "Feel Good Inc.",
    artist: "Gorillaz",
    album: "Demon Days",
    releaseYear: 2005,
    genre: "Alternative",
  },
  {
    uri: "spotify:track:3fagBCm6Kvp2G4LgUHzA8v",
    title: "Toxic",
    artist: "Britney Spears",
    album: "In the Zone",
    releaseYear: 2004,
    genre: "Pop",
  },

  // ============================================================================
  // 2010s - Indie, Pop, Hip-Hop, Electronic
  // ============================================================================
  {
    uri: "spotify:track:60nZcImufyMA1MKQY3dcCH",
    title: "Happy",
    artist: "Pharrell Williams",
    album: "G I R L",
    releaseYear: 2014,
    genre: "Pop",
  },
  {
    uri: "spotify:track:7qiZfU4dY1lWllzX7mPBI4",
    title: "Shape of You",
    artist: "Ed Sheeran",
    album: "÷",
    releaseYear: 2017,
    genre: "Pop",
  },
  {
    uri: "spotify:track:2Fxmhks0bxGSBdJ92vM42m",
    title: "bad guy",
    artist: "Billie Eilish",
    album: "WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?",
    releaseYear: 2019,
    genre: "Pop",
  },
  {
    uri: "spotify:track:3a1lNhkSLSkpJE4MSHpDu9",
    title: "Uptown Funk",
    artist: "Mark Ronson ft. Bruno Mars",
    album: "Uptown Special",
    releaseYear: 2015,
    genre: "Funk",
  },
  {
    uri: "spotify:track:1zi7xx7UVEFkmKfv06H8x0",
    title: "Somebody That I Used to Know",
    artist: "Gotye",
    album: "Making Mirrors",
    releaseYear: 2011,
    genre: "Indie Pop",
  },
  {
    uri: "spotify:track:2dpaYNEQHiRxtZbfNsse99",
    title: "Royals",
    artist: "Lorde",
    album: "Pure Heroine",
    releaseYear: 2013,
    genre: "Electropop",
  },
  {
    uri: "spotify:track:2HbKqm4o0w5wEeEFXm2sD4",
    title: "Humble",
    artist: "Kendrick Lamar",
    album: "DAMN.",
    releaseYear: 2017,
    genre: "Hip-Hop",
  },
  {
    uri: "spotify:track:1mCsF9Tw4AkIZOjvZbZZdT",
    title: "Tame Impala",
    artist: "The Less I Know the Better",
    album: "Currents",
    releaseYear: 2015,
    genre: "Psychedelic Pop",
  },

  // ============================================================================
  // 2020s - Modern Pop, Hip-Hop, Alternative
  // ============================================================================
  {
    uri: "spotify:track:5QO79kh1waicV47BqGRL3g",
    title: "Save Your Tears",
    artist: "The Weeknd",
    album: "After Hours",
    releaseYear: 2020,
    genre: "Synth-pop",
  },
  {
    uri: "spotify:track:0VgkVdmE4gld66l8iyGjgx",
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    releaseYear: 2020,
    genre: "Disco-pop",
  },
  {
    uri: "spotify:track:3Wrjm47oTz2sjIgck11l5e",
    title: "good 4 u",
    artist: "Olivia Rodrigo",
    album: "SOUR",
    releaseYear: 2021,
    genre: "Pop-punk",
  },
  {
    uri: "spotify:track:4Dvkj6JhhA12EX05fT7y2e",
    title: "As It Was",
    artist: "Harry Styles",
    album: "Harry's House",
    releaseYear: 2022,
    genre: "Pop",
  },
  {
    uri: "spotify:track:1BxfuPKGuaTgP7aM0Bbdwr",
    title: "Peaches",
    artist: "Justin Bieber",
    album: "Justice",
    releaseYear: 2021,
    genre: "R&B",
  },
  {
    uri: "spotify:track:4iJyoBOLtHBvfT8Oy7GMbz",
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    album: "Fine Line",
    releaseYear: 2019,
    genre: "Pop Rock",
  },
  {
    uri: "spotify:track:6I3mqTwhRpn34SLVafSH7G",
    title: "Lose Yourself to Dance",
    artist: "Daft Punk",
    album: "Random Access Memories",
    releaseYear: 2013,
    genre: "Disco",
  },
];

/**
 * Get a random sample of songs from the pool.
 * Ensures variety across decades for Timeline Game testing.
 */
export function getRandomSongs(count: number): SampleSong[] {
  const shuffled = [...SAMPLE_SONGS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, SAMPLE_SONGS.length));
}

/**
 * Get songs from specific decade range.
 */
export function getSongsByDecade(startYear: number, endYear: number): SampleSong[] {
  return SAMPLE_SONGS.filter(
    (song) => song.releaseYear >= startYear && song.releaseYear <= endYear
  );
}

/**
 * Get songs ensuring variety across all decades.
 * Useful for Timeline Game testing.
 */
export function getDecadeBalancedSongs(count: number): SampleSong[] {
  const decades = [
    { start: 1960, end: 1969 },
    { start: 1970, end: 1979 },
    { start: 1980, end: 1989 },
    { start: 1990, end: 1999 },
    { start: 2000, end: 2009 },
    { start: 2010, end: 2019 },
    { start: 2020, end: 2029 },
  ];

  const perDecade = Math.ceil(count / decades.length);
  const result: SampleSong[] = [];

  for (const decade of decades) {
    const decadeSongs = getSongsByDecade(decade.start, decade.end);
    const shuffled = decadeSongs.sort(() => Math.random() - 0.5);
    result.push(...shuffled.slice(0, perDecade));
  }

  // Shuffle and trim to exact count
  return result.sort(() => Math.random() - 0.5).slice(0, count);
}

/**
 * Get Spotify track ID from URI.
 */
export function getTrackIdFromUri(uri: string): string {
  return uri.replace("spotify:track:", "");
}

/**
 * Get Spotify link from URI.
 */
export function getSpotifyLink(uri: string): string {
  const trackId = getTrackIdFromUri(uri);
  return `https://open.spotify.com/track/${trackId}`;
}
