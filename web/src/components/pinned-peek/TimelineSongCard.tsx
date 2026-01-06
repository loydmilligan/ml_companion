import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type TimelineSongCardProps = {
  id: string;
  artworkUrl: string | null;
  releaseYear?: number | null;
  showYear?: boolean;
  isCorrect?: boolean | null;
  disabled?: boolean;
  size?: number;
  isSelected?: boolean;
  onSelect?: () => void;
};

export function TimelineSongCard({
  id,
  artworkUrl,
  releaseYear,
  showYear = false,
  isCorrect,
  disabled = false,
  size = 56,
  isSelected = false,
  onSelect,
}: TimelineSongCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const getBorderColor = () => {
    if (isSelected) return "var(--accent)";
    if (isCorrect === true) return "var(--success)";
    if (isCorrect === false) return "var(--error)";
    return "var(--border)";
  };

  const cardStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
    width: `${size}px`,
    height: `${size}px`,
    borderColor: getBorderColor(),
    cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
    boxShadow: isDragging
      ? "0 4px 16px rgba(0, 0, 0, 0.3)"
      : isSelected
        ? "0 0 0 2px var(--accent), 0 4px 12px rgba(0, 0, 0, 0.2)"
        : undefined,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging && onSelect) {
      onSelect();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      {...attributes}
      {...listeners}
      className="timeline-song-card"
      data-dragging={isDragging}
      data-disabled={disabled}
      data-selected={isSelected}
      onClick={handleClick}
    >
      <style>{`
        .timeline-song-card {
          position: relative;
          flex-shrink: 0;
          background: var(--bg-secondary);
          border: 3px solid var(--border);
          border-radius: 8px;
          touch-action: none;
          user-select: none;
          overflow: hidden;
        }
        .timeline-song-card:hover:not([data-disabled="true"]):not([data-dragging="true"]) {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        .timeline-song-card[data-disabled="true"] {
          opacity: 0.8;
        }
        .timeline-song-artwork {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: var(--bg-tertiary);
          display: block;
        }
        .timeline-song-year-badge {
          position: absolute;
          bottom: 2px;
          right: 2px;
          background: rgba(0, 0, 0, 0.75);
          color: white;
          font-size: 0.65rem;
          font-weight: 600;
          padding: 2px 4px;
          border-radius: 4px;
          font-variant-numeric: tabular-nums;
        }
        .timeline-correct-indicator {
          position: absolute;
          top: 2px;
          right: 2px;
          font-size: 0.9rem;
          line-height: 1;
        }
      `}</style>

      {artworkUrl ? (
        <img src={artworkUrl} alt="" className="timeline-song-artwork" />
      ) : (
        <div className="timeline-song-artwork" />
      )}

      {showYear && releaseYear && (
        <div className="timeline-song-year-badge">{releaseYear}</div>
      )}

      {isCorrect !== null && isCorrect !== undefined && (
        <div className="timeline-correct-indicator">
          {isCorrect ? "\u2713" : "\u2717"}
        </div>
      )}
    </div>
  );
}

export default TimelineSongCard;
