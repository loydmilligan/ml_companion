import { useEffect, useState, useMemo } from "react";

type PeekTabProps = {
  onClick: () => void;
  variant?: "cassette" | "divider";
  leagueName?: string;
  roundName?: string;
  deadline?: string | null;
};

/**
 * Format deadline for display on tab (e.g., "JAN 26")
 */
function formatDeadlineDate(deadline: string | null | undefined): string {
  if (!deadline) return "";
  try {
    const date = new Date(deadline);
    const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const day = date.getDate();
    return `${month} ${day}`;
  } catch {
    return "";
  }
}

/**
 * Edge tab that sticks out from the right side of the screen.
 * Tapping it opens the peek panel.
 * Uses cassette spine or record bin divider aesthetic.
 *
 * Dynamic text overlay shows league name and round name.
 */
export default function PeekTab({
  onClick,
  variant = "cassette",
  leagueName,
  roundName,
  deadline,
}: PeekTabProps) {
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

  const imageSrc = useMemo(() => {
    if (variant === "cassette") {
      if (useDynamicText) {
        // Use blank images for dynamic CSS text overlay
        const prefix = "peek-tab-cassette-blank";
        return isDarkMode
          ? `/images/peek-tab/${prefix}-dark.png`
          : `/images/peek-tab/${prefix}-light.png`;
      }
      // Use AI-generated image for dark mode, Python-generated for light
      return isDarkMode
        ? `/images/peek-tab/peek-tab-cassette-ai-dark.png`
        : `/images/peek-tab/peek-tab-cassette-light.png`;
    }
    return isDarkMode
      ? "/images/peek-tab/peek-tab-divider-dark.png"
      : "/images/peek-tab/peek-tab-divider-light.png";
  }, [variant, isDarkMode, useDynamicText]);

  const imageSrcSet = useMemo(() => {
    if (variant === "cassette") {
      if (useDynamicText) {
        const prefix = "peek-tab-cassette-blank";
        return isDarkMode
          ? `/images/peek-tab/${prefix}-dark.png 1x, /images/peek-tab/${prefix}-dark@2x.png 2x`
          : `/images/peek-tab/${prefix}-light.png 1x, /images/peek-tab/${prefix}-light@2x.png 2x`;
      }
      // Use AI-generated image for dark mode, Python-generated for light
      return isDarkMode
        ? `/images/peek-tab/peek-tab-cassette-ai-dark.png 1x, /images/peek-tab/peek-tab-cassette-ai-dark@2x.png 2x`
        : `/images/peek-tab/peek-tab-cassette-light.png 1x, /images/peek-tab/peek-tab-cassette-light@2x.png 2x`;
    }
    return undefined; // Dividers don't have 2x yet
  }, [variant, isDarkMode, useDynamicText]);

  const dateText = formatDeadlineDate(deadline);

  return (
    <button
      className={`peek-tab peek-tab-${variant}`}
      onClick={onClick}
      aria-label="Open round details panel"
      title="View round details"
    >
      <div className="peek-tab-wrapper">
        <img
          src={imageSrc}
          srcSet={imageSrcSet}
          alt=""
          className="peek-tab-image"
          draggable={false}
        />
        {/* Dynamic text overlay for cassette variant */}
        {variant === "cassette" && useDynamicText && (
          <>
            {dateText && (
              <span className="peek-tab-date">{dateText}</span>
            )}
            <div className="peek-tab-text-vertical">
              {leagueName && (
                <span className="peek-tab-league">{leagueName}</span>
              )}
              {roundName && (
                <span className="peek-tab-round">{roundName}</span>
              )}
            </div>
          </>
        )}
      </div>
    </button>
  );
}
