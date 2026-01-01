# Chat-First UI Wireframe: Music League Family Companion

## Design Philosophy
**Chat is the primary interface.** Round information appears as contextual chrome that can be expanded, minimized, or peeked at without disrupting the conversation flow.

---

## 1. COLLAPSED STATE - Pinned Message Minimized

```
┌─────────────────────────────────────┐
│ ⟨  Family League Chat    ⋮ [Profile]│ ← Top Bar
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │ ← PINNED MESSAGE (Collapsed)
│ │ 📌 Songs from your childhood ⏱️ │ │   Subtle bg color (theme-aware)
│ │ Submit: 2d 4h · Vote: 4d 10h  ˅ │ │   Urgency: green/yellow/red
│ └─────────────────────────────────┘ │   Tap anywhere to expand
│                                     │   Swipe to dismiss
│ ┌───────────────────────────────┐   │
│ │ Dad                      10:32│   │
│ │ Just submitted! This one's   │   │ ← Chat bubble (received)
│ │ gonna take me back 🎸         │   │
│ │                      ❤️ 👍 2  │   │   Reactions below
│ └───────────────────────────────┘   │
│                                     │
│     ┌───────────────────────────┐   │
│ 12:15│ OMG I found the PERFECT  │   │ ← Chat bubble (sent)
│       │ song for this theme      │   │
│       └───────────────────────────┘ │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Mom                      12:18│   │
│ │ Can't decide between two...  │   │
│ │ help me pick! 🤔              │   │
│ │                          👀 1 │   │
│ └───────────────────────────────┘   │
│                                     │
│     ┌───────────────────────────┐   │
│ 12:20│ @Mom what are the options?│  │ ← @ mention
│       └───────────────────────────┘ │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Sarah                    14:45│   │
│ │ ┌─────────────────────────┐  │   │ ← Inline YouTube embed
│ │ │ ▶️ Never Gonna Give You │  │   │   Shows thumbnail + title
│ │ │ Rick Astley · 3:32      │  │   │   Tap to play in-app
│ │ └─────────────────────────┘  │   │
│ │ Found this gem! 😂            │   │
│ │                    🤣 3  😍 1 │   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Dad                      14:47│   │
│ │ SARAH NO 😭😭😭                 │   │
│ │                    😂 5  💀 2 │   │
│ └───────────────────────────────┘   │
│                                     │
│ [Continue reading...]               │
│                                     │
├─────────────────────────────────────┤
│ [@] [Type a message...]      [Send]│ ← Compose bar
└─────────────────────────────────────┘   @ = mention picker
```

**Annotations:**
- **Pinned Message (Collapsed):**
  - Single-line bar showing theme + dual countdowns
  - Color-coded urgency (green=plenty time, yellow=<48h, red=<24h)
  - Chevron (˅) indicates expandable
  - Stays at top during scroll (sticky)

- **Chat Bubbles:**
  - Sender's name + timestamp
  - Long-press for reaction menu
  - Reactions display inline below message
  - @ mentions highlighted

- **Media Embeds:**
  - YouTube/Spotify links auto-expand to cards
  - Thumbnail + metadata visible
  - Tap to play in-app or open externally

---

## 2. EXPANDED STATE - Pinned Message Opened

