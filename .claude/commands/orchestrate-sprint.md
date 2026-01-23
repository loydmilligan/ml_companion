# Sprint Orchestration Command

Execute a planned sprint using parallel AI agents with context bundles.

## Arguments
- `$ARGUMENTS` - Path to JTBD orchestration plan (e.g., `docs/planning/admin-refactor-jtbd.md`)

## Workflow

### Step 1: Load Sprint Context

Read the JTBD orchestration plan specified in arguments:
- If no argument provided, ask user for the JTBD plan path
- Read the JTBD plan to understand phases, tasks, and dependencies
- Read the linked tasks JSON file (found in JTBD plan "Tasks File" field)
- Identify the context bundles directory

### Step 2: Assess Current State

From the tasks JSON:
1. Count tasks by status (pending, in_progress, completed)
2. Identify which phase we're in based on completed tasks
3. Find tasks ready for execution (all dependencies satisfied, status=pending)
4. Report current state to user

### Step 3: Execute Next Phase

For each task ready for execution:

1. **Select agent type** based on task:
   - React components/hooks/CSS/tabs → `frontend-developer`
   - Database migrations/routing → `backend-architect`
   - Code cleanup/removal → `code-reviewer`
   - Security-related → `security-auditor`

2. **Launch agents in parallel** (max 5 concurrent) using Task tool:

```
Execute task {TASK_ID}: {TASK_TITLE}

CRITICAL - READ FIRST:
Your context bundle is at: {context_bundle_path}
This file contains ALL code snippets and implementation patterns you need.

RULES:
1. Read the context bundle BEFORE doing anything else
2. DO NOT read additional project files unless the context bundle is insufficient
3. Create ONLY the files listed in files_to_create
4. Edit ONLY the files listed in files_to_edit
5. Follow implementation patterns EXACTLY as shown in context bundle

TASK DETAILS:
- Description: {description}
- Files to create: {files_to_create}
- Files to edit: {files_to_edit}
- Tests: {tests}

AFTER COMPLETION, REPORT THESE FIELDS:
- TESTING_PASSED: true/false (did all tests pass?)
- REMEDIATION_REQUIRED: true/false (did you have to fix issues during implementation?)
- EXTRA_CONTEXT_READ: [list any files you read beyond the context bundle]
- AGENT_QUERIES: [list any questions or assumptions you had to make]
- AGENT_NOTES: [feedback on context bundle - was it complete? what was missing?]
```

3. **Monitor with TaskOutput** - Check agent progress, wait for completion

### Step 4: Post-Execution Review

After each agent completes:

1. **Update tasks JSON** with execution results:
   - Set `execution.testing_passed`
   - Set `execution.remediation_required`
   - Record `execution.extra_context_read`
   - Record `execution.agent_queries`
   - Record `execution.agent_notes`
   - Set `execution.completed_at` to current timestamp
   - Set `status` to "completed"

2. **Analyze agent feedback**:
   - If `extra_context_read` has items → Consider adding to context bundle
   - If `agent_queries` has items → Clarify in context bundle for similar future tasks
   - If `remediation_required` is true → Review what went wrong

3. **Report to user**:
   - Tasks completed this round
   - Any issues or blockers
   - Next phase ready status

### Step 5: Continue or Complete

- If more pending tasks exist → Return to Step 3
- If all tasks complete → Run quality gates from JTBD plan
- Report final sprint status

## Quality Gate Checks

Before marking sprint complete, verify quality gates from JTBD plan:
- Run any specified test commands
- Check for console errors
- Verify all acceptance criteria met

## Rollback Guidance

If critical issues found:
1. Check JTBD plan for rollback instructions
2. Disable feature flags if applicable
3. Report issue details to user
4. Propose fix before continuing

## Example Usage

```
/orchestrate-sprint docs/planning/admin-refactor-jtbd.md
```

This will:
1. Read the admin refactor JTBD plan
2. Load the associated tasks JSON
3. Begin executing tasks phase by phase
4. Update task status as agents complete
5. Continue until all tasks done or user stops

## Notes

- Always wait for user confirmation before starting a new phase
- Save progress frequently by updating tasks JSON
- If context resets, re-run this command to resume from current state
- The tasks JSON serves as persistent state - always read it fresh
