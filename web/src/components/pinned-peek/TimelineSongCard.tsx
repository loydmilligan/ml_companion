import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type TimelineSongCardProps = {
  id: string;
  title: string;
  artist: string | null;
  artworkUrl: string | null;
  releaseYear?: number | null;
  showYear?: boolean;
  isCorrect?: boolean | null;
  disabled?: boolean;
};

export function TimelineSongCard({
  id,
  title,
  artist,
  artworkUrl,
  releaseYear,
  showYear = false,
  isCorrect,
  disabled = false,
}: TimelineSongCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  const getBorderColor = () => {
    if (isCorrect === true) return "var(--success)";
    if (isCorrect === false) return "var(--error)";
    return "var(--border)";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="timeline-song-card"
      data-dragging={isDragging}
      data-disabled={disabled}
    >
      <style>{`
        .timeline-song-card {
          display: grid;
          grid-template-columns: 48px 1fr ${showYear ? "50px" : ""};
          gap: 12px;
          align-items: center;
          padding: 10px 12px;
          background: var(--bg-secondary);
          border: 2px solid ${getBorderColor()};
          border-radius: 10px;
          cursor: ${disabled ? "default" : "grab"};
          touch-action: none;
          user-select: none;
          transition: box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .timeline-song-card:hover:not([data-disabled="true"]) {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .timeline-song-card[data-dragging="true"] {
          cursor: grabbing;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        }
        .timeline-song-card[data-disabled="true"] {
          opacity: 0.7;
        }
        .timeline-song-artwork {
          width: 48px;
          height: 48px;
          border-radius: 6px;
          object-fit: cover;
          background: var(--bg-tertiary);
          flex-shrink: 0;
        }
        .timeline-song-info {
          min-width: 0;
          overflow: hidden;
        }
        .timeline-song-title {
          font-weight: 500;
          font-size: 0.95rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--text-primary);
        }
        .timeline-song-artist {
          font-size: 0.8rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .timeline-song-year {
          font-size: 0.85rem;
          color: var(--text-muted);
          text-align: center;
          font-variant-numeric: tabular-nums;
        }
        .timeline-drag-handle {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 4px;
        }
        .timeline-drag-handle span {
          display: block;
          width: 18px;
          height: 2px;
          background: var(--text-muted);
          border-radius: 1px;
        }
      `}</style>

      {artworkUrl ? (
        <img src={artworkUrl} alt="" className="timeline-song-artwork" />
      ) : (
        <div className="timeline-song-artwork" />
      )}

      <div className="timeline-song-info">
        <div className="timeline-song-title">{title}</div>
        {artist && <div className="timeline-song-artist">{artist}</div>}
      </div>

      {showYear && releaseYear && (
        <div className="timeline-song-year">{releaseYear}</div>
      )}
    </div>
  );
}

export default TimelineSongCard;
