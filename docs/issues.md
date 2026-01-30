# Issues & Roadmap

Version: v1.18
Date: 2026-01-23

**Sync Status:**
- Last Local Change: 2026-01-23
- Last Linear Sync: 2026-01-23 (partial)
- Pending Sync: Yes - Many issues with "—" in Linear column have no Linear issue created
- Last Sync Note: Created LOYD-204 (IMP-001), LOYD-205 (TEST-002), LOYD-206-209 (DM-001 through DM-004)

**Legend:**
- **Effort:** Low (< 1 day) | Medium (1-3 days) | High (1+ week)
- **Benefit:** Low (nice-to-have) | Medium (improves experience) | High (core value)
- **Risk:** Low (isolated change) | Medium (touches multiple areas) | High (could break existing features)
- **Status:** Planned | In Progress | Complete

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.18 | 2026-01-23 | Added IMP-001 (Round sync requires re-upload after linking) - HIGH PRIORITY |
| v1.17 | 2026-01-15 | Added TEST-004 (Test Dashboard Data Sync Issues) with detailed debugging notes |
| v1.16 | 2026-01-14 | Added DEV-001, DEV-002 (DevOps/CI-CD hardening); updated TEST-003 to In Progress |
| v1.15 | 2026-01-14 | Added TEST-003 (Historical CSV Import in Test Dashboard) |
| v1.14 | 2026-01-14 | Marked HIST-001, ML-001, ML-002, AWD-005, INT-002, YT-001, PN-005, CHAT-001 complete; added notification deep links |
| v1.13 | 2026-01-12 | Added PN-005 (Separate DM notification checkbox) |
| v1.12 | 2026-01-10 | Added DM-001 through DM-004 (DM inbox bugs and icon styling) |
| v1.11 | 2026-01-10 | Added TEST-002 Test Dashboard Song Tracking; updated TEST-001 to In Progress |
| v1.10 | 2026-01-09 | Added TEST-001 Automated Test Environment & Data Factory |
| v1.9 | 2026-01-07 | Added RC-002 (LOYD-175) Round Challenge UI Polish |
| v1.8 | 2026-01-05 | Sprint planning: Added YouTube Automation epic, Chat Quote Reply, History Spotify links. Canceled EF-002 (JWT covers it) |
| v1.7 | 2026-01-05 | Added BE-001, AI-001, ADM-001 from Linear sync |
| v1.6 | 2026-01-04 | Major update: PN-001 complete (FCM push), INT-001 partial (email ingestion), YouTube integration, activity tracker |
| v1.5 | 2026-01-04 | Marked SG-001 complete (Submitter Guess minigame deployed) |
| v1.4 | 2026-01-03 | Added Linear issue IDs (LOYD-129 to LOYD-148) |
| v1.3 | 2026-01-02 | Merged awards roadmap content; marked SEC-001/EF-001 complete (JWT auth deployed) |
| v1.2 | 2026-01-01 | Initial consolidated issues & roadmap document |

---

## Roadmap

### Push Notifications

