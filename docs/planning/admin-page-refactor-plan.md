# AdminPage Decomposition & UI Redesign Plan

## Current State Analysis

### Structure
- **9 tabs:** Users, Invites, Leagues, Rounds, Competitors, Imports, AI Settings, Bonus, Testing
- **5,158 lines** in single file
- **108 useState hooks**
- Heavy inline styles throughout

### Identified UX Problems

| Problem | Impact | Example |
|---------|--------|---------|
| Visual sameness | Can't develop muscle memory | AI Settings: 15+ identical checkboxes in a row |
| No hierarchy | Must read everything to find what you want | Minigame settings buried in AI tab |
| Flat/colorless | No visual landmarks | All cards look the same |
| Desktop stretch | Content overflows containers | Forms stretch across full width |
| Mobile scroll hell | Easy to miss things | Stacked tabs + dense content |
| Inline styles | Inconsistent, hard to maintain | 500+ inline style objects |

---

## Proposed Solution

### Phase 0: Design Foundation (Do First)

Create reusable admin UI components before extracting tabs:

```
web/src/components/admin/
├── AdminCard.tsx          - Consistent card with optional icon/color
├── AdminSection.tsx       - Collapsible section with header
├── AdminToggle.tsx        - Toggle with icon, label, helper
├── AdminSelect.tsx        - Styled select with icon
├── AdminFieldGroup.tsx    - Visual grouping for related fields
├── AdminTabBar.tsx        - Mobile-optimized tab navigation
└── admin.css              - Shared admin styles
```

#### Key Design Principles

1. **Icons everywhere** - Every toggle/section gets an icon for scanning
2. **Grouped sections** - Related settings in collapsible cards
3. **Max-width containers** - Don't stretch forms across full desktop width
4. **Color coding** - Categories have subtle color themes
5. **Mobile-first tabs** - Icons + short labels, horizontal scroll

#### Example: AdminToggle Component

```tsx
// Before (current)
<label className="field" style={{ display: "flex", alignItems: "center", gap: 12 }}>
  <input type="checkbox" checked={value} onChange={...} style={{ width: 18, height: 18 }} />
  <div>
    <span className="field-label" style={{ margin: 0 }}>Check Song</span>
    <span className="field-helper" style={{ display: "block", marginTop: 2 }}>
      AI gives opinion on whether a song might fit
    </span>
  </div>
</label>

// After (new component)
<AdminToggle
  icon="🎯"
  label="Check Song"
  helper="AI gives opinion on whether a song might fit"
  checked={value}
  onChange={...}
  disabled={!parentEnabled}
/>
```

#### Example: AdminSection Component

```tsx
// Groups related toggles with collapsible header
<AdminSection
  icon="🤖"
  title="AI Features"
  color="purple"
  defaultOpen={true}
>
  <AdminToggle icon="💡" label="Explain Theme" ... />
  <AdminToggle icon="🎯" label="Check Song" ... />
  <AdminToggle icon="💬" label="Chat Replies" ... />
</AdminSection>
```

---

### Phase 1: Tab Bar Redesign

**Problem:** Tabs stack on mobile, hard to navigate

**Solution:** Horizontal scrolling tab bar with icons

```tsx
const ADMIN_TABS = [
  { id: "users", label: "Users", icon: "👥", shortLabel: "Users" },
  { id: "invites", label: "Invites", icon: "✉️", shortLabel: "Invites" },
  { id: "leagues", label: "Leagues", icon: "🏆", shortLabel: "Leagues" },
  { id: "rounds", label: "Rounds", icon: "🎵", shortLabel: "Rounds" },
  { id: "competitors", label: "Competitors", icon: "🎤", shortLabel: "Players" },
  { id: "imports", label: "Imports", icon: "📥", shortLabel: "Import" },
  { id: "games", label: "Games & AI", icon: "🎮", shortLabel: "Games" },  // Merged!
  { id: "bonus", label: "Bonus Points", icon: "⭐", shortLabel: "Bonus" },
  { id: "testing", label: "Testing", icon: "🧪", shortLabel: "Test" },
];
```

**Mobile:** Icon + short label, horizontal scroll
**Desktop:** Icon + full label, wraps if needed

---

### Phase 2: Tab Extraction Order

Extract tabs in order of complexity (simplest first to establish patterns):

| Order | Tab | Lines | Complexity | Notes |
|-------|-----|-------|------------|-------|
| 1 | Testing | ~150 | Low | Already extracted, just needs UI polish |
| 2 | Invites | ~70 | Low | Simple list + form |
| 3 | Bonus | ~200 | Low | Form + list |
| 4 | Competitors | ~100 | Low | List with profile links |
| 5 | Leagues | ~130 | Medium | List with expand/edit |
| 6 | Users | ~200 | Medium | List with role toggles |
| 7 | Imports | ~350 | Medium | Multiple import types, file uploads |
| 8 | Games & AI | ~600 | High | Merge AI Settings into this, many toggles |
| 9 | Rounds | ~330 | High | Most complex, status changes, images |

---

