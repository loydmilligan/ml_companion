# T002: Create admin.css base styles

## Task Summary
Create shared CSS file with variables for admin color scheme, base card styles, section styles, and mobile-first media queries.

## Required Context

### Color Scheme (from settings-inventory.md)
```css
/* Admin Tab Color Coding */
--admin-people: #3b82f6;      /* Blue - Trust, community */
--admin-content: #22c55e;     /* Green - Growth, content */
--admin-games: #a855f7;       /* Purple - Fun, creativity */
--admin-system: #6b7280;      /* Gray - Utility, technical */
```

### Existing CSS Variables (from web/src/index.css)
```css
:root {
  --navy: #0a1a2f;
  --coral: #ff6f61;
  --mint: #18e0a8;
  --blue: #11c1ec;
  --surface: #ffffff;
  --text-primary: #0a1a2f;
  --text-muted: #5a6b7f;
  --shadow: 0 14px 30px rgba(10, 26, 47, 0.15);
  --shadow-soft: 0 8px 20px rgba(10, 26, 47, 0.08);
  --radius: 16px;
  --border: rgba(10, 26, 47, 0.12);
  --bg-secondary: #f3f7fb;
}

/* Dark mode */
:root[data-mode="dark"] {
  --surface: #121c2b;
  --text-primary: #eef3ff;
  --text-muted: #9fb0c8;
  --border: rgba(255, 255, 255, 0.12);
  --bg-secondary: #0a1426;
}
```

### Required CSS Classes

```css
/* admin.css */

/* === Admin Color Variables === */
:root {
  --admin-blue: #3b82f6;
  --admin-green: #22c55e;
  --admin-purple: #a855f7;
  --admin-gray: #6b7280;
}

/* === Base Admin Layout === */
.admin-page-v2 {
  padding: 16px;
  max-width: 100%;
}

/* === Admin Card Styles === */
.admin-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-soft);
  max-width: 600px;
}

.admin-card--blue { border-left: 4px solid var(--admin-blue); }
.admin-card--green { border-left: 4px solid var(--admin-green); }
.admin-card--purple { border-left: 4px solid var(--admin-purple); }
.admin-card--gray { border-left: 4px solid var(--admin-gray); }

/* === Admin Section Styles === */
.admin-section { margin-bottom: 24px; }
.admin-section__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  cursor: pointer;
  user-select: none;
}
.admin-section__icon { font-size: 1.2rem; }
.admin-section__title {
  font-weight: 600;
  flex: 1;
}
.admin-section__chevron {
  transition: transform 0.2s ease;
}
.admin-section--closed .admin-section__chevron {
  transform: rotate(-90deg);
}
.admin-section__content {
  overflow: hidden;
  transition: max-height 0.3s ease;
}
.admin-section--closed .admin-section__content {
  max-height: 0;
}

/* === Admin Toggle Styles === */
.admin-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  padding: 8px 0;
}
.admin-toggle__checkbox {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.admin-toggle__icon { font-size: 1rem; }
.admin-toggle__text { flex: 1; }
.admin-toggle__label {
  font-weight: 500;
  color: var(--text-primary);
}
.admin-toggle__helper {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 2px;
}
.admin-toggle--disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* === Admin Tab Bar === */
.admin-tab-bar {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.admin-tab-bar::-webkit-scrollbar { display: none; }
.admin-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  color: var(--text-muted);
  font-size: 0.9rem;
  transition: all 0.2s ease;
}
.admin-tab:hover {
  background: var(--bg-secondary);
}
.admin-tab--active {
  background: var(--surface);
  color: var(--text-primary);
  font-weight: 500;
  box-shadow: var(--shadow-soft);
}

/* === Mobile First === */
@media (min-width: 768px) {
  .admin-page-v2 { padding: 24px; }
  .admin-card { padding: 20px; }
  .admin-tab { padding: 10px 20px; }
}
```

## File to Create
- `web/src/pages/admin/admin.css`

## Acceptance Criteria
- [ ] CSS file imports without errors
- [ ] Variables work in both light and dark mode
- [ ] Max-width 600px on form containers
- [ ] Mobile-first responsive design
