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
    <div className="games-tab">
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
