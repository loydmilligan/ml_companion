# T011: Create AdminPageV2 shell with routing

## Task Summary
Create AdminPageV2.tsx: Main admin page component with AdminContext.Provider wrapper, AdminTabBar, and conditional tab content rendering. Add /app/admin-v2 route.

## Required Context

### Current App.tsx Route Structure (lines 64-78)
```typescript
<Routes>
  <Route index element={<ChatPage />} />
  <Route path="chat" element={<ChatPage />} />
  <Route path="round/:id" element={<RoundDetailPage />} />
  <Route path="history" element={<HistoryPage />} />
  <Route path="admin" element={<AdminPage />} />
  <Route path="profile" element={<ProfilePage />} />
  <Route path="settings" element={<SettingsPage />} />
  // ... more routes
</Routes>
```

### Tab Configuration
```typescript
const ADMIN_TABS = [
  { id: "people", label: "People", shortLabel: "People", icon: "👥" },
  { id: "content", label: "Content", shortLabel: "Content", icon: "📋" },
  { id: "games", label: "Games & AI", shortLabel: "Games", icon: "🎮" },
  { id: "system", label: "System", shortLabel: "System", icon: "⚙️" },
] as const;

type AdminTabId = typeof ADMIN_TABS[number]["id"];
```

### AdminPageV2 Implementation
```typescript
// web/src/pages/admin/AdminPageV2.tsx
import { useState } from "react";
import { AdminProvider, useAdmin } from "./AdminContext";
import { AdminTabBar } from "./components";
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
        {activeTab === "people" && (
          <div className="admin-tab-placeholder">
            <p>People tab content coming soon...</p>
          </div>
        )}
        {activeTab === "content" && (
          <div className="admin-tab-placeholder">
            <p>Content tab content coming soon...</p>
          </div>
        )}
        {activeTab === "games" && (
          <div className="admin-tab-placeholder">
            <p>Games & AI tab content coming soon...</p>
          </div>
        )}
        {activeTab === "system" && (
          <div className="admin-tab-placeholder">
            <p>System tab content coming soon...</p>
          </div>
        )}
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

### Route Addition to App.tsx
```typescript
// Add import
const AdminPageV2 = lazy(() => import("./pages/admin/AdminPageV2"));

// Add route (around line 72, after existing admin route)
<Route path="admin" element={<AdminPage />} />
<Route path="admin-v2" element={<AdminPageV2 />} />
```

### CSS Additions (admin.css)
```css
.admin-page-v2 {
  padding: 16px;
  max-width: 100%;
  min-height: 100vh;
}

.admin-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.admin-loading,
.admin-unauthorized {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
}

.admin-tab-content {
  padding-top: 8px;
}

.admin-tab-placeholder {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
  background: var(--bg-secondary);
  border-radius: 8px;
}
```

## Files to Create
- `web/src/pages/admin/AdminPageV2.tsx`

## Files to Edit
- `web/src/App.tsx` - Add lazy import and route
- `web/src/pages/admin/index.ts` - Export AdminPageV2

## Playwright Test Cases
1. navigates to /app/admin-v2
2. renders tab bar with 4 tabs
3. switches between tabs

## Acceptance Criteria
- [ ] Page loads at /app/admin-v2
- [ ] Shows loading state initially
- [ ] Shows unauthorized message for non-leads
- [ ] Tab bar renders with all 4 tabs
- [ ] Tab switching works correctly
- [ ] CSS imports without errors
