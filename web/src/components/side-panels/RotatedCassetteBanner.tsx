import { useEffect, useState, useMemo } from "react";

type RotatedCassetteBannerProps = {
  roundNumber?: number | null;
  onClose: () => void;
};

/**
 * Rotated cassette spine image used as banner header in side panels.
 * The cassette image is rotated 90 degrees clockwise to display horizontally.
 * Uses round-specific images with the round number baked in (e.g., round 2, 3, etc.)
 * Falls back to blank cassette for rounds without specific images.
 */
export default function RotatedCassetteBanner({
  roundNumber,
  onClose,
}: RotatedCassetteBannerProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const mode = document.documentElement.getAttribute("data-mode");
      setIsDarkMode(mode === "dark");
    };

    checkDarkMode();

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-mode"],
    });

    return () => observer.disconnect();
  }, []);

  // Round numbers that have specific cassette images (2, 3, 4, etc.)
  // Add more numbers here as images are created
  const availableRoundImages = [2, 3, 4, 5, 6];

  const imageSrc = useMemo(() => {
    // Use round-specific cassette spine image if available
    if (roundNumber && availableRoundImages.includes(roundNumber)) {
      return isDarkMode
        ? `/images/cassette-spine/bg_remove_cass_spine_w_text_dark_${roundNumber}.png`
        : `/images/cassette-spine/bg_remove_cass_spine_w_text_light_${roundNumber}.png`;
    }

    // Fallback to blank cassette for rounds without specific images
    const prefix = "peek-tab-cassette-blank";
    return isDarkMode
      ? `/images/peek-tab/${prefix}-dark.png`
      : `/images/peek-tab/${prefix}-light.png`;
  }, [isDarkMode, roundNumber]);

  return (
    <div className="rotated-cassette-banner">
      <div className="rotated-cassette-banner-wrapper">
        <img
          src={imageSrc}
          alt={roundNumber ? `Round ${roundNumber}` : ""}
          className="rotated-cassette-banner-img"
          draggable={false}
        />
      </div>
      <button
        type="button"
        className="rotated-cassette-banner-close"
        onClick={onClose}
        aria-label="Close panel"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
