import { useState, type ReactNode } from "react";
import clsx from "clsx";

type ExpandableSectionProps = {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
  badge?: string | number;
};

export default function ExpandableSection({
  title,
  defaultExpanded = false,
  children,
  badge,
}: ExpandableSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={clsx("expandable-section", expanded && "expanded")}>
      <button
        type="button"
        className="expandable-section-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="expandable-section-title">{title}</span>
        {badge !== undefined && (
          <span className="expandable-section-badge">{badge}</span>
        )}
        <span className="expandable-section-icon">{expanded ? "▲" : "▼"}</span>
      </button>
      <div className="expandable-section-content">
        {children}
      </div>
    </div>
  );
}
