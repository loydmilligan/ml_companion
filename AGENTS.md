# Agent Instructions

This repository contains product and design documentation for the Music League Family Companion App. Treat the docs as authoritative and keep changes scoped to the request.

## Where To Look First
- `docs/README.md` for the full document index.
- `docs/requirements/feature_specification.md` for requirements and user stories.
- `docs/planning/project_plan.md` for roadmap and atomic tasks.
- `docs/design/ui_specification.md` for UX guidance.

## Implementation Workflow
Use this sequence for each change:
1. Describe the change and its rationale.
2. Set clear success criteria.
3. Identify affected files and components.
4. Execute atomic tasks and implement changes.
5. Review work for quality, security, and test coverage.
6. Commit changes when requested with clear messages.
7. Deploy and monitor when the change includes release steps.

## Quality Bar
- Keep documentation consistent and cross-linked.
- Prefer small, reviewable edits over sweeping rewrites.
- Ask a concise question if a decision is blocked or ambiguous.

## Linear Integration

**Project ID:** `4dfa7418-9bf3-4442-96fc-83d0e05e5ce8`
**Project Name:** Talking Music League
**Team:** Loydmilligan

### Keeping issues.md in Sync with Linear

The local `docs/issues.md` file is the canonical source for roadmap items. Linear is used for sprint planning. Keep them synchronized:

#### Adding New Issues
1. Add to `docs/issues.md` first with local ID (e.g., `PN-003`)
2. Create in Linear with `mcp__linear-server__create_issue`
3. Update issues.md with the Linear ID (`LOYD-XXX`)

#### Completing Issues
1. Update Linear status to "Done" via `mcp__linear-server__update_issue`
2. Update issues.md status to `Complete`

#### Verifying Sync
```
mcp__linear-server__list_issues with project: "4dfa7418-9bf3-4442-96fc-83d0e05e5ce8"
```

#### ID Mapping
- `PN-XXX` → Push Notifications
- `INT-XXX` → Integrations
- `ML-XXX` → Media Links
- `SEC-XXX` / `EF-XXX` → Security / Edge Functions
- `STG-XXX` → Storage
- `AWD-XXX` → Awards
