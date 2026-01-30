import type { PanelType } from "./SidePanelContext";

type SidePanelTabProps = {
  panel: Exclude<PanelType, null>;
  onClick: () => void;
};

const TAB_CONFIG = {
  playlist: {
    lightImage: "/images/playlist_tab_light.png",
    darkImage: "/images/playlist_tab_dark.png",
    label: "Playlist",
    title: "Open playlist panel",
  },
  progress: {
    lightImage: "/images/progress_tab_light.png",
    darkImage: "/images/progress_tab_dark.png",
    label: "Progress",
    title: "Open progress panel",
  },
  games: {
    lightImage: "/images/games_tab_light.png",
    darkImage: "/images/games_tab_dark.png",
    label: "Games",
    title: "Open games panel",
  },
  research: {
    lightImage: "/images/research_tab_light.png",
    darkImage: "/images/research_tab_dark.png",
    label: "Research",
    title: "Research songs for this round",
  },
};

/**
 * Edge tab button that sticks out from the right side of the screen.
 * Supports three panel types: playlist, progress, games.
 * Uses separate light/dark mode images with CSS display switching.
 */
export default function SidePanelTab({ panel, onClick }: SidePanelTabProps) {
  const config = TAB_CONFIG[panel];

  return (
    <button
      className={`side-panel-tab side-panel-tab-${panel}`}
      onClick={onClick}
      aria-label={config.title}
      title={config.title}
    >
      <img
        src={config.lightImage}
        alt={config.label}
        className="side-panel-tab-img side-panel-tab-img-light"
      />
      <img
        src={config.darkImage}
        alt={config.label}
        className="side-panel-tab-img side-panel-tab-img-dark"
      />
    </button>
  );
}
