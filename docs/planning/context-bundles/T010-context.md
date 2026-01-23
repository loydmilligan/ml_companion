# T010: Create useGroupSettings hook

## Task Summary
Create useGroupSettings.ts: Custom hook that fetches group_settings, returns settings, loading, error, and updateSetting function.

## Required Context

### Current Fetch Pattern in AdminPage.tsx (lines ~593-620)
```typescript
// Fetch group settings with fallback defaults
useEffect(() => {
  if (!group?.id) return;
  const fetchGroupSettings = async () => {
    const { data, error } = await supabase
      .from("group_settings")
      .select("*")
      .eq("group_id", group.id)
      .single();

    if (error || !data) {
      // Provide fallback defaults
      const fallback: GroupSettings = {
        id: "",
        group_id: group.id,
        round_summary_model_key: null,
        // ... all fields with defaults
        ai_assistant_enabled: true,
        ai_explain_enabled: true,
        ai_validate_enabled: true,
        ai_hint_enabled: true,
        ai_validate_daily_limit: 5,
        ai_chat_enabled: true,
        // ... etc
      };
      setGroupSettings(fallback);
      setSettingsDraft(fallback);
    } else {
      setGroupSettings(data as GroupSettings);
      setSettingsDraft(data as GroupSettings);
    }
  };
  fetchGroupSettings();
}, [group?.id]);
```

### GroupSettings Type
```typescript
type GroupSettings = {
  id: string;
  group_id: string;
  round_summary_model_key: string | null;
  round_story_image_model_key: string | null;
  round_theme_image_model_key: string | null;
  awards_model_key: string | null;
  trophy_image_model_key: string | null;
  logo_palette: string | null;
  ai_assistant_enabled: boolean;
  ai_explain_enabled: boolean;
  ai_validate_enabled: boolean;
  ai_hint_enabled: boolean;
  ai_validate_daily_limit: number;
  ai_chat_enabled: boolean;
  round_challenge_enabled: boolean;
  round_challenge_phase: "open" | "voting" | "both";
  submitter_guess_enabled: boolean;
  timeline_game_enabled: boolean;
  timeline_game_phase: "voting" | "revealed" | "both";
  reveal_timer_hours: number;
  playlist_tab_respect_timer: boolean;
  progress_tab_respect_timer: boolean;
  games_tab_respect_timer: boolean;
};
```

### New Hook Design
```typescript
// web/src/pages/admin/hooks/useGroupSettings.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";

type GroupSettings = { /* full type */ };

const DEFAULT_SETTINGS: Omit<GroupSettings, "id" | "group_id"> = {
  round_summary_model_key: null,
  round_story_image_model_key: null,
  round_theme_image_model_key: null,
  awards_model_key: null,
  trophy_image_model_key: null,
  logo_palette: null,
  ai_assistant_enabled: true,
  ai_explain_enabled: true,
  ai_validate_enabled: true,
  ai_hint_enabled: true,
  ai_validate_daily_limit: 5,
  ai_chat_enabled: true,
  round_challenge_enabled: true,
  round_challenge_phase: "both",
  submitter_guess_enabled: true,
  timeline_game_enabled: false,
  timeline_game_phase: "voting",
  reveal_timer_hours: 8,
  playlist_tab_respect_timer: true,
  progress_tab_respect_timer: true,
  games_tab_respect_timer: true,
};

export function useGroupSettings(groupId: string | null | undefined) {
  const [settings, setSettings] = useState<GroupSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("group_settings")
        .select("*")
        .eq("group_id", groupId)
        .single();

      if (fetchError || !data) {
        // Use defaults if no settings exist
        setSettings({
          id: "",
          group_id: groupId,
          ...DEFAULT_SETTINGS,
        });
      } else {
        setSettings(data as GroupSettings);
      }
      setLoading(false);
    };

    fetchSettings();
  }, [groupId]);

  const updateSetting = useCallback(
    async <K extends keyof GroupSettings>(key: K, value: GroupSettings[K]) => {
      if (!settings?.id || !settings.id) {
        setError("Cannot update: settings not loaded");
        return;
      }

      // Optimistic update
      setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));

      const { error: updateError } = await supabase
        .from("group_settings")
        .update({ [key]: value })
        .eq("id", settings.id);

      if (updateError) {
        setError(updateError.message);
        // Revert optimistic update on error - would need to store previous value
      }
    },
    [settings?.id]
  );

  return { settings, loading, error, updateSetting };
}
```

### Usage Example
```typescript
function GamesTab() {
  const { group } = useAuth();
  const { settings, loading, updateSetting } = useGroupSettings(group?.id);

  if (loading) return <p>Loading...</p>;
  if (!settings) return <p>No settings found</p>;

  return (
    <AdminToggle
      icon="🎮"
      label="Round Challenge"
      checked={settings.round_challenge_enabled}
      onChange={(checked) => updateSetting("round_challenge_enabled", checked)}
    />
  );
}
```

## Files to Create
- `web/src/pages/admin/hooks/useGroupSettings.ts`

## Files to Edit
- `web/src/pages/admin/hooks/index.ts` - Add export

## Test Cases
1. fetches settings on mount
2. returns loading state while fetching
3. updateSetting updates local state optimistically
4. updateSetting calls supabase update

## Acceptance Criteria
- [ ] Hook fetches settings when groupId provided
- [ ] Returns default values if no settings exist
- [ ] Optimistic update for better UX
- [ ] Error handling for failed updates
