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

**IMPORTANT**: After making any code changes, ALWAYS run the deploy script and verify with browser MCP.

### Deploy Script
Use the deploy script for all deployments:
```bash
./deploy.sh "Your commit message"
```

This script automatically:
1. Commits all changes with proper attribution
2. Pushes to remote
3. SSHs to Pi and pulls
4. Builds the web app on Pi

### Browser Verification (Required)
After every deploy, verify changes using Chrome DevTools MCP:

1. **Kill previous browser session** (start of each session):
   ```
   mcp__chrome-devtools__list_pages - find existing pages
   mcp__chrome-devtools__close_page if needed
   ```

2. **Navigate to app**:
   ```
   mcp__chrome-devtools__new_page with url: "http://192.168.1.69:8080"
   ```

3. **Login if needed** and verify:
   ```
   mcp__chrome-devtools__take_snapshot - check page content
   mcp__chrome-devtools__list_console_messages - check for errors
   ```

4. **Confirm changes are visible** by interacting with the UI

### Rollback
If deployment fails:
```bash
ssh pi "cd ml_companion && git checkout HEAD~1"
ssh pi "cd ml_companion/web && npm run build"
```
