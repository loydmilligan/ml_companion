type GamesTabProps = {
  onClick: () => void;
};

/**
 * Edge tab that sticks out from the right side of the screen, below the Peek tab.
 * Tapping it opens the games sidebar.
 * Uses cassette eject button images for light and dark modes.
 */
export default function GamesTab({ onClick }: GamesTabProps) {
  return (
    <button
      className="games-tab"
      onClick={onClick}
      aria-label="Open games panel"
      title="Minigames"
    >
      <img
        src="/images/games_tab_light.png"
        alt="Games"
        className="games-tab-img games-tab-img-light"
      />
      <img
        src="/images/games_tab_dark.png"
        alt="Games"
        className="games-tab-img games-tab-img-dark"
      />
    </button>
  );
}
