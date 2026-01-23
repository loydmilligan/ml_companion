# Claude Project Guide

## DEPLOYMENT - READ FIRST

**CRITICAL: Use CI/CD Pipeline - NEVER SSH to Pi manually**

### How Deployment Works
This project uses **GitHub Actions CI/CD pipelines** for all deployments. Pushing to a branch triggers automatic deployment.

| Branch | Environment | Triggered By | URL |
|--------|-------------|--------------|-----|
| `develop` | DEV | Push to `develop` | `https://dev-tml.mattmariani.com` |
| `main` | PROD | Push to `main` | `https://talking.mattmariani.com` |

### Deployment Steps (ALWAYS follow this)

```bash
# 1. Make changes and commit
git add -A && git commit -m "Your commit message"

# 2. Push to trigger CI/CD
git push origin develop   # For DEV deployment
# OR
git push origin main      # For PROD deployment (use sparingly)

# 3. Monitor GitHub Actions
# Go to: https://github.com/loydmilligan/ml_companion/actions
# Wait for workflow to complete (green checkmark)
```

### Supabase Edge Functions
Deploy edge functions separately using Supabase CLI. **ALWAYS use `--no-verify-jwt`**:
```bash
# DEV environment
npx supabase functions deploy <function-name> --project-ref rqtimlhqasmeymxhmkiz --no-verify-jwt

# PROD environment
npx supabase functions deploy <function-name> --project-ref hxwecmhpxuqufomtcvgo --no-verify-jwt
```

**CRITICAL**: Always include `--no-verify-jwt` flag. The app handles its own JWT verification internally. Omitting this flag will break the functions.

### FORBIDDEN Actions
- **NEVER** use `ssh pi` or `ssh frig` for deployments
- **NEVER** run `docker compose` commands on Pi manually
- **NEVER** deploy directly to PROD without testing on DEV first
- **NEVER** run local dev servers (`npm run dev`)

### Verification
After CI/CD completes, verify deployment at the appropriate URL:
- DEV: `https://dev-tml.mattmariani.com`
- PROD: `https://talking.mattmariani.com`

---

## Hotfix Workflow

Use hotfixes for **urgent bug fixes** that need to go to production immediately, bypassing the normal develop → main flow.

### When to Use Hotfix vs Regular Release

| Situation | Use |
|-----------|-----|
| Critical bug in production | **Hotfix** |
| Security vulnerability | **Hotfix** |
| Small, isolated fix needed urgently | **Hotfix** |
| New feature development | Regular release |
| Non-urgent improvements | Regular release |

### Hotfix Process

```bash
# 1. Start from main (production code)
git checkout main
git pull origin main

# 2. Create hotfix branch with patch version
git checkout -b hotfix/v1.X.Y   # e.g., hotfix/v1.1.1

# 3. Make the fix (code changes, migrations, etc.)
# ... edit files ...

# 4. Commit with descriptive message
git add -A
git commit -m "fix(scope): description of the fix"

# 5. Merge to main
git checkout main
git merge hotfix/v1.X.Y

# 6. Tag the release
git tag v1.X.Y

# 7. Push to trigger production deployment
git push origin main --tags

# 8. Sync back to develop (IMPORTANT!)
git checkout develop
git merge main
git push origin develop

# 9. Clean up hotfix branch (optional)
git branch -d hotfix/v1.X.Y
```

### Versioning Convention

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH** (e.g., v1.1.1)
- Hotfixes increment the PATCH version
- Example: v1.1.0 → v1.1.1 → v1.1.2

### Database Migrations in Hotfixes

If a hotfix includes database changes:
1. Apply migration to Supabase immediately using MCP or CLI
2. Include migration file in the commit for version control
3. Database changes take effect immediately (no deployment needed)

### Example: v1.1.1 Hotfix (RLS Recursion Fix)

This hotfix fixed infinite recursion in RLS policy for `submitter_guesses`:
- **Migration**: Created `get_guess_aggregates` SECURITY DEFINER function
- **Code**: Updated `useSubmitterGuess.ts` to use RPC instead of direct query
- **Root cause**: Self-referential RLS policies cause infinite recursion in PostgreSQL

---

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

## UI Contrast & Visibility Verification

**CRITICAL**: Before completing ANY UI/CSS changes, verify contrast and visibility in both light and dark modes.

