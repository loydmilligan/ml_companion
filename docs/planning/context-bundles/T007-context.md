# T007: Create AdminFieldGroup component

## Task Summary
Create AdminFieldGroup.tsx: visual grouping container for related toggles/fields within a section.

## Required Context

### Component API Design
```typescript
type AdminFieldGroupProps = {
  title?: string;
  children: React.ReactNode;
};
```

### Implementation Pattern
```typescript
// web/src/pages/admin/components/AdminFieldGroup.tsx

type AdminFieldGroupProps = {
  title?: string;
  children: React.ReactNode;
};

export default function AdminFieldGroup({
  title,
  children,
}: AdminFieldGroupProps) {
  return (
    <div className="admin-field-group">
      {title && <div className="admin-field-group__title">{title}</div>}
      <div className="admin-field-group__content">{children}</div>
    </div>
  );
}
```

### Usage Example
```tsx
<AdminFieldGroup title="Check Song Settings">
  <AdminToggle
    icon="🎯"
    label="Check Song"
    helper="AI gives opinion on whether a song might fit"
    checked={settings.ai_validate_enabled}
    onChange={(checked) => updateSetting("ai_validate_enabled", checked)}
  />
  <AdminSelect
    label="Daily limit"
    value={String(settings.ai_validate_daily_limit)}
    onChange={(val) => updateSetting("ai_validate_daily_limit", parseInt(val))}
    options={[
      { value: "3", label: "3 per day" },
      { value: "5", label: "5 per day" },
      { value: "10", label: "10 per day" },
    ]}
  />
</AdminFieldGroup>
```

### CSS Classes (add to admin.css)
```css
.admin-field-group {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
}

.admin-field-group__title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.admin-field-group__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
```

## Files to Create
- `web/src/pages/admin/components/AdminFieldGroup.tsx`

## Files to Edit
- `web/src/pages/admin/components/index.ts` - Add export
- `web/src/pages/admin/admin.css` - Add field group styles

## Test Cases
1. renders children
2. renders title when provided
3. applies grouping styles (background, border-radius)

## Acceptance Criteria
- [ ] Visual hierarchy for nested settings
- [ ] Subtle background differentiation
- [ ] Works with AdminToggle and AdminSelect children
