# Issues & Roadmap

Version: v1.1
Date: 2026-01-02

---

## Roadmap

### Push Notifications
| ID | Platform | Status | Notes |
|----|----------|--------|-------|
| PN-001 | Android | Planned | FCM integration, service worker setup |
| PN-002 | iOS | Planned | APNs integration, requires Apple Developer account |

### Integrations
| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| INT-001 | Music League Email Notifications | Planned | Parse incoming ML emails to trigger app notifications/updates |
| INT-002 | Supabase Realtime | Planned | Live updates for chat, votes, round status changes |
| INT-003 | Spotify Embeds | Planned | Investigate Spotify embed player for in-app playback |

### Media Links
| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| ML-001 | Spotify Links | Review | Verify all song/playlist Spotify links are functional |
| ML-002 | YouTube Links | Review | Verify all song/playlist YouTube links are functional |
| ML-003 | Spotify Embeds | Planned | Look into embedded player vs external links |

### Security
| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| SEC-001 | JWT for Edge Functions | Planned | Implement proper JWT verification on all edge functions (addresses EF-001) |

### Season/Awards Enhancements
| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| AWD-001 | Improve Season Rewards | Planned | See `docs/awards/AWARDS_ROADMAP.md` for full details |

---

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