### Pre-Implementation Checklist
1. Check `docs/design/style-guide.md` for approved color variables
2. Ensure any CSS variable used exists in `web/src/index.css`
3. Provide explicit `[data-mode="light"]` and `[data-mode="dark"]` overrides for:
   - Buttons and interactive elements
   - Text on colored backgrounds
   - Badges and pills
   - Form inputs

### Post-Implementation Verification
1. Run contrast checker: `cd web && npm run check:contrast`
2. Run CSS linter: `cd web && npm run lint:css`
3. Visual verification in BOTH modes before claiming success

### Forbidden CSS Patterns
These variables DO NOT EXIST - never use them:
- `var(--primary)` - use `#4f46e5` or `var(--coral)` instead
- `var(--secondary)` - does not exist
- `var(--background)` - use `var(--surface)` or `var(--page-bg)`
- `var(--text)` - use `var(--text-primary)`
- `var(--color-*)` - none of these exist
- `var(--border)` - use `rgba(10, 26, 47, 0.12)` for light, `rgba(255, 255, 255, 0.12)` for dark

### Quick Reference
See `docs/design/style-guide.md` for:
- Complete approved color palette with hex values
- Pre-calculated WCAG contrast ratios
- Copy-paste CSS snippets for common patterns

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

---

## Parallel Agent Task Execution Workflow

This project uses a structured workflow for executing complex sprints with parallel AI agents. Tasks are defined in JSON files with context bundles that provide all necessary information for implementation.

### Task Structure

Task files are located in `docs/planning/` with format `*_tasks.json`. Each task includes:
- **context_bundle**: Path to markdown file with all context agent needs
- **execution**: Object tracking completion status and agent feedback

### Agent Execution Workflow

#### 1. Pre-Execution (Orchestrator)

Before launching agents, the orchestrator should:
1. Read the tasks JSON file
2. Identify tasks ready for execution (dependencies satisfied)
3. Group tasks by parallel_groups for concurrent execution
4. Launch agents with proper prompts

#### 2. Agent Instructions

When calling Task tool to execute a task, include these instructions:

```
You are implementing task {task_id}: {title}

CRITICAL REQUIREMENTS:
1. READ the context bundle FIRST: {context_bundle_path}
2. The context bundle contains ALL code snippets and context you need
3. DO NOT read additional files unless absolutely necessary
4. If you must read extra files, document them in your response

IMPLEMENTATION:
- Follow the context bundle exactly
- Create files listed in files_to_create
- Edit files listed in files_to_edit
- Run tests if specified

RESPONSE FORMAT:
After completing, provide:
1. TESTING_PASSED: true/false
2. REMEDIATION_REQUIRED: true/false (did you have to fix issues?)
3. EXTRA_CONTEXT_READ: [list of files you read beyond context bundle]
4. AGENT_QUERIES: [questions/assumptions you made]
5. AGENT_NOTES: feedback on context bundle quality
```

#### 3. Post-Execution Review

After each agent completes, the orchestrator should:
1. Update the tasks JSON with execution results
2. Check for agent queries/assumptions
3. Review extra_context_read - if agents consistently need the same files, update context bundles
4. Update workflow to prevent future issues

#### 4. JSON Update Pattern

```json
{
  "execution": {
    "testing_passed": true,
    "remediation_required": false,
    "extra_context_read": [],
    "agent_queries": [],
    "agent_notes": "Context bundle was complete, no issues",
    "completed_at": "2026-01-23T10:30:00Z",
    "completed_by": "agent-frontend-1"
  }
}
```

### Parallel Execution Rules

1. **Max 5 concurrent agents** - prevents context thrashing
2. **Respect dependencies** - only execute tasks whose dependencies are complete
3. **Use parallel_groups** - defined in tasks JSON for optimal batching
4. **Monitor actively** - use TaskOutput to track agent progress

### Context Bundle Quality Improvement

If agents consistently:
- Read extra files → Add those snippets to context bundle
- Make wrong assumptions → Clarify in context bundle description
- Fail tests → Review acceptance criteria specificity
- Request clarification → Expand context bundle with details

### Example: Executing Admin Refactor Tasks

```
Tasks file: docs/planning/admin_page_refactor_tasks.json
Context bundles: docs/planning/context-bundles/T001-context.md, etc.
JTBD orchestration: docs/planning/admin-refactor-jtbd.md

Phase 0 (parallel): T001, T002
Phase 1 (parallel after T001+T002): T003, T004, T005, T006, T007, T008
Phase 2 (parallel after Phase 1): T009, T010
Phase 3 (parallel after Phase 2): T012, T015, T018, T023
... continue per dependency graph
```