```
┌─────────────────────────────────────┐
│ ⟨  Family League Chat    ⋮ [Profile]│
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │ ← PINNED MESSAGE (Expanded)
│ │ 📌 Round 12: Active         ✕   │ │   Close button to collapse
│ │ ╔═══════════════════════════════╗│
│ │ ║                               ║│ ← Theme banner image
│ │ ║  Songs from your childhood   ║│   (gradient or user-uploaded)
│ │ ║           🎸                  ║│
│ │ ╚═══════════════════════════════╝│
│ │                                 │ │
│ │ SUBMISSION DEADLINE              │ │
│ │ ████████████░░░░░░░  2d 4h left │ │ ← Progress bar (green)
│ │ Dec 31, 11:59 PM                │ │   Fill % = time remaining
│ │                                 │ │
│ │ VOTING DEADLINE                  │ │
│ │ ██████████████████░░  4d 10h left│ │ ← Progress bar (yellow)
│ │ Jan 2, 11:59 PM                 │ │   Starts after submissions
│ │                                 │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ [Submit Your Song]          │ │ │ ← Primary action
│ │ └─────────────────────────────┘ │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ [View All Submissions (8)]  │ │ │ ← Secondary action
│ │ └─────────────────────────────┘ │ │   (if voting phase)
│ │                                 │ │
│ │ 5/6 family members submitted    │ │ ← Status indicator
│ └─────────────────────────────────┘ │
│                                     │
│ ┌───────────────────────────────┐   │ ← Chat continues below
│ │ Dad                      10:32│   │   Pinned message pushes
│ │ Just submitted! This one's   │   │   chat content down
│ │ gonna take me back 🎸         │   │
│ └───────────────────────────────┘   │
│                                     │
│ [Messages continue...]              │
│                                     │
├─────────────────────────────────────┤
│ [@] [Type a message...]      [Send]│
└─────────────────────────────────────┘
```

**Annotations:**
- **Dual Deadline Progress Bars:**
  - Horizontal bars with % fill based on time remaining
  - Color coding: green (>48h), yellow (24-48h), red (<24h)
  - Countdown text shows days/hours remaining
  - Exact deadline timestamp below

- **Theme Banner:**
  - Visual anchor for the round
  - Can be gradient, uploaded image, or AI-generated
  - Contains theme text + emoji/icon

- **Action Buttons:**
  - Context-aware (submit vs. vote vs. view results)
  - Disabled state if user already completed action
  - Badge count (e.g., "8 submissions")

- **Close/Minimize:**
  - ✕ button collapses back to single line
  - User preference persists per session

---

## 3. RIGHT-EDGE PEEK PANEL - Swipe Gesture

```
┌─────────────────────────────────────┐
│ ⟨  Family League Chat    ⋮ [Profile]│
├────────────────────┬────────────────┤
│                    │ ROUND DETAILS  │ ← Panel slides in from right
│ ┌────────────────┐ │ ╔════════════╗ │   75% of screen width
│ │ Dad       10:32│ │ ║ Childhood  ║ │   Swipe or tap outside to
│ │ Just submitte│→ │ ║   Songs    ║ │   dismiss
│ │ gonna take me│   │ ╚════════════╝ │
│ └──────────────┘   │                │
│                    │ ⏱️ Submit: 2d 4h│
│   ┌──────────────┐ │ ████████░░ 80% │ ← Mini progress bars
│ 12│ OMG I found │  │                │
│   │ song for thi│  │ ⏱️ Vote: 4d 10h │
│   └──────────────┘ │ ██████████ 95% │
│                    │                │
│ ┌──────────────┐   │ ─── SONGS ───  │
│ │ Mom     12:18│   │                │
│ │ Can't decide │   │ ♫ @Dad         │ ← Quick mention list
│ │ help me pick!│   │   Mystery Song │   Shows who submitted
│ └──────────────┘   │                │   Tap name to @ mention
│                    │ ♫ @Sarah       │
│   ┌──────────────┐ │   Never Gonna  │
│ 12│ @Mom what ar│  │   Give You Up  │
│   └──────────────┘ │                │
│                    │ ♫ @Mom         │
│ [Chat dims 40%]    │   Not revealed │
│                    │                │
│                    │ ♫ @Alex        │
│                    │   Not revealed │
│                    │                │
│                    │ 5/6 submitted  │
│                    │                │
│                    │ ┌────────────┐ │
│                    │ │ [Submit]   │ │ ← CTA button
│                    │ └────────────┘ │
│                    │                │
│                    │ ─── PLAYLIST ───│
│                    │                │
│                    │ ┌────────────┐ │ ← Spotify embed
│                    │ │ ▶️ Play All│ │   (if round complete)
│                    │ │ 6 songs    │ │
│                    │ └────────────┘ │
│                    │                │
├────────────────────┴────────────────┤
│ [@] [Type a message...]      [Send]│
└─────────────────────────────────────┘
```

