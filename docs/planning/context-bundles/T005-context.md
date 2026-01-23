# T005: Create AdminToggle component

## Task Summary
Create AdminToggle.tsx: checkbox with icon, label, helper text. 44px min-height for touch targets.

## Required Context

### Current Pattern in AdminPage.tsx (to replace)
```tsx
// This verbose pattern appears 15+ times in AdminPage.tsx
<label className="field" style={{ display: "flex", alignItems: "center", gap: 12 }}>
  <input
    type="checkbox"
    checked={settingsDraft?.ai_assistant_enabled ?? true}
    onChange={(e) =>
      setSettingsDraft((prev) =>
        prev ? { ...prev, ai_assistant_enabled: e.target.checked } : prev
      )
    }
    style={{ width: 18, height: 18 }}
  />
  <div>
    <span className="field-label" style={{ margin: 0 }}>AI Assistant (master toggle)</span>
    <span className="field-helper" style={{ display: "block", marginTop: 2 }}>
      Disable to hide all AI features in the peek panel
    </span>
  </div>
</label>
```

### New Component API
```typescript
type AdminToggleProps = {
  icon: string;        // Emoji
  label: string;
  helper?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};
```

### Implementation Pattern
```typescript
// web/src/pages/admin/components/AdminToggle.tsx
import clsx from "clsx";

type AdminToggleProps = {
  icon: string;
  label: string;
  helper?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export default function AdminToggle({
  icon,
  label,
  helper,
  checked,
  onChange,
  disabled = false,
}: AdminToggleProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <label
      className={clsx("admin-toggle", disabled && "admin-toggle--disabled")}
    >
      <input
        type="checkbox"
        className="admin-toggle__checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
      <span className="admin-toggle__icon">{icon}</span>
      <div className="admin-toggle__text">
        <span className="admin-toggle__label">{label}</span>
        {helper && <span className="admin-toggle__helper">{helper}</span>}
      </div>
    </label>
  );
}
```

### Usage Example (new pattern)
```tsx
<AdminToggle
  icon="🤖"
  label="AI Assistant (master toggle)"
  helper="Disable to hide all AI features in the peek panel"
  checked={settings.ai_assistant_enabled}
  onChange={(checked) => updateSetting("ai_assistant_enabled", checked)}
/>
```

### CSS Classes (add to admin.css)
```css
.admin-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;  /* Touch target requirement */
  padding: 8px 0;
  cursor: pointer;
}

.admin-toggle__checkbox {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  cursor: pointer;
}

.admin-toggle__icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.admin-toggle__text {
  flex: 1;
  display: flex;
  flex-direction: column;
}

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
  cursor: not-allowed;
}

.admin-toggle--disabled .admin-toggle__checkbox {
  cursor: not-allowed;
}
```

## Files to Create
- `web/src/pages/admin/components/AdminToggle.tsx`

## Files to Edit
- `web/src/pages/admin/components/index.ts` - Add export
- `web/src/pages/admin/admin.css` - Add toggle styles if not present

## Test Cases
1. renders icon, label, and helper
2. checkbox reflects checked prop
3. calls onChange when clicked
4. checkbox is disabled when disabled=true
5. applies reduced opacity when disabled

## Acceptance Criteria
- [ ] 44px min-height for touch targets
- [ ] Checkbox state controlled by `checked` prop
- [ ] `onChange` receives boolean value
- [ ] Visual disabled state
