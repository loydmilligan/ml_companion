# T006: Create AdminSelect component

## Task Summary
Create AdminSelect.tsx: styled select dropdown with optional icon, label, and helper text.

## Required Context

### Component API Design
```typescript
type AdminSelectOption = {
  value: string;
  label: string;
};

type AdminSelectProps = {
  icon?: string;        // Optional emoji
  label: string;
  helper?: string;
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  disabled?: boolean;
};
```

### Implementation Pattern
```typescript
// web/src/pages/admin/components/AdminSelect.tsx
import clsx from "clsx";

type AdminSelectOption = {
  value: string;
  label: string;
};

type AdminSelectProps = {
  icon?: string;
  label: string;
  helper?: string;
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  disabled?: boolean;
};

export default function AdminSelect({
  icon,
  label,
  helper,
  value,
  onChange,
  options,
  disabled = false,
}: AdminSelectProps) {
  return (
    <div className={clsx("admin-select", disabled && "admin-select--disabled")}>
      <label className="admin-select__label">
        {icon && <span className="admin-select__icon">{icon}</span>}
        <span>{label}</span>
      </label>
      <select
        className="admin-select__input field-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helper && <span className="admin-select__helper">{helper}</span>}
    </div>
  );
}
```

### Usage Example
```tsx
<AdminSelect
  icon="📅"
  label="Available during"
  value={settings.round_challenge_phase}
  onChange={(val) => updateSetting("round_challenge_phase", val)}
  options={[
    { value: "open", label: "Open phase only" },
    { value: "voting", label: "Voting phase only" },
    { value: "both", label: "Both open and voting" },
  ]}
/>
```

### Existing Pattern in AdminPage.tsx (to replace)
```tsx
<label className="field" style={{ margin: "0 0 0 30px" }}>
  <span className="field-label" style={{ fontSize: "0.8rem" }}>Available during:</span>
  <select
    className="field-input"
    value={settingsDraft?.round_challenge_phase ?? "open"}
    onChange={(e) =>
      setSettingsDraft((prev) =>
        prev ? { ...prev, round_challenge_phase: e.target.value as "open" | "voting" | "both" } : prev
      )
    }
    style={{ maxWidth: 200 }}
  >
    <option value="open">Open phase only</option>
    <option value="voting">Voting phase only</option>
    <option value="both">Both open and voting</option>
  </select>
</label>
```

### CSS Classes (add to admin.css)
```css
.admin-select {
  margin: 8px 0;
}

.admin-select__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.admin-select__icon {
  font-size: 1rem;
}

.admin-select__input {
  max-width: 300px;
  width: 100%;
}

.admin-select__helper {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.admin-select--disabled {
  opacity: 0.5;
}

.admin-select--disabled .admin-select__input {
  cursor: not-allowed;
}
```

## Files to Create
- `web/src/pages/admin/components/AdminSelect.tsx`

## Files to Edit
- `web/src/pages/admin/components/index.ts` - Add export
- `web/src/pages/admin/admin.css` - Add select styles

## Test Cases
1. renders label and options
2. shows selected value
3. calls onChange when selection changes
4. renders icon when provided
5. is disabled when disabled=true

## Acceptance Criteria
- [ ] Native select for accessibility
- [ ] Consistent with field-input class styling
- [ ] Optional icon prefix
- [ ] Disabled state works correctly
