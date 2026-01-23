# T018: Create GamesTab - Minigames sections

## Task Summary
Create GamesTab.tsx with three AdminSections for minigames: Guess the Submitter, Timeline Game, Round Challenge. Each has master toggle in header.

## Required Context

### Current AI Settings Tab - Minigame Settings (lines ~4067-4200)
```typescript
<h3 style={{ margin: "24px 0 12px 0", fontSize: "1rem" }}>Minigame Settings</h3>

<label className="field" style={{ display: "flex", alignItems: "center", gap: 12 }}>
  <input
    type="checkbox"
    checked={settingsDraft?.round_challenge_enabled ?? true}
    onChange={(e) =>
      setSettingsDraft((prev) =>
        prev ? { ...prev, round_challenge_enabled: e.target.checked } : prev
      )
    }
  />
  <div>
    <span className="field-label">Round Challenge</span>
    <span className="field-helper">Guess-the-theme minigame</span>
  </div>
</label>

{settingsDraft?.round_challenge_enabled && (
  <label className="field" style={{ margin: "0 0 0 30px" }}>
    <span className="field-label">Available during:</span>
    <select
      value={settingsDraft?.round_challenge_phase ?? "open"}
      onChange={(e) =>
        setSettingsDraft((prev) =>
          prev ? { ...prev, round_challenge_phase: e.target.value } : prev
        )
      }
    >
      <option value="open">Open phase only</option>
      <option value="voting">Voting phase only</option>
      <option value="both">Both open and voting</option>
    </select>
  </label>
)}
```

### GroupSettings Minigame Fields
```typescript
// From GroupSettings type
round_challenge_enabled: boolean;
round_challenge_phase: "open" | "voting" | "both";
submitter_guess_enabled: boolean;
timeline_game_enabled: boolean;
timeline_game_phase: "voting" | "revealed" | "both";
```

### New GamesTab Implementation
```typescript
// web/src/pages/admin/tabs/GamesTab.tsx
import { useAdmin } from "../AdminContext";
import { AdminSection, AdminToggle, AdminSelect, AdminFieldGroup } from "../components";

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

export default function GamesTab() {
  const { settings, updateSetting } = useAdmin();

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

        {/* Link to manage release years - handled in T019 */}
        <p className="muted" style={{ fontSize: "0.85rem", marginTop: 8 }}>
          Requires release year data for all songs. See AI & Bonus section for release year management.
        </p>
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

      {/* Placeholder for AI sections (T019) */}
      {/* Placeholder for Bonus section (T019) */}
    </div>
  );
}
```

## Files to Create
- `web/src/pages/admin/tabs/GamesTab.tsx`

## Files to Edit
- `web/src/pages/admin/tabs/index.ts` - Add export

## Test Cases
1. renders three minigame sections
2. master toggles enable/disable games
3. phase selects update settings

## Acceptance Criteria
- [ ] Three minigame sections render
- [ ] Enable toggles work
- [ ] Phase dropdowns appear when enabled
- [ ] Settings persist via updateSetting
