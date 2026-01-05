import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type YouTubeSidebarContextValue = {
  isOpen: boolean;
  videoId: string | null;
  playlistId: string | null;
  videoTitle: string | null;
  openSidebar: (videoId: string, title?: string) => void;
  openPlaylist: (playlistUrl: string, title?: string) => void;
  closeSidebar: () => void;
};

const YouTubeSidebarContext = createContext<YouTubeSidebarContextValue | null>(null);

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  // Handle youtu.be short links
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // Handle youtube.com/watch?v=
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // Handle youtube.com/embed/
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // Handle youtube.com/v/
  const vMatch = url.match(/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/);
  if (vMatch) return vMatch[1];

  return null;
}

/**
 * Extract YouTube playlist ID from various URL formats
 */
export function extractPlaylistId(url: string): string | null {
  if (!url) return null;

  // Handle youtube.com/playlist?list=
  const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch) return playlistMatch[1];

  return null;
}

export function YouTubeSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);

  const openSidebar = useCallback((id: string, title?: string) => {
    // If given a URL, extract the ID
    const extractedId = extractYouTubeId(id) || id;
    setVideoId(extractedId);
    setPlaylistId(null);
    setVideoTitle(title || null);
    setIsOpen(true);
  }, []);

  const openPlaylist = useCallback((url: string, title?: string) => {
    const extractedId = extractPlaylistId(url);
    if (extractedId) {
      setPlaylistId(extractedId);
      setVideoId(null);
      setVideoTitle(title || "Playlist");
      setIsOpen(true);
    }
  }, []);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
    // Keep the IDs so it doesn't flash when closing
    setTimeout(() => {
      setVideoId(null);
      setPlaylistId(null);
      setVideoTitle(null);
    }, 300);
  }, []);

  return (
    <YouTubeSidebarContext.Provider
      value={{
        isOpen,
        videoId,
        playlistId,
        videoTitle,
        openSidebar,
        openPlaylist,
        closeSidebar,
      }}
    >
      {children}
    </YouTubeSidebarContext.Provider>
  );
}

export function useYouTubeSidebar() {
  const context = useContext(YouTubeSidebarContext);
  if (!context) {
    throw new Error("useYouTubeSidebar must be used within a YouTubeSidebarProvider");
  }
  return context;
}

export default YouTubeSidebarContext;