**Annotations:**
- **Peek Panel Trigger:**
  - Swipe from right edge (or tap button in pinned message)
  - Overlays chat with semi-transparent backdrop
  - Chat remains visible but dimmed/disabled

- **Song List for Mentions:**
  - Shows all submissions with submitter names
  - Pre-reveal: "Not revealed" placeholder
  - Post-reveal: Song title + artist
  - Tap @name to insert mention in compose bar

- **Playlist Embed:**
  - Only visible after voting closes
  - Inline Spotify/YouTube player
  - "Play All" launches full playlist

- **Dismissal:**
  - Swipe right to close panel
  - Tap dimmed chat area
  - Auto-closes when user sends message

---

## 4. LONG-PRESS REACTION MENU

```
┌─────────────────────────────────────┐
│ ⟨  Family League Chat    ⋮ [Profile]│
├─────────────────────────────────────┤
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Dad                      10:32│   │
│ │ Just submitted! This one's   │   │
│ │ gonna take me back 🎸         │   │
│ └───────────────────────────────┘   │
│       ╔═══════════════════╗         │ ← Reaction picker
│       ║ ❤️ 👍 🔥 😂 😍 😮 +║         │   Appears above message
│       ╚═══════════════════╝         │   Tap emoji to react
│                                     │   + = more emoji picker
│     ┌───────────────────────────┐   │
│ 12:15│ OMG I found the PERFECT  │   │
│       │ song for this theme      │   │
│       └───────────────────────────┘ │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Mom                      12:18│   │
│ │ ┌──────────────────────────┐  │   │ ← Message being
│ │ │ Can't decide between two│  │   │   long-pressed
│ │ │ help me pick! 🤔         │  │   │   (highlighted bg)
│ │ └──────────────────────────┘  │   │
│ │                               │   │
│ │ ┌─────────────────────────────┐  │ ← Action menu
│ │ │ React                       │  │   Slides up from bottom
│ │ │ Reply in Thread             │  │
│ │ │ Copy Text                   │  │
│ │ │ Share Link                  │  │
│ │ └─────────────────────────────┘  │
│ └───────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│ [@] [Type a message...]      [Send]│
└─────────────────────────────────────┘
```

**Annotations:**
- **Long-Press Interaction:**
  1. User long-presses message bubble
  2. Quick reaction bar appears above message
  3. Action menu slides up from bottom
  4. Message highlights to show active target

- **Quick Reactions:**
  - 6 most common emojis always visible
  - + button opens full emoji picker
  - Tap outside to dismiss

- **Action Menu:**
  - React: Opens full emoji picker
  - Reply in Thread: Creates threaded conversation
  - Copy Text: Clipboard action
  - Share Link: Deep link to specific message

---

## 5. COMPOSE BAR WITH @ MENTIONS

```
┌─────────────────────────────────────┐
│ [Previous messages...]              │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Dad                      14:47│   │
│ │ SARAH NO 😭😭😭                 │   │
│ └───────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │ ← @ Picker (active)
│ │ Mention:                        │ │   Appears above compose bar
│ │ ┌─────────────────────────────┐ │ │   when @ is typed
│ │ │ 👤 Dad                      │ │ │
│ │ │ 👤 Mom                      │ │ │
│ │ │ 👤 Sarah                    │ │ │
│ │ │ 👤 Alex                     │ │ │
│ │ │ ♫ Dad's Song: "Dream On"   │ │ │ ← Can also mention songs
│ │ │ ♫ Sarah's Song: "Never...  │ │ │   (post-reveal only)
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [@] [@Mom what do you think?  ] [↑]│ ← Compose bar
│  ^   ^                          ^  │
│  │   └─ Message input          │  │
│  │                         Send │  │
│  └─ @ button (opens picker)        │
└─────────────────────────────────────┘
```

