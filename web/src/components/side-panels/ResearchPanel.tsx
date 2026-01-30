import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import clsx from "clsx";
import ResearchSongCard from "./ResearchSongCard";
import CollapsibleSection from "../pinned-peek/CollapsibleSection";
import {
  useRhythmGameSongs,
  useRhythmGameFavorites,
  type RhythmGameFilters,
} from "../../hooks/useRhythmGameSongs";
import { useAuth } from "../../contexts/AuthContext";

type ResearchPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onMention?: (text: string) => void;
};

const DEBOUNCE_MS = 300;

/**
 * Panel for researching Guitar Hero / Rock Band songs for the
 * "Shred Dead Redemption" round theme.
 */
export default function ResearchPanel({
  isOpen,
  onClose,
  onMention,
}: ResearchPanelProps) {
  const { profile } = useAuth();
  const userId = profile?.id ?? null;

  // Filters state
  const [filters, setFilters] = useState<RhythmGameFilters>({
    search: "",
    showGuitarHero: true,
    showRockBand: true,
    hideDLC: false,
    genre: null,
  });
  const [searchInput, setSearchInput] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(f => ({ ...f, search: searchInput }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Data hooks
  const { songs, genres, loading, error, filteredCount, totalCount } = useRhythmGameSongs(filters);
  const { isFavorite, toggleFavorite, favoriteIds } = useRhythmGameFavorites(userId);

  // Get favorite songs
  const favoriteSongs = useMemo(() => {
    return songs.filter(s => favoriteIds.has(s.id));
  }, [songs, favoriteIds]);

  // Swipe-to-close
  const panelRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    const isRightSwipe = deltaX > 80;

    if (isHorizontalSwipe && isRightSwipe) {
      onClose();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Limit displayed songs for performance
  const displayedSongs = songs.slice(0, 100);
  const hasMore = songs.length > 100;

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx("side-panel-backdrop", isOpen && "open")}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        className={clsx("side-panel side-panel-research", isOpen && "open")}
        role="dialog"
        aria-modal="true"
        aria-label="Song research"
        aria-hidden={!isOpen}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="research-panel-header">
          <div className="research-panel-header-content">
            <h2 className="research-panel-title">Shred Dead Redemption</h2>
            <p className="research-panel-subtitle">
              Songs in Guitar Hero (1, 2, 3) or Rock Band
            </p>
          </div>
          <button
            type="button"
            className="research-panel-close"
            onClick={onClose}
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        {/* Search and Filters */}
        <div className="research-panel-filters">
          <input
            type="search"
            className="research-search-input"
            placeholder="Search songs or artists..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          <div className="research-filter-row">
            <label className="research-filter-toggle">
              <input
                type="checkbox"
                checked={filters.showGuitarHero}
                onChange={(e) => setFilters(f => ({ ...f, showGuitarHero: e.target.checked }))}
              />
              <span className="filter-label gh">GH</span>
            </label>

            <label className="research-filter-toggle">
              <input
                type="checkbox"
                checked={filters.showRockBand}
                onChange={(e) => setFilters(f => ({ ...f, showRockBand: e.target.checked }))}
              />
              <span className="filter-label rb">RB</span>
            </label>

            <label className="research-filter-toggle">
              <input
                type="checkbox"
                checked={filters.hideDLC}
                onChange={(e) => setFilters(f => ({ ...f, hideDLC: e.target.checked }))}
              />
              <span className="filter-label dlc">No DLC</span>
            </label>

            <select
              className="research-genre-select"
              value={filters.genre || ""}
              onChange={(e) => setFilters(f => ({ ...f, genre: e.target.value || null }))}
            >
              <option value="">All Genres</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          <div className="research-filter-count">
            Showing {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} songs
          </div>
        </div>

        {/* Content */}
        <div className="research-panel-content">
          {loading && (
            <div className="research-loading">Loading songs...</div>
          )}

          {error && (
            <div className="research-error">Error: {error}</div>
          )}

          {!loading && !error && (
            <>
              {/* Favorites Section */}
              {favoriteSongs.length > 0 && (
                <CollapsibleSection
                  id="research-favorites"
                  title="My Favorites"
                  icon="❤️"
                  badge={favoriteSongs.length}
                  defaultExpanded={true}
                >
                  <div className="research-songs-list">
                    {favoriteSongs.map(song => (
                      <ResearchSongCard
                        key={song.id}
                        song={song}
                        isFavorite={true}
                        onToggleFavorite={() => toggleFavorite(song.id)}
                        onMention={onMention}
                      />
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* All Songs Section */}
              <CollapsibleSection
                id="research-all"
                title="All Songs"
                icon="🎸"
                badge={filteredCount}
                defaultExpanded={true}
              >
                <div className="research-songs-list">
                  {displayedSongs.map(song => (
                    <ResearchSongCard
                      key={song.id}
                      song={song}
                      isFavorite={isFavorite(song.id)}
                      onToggleFavorite={() => toggleFavorite(song.id)}
                      onMention={onMention}
                    />
                  ))}
                  {hasMore && (
                    <div className="research-more-hint">
                      {songs.length - 100} more songs... Use search to narrow down.
                    </div>
                  )}
                  {displayedSongs.length === 0 && (
                    <div className="research-empty">
                      No songs match your filters.
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
