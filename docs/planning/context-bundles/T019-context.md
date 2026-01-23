# T019: Create GamesTab - AI and Bonus sections

## Task Summary
Add AI Assistant, AI Images, and Bonus Points AdminSections to GamesTab. Move Release Years UI into Timeline Game section.

## Required Context

### Current AI Settings (lines ~3939-4066)
```typescript
// AI Feature Toggles
<h3>Peek Panel AI Features</h3>
<label className="field">
  <input type="checkbox" checked={settingsDraft?.ai_assistant_enabled} onChange={...} />
  <span>AI Assistant (master toggle)</span>
</label>
<label className="field">
  <input type="checkbox" checked={settingsDraft?.ai_explain_enabled} disabled={!ai_assistant_enabled} />
  <span>Explain Theme</span>
</label>
<label className="field">
  <input type="checkbox" checked={settingsDraft?.ai_hint_enabled} />
  <span>Get Hint</span>
</label>
<label className="field">
  <input type="checkbox" checked={settingsDraft?.ai_validate_enabled} />
  <span>Check Song</span>
</label>
<label className="field">
  <input type="number" value={settingsDraft?.ai_validate_daily_limit ?? 5} />
  <span>Daily Check Limit</span>
</label>
<label className="field">
  <input type="checkbox" checked={settingsDraft?.ai_chat_enabled} />
  <span>Chat @AI Replies</span>
</label>
```

### Model/Palette Options (lines ~5147-5158)
```typescript
const MODEL_OPTIONS = [
  { key: "OPENROUTER_MODEL", label: "OPENROUTER_MODEL", image: false },
  { key: "OPENROUTER_ROUND_IMAGE_MODEL", label: "OPENROUTER_ROUND_IMAGE_MODEL", image: true },
  // ...
];

const LOGO_PALETTE_OPTIONS = [
  { key: "ocean-coral", label: "Ocean + Coral" },
  { key: "teal-mango", label: "Teal Night + Mango" },
  { key: "midnight-mint", label: "Midnight + Neon Mint" },
];
```

### GroupSettings AI Fields
```typescript
ai_assistant_enabled: boolean;
ai_explain_enabled: boolean;
ai_validate_enabled: boolean;
ai_hint_enabled: boolean;
ai_validate_daily_limit: number;
ai_chat_enabled: boolean;
round_summary_model_key: string | null;
round_theme_image_model_key: string | null;
logo_palette: string | null;
```

### Additions to GamesTab.tsx
```typescript
// Add to imports
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

// Add after minigame sections:

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

{/* Timeline Release Years Management */}
<AdminSection icon="📅" title="Release Year Data" color="purple" defaultOpen={false}>
  <TimelineReleaseYearManager rounds={rounds} />
</AdminSection>

{/* Bonus Points */}
<AdminSection icon="⭐" title="Bonus Points" color="purple">
  <BonusPointsManager groupId={group?.id} />
</AdminSection>
```

### Bonus Points Sub-component
```typescript
function BonusPointsManager({ groupId }: { groupId?: string }) {
  const [bonusPoints, setBonusPoints] = useState<BonusPointEntry[]>([]);
  const [awardUserId, setAwardUserId] = useState("");
  const [awardPoints, setAwardPoints] = useState("");
  const [awardReason, setAwardReason] = useState("");

  // Fetch recent bonus points
  useEffect(() => {
    if (!groupId) return;
    // Fetch from bonus_points table
  }, [groupId]);

  const awardBonusPoints = async () => {
    // Insert bonus points
  };

  return (
    <div className="bonus-manager">
      <div className="bonus-form">
        <AdminSelect
          label="User"
          value={awardUserId}
          onChange={setAwardUserId}
          options={/* users list */}
        />
        <input
          type="number"
          placeholder="Points"
          value={awardPoints}
          onChange={(e) => setAwardPoints(e.target.value)}
        />
        <input
          placeholder="Reason"
          value={awardReason}
          onChange={(e) => setAwardReason(e.target.value)}
        />
        <button onClick={awardBonusPoints}>Award</button>
      </div>

      <h4>Recent Awards</h4>
      <div className="bonus-list">
        {bonusPoints.map((bp) => (
          <div key={bp.id} className="bonus-row">
            <strong>{bp.profiles?.display_name}</strong>
            <span>+{bp.points} - {bp.reason}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Files to Edit
- `web/src/pages/admin/tabs/GamesTab.tsx` - Add AI and Bonus sections
- `web/src/pages/admin/admin.css` - Add bonus styles

## Test Cases (bundled with T018)
1. AI toggles update settings
2. model/palette selects work
3. bonus points form submits
4. release years UI in timeline section

## Acceptance Criteria
- [ ] AI master toggle disables child toggles
- [ ] Model/palette selects work
- [ ] Bonus points form works
- [ ] Recent awards list renders
