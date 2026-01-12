type GamesTabProps = {
  onClick: () => void;
};

/**
 * Edge tab that sticks out from the right side of the screen, below the Peek tab.
 * Tapping it opens the games sidebar.
 *
 * TODO: Replace with cassette eject button image when available.
 * For now, uses a solid color tab with "Games" text.
 */
export default function GamesTab({ onClick }: GamesTabProps) {
  return (
    <button
      className="games-tab"
      onClick={onClick}
      aria-label="Open games panel"
      title="Minigames"
    >
      <span className="games-tab-text">Games</span>
    </button>
  );
}
