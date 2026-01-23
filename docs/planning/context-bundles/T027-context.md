# T027: Remove old AdminPage after validation

## Task Summary
After admin-v2 is validated in production: remove AdminPage.tsx, remove old /app/admin route wrapper, update SettingsDrawer link.

## Required Context

### Pre-Removal Checklist
Before removing old AdminPage:
1. [ ] admin-v2 deployed to production
2. [ ] Feature flag enabled for all users
3. [ ] 1+ week of production usage without critical issues
4. [ ] User feedback collected and addressed
5. [ ] All functionality verified working

### Files to Delete
- `web/src/pages/AdminPage.tsx` (5,158 lines)

### App.tsx Updates
```typescript
// REMOVE AdminRouteWrapper component entirely

// REMOVE old import
// const AdminPage = lazy(() => import("./pages/AdminPage"));

// CHANGE route from wrapper to direct
// FROM:
<Route path="admin" element={<AdminRouteWrapper />} />
<Route path="admin-v2" element={<AdminPageV2 />} />

// TO:
<Route path="admin" element={<AdminPageV2 />} />
// Remove admin-v2 route entirely OR redirect to /admin
```

### SettingsDrawer Update
```typescript
// web/src/components/SettingsDrawer.tsx
// Find admin link and ensure it points to /app/admin (which now serves v2)

// No change needed if link is already "/app/admin"
// If it was updated to "/app/admin-v2", change back to "/app/admin"
```

### Database Cleanup (Optional)
```sql
-- After successful migration, can remove flag column
-- Run only after all groups have migrated and feature is stable
ALTER TABLE group_settings
DROP COLUMN IF EXISTS admin_v2_enabled;
```

### Verification Steps

1. **After removal, verify:**
   - `/app/admin` loads AdminPageV2
   - All tabs functional
   - No 404 errors
   - No references to old AdminPage in codebase

2. **Search for stale references:**
   ```bash
   grep -r "AdminPage" --include="*.tsx" --include="*.ts" web/src/
   # Should only find AdminPageV2 references
   ```

3. **Check for broken imports:**
   ```bash
   npm run build
   # Should complete without errors
   ```

## Files to Delete
- `web/src/pages/AdminPage.tsx`

## Files to Edit
- `web/src/App.tsx` - Remove wrapper, simplify routes
- `web/src/components/SettingsDrawer.tsx` - Verify admin link

## Manual Test
1. Verify admin link in SettingsDrawer works
2. Verify /app/admin loads correctly
3. Verify no console errors
4. Verify all admin functionality works

## Acceptance Criteria
- [ ] AdminPage.tsx deleted
- [ ] Build succeeds without errors
- [ ] /app/admin serves AdminPageV2
- [ ] No broken links to admin
- [ ] No stale imports or references

## Rollback Plan
If issues discovered after removal:
1. Revert the commit that removed AdminPage.tsx
2. Re-add the AdminRouteWrapper
3. Investigate issues with admin-v2
4. Fix and redeploy
