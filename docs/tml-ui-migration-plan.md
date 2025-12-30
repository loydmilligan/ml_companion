# Talking Music League - Chat-First UI Migration Plan (Revised)

## Goal
Shift the primary experience from dashboard-first to chat-first while preserving all existing features. The app should feel simpler, with fewer entry points and a clear primary workflow:

1) Group Chat (default landing + current round context)
2) History (completed rounds + season snapshots)
4) Settings/Profile

Admin-only tasks move into a single Admin area.

---

## Current App Reality (Baseline)
We already have:
- Group chat (`/app/chat`)
- Dashboard hub (`/app`)
- Round detail (`/app/rounds/:id`) with submissions + comments
- Season 1 recap + personal stats + round archive
- Admin-only controls (invite, round creation, competitor management, CSV import)
- OpenRouter song connection widget

The migration should reuse these components and re-route them into a chat-first layout instead of the current dashboard grid.

---

## New Route Structure (Chat-First)

```
/                → Redirect to /app/chat
/app/chat        → Group Chat (DEFAULT) + current round strip
/app/round/:id   → Round detail + submission/comments
/app/history     → Completed rounds + season snapshots + round chat
/app/history/recap         (anchor section)
/app/history/my-picks      (anchor section)
/app/history/rounds        (anchor section)
/app/history/connections   (anchor section)
/app/settings    → Settings & notifications
/app/profile     → Profile + avatar + notification settings
/app/admin       → Admin panel (invite, rounds, competitors, CSV import)
```

---

## Navigation Model

### Mobile
Bottom nav with 4 items:
- Chat
- History
- Settings

### Desktop
Left sidebar nav (simple, no submenus):
- Chat
- History
- Settings
- Admin (only for lead)

---

## Screen Recomposition

### 1) Chat (Default)
- Primary: Group chat thread + input
- Secondary: Current round strip at top (theme + status + deadlines + playlist + track list)
- Quotes from tracks @-mention into the group chat

### 2) History
- Completed rounds only (season selector at top)
- Round recap widgets + AI narrative
- Round chat appears here and seeds with group chat messages from the round window

### 3) Admin Panel
- Invite generation
- Add/create round
- Competitors management
- CSV import

### 4) Settings/Profile
- Keep as separate routes

---

## UX Simplification Rules
- No duplicate entry points for admin tasks
- Dashboard widgets become either “Chat overlay”, “History page”, or “Admin page”
- Chat remains the default landing screen

---

## Implementation Steps

### Step 1: Routing and Layout
- Add a new ChatFirstLayout that uses a simpler nav and routes
- Redirect `/app` → `/app/chat`
- Keep existing pages, but route them into chat-first structure

### Step 2: Admin Panel
- Create a dedicated Admin page that bundles:
  - Generate invite
  - Add round
  - Competitor management
  - Import current season

### Step 3: History Page
- Use DB-only data for completed rounds + season snapshots
- Round chat lives here (seeded from group chat)

### Step 4: Remove Dashboard Hub
- Dashboard page becomes unused except as a redirect

---

## Success Criteria
- Chat is the default landing screen
- Admin-only controls live only in Admin
- History is a single page
- Round detail unchanged and accessible from History or admin
- App remains functional for both admins and members
