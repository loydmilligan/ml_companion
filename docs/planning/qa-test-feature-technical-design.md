# Technical Design: QA Test Feature

**Version**: 1.0.0
**Created**: 2026-03-04
**Author**: developer (AI Agent)
**Status**: Draft - Pending Review

---

## 1. Overview

This document provides the technical design and architecture for the **QA Test Feature** - a test feature created to verify the Mission Control workflow system is functioning correctly. This is a proof-of-concept implementation that demonstrates the complete feature workflow from planning through deployment.

### 1.1 Purpose

The QA Test Feature serves as:
1. A verification mechanism for the Mission Control workflow system
2. A template for future feature implementations
3. A minimal, low-risk feature to test end-to-end agent coordination

### 1.2 Scope

This technical design covers:
- Data models and schema changes
- API contracts (Edge Function specification)
- Integration points with existing systems
- Implementation approach and file changes

---

## 2. Requirements Summary

Based on the requirements document (task_zSlGXWjJGrx8):

| Requirement | Description |
|-------------|-------------|
| **Primary Goal** | Verify workflow system operates correctly |
| **Feature Type** | Test/Verification feature |
| **User Stories** | Minimal - internal testing only |
| **Acceptance Criteria** | Feature deploys successfully, workflow tasks complete in sequence |

---

## 3. Data Models and Schema Changes

### 3.1 Database Changes

**No schema changes required.** This is a test feature that validates the workflow system without introducing new functionality to the ml_companion application.

If we were to implement a real feature following this pattern, the schema would follow this template:

```sql
-- Example: qa_test_results table (NOT NEEDED for workflow verification)
create table qa_test_results (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id) on delete cascade,
  test_name text not null,
  test_result boolean not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- RLS policy template
alter table qa_test_results enable row level security;

create policy "qa_test_results_select" on qa_test_results
  for select using (
    group_id in (
      select group_id from group_members
      where member_id = auth.uid()
    )
  );
```

### 3.2 TypeScript Types

If schema changes were needed, types would be added to `web/src/types/`:

```typescript
// web/src/types/qa-test.ts (EXAMPLE - NOT IMPLEMENTED)
export interface QATestResult {
  id: string;
  groupId: string;
  testName: string;
  testResult: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}
```

---

## 4. API Contracts

### 4.1 Edge Function Specification

**No new Edge Functions required** for workflow verification.

For reference, if a new Edge Function were needed, it would follow this pattern:

```typescript
// supabase/functions/qa-test/index.ts (EXAMPLE PATTERN)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface QATestRequest {
  mode: "run" | "status" | "results";
  testId?: string;
}

interface QATestResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check (follows existing pattern)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const body: QATestRequest = await req.json();

    // Mode-based routing (follows existing patterns)
    switch (body.mode) {
      case "run":
        // Execute test
        break;
      case "status":
        // Check status
        break;
      case "results":
        // Get results
        break;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 4.2 Frontend API Integration

Frontend calls would use the existing Supabase client pattern:

```typescript
// web/src/hooks/useQATest.ts (EXAMPLE PATTERN)
import { supabase } from "../lib/supabase";

export function useQATest() {
  const runTest = async (testName: string) => {
    const { data, error } = await supabase.functions.invoke("qa-test", {
      body: { mode: "run", testName },
    });

    if (error) throw error;
    return data;
  };

  return { runTest };
}
```

---

## 5. Integration Points

### 5.1 Existing System Integrations

| System | Integration | Impact |
|--------|-------------|--------|
| **Supabase Auth** | JWT validation | None - uses existing auth |
| **Supabase RLS** | Row-level security | None - no new tables |
| **React Router** | No new routes | None |
| **Admin Panel** | No new admin features | None |

### 5.2 Mission Control Integration

This feature validates the following Mission Control workflow integrations:

| Workflow Step | Mission Control Component | Validation |
|---------------|--------------------------|------------|
| Requirements | business-analyst agent | task_zSlGXWjJGrx8 completed |
| Technical Design | developer agent | This document |
| Implementation | developer agent | task_ZOXizHgW_ONM (pending) |
| Code Review | code-reviewer agent | task_eD7__Du53ROE (pending) |
| Staging Verification | developer agent | task_0MYUzInQUFFT (pending) |

---

## 6. Technical Approach

### 6.1 Implementation Strategy

Since this is a workflow verification feature, the implementation is minimal:

1. **No code changes to ml_companion** - This is a documentation-only feature
2. **Workflow validation through task completion** - Each agent task completing validates the workflow
3. **Design document serves as artifact** - This document is the deliverable

### 6.2 Files Affected

```
ml_companion/
└── docs/
    └── planning/
        └── qa-test-feature-technical-design.md  (NEW - this file)
```

### 6.3 Testing Strategy

| Test Type | Approach |
|-----------|----------|
| Unit Tests | N/A - no code changes |
| Integration Tests | N/A - no API changes |
| Workflow Tests | Verify all Mission Control tasks complete |

### 6.4 Deployment

1. **No CI/CD changes required** - Documentation only
2. **No Supabase migrations** - No schema changes
3. **No Edge Function deployments** - No new functions

---

## 7. Security Considerations

### 7.1 Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Data exposure | None | No new data handling |
| Auth bypass | None | No auth changes |
| Injection attacks | None | No user input handling |

### 7.2 Security Review

- [ ] No sensitive data handling required
- [ ] No external API integrations added
- [ ] No authentication changes
- [ ] No RLS policy modifications

---

## 8. Future Considerations

If this test feature were expanded into a real QA/testing framework for ml_companion, consider:

1. **Test Results Storage** - Add `qa_test_results` table with RLS
2. **Automated Testing Edge Function** - Create `qa-test` function for API testing
3. **Admin UI** - Add QA dashboard to AdminPage tabs
4. **Scheduled Tests** - Use n8n or cron for periodic health checks

---

## 9. Acceptance Criteria

Per the task requirements:

- [x] Technical design document is complete
- [ ] Design reviewed by another developer (pending code-reviewer)
- [x] No blocking technical concerns identified

---

## 10. Appendix

### A. Related Documents

- [Architecture Overview](../architecture/overview.md)
- [Edge Functions Setup](../setup/edge_functions.md)
- [Supabase Setup](../setup/supabase.md)

### B. Related Mission Control Tasks

| Task ID | Title | Status |
|---------|-------|--------|
| task_zSlGXWjJGrx8 | Define requirements for QA Test Feature | Done |
| task_LD0hAQTOme0z | Technical design for QA Test Feature | In Progress |
| task_ZOXizHgW_ONM | Implement QA Test Feature | Blocked |
| task_eD7__Du53ROE | Code review for QA Test Feature | Blocked |
| task_0MYUzInQUFFT | Verify QA Test Feature in staging | Blocked |

---

**Document Revision History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-03-04 | developer | Initial technical design |
