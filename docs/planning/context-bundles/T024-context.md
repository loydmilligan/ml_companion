# T024: Wire all tabs into AdminPageV2

## Task Summary
Import and render all four tabs (PeopleTab, ContentTab, GamesTab, SystemTab) in AdminPageV2.tsx based on activeTab state.

## Required Context

### Current AdminPageV2 Shell (from T011)
```typescript
function AdminContent() {
  const { group, loading } = useAdmin();
  const [activeTab, setActiveTab] = useState<AdminTabId>("people");

  // Currently has placeholders for each tab
  return (
    <div className="admin-page-v2">
      <AdminTabBar tabs={[...ADMIN_TABS]} activeTab={activeTab} onTabChange={...} />
      <div className="admin-tab-content">
        {activeTab === "people" && <div>Placeholder...</div>}
        {/* etc */}
      </div>
    </div>
  );
}
```

### Updated Implementation
```typescript
// web/src/pages/admin/AdminPageV2.tsx
import { useState } from "react";
import { AdminProvider, useAdmin } from "./AdminContext";
import { AdminTabBar } from "./components";
import { PeopleTab, ContentTab, GamesTab, SystemTab } from "./tabs";
import "./admin.css";

const ADMIN_TABS = [
  { id: "people", label: "People", shortLabel: "People", icon: "👥" },
  { id: "content", label: "Content", shortLabel: "Content", icon: "📋" },
  { id: "games", label: "Games & AI", shortLabel: "Games", icon: "🎮" },
  { id: "system", label: "System", shortLabel: "System", icon: "⚙️" },
] as const;

type AdminTabId = typeof ADMIN_TABS[number]["id"];

function AdminContent() {
  const { group, loading } = useAdmin();
  const [activeTab, setActiveTab] = useState<AdminTabId>("people");

  if (loading) {
    return <div className="admin-loading">Loading admin settings...</div>;
  }

  if (group?.role !== "lead") {
    return (
      <div className="admin-unauthorized">
        You need lead permissions to access admin settings.
      </div>
    );
  }

  return (
    <div className="admin-page-v2">
      <h1 className="admin-title">Admin Panel</h1>
      <AdminTabBar
        tabs={[...ADMIN_TABS]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as AdminTabId)}
      />
      <div className="admin-tab-content">
        {activeTab === "people" && <PeopleTab />}
        {activeTab === "content" && <ContentTab />}
        {activeTab === "games" && <GamesTab />}
        {activeTab === "system" && <SystemTab />}
      </div>
    </div>
  );
}

export default function AdminPageV2() {
  return (
    <AdminProvider>
      <AdminContent />
    </AdminProvider>
  );
}
```

### tabs/index.ts Update
```typescript
// web/src/pages/admin/tabs/index.ts
export { default as PeopleTab } from "./PeopleTab";
export { default as ContentTab } from "./ContentTab";
export { default as GamesTab } from "./GamesTab";
export { default as SystemTab } from "./SystemTab";
```

## Dependencies
This task requires all of these to be complete:
- T011 (AdminPageV2 shell)
- T020 (PeopleTab complete)
- T021 (ContentTab complete)
- T022 (GamesTab complete)
- T023 (SystemTab)

## Files to Edit
- `web/src/pages/admin/AdminPageV2.tsx` - Import and render tabs

## Playwright Test Cases
1. all tabs render without errors
2. tab switching preserves state
3. data persists across tab changes

## Acceptance Criteria
- [ ] All four tabs import without errors
- [ ] Tab switching works correctly
- [ ] No console errors on any tab
- [ ] State persists when switching tabs
