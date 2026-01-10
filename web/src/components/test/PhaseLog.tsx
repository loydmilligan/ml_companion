/**
 * TEST-001: Phase Log Component
 *
 * Displays timestamped log entries for a specific phase.
 * Includes copyable error context for debugging.
 */

import { useState } from "react";
import type { LogEntry, PhaseType } from "./types";

interface PhaseLogProps {
  phase: PhaseType;
  title: string;
  entries: LogEntry[];
  maxHeight?: string;
}

export default function PhaseLog({
  phase,
  title,
  entries,
  maxHeight = "200px",
}: PhaseLogProps) {
  const phaseEntries = entries.filter(
    (e) => e.phase === phase || (!e.phase && isPhaseAction(e.action, phase))
  );

  return (
    <div
      className="phase-log"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        marginBottom: "0.5rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 0.75rem",
          borderBottom: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface-hover)",
        }}
      >
        <span style={{ fontWeight: "bold", fontSize: "0.85rem" }}>{title}</span>
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--color-text-secondary)",
          }}
        >
          {phaseEntries.length} entries
        </span>
      </div>

      {/* Log Entries */}
      <div
        style={{
          maxHeight,
          overflowY: "auto",
          padding: "0.5rem",
          fontFamily: "monospace",
          fontSize: "0.8rem",
        }}
      >
        {phaseEntries.length === 0 ? (
          <div style={{ color: "var(--color-text-secondary)", fontStyle: "italic" }}>
            No actions yet.
          </div>
        ) : (
          phaseEntries.map((entry) => <LogEntryRow key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Log Entry Row
// ============================================================================

function LogEntryRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const time = new Date(entry.timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div
      style={{
        padding: "0.35rem 0",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {/* Main line */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.5rem",
          color: entry.success ? "#22c55e" : "#ef4444",
        }}
      >
        <span style={{ color: "var(--color-text-secondary)", flexShrink: 0 }}>
          {time}
        </span>
        <span style={{ flexShrink: 0 }}>{entry.success ? "✓" : "✗"}</span>
        <span style={{ flex: 1 }}>
          {formatAction(entry.action)}
          {entry.user && (
            <span style={{ color: "var(--color-text-secondary)" }}>
              {" "}
              ({entry.user})
            </span>
          )}
        </span>
        {entry.details && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              fontSize: "0.75rem",
              padding: "0 0.25rem",
            }}
          >
            {expanded ? "▼" : "▶"}
          </button>
        )}
      </div>

      {/* Expandable details */}
      {expanded && entry.details && (
        <div
          style={{
            marginTop: "0.35rem",
            marginLeft: "4rem",
            padding: "0.5rem",
            backgroundColor: "var(--color-surface-hover)",
            borderRadius: "4px",
            fontSize: "0.75rem",
          }}
        >
          {!entry.success && <ErrorContext details={entry.details} action={entry.action} />}
          {entry.success && (
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                maxHeight: "150px",
                overflow: "auto",
              }}
            >
              {entry.details}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Error Context Component (with copy functionality)
// ============================================================================

function ErrorContext({ details, action }: { details: string; action: string }) {
  const [copied, setCopied] = useState(false);

  const contextText = `Context for debugging:
- Action: ${action}
- Error: ${details}
- Time: ${new Date().toISOString()}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contextText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <span style={{ color: "#ef4444", fontWeight: "bold" }}>Error Details</span>
        <button
          onClick={handleCopy}
          style={{
            padding: "0.2rem 0.5rem",
            fontSize: "0.7rem",
            border: "1px solid var(--color-border)",
            borderRadius: "4px",
            cursor: "pointer",
            backgroundColor: copied ? "#dcfce7" : "var(--color-surface)",
          }}
        >
          {copied ? "Copied!" : "Copy Error Context"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          padding: "0.5rem",
          backgroundColor: "#fef2f2",
          borderRadius: "4px",
          border: "1px solid #fecaca",
          maxHeight: "150px",
          overflow: "auto",
        }}
      >
        {details}
      </pre>
    </div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Format action name for display
 */
function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Determine phase from action name (fallback when phase not set)
 */
function isPhaseAction(action: string, phase: PhaseType): boolean {
  const phaseActions: Record<PhaseType, string[]> = {
    preseason: [
      "seed-test-data",
      "generate-users",
      "generate-family",
      "generate-s1",
      "process-import",
    ],
    submission: [
      "create-round",
      "user_submitted",
      "simulate-submission",
      "fetch-spotify",
    ],
    playlist: ["playlist_ready", "generate-playlist", "create-links"],
    voting: ["user_voted", "simulate-vote"],
    reveal: [
      "votes_in",
      "generate-story",
      "generate-banner",
      "calculate-awards",
    ],
    archived: ["archive-round", "advance-round"],
  };

  const actionLower = action.toLowerCase();
  return phaseActions[phase]?.some((a) => actionLower.includes(a.toLowerCase())) ?? false;
}
