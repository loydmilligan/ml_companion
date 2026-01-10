/**
 * TEST-001: Jump Button Component
 *
 * Connects phase blocks with "Jump to X" navigation buttons.
 * Allows skipping ahead in the round lifecycle.
 */

import type { PhaseType } from "./types";

interface JumpButtonProps {
  fromPhase: PhaseType;
  toPhase: PhaseType;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const phaseLabels: Record<PhaseType, string> = {
  preseason: "Preseason",
  submission: "Submission",
  playlist: "Playlist",
  voting: "Voting",
  reveal: "Reveal",
  archived: "Archive",
};

export default function JumpButton({
  fromPhase: _fromPhase,
  toPhase,
  onClick,
  disabled = false,
  loading = false,
}: JumpButtonProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "0.5rem 0",
        position: "relative",
      }}
    >
      {/* Connecting line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "50%",
          width: "2px",
          backgroundColor: disabled ? "var(--color-border)" : "#3b82f6",
          zIndex: 0,
        }}
      />

      {/* Button */}
      <button
        onClick={onClick}
        disabled={disabled || loading}
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          fontSize: "0.85rem",
          fontWeight: "bold",
          border: disabled ? "1px solid var(--color-border)" : "2px solid #3b82f6",
          borderRadius: "20px",
          backgroundColor: disabled ? "var(--color-surface-hover)" : "#eff6ff",
          color: disabled ? "var(--color-text-secondary)" : "#3b82f6",
          cursor: disabled || loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "all 0.2s ease",
        }}
      >
        {loading ? (
          <>
            <Spinner /> Processing...
          </>
        ) : (
          <>
            <span style={{ fontSize: "1.1rem" }}>▶</span>
            Jump to {phaseLabels[toPhase]}
          </>
        )}
      </button>
    </div>
  );
}

/**
 * Compact version for inline use
 */
export function JumpArrow({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "0.25rem 0",
      }}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          background: "none",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          color: disabled ? "var(--color-text-secondary)" : "#3b82f6",
          fontSize: "1.5rem",
          opacity: disabled ? 0.4 : 1,
          transition: "transform 0.2s ease",
        }}
        title="Advance to next phase"
      >
        ↓
      </button>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function Spinner() {
  return (
    <span
      style={{
        width: "14px",
        height: "14px",
        border: "2px solid currentColor",
        borderTopColor: "transparent",
        borderRadius: "50%",
        display: "inline-block",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}
