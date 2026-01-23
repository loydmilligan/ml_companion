# Admin Refactor JTBD Orchestration Plan

## Quick Start

```
/orchestrate-sprint docs/planning/admin-refactor-jtbd.md
```

This command will read this plan and begin executing tasks phase by phase.

---

## Overview

**Job:** Decompose and redesign the 5,158-line AdminPage.tsx into a maintainable, mobile-first admin panel with improved UX.

**Linear Issue:** LOYD-202
**Tasks File:** `docs/planning/admin_page_refactor_tasks.json`
**Context Bundles:** `docs/planning/context-bundles/`

---

## Execution Phases

### Phase 0: Foundation (Sequential)
**Duration:** ~30 minutes
**Agents:** 1

| Order | Task | Description |
|-------|------|-------------|
| 1 | T001 | Create directory structure |
| 2 | T002 | Create admin.css base styles |

**Why Sequential:** T002 depends on T001 completing first.

---

### Phase 1: Foundation Components (Parallel)
**Duration:** ~45 minutes
**Max Agents:** 5

| Task | Description | Dependencies |
|------|-------------|--------------|
| T003 | AdminCard component | T001, T002 |
| T004 | AdminSection component | T001, T002 |
| T005 | AdminToggle component | T001, T002 |
| T006 | AdminSelect component | T001, T002 |
| T007 | AdminFieldGroup component | T001, T002 |
| T008 | AdminTabBar component | T001, T002 |

**Parallel Strategy:** All 6 tasks can run simultaneously. Launch in single batch.

---

### Phase 2: Context & Hooks (Parallel)
**Duration:** ~30 minutes
**Max Agents:** 2

| Task | Description | Dependencies |
|------|-------------|--------------|
| T009 | AdminContext for shared state | T001 |
| T010 | useGroupSettings hook | T001 |

**Why 2 Agents:** Only 2 tasks, both independent.

---

### Phase 3: Admin Shell
**Duration:** ~20 minutes
**Agents:** 1

| Task | Description | Dependencies |
|------|-------------|--------------|
| T011 | AdminPageV2 shell with routing | T008, T009 |

**Why Sequential:** Single task, needs tabs and context ready.

---

### Phase 4: Tab Development (Parallel)
**Duration:** ~60 minutes
**Max Agents:** 4

**Wave 4a - Initial Tabs:**

| Task | Description | Dependencies |
|------|-------------|--------------|
| T012 | PeopleTab - Members section | T003, T004, T005, T009 |
| T015 | ContentTab - Leagues section | T003, T004, T009 |
| T018 | GamesTab - Minigames sections | T003, T004, T005, T006, T010 |
| T023 | SystemTab | T003, T004 |

**Wave 4b - Additions (after Wave 4a completes):**

| Task | Description | Dependencies |
|------|-------------|--------------|
| T013 | PeopleTab - Invitations | T012 |
| T014 | PeopleTab - Competitors | T012 |
| T016 | ContentTab - Rounds | T015 |
| T017 | ContentTab - Imports | T015 |
| T019 | GamesTab - AI and Bonus | T018 |

**Strategy:**
1. Launch Wave 4a (4 agents)
2. When each completes, launch its dependent task

---

### Phase 5: Integration
**Duration:** ~30 minutes
**Agents:** 1-2

| Task | Description | Dependencies |
|------|-------------|--------------|
| T024 | Wire all tabs into AdminPageV2 | T020, T021, T022, T023 |

**Note:** T020, T021, T022 are parent tasks that complete when subtasks complete.

---

### Phase 6: Polish & Feature Flag
**Duration:** ~45 minutes
**Max Agents:** 2

| Task | Description | Dependencies |
|------|-------------|--------------|
| T025 | Add feature flag | T024 |
| T026 | Mobile responsiveness pass | T024 |

**Parallel:** Both can run after T024 completes.

---

