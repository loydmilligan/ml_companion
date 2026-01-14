import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type GameTab = "submitter-guess" | "timeline" | "round-challenge";

type GamesSidebarContextValue = {
  isOpen: boolean;
  activeTab: GameTab;
  openSidebar: (tab?: GameTab) => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: GameTab) => void;
};

const GamesSidebarContext = createContext<GamesSidebarContextValue | null>(null);

export function GamesSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<GameTab>("submitter-guess");

  const openSidebar = useCallback((tab?: GameTab) => {
    if (tab) setActiveTab(tab);
    setIsOpen(true);
  }, []);

  const closeSidebar = useCallback(() => setIsOpen(false), []);
  const toggleSidebar = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <GamesSidebarContext.Provider
      value={{
        isOpen,
        activeTab,
        openSidebar,
        closeSidebar,
        toggleSidebar,
        setActiveTab,
      }}
    >
      {children}
    </GamesSidebarContext.Provider>
  );
}

export function useGamesSidebar() {
  const context = useContext(GamesSidebarContext);
  if (!context) {
    throw new Error("useGamesSidebar must be used within a GamesSidebarProvider");
  }
  return context;
}

export type { GameTab };
export default GamesSidebarContext;
