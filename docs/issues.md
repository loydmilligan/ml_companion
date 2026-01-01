# Issues Log

Version: v1.0  
Date: 2025-12-29

## Edge Function Review Findings

| ID | Severity | Area | Issue |
| --- | --- | --- | --- |
| EF-001 | High | Auth | No request authentication/verification; any caller can invoke `notify`, `openrouter-compare`, or `openrouter-round-story`. |
| EF-002 | High | Abuse | `notify` accepts arbitrary recipients with no validation or allowlist, enabling outbound spam. |
| EF-003 | Medium | Cost/Perf | No payload size limits; large `songs`/`votes` can inflate prompt size and cost. |
| EF-004 | Low | CORS | Wildcard CORS (`*`) and missing `Access-Control-Allow-Methods` makes browser access broad. |
| EF-005 | Low | Method Handling | No POST-only enforcement; non-POST requests still attempt JSON parsing. |
| DOC-001 | Low | Storage | Create a dedicated storage bucket for round art instead of using `avatars`. |
| DOC-002 | Low | Storage | Create a dedicated storage bucket for award trophies. |
