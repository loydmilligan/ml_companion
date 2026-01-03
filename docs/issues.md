# Issues & Roadmap

Version: v1.3
Date: 2026-01-02

**Legend:**
- **Effort:** Low (< 1 day) | Medium (1-3 days) | High (1+ week)
- **Benefit:** Low (nice-to-have) | Medium (improves experience) | High (core value)
- **Risk:** Low (isolated change) | Medium (touches multiple areas) | High (could break existing features)
- **Status:** Planned | In Progress | Complete

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.3 | 2026-01-02 | Merged awards roadmap content; marked SEC-001/EF-001 complete (JWT auth deployed) |
| v1.2 | 2026-01-01 | Initial consolidated issues & roadmap document |

---

## Roadmap

### Push Notifications

| ID | Feature | Status | Effort | Benefit | Risk | Notes |
|----|---------|--------|--------|---------|------|-------|
| PN-001 | Android Push (FCM) | Planned | High | High | Medium | FCM integration, service worker, notification handling. Risk: service worker conflicts with existing caching |
| PN-002 | iOS Push (APNs) | Planned | High | High | Medium | Requires Apple Developer account ($99/yr), APNs certs. Risk: iOS-specific quirks, testing requires real device |

### Integrations

| ID | Feature | Status | Effort | Benefit | Risk | Notes |
|----|---------|--------|--------|---------|------|-------|
| INT-001 | Music League Email Integration | Planned | High | High | Low | Parse incoming ML emails to trigger app updates. Could auto-detect round status changes. Isolated from core app |
| INT-002 | Supabase Realtime | Planned | Medium | High | High | Live updates for chat, votes, round status. Risk: adds complexity to state management, potential race conditions |
| INT-003 | Spotify Embeds | Planned | Medium | Medium | Low | Embedded player for in-app playback. Risk: Spotify API rate limits, auth complexity |

### Media Links

| ID | Feature | Status | Effort | Benefit | Risk | Notes |
|----|---------|--------|--------|---------|------|-------|
| ML-001 | Verify Spotify Links | Planned | Low | Medium | Low | Audit all Spotify song/playlist links for functionality. No code changes expected |
| ML-002 | Verify YouTube Links | Planned | Low | Medium | Low | Audit all YouTube song/playlist links for functionality. No code changes expected |
| ML-003 | Spotify Embed Player | Planned | Medium | Medium | Low | Look into embedded player vs external links. May need Spotify API auth |

### Security

| ID | Feature | Status | Effort | Benefit | Risk | Notes |
|----|---------|--------|--------|---------|------|-------|
| SEC-001 | JWT for Edge Functions | **Complete** | Medium | High | Medium | JWT verification on all 6 edge functions. Deployed 2026-01-02 (commit e340a50) |

### Storage

| ID | Feature | Status | Effort | Benefit | Risk | Notes |
|----|---------|--------|--------|---------|------|-------|
| STG-001 | Round Art Bucket | Planned | Low | Low | Low | Create dedicated bucket instead of using `avatars`. Migration of existing images needed |
| STG-002 | Trophy Storage Bucket | Planned | Low | Low | Low | Create dedicated bucket for award trophies |

---

## Awards System

### Round Awards (Current)

| ID | Feature | Status | Effort | Benefit | Risk | Notes |
|----|---------|--------|--------|---------|------|-------|
| AWD-001 | Trophy Modal Context | Planned | Medium | Medium | Low | Add category-specific info to trophy modals. See details below |
| AWD-002 | Underdog Criterion Fix | Planned | Low | Low | Low | Update calculation to use season standings. See details below |

### Season Awards (New)

| ID | Feature | Status | Effort | Benefit | Risk | Notes |
|----|---------|--------|--------|---------|------|-------|
| AWD-003 | Season Awards Schema | Planned | Medium | Medium | Low | Add tables for season-level awards. New tables, no existing data affected |
| AWD-004 | Season Award Calculations | Planned | High | Medium | Medium | Implement 30 season-long awards. Risk: performance if calculations are expensive |
| AWD-005 | Current Season Card | Planned | Medium | High | Low | UI component showing live season progress. New component, isolated |
| AWD-006 | "Awards in Reach" Gamification | Planned | Medium | Medium | Low | Show what awards users can still win. Depends on AWD-004 |

### AWD-001: Trophy Modal Info by Category

Each award modal should display contextual information based on award type.

| Category | Modal Info to Display |
|----------|----------------------|
| **performance** | Track name, artist, final rank, total points, margin over next place |
| **voting_behavior** | Voter name, their vote breakdown (which tracks, how many points each), comparison to average |
| **submission_style** | Track details (release year, genre, comment length), comparison to round average |
| **social** | Comment count, comment excerpts, engagement metrics |
| **timing** | Timestamp of action, time relative to deadline, comparison to others |
| **relationship** | Both parties involved, points exchanged, their averages for context |
| **theme** | Theme creator, theme description, relevant timing or ranking stats |

**Database change:** Add `modal_context JSONB` column to `round_awards` table.

### AWD-002: Underdog Criterion Update

