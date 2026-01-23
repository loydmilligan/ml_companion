import { useEffect, useState } from "react";
import { useAdmin } from "../AdminContext";
import { AdminSection, AdminToggle, AdminSelect, AdminFieldGroup } from "../components";
import { supabase } from "../../../lib/supabase";

const PHASE_OPTIONS = [
  { value: "open", label: "Open phase only" },
  { value: "voting", label: "Voting phase only" },
  { value: "both", label: "Both phases" },
];

const TIMELINE_PHASE_OPTIONS = [
  { value: "voting", label: "Voting phase only" },
  { value: "revealed", label: "Revealed phase only" },
  { value: "both", label: "Both phases" },
];

type RoundSummary = {
  id: string;
  theme: string;
  season_number: number | null;
  round_number: number | null;
  status?: string;
};

type AdminPickSong = {
  id: string;
  title: string;
  artist: string | null;
  artwork_url: string | null;
  youtube_url: string | null;
};

type ThemeCategory = {
  id: string;
  title: string;
  description: string;
};

type SubmissionRow = {
  id: string;
  title: string;
  artist: string | null;
  artwork_url: string | null;
  release_year: number | null;
};

type BonusPointEntry = {
  id: string;
  points: number;
  reason: string | null;
  created_at: string;
  profiles: { display_name: string | null } | null;
};

