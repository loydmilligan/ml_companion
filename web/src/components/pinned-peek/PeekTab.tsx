import { useEffect, useState } from "react";

type PeekTabProps = {
  onClick: () => void;
  variant?: "cassette" | "divider";
  leagueName?: string;
  roundName?: string;
};

/**
 * Edge tab that sticks out from the right side of the screen.
 * Tapping it opens the peek panel.
 * Uses cassette spine or record bin divider aesthetic.
 */
export default function PeekTab({
  onClick,
  variant = "cassette",
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

  const imageSrc =
    variant === "cassette"
      ? isDarkMode
        ? "/images/peek-tab/peek-tab-cassette-dark.png"
        : "/images/peek-tab/peek-tab-cassette-light.png"
      : isDarkMode
        ? "/images/peek-tab/peek-tab-divider-dark.png"
        : "/images/peek-tab/peek-tab-divider-light.png";

  const imageSrcSet =
    variant === "cassette"
      ? isDarkMode
        ? "/images/peek-tab/peek-tab-cassette-dark.png 1x, /images/peek-tab/peek-tab-cassette-dark@2x.png 2x"
        : "/images/peek-tab/peek-tab-cassette-light.png 1x, /images/peek-tab/peek-tab-cassette-light@2x.png 2x"
      : undefined; // Dividers don't have 2x yet

  return (
    <button
      className={`peek-tab peek-tab-${variant}`}
      onClick={onClick}
      aria-label="Open round details panel"
      title="View round details"
    >
      <img
        src={imageSrc}
        srcSet={imageSrcSet}
        alt=""
        className="peek-tab-image"
        draggable={false}
      />
    </button>
  );
}
