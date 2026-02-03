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
import { useRound } from "../../contexts/RoundContext";
import { useFavoritesPlaylist } from "../../hooks/useFavoritesPlaylist";
import { useSpotifySearch } from "../../hooks/useSpotifySearch";
import { supabase } from "../../lib/supabase";
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
  const { round } = useRound();
  const userId = profile?.id ?? null;
  const roundId = round?.id ?? null;

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

  // Spotify search state (for search mode)
  const [spotifySearchInput, setSpotifySearchInput] = useState("");

  // Debounce search input (curated mode)
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
  const { favorites, isFavorite, toggleFavorite, moveFavoriteUp, moveFavoriteDown, favoriteIds } = useRhythmGameFavorites(userId, roundId);
  const { playlist, loading: playlistLoading, seedPlaylist, isInPlaylist, addToPlaylist, removeFromPlaylist } = useFavoritesPlaylist();
  const { results: spotifyResults, loading: spotifyLoading, error: spotifyError, search: spotifySearch, clear: clearSpotifySearch } = useSpotifySearch();

  // Mode detection: curated list vs search-first
  const isCuratedMode = round?.has_curated_research === true;
  const isSearchMode = !loading && !isCuratedMode;

  // Debounce Spotify search (search mode)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (spotifySearchInput.trim()) {
        spotifySearch(spotifySearchInput);
      } else {
        clearSpotifySearch();
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [spotifySearchInput, spotifySearch, clearSpotifySearch]);

  // Helper: Create a submission from Spotify search result
  const createSubmissionFromSpotifyResult = useCallback(async (result: typeof spotifyResults[0]) => {
    if (!userId) {
      console.error("User must be logged in to create submission");
      return null;
    }

    // Check if submission already exists for this track
    const { data: existing } = await supabase
      .from("submissions")
      .select("id")
      .eq("spotify_url", result.spotifyUrl)
      .maybeSingle();

    if (existing) {
      return existing.id;
    }

    // Create new submission
    const { data, error } = await supabase
      .from("submissions")
      .insert({
        title: result.title,
        artist: result.artist,
        spotify_url: result.spotifyUrl,
        artwork_url: result.artworkUrl,
        youtube_url: null,
        submitter_name: null,
        round_id: null, // Manual addition, not tied to a specific round
        submitter_id: userId,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating submission:", error);
      return null;
    }

    return data.id;
  }, [userId]);

  // Handler: Add Spotify search result to Favorites Playlist
  const handleAddSpotifyToFavorites = useCallback(async (result: typeof spotifyResults[0]) => {
    const submissionId = await createSubmissionFromSpotifyResult(result);
    if (!submissionId) {
      console.error("Failed to create submission for Spotify result");
      return false;
    }

    const success = await addToPlaylist(submissionId);
    return success;
  }, [createSubmissionFromSpotifyResult, addToPlaylist]);

  // Handler: Check if Spotify result is in Favorites Playlist
  const isSpotifyResultInFavorites = useCallback((): boolean => {
    // This is a simplistic check - in reality we'd need to look up the submission_id by spotify_url
    // For now, we'll just show all as not favorited and let the user add them
    return false;
  }, []);

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

  // Convert playlist items to song format for ResearchSongCard
  const playlistSongs = useMemo(() => {
    return playlist.map(item => ({
      id: item.submission_id,
      title: item.submission.title,
      artist: item.submission.artist || "Unknown",
      year: null,
      genre: null,
      artwork_url: item.submission.artwork_url,
      spotify_url: item.submission.spotify_url,
      youtube_url: item.submission.youtube_url,
      source_uri: null,
      is_dlc: false,
      is_guitar_hero: false,
      is_rock_band: false,
      games: [],
      created_at: item.created_at || new Date().toISOString(),
      popularity: null,
    }));
  }, [playlist]);

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

  // Infinite scroll state
  const [displayLimit, setDisplayLimit] = useState(100);
  const contentRef = useRef<HTMLDivElement>(null);

  // Limit displayed songs for performance (use non-favorites to avoid duplicates)
  const displayedSongs = nonFavoriteSongs.slice(0, displayLimit);
  const hasMore = nonFavoriteSongs.length > displayLimit;

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!contentRef.current || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // Load more when scrolled 80% down
    if (scrollPercentage > 0.8) {
      setDisplayLimit(prev => Math.min(prev + 100, nonFavoriteSongs.length));
    }
  }, [hasMore, nonFavoriteSongs.length]);

  // Attach scroll listener
  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Reset display limit when filters change
  useEffect(() => {
    setDisplayLimit(100);
  }, [filters]);

  // Tab state
  const [activeTab, setActiveTab] = useState<'favorites' | 'all' | 'playlist'>('favorites');

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
            <h2 className="research-panel-title">
              {round?.theme || "Song Research"}
            </h2>
            {isCuratedMode && (
              <p className="research-panel-subtitle">
                Songs in Guitar Hero (1, 2, 3) or Rock Band
              </p>
            )}
            {isSearchMode && (
              <p className="research-panel-subtitle">
                Search and favorite songs for this round
              </p>
            )}
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
        {isCuratedMode && (
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
              {/* Genre Group Filters - Collapsible */}
              <CollapsibleSection
                id="research-genre-filters"
                title="Genres"
                icon="🎵"
                badge={filters.genres.length > 0 ? filters.genres.length : undefined}
                defaultExpanded={false}
              >
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
              </CollapsibleSection>

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
        )}

        {/* Tab Navigation */}
        {(isCuratedMode || isSearchMode) && (
          <div className="research-tabs">
            <button
              type="button"
              className={clsx("research-tab", activeTab === 'favorites' && 'active')}
              onClick={() => setActiveTab('favorites')}
            >
              + Theme Playlist
              {favoriteSongs.length > 0 && <span className="tab-badge">{favoriteSongs.length}</span>}
            </button>
            <button
              type="button"
              className={clsx("research-tab", activeTab === 'all' && 'active')}
              onClick={() => setActiveTab('all')}
            >
              {isCuratedMode ? '🎸 All Songs' : '🔍 Search'}
              {isCuratedMode && <span className="tab-badge">{filteredCount}</span>}
              {isSearchMode && spotifyResults.length > 0 && <span className="tab-badge">{spotifyResults.length}</span>}
            </button>
            <button
              type="button"
              className={clsx("research-tab", activeTab === 'playlist' && 'active')}
              onClick={() => setActiveTab('playlist')}
            >
              ⭐ Favorites Playlist
              {playlist.length > 0 && <span className="tab-badge">{playlist.length}</span>}
            </button>
          </div>
        )}

        {/* Content */}
        <div ref={contentRef} className="research-panel-content">
          {loading && (
            <div className="research-loading">Loading songs...</div>
          )}

          {error && (
            <div className="research-error">Error: {error}</div>
          )}

          {/* Search Mode (no curated list) */}
          {isSearchMode && (
            <>
              {/* Theme Playlist Tab */}
              {activeTab === 'favorites' && (
                <div className="research-songs-list">
                  {favoriteSongs.length > 0 ? (
                    favoriteSongs.map((song, index) => (
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
                    ))
                  ) : (
                    <div className="research-empty">
                      No songs in your theme playlist yet. Search for songs and tap the + icon to add them!
                    </div>
                  )}
                </div>
              )}

              {/* Search Tab */}
              {activeTab === 'all' && (
                <>
                  <div className="research-panel-filters">
                    <input
                      type="search"
                      className="research-search-input"
                      placeholder="Search Spotify for songs..."
                      value={spotifySearchInput}
                      onChange={(e) => setSpotifySearchInput(e.target.value)}
                    />
                  </div>

                  {spotifyLoading && (
                    <div className="research-loading">Searching Spotify...</div>
                  )}

                  {spotifyError && (
                    <div className="research-error">Error: {spotifyError}</div>
                  )}

                  {!spotifyLoading && !spotifyError && spotifyResults.length > 0 && (
                    <div className="research-songs-list">
                      {spotifyResults.map((result) => (
                        <ResearchSongCard
                          key={result.trackId || result.title}
                          song={{
                            id: result.trackId || result.title,
                            title: result.title,
                            artist: result.artist,
                            year: null,
                            genre: null,
                            spotify_url: result.spotifyUrl,
                            artwork_url: result.artworkUrl,
                            is_dlc: false,
                            is_guitar_hero: false,
                            is_rock_band: false,
                            games: [],
                            created_at: new Date().toISOString(),
                            popularity: result.popularity,
                          }}
                          isFavorite={false}
                          onToggleFavorite={() => {}}
                          isInFavoritesPlaylist={isSpotifyResultInFavorites()}
                          onToggleFavoritesPlaylist={async () => {
                            await handleAddSpotifyToFavorites(result);
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {!spotifyLoading && !spotifyError && spotifyResults.length === 0 && spotifySearchInput.trim() === '' && (
                    <div className="research-search-instructions">
                      <h3>Search Spotify</h3>
                      <p>Enter a song title, artist, or keyword to search Spotify's catalog.</p>
                      <p className="research-search-hint">
                        💡 Tip: You can add search results to your Theme Playlist (+) or Favorites Playlist (⭐)
                      </p>
                    </div>
                  )}

                  {!spotifyLoading && !spotifyError && spotifyResults.length === 0 && spotifySearchInput.trim() !== '' && (
                    <div className="research-empty">
                      No results found for "{spotifySearchInput}"
                    </div>
                  )}
                </>
              )}

              {/* Favorites Playlist Tab */}
              {activeTab === 'playlist' && (
                <>
                  {playlistLoading ? (
                    <div className="research-loading">Loading playlist...</div>
                  ) : (
                    <div className="research-songs-list">
                      {playlist.length > 0 ? (
                        playlistSongs.map((song) => (
                          <ResearchSongCard
                            key={song.id}
                            song={song}
                            isFavorite={false}
                            onToggleFavorite={() => {}}
                            isInFavoritesPlaylist={isInPlaylist(song.id)}
                            onToggleFavoritesPlaylist={() => {
                              if (isInPlaylist(song.id)) {
                                removeFromPlaylist(song.id);
                              } else {
                                addToPlaylist(song.id);
                              }
                            }}
                          />
                        ))
                      ) : (
                        <div className="research-empty-with-action">
                          <div className="research-empty">
                            No songs in your favorites playlist yet. Search for songs and tap the ⭐ icon to add them!
                          </div>
                          <div className="research-empty-hint">
                            💡 Tip: You can also seed your playlist with your submissions and top-voted songs from Seasons 1 & 2.
                          </div>
                          <button
                            type="button"
                            className="research-action-btn"
                            onClick={async () => {
                              const success = await seedPlaylist();
                              if (success) {
                                // Playlist will auto-refresh via hook
                              }
                            }}
                            disabled={playlistLoading}
                          >
                            🌱 Seed My Playlist
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Curated Mode (has song database) */}
          {isCuratedMode && !loading && !error && (
            <>
              {/* Theme Playlist Tab */}
              {activeTab === 'favorites' && (
                <div className="research-songs-list">
                  {favoriteSongs.length > 0 ? (
                    favoriteSongs.map((song, index) => (
                      <ResearchSongCard
                        key={song.id}
                        song={song}
                        isFavorite={true}
                        onToggleFavorite={() => toggleFavorite(song.id)}
                        rankPosition={index + 1}
                        totalFavorites={favoriteSongs.length}
                        onMoveUp={index > 0 ? () => moveFavoriteUp(song.id) : undefined}
                        onMoveDown={index < favoriteSongs.length - 1 ? () => moveFavoriteDown(song.id) : undefined}
                        // Don't show star button - curated songs can't be added to favorites playlist
                      />
                    ))
                  ) : (
                    <div className="research-empty">
                      No songs in your theme playlist yet. Browse the "All Songs" tab and tap the + icon to add songs!
                    </div>
                  )}
                </div>
              )}

              {/* All Songs Tab */}
              {activeTab === 'all' && (
                <div className="research-songs-list">
                  {displayedSongs.map(song => (
                    <ResearchSongCard
                      key={song.id}
                      song={song}
                      isFavorite={isFavorite(song.id)}
                      onToggleFavorite={() => toggleFavorite(song.id)}
                      // Don't show star button - curated songs can't be added to favorites playlist
                    />
                  ))}
                  {hasMore && (
                    <div className="research-more-hint">
                      Showing {displayLimit} of {nonFavoriteSongs.length} songs. Scroll down for more...
                    </div>
                  )}
                  {displayedSongs.length === 0 && (
                    <div className="research-empty">
                      No songs match your filters.
                    </div>
                  )}
                </div>
              )}

              {/* Favorites Playlist Tab */}
              {activeTab === 'playlist' && (
                <>
                  {playlistLoading ? (
                    <div className="research-loading">Loading playlist...</div>
                  ) : (
                    <div className="research-songs-list">
                      {playlist.length > 0 ? (
                        playlistSongs.map((song) => (
                          <ResearchSongCard
                            key={song.id}
                            song={song}
                            isFavorite={false}
                            onToggleFavorite={() => {}}
                            isInFavoritesPlaylist={isInPlaylist(song.id)}
                            onToggleFavoritesPlaylist={() => {
                              if (isInPlaylist(song.id)) {
                                removeFromPlaylist(song.id);
                              } else {
                                addToPlaylist(song.id);
                              }
                            }}
                          />
                        ))
                      ) : (
                        <div className="research-empty-with-action">
                          <div className="research-empty">
                            No songs in your favorites playlist yet. Browse the "All Songs" tab and tap the ⭐ icon to add songs!
                          </div>
                          <div className="research-empty-hint">
                            💡 Tip: You can also seed your playlist with your submissions and top-voted songs from Seasons 1 & 2.
                          </div>
                          <button
                            type="button"
                            className="research-action-btn"
                            onClick={async () => {
                              const success = await seedPlaylist();
                              if (success) {
                                // Playlist will auto-refresh via hook
                              }
                            }}
                            disabled={playlistLoading}
                          >
                            🌱 Seed My Playlist
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
