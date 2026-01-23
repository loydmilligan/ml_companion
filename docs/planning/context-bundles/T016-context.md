# T016: Create ContentTab - Rounds section

## Task Summary
Add Rounds AdminSection to ContentTab. Display rounds with status dropdown, theme/winners image upload, playlist URLs, narrative editing.

## Required Context

### RoundSummary Type (from AdminPage.tsx line 46)
```typescript
type RoundSummary = {
  id: string;
  league_id: string | null;
  theme: string;
  theme_description: string | null;
  theme_author: string | null;
  season_number: number | null;
  round_number: number | null;
  external_round_id: string | null;
  playlist_url: string | null;
  youtube_playlist_url: string | null;
  comment_required: boolean;
  status: "open" | "voting" | "revealed" | "archived";
  submission_deadline: string | null;
  voting_deadline: string | null;
  theme_image_url: string | null;
  winners_image_url: string | null;
  narrative: string | null;
  created_at: string;
};
```

### Current Rounds Tab (approximate lines 3350-3700)
The current implementation has:
- Status dropdown per round
- Theme image upload
- Winners image upload
- Playlist URL inputs
- Narrative textarea
- Various AI generation buttons

### Addition to ContentTab.tsx
```typescript
// Add state for rounds
const [rounds, setRounds] = useState<RoundSummary[]>([]);
const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null);

// Fetch rounds
useEffect(() => {
  if (!group?.id) return;
  const fetchRounds = async () => {
    const { data } = await supabase
      .from("rounds")
      .select("*")
      .eq("group_id", group.id)
      .order("season_number", { ascending: false })
      .order("round_number", { ascending: false });
    if (data) setRounds(data);
  };
  fetchRounds();
}, [group?.id]);

// Update round status
const updateRoundStatus = async (roundId: string, status: RoundSummary["status"]) => {
  await supabase.from("rounds").update({ status }).eq("id", roundId);
  setRounds((prev) =>
    prev.map((r) => (r.id === roundId ? { ...r, status } : r))
  );
};

// In JSX, after Leagues section:
<AdminSection icon="🎵" title="Rounds" color="green">
  <div className="round-list">
    {rounds.map((round) => (
      <AdminCard key={round.id} className="round-card">
        <div className="round-header">
          <div className="round-info">
            <span className="round-label">
              S{round.season_number ?? "?"} R{round.round_number ?? "?"}
            </span>
            <strong className="round-theme">{round.theme}</strong>
          </div>
          <AdminSelect
            label=""
            value={round.status}
            onChange={(val) => updateRoundStatus(round.id, val as RoundSummary["status"])}
            options={[
              { value: "open", label: "Open" },
              { value: "voting", label: "Voting" },
              { value: "revealed", label: "Revealed" },
              { value: "archived", label: "Archived" },
            ]}
          />
          <button
            type="button"
            className="round-expand-btn"
            onClick={() =>
              setExpandedRoundId(expandedRoundId === round.id ? null : round.id)
            }
          >
            {expandedRoundId === round.id ? "▼" : "▶"}
          </button>
        </div>

        {expandedRoundId === round.id && (
          <div className="round-edit">
            {/* Playlist URLs */}
            <label className="field">
              <span className="field-label">Spotify Playlist URL</span>
              <input
                type="url"
                className="field-input"
                value={round.playlist_url ?? ""}
                onChange={(e) => {
                  // Update round playlist_url
                }}
                placeholder="https://open.spotify.com/playlist/..."
              />
            </label>

            <label className="field">
              <span className="field-label">YouTube Playlist URL</span>
              <input
                type="url"
                className="field-input"
                value={round.youtube_playlist_url ?? ""}
                onChange={(e) => {
                  // Update round youtube_playlist_url
                }}
                placeholder="https://www.youtube.com/playlist?list=..."
              />
            </label>

            {/* Theme Image */}
            <div className="field">
              <span className="field-label">Theme Image</span>
              {round.theme_image_url ? (
                <img
                  src={round.theme_image_url}
                  alt="Theme"
                  className="round-image-preview"
                />
              ) : (
                <p className="muted">No theme image</p>
              )}
              <input type="file" accept="image/*" />
            </div>

            {/* Winners Image */}
            <div className="field">
              <span className="field-label">Winners Image</span>
              {round.winners_image_url ? (
                <img
                  src={round.winners_image_url}
                  alt="Winners"
                  className="round-image-preview"
                />
              ) : (
                <p className="muted">No winners image</p>
              )}
              <input type="file" accept="image/*" />
            </div>

            {/* Narrative */}
            <label className="field">
              <span className="field-label">Narrative</span>
              <textarea
                className="field-input"
                rows={3}
                value={round.narrative ?? ""}
                placeholder="Round story/summary..."
              />
            </label>
          </div>
        )}
      </AdminCard>
    ))}
  </div>
</AdminSection>
```

### CSS for Rounds
```css
/* Add to admin.css */
.round-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.round-card {
  padding: 12px;
}

.round-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.round-info {
  flex: 1;
  min-width: 0;
}

.round-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  display: block;
}

.round-theme {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.round-expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px 8px;
}

.round-edit {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.round-image-preview {
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  margin-top: 8px;
}
```

## Files to Edit
- `web/src/pages/admin/tabs/ContentTab.tsx` - Add Rounds section
- `web/src/pages/admin/admin.css` - Add round styles

## Test Cases (bundled with T015)
1. renders round list
2. status dropdown changes round status
3. image upload works
4. URL inputs save on blur

## Acceptance Criteria
- [ ] Rounds list shows season/round number
- [ ] Status dropdown updates status
- [ ] Expand shows editing panel
- [ ] Playlist URLs editable
- [ ] Image upload works
