/**
 * TEST-001: User Grid Component
 *
 * Displays user grids for different phases:
 * - Preseason: User creation status with avatars and relationships
 * - Submission: User submissions with song info
 * - Voting: User votes with points given
 */

import type { TestUser } from "./types";
import { TEST_USERS } from "./types";

// ============================================================================
// Types
// ============================================================================

type GridType = "preseason" | "submission" | "voting";

interface BaseGridProps {
  type: GridType;
  disabled?: boolean;
  loading?: boolean;
}

interface PreseasonGridProps extends BaseGridProps {
  type: "preseason";
  users: TestUser[];
  onRegenerate?: (userId: string) => void;
}

interface SubmissionGridProps extends BaseGridProps {
  type: "submission";
  submissions: Record<string, { song?: string; artist?: string }>;
  onSubmit?: (userName: string) => void;
  onReset?: (userName: string) => void;
}

interface VotingGridProps extends BaseGridProps {
  type: "voting";
  votes: Record<string, Array<{ recipient: string; points: number }>>;
  onVote?: (userName: string) => void;
  onEdit?: (userName: string) => void;
  onReset?: (userName: string) => void;
  totalUsers?: number;
}

type UserGridProps = PreseasonGridProps | SubmissionGridProps | VotingGridProps;

// ============================================================================
// Component
// ============================================================================

export default function UserGrid(props: UserGridProps) {
  const { type } = props;

  return (
    <div className="user-grid" style={{ fontSize: "0.9rem" }}>
      {type === "preseason" && <PreseasonGrid {...(props as PreseasonGridProps)} />}
      {type === "submission" && <SubmissionGrid {...(props as SubmissionGridProps)} />}
      {type === "voting" && <VotingGrid {...(props as VotingGridProps)} />}
    </div>
  );
}

// ============================================================================
// Preseason Grid
// ============================================================================

