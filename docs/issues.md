# Issues & Roadmap

Version: v1.2
Date: 2026-01-02

**Legend:**
- **Effort:** Low (< 1 day) | Medium (1-3 days) | High (1+ week)
- **Benefit:** Low (nice-to-have) | Medium (improves experience) | High (core value)
- **Risk:** Low (isolated change) | Medium (touches multiple areas) | High (could break existing features)

---

## Roadmap

### Push Notifications

| ID | Feature | Effort | Benefit | Risk | Notes |
|----|---------|--------|---------|------|-------|
| PN-001 | Android Push (FCM) | High | High | Medium | FCM integration, service worker, notification handling. Risk: service worker conflicts with existing caching |
| PN-002 | iOS Push (APNs) | High | High | Medium | Requires Apple Developer account ($99/yr), APNs certs. Risk: iOS-specific quirks, testing requires real device |

### Integrations

| ID | Feature | Effort | Benefit | Risk | Notes |
|----|---------|--------|---------|------|-------|
| INT-001 | Music League Email Integration | High | High | Low | Parse incoming ML emails to trigger app updates. Could auto-detect round status changes. Isolated from core app |
| INT-002 | Supabase Realtime | Medium | High | High | Live updates for chat, votes, round status. Risk: adds complexity to state management, potential race conditions |
| INT-003 | Spotify Embeds | Medium | Medium | Low | Embedded player for in-app playback. Risk: Spotify API rate limits, auth complexity |

### Media Links

| ID | Feature | Effort | Benefit | Risk | Notes |
|----|---------|--------|---------|------|-------|
| ML-001 | Verify Spotify Links | Low | Medium | Low | Audit all Spotify song/playlist links for functionality. No code changes expected |
| ML-002 | Verify YouTube Links | Low | Medium | Low | Audit all YouTube song/playlist links for functionality. No code changes expected |
| ML-003 | Spotify Embed Player | Medium | Medium | Low | Look into embedded player vs external links. May need Spotify API auth |

### Security

| ID | Feature | Effort | Benefit | Risk | Notes |
|----|---------|--------|---------|------|-------|
| SEC-001 | JWT for Edge Functions | Medium | High | Medium | Implement proper JWT verification on all edge functions. Risk: could break existing functionality if token handling is wrong |

### Awards System

| ID | Feature | Effort | Benefit | Risk | Notes |
|----|---------|--------|---------|------|-------|
| AWD-001 | Trophy Modal Context | Medium | Medium | Low | Add category-specific info to trophy modals. Isolated UI change |
| AWD-002 | Underdog Criterion Fix | Low | Low | Low | Update calculation to use season standings. Database query change only |
| AWD-003 | Season Awards Schema | Medium | Medium | Low | Add tables for season-level awards. New tables, no existing data affected |
| AWD-004 | Season Award Calculations | High | Medium | Medium | Implement 30 season-long awards. Risk: performance if calculations are expensive |
| AWD-005 | Current Season Card | Medium | High | Low | UI component showing live season progress. New component, isolated |
| AWD-006 | "Awards in Reach" Gamification | Medium | Medium | Low | Show what awards users can still win. Depends on AWD-004 |

### Storage

| ID | Feature | Effort | Benefit | Risk | Notes |
|----|---------|--------|---------|------|-------|
| STG-001 | Round Art Bucket | Low | Low | Low | Create dedicated bucket instead of using `avatars`. Migration of existing images needed |
| STG-002 | Trophy Storage Bucket | Low | Low | Low | Create dedicated bucket for award trophies |

---

## Outstanding Issues

### High Severity

| ID | Issue | Effort | Benefit | Risk | Notes |
|----|-------|--------|---------|------|-------|
| EF-001 | No auth on edge functions | Medium | High | Medium | Any caller can invoke functions. Fix: implement JWT verification (see SEC-001) |
| EF-002 | `notify` accepts arbitrary recipients | Low | High | Low | Potential spam vector. Fix: add recipient allowlist or require auth |

### Medium Severity

| ID | Issue | Effort | Benefit | Risk | Notes |
|----|-------|--------|---------|------|-------|
| EF-003 | No payload size limits | Low | Medium | Low | Large payloads could inflate API costs. Fix: add size validation |

### Low Severity

| ID | Issue | Effort | Benefit | Risk | Notes |
|----|-------|--------|---------|------|-------|
| EF-004 | Wildcard CORS | Low | Low | Low | Overly permissive. Fix: restrict to app domain |
| EF-005 | Non-POST requests not rejected | Low | Low | Low | Should return 405 for non-POST. Minor fix |

---

## Priority Matrix

**Quick Wins (Low Effort, High/Medium Benefit):**
- EF-002: Fix notify recipients
- ML-001/ML-002: Verify media links
- EF-003: Add payload limits

**High Impact (Worth the Effort):**
- PN-001/PN-002: Push notifications (game changer for engagement)
- INT-002: Supabase Realtime (live updates transform UX)
- SEC-001: JWT for edge functions (security foundation)
- AWD-005: Current Season Card (visible, engaging feature)

**Technical Debt:**
- EF-001/SEC-001: Auth on edge functions
- STG-001/STG-002: Storage buckets cleanup

**Nice to Have:**
- INT-003/ML-003: Spotify embeds
- AWD-006: Awards gamification
