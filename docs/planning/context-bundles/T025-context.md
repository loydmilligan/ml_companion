# T025: Add feature flag for admin version switch

## Task Summary
Add admin_v2_enabled flag to group_settings. In App.tsx, check flag to serve correct admin version. Add toggle in System tab to switch.

## Required Context

### Database Migration
```sql
-- supabase/migrations/YYYYMMDD_add_admin_v2_flag.sql
ALTER TABLE group_settings
ADD COLUMN IF NOT EXISTS admin_v2_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN group_settings.admin_v2_enabled IS
  'Feature flag to enable the new admin panel (v2)';
```

### App.tsx Route Update
```typescript
// Current route (around line 72)
<Route path="admin" element={<AdminPage />} />
<Route path="admin-v2" element={<AdminPageV2 />} />

// Updated with redirect logic
function AdminRouteWrapper() {
  const { group } = useAuth();
  const [adminV2Enabled, setAdminV2Enabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (!group?.id) return;
    const checkFlag = async () => {
      const { data } = await supabase
        .from("group_settings")
        .select("admin_v2_enabled")
        .eq("group_id", group.id)
        .single();
      setAdminV2Enabled(data?.admin_v2_enabled ?? false);
    };
    checkFlag();
  }, [group?.id]);

  if (adminV2Enabled === null) {
    return <div className="admin-loading">Loading...</div>;
  }

  // If v2 enabled, redirect to v2
  if (adminV2Enabled) {
    return <Navigate to="/app/admin-v2" replace />;
  }

  return <AdminPage />;
}

// In routes
<Route path="admin" element={<AdminRouteWrapper />} />
<Route path="admin-v2" element={<AdminPageV2 />} />
```

### SystemTab Toggle Addition
```typescript
// Add to SystemTab.tsx, in a new AdminSection

<AdminSection icon="🔄" title="Admin Panel Version" color="gray">
  <AdminCard>
    <p className="muted">
      Switch between the classic admin panel and the new redesigned version.
    </p>
    <AdminToggle
      icon="✨"
      label="Use New Admin Panel (v2)"
      helper="Enable the redesigned admin panel with improved navigation"
      checked={settings.admin_v2_enabled ?? false}
      onChange={(checked) => {
        updateSetting("admin_v2_enabled", checked);
        // Optionally redirect after toggle
        if (checked) {
          window.location.href = "/app/admin-v2";
        }
      }}
    />
    <p className="muted" style={{ marginTop: 8, fontSize: "0.85rem" }}>
      You can switch back at any time from the System tab.
    </p>
  </AdminCard>
</AdminSection>
```

### Update GroupSettings Type
```typescript
// Add to GroupSettings type
admin_v2_enabled: boolean;
```

## Files to Create
- `supabase/migrations/YYYYMMDD_add_admin_v2_flag.sql`

## Files to Edit
- `web/src/App.tsx` - Add wrapper component and redirect logic
- `web/src/pages/admin/tabs/SystemTab.tsx` - Add version toggle
- Update GroupSettings type wherever defined

## Manual Test
1. Toggle flag off → /app/admin shows old AdminPage
2. Toggle flag on → /app/admin redirects to /app/admin-v2
3. Both routes remain accessible directly

## Acceptance Criteria
- [ ] Migration adds column successfully
- [ ] Feature flag toggle appears in System tab
- [ ] Redirect works based on flag
- [ ] Can still access both versions directly via URL
