/**
 * TEST-001: Bulk Actions Panel Component
 *
 * Center column component for bulk operations per phase.
 * Includes generate buttons, import/upload, and bulk operations.
 */

import type { PhaseType, PhaseStatus } from "./types";

interface BulkActionsPanelProps {
  phase: PhaseType;
  status: PhaseStatus;
  loading?: boolean;
  disabled?: boolean;

  // Preseason actions
  onGenerateUsers?: () => void;
  onGenerateFamily?: () => void;
  onGenerateS1Data?: () => void;
  onProcessS1Import?: () => void;
  historicalSummary?: { rounds: number; submissions: number };

  // Submission actions
  onSubmitAll?: () => void;
  onResetAllSubs?: () => void;
  onFetchSpotifyMetadata?: () => void;
  submissionCount?: number;
  totalUsers?: number;

  // Playlist actions
  onGeneratePlaylist?: () => void;
  onCreateMusicLinks?: () => void;

  // Voting actions
  onVoteAll?: () => void;
  onResetAllVotes?: () => void;
  voteCount?: number;

  // Reveal actions
  onGenerateStory?: () => void;
  onGenerateBanner?: () => void;
  onCalculateAwards?: () => void;
  revealDurationMinutes?: number;
  onRevealDurationChange?: (minutes: number) => void;

  // Archive actions
  onArchiveRound?: () => void;
}

export default function BulkActionsPanel(props: BulkActionsPanelProps) {
  const { phase, status, disabled = status === "future" } = props;

  return (
    <div
      className="bulk-actions-panel"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        padding: "0.75rem",
        marginBottom: "0.5rem",
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          fontWeight: "bold",
          fontSize: "0.85rem",
          marginBottom: "0.75rem",
          textTransform: "uppercase",
          color: "var(--color-text-secondary)",
        }}
      >
        {getPhaseName(phase)} Actions
      </div>

      {/* Phase-specific actions */}
      {phase === "preseason" && <PreseasonActions {...props} />}
      {phase === "submission" && <SubmissionActions {...props} />}
      {phase === "playlist" && <PlaylistActions {...props} />}
      {phase === "voting" && <VotingActions {...props} />}
      {phase === "reveal" && <RevealActions {...props} />}
      {phase === "archived" && <ArchivedActions {...props} />}
    </div>
  );
}

// ============================================================================
// Preseason Actions
// ============================================================================

