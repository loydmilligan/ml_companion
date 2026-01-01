/**
 * Type Definitions for History/Round Features
 *
 * Centralized type definitions for round history, card grids,
 * and related data structures used throughout the Music League Companion App.
 */

/**
 * Trophy placement for competition results
 */
export type TrophyPlacement = 1 | 2 | 3;

/**
 * Trophy metadata including color and label
 */
export interface TrophyInfo {
  place: TrophyPlacement;
  color: string;
  label: "Gold" | "Silver" | "Bronze";
  emoji: string;
}

/**
 * Trophy color palette
 */
export const TROPHY_COLORS: Record<TrophyPlacement, string> = {
  1: "#FFD700", // Gold
  2: "#C0C0C0", // Silver
  3: "#CD7F32", // Bronze
} as const;

/**
 * User's submission in a round
 */
export interface UserSubmission {
  /** Song title */
  title: string;
  /** Artist name */
  artist?: string;
  /** Album artwork URL */
  artworkUrl?: string;
  /** Competition placement (1st, 2nd, or 3rd) */
  placement?: TrophyPlacement;
  /** Spotify/Apple Music URI */
  trackUri?: string;
  /** External link to the song */
  link?: string;
  /** Points received */
  points?: number;
}

/**
 * Round status from database
 */
export type RoundStatus = "draft" | "open" | "voting" | "revealed" | "archived";

/**
 * Complete round data for card grid display
 */
export interface RoundCardData {
  /** Unique round identifier */
  id: string;

  /** Round theme title */
  theme: string;

  /** Optional theme description/context */
  themeDescription?: string;

  /** Theme banner image URL */
  themeImageUrl?: string;

  /** Season number */
  seasonNumber?: number;

  /** Round number within season */
  roundNumber?: number;

  /** Round status */
  status?: RoundStatus;

  /** Winner's display name */
  winnerName?: string;

  /** Winning song title */
  winnerSong?: string;

  /** Winning song artist */
  winnerArtist?: string;

  /** Winning song artwork URL */
  winnerArtworkUrl?: string;

  /** User's submission (if participated) */
  yourSubmission?: UserSubmission;

  /** Total number of submissions in round */
  totalSubmissions: number;

  /** Did the user participate? */
  yourParticipation: boolean;

  /** Round creation timestamp (ISO 8601) */
  createdAt: string;

  /** Submission deadline (ISO 8601) */
  submissionDeadline?: string;

  /** Voting deadline (ISO 8601) */
  votingDeadline?: string;

  /** Theme author/selector */
  themeAuthor?: string;
}

/**
 * Filter type for round card grid
 */
export type RoundFilterType = "all" | "wins" | "participated" | "season";

/**
 * Sort type for round card grid
 */
export type RoundSortType = "recent" | "oldest" | "wins" | "submissions";

/**
 * Stats summary for rounds display
 */
export interface RoundStats {
  /** Total number of rounds */
  totalRounds: number;
  /** Number of wins (1st place) */
  wins: number;
  /** Number of rounds participated in */
  participated: number;
  /** Available seasons (unique season numbers) */
  seasons: number[];
  /** Average placement when participated */
  averagePlacement?: number;
  /** Total points earned */
  totalPoints?: number;
}

/**
 * Detailed round information (for detail view)
 */
export interface RoundDetail extends RoundCardData {
  /** All submissions in the round */
  submissions: RoundSubmission[];
  /** All votes cast in the round */
  votes: RoundVote[];
  /** Round awards/achievements */
  awards?: RoundAward[];
  /** AI-generated narrative */
  narrative?: string;
  /** Winners illustration URL */
  winnersImageUrl?: string;
  /** Is winners image visible to users? */
  winnersImageVisible?: boolean;
}

/**
 * Submission data structure
 */
export interface RoundSubmission {
  id: string;
  title: string;
  artist?: string;
  link?: string;
  submitterName?: string;
  artworkUrl?: string;
  releaseYear?: number;
  genres?: string;
  sourceUri?: string;
  createdAt: string;
  /** Calculated total points */
  points?: number;
}

/**
 * Vote data structure
 */
export interface RoundVote {
  submissionId: string;
  voterName?: string;
  points?: number;
  comment?: string;
  createdAt?: string;
}

/**
 * Round award/achievement
 */
