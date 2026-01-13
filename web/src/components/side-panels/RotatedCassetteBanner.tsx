import { useEffect, useState, useMemo } from "react";

type RotatedCassetteBannerProps = {
  leagueName?: string;
  roundName?: string;
  customImageLight?: string | null;
  customImageDark?: string | null;
  onClose: () => void;
};

/**
 * Rotated cassette spine image used as banner header in side panels.
 * The cassette image is rotated 90 degrees clockwise to display horizontally.
 * Supports dynamic text overlay and custom round-specific images.
 */
export default function RotatedCassetteBanner({
  leagueName,
  roundName,
  customImageLight,
  customImageDark,
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

  // Use blank images when dynamic text is provided
  const useDynamicText = Boolean(leagueName || roundName);
  const hasCustomImages = Boolean(customImageLight || customImageDark);

  const imageSrc = useMemo(() => {
    // Priority 1: Custom round-specific images
    if (hasCustomImages) {
      const customImage = isDarkMode ? customImageDark : customImageLight;
      if (customImage) return customImage;
      return customImageDark || customImageLight || "";
    }

    // Priority 2: Default cassette images
    if (useDynamicText) {
      // Use blank images for dynamic CSS text overlay
      const prefix = "peek-tab-cassette-blank";
      return isDarkMode
        ? `/images/peek-tab/${prefix}-dark.png`
        : `/images/peek-tab/${prefix}-light.png`;
    }

    // Use AI-generated images with baked-in text
    return isDarkMode
      ? `/images/peek-tab/peek-tab-cassette-ai-dark.png`
      : `/images/peek-tab/peek-tab-cassette-ai-light.png`;
  }, [isDarkMode, useDynamicText, hasCustomImages, customImageLight, customImageDark]);

  return (
    <div className="rotated-cassette-banner">
      <div className="rotated-cassette-banner-wrapper">
        <img
          src={imageSrc}
          alt=""
          className="rotated-cassette-banner-img"
          draggable={false}
        />
        {/* Dynamic text overlay */}
        {useDynamicText && (
          <div className="rotated-cassette-banner-text">
            {leagueName && (
              <span className="rotated-cassette-banner-league">{leagueName}</span>
            )}
            {roundName && (
              <span className="rotated-cassette-banner-round">{roundName}</span>
            )}
          </div>
        )}
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