export default function GamesTab() {
  const { settings, updateSetting, group, users } = useAdmin();

  if (!settings) return <p>Loading settings...</p>;

  return (
    <div className="admin-games-tab">
      {/* Guess the Submitter */}
      <AdminSection
        icon="🎯"
        title="Guess the Submitter"
        color="purple"
        defaultOpen
      >
        <AdminToggle
          icon="✅"
          label="Enable Game"
          helper="Players guess who submitted each song during voting"
          checked={settings.submitter_guess_enabled}
          onChange={(checked) => updateSetting("submitter_guess_enabled", checked)}
        />
        <p className="muted" style={{ fontSize: "0.85rem", marginTop: 8 }}>
          Available during voting phase. Results revealed when round ends.
        </p>
      </AdminSection>

      {/* Timeline Game */}
      <AdminSection
        icon="⏱️"
        title="Timeline Game"
        color="purple"
        defaultOpen
      >
        <AdminToggle
          icon="✅"
          label="Enable Game"
          helper="Players arrange songs by release year"
          checked={settings.timeline_game_enabled}
          onChange={(checked) => updateSetting("timeline_game_enabled", checked)}
        />

        {settings.timeline_game_enabled && (
          <AdminFieldGroup>
            <AdminSelect
              icon="📅"
              label="Available during"
              value={settings.timeline_game_phase}
              onChange={(val) =>
                updateSetting("timeline_game_phase", val as "voting" | "revealed" | "both")
              }
              options={TIMELINE_PHASE_OPTIONS}
            />
          </AdminFieldGroup>
        )}

        <p className="muted" style={{ fontSize: "0.85rem", marginTop: 8 }}>
          Requires release year data for all songs. Manage release years below.
        </p>

        {/* Release Years Management */}
        {settings.timeline_game_enabled && (
          <AdminSection icon="📅" title="Release Year Data" color="purple" defaultOpen={false}>
            <TimelineReleaseYearManager groupId={group?.id} />
          </AdminSection>
        )}
      </AdminSection>

      {/* Round Challenge */}
      <AdminSection
        icon="🏆"
        title="Round Challenge"
        color="purple"
        defaultOpen
      >
        <AdminToggle
          icon="✅"
          label="Enable Game"
          helper="Guess-the-theme minigame using songs from past seasons"
          checked={settings.round_challenge_enabled}
          onChange={(checked) => updateSetting("round_challenge_enabled", checked)}
        />

        {settings.round_challenge_enabled && (
          <>
            <AdminFieldGroup>
              <AdminSelect
                icon="📅"
                label="Available during"
                value={settings.round_challenge_phase}
                onChange={(val) =>
                  updateSetting("round_challenge_phase", val as "open" | "voting" | "both")
                }
                options={PHASE_OPTIONS}
              />
            </AdminFieldGroup>

            {/* Song Picks Management */}
            <AdminSection icon="🎵" title="Song Picks" color="purple" defaultOpen={false}>
              <RoundChallengeSongPicks groupId={group?.id} />
            </AdminSection>
          </>
        )}
      </AdminSection>

      {/* AI Assistant */}
      <AdminSection icon="🤖" title="AI Assistant" color="purple">
        <AdminToggle
          icon="🔌"
          label="AI Assistant (master)"
          helper="Disable to hide all AI features in peek panel"
          checked={settings.ai_assistant_enabled}
          onChange={(checked) => updateSetting("ai_assistant_enabled", checked)}
        />

        {settings.ai_assistant_enabled && (
          <AdminFieldGroup title="Features">
            <AdminToggle
              icon="💡"
              label="Explain Theme"
              helper="AI shares thoughts on the theme"
              checked={settings.ai_explain_enabled}
              onChange={(checked) => updateSetting("ai_explain_enabled", checked)}
            />
            <AdminToggle
              icon="🎯"
              label="Get Hint"
              helper="AI provides song-finding hints"
              checked={settings.ai_hint_enabled}
              onChange={(checked) => updateSetting("ai_hint_enabled", checked)}
            />
            <AdminToggle
              icon="✅"
              label="Check Song"
              helper="AI gives opinion on song fit"
              checked={settings.ai_validate_enabled}
              onChange={(checked) => updateSetting("ai_validate_enabled", checked)}
            />
            {settings.ai_validate_enabled && (
              <div className="field" style={{ marginLeft: 30 }}>
                <label className="field-label">Daily limit per user</label>
                <input
                  type="number"
                  className="field-input"
                  min={1}
                  max={50}
                  value={settings.ai_validate_daily_limit}
                  onChange={(e) =>
                    updateSetting("ai_validate_daily_limit", parseInt(e.target.value) || 5)
                  }
                  style={{ width: 80 }}
                />
              </div>
            )}
            <AdminToggle
              icon="💬"
              label="Chat @AI Replies"
              helper="AI responds to @AI mentions"
              checked={settings.ai_chat_enabled}
              onChange={(checked) => updateSetting("ai_chat_enabled", checked)}
            />
          </AdminFieldGroup>
        )}
      </AdminSection>

      {/* AI Images */}
      <AdminSection icon="🎨" title="AI Image Generation" color="purple">
        <AdminSelect
          icon="🖼️"
          label="Image Model"
          value={settings.round_theme_image_model_key ?? "OPENROUTER_ROUND_IMAGE_MODEL"}
          onChange={(val) => updateSetting("round_theme_image_model_key", val)}
          options={[
            { value: "OPENROUTER_ROUND_IMAGE_MODEL", label: "Default Image Model" },
            { value: "OPENROUTER_MID_MODEL", label: "Mid-tier Model" },
            { value: "OPENROUTER_TROPHY_MODEL", label: "Trophy Model" },
          ]}
        />
        <AdminSelect
          icon="🎨"
          label="Logo Palette"
          value={settings.logo_palette ?? "ocean-coral"}
          onChange={(val) => updateSetting("logo_palette", val)}
          options={[
            { value: "ocean-coral", label: "Ocean + Coral" },
            { value: "teal-mango", label: "Teal Night + Mango" },
            { value: "midnight-mint", label: "Midnight + Neon Mint" },
          ]}
        />
      </AdminSection>

      {/* Bonus Points */}
      <AdminSection icon="⭐" title="Bonus Points" color="purple">
        <BonusPointsManager groupId={group?.id} users={users} />
      </AdminSection>
    </div>
  );
}

