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

After making any code changes that need testing, follow this workflow to deploy and verify.

### 1. Commit and Push
```bash
cd /home/mmariani/Projects/ml_companion/web
git add -A
git commit -m "Your commit message"
git push
```

### 2. Deploy to Pi
```bash
ssh pi "cd /home/pi/ml_companion && git pull && docker compose up -d --build"
```

This single command:
- SSHs into the Pi
- Pulls latest changes
- Rebuilds and restarts the Docker container

### 3. Verify Deployment
Use the Chrome DevTools MCP to verify the app is accessible:
```
mcp__chrome-devtools__new_page with url: "https://talking.mattmariani.com/app"
mcp__chrome-devtools__take_snapshot to verify page content loaded
```

Look for:
- The page loads without errors
- Key UI elements are present (TopBar, main content area)
- No console errors (check with mcp__chrome-devtools__list_console_messages)

### Quick Deploy Command
For convenience, the full deploy + verify can be run as:
```bash
git add -A && git commit -m "message" && git push && ssh pi "cd /home/pi/ml_companion && git pull && docker compose up -d --build"
```

Then use browser MCP to verify.

### Rollback
If deployment fails:
```bash
ssh pi "cd /home/pi/ml_companion && git checkout HEAD~1 && docker compose up -d --build"
```
