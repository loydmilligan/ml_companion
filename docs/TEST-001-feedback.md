# TEST-001 Plan Feedback & Revision Requests

**Context:** This document contains feedback on the original TEST-001 plan (Automated Test Environment & Data Factory). The goal is to revise the plan based on these concerns and requirements.

---

## Overall Direction Change

The current plan is too API/endpoint-focused. I want a **realistic walkthrough** approach instead:

1. **Data generation phase** — Create all test data upfront
2. **Test execution phase** — Run "real" rounds that exercise actual code paths, not just API calls
3. **Verification checkpoints** — Stop to check DB for expected states after each step
4. **UI verification** — Ability to check the UI and take screenshots during test runs
5. **Pre-configured fixtures** — Have test systems frozen in specific states to test state transitions forward

The test system should simulate how the app actually works in production, stepping through the real flows rather than just calling factory endpoints.

---

## Up Front Data Requirements

### 1. User Creation

**Included data (missing from current plan):**
- Standard user data
- Avatar images
- Relationship data between users (parent-child, aunt/uncle-niece/nephew, etc.) — used in some round awards
- User description JSON — used for AI image creation processes

**Arguments:**
- `--user-count` (number of users)
- `--family-name`

**🔍 RESEARCH NEEDED:** Is this argument list exhaustive? What other user data affects downstream features?

---

### 2. Import Data (4 CSV files)

Files: `rounds.csv`, `votes.csv`, `submissions.csv`, `competitors.csv`

**Arguments:**
- `--family` (must exist, must contain users)
- `--type`:
  - `historical` — Creates 1 historical season
    - Default rounds = number of users
    - Optional: `--rounds #`
  - `current` — Data for single current round only
  - `future` — Data for upcoming seasons/rounds
    - Default: current season remaining rounds + 1 additional season (rounds = user count)
    - Optional: `--seasons #`, `--rounds #`

**🔍 RESEARCH NEEDED:** Is this argument list exhaustive?

---

### 3. League/Season/Round Creation

**Concern:** In real usage, users create 1 league (season) at a time. Test approach should either:
- Mimic this exactly (sequential creation), OR
- Create all seasons at once but "hide" future seasons

**🔍 RESEARCH NEEDED:** How does the actual new league creation process work? This app was built after Season 2 started, so the league creation flow was never fully tested. Need to research the intended flow in the codebase.

---

## Email Ingestion Data (5 Types)

Real data flow: `Music League notifications → Gmail → n8n → Supabase → TML code`

### Type 1: Round Starting

**🔍 RESEARCH NEEDED:** What is triggered by this email? What data/state changes occur?

---

### Type 2: User Submitted

**Important quirk:** Music League assumes the admin doesn't want emails about their own submissions/votes. The app handles this via Admin Panel → Imports tab where admin can:
1. Update any user's submission/vote data (if email ingestion fails)
2. Create their own submissions and votes manually

**Test requirement:** Email ingestion data should mimic this quirk. Test process needs automated mechanism for "manually" entering admin's submissions/votes (not *what* they submit, but *when*).

**🔍 RESEARCH NEEDED:** Any additional data needed to facilitate processes triggered by these emails?

---

### Type 3: New Playlist (Playlist Ready)

Triggered when: Everyone has submitted OR submission deadline passed

**🔍 RESEARCH NEEDED:** 
- Do we handle users missing submission deadlines? (Presume not, never discussed)
- Do we handle users missing voting deadlines?
- What processes depend on this? What data is needed?

---

### Type 4: User Voted

Tracks when users vote (not who they voted for). Triggers minigame changes.

**🔍 RESEARCH NEEDED:** What minigame changes does this trigger? What state transitions occur?

---

### Type 5: Votes Are In

**Most critical status change.** Triggers multiple sub-processes.

**🔍 RESEARCH NEEDED:** Carefully research and document:
- All triggered sub-processes
- All data needed to make this work without intervention
- Main dependency: Upload of current round Music League data files (the 4 CSVs)

---

## Interactive Test Dashboard (New Requirement)

**Core concept:** A simple, functional UI (aesthetics don't matter) that allows observation and control while tests run.

### Run Modes

1. **Automatic mode** — Run entire test flow start to finish without stopping
2. **Breakpoint mode** — Pause at defined checkpoints, requiring manual advancement

### Dashboard Features

#### Display Panel
- Key metrics for current state (user count, round status, submission count, vote count, etc.)
- What's coming in the next step (preview of action about to happen)
- Links to screenshots captured during run
- Current phase indicator (setup → submissions → voting → reveal → complete)

#### Control Panel
- **"Next Step" button** — Execute single atomic action (e.g., one user submits)
- **"Jump to Phase" buttons** — Skip ahead to next major state:
  - → All users submitted (playlist ready)
  - → Voting phase
  - → All votes in
  - → Reveal period
  - → Post-reveal (archived)
- **"Run to next breakpoint"** — Continue until next configured pause point
- **"Run to completion"** — Finish remaining steps automatically

#### Log Section
- View actual outputs from each step
- DB state changes
- Any errors or warnings
- Timestamps

### Breakpoint Configuration

Ability to set breakpoints at:
- Each individual user action (submission, vote)
- Phase transitions (open → voting → revealed → archived)
- Email event processing
- AI generation triggers
- Minigame state changes

---

## Additional Features Requiring Test Coverage

Not fully addressed in current plan:

| Category | Features |
|----------|----------|
| Communication | Chat, DM |
| AI Features | Chat assistant, theme help, historical awards, round banners, round stories (post-reveal), round images, current season stories |
| System | Notifications |
| Games | Minigames (multiple types, phase-dependent) |

These features need to be exercised as part of the test flow, not just the core round lifecycle.

---

## Summary of Research Items

Before revising the plan, the following areas need code research:

| Area | Question |
|------|----------|
| User creation | What's the complete list of user data that affects downstream features? |
| League creation | What's the intended new league creation flow? |
| Round starting email | What does it trigger? |
| User submitted email | Any additional triggered processes? |
| Playlist ready email | How to handle missed submission/voting deadlines? |
| User voted email | What minigame state changes occur? |
| Votes in email | Complete list of triggered sub-processes and required data? |

---

## Requested Next Steps

1. **Research** — Investigate the codebase to answer the research questions above
2. **Revise plan** — Update TEST-001 to reflect:
   - Realistic walkthrough approach (not just API endpoints)
   - Complete data requirements (including relationships, avatars, descriptions)
   - Interactive dashboard with breakpoint support
   - Coverage for all features (AI, chat, minigames, notifications)
3. **Document flows** — Create clear documentation of what each email type triggers and what data it needs