**Annotations:**
- **@ Mention Picker:**
  - Triggered by tapping [@] button OR typing @
  - Shows family members + their songs (if revealed)
  - Fuzzy search as user types
  - Tap to insert mention
  - Mentioned user gets notification

- **Compose Bar States:**
  - Empty: Gray placeholder, @ button + microphone (future)
  - Typing: Send button (↑) replaces microphone
  - @ Active: Picker opens above, input stays focused
  - Rich content: Paste detection for YouTube/Spotify links

---

## 6. URGENCY STATES - Color Coding

### GREEN (Plenty of Time: >48 hours)
```
┌─────────────────────────────────────┐
│ 📌 Songs from your childhood ⏱️     │
│ Submit: 5d 12h · Vote: 7d 18h    ˅ │ ← Green tint background
└─────────────────────────────────────┘

SUBMISSION DEADLINE
████████████████████  5d 12h left    ← Green progress bar
Dec 31, 11:59 PM
```

### YELLOW (Getting Close: 24-48 hours)
```
┌─────────────────────────────────────┐
│ 📌 Songs from your childhood ⏱️     │
│ Submit: 36h · Vote: 3d 2h        ˅ │ ← Yellow tint background
└─────────────────────────────────────┘

SUBMISSION DEADLINE
████████████░░░░░░░░  36h left       ← Yellow/amber progress bar
Dec 31, 11:59 PM
```

### RED (Urgent: <24 hours)
```
┌─────────────────────────────────────┐
│ 📌 Songs from your childhood ⏱️     │
│ Submit: 4h 22m · Vote: 1d 8h     ˅ │ ← Red/pink tint background
└─────────────────────────────────────┘   Pulsing animation (subtle)

SUBMISSION DEADLINE
███░░░░░░░░░░░░░░░░░  4h 22m left    ← Red progress bar
Dec 31, 11:59 PM                          Glow effect
```

