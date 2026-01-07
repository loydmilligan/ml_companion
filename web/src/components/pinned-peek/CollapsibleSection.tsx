import { useState, useEffect, type ReactNode } from "react";
import clsx from "clsx";

const STORAGE_KEY_PREFIX = "peek-section-v1-";

type CollapsibleSectionProps = {
  id: string; // Unique ID for localStorage persistence
  title: string;
  icon?: ReactNode;
  badge?: string | number;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
};

export default function CollapsibleSection({
  id,
  title,
  icon,
  badge,
  defaultExpanded = true,
  children,
  className,
}: CollapsibleSectionProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}${id}`;

  // Initialize from localStorage or default
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === "undefined") return defaultExpanded;
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      return stored === "true";
    }
    return defaultExpanded;
  });

  // Persist to localStorage when changed
  useEffect(() => {
    localStorage.setItem(storageKey, String(expanded));
  }, [expanded, storageKey]);

  return (
    <div className={clsx("collapsible-section", expanded && "expanded", className)}>
      <button
        type="button"
        className="collapsible-section-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {icon && <span className="collapsible-section-icon">{icon}</span>}
        <span className="collapsible-section-title">{title}</span>
        {badge !== undefined && (
          <span className="collapsible-section-badge">{badge}</span>
        )}
        <span className="collapsible-section-chevron">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <path d="M2 4L6 8L10 4" />
          </svg>
        </span>
      </button>
      <div
        className="collapsible-section-content"
        style={{
          display: expanded ? "block" : "none",
        }}
      >
        {children}
      </div>

      <style>{`
        .collapsible-section {
          margin-bottom: 12px;
        }
        .collapsible-section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          text-align: left;
          transition: background 0.15s ease;
        }
        .collapsible-section-header:hover {
          background: var(--bg-tertiary);
        }
        .collapsible-section.expanded .collapsible-section-header {
          border-radius: 8px 8px 0 0;
          border-bottom-color: transparent;
        }
        .collapsible-section-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }
        .collapsible-section-title {
          flex: 1;
        }
        .collapsible-section-badge {
          background: var(--accent);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 10px;
          flex-shrink: 0;
        }
        .collapsible-section-chevron {
          display: flex;
          align-items: center;
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .collapsible-section-content {
          padding: 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
      `}</style>
    </div>
  );
}
