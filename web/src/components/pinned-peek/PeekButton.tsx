import clsx from "clsx";

type PeekButtonProps = {
  onClick: () => void;
  className?: string;
  variant?: "floating" | "topbar" | "chat";
};

export default function PeekButton({ onClick, className, variant = "floating" }: PeekButtonProps) {
  return (
    <button
      className={clsx("peek-button", `peek-button-${variant}`, className)}
      onClick={onClick}
      aria-label="Open round details panel"
      title="View round details"
    >
      {/* Sidebar with arrow icon */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Panel/sidebar shape */}
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
        {/* Arrow pointing left (into panel) */}
        <polyline points="16 8 12 12 16 16" />
      </svg>
    </button>
  );
}
