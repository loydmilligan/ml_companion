# Claude Project Guide

This repo is a documentation-first product spec for the Music League Family Companion App. Use the docs as the source of truth before proposing or implementing changes.

## Primary References
- Start with `docs/README.md` to find the right document.
- Requirements live in `docs/requirements/feature_specification.md`.
- The roadmap and atomic tasks live in `docs/planning/project_plan.md`.
- UX guidance is in `docs/design/ui_specification.md`.

## Iterative Implementation Workflow
Follow this flow for each change request:
1. Describe the change: capture the user need, context, and expected impact.
2. Set goals: define concrete success criteria and any metrics.
3. Identify affected files/components: map the scope across docs, code, data, and integrations.
4. Make changes: break work into atomic tasks and implement incrementally.
5. Review work: verify correctness, completeness, and test coverage; note risks.
6. Commit changes: summarize intent in the message; use a feature branch if applicable.
7. Deploy updates: stage, validate, release, and monitor with rollback plans when relevant.

## Collaboration Notes
- Keep edits focused and avoid drifting beyond the requested scope.
- If a decision is ambiguous (e.g., licensing or platform choices), ask a brief question.

## Mobile Performance Guidelines
When discussing or implementing UI/frontend changes, always:
1. Check for mobile performance implications
2. Mention any concerns to the user before implementing
3. Consider: bundle size, re-renders, DOM complexity, network requests, animations/transforms, and polling frequency

## Deployment Workflow

**CRITICAL**: After making ANY code changes, you MUST deploy using the steps below. Do NOT run dev servers locally - we deploy to a Raspberry Pi.

### Raspberry Pi Deployment (REQUIRED)

**Pi Address**: `192.168.4.158`
**Production URL**: `https://talking.mattmariani.com` (via Cloudflare tunnel)
**Local fallback**: `http://192.168.4.158:3080`

### Deploy Steps (execute in order):

```bash
# 1. Commit changes
git add -A && git commit -m "Your commit message"

# 2. Push to remote
git push

# 3. SSH to Pi (use configured alias)
ssh pi

# 4. On Pi: Navigate to project
cd ml_companion/

# 5. Pull latest changes
git pull

# 6. Rebuild and restart Docker containers
docker compose down
docker compose build
docker compose up -d
```

### Verification (Required)
After deploy, verify using Chrome DevTools MCP:

1. **Navigate to app**:
   ```
   mcp__chrome-devtools__new_page with url: "https://talking.mattmariani.com"
   ```
   If Cloudflare tunnel has issues (DO NOT try to fix tunnel issues), use local:
   ```
   mcp__chrome-devtools__new_page with url: "http://192.168.4.158:3080"
   ```

2. **Check page content**:
   ```
   mcp__chrome-devtools__take_snapshot
   mcp__chrome-devtools__list_console_messages
   ```

3. **Confirm changes are visible** by interacting with the UI

### Important Notes
- **NEVER run local dev servers** - always deploy to Pi
- **Stop any local processes** before deploying: `pkill -f vite; pkill -f "npm run"`
- If Cloudflare tunnel is down, just use local IP - don't attempt to debug tunnel
- Docker containers run the app on port 3080

### Rollback
If deployment fails:
```bash
ssh pi "cd ml_companion && git checkout HEAD~1 && docker compose down && docker compose build && docker compose up -d"
```

## Linear Integration

**Project ID:** `4dfa7418-9bf3-4442-96fc-83d0e05e5ce8`
**Project Name:** Talking Music League
**Team:** Loydmilligan

### Keeping issues.md in Sync with Linear

The local `docs/issues.md` file serves as the canonical source for roadmap items and issues. Linear is used for sprint planning and tracking. Follow this workflow to keep them synchronized:

#### When Adding New Issues

1. **Add to issues.md first** with a local ID (e.g., `PN-003`)
2. **Create in Linear** using `mcp__linear-server__create_issue`:
   ```
   team: "Loydmilligan"
   project: "Talking Music League"
   title: "PN-003: [Feature Name]"
   description: [Copy from issues.md]
   ```
3. **Update issues.md** with the Linear ID (e.g., `LOYD-XXX`)

#### When Completing Issues

1. **Update Linear status** using `mcp__linear-server__update_issue`:
   ```
   id: "LOYD-XXX"
   state: "Done"
   ```
2. **Update issues.md** to mark status as `Complete`

#### Syncing Status

To verify sync between Linear and issues.md:
```
mcp__linear-server__list_issues with project: "4dfa7418-9bf3-4442-96fc-83d0e05e5ce8"
```

Compare statuses and update any discrepancies in both places.

#### Issue ID Mapping Convention

Linear issues use format `LOYD-XXX`. Local IDs in issues.md use category prefixes:
- `PN-XXX` → Push Notifications
- `INT-XXX` → Integrations
- `ML-XXX` → Media Links
- `SEC-XXX` → Security
- `EF-XXX` → Edge Functions
- `STG-XXX` → Storage
- `AWD-XXX` → Awards
