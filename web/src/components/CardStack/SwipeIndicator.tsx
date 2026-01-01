/**
 * SwipeIndicator - Navigation dot indicator
 *
 * Shows progress through the card stack
 * with active dot highlighting.
 */

import type { SwipeIndicatorProps } from "../../types/cardstack.types";

export default function SwipeIndicator({
  total,
  activeIndex,
  maxDots = 7,
}: SwipeIndicatorProps) {
  // Calculate which dots to show for large collections
  const getVisibleRange = () => {
    if (total <= maxDots) {
      return { start: 0, end: total };
    }

    // Center the active dot when possible
    const half = Math.floor(maxDots / 2);
    let start = activeIndex - half;
    let end = activeIndex + half + 1;

    // Adjust if at the start
    if (start < 0) {
      start = 0;
      end = maxDots;
    }

    // Adjust if at the end
    if (end > total) {
      end = total;
      start = total - maxDots;
    }

    return { start, end };
  };

  const { start, end } = getVisibleRange();
  const showStartEllipsis = start > 0;
  const showEndEllipsis = end < total;

  return (
    <div
      className="swipe-indicator"
      role="tablist"
      aria-label="Card navigation"
    >
      {/* Start ellipsis */}
      {showStartEllipsis && (
        <span className="swipe-ellipsis" aria-hidden="true">
          ...
        </span>
      )}

      {/* Dots */}
      {Array.from({ length: end - start }).map((_, i) => {
        const index = start + i;
        const isActive = index === activeIndex;

        return (
          <button
            key={index}
            type="button"
            className={`swipe-dot ${isActive ? "active" : ""}`}
            role="tab"
            aria-selected={isActive}
            aria-label={`Go to card ${index + 1}`}
            tabIndex={isActive ? 0 : -1}
          />
        );
      })}

      {/* End ellipsis */}
      {showEndEllipsis && (
        <span className="swipe-ellipsis" aria-hidden="true">
          ...
        </span>
      )}
    </div>
  );
}
