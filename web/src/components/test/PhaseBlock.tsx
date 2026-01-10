/**
 * TEST-001: Phase Block Component
 *
 * Displays a phase block with visual states (future, current, complete, past).
 * Contains header, content area for user grids and generated content.
 */

import type { ReactNode } from "react";
import type { PhaseType, PhaseStatus } from "./types";

interface PhaseBlockProps {
  phase: PhaseType;
  title: string;
  status: PhaseStatus;
  summary?: string;
  children?: ReactNode;
  contentItems?: Array<{ label: string; completed: boolean }>;
  disabled?: boolean;
}

/**
 * Visual styles for each phase status
 */
const statusStyles: Record<PhaseStatus, React.CSSProperties> = {
  future: {
    border: "2px dashed var(--color-border)",
    boxShadow: "none",
    backgroundColor: "var(--color-surface-hover)",
    opacity: 0.6,
  },
  current: {
    border: "2px solid #3b82f6",
    boxShadow: "0 8px 25px -5px rgba(59, 130, 246, 0.3)",
    backgroundColor: "var(--color-surface)",
  },
  complete: {
    border: "2px solid #22c55e",
    boxShadow: "0 4px 12px -2px rgba(34, 197, 94, 0.2)",
    backgroundColor: "var(--color-surface)",
  },
  past: {
    border: "1px solid #22c55e80",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
    backgroundColor: "var(--color-surface)",
    opacity: 0.85,
  },
};

/**
 * Status indicator styles
 */
const indicatorStyles: Record<PhaseStatus, { icon: string; color: string }> = {
  future: { icon: "○", color: "var(--color-text-secondary)" },
  current: { icon: "●", color: "#3b82f6" },
  complete: { icon: "✓", color: "#22c55e" },
  past: { icon: "✓", color: "#22c55e80" },
};

export default function PhaseBlock({
  phase,
  title,
  status,
  summary,
  children,
  contentItems,
  disabled = false,
}: PhaseBlockProps) {
  const style = statusStyles[status];
  const indicator = indicatorStyles[status];

  return (
    <div
      className={`phase-block phase-block--${status}`}
      data-phase={phase}
      style={{
        ...style,
        borderRadius: "8px",
        padding: "1rem",
        marginBottom: "0.5rem",
        transition: "all 0.2s ease",
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: indicator.color, fontWeight: "bold" }}>
            {indicator.icon}
          </span>
          <span style={{ fontWeight: "bold", fontSize: "0.95rem" }}>{title}</span>
        </div>
        {summary && (
          <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            {summary}
          </span>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ minHeight: "60px" }}>
        {status === "future" && !children ? (
          <div
            style={{
              color: "var(--color-text-secondary)",
              fontStyle: "italic",
              fontSize: "0.9rem",
            }}
          >
            Waiting for previous phase...
          </div>
        ) : (
          children
        )}
      </div>

      {/* Generated Content Checklist */}
      {contentItems && contentItems.length > 0 && (
        <div
          style={{
            marginTop: "0.75rem",
            paddingTop: "0.5rem",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: "bold",
              marginBottom: "0.25rem",
              color: "var(--color-text-secondary)",
            }}
          >
            Content:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {contentItems.map((item, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: "0.8rem",
                  color: item.completed ? "#22c55e" : "var(--color-text-secondary)",
                }}
              >
                {item.completed ? "•" : "○"} {item.label} {item.completed ? "✓" : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Helper to determine phase status based on round state
 */
export function getPhaseStatus(
  phase: PhaseType,
  roundStatus: string | null,
  preseasonComplete: boolean
): PhaseStatus {
  // No round yet - only preseason can be current
  if (!roundStatus) {
    if (phase === "preseason") {
      return preseasonComplete ? "complete" : "current";
    }
    return "future";
  }

  // Map round status to phase progression
  const phaseOrder: PhaseType[] = [
    "preseason",
    "submission",
    "playlist",
    "voting",
    "reveal",
    "archived",
  ];
  const statusToPhase: Record<string, PhaseType> = {
    open: "submission",
    voting: "voting",
    revealed: "reveal",
    archived: "archived",
  };

  const currentPhase = statusToPhase[roundStatus] || "submission";
  const currentIdx = phaseOrder.indexOf(currentPhase);
  const phaseIdx = phaseOrder.indexOf(phase);

  // Preseason is always complete once a round exists
  if (phase === "preseason") {
    return "complete";
  }

  // Playlist phase is complete when in voting or later
  if (phase === "playlist") {
    if (roundStatus === "open") {
      // Check if all submissions are in
      return "future"; // Will need to check submission count externally
    }
    return currentIdx >= phaseOrder.indexOf("voting") ? "complete" : "future";
  }

  if (phaseIdx < currentIdx) {
    return "past";
  } else if (phaseIdx === currentIdx) {
    return "current";
  }
  return "future";
}
