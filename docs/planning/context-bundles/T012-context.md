# T012: Create PeopleTab - Members section

## Task Summary
Create PeopleTab.tsx with Members AdminSection. Display user list with avatar, name, email, role badge. Role toggle and permission toggles using AdminToggle.

## Required Context

### Current Users Tab in AdminPage.tsx (approximate structure)
```typescript
// Lines ~2890-3150 in AdminPage.tsx
{activeTab === "users" ? (
  <Card className="dashboard-card">
    <h2>Members</h2>
    <div className="admin-list">
      {users.map((user) => (
        <div key={user.member_id} className="admin-list-row">
          <div className="admin-row-main">
            <Avatar ... />
            <div>
              <strong>{user.profiles?.display_name ?? "—"}</strong>
              <span className="muted">{user.profiles?.email ?? "—"}</span>
            </div>
          </div>
          {/* Role toggle */}
          <select value={user.role ?? "member"} onChange={...}>
            <option value="member">Member</option>
            <option value="lead">Lead</option>
          </select>
          {/* Permission toggles */}
          <label><input type="checkbox" /> Chat notify</label>
          <label><input type="checkbox" /> Email notify</label>
          ...
        </div>
      ))}
    </div>
  </Card>
) : null}
```

### UserRow Type
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

### New PeopleTab Implementation
```typescript
// web/src/pages/admin/tabs/PeopleTab.tsx
import { useAdmin } from "../AdminContext";
import { AdminCard, AdminSection, AdminToggle, AdminSelect } from "../components";
import { supabase } from "../../../lib/supabase";

export default function PeopleTab() {
  const { users, refreshUsers } = useAdmin();

  const updateUserRole = async (memberId: string, role: string) => {
    await supabase
      .from("group_members")
      .update({ role })
      .eq("member_id", memberId);
    refreshUsers();
  };

  const updateUserPermission = async (
    profileId: string,
    field: string,
    value: boolean
  ) => {
    await supabase
      .from("profiles")
      .update({ [field]: value })
      .eq("id", profileId);
    refreshUsers();
  };

  return (
    <div className="people-tab">
      <AdminSection icon="👥" title="Members" color="blue" defaultOpen>
        <div className="member-list">
          {users.map((user) => (
            <AdminCard key={user.member_id} className="member-card">
              <div className="member-header">
                <div className="member-avatar">
                  {/* Avatar placeholder - first letter of name */}
                  <span>{user.profiles?.display_name?.[0] ?? "?"}</span>
                </div>
                <div className="member-info">
                  <strong>{user.profiles?.display_name ?? "Unknown"}</strong>
                  <span className="muted">{user.profiles?.email ?? "—"}</span>
                </div>
                <AdminSelect
                  label="Role"
                  value={user.role ?? "member"}
                  onChange={(val) => updateUserRole(user.member_id, val)}
                  options={[
                    { value: "member", label: "Member" },
                    { value: "lead", label: "Lead" },
                  ]}
                />
              </div>

              {/* Permission toggles */}
              <div className="member-permissions">
                {user.profiles?.can_toggle_chat_notify && (
                  <AdminToggle
                    icon="💬"
                    label="Chat notify"
                    checked={user.profiles.chat_notify_enabled ?? false}
                    onChange={(checked) =>
                      updateUserPermission(user.profiles!.id, "chat_notify_enabled", checked)
                    }
                  />
                )}
                {user.profiles?.can_toggle_email_notify && (
                  <AdminToggle
                    icon="📧"
                    label="Email notify"
                    checked={user.profiles.email_notify_enabled ?? false}
                    onChange={(checked) =>
                      updateUserPermission(user.profiles!.id, "email_notify_enabled", checked)
                    }
                  />
                )}
                {/* Add other permission toggles as needed */}
              </div>
            </AdminCard>
          ))}
        </div>
      </AdminSection>

      {/* Placeholder for Invitations section (T013) */}
      {/* Placeholder for Competitors section (T014) */}
    </div>
  );
}
```

### CSS for Member Cards
```css
/* Add to admin.css */
.member-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-card {
  padding: 12px;
}

.member-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--admin-blue);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-info strong {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-info .muted {
  font-size: 0.85rem;
}

.member-permissions {
  padding-top: 8px;
  border-top: 1px solid var(--border);
  margin-top: 8px;
}
```

## Files to Create
- `web/src/pages/admin/tabs/PeopleTab.tsx`

## Files to Edit
- `web/src/pages/admin/tabs/index.ts` - Add export
- `web/src/pages/admin/admin.css` - Add member styles

## IMPORTANT: Features REMOVED
- NO relationship/connections UI (was ~150 lines of complex dropdowns)
- Simplified from original - focus on essential member management

## Test Cases
1. renders member list from context
2. displays user avatar, name, role
3. role toggle changes user role
4. permission toggles update user permissions

## Acceptance Criteria
- [ ] Members list renders
- [ ] Role dropdown updates role
- [ ] Permission toggles work
- [ ] No relationship/connections UI