export interface RoundAward {
  id: string;
  awardId?: number;
  awardName: string;
  awardDescription?: string;
  trophyUrl?: string;
  winnerName?: string;
  visible?: boolean;
}

/**
 * Season summary statistics
 */
export interface SeasonStats {
  /** Season identifier */
  seasonNumber: number;
  /** Season name */
  seasonName?: string;
  /** Total rounds in season */
  totalRounds: number;
  /** Total submissions across all rounds */
  totalSubmissions: number;
  /** Total votes cast */
  totalVotes: number;
  /** Top performing tracks */
  topTracks: TopTrack[];
  /** User's performance in this season */
  yourPerformance?: UserSeasonPerformance;
}

/**
 * Top track data
 */
export interface TopTrack {
  title: string;
  artist?: string;
  artworkUrl?: string;
  points: number;
  submitterName?: string;
}

/**
 * User performance in a season
 */
export interface UserSeasonPerformance {
  /** Rounds participated in */
  roundsParticipated: number;
  /** Total points earned */
  totalPoints: number;
  /** Number of 1st place finishes */
  firstPlace: number;
  /** Number of 2nd place finishes */
  secondPlace: number;
  /** Number of 3rd place finishes */
  thirdPlace: number;
  /** Average placement */
  averagePlacement: number;
  /** Favorite genre submitted */
  favoriteGenre?: string;
}

/**
 * Transformation utilities type definitions
 */

/**
 * Transform Supabase round row to RoundCardData
 */
export type RoundRowTransformer = (
  round: any,
  submissions?: RoundSubmission[],
  votes?: RoundVote[],
  currentUserName?: string
) => RoundCardData;

/**
 * Calculate stats from rounds array
 */
export type StatsCalculator = (rounds: RoundCardData[]) => RoundStats;

/**
 * Filter predicate for rounds
 */
export type RoundFilterPredicate = (
  round: RoundCardData,
  filterType: RoundFilterType,
  selectedSeason?: number
) => boolean;

/**
 * Sort comparator for rounds
 */
export type RoundSortComparator = (
  a: RoundCardData,
  b: RoundCardData,
  sortType: RoundSortType
) => number;

/**
 * Helper function type for calculating placement
 */
export type PlacementCalculator = (
  submissionId: string,
  submissions: RoundSubmission[],
  votes: RoundVote[]
) => TrophyPlacement | undefined;

/**
 * Constants
 */

/**
 * Trophy labels and emojis
 */
export const TROPHY_INFO: Record<TrophyPlacement, TrophyInfo> = {
  1: { place: 1, color: TROPHY_COLORS[1], label: "Gold", emoji: "🥇" },
  2: { place: 2, color: TROPHY_COLORS[2], label: "Silver", emoji: "🥈" },
  3: { place: 3, color: TROPHY_COLORS[3], label: "Bronze", emoji: "🥉" },
} as const;

/**
 * Default filter option
 */
export const DEFAULT_FILTER: RoundFilterType = "all";

/**
 * Default sort option
 */
export const DEFAULT_SORT: RoundSortType = "recent";

/**
 * Minimum rounds required for meaningful stats
 */
export const MIN_ROUNDS_FOR_STATS = 3;

/**
 * Type guards
 */

/**
 * Check if a round has trophy placement
 */
export function hasTrophyPlacement(round: RoundCardData): boolean {
  return round.yourSubmission?.placement !== undefined;
}

/**
 * Check if user participated in round
 */
export function isParticipated(round: RoundCardData): boolean {
  return round.yourParticipation;
}

/**
 * Check if round is from a specific season
 */
export function isFromSeason(round: RoundCardData, season: number): boolean {
  return round.seasonNumber === season;
}

/**
 * Check if trophy placement is valid
 */
export function isValidTrophyPlacement(
  placement: any
): placement is TrophyPlacement {
  return placement === 1 || placement === 2 || placement === 3;
}

/**
 * Check if round status is completed
 */
export function isRoundCompleted(status?: RoundStatus): boolean {
  return status === "revealed" || status === "archived";
}

/**
 * Utility type for partial round updates
 */
export type RoundCardDataUpdate = Partial<Omit<RoundCardData, "id">>;

/**
 * Utility type for creating new rounds (without generated fields)
 */
export type NewRoundCardData = Omit<
  RoundCardData,
  "id" | "createdAt" | "yourParticipation" | "totalSubmissions"
>;
