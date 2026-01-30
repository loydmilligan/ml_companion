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
import rockBandLogo from "../../assets/rock_band_4_inst_logo.png";
import guitarHeroLogo from "../../assets/gh_flames_logo.png";

type ResearchPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

const DEBOUNCE_MS = 300;

// Genre groups for better mobile UX
const GENRE_GROUPS = {
  "Rock: Classic & Mainstream": ["Classic Rock", "Glam", "Pop-Rock", "Rock", "Southern Rock"],
  "Rock: Heavy & Aggressive": ["Emo", "Grunge", "Metal", "Nu-Metal", "Punk"],
  "Rock: Alternative & Experimental": ["Alternative", "Indie Rock", "J-Rock", "New Wave", "Prog"],
  "Hip-Hop, R&B & Urban": ["Hip-Hop/Rap", "R&B/Soul/Funk", "Urban"],
  "Country, Blues & Roots": ["Blues", "Country", "Reggae/Ska"],
  "Jazz & Classical": ["Classical", "Fusion", "Jazz"],
  "Pop & International": ["Latin", "Pop/Dance/Electronic"],
  "Miscellaneous": ["Inspirational", "Novelty", "N/A", "Other"],
};

/**
 * Panel for researching Guitar Hero / Rock Band songs for the
 * "Shred Dead Redemption" round theme.
 */
const STORAGE_KEY = "research-panel-filters";

