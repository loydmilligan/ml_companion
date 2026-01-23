# T008: Create AdminTabBar component

## Task Summary
Create AdminTabBar.tsx: horizontal scrollable tab bar with icons. Mobile: icon + shortLabel, horizontal scroll. Desktop: icon + full label.

## Required Context

### Tab Definition Type
```typescript
type AdminTab = {
  id: string;
  label: string;       // Full label for desktop
  shortLabel: string;  // Short label for mobile
  icon: string;        // Emoji
};
```

### Proposed Tabs (from admin-page-refactor-plan.md)
```typescript
const ADMIN_TABS: AdminTab[] = [
  { id: "people", label: "People", shortLabel: "People", icon: "👥" },
  { id: "content", label: "Content", shortLabel: "Content", icon: "📋" },
  { id: "games", label: "Games & AI", shortLabel: "Games", icon: "🎮" },
  { id: "system", label: "System", shortLabel: "System", icon: "⚙️" },
];
```

### Component API Design
```typescript
type AdminTabBarProps = {
  tabs: AdminTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
};
```

### Implementation Pattern
```typescript
// web/src/pages/admin/components/AdminTabBar.tsx
import clsx from "clsx";

type AdminTab = {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
};

type AdminTabBarProps = {
  tabs: AdminTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
};

export default function AdminTabBar({
  tabs,
  activeTab,
  onTabChange,
}: AdminTabBarProps) {
  return (
    <nav className="admin-tab-bar" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={clsx("admin-tab", activeTab === tab.id && "admin-tab--active")}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="admin-tab__icon">{tab.icon}</span>
          <span className="admin-tab__label">{tab.label}</span>
          <span className="admin-tab__short-label">{tab.shortLabel}</span>
        </button>
      ))}
    </nav>
  );
}
```

### CSS Classes (add to admin.css)
```css
.admin-tab-bar {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 8px 0;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.admin-tab-bar::-webkit-scrollbar {
  display: none;
}

.admin-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px 8px 0 0;
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  color: var(--text-muted);
  font-size: 0.9rem;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.admin-tab:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.admin-tab--active {
  background: var(--surface);
  color: var(--text-primary);
  font-weight: 500;
  border-bottom: 2px solid var(--accent);
}

.admin-tab__icon {
  font-size: 1.1rem;
}

/* Mobile: show short label */
.admin-tab__label {
  display: none;
}

.admin-tab__short-label {
  display: inline;
}

/* Desktop: show full label */
@media (min-width: 768px) {
  .admin-tab {
    padding: 12px 20px;
  }

  .admin-tab__label {
    display: inline;
  }

  .admin-tab__short-label {
    display: none;
  }
}
```

## Files to Create
- `web/src/pages/admin/components/AdminTabBar.tsx`

## Files to Edit
- `web/src/pages/admin/components/index.ts` - Add export
- `web/src/pages/admin/admin.css` - Add tab bar styles

## Test Cases
1. renders all tabs
2. shows active state on current tab
3. calls onTabChange when tab clicked
4. renders icons for all tabs

## Manual Test
- Verify horizontal scroll behavior on mobile viewport (375px)
- Check scrollbar is hidden
- Ensure touch scrolling works smoothly

## Acceptance Criteria
- [ ] Horizontal scrolling on mobile
- [ ] Hidden scrollbar
- [ ] Active tab visually distinct
- [ ] Accessible (role="tablist", aria-selected)
- [ ] Short labels on mobile, full labels on desktop
