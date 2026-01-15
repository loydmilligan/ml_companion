/**
 * CardStack - Swipeable card stack for history navigation
 *
 * Displays rounds and season recaps in a stacked card format
 * with swipe gestures for navigation between cards.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type {
  CardData,
  CardStackProps,
  CardPosition,
  GestureState,
} from "../../types/cardstack.types";
import { isRoundCard, isSeasonRecapCard, isCurrentSeasonCard, isPreseasonSpecialCard } from "../../types/cardstack.types";
import RoundCard from "./RoundCard";
import SeasonRecapCard from "./SeasonRecapCard";
import CurrentSeasonCard from "./CurrentSeasonCard";
import PreseasonSpecialCard from "./PreseasonSpecialCard";
import SwipeIndicator from "./SwipeIndicator";
import "./CardStack.css";

const SWIPE_THRESHOLD_PX = 80;

// Simple TOC icon
const TocIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
  </svg>
);

export default function CardStack({
  cards,
  initialIndex = 0,
  onCardChange,
  onCardTap,
  onThemeClick,
  swipeEnabled = true,
  isLead = false,
  adminCallbacks,
  generationState,
  onRegenerateCurrentSeasonStory,
  currentSeasonStoryLoading,
  currentSeasonStoryStatus,
}: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [gesture, setGesture] = useState<GestureState>({
    isDragging: false,
    startX: 0,
    offsetX: 0,
    direction: "none",
  });
  const [isTocOpen, setIsTocOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Build TOC data - group cards by season
  const tocData = useMemo(() => {
    const seasonMap = new Map<number, { cards: Array<{ index: number; title: string; type: string }>; name: string }>();

    cards.forEach((card, index) => {
      let seasonNum = 0;
      let title = "";
      let seasonName = "";

      if (isRoundCard(card)) {
        seasonNum = card.seasonNumber ?? 0;
        title = `Round ${card.roundNumber}: ${card.theme}`;
        seasonName = `Season ${seasonNum}`;
      } else if (isSeasonRecapCard(card)) {
        seasonNum = card.seasonNumber;
        title = `Season ${seasonNum} Recap`;
        seasonName = card.leagueName || `Season ${seasonNum}`;
      } else if (isCurrentSeasonCard(card)) {
        seasonNum = card.seasonNumber;
        title = "Current Season Story";
        seasonName = card.leagueName || `Season ${seasonNum}`;
      } else if (isPreseasonSpecialCard(card)) {
        seasonNum = card.seasonNumber;
        title = "Pre-Season Special";
        seasonName = card.leagueName || `Season ${seasonNum}`;
      }

      if (!seasonMap.has(seasonNum)) {
        seasonMap.set(seasonNum, { cards: [], name: seasonName });
      }
      seasonMap.get(seasonNum)!.cards.push({ index, title, type: card.type });
    });

    // Sort by season number descending
    return Array.from(seasonMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([seasonNum, data]) => ({ seasonNumber: seasonNum, name: data.name, cards: data.cards }));
  }, [cards]);

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

  // Navigate from TOC
  const handleTocItemClick = useCallback((index: number) => {
    goToCard(index);
    setIsTocOpen(false);
  }, [goToCard]);

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
      {/* Top bar with TOC and navigation hint */}
      <div className="card-stack-header">
        <button
          type="button"
          className="toc-btn"
          onClick={() => setIsTocOpen(true)}
          aria-label="Open table of contents"
        >
          <TocIcon />
        </button>
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
                isLead={isLead}
                adminCallbacks={adminCallbacks}
                generationState={generationState?.get(card.id)}
              />
            );
          }

          if (isSeasonRecapCard(card)) {
            const handleThemeClick = (theme: string) => {
              if (onThemeClick) {
                const targetIndex = onThemeClick(theme, card.seasonNumber);
                if (targetIndex !== null && targetIndex >= 0) {
                  goToCard(targetIndex);
                }
              }
            };

            return (
              <SeasonRecapCard
                key={card.id}
                data={card}
                position={position}
                isActive={isActive}
                dragOffset={dragOffset}
                isDragging={isActive && gesture.isDragging}
                onThemeClick={handleThemeClick}
              />
            );
          }

          if (isCurrentSeasonCard(card)) {
            return (
              <CurrentSeasonCard
                key={card.id}
                data={card}
                position={position}
                isActive={isActive}
                dragOffset={dragOffset}
                isDragging={isActive && gesture.isDragging}
                isLead={isLead}
                onRegenerateStory={onRegenerateCurrentSeasonStory}
                isStoryLoading={currentSeasonStoryLoading}
                storyStatus={currentSeasonStoryStatus}
              />
            );
          }

          if (isPreseasonSpecialCard(card)) {
            return (
              <PreseasonSpecialCard
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

      {/* TOC Modal */}
      {isTocOpen && (
        <div className="toc-modal-overlay" onClick={() => setIsTocOpen(false)}>
          <div className="toc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="toc-modal-header">
              <h2 className="toc-modal-title">Jump to Card</h2>
              <button
                type="button"
                className="toc-modal-close"
                onClick={() => setIsTocOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="toc-modal-content">
              {tocData.map((season) => (
                <div key={season.seasonNumber} className="toc-season-group">
                  <h3 className="toc-season-title">{season.name}</h3>
                  <div className="toc-items">
                    {season.cards.map((item) => (
                      <button
                        key={item.index}
                        type="button"
                        className={`toc-item ${item.index === currentIndex ? "active" : ""} toc-item-${item.type}`}
                        onClick={() => handleTocItemClick(item.index)}
                      >
                        <span className="toc-item-title">{item.title}</span>
                        {item.index === currentIndex && (
                          <span className="toc-item-current">Current</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
