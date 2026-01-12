import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";

type TimelineSongItemProps = {
  id: string;
  artworkUrl: string | null;
  title: string;
  artist: string | null;
  releaseYear?: number | null;
  showYear?: boolean;
  isCorrect?: boolean | null;
  disabled?: boolean;
};

export default function TimelineSongItem({
  id,
  artworkUrl,
  title,
  artist,
  releaseYear,
  showYear = false,
  isCorrect,
  disabled = false,
}: TimelineSongItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
    cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        "timeline-song-item",
        isDragging && "dragging",
        disabled && "disabled",
        isCorrect === true && "correct",
        isCorrect === false && "incorrect"
      )}
    >
      <div className="timeline-song-item-art">
        {artworkUrl ? (
          <img src={artworkUrl} alt="" />
        ) : (
          <div className="timeline-song-item-art-placeholder">🎵</div>
        )}
      </div>
      <div className="timeline-song-item-info">
        <span className="timeline-song-item-title">{title}</span>
        <span className="timeline-song-item-artist">{artist ?? "Unknown"}</span>
        {showYear && releaseYear && (
          <span className="timeline-song-item-year">{releaseYear}</span>
        )}
      </div>
      {isCorrect !== null && isCorrect !== undefined && (
        <div className="timeline-song-item-result">
          {isCorrect ? "✓" : "✗"}
        </div>
      )}
    </div>
  );
}
