import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type SubmissionRow = {
  id: string;
  title: string;
  artist: string | null;
  link: string | null;
  artwork_url: string | null;
};

type PeekPanelContextValue = {
  isOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  quotedSong: SubmissionRow | null;
  setQuotedSong: (song: SubmissionRow | null) => void;
  clearQuotedSong: () => void;
};

const PeekPanelContext = createContext<PeekPanelContextValue | null>(null);

export function PeekPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [quotedSong, setQuotedSong] = useState<SubmissionRow | null>(null);

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen((prev) => !prev), []);
  const clearQuotedSong = useCallback(() => setQuotedSong(null), []);

  return (
    <PeekPanelContext.Provider
      value={{
        isOpen,
        openPanel,
        closePanel,
        togglePanel,
        quotedSong,
        setQuotedSong,
        clearQuotedSong,
      }}
    >
      {children}
    </PeekPanelContext.Provider>
  );
}

export function usePeekPanel() {
  const context = useContext(PeekPanelContext);
  if (!context) {
    throw new Error("usePeekPanel must be used within a PeekPanelProvider");
  }
  return context;
}

export default PeekPanelContext;
