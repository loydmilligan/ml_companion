/**
 * CardStack Type Definitions
 *
 * Types for the swipeable card stack history view.
 * Extends history.types.ts with card-specific structures.
 */

import type {
  RoundSubmission,
  RoundAward,
  TopTrack,
  RoundStatus,
} from "./history.types";

/**
 * Card type discriminator
 */
export type CardType = "round" | "season-recap" | "current-season";

/**
 * Submission with calculated vote points
 */
export interface SubmissionWithVotes extends RoundSubmission {
  /** Total points from all votes */
  totalPoints: number;
  /** Number of votes received */
  voteCount: number;
}

/**
 * Minigame guesser result entry
 */
export interface MinigameGuesser {
  /** Guesser name */
  name: string;
  /** Number of correct guesses */
  correctCount: number;
  /** Total guesses made */
  totalGuesses: number;
}

/**
 * Round card data for the cardstack view
 */
export interface RoundCardData {
  /** Unique identifier */
  id: string;
  /** Card type discriminator */
  type: "round";
  /** Round theme title */
  theme: string;
  /** Theme description/context */
  themeDescription: string | null;
  /** Who selected the theme */
  themeAuthor: string | null;
  /** Theme banner image URL */
  themeImageUrl: string | null;
  /** AI-generated winners illustration URL */
  winnersImageUrl: string | null;
  /** Round number within season */
  roundNumber: number | null;
  /** Season number */
  seasonNumber: number | null;
  /** Round status */
  status: RoundStatus;
  /** All submissions with vote totals */
  submissions: SubmissionWithVotes[];
  /** Round awards */
  awards: RoundAward[];
  /** AI-generated narrative text */
  narrative: string | null;
  /** Quick stats */
  stats: RoundStats;
  /** Spotify playlist URL */
  playlistUrl: string | null;
  /** Submitter guess minigame results (top guessers) */
  minigameResults?: MinigameGuesser[];
}

/**
 * Quick statistics for a round
 */
export interface RoundStats {
  /** Number of songs submitted */
  songs: number;
  /** Total votes/points cast */
  votes: number;
  /** Number of participants */
  players: number;
}

/**
 * Player standing in season leaderboard
 */
export interface LeaderboardEntry {
  /** Player name */
  name: string;
  /** Total points earned in season */
  totalPoints: number;
  /** Number of round wins (1st place) */
  wins: number;
  /** Rank position */
  rank: number;
}

/**
 * Voting pattern between two players
 */
export interface VotingPattern {
  /** Voter name */
  voterName: string;
  /** Target player name */
  targetName: string;
  /** Total points given */
  pointsGiven: number;
  /** Type: most or least */
  type: "most" | "least";
}

/**
 * Genre or decade distribution item
 */
export interface DistributionItem {
  /** Genre name or decade (e.g., "Rock" or "1980s") */
  label: string;
  /** Count of submissions */
  count: number;
  /** Percentage of total */
  percentage: number;
}

/**
 * Season award (similar to round award)
 */
export interface SeasonAward {
  /** Award name */
  awardName: string;
  /** Award description */
  awardDescription?: string;
  /** Trophy image URL */
  trophyUrl?: string;
  /** Winner name */
  winnerName?: string;
}

/**
 * Season recap card data for past seasons
 */
export interface SeasonRecapCardData {
  /** Unique identifier (season-{leagueId}) */
  id: string;
  /** Card type discriminator */
  type: "season-recap";
  /** Season number */
  seasonNumber: number;
  /** League/season name */
  leagueName: string;
  /** Total rounds completed */
  totalRounds: number;
  /** Total songs submitted */
  totalSubmissions: number;
  /** Total votes/points cast */
  totalVotes: number;
  /** Top tracks of the season */
  topTracks: TopTrack[];
  /** List of round theme names */
  roundThemes: string[];
  /** Season leaderboard standings */
  leaderboard?: LeaderboardEntry[];
  /** Season awards */
  seasonAwards?: SeasonAward[];
  /** Voting patterns (most/least votes given) */
  votingPatterns?: VotingPattern[];
  /** Genre distribution */
  genreDistribution?: DistributionItem[];
  /** Decade distribution */
  decadeDistribution?: DistributionItem[];
  /** AI-generated season narrative */
  seasonNarrative?: string | null;
  /** Spotify playlist URL for season */
  playlistUrl?: string | null;
}

/**
 * Current season story card data
 */
export interface CurrentSeasonCardData {
  /** Unique identifier */
  id: string;
  /** Card type discriminator */
  type: "current-season";
  /** Season number */
  seasonNumber: number;
  /** League/season name */
  leagueName: string;
  /** Season-opening narrative */
  seasonIntro: string;
  /** Round-two riff */
  roundTwoRiff: string;
  /** Minigame results summary */
  minigameSummary: string;
}

/**
 * Union type for all card types
 */
export type CardData = RoundCardData | SeasonRecapCardData | CurrentSeasonCardData;