### Phase 3: Games & AI Tab Redesign (Most Important)

Current: Wall of checkboxes
Proposed: Grouped, collapsible sections with visual hierarchy

```
┌─────────────────────────────────────────────────┐
│ 🎮 Games & AI                                   │
├─────────────────────────────────────────────────┤
│                                                 │
│ ▼ 🎯 Guess the Submitter          [Enabled ●]  │
│   ├─ Available during: [Voting ▼]              │
│   └─ Show leaderboard: [✓]                     │
│                                                 │
│ ▼ ⏱️ Timeline Game                 [Enabled ●]  │
│   ├─ Available during: [Voting ▼]              │
│   ├─ Beta testers only: [✓]                    │
│   └─ [Manage Release Years →]                  │
│                                                 │
│ ▼ 🏆 Round Challenge               [Enabled ●]  │
│   ├─ Available during: [Both ▼]                │
│   └─ AI generates challenges: [✓]              │
│                                                 │
│ ▶ 🤖 AI Assistant                  [Enabled ●]  │
│   (Click to expand: Explain, Hint, Check, Chat)│
│                                                 │
│ ▶ 🎨 AI Image Generation           [Enabled ●]  │
│   (Click to expand: Model, Palette settings)   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key improvements:**
- Master toggle visible at section header level
- Expand to see sub-settings
- Related settings grouped together
- Icons provide visual scanning

---

### Phase 4: Mobile Layout

**Current mobile issues:**
- Tabs stack vertically (9 tabs = lots of scrolling past nav)
- Content is full-width, dense

**Proposed fixes:**

1. **Sticky tab bar** - Horizontal scroll, always visible
2. **Narrower max-width** - `max-width: 600px` on forms
3. **Larger touch targets** - Toggles have 44px min height
4. **Section collapse by default** - Only expand what you need

---

## File Structure After Refactor

```
web/src/pages/admin/
├── AdminPage.tsx              (~150 lines - orchestrator)
├── AdminContext.tsx           (~200 lines - shared state)
├── admin.css                  (~300 lines - shared styles)
│
├── components/
│   ├── AdminCard.tsx          (~50 lines)
│   ├── AdminSection.tsx       (~80 lines)
│   ├── AdminToggle.tsx        (~40 lines)
│   ├── AdminSelect.tsx        (~50 lines)
│   ├── AdminFieldGroup.tsx    (~30 lines)
│   ├── AdminTabBar.tsx        (~100 lines)
│   └── index.ts               (exports)
│
├── tabs/
│   ├── UsersTab.tsx           (~250 lines)
│   ├── InvitesTab.tsx         (~150 lines)
│   ├── LeaguesTab.tsx         (~200 lines)
│   ├── RoundsTab.tsx          (~400 lines)
│   ├── CompetitorsTab.tsx     (~150 lines)
│   ├── ImportsTab.tsx         (~400 lines)
│   ├── GamesTab.tsx           (~500 lines) - merged AI + minigames
│   ├── BonusTab.tsx           (~200 lines)
│   └── TestingTab.tsx         (~150 lines)
│
└── hooks/
    ├── useGroupSettings.ts    (~150 lines)
    ├── useAdminUsers.ts       (~100 lines)
    └── useAdminRounds.ts      (~100 lines)
```

**Total: ~3,000 lines** (down from 5,158)
**Net reduction: ~2,000 lines** through:
- Removing inline styles (use CSS)
- Reusable components (less repetition)
- Better abstractions

---

## Implementation Approach

### Recommended: Incremental with Feature Flag

1. Create new `/admin-v2` route with new implementation
2. Build Phase 0 components
3. Extract tabs one at a time into new structure
4. Add feature flag to switch between old/new
5. Test thoroughly on dev
6. Flip flag to new version
7. Remove old AdminPage after validation

**Why this approach:**
- Old admin stays working throughout
- Can A/B test with select users
- Easy rollback if issues found
- No big-bang risk

---

## Estimated Effort

| Phase | New Lines | Changed Lines | Components |
|-------|-----------|---------------|------------|
| Phase 0: Design Foundation | ~400 | 0 | 7 new components |
| Phase 1: Tab Bar | ~100 | ~50 | 1 component |
| Phase 2: Tab Extraction | ~2,000 | ~200 | 9 tab files |
| Phase 3: Games Tab Polish | ~100 | ~50 | Sections within tab |
| Phase 4: Mobile Polish | ~50 | ~100 | CSS adjustments |
| **Total** | **~2,650** | **~400** | **~20 files** |

---

## Open Questions

1. **Merge AI Settings + Minigames?** - Proposed combining into "Games & AI" tab
2. **Icon set** - Emoji or proper icon library (Lucide, etc.)?
3. **Color theme per section** - Worth the complexity?
4. **Feature flag approach** - Or direct replacement?

---

## Next Steps

1. [ ] Review this plan, adjust based on feedback
2. [ ] Decide on icon approach (emoji vs library)
3. [ ] Create Phase 0 components
4. [ ] Extract first tab (Testing) as proof of concept
5. [ ] Iterate based on learnings