function PreseasonActions({
  loading,
  onGenerateUsers,
  onGenerateFamily,
  onGenerateS1Data,
  onProcessS1Import,
  historicalSummary,
}: BulkActionsPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div>
        <div style={labelStyle}>Users:</div>
        <ActionButton onClick={onGenerateUsers} loading={loading}>
          Generate Users
        </ActionButton>
      </div>

      <div>
        <div style={labelStyle}>Family:</div>
        <ActionButton onClick={onGenerateFamily} loading={loading}>
          Generate Family
        </ActionButton>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--color-border)",
          paddingTop: "0.75rem",
        }}
      >
        <div style={labelStyle}>Historical Season:</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <ActionButton onClick={onGenerateS1Data} loading={loading}>
            Generate S1 Data
          </ActionButton>
          <ActionButton onClick={onProcessS1Import} loading={loading}>
            Process S1 Import
          </ActionButton>
        </div>
        {historicalSummary && (
          <div style={summaryStyle}>
            Summary: {historicalSummary.rounds} rounds, {historicalSummary.submissions}{" "}
            submissions
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Submission Actions
// ============================================================================

function SubmissionActions({
  loading,
  onSubmitAll,
  onResetAllSubs,
  onFetchSpotifyMetadata,
  submissionCount = 0,
  totalUsers = 5,
}: BulkActionsPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={summaryStyle}>
        Submissions: {submissionCount}/{totalUsers}
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <ActionButton onClick={onSubmitAll} loading={loading}>
          Submit All Remaining
        </ActionButton>
        <ActionButton onClick={onResetAllSubs} loading={loading} variant="danger">
          Reset All Subs
        </ActionButton>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--color-border)",
          paddingTop: "0.75rem",
        }}
      >
        <div style={labelStyle}>Enrich Spotify Data:</div>
        <ActionButton onClick={onFetchSpotifyMetadata} loading={loading}>
          Fetch All Metadata
        </ActionButton>
      </div>

      <div
        style={{
          padding: "0.5rem",
          backgroundColor: "var(--color-surface-hover)",
          borderRadius: "4px",
          fontSize: "0.8rem",
        }}
      >
        <strong>Admin Self-Entry:</strong>
        <div style={{ color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
          Admin excluded from email notifications
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Playlist Actions
// ============================================================================

function PlaylistActions({
  loading,
  onGeneratePlaylist,
  onCreateMusicLinks,
}: BulkActionsPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div>
        <div style={labelStyle}>Spotify Conversion:</div>
        <ActionButton onClick={onGeneratePlaylist} loading={loading}>
          Generate Playlist
        </ActionButton>
      </div>

      <div>
        <div style={labelStyle}>Music Service Links:</div>
        <ActionButton onClick={onCreateMusicLinks} loading={loading}>
          Create Links
        </ActionButton>
      </div>
    </div>
  );
}

// ============================================================================
// Voting Actions
// ============================================================================

function VotingActions({
  loading,
  onVoteAll,
  onResetAllVotes,
  voteCount = 0,
  totalUsers = 5,
}: BulkActionsPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={summaryStyle}>
        Votes: {voteCount}/{totalUsers}
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <ActionButton onClick={onVoteAll} loading={loading}>
          Vote All Remaining
        </ActionButton>
        <ActionButton onClick={onResetAllVotes} loading={loading} variant="danger">
          Reset All Votes
        </ActionButton>
      </div>

      <div
        style={{
          padding: "0.5rem",
          backgroundColor: "var(--color-surface-hover)",
          borderRadius: "4px",
          fontSize: "0.8rem",
        }}
      >
        <strong>Minigames:</strong>
        <ul style={{ margin: "0.25rem 0 0 0", paddingLeft: "1.25rem" }}>
          <li>Submitter Guess active</li>
          <li>Timeline Game active</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// Reveal Actions
// ============================================================================

function RevealActions({
  loading,
  onGenerateStory,
  onGenerateBanner,
  onCalculateAwards,
  revealDurationMinutes = 120,
  onRevealDurationChange,
}: BulkActionsPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div>
        <div style={labelStyle}>Reveal Duration:</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="number"
            value={revealDurationMinutes}
            onChange={(e) => onRevealDurationChange?.(Number(e.target.value))}
            min={1}
            max={1440}
            style={{
              width: "80px",
              padding: "0.35rem",
              fontSize: "0.85rem",
              border: "1px solid var(--color-border)",
              borderRadius: "4px",
            }}
          />
          <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            minutes
          </span>
        </div>
      </div>

      <div>
        <div style={labelStyle}>AI Content:</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <ActionButton onClick={onGenerateStory} loading={loading}>
            Generate Story
          </ActionButton>
          <ActionButton onClick={onGenerateBanner} loading={loading}>
            Generate Banner
          </ActionButton>
        </div>
      </div>

      <div>
        <div style={labelStyle}>Awards:</div>
        <ActionButton onClick={onCalculateAwards} loading={loading}>
          Calculate Awards
        </ActionButton>
      </div>
    </div>
  );
}

// ============================================================================
// Archived Actions
// ============================================================================

function ArchivedActions({ loading, onArchiveRound }: BulkActionsPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={summaryStyle}>Round complete. Full results visible.</div>

      <ActionButton onClick={onArchiveRound} loading={loading} disabled>
        Already Archived
      </ActionButton>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

interface ActionButtonProps {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "default" | "danger" | "primary";
  children: React.ReactNode;
}

function ActionButton({
  onClick,
  loading,
  disabled,
  variant = "default",
  children,
}: ActionButtonProps) {
  const baseStyle: React.CSSProperties = {
    padding: "0.5rem 0.75rem",
    fontSize: "0.85rem",
    border: "1px solid var(--color-border)",
    borderRadius: "6px",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.5 : 1,
    transition: "all 0.15s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: "var(--color-surface)",
      color: "var(--color-text)",
    },
    danger: {
      backgroundColor: "#fee2e2",
      color: "#dc2626",
      borderColor: "#fecaca",
    },
    primary: {
      backgroundColor: "var(--color-primary)",
      color: "white",
      borderColor: "var(--color-primary)",
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{ ...baseStyle, ...variantStyles[variant] }}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span
      style={{
        width: "12px",
        height: "12px",
        border: "2px solid currentColor",
        borderTopColor: "transparent",
        borderRadius: "50%",
        display: "inline-block",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

// ============================================================================
// Utilities
// ============================================================================

function getPhaseName(phase: PhaseType): string {
  const names: Record<PhaseType, string> = {
    preseason: "Preseason",
    submission: "Submission",
    playlist: "Playlist",
    voting: "Voting",
    reveal: "Reveal",
    archived: "Archived",
  };
  return names[phase];
}

const labelStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: "bold",
  color: "var(--color-text-secondary)",
  marginBottom: "0.35rem",
};

const summaryStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "var(--color-text-secondary)",
  padding: "0.35rem 0",
};
