/**
 * TEST-001: Test Dashboard Types
 * Shared types for the testing dashboard components.
 */

// ============================================================================
// Phase Types
// ============================================================================

export type PhaseType =
  | "preseason"
  | "submission"
  | "playlist"
  | "voting"
  | "reveal"
  | "archived";

export type PhaseStatus = "future" | "current" | "complete" | "past";

export interface PhaseConfig {
  id: PhaseType;
  title: string;
  description: string;
}

export const PHASES: PhaseConfig[] = [
  {
    id: "preseason",
    title: "1. PRESEASON",
    description: "Data generation, user creation, historical import",
  },
  {
    id: "submission",
    title: "2. OPEN FOR SUBMISSION",
    description: "Users submit songs, admin entry, Spotify enrichment",
  },
  {
    id: "playlist",
    title: "3. PLAYLIST CREATED",
    description: "Spotify playlist conversion, music links generated",
  },
  {
    id: "voting",
    title: "4. VOTING PERIOD",
    description: "Users cast votes, minigames active",
  },
  {
    id: "reveal",
    title: "5. VOTES IN / REVEAL",
    description: "AI story generation, awards calculated, reveal timer",
  },
  {
    id: "archived",
    title: "6. ARCHIVED",
    description: "Round complete, full results visible",
  },
];

// ============================================================================
// Round Types
// ============================================================================

export type RoundStatus = "open" | "voting" | "revealed" | "archived";

export interface RoundState {
  id: string;
  theme: string;
  status: RoundStatus;
  submissionCount: number;
  voteCount: number;
  revealRemainingMs?: number | null;
  revealRemainingMinutes?: number | null;
  hasCustomPulltab?: boolean;
  activity?: {
    submissions: string[];
    votes: string[];
  };
}

// ============================================================================
// User Types
// ============================================================================

export interface TestUser {
  id: string;
  name: string;
  role?: string;
  avatarGenerated?: boolean;
  relationshipType?: string;
}

export const TEST_USERS: TestUser[] = [
  { id: "00000000-0000-0000-0000-000000000001", name: "Test Admin", role: "admin" },
  { id: "00000000-0000-0000-0000-000000000002", name: "Alice", relationshipType: "P-C" },
  { id: "00000000-0000-0000-0000-000000000003", name: "Bob", relationshipType: "Sib" },
  { id: "00000000-0000-0000-0000-000000000004", name: "Carol", relationshipType: "A-N" },
  { id: "00000000-0000-0000-0000-000000000005", name: "Uncle Dave", relationshipType: "Cuz" },
];

// ============================================================================
// Test State Types
// ============================================================================

export interface TestState {
  league: {
    id: string;
    name: string;
    seasonNumber: number;
    hasStory: boolean;
    storyRoundId: string | null;
  };
  rounds: RoundState[];
  members: Array<{ id: string; name: string; role: string }>;
  competitors: number;
  testUsers: Array<{ id: string; name: string }>;
}

// ============================================================================
// Log Types
// ============================================================================

export interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  success: boolean;
  details?: string;
  phase?: PhaseType;
  user?: string;
  context?: Record<string, unknown>;
}

// ============================================================================
// Simulation Types
// ============================================================================

export interface SimulationOptions {
  revealDurationMinutes?: number;
  useMockAI?: boolean;
}

// ============================================================================
// Grid Row Types
// ============================================================================

export interface SubmissionRow {
  user: TestUser;
  submitted: boolean;
  song?: string;
  artist?: string;
  spotifyLinked?: boolean;
  decadeDetected?: boolean;
}

export interface VoteRow {
  user: TestUser;
  voted: boolean;
  pointsGiven?: Array<{ recipient: string; points: number }>;
}

// ============================================================================
// Content Generation Types
// ============================================================================

export interface GeneratedContent {
  userDescriptions?: boolean;
  avatars?: boolean;
  s1CSVsReady?: boolean;
  decades?: number;
  spotifyLinks?: number;
  playlistGenerated?: boolean;
  musicServiceLinks?: boolean;
  submitterGuess?: boolean;
  timelineGame?: boolean;
  aiStory?: boolean;
  roundBanner?: boolean;
  awards?: boolean;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsSummary {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  successRate: number;
  totalActions: number;
  actionSuccessRate: number;
  actionsByType: Record<string, { total: number; success: number; avgDurationMs: number }>;
  avgRunDurationMs: number;
  avgActionDurationMs: number;
  dailyTrend: Array<{
    date: string;
    runs: number;
    successRate: number;
    avgDuration: number;
  }>;
  topErrors: Array<{ error: string; count: number }>;
  recentRuns: Array<{
    id: string;
    started_at: string;
    completed_at?: string;
    status: string;
    theme?: string;
    total_actions: number;
    successful_actions: number;
    failed_actions: number;
    duration_ms?: number;
  }>;
}

// ============================================================================
// Phase Health Types (from Analytics Spec)
// ============================================================================

export interface PhaseHealth {
  phase: PhaseType;
  totalActions: number;
  successfulActions: number;
  passRate: number;
  stabilityIndex: number;
  flakyCount: number;
  avgDurationMs: number;
  p50DurationMs: number;
  p90DurationMs: number;
  p99DurationMs: number;
  healthScore: number;
  passRateDelta?: number;
  durationDeltaPct?: number;
  lastTenResults?: boolean[];
}

// ============================================================================
// Error Cluster Types
// ============================================================================

export interface ErrorCluster {
  id: string;
  signature: string;
  category: string;
  attribution: "external_dependency" | "app_code" | "test_code" | "test_data" | "environment" | "unknown";
  occurrenceCount: number;
  affectedPhases: PhaseType[];
  affectedActions: string[];
  suggestion?: string;
  subErrors?: Array<{ message: string; count: number }>;
}

// ============================================================================
// Feature Coverage Types
// ============================================================================

export interface FeatureCoverage {
  featureKey: string;
  featureName: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  lastTestedAt?: string;
  totalRuns: number;
  successRate?: number;
  status: "good" | "flaky" | "degraded" | "stale" | "none";
}

// ============================================================================
// Regression Types
// ============================================================================

export interface RegressionEvent {
  id: string;
  subjectType: "action" | "phase" | "feature";
  subjectKey: string;
  metric: "pass_rate" | "duration" | "stability";
  previousValue: number;
  currentValue: number;
  changePct: number;
  detectedAt: string;
  status: "open" | "investigating" | "resolved" | "wont_fix";
  severity: "critical" | "high" | "medium" | "low";
}

// ============================================================================
// Constants
// ============================================================================

export const TEST_LEAGUE_S1_ID = "00000000-0000-0000-0002-000000000001";
export const TEST_LEAGUE_S2_ID = "00000000-0000-0000-0002-000000000002";
export const TEST_GROUP_ID = "00000000-0000-0000-0001-000000000001";

export const ROUND_THEMES = [
  "Songs That Make You Happy",
  "Cover Songs",
  "One-Hit Wonders",
  "Songs from Movies",
  "Deep Cuts",
  "Guilty Pleasures",
  "Summer Anthems",
];