// Timeline Release Year Manager Component
function TimelineReleaseYearManager({ groupId }: { groupId?: string }) {
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    const fetchRounds = async () => {
      const { data } = await supabase
        .from("rounds")
        .select("id, theme, season_number, round_number")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });
      if (data) setRounds(data as RoundSummary[]);
    };
    fetchRounds();
  }, [groupId]);

  const loadReleaseYears = async (roundId: string) => {
    setSelectedRoundId(roundId);
    setLoading(true);
    const { data } = await supabase
      .from("submissions")
      .select("id, title, artist, artwork_url, release_year")
      .eq("round_id", roundId);
    if (data) {
      setSubmissions(data as SubmissionRow[]);
      const editMap: Record<string, string> = {};
      data.forEach((sub) => {
        if (sub.release_year) editMap[sub.id] = String(sub.release_year);
      });
      setEditing(editMap);
    }
    setLoading(false);
  };

  const saveReleaseYears = async () => {
    if (!selectedRoundId) return;
    setSaving(true);
    for (const sub of submissions) {
      const year = editing[sub.id] ? parseInt(editing[sub.id]) : null;
      await supabase.from("submissions").update({ release_year: year }).eq("id", sub.id);
    }
    setSaving(false);
    await loadReleaseYears(selectedRoundId);
  };

  const missing = submissions.filter((s) => !editing[s.id]).length;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <select
        className="field-input"
        value={selectedRoundId ?? ""}
        onChange={(e) => e.target.value && loadReleaseYears(e.target.value)}
      >
        <option value="">Select a round...</option>
        {rounds.map((r) => (
          <option key={r.id} value={r.id}>
            S{r.season_number ?? "?"} R{r.round_number ?? "?"}: {r.theme}
          </option>
        ))}
      </select>

      {loading && <p className="muted">Loading songs...</p>}

      {submissions.length > 0 && !loading && (
        <div style={{ display: "grid", gap: 8 }}>
          {[...submissions]
            .sort((a, b) => {
              const yearA = a.release_year ?? 9999;
              const yearB = b.release_year ?? 9999;
              if (yearA === yearB) return a.title.localeCompare(b.title);
              return yearA - yearB;
            })
            .map((sub) => {
              const hasYear = !!editing[sub.id];
              return (
                <div
                  key={sub.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr 80px 24px",
                    gap: 12,
                    alignItems: "center",
                    padding: 8,
                    background: hasYear ? "var(--surface)" : "var(--warning-bg)",
                    borderRadius: 6,
                  }}
                >
                  {sub.artwork_url ? (
                    <img
                      src={sub.artwork_url}
                      alt=""
                      style={{ width: 40, height: 40, borderRadius: 4, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 4,
                        background: "var(--surface-hover)",
                      }}
                    />
                  )}
                  <div style={{ overflow: "hidden" }}>
                    <div
                      style={{
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {sub.title}
                    </div>
                    {sub.artist && (
                      <div
                        className="muted"
                        style={{
                          fontSize: "0.8rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {sub.artist}
                      </div>
                    )}
                  </div>
                  <input
                    className="field-input"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={editing[sub.id] ?? ""}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        [sub.id]: e.target.value,
                      }))
                    }
                    placeholder="Year"
                    style={{ width: 80, textAlign: "center" }}
                  />
                  <span style={{ fontSize: "1.2rem" }}>{hasYear ? "✓" : "⚠️"}</span>
                </div>
              );
            })}

          <button
            className="admin-button"
            onClick={saveReleaseYears}
            disabled={saving}
            style={{ marginTop: 8 }}
          >
            {saving ? "Saving..." : "Save Release Years"}
          </button>

          {missing > 0 ? (
            <p style={{ color: "var(--warning)", margin: "8px 0 0 0", fontSize: "0.85rem" }}>
              ⚠️ {missing} song{missing !== 1 ? "s" : ""} missing release year - game disabled
              until all years are filled in
            </p>
          ) : (
            <p style={{ color: "var(--success)", margin: "8px 0 0 0", fontSize: "0.85rem" }}>
              ✓ All songs have release years
            </p>
          )}
        </div>
      )}

      {selectedRoundId && submissions.length === 0 && !loading && (
        <p className="muted">No submissions found for this round.</p>
      )}
    </div>
  );
}

