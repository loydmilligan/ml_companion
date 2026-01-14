import { useEffect } from "react";

type Theme = {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
};

type ThemeLegendModalProps = {
  isOpen: boolean;
  onClose: () => void;
  themes: Theme[];
};

export default function ThemeLegendModal({
  isOpen,
  onClose,
  themes,
}: ThemeLegendModalProps) {
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

  // Prevent body scroll when modal is open
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

  if (!isOpen) return null;

  return (
    <div className="theme-legend-modal-backdrop" onClick={onClose}>
      <div
        className="theme-legend-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Theme Legend"
      >
        <div className="theme-legend-modal-header">
          <h3>Theme Legend</h3>
          <button
            type="button"
            className="theme-legend-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="theme-legend-modal-intro">
          These are the Season 1 themes used in the Round Challenge. Some descriptions have been adjusted to make the game possible.
        </p>
        <div className="theme-legend-modal-list">
          {themes.map((theme) => (
            <div key={theme.id} className="theme-legend-item">
              <div className="theme-legend-item-header">
                <span className="theme-legend-item-title">{theme.title}</span>
              </div>
              <p className="theme-legend-item-description">{theme.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
