# T001: Create admin directory structure

## Task Summary
Create folder structure: `web/src/pages/admin/` with subdirectories `components/`, `tabs/`, `hooks/`. Create index.ts barrel exports in each.

## Required Context

### Target Directory Structure
```
web/src/pages/admin/
├── index.ts                    # Main barrel export
├── components/
│   └── index.ts                # Component barrel export
├── tabs/
│   └── index.ts                # Tab barrel export
└── hooks/
    └── index.ts                # Hook barrel export
```

### Barrel Export Pattern (from existing codebase)
Reference: `web/src/components/side-panels/index.ts`
```typescript
export { SidePanelProvider, useSidePanel } from "./SidePanelContext";
export { default as PinnedPeekPanel } from "./PinnedPeekPanel";
```

### Main Index Pattern
```typescript
// web/src/pages/admin/index.ts
export { default as AdminPageV2 } from "./AdminPageV2";
export { AdminProvider, useAdmin } from "./AdminContext";
export * from "./components";
export * from "./tabs";
export * from "./hooks";
```

### Component/Tab/Hook Index Pattern
```typescript
// Initially empty, will be populated as components are created
// web/src/pages/admin/components/index.ts
// export { default as AdminCard } from "./AdminCard";
// export { default as AdminSection } from "./AdminSection";
// ... etc
```

## Files to Create
1. `web/src/pages/admin/index.ts` - Main barrel export
2. `web/src/pages/admin/components/index.ts` - Components barrel
3. `web/src/pages/admin/tabs/index.ts` - Tabs barrel
4. `web/src/pages/admin/hooks/index.ts` - Hooks barrel

## Acceptance Criteria
- [ ] All directories exist
- [ ] All index.ts files are valid TypeScript (can be initially empty/commented)
- [ ] No import errors when files are added later