/**
 * Type guard for RoundCardData
 */
export function isRoundCard(card: CardData): card is RoundCardData {
  return card.type === "round";
}

/**
 * Type guard for SeasonRecapCardData
 */
export function isSeasonRecapCard(card: CardData): card is SeasonRecapCardData {
  return card.type === "season-recap";
}

/**
 * Type guard for CurrentSeasonCardData
 */
export function isCurrentSeasonCard(card: CardData): card is CurrentSeasonCardData {
  return card.type === "current-season";
}

/**
 * Card position in the stack (0 = top/active)
 */
export type CardPosition = 0 | 1 | 2 | 3;

/**
 * Swipe direction
 */
export type SwipeDirection = "left" | "right" | "none";

/**
 * Gesture state for drag handling
 */
export interface GestureState {
  /** Is the user currently dragging */
  isDragging: boolean;
  /** Starting X position of drag */
  startX: number;
  /** Current X offset from start */
  offsetX: number;
  /** Drag direction */
  direction: SwipeDirection;
}

/**
 * Admin generation callbacks for round cards
 */
export interface AdminGenerationCallbacks {
  /** Generate theme banner image */
  onGenerateThemeBanner?: (roundId: string) => Promise<void>;
  /** Generate round story and winners art */
  onGenerateStory?: (roundId: string) => Promise<void>;
  /** Generate awards for round */
  onGenerateAwards?: (roundId: string) => Promise<void>;
}

/**
 * Admin generation state for a round
 */
export interface AdminGenerationState {
  /** Currently generating theme banner for this round */
  isBannerLoading?: boolean;
  /** Currently generating story for this round */
  isStoryLoading?: boolean;
  /** Currently generating awards for this round */
  isAwardsLoading?: boolean;
  /** Status message */
  statusMessage?: string;
}

/**
 * CardStack component props
 */
export interface CardStackProps {
  /** Array of card data to display */
  cards: CardData[];
  /** Current card index */
  initialIndex?: number;
  /** Callback when card changes */
  onCardChange?: (index: number, card: CardData) => void;
  /** Callback when card is tapped */
  onCardTap?: (card: CardData) => void;
  /** Callback when theme is clicked in season recap (returns round index to navigate to) */
  onThemeClick?: (theme: string, seasonNumber: number) => number | null;
  /** Enable/disable swipe gestures */
  swipeEnabled?: boolean;
  /** Is the current user an admin (lead) */
  isLead?: boolean;
  /** Admin generation callbacks */
  adminCallbacks?: AdminGenerationCallbacks;
  /** Generation state per round ID */
  generationState?: Map<string, AdminGenerationState>;
}

/**
 * Individual card component props
 */
export interface CardComponentProps {
  /** Position in stack (0 = active) */
  position: CardPosition;
  /** Is this the active/top card */
  isActive: boolean;
  /** Current drag offset (for animations) */
  dragOffset?: number;
  /** Is user dragging this card */
  isDragging?: boolean;
}

/**
 * RoundCard component props
 */
export interface RoundCardProps extends CardComponentProps {
  /** Round data */
  data: RoundCardData;
  /** Is the current user an admin (lead) */
  isLead?: boolean;
  /** Admin generation callbacks */
  adminCallbacks?: AdminGenerationCallbacks;
  /** Generation state for this round */
  generationState?: AdminGenerationState;
}

/**
 * SeasonRecapCard component props
 */
export interface SeasonRecapCardProps extends CardComponentProps {
  /** Season data */
  data: SeasonRecapCardData;
  /** Callback when a theme pill is clicked */
  onThemeClick?: (theme: string) => void;
}

/**
 * CurrentSeasonCard component props
 */
export interface CurrentSeasonCardProps extends CardComponentProps {
  /** Current season story data */
  data: CurrentSeasonCardData;
}

/**
 * SwipeIndicator component props
 */
export interface SwipeIndicatorProps {
  /** Total number of cards */
  total: number;
  /** Currently active index */
  activeIndex: number;
  /** Maximum dots to show */
  maxDots?: number;
}

/**
 * Swipe threshold in pixels
 */
export const SWIPE_THRESHOLD = 80;

/**
 * Card stack transform values for each position
 */
export const CARD_TRANSFORMS: Record<CardPosition, { scale: number; translateY: number; opacity: number; zIndex: number }> = {
  0: { scale: 1, translateY: 0, opacity: 1, zIndex: 4 },
  1: { scale: 0.95, translateY: 10, opacity: 0.9, zIndex: 3 },
  2: { scale: 0.9, translateY: 20, opacity: 0.7, zIndex: 2 },
  3: { scale: 0.85, translateY: 30, opacity: 0.5, zIndex: 1 },
};

/**
 * Animation timing for card transitions
 */
export const ANIMATION_CONFIG = {
  /** Transition duration in ms */
  duration: 300,
  /** Cubic bezier for bounce effect */
  easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  /** Reduced motion easing (no bounce) */
  reducedMotionEasing: "ease-out",
};