### Phase 7: Cleanup (Post-Validation)
**Duration:** ~15 minutes
**Agents:** 1

| Task | Description | Dependencies |
|------|-------------|--------------|
| T027 | Remove old AdminPage | T025, T026 |

**IMPORTANT:** Only execute after production validation period (1+ week).

---

## Agent Prompts

### Template for Task Execution

```
Execute task {TASK_ID}: {TASK_TITLE}

CONTEXT:
Read the context bundle at: docs/planning/context-bundles/{TASK_ID}-context.md

This contains ALL the code snippets and implementation details you need.

REQUIREMENTS:
1. Read the context bundle FIRST before doing anything
2. DO NOT read additional project files unless absolutely necessary
3. Create/edit only the files specified in the task
4. Follow the implementation patterns shown in the context bundle

FILES TO CREATE: {files_to_create}
FILES TO EDIT: {files_to_edit}

TESTS:
{test_description}

WHEN COMPLETE, REPORT:
- TESTING_PASSED: true/false
- REMEDIATION_REQUIRED: true/false
- EXTRA_CONTEXT_READ: [files you had to read beyond context bundle]
- AGENT_QUERIES: [questions or assumptions you made]
- AGENT_NOTES: [feedback on context bundle quality]
```

### Subagent Type Selection

| Task Type | Subagent | Rationale |
|-----------|----------|-----------|
| Components (T003-T008) | frontend-developer | React component expertise |
| Hooks (T010) | frontend-developer | React hooks expertise |
| Context (T009) | frontend-developer | React context patterns |
| CSS (T002) | frontend-developer | Styling expertise |
| Tabs (T012-T023) | frontend-developer | UI development |
| Integration (T024) | frontend-developer | Component integration |
| Feature flag (T025) | backend-architect | DB + routing |
| Mobile (T026) | frontend-developer | Responsive CSS |
| Cleanup (T027) | code-reviewer | Careful removal |

---

## Execution Commands

### Start Phase 0
```
Launch T001 with frontend-developer agent
Wait for completion
Launch T002 with frontend-developer agent
Wait for completion
```

### Start Phase 1 (Parallel)
```
Launch in parallel:
- T003 with frontend-developer
- T004 with frontend-developer
- T005 with frontend-developer
- T006 with frontend-developer
- T007 with frontend-developer
(Wait for slot, then launch T008)
```

### Monitor Progress
```
Use TaskOutput to check agent status
Update tasks JSON with execution results
```

---

## Quality Gates

### After Phase 1
- [ ] All 6 components have unit tests passing
- [ ] Components render in isolation
- [ ] CSS imports without errors

### After Phase 4
- [ ] All tabs render without errors
- [ ] Tab switching works
- [ ] Settings save correctly

### After Phase 6
- [ ] Feature flag toggles correctly
- [ ] Mobile viewport has no horizontal scroll
- [ ] All touch targets 44px+

### Before Phase 7
- [ ] 1 week production usage
- [ ] No critical bugs reported
- [ ] User feedback positive

---

## Rollback Plan

If issues discovered:
1. Disable feature flag (revert to old AdminPage)
2. Investigate issue in admin-v2
3. Fix and redeploy
4. Re-enable feature flag

---

## Post-Sprint Review

After all tasks complete:
1. Review all agent_queries in tasks JSON
2. Identify patterns in extra_context_read
3. Update context bundle templates for future sprints
4. Document lessons learned

---

## Time Estimates

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0 | 30 min | 30 min |
| Phase 1 | 45 min | 1h 15m |
| Phase 2 | 30 min | 1h 45m |
| Phase 3 | 20 min | 2h 05m |
| Phase 4 | 60 min | 3h 05m |
| Phase 5 | 30 min | 3h 35m |
| Phase 6 | 45 min | 4h 20m |
| **Total** | **~4.5 hours** (excluding Phase 7) |

**Note:** Actual time depends on agent performance and parallelization efficiency.
