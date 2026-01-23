# T015: Create ContentTab - Leagues section

## Task Summary
Create ContentTab.tsx with Leagues AdminSection. Display league list with name, season number. Expandable row for narrative editing.

## Required Context

### Current Leagues Tab in AdminPage.tsx
```typescript
// LeagueSummary type (line 10)
type LeagueSummary = {
  id: string;
  name: string;
  season_number: number | null;
  created_at: string;
  narrative: string | null;
};

// Leagues rendering (approximate lines 3250-3350)
{activeTab === "leagues" ? (
  <Card className="dashboard-card">
    <h2>Leagues</h2>
    {leagues.map((league) => (
      <div key={league.id} className="admin-list-row">
        <div>
          <strong>{league.name}</strong>
          <span className="muted">Season {league.season_number ?? "—"}</span>
        </div>
        {editingLeagueId === league.id ? (
          <div>
            <textarea
              value={editingLeagueName}
              onChange={...}
              placeholder="League narrative"
            />
            <Button onClick={saveLeague}>Save</Button>
            <Button onClick={() => setEditingLeagueId(null)}>Cancel</Button>
          </div>
        ) : (
          <Button onClick={() => startEditingLeague(league)}>Edit</Button>
        )}
      </div>
    ))}
  </Card>
) : null}
```

### New ContentTab Implementation
```typescript
// web/src/pages/admin/tabs/ContentTab.tsx
import { useState, useEffect } from "react";
import { useAdmin } from "../AdminContext";
import { AdminCard, AdminSection } from "../components";
import { supabase } from "../../../lib/supabase";

type LeagueSummary = {
  id: string;
  name: string;
  season_number: number | null;
  created_at: string;
  narrative: string | null;
};

export default function ContentTab() {
  const { group } = useAdmin();
  const [leagues, setLeagues] = useState<LeagueSummary[]>([]);
  const [expandedLeagueId, setExpandedLeagueId] = useState<string | null>(null);
  const [narrativeDraft, setNarrativeDraft] = useState("");

  useEffect(() => {
    if (!group?.id) return;
    const fetchLeagues = async () => {
      const { data } = await supabase
        .from("leagues")
        .select("id, name, season_number, created_at, narrative")
        .eq("group_id", group.id)
        .order("season_number", { ascending: false });
      if (data) setLeagues(data);
    };
    fetchLeagues();
  }, [group?.id]);

  const toggleExpand = (league: LeagueSummary) => {
    if (expandedLeagueId === league.id) {
      setExpandedLeagueId(null);
    } else {
      setExpandedLeagueId(league.id);
      setNarrativeDraft(league.narrative ?? "");
    }
  };

  const saveNarrative = async (leagueId: string) => {
    await supabase
      .from("leagues")
      .update({ narrative: narrativeDraft })
      .eq("id", leagueId);
    setLeagues((prev) =>
      prev.map((l) =>
        l.id === leagueId ? { ...l, narrative: narrativeDraft } : l
      )
    );
    setExpandedLeagueId(null);
  };

  return (
    <div className="content-tab">
      <AdminSection icon="🏆" title="Leagues" color="green" defaultOpen>
        <div className="league-list">
          {leagues.map((league) => (
            <AdminCard key={league.id} className="league-card">
              <div
                className="league-header"
                onClick={() => toggleExpand(league)}
              >
                <div className="league-info">
                  <strong>{league.name}</strong>
                  <span className="muted">
                    Season {league.season_number ?? "—"}
                  </span>
                </div>
                <span className="league-expand-icon">
                  {expandedLeagueId === league.id ? "▼" : "▶"}
                </span>
              </div>

              {expandedLeagueId === league.id && (
                <div className="league-edit">
                  <label className="field">
                    <span className="field-label">Narrative</span>
                    <textarea
                      className="field-input"
                      rows={3}
                      value={narrativeDraft}
                      onChange={(e) => setNarrativeDraft(e.target.value)}
                      placeholder="Describe this league/season..."
                    />
                  </label>
                  <div className="league-edit-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setExpandedLeagueId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => saveNarrative(league.id)}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </AdminCard>
          ))}
        </div>
      </AdminSection>

      {/* Placeholder for Rounds section (T016) */}
      {/* Placeholder for Imports section (T017) */}
    </div>
  );
}
```

### CSS for Leagues
```css
/* Add to admin.css */
.league-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.league-card {
  padding: 12px;
}

.league-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.league-info {
  display: flex;
  flex-direction: column;
}

.league-expand-icon {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.league-edit {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.league-edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}
```

## Files to Create
- `web/src/pages/admin/tabs/ContentTab.tsx`

## Files to Edit
- `web/src/pages/admin/tabs/index.ts` - Add export
- `web/src/pages/admin/admin.css` - Add league styles

## Test Cases
1. renders league list
2. expand shows narrative editor
3. save updates league narrative

## Acceptance Criteria
- [ ] Leagues list renders with season numbers
- [ ] Click expands/collapses edit panel
- [ ] Narrative saves correctly
