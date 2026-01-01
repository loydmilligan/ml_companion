/**
 * StoryPanel - AI narrative and winners art
 *
 * Displays the AI-generated round narrative
 * and winners illustration.
 */

interface StoryPanelProps {
  narrative: string | null;
  winnersImageUrl: string | null;
}

export default function StoryPanel({
  narrative,
  winnersImageUrl,
}: StoryPanelProps) {
  if (!narrative && !winnersImageUrl) {
    return null;
  }

  return (
    <div className="story-section">
      <h3 className="section-label">
        <span className="label-icon" aria-hidden="true">✨</span>
        Round Story
      </h3>

      {/* Narrative text */}
      {narrative && (
        <div className="story-text">
          <p>{narrative}</p>
        </div>
      )}

      {/* Winners art */}
      {winnersImageUrl && (
        <div className="winners-art-container">
          <img
            src={winnersImageUrl}
            alt="Round winners illustration"
            className="winners-art"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
