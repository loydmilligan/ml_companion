# Implementation Plan - JWT Edge Function Authentication

## Source Analysis
- **Source Type**: Internal enhancement (SEC-001, EF-001)
- **Core Features**: Add JWT verification to all 6 edge functions
- **Dependencies**: Supabase Auth SDK (already available)
- **Complexity**: Medium (~2 hours)

## Target Integration
- **Integration Points**: All 6 edge functions
- **Affected Files**:
  - `supabase/functions/_shared/auth.ts` (CREATE)
  - `supabase/functions/notify/index.ts`
  - `supabase/functions/openrouter-round-story/index.ts`
  - `supabase/functions/openrouter-compare/index.ts`
  - `supabase/functions/ai-assistant/index.ts`
  - `supabase/functions/round-challenge/index.ts`
  - `supabase/functions/send-invite-email/index.ts`
- **Pattern Matching**: Use existing CORS pattern, add auth after OPTIONS check

## Implementation Tasks
- [x] Create implementation tracking files
- [x] Create shared auth utility (_shared/auth.ts)
- [x] Update notify function with JWT auth
- [x] Update openrouter-round-story with JWT auth
- [x] Update openrouter-compare with JWT auth
- [x] Update ai-assistant with JWT auth (also uses verified user.id)
- [x] Update round-challenge with JWT auth (also uses verified user.id)
- [x] Update send-invite-email with JWT auth
- [ ] Commit and push changes
- [ ] Deploy edge functions via Supabase MCP
- [ ] Deploy to Pi (docker)
- [ ] Test all functions

## Validation Checklist
- [ ] All 6 functions have JWT verification
- [ ] Functions return 401 for missing/invalid tokens
- [ ] Functions work correctly when authenticated
- [ ] Frontend continues to work (already sends JWT)
- [ ] No regressions in functionality

## Key Implementation Details

### Shared Auth Utility Pattern
```typescript
import { verifyAuth, unauthorizedResponse } from "../_shared/auth.ts";

// After OPTIONS check:
const { user, error: authError } = await verifyAuth(req);
if (authError) {
  return unauthorizedResponse(authError, corsHeaders);
}
```

### Security Improvements
- ai-assistant: Replace trusted user_id from body with user.id from token
- round-challenge: Replace trusted user_id from body with user.id from token
- notify: Add auth (currently accepts arbitrary calls)
- send-invite-email: Add auth verification

## Risk Mitigation
- **Rollback**: Redeploy previous function versions if issues
- **Testing**: Verify from app while logged in
- **Backwards Compatible**: Frontend already sends JWT tokens