// Bonus Points Manager Component
function BonusPointsManager({ groupId, users }: { groupId?: string; users: any[] }) {
  const [bonusPoints, setBonusPoints] = useState<BonusPointEntry[]>([]);
  const [awardUserId, setAwardUserId] = useState("");
  const [awardPoints, setAwardPoints] = useState("1");
  const [awardReason, setAwardReason] = useState("");
  const [awarding, setAwarding] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    const fetchBonusPoints = async () => {
      const { data } = await supabase
        .from("challenge_bonus_points")
        .select("id, points, reason, created_at, profiles(display_name)")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setBonusPoints(data as unknown as BonusPointEntry[]);
    };
    fetchBonusPoints();
  }, [groupId]);

  const awardBonusPoints = async () => {
    if (!groupId || !awardUserId || !awardReason) return;
    setAwarding(true);
    await supabase.from("challenge_bonus_points").insert({
      group_id: groupId,
      profile_id: awardUserId,
      points: parseInt(awardPoints) || 1,
      reason: awardReason,
    });
    setAwarding(false);
    setAwardUserId("");
    setAwardPoints("1");
    setAwardReason("");
    // Refresh list
    const { data } = await supabase
      .from("challenge_bonus_points")
      .select("id, points, reason, created_at, profiles(display_name)")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setBonusPoints(data as unknown as BonusPointEntry[]);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gap: 12 }}>
        <select
          className="field-input"
          value={awardUserId}
          onChange={(e) => setAwardUserId(e.target.value)}
        >
          <option value="">Select user...</option>
          {users.map((user) =>
            user.profiles?.id ? (
              <option key={user.profiles.id} value={user.profiles.id}>
                {user.profiles.display_name ?? user.profiles.email ?? "Member"}
              </option>
            ) : null
          )}
        </select>
        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 8 }}>
          <input
            type="number"
            className="field-input"
            placeholder="Points"
            value={awardPoints}
            onChange={(e) => setAwardPoints(e.target.value)}
            min={1}
          />
          <input
            className="field-input"
            placeholder="Reason (e.g., Great playlist curation)"
            value={awardReason}
            onChange={(e) => setAwardReason(e.target.value)}
          />
        </div>
        <button
          className="admin-button"
          onClick={awardBonusPoints}
          disabled={!awardUserId || !awardReason || awarding}
        >
          {awarding ? "Awarding..." : "Award Points"}
        </button>
      </div>

      <div>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem" }}>Recent Awards</h4>
        <div style={{ display: "grid", gap: 8 }}>
          {bonusPoints.length > 0 ? (
            bonusPoints.map((bp) => (
              <div
                key={bp.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: 8,
                  background: "var(--surface)",
                  borderRadius: 6,
                }}
              >
                <div>
                  <strong>{bp.profiles?.display_name ?? "Unknown"}</strong>
                  <span className="muted" style={{ marginLeft: 8 }}>
                    +{bp.points} pts - {bp.reason ?? "Bonus"}
                  </span>
                </div>
                <span className="muted">{new Date(bp.created_at).toLocaleDateString()}</span>
              </div>
            ))
          ) : (
            <p className="muted">No bonus points awarded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Round Challenge Song Picks Manager Component
function RoundChallengeSongPicks({ groupId }: { groupId?: string }) {
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [sourceRoundId, setSourceRoundId] = useState<string | null>(null);
  const [songs, setSongs] = useState<AdminPickSong[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [themes, setThemes] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<ThemeCategory[]>([]);
  const [existing, setExisting] = useState<{ submission_id: string; theme_id: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Fetch rounds on mount
  useEffect(() => {
    if (!groupId) return;
    const fetchRounds = async () => {
      const { data } = await supabase
        .from("rounds")
        .select("id, theme, season_number, round_number, status")
        .eq("group_id", groupId)
        .order("season_number", { ascending: false })
        .order("round_number", { ascending: false });
      if (data) setRounds(data as RoundSummary[]);
    };
    fetchRounds();
  }, [groupId]);

  // Load songs for selected source round
  const loadSongs = async (roundId: string) => {
    if (!groupId) return;
    setLoading(true);
    setSourceRoundId(roundId);
    setSelected({});
    setThemes({});
    setExisting([]);
    setStatus(null);

    try {
      // Load S1 theme categories from JSON if not already loaded
      if (categories.length === 0) {
        const response = await fetch("/data/round_challenge_song_list.json");
        if (response.ok) {
          const jsonData = await response.json();
          setCategories(
            jsonData.categories.map((c: { id: string; revised_title: string; description: string }) => ({
              id: c.id,
              title: c.revised_title,
              description: c.description,
            }))
          );
        }
      }

      // Load songs from the source round
      const { data: songsData, error: songsError } = await supabase
        .from("submissions")
        .select("id,title,artist,artwork_url,youtube_url")
        .eq("round_id", roundId)
        .order("created_at");

      if (songsError) {
        console.error("Error loading songs:", songsError);
        setSongs([]);
        return;
      }

      setSongs(songsData ?? []);

      // Find the target round (source round_number + 1)
      const sourceRound = rounds.find((r) => r.id === roundId);
      if (sourceRound?.round_number) {
        const possibleTargets = rounds.filter(
          (r) => r.round_number === sourceRound.round_number! + 1 && r.season_number === sourceRound.season_number
        );
        const targetRound = possibleTargets.find((r) => r.status !== "archived") || possibleTargets[0];
        if (targetRound) {
          // Load existing picks for the target round
          const { data: existingPicks } = await supabase
            .from("round_challenge_admin_picks")
            .select("submission_id, theme_id")
            .eq("target_round_id", targetRound.id);

          if (existingPicks && existingPicks.length > 0) {
            setExisting(existingPicks);
            // Pre-populate the selection UI
            const selectedMap: Record<string, boolean> = {};
            const themesMap: Record<string, string> = {};
            existingPicks.forEach((pick) => {
              selectedMap[pick.submission_id] = true;
              themesMap[pick.submission_id] = pick.theme_id;
            });
            setSelected(selectedMap);
            setThemes(themesMap);
          }
        }
      }
    } catch (err) {
      console.error("Error loading songs:", err);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  // Save picks
  const savePicks = async () => {
    if (!groupId || !sourceRoundId) return;

    // Validate: 2-3 songs selected with themes
    const selectedSongIds = Object.entries(selected)
      .filter(([, isSelected]) => isSelected)
      .map(([songId]) => songId);

    if (selectedSongIds.length < 2 || selectedSongIds.length > 3) {
      setStatus("Please select 2 or 3 songs.");
      return;
    }

    const allHaveThemes = selectedSongIds.every((songId) => themes[songId]);
    if (!allHaveThemes) {
      setStatus("Please assign a theme to each selected song.");
      return;
    }

    // Check for duplicate themes
    const themeValues = selectedSongIds.map((songId) => themes[songId]);
    const uniqueThemes = new Set(themeValues);
    if (uniqueThemes.size !== themeValues.length) {
      setStatus("Each song must have a different theme.");
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      // Find source and target rounds
      const sourceRound = rounds.find((r) => r.id === sourceRoundId);
      if (!sourceRound?.round_number) {
        setStatus("Could not find source round.");
        return;
      }

      // Find target round - prefer non-archived rounds
      const possibleTargets = rounds.filter(
        (r) => r.round_number === sourceRound.round_number! + 1 && r.season_number === sourceRound.season_number
      );
      const targetRound = possibleTargets.find((r) => r.status !== "archived") || possibleTargets[0];
      if (!targetRound) {
        setStatus(`No Round ${sourceRound.round_number + 1} found in Season ${sourceRound.season_number}.`);
        return;
      }

      // Delete existing picks for this target round
      await supabase
        .from("round_challenge_admin_picks")
        .delete()
        .eq("target_round_id", targetRound.id);

      // Insert new picks
      const picks = selectedSongIds.map((songId) => ({
        target_round_id: targetRound.id,
        source_round_id: sourceRoundId,
        submission_id: songId,
        theme_id: themes[songId],
      }));

      const { error: insertError } = await supabase
        .from("round_challenge_admin_picks")
        .insert(picks);

      if (insertError) {
        console.error("Error saving picks:", insertError);
        setStatus("Error saving picks. Please try again.");
        return;
      }

      // Reset existing user guesses for this target round
      await supabase
        .from("round_challenge_guesses")
        .delete()
        .eq("round_id", targetRound.id)
        .eq("group_id", groupId);

      // Delete/regenerate the round_challenge_v2 entry if it exists
      await supabase
        .from("round_challenge_v2")
        .delete()
        .eq("round_id", targetRound.id)
        .eq("group_id", groupId);

      setExisting(picks.map((p) => ({ submission_id: p.submission_id, theme_id: p.theme_id })));
      setStatus(`Saved! Songs from Round ${sourceRound.round_number} will be used for Round ${targetRound.round_number}'s game. Any existing guesses have been reset.`);
    } catch (err) {
      console.error("Error saving picks:", err);
      setStatus("Unexpected error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Get target round info for display
  const getTargetRoundInfo = () => {
    if (!sourceRoundId) return null;
    const sourceRound = rounds.find((r) => r.id === sourceRoundId);
    if (!sourceRound?.round_number) return "Select a round to see target.";
    const targetRound = rounds.find(
      (r) => r.round_number === sourceRound.round_number! + 1 && r.season_number === sourceRound.season_number
    );
    return targetRound
      ? `Songs from this round will be used for Round ${targetRound.round_number}'s game (${targetRound.theme}).`
      : `No Round ${sourceRound.round_number + 1} found yet.`;
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>
        Select 2-3 songs from a round's playlist and assign S1 themes. These songs will be used for the next round's game.
      </p>

      <select
        className="field-input"
        value={sourceRoundId ?? ""}
        onChange={(e) => e.target.value && loadSongs(e.target.value)}
      >
        <option value="">Select source round...</option>
        {rounds
          .filter((r) => r.season_number === 2) // Only S2 rounds
          .sort((a, b) => (a.round_number ?? 0) - (b.round_number ?? 0))
          .map((r) => (
            <option key={r.id} value={r.id}>
              S{r.season_number ?? "?"} R{r.round_number ?? "?"}: {r.theme}
            </option>
          ))}
      </select>

      {sourceRoundId && (
        <div style={{ padding: 8, background: "var(--bg-secondary)", borderRadius: 6, fontSize: "0.85rem" }}>
          {getTargetRoundInfo()}
        </div>
      )}

      {loading && <p className="muted">Loading songs...</p>}

      {songs.length > 0 && !loading && (
        <div style={{ display: "grid", gap: 8 }}>
          {songs.map((song) => {
            const isSelected = selected[song.id] ?? false;
            const themeId = themes[song.id] ?? "";
            return (
              <div
                key={song.id}
                style={{
                  padding: 12,
                  background: isSelected ? "var(--bg-secondary)" : "var(--surface)",
                  borderRadius: 8,
                  border: isSelected ? "2px solid var(--coral)" : "2px solid transparent",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) =>
                      setSelected((prev) => ({
                        ...prev,
                        [song.id]: e.target.checked,
                      }))
                    }
                    style={{ width: 18, height: 18, flexShrink: 0 }}
                  />
                  {song.artwork_url && (
                    <img
                      src={song.artwork_url}
                      alt=""
                      style={{ width: 40, height: 40, borderRadius: 4, objectFit: "cover", flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {song.title}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {song.artist}
                    </div>
                  </div>
                  {song.youtube_url && (
                    <a
                      href={song.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--coral)", fontSize: "0.85rem", flexShrink: 0 }}
                    >
                      YouTube
                    </a>
                  )}
                </div>
                {isSelected && (
                  <div style={{ marginTop: 8, marginLeft: 30 }}>
                    <select
                      className="field-input"
                      value={themeId}
                      onChange={(e) =>
                        setThemes((prev) => ({
                          ...prev,
                          [song.id]: e.target.value,
                        }))
                      }
                      style={{ width: "100%" }}
                    >
                      <option value="">Assign S1 theme...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}

          {/* Selection count and save button */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              {selectedCount} of 2-3 selected
            </span>
            <button
              type="button"
              className="btn"
              onClick={savePicks}
              disabled={saving}
              style={{ marginLeft: "auto" }}
            >
              {saving ? "Saving..." : existing.length > 0 ? "Update Picks" : "Finalize Picks"}
            </button>
          </div>

          {status && (
            <div
              style={{
                marginTop: 8,
                padding: 12,
                borderRadius: 6,
                background: status.startsWith("Saved") ? "var(--success-bg)" : "rgba(255, 111, 97, 0.1)",
                color: status.startsWith("Saved") ? "var(--success)" : "var(--error)",
                fontSize: "0.9rem",
              }}
            >
              {status}
            </div>
          )}
        </div>
      )}

      {sourceRoundId && songs.length === 0 && !loading && (
        <div style={{ padding: 16, color: "var(--text-muted)", background: "var(--bg-secondary)", borderRadius: 8 }}>
          No songs found for this round.
        </div>
      )}
    </div>
  );
}
