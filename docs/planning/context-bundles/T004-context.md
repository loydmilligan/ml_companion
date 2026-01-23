# T004: Create AdminSection component

## Task Summary
Create AdminSection.tsx: collapsible section with clickable header (icon + title + chevron), smooth height animation.

## Required Context

### Component API Design
```typescript
type AdminSectionProps = {
  title: string;
  icon: string;  // Emoji string
  color?: "blue" | "green" | "purple" | "gray";
  defaultOpen?: boolean;
  children: React.ReactNode;
};
```

### Implementation Pattern
```typescript
// web/src/pages/admin/components/AdminSection.tsx
import { useState } from "react";
import clsx from "clsx";

type AdminSectionProps = {
  title: string;
  icon: string;
  color?: "blue" | "green" | "purple" | "gray";
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export default function AdminSection({
  title,
  icon,
  color,
  defaultOpen = true,
  children,
}: AdminSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={clsx(
        "admin-section",
        color && `admin-section--${color}`,
        !isOpen && "admin-section--closed"
      )}
    >
      <button
        type="button"
        className="admin-section__header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="admin-section__icon">{icon}</span>
        <span className="admin-section__title">{title}</span>
        <span className="admin-section__chevron">
          {isOpen ? "▼" : "▶"}
        </span>
      </button>
      <div className="admin-section__content">
        {children}
      </div>
    </div>
  );
}
```

### CSS Classes (add to admin.css)
```css
.admin-section {
  margin-bottom: 24px;
  border-radius: 8px;
}

.admin-section--blue { border-left: 3px solid var(--admin-blue); }
.admin-section--green { border-left: 3px solid var(--admin-green); }
.admin-section--purple { border-left: 3px solid var(--admin-purple); }
.admin-section--gray { border-left: 3px solid var(--admin-gray); }

.admin-section__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 1rem;
}

.admin-section__header:hover {
  background: var(--bg-secondary);
  border-radius: 8px;
}

.admin-section__icon {
  font-size: 1.2rem;
}

.admin-section__title {
  flex: 1;
  font-weight: 600;
  color: var(--text-primary);
}

.admin-section__chevron {
  color: var(--text-muted);
  font-size: 0.8rem;
  transition: transform 0.2s ease;
}

.admin-section--closed .admin-section__chevron {
  transform: rotate(-90deg);
}

.admin-section__content {
  padding: 0 12px 12px 12px;
  overflow: hidden;
}

.admin-section--closed .admin-section__content {
  display: none;
}
```

## Files to Create
- `web/src/pages/admin/components/AdminSection.tsx`

## Files to Edit
- `web/src/pages/admin/components/index.ts` - Add export
- `web/src/pages/admin/admin.css` - Add section styles if not present

## Test Cases
1. renders header with icon and title
2. starts open when defaultOpen=true
3. starts closed when defaultOpen=false
4. toggles open/closed on header click
5. renders children when open
6. hides children when closed

## Acceptance Criteria
- [ ] Click toggles open/close state
- [ ] Chevron rotates on state change
- [ ] Aria-expanded attribute updates
- [ ] Color prop applies border color
