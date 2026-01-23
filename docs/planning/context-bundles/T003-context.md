# T003: Create AdminCard component

## Task Summary
Create AdminCard.tsx: accepts children, title, icon, color, className. Renders Card with optional colored left border and icon+title header.

## Required Context

### Existing Card Component (web/src/components/Card.tsx)
```typescript
import type React from "react";
import clsx from "clsx";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "navy" | "glass";
};

export default function Card({ tone = "default", className, ...props }: CardProps) {
  return <div className={clsx("card", `card-${tone}`, className)} {...props} />;
}
```

### Component API Design
```typescript
type AdminCardProps = {
  children: React.ReactNode;
  title?: string;
  icon?: string;  // Emoji string
  color?: "blue" | "green" | "purple" | "gray";
  className?: string;
};
```

### Implementation Pattern
```typescript
// web/src/pages/admin/components/AdminCard.tsx
import clsx from "clsx";
import Card from "../../../components/Card";

type AdminCardProps = {
  children: React.ReactNode;
  title?: string;
  icon?: string;
  color?: "blue" | "green" | "purple" | "gray";
  className?: string;
};

export default function AdminCard({
  children,
  title,
  icon,
  color,
  className,
}: AdminCardProps) {
  return (
    <Card
      className={clsx(
        "admin-card",
        color && `admin-card--${color}`,
        className
      )}
    >
      {(title || icon) && (
        <div className="admin-card__header">
          {icon && <span className="admin-card__icon">{icon}</span>}
          {title && <h3 className="admin-card__title">{title}</h3>}
        </div>
      )}
      {children}
    </Card>
  );
}
```

### CSS Classes Needed (in admin.css)
```css
.admin-card {
  max-width: 600px;
}

.admin-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.admin-card__icon {
  font-size: 1.2rem;
}

.admin-card__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}
```

## Files to Create
- `web/src/pages/admin/components/AdminCard.tsx`

## Files to Edit
- `web/src/pages/admin/components/index.ts` - Add export

## Test Cases
1. renders children
2. renders title and icon when provided
3. applies color class for left border
4. applies custom className

## Acceptance Criteria
- [ ] Component renders children correctly
- [ ] Title/icon header appears when props provided
- [ ] Color prop applies correct border class
- [ ] Max-width 600px maintained
