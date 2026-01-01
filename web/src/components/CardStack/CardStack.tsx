/**
 * CardStack - Swipeable card stack for history navigation
 *
 * Displays rounds and season recaps in a stacked card format
 * with swipe gestures for navigation between cards.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  CardData,
  CardStackProps,
  CardPosition,
  GestureState,
} from "../../types/cardstack.types";
import { isRoundCard, isSeasonRecapCard } from "../../types/cardstack.types";
import RoundCard from "./RoundCard";
import SeasonRecapCard from "./SeasonRecapCard";
import SwipeIndicator from "./SwipeIndicator";
import "./CardStack.css";

const SWIPE_THRESHOLD_PX = 80;

export default function CardStack({
  cards,
  initialIndex = 0,
  onCardChange,
  onCardTap,
  swipeEnabled = true,
}: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [gesture, setGesture] = useState<GestureState>({
    isDragging: false,
    startX: 0,
    offsetX: 0,
    direction: "none",
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Clamp index to valid range
  const clampIndex = useCallback(
    (index: number) => Math.max(0, Math.min(index, cards.length - 1)),
    [cards.length]
  );

  // Navigate to a specific card
  const goToCard = useCallback(
    (index: number) => {
      const clampedIndex = clampIndex(index);
      if (clampedIndex !== currentIndex) {
        setCurrentIndex(clampedIndex);
        onCardChange?.(clampedIndex, cards[clampedIndex]);
      }
    },
    [clampIndex, currentIndex, cards, onCardChange]
  );

  // Navigate to next/previous card
  const goNext = useCallback(() => {
    goToCard(currentIndex + 1);
  }, [currentIndex, goToCard]);

  const goPrev = useCallback(() => {
    goToCard(currentIndex - 1);
  }, [currentIndex, goToCard]);

  // Handle gesture start (touch or mouse)
  const handleGestureStart = useCallback(
    (clientX: number) => {
      if (!swipeEnabled) return;
      setGesture({
        isDragging: true,
        startX: clientX,
        offsetX: 0,
        direction: "none",
      });
    },
    [swipeEnabled]
  );

  // Handle gesture move
  const handleGestureMove = useCallback(
    (clientX: number) => {
      if (!gesture.isDragging) return;

      const offsetX = clientX - gesture.startX;
      const direction = offsetX > 0 ? "right" : offsetX < 0 ? "left" : "none";

      setGesture((prev) => ({
        ...prev,
        offsetX,
        direction,
      }));
    },
    [gesture.isDragging, gesture.startX]
  );

  // Handle gesture end
  const handleGestureEnd = useCallback(() => {
    if (!gesture.isDragging) return;

    const { offsetX } = gesture;

    // Check if swipe threshold was reached
    if (Math.abs(offsetX) >= SWIPE_THRESHOLD_PX) {
      if (offsetX < 0) {
        // Swiped left - go to next card
        goNext();
      } else {
        // Swiped right - go to previous card
        goPrev();
      }
    }

    // Reset gesture state
    setGesture({
      isDragging: false,
      startX: 0,
      offsetX: 0,
      direction: "none",
    });
  }, [gesture, goNext, goPrev]);

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleGestureStart(e.touches[0].clientX);
    },
    [handleGestureStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleGestureMove(e.touches[0].clientX);
    },
    [handleGestureMove]
  );

  const handleTouchEnd = useCallback(() => {
    handleGestureEnd();
  }, [handleGestureEnd]);

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleGestureStart(e.clientX);
    },
    [handleGestureStart]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleGestureMove(e.clientX);
    },
    [handleGestureMove]
  );

  const handleMouseUp = useCallback(() => {
    handleGestureEnd();
  }, [handleGestureEnd]);

  const handleMouseLeave = useCallback(() => {
    if (gesture.isDragging) {
      handleGestureEnd();
    }
  }, [gesture.isDragging, handleGestureEnd]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "ArrowRight") {
        goNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  // Card tap handler (reserved for future use)
  void ((card: CardData) => {
    // Only trigger tap if not dragging
    if (!gesture.isDragging && Math.abs(gesture.offsetX) < 10) {
      onCardTap?.(card);
    }
  });

  // Calculate card position relative to current index
  const getCardPosition = (cardIndex: number): CardPosition => {
    const diff = cardIndex - currentIndex;
    if (diff < 0) return 3; // Behind the stack
    if (diff > 3) return 3;
    return diff as CardPosition;
  };

  // Render visible cards (current + next 3)
  const visibleCards = cards.slice(
    Math.max(0, currentIndex - 1),
    currentIndex + 4
  );

  if (cards.length === 0) {
    return (
      <div className="card-stack-container">
        <div className="card-stack-empty">
          <p>No rounds to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-stack-container">
      {/* Top bar with navigation hint */}
      <div className="card-stack-header">
        <span className="card-count">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Card stack area */}
      <div
        ref={containerRef}
        className="card-stack"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        role="region"
        aria-label="Round history cards"
        aria-roledescription="card stack"
      >
        {visibleCards.map((card, visibleIndex) => {
          const actualIndex = Math.max(0, currentIndex - 1) + visibleIndex;
          const position = getCardPosition(actualIndex);
          const isActive = actualIndex === currentIndex;
          const dragOffset = isActive ? gesture.offsetX : 0;

          if (isRoundCard(card)) {
            return (
              <RoundCard
                key={card.id}
                data={card}
                position={position}
                isActive={isActive}
                dragOffset={dragOffset}
                isDragging={isActive && gesture.isDragging}
              />
            );
          }

          if (isSeasonRecapCard(card)) {
            return (
              <SeasonRecapCard
                key={card.id}
                data={card}
                position={position}
                isActive={isActive}
                dragOffset={dragOffset}
                isDragging={isActive && gesture.isDragging}
              />
            );
          }

          return null;
        })}
      </div>

      {/* Swipe indicator dots */}
      <SwipeIndicator
        total={cards.length}
        activeIndex={currentIndex}
        maxDots={7}
      />

      {/* Navigation buttons for accessibility */}
      <div className="card-stack-nav" aria-label="Card navigation">
        <button
          type="button"
          className="nav-btn nav-prev"
          onClick={goPrev}
          disabled={currentIndex === 0}
          aria-label="Previous card"
        >
          <span aria-hidden="true">&larr;</span>
        </button>
        <button
          type="button"
          className="nav-btn nav-next"
          onClick={goNext}
          disabled={currentIndex === cards.length - 1}
          aria-label="Next card"
        >
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>
    </div>
  );
}
