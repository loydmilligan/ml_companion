import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

type PanelType = "playlist" | "progress" | "games" | "research" | null;
type GameTab = "submitter-guess" | "timeline" | "round-challenge";

type SubmissionRow = {
  id: string;
  title: string;
  artist: string | null;
  link: string | null;
  artwork_url: string | null;
};

type SidePanelContextValue = {
  activePanel: PanelType;
  openPanel: (panel: PanelType) => void;
  closePanel: () => void;
  togglePanel: (panel: PanelType) => void;
  // Migrated from PeekPanelContext
  quotedSong: SubmissionRow | null;
  setQuotedSong: (song: SubmissionRow | null) => void;
  clearQuotedSong: () => void;
  // Migrated from GamesSidebarContext
  gamesActiveTab: GameTab;
  setGamesActiveTab: (tab: GameTab) => void;
};

const SidePanelContext = createContext<SidePanelContextValue | null>(null);

export function SidePanelProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [quotedSong, setQuotedSong] = useState<SubmissionRow | null>(null);
  const [gamesActiveTab, setGamesActiveTab] = useState<GameTab>("submitter-guess");

  // Check for panel URL parameter on mount
  useEffect(() => {
    const panelParam = searchParams.get("panel");
    if (panelParam && ["playlist", "progress", "games", "research"].includes(panelParam)) {
      setActivePanel(panelParam as PanelType);
      // Clear the parameter after opening the panel
      searchParams.delete("panel");
      setSearchParams(searchParams, { replace: true });
    }
  }, []); // Only run once on mount

  // Opening a panel closes any other open panel (mutex behavior)
  const openPanel = useCallback((panel: PanelType) => {
    setActivePanel(panel);
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  const togglePanel = useCallback((panel: PanelType) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }, []);

  const clearQuotedSong = useCallback(() => setQuotedSong(null), []);

  return (
    <SidePanelContext.Provider
      value={{
        activePanel,
        openPanel,
        closePanel,
        togglePanel,
        quotedSong,
        setQuotedSong,
        clearQuotedSong,
        gamesActiveTab,
        setGamesActiveTab,
      }}
    >
      {children}
    </SidePanelContext.Provider>
  );
}

export function useSidePanel() {
  const context = useContext(SidePanelContext);
  if (!context) {
    throw new Error("useSidePanel must be used within a SidePanelProvider");
  }
  return context;
}

// Compatibility hooks for easier migration
export function usePeekPanel() {
  const ctx = useSidePanel();
  return {
    isOpen: ctx.activePanel === "playlist",
    openPanel: () => ctx.openPanel("playlist"),
    closePanel: ctx.closePanel,
    togglePanel: () => ctx.togglePanel("playlist"),
    quotedSong: ctx.quotedSong,
    setQuotedSong: ctx.setQuotedSong,
    clearQuotedSong: ctx.clearQuotedSong,
  };
}

export function useGamesSidebar() {
  const ctx = useSidePanel();
  return {
    isOpen: ctx.activePanel === "games",
    activeTab: ctx.gamesActiveTab,
    openSidebar: (tab?: GameTab) => {
      if (tab) ctx.setGamesActiveTab(tab);
      ctx.openPanel("games");
    },
    closeSidebar: ctx.closePanel,
    toggleSidebar: () => ctx.togglePanel("games"),
    setActiveTab: ctx.setGamesActiveTab,
  };
}

export function useResearchPanel() {
  const ctx = useSidePanel();
  return {
    isOpen: ctx.activePanel === "research",
    openPanel: () => ctx.openPanel("research"),
    closePanel: ctx.closePanel,
    togglePanel: () => ctx.togglePanel("research"),
  };
}

export type { PanelType, GameTab, SubmissionRow };
export default SidePanelContext;
