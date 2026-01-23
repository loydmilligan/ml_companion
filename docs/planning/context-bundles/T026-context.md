# T026: Mobile responsiveness pass

## Task Summary
Review all admin components on mobile viewport (375px). Ensure proper scrolling, touch targets, no overflow issues.

## Required Context

### Mobile Requirements Checklist

1. **Tab Bar**
   - Horizontal scroll with hidden scrollbar
   - Touch scrolling works smoothly
   - No tab text truncation

2. **Forms**
   - Max-width 600px on all form containers
   - No horizontal overflow on page body
   - Inputs don't overflow container

3. **Touch Targets**
   - All interactive elements have 44px minimum height
   - Adequate spacing between tappable items
   - Toggle checkboxes easy to tap

4. **Sections**
   - Collapsible sections work on touch
   - Expand/collapse animation smooth
   - Chevron tap target large enough

5. **Cards**
   - Proper padding on small screens
   - Text wraps correctly
   - Images scale down

### CSS Review and Fixes

```css
/* Review/add to admin.css */

/* Prevent horizontal scroll */
.admin-page-v2 {
  overflow-x: hidden;
  width: 100%;
}

/* Ensure forms don't overflow */
.admin-card {
  max-width: 100%;
  overflow: hidden;
}

@media (min-width: 640px) {
  .admin-card {
    max-width: 600px;
  }
}

/* Tab bar mobile fixes */
.admin-tab-bar {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  /* Prevent text selection while scrolling */
  user-select: none;
}

.admin-tab {
  min-height: 44px;  /* Touch target */
}

/* Toggle touch targets */
.admin-toggle {
  min-height: 44px;
  padding: 12px 0;
}

/* Section header touch targets */
.admin-section__header {
  min-height: 48px;
  padding: 12px;
}

/* Input touch targets */
.field-input {
  min-height: 44px;
  font-size: 16px;  /* Prevents iOS zoom on focus */
}

/* Select touch targets */
select.field-input {
  min-height: 44px;
}

/* Button touch targets */
.btn {
  min-height: 44px;
  padding: 10px 16px;
}

/* Proper text wrapping */
.admin-card strong,
.admin-card .field-label {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Image responsiveness */
.round-image-preview,
.member-avatar img {
  max-width: 100%;
  height: auto;
}

/* Prevent code blocks from causing overflow */
code {
  word-break: break-all;
}

/* Mobile-specific spacing */
@media (max-width: 639px) {
  .admin-page-v2 {
    padding: 12px;
  }

  .admin-card {
    padding: 12px;
  }

  .admin-section__header {
    padding: 12px 8px;
  }

  /* Stack form elements vertically */
  .invite-form,
  .system-actions {
    flex-direction: column;
  }

  .invite-form .field-input,
  .invite-form .btn {
    width: 100%;
  }
}
```

### Testing Procedure

1. Open Chrome DevTools
2. Set viewport to 375x667 (iPhone SE)
3. Navigate through each tab
4. Test:
   - Tab bar scrolling
   - Section collapse/expand
   - Form input focus (no zoom)
   - Toggle interactions
   - Button taps
   - Horizontal scroll (should be none)

## Files to Edit
- `web/src/pages/admin/admin.css` - Mobile-specific fixes

## Playwright Test Cases
1. no horizontal overflow at 375px viewport
2. tab bar is scrollable
3. forms are usable on mobile
4. all touch targets meet 44px minimum

## Manual Testing Required
- Real device testing recommended
- iOS Safari specific testing for input zoom issue
- Android Chrome for tab scrolling

## Acceptance Criteria
- [ ] No horizontal scroll on any screen
- [ ] Tab bar scrolls smoothly
- [ ] 44px min touch targets
- [ ] Forms usable on small screens
- [ ] Font size 16px+ on inputs (prevents iOS zoom)
