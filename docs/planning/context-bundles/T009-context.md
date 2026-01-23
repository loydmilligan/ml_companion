# T009: Create AdminContext for shared state

## Task Summary
Create AdminContext.tsx: React context providing shared state (group, groupSettings, users, loading) and methods (refreshUsers, updateSettings).

## Required Context

### Current State Management in AdminPage.tsx (lines ~155-300)
```typescript
// Current pattern - 108 useState hooks in AdminPage.tsx
const { group, profile } = useAuth();
const [users, setUsers] = useState<UserRow[]>([]);
const [, setGroupSettings] = useState<GroupSettings | null>(null);
const [settingsDraft, setSettingsDraft] = useState<GroupSettings | null>(null);
// ... many more

// Fetch users function (around line 620)
const fetchUsers = async (groupId: string) => {
  const { data } = await supabase
    .from("group_members")
    .select(`
      member_id,
      role,
      profiles (id, display_name, email, chat_notify_enabled, ...)
    `)
    .eq("group_id", groupId);
  if (data) setUsers(data as UserRow[]);
};
```

### GroupSettings Type (from AdminPage.tsx line 5117)
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

### UserRow Type (from AdminPage.tsx line 26)
```typescript
type UserRow = {
  member_id: string;
  role: string | null;
  profiles: {
    id: string;
    display_name: string | null;
    email: string | null;
    chat_notify_enabled: boolean | null;
    email_notify_enabled: boolean | null;
    can_toggle_chat_notify: boolean | null;
    can_toggle_email_notify: boolean | null;
    reaction_notify_enabled: boolean | null;
    can_toggle_reaction_notify: boolean | null;
    can_toggle_ntfy_notify: boolean | null;
    can_toggle_push_notify: boolean | null;
    ntfy_topic: string | null;
    timeline_game_tester: boolean | null;
  } | null;
};
```

### New Context Design
```typescript
// web/src/pages/admin/AdminContext.tsx
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

type GroupSettings = { /* ... as above ... */ };
type UserRow = { /* ... as above ... */ };

type AdminContextValue = {
  group: { id: string; role: string } | null;
  settings: GroupSettings | null;
  users: UserRow[];
  loading: boolean;
  refreshUsers: () => Promise<void>;
  updateSetting: <K extends keyof GroupSettings>(key: K, value: GroupSettings[K]) => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { group } = useAuth();
  const [settings, setSettings] = useState<GroupSettings | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async (groupId: string) => {
    const { data } = await supabase
      .from("group_settings")
      .select("*")
      .eq("group_id", groupId)
      .single();
    if (data) setSettings(data as GroupSettings);
  }, []);

  const fetchUsers = useCallback(async (groupId: string) => {
    const { data } = await supabase
      .from("group_members")
      .select(`
        member_id,
        role,
        profiles (id, display_name, email, chat_notify_enabled, email_notify_enabled, ...)
      `)
      .eq("group_id", groupId);
    if (data) setUsers(data as UserRow[]);
  }, []);

  useEffect(() => {
    if (!group?.id) return;
    setLoading(true);
    Promise.all([fetchSettings(group.id), fetchUsers(group.id)]).finally(() => {
      setLoading(false);
    });
  }, [group?.id, fetchSettings, fetchUsers]);

  const refreshUsers = useCallback(async () => {
    if (group?.id) await fetchUsers(group.id);
  }, [group?.id, fetchUsers]);

  const updateSetting = useCallback(async <K extends keyof GroupSettings>(key: K, value: GroupSettings[K]) => {
    if (!settings?.id) return;
    // Optimistic update
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
    // Persist to DB
    await supabase.from("group_settings").update({ [key]: value }).eq("id", settings.id);
  }, [settings?.id]);

  return (
    <AdminContext.Provider value={{ group, settings, users, loading, refreshUsers, updateSetting }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used within AdminProvider");
  return context;
}
```

## Files to Create
- `web/src/pages/admin/AdminContext.tsx`

## Files to Edit
- `web/src/pages/admin/index.ts` - Add exports

## Test Cases
1. provides group from AuthContext
2. fetches and provides groupSettings
3. provides users list
4. updateSettings updates state and database

## Acceptance Criteria
- [ ] Context provides all shared state
- [ ] Optimistic updates for settings
- [ ] Loading state while fetching
- [ ] useAdmin hook throws if used outside provider