**Current:** "Lowest average vote that still cracked the top 3"
**Proposed:** "Someone from the bottom half of season standings who made the podium"

Calculation: Check standing_rank / total_players; qualify if > 0.5 AND round_rank <= 3.

### AWD-003/AWD-004: Season Awards (30 Awards)

#### Performance Awards (10)

| # | Name | Description |
|---|------|-------------|
| 1 | The Champion | Season winner by total points |
| 2 | The Bridesmaid | 2nd place overall |
| 3 | The Dark Horse | Biggest jump from first half to second half standings |
| 4 | The Frontrunner | Led standings the most weeks |
| 5 | The Closer | Won the most rounds in the back half |
| 6 | Mr./Ms. Consistent | Lowest standard deviation in round rankings |
| 7 | The Rollercoaster | Highest variance in round rankings |
| 8 | Most Improved | Biggest positive trend line in rankings over season |
| 9 | The Veteran | Participated in most rounds |
| 10 | Podium Regular | Most top-3 finishes |

#### Voting Awards (5)

| # | Name | Description |
|---|------|-------------|
| 11 | The Kingmaker (Season) | Most times their vote decided the winner |
| 12 | The Prophet (Season) | Highest accuracy predicting winners |
| 13 | The Generous Soul (Season) | Highest total points given all season |
| 14 | The Critic (Season) | Most vote comments written |
| 15 | The Silent Voter | Fewest comments all season |

#### Submission Awards (5)

| # | Name | Description |
|---|------|-------------|
| 16 | The Archaeologist (Season) | Oldest average track release year |
| 17 | The Trendsetter | Newest average track release year |
| 18 | Genre Explorer | Most unique genres submitted |
| 19 | The Loyalist | Most repeat artists submitted |
| 20 | The Novelist (Season) | Highest total word count in submission comments |

#### Social/Engagement Awards (3)

| # | Name | Description |
|---|------|-------------|
| 21 | The Hype Man (Season) | Most total vote comments |
| 22 | The Polarizer | Most "Controversial Pick" awards |
| 23 | Fan Favorite | Most "Universal Appeal" awards |

#### Timing Awards (2)

| # | Name | Description |
|---|------|-------------|
| 24 | The Early Bird (Season) | Most "first to vote" awards |
| 25 | The Procrastinator (Season) | Most "last to submit" awards |

#### Relationship Awards (2)

| # | Name | Description |
|---|------|-------------|
| 26 | The Supporter (Season) | Gave partner/family highest points relative to baseline |
| 27 | Keeping It Honest (Season) | Most fair voter to family |

#### Fun/Unique Awards (3)

| # | Name | Description |
|---|------|-------------|
| 28 | The Comeback King/Queen | Most dramatic single-round improvement |
| 29 | Zero to Hero (Season) | Most times getting 0s but still finishing strong |
| 30 | The Wildcard | Hardest voting pattern to predict |

### AWD-005: Current Season Card

Display on History page showing:
- Current standings (top 5)
- Live season awards that update after each round
- "Awards in Reach" gamification prompts

### Awards Implementation Priority

1. Modal Context (AWD-001)
2. Category Templates
3. Underdog Fix (AWD-002)
4. Season Awards Schema (AWD-003)
5. Season Award Calculations (AWD-004)
6. Current Season Card (AWD-005)
7. Awards in Reach (AWD-006)

---

## Outstanding Issues

### High Severity

| ID | Issue | Status | Effort | Benefit | Risk | Notes |
|----|-------|--------|--------|---------|------|-------|
| EF-001 | No auth on edge functions | **Complete** | Medium | High | Medium | JWT verification added to all 6 functions. Deployed 2026-01-02 |
| EF-002 | `notify` accepts arbitrary recipients | Planned | Low | High | Low | Potential spam vector. Fix: add recipient allowlist or require auth |

### Medium Severity

| ID | Issue | Status | Effort | Benefit | Risk | Notes |
|----|-------|--------|--------|---------|------|-------|
| EF-003 | No payload size limits | Planned | Low | Medium | Low | Large payloads could inflate API costs. Fix: add size validation |

### Low Severity

| ID | Issue | Status | Effort | Benefit | Risk | Notes |
|----|-------|--------|--------|---------|------|-------|
| EF-004 | Wildcard CORS | Planned | Low | Low | Low | Overly permissive. Fix: restrict to app domain |
| EF-005 | Non-POST requests not rejected | Planned | Low | Low | Low | Should return 405 for non-POST. Minor fix |

---

## Priority Matrix

**Quick Wins (Low Effort, High/Medium Benefit):**
- EF-002: Fix notify recipients
- ML-001/ML-002: Verify media links
- EF-003: Add payload limits

**High Impact (Worth the Effort):**
- PN-001/PN-002: Push notifications (game changer for engagement)
- INT-002: Supabase Realtime (live updates transform UX)
- AWD-005: Current Season Card (visible, engaging feature)

**Technical Debt:**
- STG-001/STG-002: Storage buckets cleanup

**Nice to Have:**
- INT-003/ML-003: Spotify embeds
- AWD-006: Awards gamification