export default function ResearchPanel({
  isOpen,
  onClose,
}: ResearchPanelProps) {
  const { profile } = useAuth();
  const userId = profile?.id ?? null;

  // Filters state
  const DEFAULT_FILTERS: RhythmGameFilters = {
    search: "",
    showGuitarHero: true,
    showRockBand: true,
    hideDLC: true, // Hide DLC by default
    genres: [],
    decades: [],
    yearRange: null,
    useDecades: true,
  };

  // Load filters from localStorage on mount
  const loadSavedFilters = useCallback((): RhythmGameFilters => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure new fields are present
        return { ...DEFAULT_FILTERS, ...parsed };
      }
    } catch (err) {
      console.error("Failed to load saved filters:", err);
    }
    return DEFAULT_FILTERS;
  }, [DEFAULT_FILTERS]);

  const [filters, setFilters] = useState<RhythmGameFilters>(loadSavedFilters);
  const [searchInput, setSearchInput] = useState(filters.search);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [expandedGenreGroups, setExpandedGenreGroups] = useState<Set<string>>(new Set());

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(f => ({ ...f, search: searchInput }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (err) {
      console.error("Failed to save filters:", err);
    }
  }, [filters]);

  // Data hooks
  const { songs, allSongs, yearRange, loading, error, filteredCount, totalCount } = useRhythmGameSongs(filters);
  const { favorites, isFavorite, toggleFavorite, moveFavoriteUp, moveFavoriteDown, favoriteIds } = useRhythmGameFavorites(userId);

  // Generate decade pills
  const decades = useMemo(() => {
    if (!yearRange) return [];
    const [min, max] = yearRange;
    const startDecade = Math.floor(min / 10) * 10;
    const endDecade = Math.floor(max / 10) * 10;
    const result = [];
    for (let d = startDecade; d <= endDecade; d += 10) {
      result.push(`${d}s`);
    }
    return result;
  }, [yearRange]);

  // Filter helpers
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchInput("");
  }, [DEFAULT_FILTERS]);

  const toggleGenre = useCallback((genre: string) => {
    setFilters(f => ({
      ...f,
      genres: f.genres.includes(genre)
        ? f.genres.filter(g => g !== genre)
        : [...f.genres, genre],
    }));
  }, []);

  const toggleDecade = useCallback((decade: string) => {
    setFilters(f => ({
      ...f,
      decades: f.decades.includes(decade)
        ? f.decades.filter(d => d !== decade)
        : [...f.decades, decade],
    }));
  }, []);

  const toggleGenreGroup = useCallback((groupName: string) => {
    const groupGenres = GENRE_GROUPS[groupName as keyof typeof GENRE_GROUPS];
    const allSelected = groupGenres.every(g => filters.genres.includes(g));

    setFilters(f => ({
      ...f,
      genres: allSelected
        ? f.genres.filter(g => !groupGenres.includes(g))
        : [...new Set([...f.genres, ...groupGenres])],
    }));
  }, [filters.genres]);

  const toggleGenreGroupExpansion = useCallback((groupName: string) => {
    setExpandedGenreGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  }, []);

  // Get favorite songs from ALL songs (unfiltered) so favorites always show
  // Maintain ranking order from favorites list
  const favoriteSongs = useMemo(() => {
    return favorites
      .map(fav => allSongs.find(s => s.id === fav.song_id))
      .filter((s): s is NonNullable<typeof s> => s !== undefined);
  }, [favorites, allSongs]);

  // Filter out favorites from the main list to avoid duplicates
  const nonFavoriteSongs = useMemo(() => {
    return songs.filter(s => !favoriteIds.has(s.id));
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

  // Limit displayed songs for performance (use non-favorites to avoid duplicates)
  const displayedSongs = nonFavoriteSongs.slice(0, 100);
  const hasMore = nonFavoriteSongs.length > 100;

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
            <button
              type="button"
              className={clsx("filter-pill filter-pill-with-logo", filters.showGuitarHero && "active")}
              onClick={() => setFilters(f => ({ ...f, showGuitarHero: !f.showGuitarHero }))}
            >
              <img src={guitarHeroLogo} alt="Guitar Hero" className="filter-pill-logo" />
              Guitar Hero
            </button>

            <button
              type="button"
              className={clsx("filter-pill filter-pill-with-logo", filters.showRockBand && "active")}
              onClick={() => setFilters(f => ({ ...f, showRockBand: !f.showRockBand }))}
            >
              <img src={rockBandLogo} alt="Rock Band" className="filter-pill-logo" />
              Rock Band
            </button>

            <button
              type="button"
              className={clsx("filter-pill", filters.hideDLC && "active")}
              onClick={() => setFilters(f => ({ ...f, hideDLC: !f.hideDLC }))}
            >
              ⛔ No DLC
            </button>

            <button
              type="button"
              className="filter-pill-outline"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
            >
              {filtersExpanded ? "▲" : "▼"} More Filters
            </button>

            <button
              type="button"
              className="filter-pill-outline reset"
              onClick={resetFilters}
              title="Reset all filters"
            >
              ↻ Reset
            </button>
          </div>

          {/* Collapsible Advanced Filters */}
          {filtersExpanded && (
            <div className="research-advanced-filters">
              {/* Genre Group Filters */}
              <div className="filter-group">
                <div className="filter-group-label">Genres</div>
                <div className="filter-pills-wrap">
                  {Object.entries(GENRE_GROUPS).map(([groupName, groupGenres]) => {
                    const allSelected = groupGenres.every(g => filters.genres.includes(g));
                    const someSelected = groupGenres.some(g => filters.genres.includes(g));
                    const isExpanded = expandedGenreGroups.has(groupName);

                    return (
                      <div key={groupName} className="genre-group-container">
                        <div className="genre-group-header-row">
                          <button
                            type="button"
                            className={clsx(
                              "filter-pill-small",
                              allSelected && "active",
                              someSelected && !allSelected && "partial"
                            )}
                            onClick={() => toggleGenreGroup(groupName)}
                          >
                            {groupName}
                          </button>
                          <button
                            type="button"
                            className="genre-group-expand-btn"
                            onClick={() => toggleGenreGroupExpansion(groupName)}
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded ? "−" : "+"}
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="genre-group-items">
                            {groupGenres.map(genre => (
                              <button
                                key={genre}
                                type="button"
                                className={clsx("filter-pill-tiny", filters.genres.includes(genre) && "active")}
                                onClick={() => toggleGenre(genre)}
                              >
                                {genre}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Year Filters */}
              <div className="filter-group">
                <div className="filter-group-header">
                  <div className="filter-group-label">Release Year</div>
                  <button
                    type="button"
                    className="filter-toggle-btn"
                    onClick={() => setFilters(f => ({ ...f, useDecades: !f.useDecades, decades: [], yearRange: null }))}
                  >
                    {filters.useDecades ? "📅 Timeline" : "📊 Decades"}
                  </button>
                </div>

                {filters.useDecades ? (
                  <div className="filter-pills-wrap">
                    {decades.map(decade => (
                      <button
                        key={decade}
                        type="button"
                        className={clsx("filter-pill-small", filters.decades.includes(decade) && "active")}
                        onClick={() => toggleDecade(decade)}
                      >
                        {decade}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="timeline-slider-container">
                    <input
                      type="range"
                      min={yearRange[0]}
                      max={yearRange[1]}
                      value={filters.yearRange?.[0] ?? yearRange[0]}
                      onChange={(e) => {
                        const min = parseInt(e.target.value);
                        const max = filters.yearRange?.[1] ?? yearRange[1];
                        setFilters(f => ({ ...f, yearRange: [Math.min(min, max), max] }));
                      }}
                      className="timeline-slider"
                    />
                    <input
                      type="range"
                      min={yearRange[0]}
                      max={yearRange[1]}
                      value={filters.yearRange?.[1] ?? yearRange[1]}
                      onChange={(e) => {
                        const max = parseInt(e.target.value);
                        const min = filters.yearRange?.[0] ?? yearRange[0];
                        setFilters(f => ({ ...f, yearRange: [min, Math.max(min, max)] }));
                      }}
                      className="timeline-slider"
                    />
                    <div className="timeline-labels">
                      <span>{filters.yearRange?.[0] ?? yearRange[0]}</span>
                      <span>{filters.yearRange?.[1] ?? yearRange[1]}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
                    {favoriteSongs.map((song, index) => (
                      <ResearchSongCard
                        key={song.id}
                        song={song}
                        isFavorite={true}
                        onToggleFavorite={() => toggleFavorite(song.id)}
                        rankPosition={index + 1}
                        totalFavorites={favoriteSongs.length}
                        onMoveUp={index > 0 ? () => moveFavoriteUp(song.id) : undefined}
                        onMoveDown={index < favoriteSongs.length - 1 ? () => moveFavoriteDown(song.id) : undefined}
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
                    />
                  ))}
                  {hasMore && (
                    <div className="research-more-hint">
                      {nonFavoriteSongs.length - 100} more songs... Use search to narrow down.
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