**Annotations:**
- **Color System:**
  - Green (#10B981): >48h, calm state
  - Yellow (#F59E0B): 24-48h, attention needed
  - Red (#EF4444): <24h, urgent action required

- **Visual Feedback:**
  - Progress bar color matches urgency
  - Pinned message background tinted subtly
  - Red state adds gentle pulse animation (1s interval)
  - Notification badge if <24h and user hasn't acted

---

## 7. PHASE-SPECIFIC VIEWS

### A. Submission Phase (Pre-Deadline)
```
┌─────────────────────────────────────┐
│ 📌 Round 12: Submission Phase    ✕ │
│ ╔═══════════════════════════════════╗
│ ║  Songs from your childhood  🎸   ║
│ ╚═══════════════════════════════════╝
│                                     │
│ SUBMISSION DEADLINE                 │
│ ████████████░░░░░░░  2d 4h left    │
│ Dec 31, 11:59 PM                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎵 [Submit Your Song]           │ │ ← Primary action
│ └─────────────────────────────────┘ │   Opens song picker modal
│                                     │
│ ✅ You've submitted!                │ ← Status (if completed)
│ "Dream On" by Aerosmith             │   Shows user's song
│                                     │
│ 5/6 family members submitted        │
│ Waiting for: Alex                   │ ← Social pressure indicator
└─────────────────────────────────────┘
```

### B. Voting Phase (Post-Submission)
```
┌─────────────────────────────────────┐
│ 📌 Round 12: Voting Phase        ✕ │
│ ╔═══════════════════════════════════╗
│ ║  Songs from your childhood  🎸   ║
│ ╚═══════════════════════════════════╝
│                                     │
│ VOTING DEADLINE                     │
│ ██████████████████░░  4d 10h left  │
│ Jan 2, 11:59 PM                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🗳️ [Vote Now (6 songs)]         │ │ ← Primary action
│ └─────────────────────────────────┘ │   Opens voting interface
│ ┌─────────────────────────────────┐ │
│ │ [Preview Playlist]              │ │ ← Secondary action
│ └─────────────────────────────────┘ │   Listen without revealing
│                                     │
│ ✅ You've voted! (Rank: 6 > 3 > 1) │ ← Status (if completed)
│                                     │
│ 4/6 family members voted            │
│ Waiting for: Sarah, Alex            │
└─────────────────────────────────────┘
```

### C. Results Phase (Post-Voting)
```
┌─────────────────────────────────────┐
│ 📌 Round 12: Results Revealed    ✕ │
│ ╔═══════════════════════════════════╗
│ ║  Songs from your childhood  🎸   ║
│ ╚═══════════════════════════════════╝
│                                     │
│ 🏆 WINNER: "Dream On" by Dad       │ ← Highlight winner
│    48 points · 5 votes              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [View Full Results]             │ │ ← Primary action
│ └─────────────────────────────────┘ │   Opens detailed scoreboard
│ ┌─────────────────────────────────┐ │
│ │ ▶️ [Play Round Playlist]        │ │ ← Secondary action
│ └─────────────────────────────────┘ │   Spotify/YouTube playlist
│                                     │
│ 💬 24 comments in this round        │ ← Discussion metrics
│ 🤖 [View AI Summary]                │
│                                     │
│ Next round starts in 2 days         │ ← Preview next round
└─────────────────────────────────────┘
```

**Annotations:**
- **Phase Detection:**
  - App automatically detects current phase
  - Pinned message adapts content + actions
  - Progress bars show/hide based on relevance

- **Status Indicators:**
  - ✅ Green checkmark = user completed action
  - Shows what user submitted/voted
  - Displays who's still pending

- **Results Highlights:**
  - Trophy emoji for winner
  - Point totals + vote counts
  - Link to AI-generated round summary

---

## 8. INLINE MEDIA EMBEDS

### YouTube Link
```
┌───────────────────────────────────┐
│ Sarah                       14:45│
│ ┌───────────────────────────────┐│
│ │ ╔═══════════════════════════╗ ││ ← Thumbnail image
│ │ ║                           ║ ││   with play button overlay
│ │ ║         ▶️                ║ ││
│ │ ║    [Thumbnail Image]      ║ ││
│ │ ╚═══════════════════════════╝ ││
│ │ Never Gonna Give You Up       ││ ← Song title
│ │ Rick Astley · 3:32            ││   Artist · duration
│ │ YouTube                       ││   Platform badge
│ └───────────────────────────────┘│
│ Found this gem! 😂                │
│                      🤣 3  😍 1   │
└───────────────────────────────────┘
```

### Spotify Link
```
┌───────────────────────────────────┐
│ Dad                         16:20│
│ ┌───────────────────────────────┐│
│ │ ♫ Dream On                    ││ ← Compact Spotify card
│ │   Aerosmith · 1973            ││
│ │   [▶️ Preview] [Open Spotify] ││ ← Action buttons
│ └───────────────────────────────┘│
│ This is my submission!            │
│                      ❤️ 4  🔥 2  │
└───────────────────────────────────┘
```

### Music League Playlist (Post-Round)
```
┌───────────────────────────────────┐
│ System                      18:00│
│ ┌───────────────────────────────┐│
│ │ 🎵 Round 12 Playlist          ││ ← Auto-posted by bot
│ │ Songs from your childhood     ││   when round completes
│ │ 6 songs · 22 min total        ││
│ │                               ││
│ │ [▶️ Play on Spotify]          ││
│ └───────────────────────────────┘│
│ Voting has ended! Tap to listen   │
└───────────────────────────────────┘
```

**Annotations:**
- **Link Detection:**
  - Auto-detects YouTube/Spotify/Music League URLs
  - Fetches metadata (title, artist, thumbnail)
  - Renders rich preview card

- **Playback Options:**
  - Preview: 30s clip in-app (if supported)
  - Full: Deep link to Spotify/YouTube app
  - Fallback to web player if app not installed

- **System Messages:**
  - Bot posts playlist when round ends
  - Includes AI summary link
  - Styled differently (center-aligned, subtle bg)

---

## 9. NOTIFICATION INDICATORS

### Unread Badge on Bottom Nav
```
┌─────────────────────────────────────┐
│                                     │
│          [Chat Content]             │
│                                     │
├─────────────────────────────────────┤
│  🏠      💬 (3)    📊      👤      │ ← Bottom navigation
│ Home    Chat    History  Profile   │
│         └─ Unread count badge      │
└─────────────────────────────────────┘
```

### In-Chat Notification Banner
```
┌─────────────────────────────────────┐
│ ⟨  Family League Chat    ⋮ [Profile]│
├─────────────────────────────────────┤
│ ╔═══════════════════════════════════╗
│ ║ ⏰ URGENT: Voting ends in 2 hours║ ← Notification banner
│ ║ [Vote Now]              [Dismiss]║   Appears above pinned msg
│ ╚═══════════════════════════════════╝   Red background (urgent)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📌 Songs from your childhood ⏱️ │ │
│ │ Submit: Done · Vote: 2h      ˅  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Chat messages...]                  │
└─────────────────────────────────────┘
```

### @ Mention Highlight
```
┌───────────────────────────────────┐
│ Dad                         12:20│
│ Hey @You what did you think of   │ ← @You highlighted
│ this round's theme?               │   (bold, accent color bg)
│                                   │   User receives push notif
└───────────────────────────────────┘
```

**Annotations:**
- **Badge System:**
  - Unread message count on Chat tab
  - Red dot for urgent deadline (<24h)
  - Push notifications for mentions + deadlines

- **Banner Notifications:**
  - Dismissible temporary alerts
  - Color-coded by urgency (yellow=reminder, red=urgent)
  - Action buttons for quick response
  - Auto-dismiss after user acts

- **Mention Highlighting:**
  - @username rendered with accent background
  - Scrolls to mention when tapped from notification
  - Special styling for @everyone mentions

---

## 10. ACCESSIBILITY & RESPONSIVE NOTES

### Text Scaling Support
```
┌─────────────────────────────────────┐
│ Settings > Accessibility            │
├─────────────────────────────────────┤
│                                     │
│ Text Size:  A  [ ●───── ]  A       │ ← Slider control
│                                     │   (small to large)
│ All UI text scales proportionally   │
│ Message bubbles expand vertically   │
│ Pinned message height adjusts       │
│                                     │
│ ✓ High Contrast Mode                │
│   (darker borders, bolder text)     │
│                                     │
│ ✓ Reduce Motion                     │
│   (disables animations)             │
└─────────────────────────────────────┘
```

### One-Handed Operation
```
┌─────────────────────────────────────┐
│                                     │
│  Top bar always accessible via:     │
│  - Tap status bar to scroll to top  │
│  - Swipe down to reveal search      │
│                                     │
│  Pinned message:                    │
│  - Sticky position (always visible) │
│  - Thumb-reachable tap zone         │
│                                     │
│  Compose bar:                       │
│  - Bottom 20% of screen             │
│  - @ button on left (left-hand)     │
│  - Send button on right (right-hand)│
│                                     │
│  Peek panel:                        │
│  - Right edge swipe (natural thumb) │
│  - Also accessible via pinned msg   │
└─────────────────────────────────────┘
```

### Screen Reader Support
- All buttons have semantic labels
- Progress bars announce "X hours remaining"
- Message timestamps read as "Sent by Dad at 10:32 AM"
- Reactions read as "Reacted with heart by 3 people"
- Pinned message announces phase + urgency
- @ mentions read as "Mention: [Name]"

### Dark Mode
```
LIGHT MODE COLORS:
- Background: #FFFFFF
- Bubbles (received): #F3F4F6
- Bubbles (sent): #3B82F6
- Pinned message: rgba(59, 130, 246, 0.1)
- Text: #111827

DARK MODE COLORS:
- Background: #1F2937
- Bubbles (received): #374151
- Bubbles (sent): #2563EB
- Pinned message: rgba(37, 99, 235, 0.2)
- Text: #F9FAFB

Urgency colors adapt (red/yellow/green darker in dark mode)
```

---

## 11. INTERACTION PATTERNS SUMMARY

| Gesture | Action | Result |
|---------|--------|--------|
| **Tap** pinned message (collapsed) | Expand round details | Shows full info inline |
| **Tap** ✕ on pinned message | Collapse round details | Returns to single line |
| **Swipe left** on pinned message | Dismiss/minimize | Hides until next round or manual restore |
| **Swipe right** from edge | Open peek panel | Overlay with song list + playlist |
| **Long-press** message bubble | Reaction menu | Quick emoji bar + action menu |
| **Tap** reaction emoji | Add reaction | Emoji appears below message |
| **Tap** [@] button | Open mention picker | Shows family + songs to mention |
| **Type** @ in message | Auto-open picker | Fuzzy search as typing continues |
| **Tap** YouTube/Spotify embed | Play/preview | In-app player or deep link |
| **Scroll** chat | Normal scrolling | Pinned message stays sticky |
| **Pull down** at top | Refresh chat | Fetch new messages |
| **Swipe up** on action sheet | Dismiss menu | Returns to chat |

---

## 12. COMPONENT HIERARCHY

```
ChatPage
├── TopBar
│   ├── BackButton
│   ├── LeagueTitle
│   └── ProfileButton (with notification badge)
│
├── PinnedMessage (sticky)
│   ├── CollapsedState
│   │   ├── ThemeTitle
│   │   ├── DualCountdown (inline)
│   │   └── ExpandChevron
│   │
│   └── ExpandedState
│       ├── CloseButton
│       ├── ThemeBanner (image/gradient)
│       ├── SubmissionDeadline (progress bar + text)
│       ├── VotingDeadline (progress bar + text)
│       ├── PrimaryActionButton (context-aware)
│       ├── SecondaryActionButton (optional)
│       └── StatusIndicator (text)
│
├── MessageList (scrollable)
│   ├── MessageBubble (repeating)
│   │   ├── SenderName
│   │   ├── Timestamp
│   │   ├── MessageContent
│   │   │   ├── TextContent (with @ mentions)
│   │   │   └── MediaEmbed (YouTube/Spotify/etc)
│   │   ├── ReactionBar
│   │   └── LongPressMenu
│   │       ├── QuickReactionBar
│   │       └── ActionSheet
│   │
│   └── SystemMessage (bot posts)
│       ├── Icon
│       ├── Content
│       └── CTAButton (optional)
│
├── PeekPanel (overlay)
│   ├── Header ("Round Details")
│   ├── ThemeBanner (mini)
│   ├── MiniProgressBars (dual)
│   ├── SongList
│   │   └── SongItem (with @ tap action)
│   ├── PlaylistEmbed (if available)
│   └── CTAButton
│
├── ComposeBar (fixed bottom)
│   ├── MentionButton (@)
│   ├── TextInput
│   ├── SendButton
│   └── MentionPicker (popover)
│       ├── FamilyMemberList
│       └── SongList (if revealed)
│
└── NotificationBanner (conditional)
    ├── UrgencyIcon
    ├── Message
    ├── CTAButton
    └── DismissButton
```

---

## DESIGN RATIONALE

### Why Chat-First?
1. **Natural Conversation Flow:** Music discussion is inherently social. Chat puts conversation first, with round mechanics as supporting context.
2. **Reduced Cognitive Load:** Users don't context-switch between "league view" and "chat view." Everything happens in one continuous thread.
3. **Mobile-Native:** Chat UIs are universally understood. No learning curve.
4. **Engagement:** Real-time messaging encourages frequent check-ins and spontaneous reactions.

### Why Pinned Message?
1. **Contextual Awareness:** Round info is always visible but never intrusive.
2. **Progressive Disclosure:** Collapsed state shows essentials (theme + deadlines). Expanded state reveals full details only when needed.
3. **User Control:** Can be dismissed if user wants pure chat experience.
4. **Sticky Position:** Doesn't scroll away, unlike traditional headers.

### Why Peek Panel?
1. **Quick Reference:** No need to leave chat to check who submitted what.
2. **Mention Efficiency:** One swipe to see everyone's songs and mention them.
3. **Playlist Access:** Listen to completed rounds without navigating away.
4. **Optional Feature:** Power users discover it; casual users can ignore it.

### Why Dual Progress Bars?
1. **Two Distinct Deadlines:** Submission and voting are separate actions with different urgencies.
2. **Visual Clarity:** Horizontal bars are immediately scannable (unlike numeric countdowns alone).
3. **Color-Coded Urgency:** Green/yellow/red instantly communicates time pressure.
4. **Percentage Fill:** Intuitive "fuel gauge" metaphor for time remaining.

### Why Inline Embeds?
1. **Seamless Discovery:** Songs become part of the conversation, not separate entities.
2. **Reduced Friction:** Tap to play vs. copy-paste-open-app flow.
3. **Visual Richness:** Thumbnails and album art make chat more engaging.
4. **Platform Parity:** Matches expectations from WhatsApp, Telegram, Discord.

---

## IMPLEMENTATION NOTES

### Data Requirements
- Real-time message sync (Supabase Realtime or similar)
- Round status polling (or webhook triggers)
- User presence indicators (optional "typing..." state)
- Media metadata fetching (YouTube/Spotify APIs)
- Notification tokens (push + in-app)

### Performance Considerations
- Virtual scrolling for long message threads (>100 messages)
- Lazy-load media embeds (thumbnails only until tapped)
- Debounced @ mention search (<300ms)
- Optimistic UI updates (send message instantly, sync later)
- Progressive image loading (blur-up technique)

### Accessibility Checklist
- [ ] Minimum 44x44pt tap targets
- [ ] 4.5:1 text contrast ratio (WCAG AA)
- [ ] Focus indicators for keyboard navigation
- [ ] Screen reader labels for all interactive elements
- [ ] Reduced motion respects OS preference
- [ ] Text scaling supports up to 200%
- [ ] Color is not sole indicator (use icons + text)

### Responsive Breakpoints
- **Small phones (320-375px):** Single-column, compact bubbles
- **Standard phones (375-428px):** Default layout (as shown)
- **Large phones (428-480px):** Wider bubbles, more padding
- **Tablets (768px+):** Two-column (chat + peek panel always visible)

### Future Enhancements
- Voice messages (long-press microphone icon)
- Message threads (tap "Reply" to create sub-conversation)
- GIF/sticker reactions (beyond emoji)
- Message search (swipe down at top)
- Pin important messages (admin only)
- Chat themes (color customization)
- Read receipts (optional per user)

---

## FILE REFERENCES

**Key Documents:**
- `/home/mmariani/Projects/ml_companion/docs/requirements/feature_specification.md`
- `/home/mmariani/Projects/ml_companion/docs/design/ui_specification.md`
- `/home/mmariani/Projects/ml_companion/docs/planning/project_plan.md`

**Related Code:**
- `/home/mmariani/Projects/ml_companion/web/src/pages/ChatPage.tsx`
- `/home/mmariani/Projects/ml_companion/web/src/components/TopBar.tsx`
- `/home/mmariani/Projects/ml_companion/web/src/components/BottomNav.tsx`

---

**Created:** 2025-12-30
**Version:** 1.0 - Initial chat-first wireframe with pinned message + peek panel design
**Status:** Ready for design review and prototype implementation
