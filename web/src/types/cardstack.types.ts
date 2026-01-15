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
export type CardType = "round" | "season-recap" | "current-season" | "preseason-special";

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
  /** Spotify playlist URL (legacy field) */
  playlistUrl: string | null;
  /** Spotify playlist URL */
  spotifyPlaylistUrl?: string | null;
  /** YouTube playlist URL */
  youtubePlaylistUrl?: string | null;
  /** Submitter guess minigame results (top guessers) */
  minigameResults?: MinigameGuesser[];
  /** Per-round voting patterns (who gave most/least to whom) */
  votingPatterns?: VotingPattern[];
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
  /** League ID for admin actions */
  leagueId: string;
  /** Season-opening narrative */
  seasonIntro: string;
  /** Round-two riff */
  roundTwoRiff: string;
  /** Minigame results summary */
  minigameSummary: string;
}

/**
 * Pre-season special card data (one-time intro card before votes)
 */
export interface PreseasonSpecialCardData {
  /** Unique identifier */
  id: string;
  /** Card type discriminator */
  type: "preseason-special";
  /** Season number */
  seasonNumber: number;
  /** League/season name */
  leagueName: string;
  /** Round theme */
  roundTheme: string;
  /** Season opening monologue */
  openingMonologue: string;
  /** The submission board analysis */
  submissionBoard: string;
  /** Artist and taste tells */
  tasteTells: string;
  /** Theme fit analysis */
  themeFit: string;
  /** Timing and energy observations */
  timingEnergy: string;
  /** Pre-vote predictions */
  predictions: string;
  /** Soft power rankings */
  powerRankings: string;
}

/**
 * Union type for all card types
 */
export type CardData = RoundCardData | SeasonRecapCardData | CurrentSeasonCardData | PreseasonSpecialCardData;

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
 * Type guard for PreseasonSpecialCardData
 */
export function isPreseasonSpecialCard(card: CardData): card is PreseasonSpecialCardData {
  return card.type === "preseason-special";
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
  /** Generate winners image only (separate from story to avoid timeout) */
  onGenerateWinnersImage?: (roundId: string) => Promise<void>;
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
  /** Currently generating winners image for this round */
  isWinnersImageLoading?: boolean;
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
  /** Expose navigation function to parent */
  onGoToCard?: (callback: (index: number) => void) => void;
  /** Is the current user an admin (lead) */
  isLead?: boolean;
  /** Admin generation callbacks */
  adminCallbacks?: AdminGenerationCallbacks;
  /** Generation state per round ID */
  generationState?: Map<string, AdminGenerationState>;
  /** Callback to regenerate current season story */
  onRegenerateCurrentSeasonStory?: (leagueId: string) => Promise<void>;
  /** Is current season story being regenerated */
  currentSeasonStoryLoading?: boolean;
  /** Current season story status message */
  currentSeasonStoryStatus?: string | null;
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
  /** Is the current user an admin (lead) */
  isLead?: boolean;
  /** Callback to regenerate story */
  onRegenerateStory?: (leagueId: string) => Promise<void>;
  /** Is story currently being regenerated */
  isStoryLoading?: boolean;
  /** Status message */
  storyStatus?: string | null;
}

/**
 * PreseasonSpecialCard component props
 */
export interface PreseasonSpecialCardProps extends CardComponentProps {
  /** Pre-season special data */
  data: PreseasonSpecialCardData;
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