function PreseasonGrid({ users, onRegenerate, disabled, loading }: PreseasonGridProps) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
          <th style={thStyle}>User</th>
          <th style={thStyle}>Avatar</th>
          <th style={thStyle}>Relationship</th>
          <th style={thStyle}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
            <td style={tdStyle}>{user.name}</td>
            <td style={tdStyle}>
              <StatusIcon completed={user.avatarGenerated ?? true} />
            </td>
            <td style={tdStyle}>{user.relationshipType || "-"}</td>
            <td style={tdStyle}>
              {onRegenerate && (
                <MiniButton
                  onClick={() => onRegenerate(user.id)}
                  disabled={disabled || loading}
                >
                  Regen
                </MiniButton>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ============================================================================
// Submission Grid
// ============================================================================

function SubmissionGrid({
  submissions,
  onSubmit,
  onReset,
  disabled,
  loading,
}: SubmissionGridProps) {
  return (
    <>
      <div style={{ marginBottom: "0.5rem", color: "var(--color-text-secondary)" }}>
        Submissions: {Object.keys(submissions).length}/{TEST_USERS.length}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
            <th style={thStyle}>User</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Song</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {TEST_USERS.map((user) => {
            const sub = submissions[user.name];
            const hasSubmitted = !!sub;
            return (
              <tr key={user.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={tdStyle}>{user.name}</td>
                <td style={tdStyle}>
                  <StatusIcon completed={hasSubmitted} />
                </td>
                <td style={{ ...tdStyle, maxWidth: "150px" }}>
                  {sub ? (
                    <span style={{ fontSize: "0.85rem" }}>
                      {truncate(sub.song || "", 20)}
                    </span>
                  ) : (
                    <span style={{ color: "var(--color-text-secondary)" }}>-</span>
                  )}
                </td>
                <td style={tdStyle}>
                  {!hasSubmitted && onSubmit && (
                    <MiniButton
                      onClick={() => onSubmit(user.name)}
                      disabled={disabled || loading}
                    >
                      Sub
                    </MiniButton>
                  )}
                  {hasSubmitted && onReset && (
                    <MiniButton
                      onClick={() => onReset(user.name)}
                      disabled={disabled || loading}
                      variant="danger"
                    >
                      Reset
                    </MiniButton>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

// ============================================================================
// Voting Grid
// ============================================================================

function VotingGrid({
  votes,
  onVote,
  onEdit,
  onReset,
  disabled,
  loading,
  totalUsers = TEST_USERS.length,
}: VotingGridProps) {
  // Vote formula: (n-1)/2 rounded up
  const votesPerUser = Math.ceil((totalUsers - 1) / 2);

  return (
    <>
      <div style={{ marginBottom: "0.5rem", color: "var(--color-text-secondary)" }}>
        Votes: {Object.keys(votes).length}/{TEST_USERS.length} | Points per user:{" "}
        {votesPerUser} votes ({totalUsers}-user league)
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
            <th style={thStyle}>User</th>
            <th style={thStyle}>Voted?</th>
            <th style={thStyle}>Points Given</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {TEST_USERS.map((user) => {
            const userVotes = votes[user.name];
            const hasVoted = !!userVotes && userVotes.length > 0;
            return (
              <tr key={user.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={tdStyle}>{user.name}</td>
                <td style={tdStyle}>
                  <StatusIcon completed={hasVoted} />
                </td>
                <td style={{ ...tdStyle, maxWidth: "180px" }}>
                  {hasVoted ? (
                    <span style={{ fontSize: "0.8rem" }}>
                      {userVotes.map((v) => `${v.recipient}: ${v.points}pts`).join(", ")}
                    </span>
                  ) : (
                    <span style={{ color: "var(--color-text-secondary)" }}>-</span>
                  )}
                </td>
                <td style={tdStyle}>
                  {!hasVoted && onVote && (
                    <MiniButton
                      onClick={() => onVote(user.name)}
                      disabled={disabled || loading}
                    >
                      Vote
                    </MiniButton>
                  )}
                  {hasVoted && (
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      {onEdit && (
                        <MiniButton
                          onClick={() => onEdit(user.name)}
                          disabled={disabled || loading}
                        >
                          Edit
                        </MiniButton>
                      )}
                      {onReset && (
                        <MiniButton
                          onClick={() => onReset(user.name)}
                          disabled={disabled || loading}
                          variant="danger"
                        >
                          Reset
                        </MiniButton>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div
        style={{
          marginTop: "0.5rem",
          fontSize: "0.8rem",
          color: "var(--color-text-secondary)",
        }}
      >
        Vote Formula: (n-1)/2 rounded up = ({totalUsers}-1)/2 = {votesPerUser} votes per
        user
      </div>
    </>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function StatusIcon({ completed }: { completed: boolean }) {
  return (
    <span
      style={{
        color: completed ? "#22c55e" : "var(--color-text-secondary)",
        fontWeight: "bold",
      }}
    >
      {completed ? "✓" : "○"}
    </span>
  );
}

interface MiniButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger";
  children: React.ReactNode;
}

function MiniButton({ onClick, disabled, variant = "default", children }: MiniButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "0.15rem 0.4rem",
        fontSize: "0.75rem",
        border: "1px solid var(--color-border)",
        borderRadius: "4px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        backgroundColor: variant === "danger" ? "#fee2e2" : "var(--color-surface)",
        color: variant === "danger" ? "#dc2626" : "var(--color-text)",
        transition: "all 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}

// ============================================================================
// Styles
// ============================================================================

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.35rem 0.5rem",
  fontWeight: "bold",
  fontSize: "0.8rem",
  color: "var(--color-text-secondary)",
};

const tdStyle: React.CSSProperties = {
  padding: "0.35rem 0.5rem",
  verticalAlign: "middle",
};

// ============================================================================
// Utilities
// ============================================================================

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 3) + "...";
}
