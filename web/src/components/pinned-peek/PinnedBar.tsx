import { useEffect, useRef } from "react";
import clsx from "clsx";
import DeadlineBar from "./DeadlineBar";

type RoundSummary = {
  id: string;
  theme: string;
  theme_description: string | null;
  theme_author: string | null;
  status: "open" | "voting" | "revealed" | "archived";
  submission_deadline: string | null;
  voting_deadline: string | null;
};

type PinnedBarProps = {
  round: RoundSummary | null;
  isOpen: boolean;
  onClose: () => void;
  submittedCount: number;
  votedCount: number;
  totalMembers: number;
};

export default function PinnedBar({
  round,
  isOpen,
  onClose,
  submittedCount,
  votedCount,
  totalMembers,
}: PinnedBarProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Delay to prevent immediate close from the gauge click
    const timeout = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!round) return null;

  return (
    <div
      ref={dropdownRef}
      className={clsx("pinned-bar-dropdown", isOpen && "open")}
      role="region"
      aria-label="Current round information"
      aria-hidden={!isOpen}
    >
      <div className="pinned-bar-content">
        <div className="pinned-bar-theme">
          <h2>{round.theme}</h2>
          {round.theme_description && (
            <p>{round.theme_description}</p>
          )}
          {round.theme_author && (
            <p className="theme-author">Theme by {round.theme_author}</p>
          )}
        </div>

        <DeadlineBar
          submissionDeadline={round.submission_deadline}
          votingDeadline={round.voting_deadline}
          submittedCount={submittedCount}
          votedCount={votedCount}
          totalMembers={totalMembers}
        />
      </div>
    </div>
  );
}
