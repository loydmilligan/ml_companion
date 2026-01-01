import { useEffect } from "react";
import clsx from "clsx";
import { useYouTubeSidebar } from "./YouTubeSidebarContext";

export default function YouTubeSidebar() {
  const { isOpen, videoId, videoTitle, closeSidebar } = useYouTubeSidebar();

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeSidebar]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx("youtube-sidebar-backdrop", isOpen && "open")}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={clsx("youtube-sidebar", isOpen && "open")}
        role="dialog"
        aria-modal="true"
        aria-label="YouTube player"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="youtube-sidebar-header">
          <h3 className="youtube-sidebar-title">
            {videoTitle || "YouTube Player"}
          </h3>
          <button
            type="button"
            className="youtube-sidebar-close"
            onClick={closeSidebar}
            aria-label="Close player"
          >
            ✕
          </button>
        </div>

        {/* Player */}
        <div className="youtube-sidebar-content">
          {videoId && (
            <div className="youtube-sidebar-player">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                title={videoTitle || "YouTube video player"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