| ID | Linear | Feature | Status | Effort | Benefit | Risk | Notes |
|----|--------|---------|--------|--------|---------|------|-------|
| PN-001 | [LOYD-129](https://linear.app/loydmilligan/issue/LOYD-129) | FCM Push Notifications | **Complete** | High | High | Medium | FCM v1 API, service worker, PWA support. Deployed 2026-01-03 |
| PN-002 | [LOYD-130](https://linear.app/loydmilligan/issue/LOYD-130) | iOS Push (APNs) | In Progress | High | High | Medium | PWA installed, needs Apple Developer account for native APNs |
| PN-003 | — | Notification Preferences | **Complete** | Medium | Medium | Low | Type toggles (new_round, results, chat, deadline). Deployed 2026-01-03 |
| PN-004 | — | ntfy.sh Fallback | **Complete** | Low | Medium | Low | Alternative push via ntfy.sh with subscribe guide. Deployed 2026-01-03 |
| PN-005 | — | Separate DM Notification Toggle | **Complete** | Low | Medium | Low | Add distinct checkbox for DM messages separate from group chat notifications. Deployed 2026-01-14 |

### Integrations

| ID | Linear | Feature | Status | Effort | Benefit | Risk | Notes |
|----|--------|---------|--------|--------|---------|------|-------|
| INT-001 | [LOYD-131](https://linear.app/loydmilligan/issue/LOYD-131) | Music League Email Integration | **Partial** | High | High | Low | Email parsing via n8n→Supabase done. Activity tracking working. Deployed 2026-01-04 |
| INT-002 | [LOYD-132](https://linear.app/loydmilligan/issue/LOYD-132) | Supabase Realtime | **Complete** | Medium | High | High | Live updates for chat, votes, round status. Deployed 2026-01-14 |
| INT-003 | [LOYD-133](https://linear.app/loydmilligan/issue/LOYD-133) | Spotify Embeds | Planned | Medium | Medium | Low | Embedded player for in-app playback |
| INT-004 | — | YouTube Sidebar Player | **Complete** | Medium | High | Low | In-app YouTube playback with sidebar. Deployed 2026-01-04 |
| INT-005 | — | Activity Tracker | **Complete** | Medium | High | Low | Show who submitted/voted with urgency colors. Deployed 2026-01-04 |

### Media Links

| ID | Linear | Feature | Status | Effort | Benefit | Risk | Notes |
|----|--------|---------|--------|--------|---------|------|-------|
| ML-001 | [LOYD-134](https://linear.app/loydmilligan/issue/LOYD-134) | Verify Spotify Links | **Complete** | Low | Medium | Low | Audit all Spotify song/playlist links. Deployed 2026-01-14 |
| ML-002 | [LOYD-135](https://linear.app/loydmilligan/issue/LOYD-135) | Verify YouTube Links | **Complete** | Low | Medium | Low | Audit all YouTube song/playlist links. Deployed 2026-01-14 |
| ML-003 | [LOYD-136](https://linear.app/loydmilligan/issue/LOYD-136) | Spotify Embed Player | Planned | Medium | Medium | Low | Look into embedded player vs external links |
| ML-004 | [LOYD-152](https://linear.app/loydmilligan/issue/LOYD-152) | Song Link Preference Toggle (Spotify/YouTube/Both) | Planned | Low | Medium | Low | User setting to choose default song link provider |

### Security

| ID | Linear | Feature | Status | Effort | Benefit | Risk | Notes |
|----|--------|---------|--------|--------|---------|------|-------|
| SEC-001 | — | JWT for Edge Functions | **Complete** | Medium | High | Medium | JWT verification on all 6 edge functions. Deployed 2026-01-02 |

### Storage

| ID | Linear | Feature | Status | Effort | Benefit | Risk | Notes |
|----|--------|---------|--------|--------|---------|------|-------|
| STG-001 | [LOYD-141](https://linear.app/loydmilligan/issue/LOYD-141) | Round Art Bucket | Planned | Low | Low | Low | Create dedicated bucket instead of using `avatars` |
| STG-002 | [LOYD-142](https://linear.app/loydmilligan/issue/LOYD-142) | Trophy Storage Bucket | Planned | Low | Low | Low | Create dedicated bucket for award trophies |

### Backend Improvements

| ID | Linear | Feature | Status | Effort | Benefit | Risk | Notes |
|----|--------|---------|--------|--------|---------|------|-------|
| BE-001 | [LOYD-149](https://linear.app/loydmilligan/issue/LOYD-149) | Enhanced Competitor Matching | Planned | Medium | High | Medium | Handle ML username changes, season_competitors as source of truth |

### AI & Admin Improvements

| ID | Linear | Feature | Status | Effort | Benefit | Risk | Notes |
|----|--------|---------|--------|--------|---------|------|-------|
| AI-001 | [LOYD-150](https://linear.app/loydmilligan/issue/LOYD-150) | AI Chat Voting Phase Prompt | **In Progress** | Low | Medium | Low | Adjust AI assistant prompt for voting phase context |

### YouTube Automation

| ID | Linear | Feature | Status | Effort | Benefit | Risk | Notes |
|----|--------|---------|--------|--------|---------|------|-------|
| YT-001 | [LOYD-153](https://linear.app/loydmilligan/issue/LOYD-153) | YouTube Playlist Automation | **Complete** | High | High | Medium | Parent epic: auto-generate YouTube playlists from Spotify rounds. Deployed 2026-01-14 |
| YT-002 | [LOYD-151](https://linear.app/loydmilligan/issue/LOYD-151) | Copy AI Image URLs in Admin | Planned | Low | Medium | Low | Sub of YT-001: copy URLs for YouTube thumbnails |
| YT-003 | [LOYD-156](https://linear.app/loydmilligan/issue/LOYD-156) | Spotify-to-YouTube Converter | Planned | Medium | High | Low | Sub of YT-001: convert Spotify tracks to YouTube links via song.link API |

### Chat Improvements

| ID | Linear | Feature | Status | Effort | Benefit | Risk | Notes |
|----|--------|---------|--------|--------|---------|------|-------|
| CHAT-001 | [LOYD-154](https://linear.app/loydmilligan/issue/LOYD-154) | Chat Quote Reply | **Complete** | Low | Medium | Low | Add quote reply button to reaction picker. Deployed 2026-01-14 |

### History Page

| ID | Linear | Feature | Status | Effort | Benefit | Risk | Notes |
|----|--------|---------|--------|--------|---------|------|-------|
| HIST-001 | [LOYD-155](https://linear.app/loydmilligan/issue/LOYD-155) | Spotify Links on Song Cards | **Complete** | Low | Medium | Low | Convert source_uri to clickable Spotify links. Deployed 2026-01-14 |

### Direct Messages (Bugs)

| ID | Linear | Issue | Status | Effort | Benefit | Risk | Notes |
|----|--------|-------|--------|--------|---------|------|-------|
| DM-001 | [LOYD-206](https://linear.app/loydmilligan/issue/LOYD-206) | DM Inbox Blank Screen on Load | **Complete** | Low | High | Low | Added padding-top to push content below header. Deployed 2026-01-10 |
| DM-002 | [LOYD-207](https://linear.app/loydmilligan/issue/LOYD-207) | DM Message Text Illegible | **Complete** | Low | High | Low | Added explicit color styles for light/dark modes. Deployed 2026-01-10 |
| DM-003 | [LOYD-208](https://linear.app/loydmilligan/issue/LOYD-208) | DM Icon Styling & Position | **Complete** | Medium | Medium | Low | Raised circle, shimmer border, paper airplane icon, reordered in TopBar. Deployed 2026-01-10 |
| DM-004 | [LOYD-209](https://linear.app/loydmilligan/issue/LOYD-209) | DM Unread Badge Animation | **Complete** | Low | Medium | Low | Lipstick red (#f21b3f) badge with shimmer animation when unread. Deployed 2026-01-10 |

### DM-003: DM Icon Styling Requirements

**Current Issues:**
- DM icon is a plain chat bubble with no distinction from regular chat
- No raised circle background like settings icon
- Position incorrect in header

**Requirements:**

1. **Icon Design:**
   - Chat bubble with paper airplane or other symbol denoting "direct message" (not regular chat)
   - Should feel distinct from group chat icon

2. **Background Circle:**
   - Raised/elevated circle like settings cog button
   - Background color: slightly darker blue than icon, but lighter than main app background
   - Border/edge should mimic settings button shine/shimmer effect

3. **Position in Header (left to right):**
   - DM icon
   - Settings icon (cog)
   - Avatar icon
   - Gauge icon

4. **Unread State (DM-004):**
   - Border becomes shinier/flashier when unread messages exist
   - May include different colors in the shimmer effect
   - Badge count uses lipstick red color
   - Should really catch attention

---

## Minigames

### Submitter Guess (Voting Phase)

| ID | Linear | Feature | Status | Effort | Benefit | Risk | Notes |
|----|--------|---------|--------|--------|---------|------|-------|
| SG-001 | — | Submitter Guess Minigame | **Complete** | Medium | High | Low | Guess who submitted each song during voting. Deployed 2026-01-04 |
| SG-002 | — | Leaderboard Persistence | Planned | Low | Medium | Low | Store leaderboard history per round |
| SG-003 | — | Cross-Round Scoring | Planned | Medium | Medium | Low | Aggregate scores across the season |

### Round Challenge (Submission Phase)

| ID | Linear | Feature | Status | Effort | Benefit | Risk | Notes |
|----|--------|---------|--------|--------|---------|------|-------|
| RC-001 | — | Round Challenge Minigame | **Complete** | Medium | High | Low | Guess which S1 theme songs belonged to. Deployed 2025-12-31 |
| RC-002 | [LOYD-175](https://linear.app/loydmilligan/issue/LOYD-175) | UI Polish - Touch-Friendly | Planned | Medium | Medium | Low | Improve touch targets, visual feedback, consistency with Timeline |

---

## Awards System

### Round Awards (Current)

| ID | Linear | Feature | Status | Effort | Benefit | Risk | Notes |
|----|--------|---------|--------|--------|---------|------|-------|
| AWD-001 | [LOYD-143](https://linear.app/loydmilligan/issue/LOYD-143) | Trophy Modal Context | Planned | Medium | Medium | Low | Add category-specific info to trophy modals |
| AWD-002 | [LOYD-144](https://linear.app/loydmilligan/issue/LOYD-144) | Underdog Criterion Fix | Planned | Low | Low | Low | Update calculation to use season standings |

### Season Awards (New)

| ID | Linear | Feature | Status | Effort | Benefit | Risk | Notes |
|----|--------|---------|--------|--------|---------|------|-------|
| AWD-003 | [LOYD-145](https://linear.app/loydmilligan/issue/LOYD-145) | Season Awards Schema | Planned | Medium | Medium | Low | Add tables for season-level awards |
| AWD-004 | [LOYD-146](https://linear.app/loydmilligan/issue/LOYD-146) | Season Award Calculations | Planned | High | Medium | Medium | Implement 30 season-long awards |
| AWD-005 | [LOYD-147](https://linear.app/loydmilligan/issue/LOYD-147) | Current Season Card | **Complete** | Medium | High | Low | UI component showing live season progress. Deployed 2026-01-14 |
| AWD-006 | [LOYD-148](https://linear.app/loydmilligan/issue/LOYD-148) | "Awards in Reach" Gamification | Planned | Medium | Medium | Low | Show what awards users can still win |

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

## Testing & Infrastructure

| ID | Linear | Feature | Status | Effort | Benefit | Risk | Notes |
|----|--------|---------|--------|--------|---------|------|-------|
| TEST-001 | [LOYD-185](https://linear.app/loydmilligan/issue/LOYD-185) | Automated Test Environment & Data Factory | **In Progress** | High | High | Low | Full test harness for round lifecycle, multi-user simulation, observation dashboard |
| TEST-002 | [LOYD-205](https://linear.app/loydmilligan/issue/LOYD-205) | Test Dashboard Song Tracking | Planned | Low | Medium | Low | Display actual song names in submission grid; requires edge function enhancement to return song data |
| TEST-003 | — | Historical CSV Import in Test Dashboard | **In Progress** | Medium | High | Low | Generate and import historical CSVs directly from test dashboard; consolidate import workflow |
| TEST-004 | — | Test Dashboard Data Sync Issues | Planned | Medium | High | Medium | Fix inconsistencies between test-factory edge function and UI state; investigate CSV import failures |

### DevOps & CI/CD

| ID | Linear | Feature | Status | Effort | Benefit | Risk | Notes |
|----|--------|---------|--------|--------|---------|------|-------|
| DEV-001 | [LOYD-198](https://linear.app/loydmilligan/issue/LOYD-198) | Prevent Accidental Production Deployments | Planned | Medium | High | Low | Harden deployment workflow, remove manual SSH access, add safeguards |
| DEV-002 | [LOYD-197](https://linear.app/loydmilligan/issue/LOYD-197) | Review CI/CD for Dependencies & Edge Functions | Planned | Medium | High | Low | Audit workflows for npm, edge functions, migrations; automate where possible |

### TEST-001: Automated Test Environment

**Problem:** No proper test environment to validate full application lifecycle. Recent votes-in-transition issues revealed critical flows are untested. Claude Code cannot independently test multi-user features.

**Requirements:**

1. **Test Group Setup**
   - 5+ synthetic users (1 admin, 4+ members)
   - At least 2 seasons configured
   - All group settings enabled

2. **Data Factory Functions**
   - `simulate_ml_round_start` - Trigger round from "email"
   - `simulate_ml_submission` - Add song submission
   - `simulate_ml_vote` - Cast votes
   - `simulate_ml_results` - Trigger results
   - `simulate_chat_message` - Post to group chat
   - `simulate_dm_message` - Send DM
   - `simulate_reaction` - Add reaction
   - `advance_round_phase` - Move round phases

3. **Test Scenarios Inventory**
   - Round lifecycle (create → submit → vote → results)
   - Chat & realtime delivery
   - Reactions (multiple users, same emoji)
   - DM creation and messaging
   - Admin functions
   - Edge cases (user joins mid-round, concurrent submissions)

4. **Observation Dashboard**
   - Real-time round status
   - User activity log
   - Submission/voting progress
   - System events and errors

5. **Test Runner**
   - CLI or UI to trigger scenarios
   - Speed controls (real-time vs accelerated)
   - Reset function to clear and restart

### TEST-004: Test Dashboard Data Sync Issues

**Problem:** Multiple data synchronization issues between the test-factory edge function and the test dashboard UI. Actions appear to work but data doesn't persist or display correctly.

**Known Issues (2026-01-15):**

1. **CSV Import Fails Halfway**
   - Import progress bar reaches ~50% then shows "Import Failed"
   - No detailed error message in UI
   - Unclear which step is failing

2. **Individual Submission Buttons Don't Work**
   - UI flashes then nothing happens
   - No error messages displayed
   - Edge function returns success when called directly via curl
   - Console shows fetch requests completing but HEAD request to submissions fails

3. **Progress Panel Shows Wrong Counts**
   - Shows 0/5 songs and 1/5 votes when data exists
   - `round_user_activity` table not populated by test-factory actions
   - Fixed: Added activity record creation to `generateVoteData` function
   - Still need to verify fix works after deployment

4. **Vote Deduplication Issue (Fixed)**
   - Duplicate vote records in database caused inflated point totals
   - Fixed by deduplicating votes by (voter_name, submission_id) in voting pattern calculation

**Debugging Notes:**
- Edge function works when called directly: `curl -X POST .../test-factory` returns success
- Dev Supabase project: `rqtimlhqasmeymxhmkiz`
- Supabase MCP connects to prod only - cannot query dev database
- Auto-refresh on test dashboard makes debugging difficult (consider adding pause toggle)

**Next Steps:**
1. Add better error logging to test-factory edge function
2. Surface detailed errors in test dashboard UI
3. Investigate HEAD request failure on submissions table (RLS issue?)
4. Test activity record creation after latest deployment

---

### IMP-001: Round Sync Requires Re-upload After Linking

**Problem:** When importing round data from Music League files, users must upload files twice - once to see unlinked rounds, link them, then re-upload for the data to actually be associated. This has caused issues in multiple rounds (Round 2 and Round 3 of Season 2).

**Current Workflow (Bad):**
1. Upload CSV files (rounds, submissions, votes)
2. System stores data in `round_imports` with `round_id = NULL`
3. User sees unlinked rounds in UI
4. User manually links external round to TML round
5. **User must re-upload files** for submissions/votes to be associated
6. If they don't re-upload, votes don't appear in results

**Expected Workflow (Good):**
1. Upload CSV files
2. System stores data in `round_imports`
3. User links external round to TML round
4. System **automatically re-processes** existing import data with new round linkage
5. No re-upload required

**Root Cause:**
- The import process uses `round_id` from the `round_imports` table to link submissions/votes
- When first uploaded, `round_id` is NULL (no round linked yet)
- Submissions/votes are imported with this NULL linkage
- Linking the round later only updates `round_imports.round_id`, not the already-imported data

**Solution Options:**

1. **Auto-reprocess on link (Recommended)**
   - When `round_imports.round_id` is updated, trigger a function to reprocess
   - Update all submissions/votes with the correct round linkage
   - Add user feedback showing reprocessing status

2. **Prevent upload until linked**
   - Require round linking before allowing data import
   - Less flexible but eliminates the problem

3. **Just-in-time linking**
   - Store external_round_id on submissions/votes
   - At query time, join through round_imports to get the actual round
   - More complex queries but no reprocessing needed

**Acceptance Criteria:**
- [ ] User can upload files, link rounds, and see data without re-uploading
- [ ] Clear feedback when linking is successful
- [ ] Existing submissions/votes are retroactively associated
- [ ] This functionality included in AdminV2 imports tab

**Priority:** HIGH - Blocks every round transition

---

### TEST-003: Historical CSV Import in Test Dashboard

**Problem:** Currently, historical CSV generation creates downloadable files, but importing them requires navigating to the Admin > Imports tab manually. This breaks the test workflow and requires extra steps.

**Requirements:**

1. **Unified CSV Workflow**
   - Generate historical CSVs (rounds, submissions, votes)
   - Import directly to database without download
   - Optional: download button for local backup

2. **Import Actions to Support**
   - Season competitors import
   - Historical rounds import
   - Submissions with song data import
   - Vote records import
   - Player connections import

3. **Post-Import Functions**
   - Review all functions that depend on historical data:
     - Competitor linking (profile_id matching)
     - Award calculations
     - Leaderboard aggregation
     - AI story context
   - Ensure these can be triggered from test dashboard

4. **UI Controls**
   - "Generate & Import" combined button
   - Progress indicator for multi-step import
   - Validation results display
   - "Download CSVs" separate option for debugging

---

## Outstanding Issues

### High Severity

| ID | Linear | Issue | Status | Effort | Benefit | Risk | Notes |
|----|--------|-------|--------|--------|---------|------|-------|
| IMP-001 | [LOYD-204](https://linear.app/loydmilligan/issue/LOYD-204) | Round sync requires re-upload after linking | **Planned** | Medium | High | Low | After linking external round to TML round, must re-upload files for data to associate. Blocks every round end. |
| EF-001 | — | No auth on edge functions | **Complete** | Medium | High | Medium | JWT verification added to all 6 functions. Deployed 2026-01-02 |
| EF-002 | [LOYD-137](https://linear.app/loydmilligan/issue/LOYD-137) | `notify` accepts arbitrary recipients | **Canceled** | Low | High | Low | JWT auth mitigates spam risk - only authenticated users can call |

### Medium Severity

| ID | Linear | Issue | Status | Effort | Benefit | Risk | Notes |
|----|--------|-------|--------|--------|---------|------|-------|
| EF-003 | [LOYD-138](https://linear.app/loydmilligan/issue/LOYD-138) | No payload size limits | Planned | Low | Medium | Low | Large payloads could inflate API costs |

### Low Severity

| ID | Linear | Issue | Status | Effort | Benefit | Risk | Notes |
|----|--------|-------|--------|--------|---------|------|-------|
| EF-004 | [LOYD-139](https://linear.app/loydmilligan/issue/LOYD-139) | Wildcard CORS | Planned | Low | Low | Low | Overly permissive. Fix: restrict to app domain |
| EF-005 | [LOYD-140](https://linear.app/loydmilligan/issue/LOYD-140) | Non-POST requests not rejected | Planned | Low | Low | Low | Should return 405 for non-POST |

---

## Current Sprint (2026-01-14)

| ID | Linear | Feature | Status |
|----|--------|---------|--------|
| AI-001 | LOYD-150 | AI Chat Voting Phase Prompt | In Progress |
| TEST-001 | LOYD-185 | Automated Test Environment Enhancement | In Progress |

---

## Priority Matrix

**Quick Wins (Low Effort, High/Medium Benefit):**
- EF-003 (LOYD-138): Add payload limits
- AI-001 (LOYD-150): AI Chat Voting Phase Prompt

**High Impact (Worth the Effort):**
- PN-002 (LOYD-130): iOS native push (APNs)
- TEST-001 (LOYD-185): Automated Test Environment Enhancement
- AWD-004 (LOYD-146): Season Award Calculations

**Technical Debt:**
- STG-001/STG-002 (LOYD-141/142): Storage buckets cleanup

**Nice to Have:**
- INT-003/ML-003 (LOYD-133/136): Spotify embeds
- AWD-006 (LOYD-148): Awards gamification

---

## Recently Completed (2026-01-01 to 2026-01-14)

| ID | Feature | Date |
|----|---------|------|
| SEC-001 | JWT Authentication for Edge Functions | 2026-01-02 |
| PN-001 | FCM Push Notifications | 2026-01-03 |
| PN-003 | Notification Preferences | 2026-01-03 |
| PN-004 | ntfy.sh Fallback | 2026-01-03 |
| RC-001 | Round Challenge Minigame | 2025-12-31 |
| SG-001 | Submitter Guess Minigame | 2026-01-04 |
| INT-001 | Email Ingestion (partial) | 2026-01-04 |
| INT-004 | YouTube Sidebar Player | 2026-01-04 |
| INT-005 | Activity Tracker | 2026-01-04 |
| PN-005 | Separate DM Notification Toggle | 2026-01-14 |
| CHAT-001 | Chat Quote Reply | 2026-01-14 |
| HIST-001 | Spotify Links on Song Cards | 2026-01-14 |
| ML-001 | Verify Spotify Links | 2026-01-14 |
| ML-002 | Verify YouTube Links | 2026-01-14 |
| INT-002 | Supabase Realtime | 2026-01-14 |
| YT-001 | YouTube Playlist Automation | 2026-01-14 |
| AWD-005 | Current Season Card | 2026-01-14 |
