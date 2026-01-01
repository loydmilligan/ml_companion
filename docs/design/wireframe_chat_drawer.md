# Chat-First UI Wireframe: Swipe-Up Drawer Design

## Design Philosophy

**Primary Goal**: Make the app feel like iMessage/WhatsApp with Music League context accessible on-demand.

**Key Principles**:
- Chat is the primary interface (full screen by default)
- Round context accessible via bottom drawer (progressive disclosure)
- Minimal UI chrome in collapsed state
- Smooth transitions between drawer states
- Deadline urgency communicated visually without being intrusive

---

## State 1: Collapsed Drawer (Default Chat View)

```
┌─────────────────────────────────────┐
│ ← Family League        👤 ⚙         │ ← Top bar (fixed)
├─────────────────────────────────────┤
│                                     │
│  Mom                    2:34 PM     │
│  ┌─────────────────────────────┐   │
│  │ Love this theme! Going      │   │
│  │ deep cuts 🎵                │   │
│  └─────────────────────────────┘   │
│                                     │
│                You      2:35 PM     │
│   ┌─────────────────────────────┐  │
│   │ Same! Just submitted        │  │
│   │ @Sweet Child O' Mine        │  │ ← @ mention of song
│   └─────────────────────────────┘  │
│                                     │
│  Dad                    2:40 PM     │
│  ┌─────────────────────────────┐   │
│  │ Voting deadline is tonight   │   │
│  │ right?                      │   │
│  └─────────────────────────────┘   │
│                                     │
│                You      2:41 PM     │
│   ┌─────────────────────────────┐  │
│   │ Yeah, 11:59 PM. I still     │  │
│   │ need to listen to a few     │  │
│   └─────────────────────────────┘  │
│                                     │ ← Chat scrolls freely
│                                     │
│                                     │
│ [scroll indicator if more above]   │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Type a message...        📎  🎤│ │ ← Compose bar
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ═══════════════════════════════════ │ ← Drawer handle (visual grab bar)
│ 🎵 "Summer Anthems" ⏰ 3h 24m      │ ← Collapsed drawer header
│                              ↑     │    Shows: theme + deadline countdown
├─────────────────────────────────────┤
│ 💬    📜    👤    ⚙                │ ← Bottom nav (fixed)
│ Chat  Hist  Prof  Settings          │
└─────────────────────────────────────┘
```

### Annotations - Collapsed State

**Layout**:
- **Top Bar**: League name, back button, profile/settings icons
- **Chat Area**: Full height, standard message bubbles
- **Compose Bar**: Fixed position above drawer
- **Drawer Handle**: Thin bar with visual affordance (3 horizontal lines)
- **Drawer Header**: Single line showing theme title + countdown
- **Bottom Nav**: 4 tabs, chat is active

**Interactions**:
- Swipe up on drawer handle or header → expands to partial
- Tap anywhere in chat → focuses chat (default behavior)
- Pull to refresh → refreshes messages
- Scroll chat → independent of drawer state

**Visual Hierarchy**:
- Chat messages: Primary focus
- Drawer header: Secondary, subtle presence
- Deadline countdown: Colored based on urgency
  - Green: > 24 hours
  - Yellow: 6-24 hours
  - Red + pulse animation: < 6 hours

---

## State 2: Partial Drawer (Quick Context View)

```
┌─────────────────────────────────────┐
│ ← Family League        👤 ⚙         │
├─────────────────────────────────────┤
│                                     │
│  Mom                    2:34 PM     │
│  ┌─────────────────────────────┐   │
│  │ Love this theme! Going      │   │
│  │ deep cuts 🎵                │   │
│  └─────────────────────────────┘   │
│                                     │ ← Chat area (dimmed 10%)
│                You      2:35 PM     │
│   ┌─────────────────────────────┐  │
│   │ Same! Just submitted        │  │ ← Chat still scrollable
│   │ @Sweet Child O' Mine        │  │
│   └─────────────────────────────┘  │
│                                     │
│ [older messages scroll above]      │
│                                     │
├─────────────────────────────────────┤
│ ████████████████ SCRIM ████████████ │ ← Scrim overlay (slight dim)
├─────────────────────────────────────┤
│                                     │
│ ═══════════════════════════════════ │ ← Drawer handle
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🎨 Banner Image Here           │ │ ← Theme banner (if available)
│ │  [Vibrant summer beach scene]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🎵 Summer Anthems                  │ ← Theme title (large)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  SUBMIT ────────────┐  VOTE     │ │ ← Dual-needle deadline gauge
│ │    ↓                │    ↓      │ │
│ │  ┌──────────────────┴────────┐  │ │
│ │  │ ░░░░●═══════════════════○ │  │ │ ← ● = submit (you) ○ = vote (now)
│ │  │ E              1/2        F │  │    E=start F=deadline
│ │  └────────────────────────────┘  │ │
│ │                                  │ │
│ │  Submit: ✓ Done (Tue 2:15 PM)   │ │ ← Status indicators
│ │  Voting: 3h 24m left            │ │
│ │          ⚠ Closes tonight!       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Tap for full round details      ↑  │ ← Hint to expand further
├─────────────────────────────────────┤
│ 💬    📜    👤    ⚙                │
│ Chat  Hist  Prof  Settings          │
└─────────────────────────────────────┘
```

### Annotations - Partial State

**Layout**:
- **Drawer Height**: ~40% of screen (theme banner + gauge + deadlines)
- **Chat Scrim**: 10% opacity dark overlay to focus attention on drawer
- **Gauge Visualization**: Horizontal dual-needle design
  - Left needle (●): Your submission time (filled in)
  - Right needle (○): Current time for voting deadline
  - Bar fills from left (E=Empty=start) to right (F=Full=deadline)
  - Color zones: Green → Yellow → Red as deadline approaches

**Interactions**:
- Swipe down → collapses to default
- Swipe up → expands to full
- Tap "Tap for full round details" → expands to full
- Tap scrim (chat area) → collapses drawer
- Chat still scrollable but dimmed

**Deadline Gauge Behavior**:
- **Normal (> 6 hours)**: Static gauge, smooth animation
- **Urgent (< 6 hours)**:
  - Red zone activates
  - Subtle pulse animation on needle
  - "⚠ Closes tonight!" warning appears
- **Critical (< 1 hour)**:
  - Shake/vibrate animation on gauge
  - Stronger red highlight
  - "⚠ CLOSING SOON!" in red

**Visual Hierarchy**:
1. Deadline gauge (primary focus)
2. Theme title and banner
3. Status text
4. Dimmed chat in background

---

## State 3: Full Drawer (Complete Round Context)

```
┌─────────────────────────────────────┐
│ ← Family League        👤 ⚙         │
├─────────────────────────────────────┤
│                                     │
│ [Chat barely visible, heavily dim]  │ ← Chat area (dimmed 30%)
│                                     │
│ ████████████████ SCRIM ████████████ │
├─────────────────────────────────────┤
│ ═══════════════════════════════════ │ ← Drawer handle
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🎨 Banner Image                │ │
│ │  [Vibrant summer beach scene]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🎵 Summer Anthems                  │
│ "Songs that defined your summer"    │ ← Theme description
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  SUBMIT ────────────┐  VOTE     │ │
│ │    ↓                │    ↓      │ │
│ │  ┌──────────────────┴────────┐  │ │
│ │  │ ░░░░●═══════════════════○ │  │ │
│ │  │ E              1/2        F │  │
│ │  └────────────────────────────┘  │ │
│ │                                  │ │
│ │  Submit: ✓ Done (Tue 2:15 PM)   │ │
│ │  Voting: 3h 24m left            │ │
│ │          ⚠ Closes tonight!       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │ ← Song list section
│ │ 📋 ROUND SONGS (8)          ▼   │ │ ← Collapsible header
│ ├─────────────────────────────────┤ │
│ │ 🎵 Sweet Child O' Mine          │ │ ← Song items
│ │    Guns N' Roses                │ │
│ │    👤 You                        │ │
│ │                                  │ │
│ │ 🎵 Don't Stop Believin'         │ │
│ │    Journey                       │ │
│ │    👤 Mom                        │ │
│ │                                  │ │
│ │ 🎵 Mr. Brightside               │ │
│ │    The Killers                   │ │
│ │    👤 Dad                        │ │
│ │                                  │ │
│ │ 🎵 Dancing Queen                │ │
│ │    ABBA                          │ │
│ │    👤 Sister                     │ │
│ │                                  │ │
│ │ [scroll for 4 more songs...]    │ │ ← Scroll indicator
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👥 PARTICIPANTS (4/4 submitted) │ │ ← Participation summary
│ │ ✓ You  ✓ Mom  ✓ Dad  ✓ Sister  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Swipe down to return to chat    ↓  │ ← Affordance hint
├─────────────────────────────────────┤
│ 💬    📜    👤    ⚙                │
│ Chat  Hist  Prof  Settings          │
└─────────────────────────────────────┘
```

### Annotations - Full State

**Layout**:
- **Drawer Height**: ~85% of screen (nearly full-screen modal)
- **Chat Scrim**: 30% opacity - chat is background context only
- **Drawer Content**:
  1. Banner image (if available)
  2. Theme title + description
  3. Deadline gauge widget
  4. Song list (scrollable if > 5 songs)
  5. Participant status
- **Bottom Nav**: Remains visible and functional

**Interactions**:
- Swipe down anywhere on drawer → collapses to partial
- Tap scrim (chat area) → collapses to collapsed
- Tap song item → copies song reference for @ mention
- Pull down from top → progressive collapse (follows finger)
- Bottom nav still works (can switch tabs with drawer open)

**Song List Features**:
- **Tap to Copy for @ Mention**:
  - Tap any song → auto-inserts "@Song Name - Artist" into compose bar
  - Visual feedback: brief highlight animation on tap
  - Drawer auto-collapses after selection
- **Visual Indicators**:
  - Your song: Highlighted background or badge
  - Submission status: Checkmark next to submitter name
- **Scrollable**: If > 5 songs, list scrolls independently

**Participation Summary**:
- Shows who has/hasn't submitted
- Visual: Checkmarks for submitted, empty circle for pending
- Tap participant → @mention them in chat

---

## Special Interaction: @ Mention Autocomplete

### When typing "@" in compose bar (any drawer state)

```
┌─────────────────────────────────────┐
│ ← Family League        👤 ⚙         │
├─────────────────────────────────────┤
│                                     │
│  [Chat messages above...]           │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ ┌───────────────────────────────┐   │ ← Autocomplete dropdown
│ │ 🔍 @sw                        │   │    Appears above compose
│ ├───────────────────────────────┤   │
│ │ 🎵 @Sweet Child O' Mine       │   │ ← Song matches
│ │    Guns N' Roses              │   │
│ │                                │   │
│ │ 👤 @Sister                     │   │ ← People matches
│ └───────────────────────────────┘   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Check out @sw▊      📎  🎤      │ │ ← Active typing
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ═══════════════════════════════════ │
│ 🎵 "Summer Anthems" ⏰ 3h 24m      │
├─────────────────────────────────────┤
│ 💬    📜    👤    ⚙                │
└─────────────────────────────────────┘
```

### Autocomplete Behavior

**Trigger**: Type "@" anywhere in message

**Search Sources** (in priority order):
1. Songs in current round (title + artist)
2. Family members / league participants
3. Previous song mentions in chat history

**Display**:
- Max 5 suggestions shown
- Songs: 🎵 icon + "Title - Artist" + submitter badge
- People: 👤 icon + display name
- Highlight matching text

**Selection**:
- Tap suggestion → inserts full reference
- Format: "@Title - Artist" or "@Person Name"
- Cursor moves to end of mention
- Autocomplete closes

**Dismiss**:
- Tap outside dropdown
- Delete "@" character
- Press ESC (if keyboard available)

---

## Responsive Breakpoints

### Small Phone (320px-375px width)
- Collapse drawer header to icon + timer only
- Gauge in partial state: vertical orientation
- Song list: hide artist, show on tap

### Standard Phone (375px-428px width)
- All features as shown in wireframes above
- Optimal spacing and touch targets

### Tablet / Large Phone (428px+ width)
- Side-by-side layout option (chat left, drawer right)
- Drawer becomes fixed right panel instead of bottom sheet
- No need to collapse/expand on larger screens

---

## Animation & Transitions

### Drawer State Transitions
- **Collapsed ↔ Partial**: 300ms ease-out
- **Partial ↔ Full**: 400ms ease-out
- **Collapsed ↔ Full**: 500ms ease-out (rare, user holds swipe)

### Drawer Behavior Details
- **Spring Physics**: Drawer snaps to discrete states
- **Threshold**:
  - Swipe up 20% → next state
  - Swipe down 20% → previous state
  - Otherwise → returns to current state
- **Velocity Sensitivity**: Fast swipe = skip to next state even if < 20%

### Deadline Gauge Animations
- **Normal**: Smooth 1s ease-in-out on mount
- **Urgent (< 6h)**:
  - Pulse: 2s infinite, subtle scale 1.0 → 1.02
  - Warning icon fade in
- **Critical (< 1h)**:
  - Shake: 0.5s repeat 3x, then pause 5s
  - Red glow effect
  - Native vibration on state change (if permissions granted)

### @ Mention Autocomplete
- **Appear**: Fade + slide up 200ms
- **Disappear**: Fade out 150ms
- **Selection**: Highlight flash 100ms

---

## Accessibility Considerations

### Screen Reader Support
- **Drawer States**: Announce state changes
  - "Round information collapsed"
  - "Round information showing deadlines"
  - "Round information expanded, showing all songs"
- **Deadline Gauge**:
  - Alt text: "Submission deadline in 3 hours 24 minutes, voting closes tonight at 11:59 PM"
  - Urgent: Announce "Warning: voting closes soon"
- **Song List**: Each item readable as "Sweet Child O' Mine by Guns N' Roses, submitted by You"

### Touch Targets
- Minimum 44x44pt for all interactive elements
- Drawer handle: 60pt tall for easy grabbing
- Song list items: 56pt tall

### Color & Contrast
- Deadline colors meet WCAG AA
  - Green: #22C55E on white = 3.4:1
  - Yellow: #F59E0B on white = 2.8:1 (supplement with icon)
  - Red: #EF4444 on white = 3.8:1
- Message bubbles: 4.5:1 minimum
- Scrim overlay: Doesn't reduce chat contrast below 3:1

### Reduced Motion
- If prefers-reduced-motion:
  - Drawer transitions: 150ms linear instead of spring
  - No shake animation on gauge
  - No pulse effects
  - Static icons instead of animated

### Keyboard Navigation (for web/desktop)
- Tab through interactive elements
- Arrow keys to scroll chat/drawer independently
- ESC to collapse drawer
- Enter/Space to expand drawer from handle

---

## Technical Implementation Notes

### Component Architecture
```
<ChatPage>
  <TopBar />
  <ChatThread scrimOpacity={drawerState} />
  <ComposeBar onMention={showAutocomplete} />
  <BottomDrawer state={drawerState}>
    <DrawerHandle />
    <DrawerContent>
      {state === 'collapsed' && <CollapsedHeader />}
      {state === 'partial' && <PartialView />}
      {state === 'full' && <FullRoundView />}
    </DrawerContent>
  </BottomDrawer>
  <BottomNav />
</ChatPage>
```

### State Management
```typescript
type DrawerState = 'collapsed' | 'partial' | 'full';
const [drawerState, setDrawerState] = useState<DrawerState>('collapsed');
const [drawerHeight, setDrawerHeight] = useState(60); // px

// Discrete heights for each state
const DRAWER_HEIGHTS = {
  collapsed: 60,
  partial: windowHeight * 0.4,
  full: windowHeight * 0.85
};
```

### Gesture Handling
- Use `react-spring` or `framer-motion` for physics
- Track vertical pan gesture
- Calculate velocity for fling detection
- Snap to nearest state based on threshold + velocity

### Performance Considerations
- Virtualize song list if > 20 songs
- Debounce @ mention autocomplete search (150ms)
- Lazy load banner images
- Use CSS transforms for drawer animation (GPU accelerated)
- Memoize chat messages during drawer transitions

---

## User Testing Scenarios

### Scenario 1: New User First Time
**Goal**: Understand drawer without tutorial

**Expected Flow**:
1. User sees chat (familiar pattern)
2. Notices theme title at bottom
3. Taps or swipes up → discovers context
4. Reads deadline gauge → understands urgency
5. Swipes down → returns to chat

**Success Criteria**: < 10 seconds to discover drawer

### Scenario 2: Urgent Deadline
**Goal**: Notice deadline without interrupting chat

**Expected Flow**:
1. User chatting normally
2. Deadline hits < 6 hour threshold
3. Gauge pulses in collapsed header (peripheral vision)
4. User glances at countdown → sees urgency
5. Opens drawer to confirm → votes
6. Returns to chat

**Success Criteria**: Notice urgency without modal/notification

### Scenario 3: @ Mention a Song
**Goal**: Reference specific song in discussion

**Expected Flow**:
1. User typing message
2. Types "@" → autocomplete appears
3. Types partial song name → filters list
4. Taps suggestion → inserts reference
5. Completes message → sends

**Alternative Flow**:
1. User wants to mention song
2. Opens drawer to full
3. Taps song in list → auto-inserts in compose
4. Drawer auto-collapses
5. Completes message → sends

**Success Criteria**: < 5 taps to mention any song

---

## Design Rationale

### Why Bottom Drawer vs Other Patterns?

**Considered Alternatives**:
1. **Top Header**: Loses precious vertical space, pushes chat down
2. **Swipe Between Views**: Hides chat when viewing round info
3. **Floating Action Button**: Requires modal, interrupts chat flow
4. **Split Screen**: Cramped on mobile, neither view gets priority

**Bottom Drawer Advantages**:
- Chat remains primary view (matches mental model)
- Context available without leaving chat
- Progressive disclosure reduces cognitive load
- Familiar pattern (Maps, Music apps use it)
- Maintains spatial consistency (drawer always at bottom)

### Why Dual-Needle Gauge?

**Design Goals**:
- Show two deadlines at once (submit + vote)
- Communicate urgency without numbers
- Familiar metaphor (fuel gauge, speedometer)
- Small footprint in collapsed state

**Alternative Considered**:
- Two separate progress bars → takes more space
- Countdown timers only → hard to judge proportions
- Calendar view → too detailed for quick glance

**Gauge Advantages**:
- Single glanceable widget
- Spatial relationship between deadlines
- Color zones = instant urgency feedback
- Animation attracts attention when needed

### Why @ Mention Autocomplete?

**User Need**: Discuss specific songs without copying/pasting

**Design Decision**: Two paths to mention
1. Type-ahead (power users, keyboard flow)
2. Tap-to-insert from drawer (discoverable, visual)

**Why Both**:
- Type-ahead: Fast for users who know what they want
- Drawer tap: Browsable, no memorization needed
- Redundancy improves accessibility

---

## Next Steps for Implementation

### Phase 1: Core Drawer Mechanics
- [ ] Bottom drawer component with spring physics
- [ ] Three state transitions (collapsed/partial/full)
- [ ] Gesture handling (swipe, tap, fling)
- [ ] Scrim overlay with opacity based on state

### Phase 2: Drawer Content
- [ ] Collapsed header (theme + countdown)
- [ ] Partial view (banner + gauge + deadlines)
- [ ] Full view (+ song list + participants)
- [ ] Deadline gauge component with dual needles

### Phase 3: Chat Integration
- [ ] Compose bar positioning above drawer
- [ ] @ mention autocomplete dropdown
- [ ] Song reference formatting in messages
- [ ] Tap-to-insert from drawer song list

### Phase 4: Polish & Accessibility
- [ ] Deadline urgency animations (pulse, shake)
- [ ] Screen reader announcements
- [ ] Reduced motion preferences
- [ ] Keyboard navigation
- [ ] Haptic feedback (mobile)

### Phase 5: Testing & Iteration
- [ ] User testing with 5 family groups
- [ ] A/B test gauge design variations
- [ ] Performance profiling
- [ ] Cross-device testing
- [ ] Accessibility audit

---

## Open Questions for Product Team

1. **Drawer Persistence**: Should drawer state persist across sessions or reset to collapsed?
2. **Notification Integration**: How do push notifications interact with drawer states?
3. **Multi-Round Handling**: If user in multiple leagues, how to switch context?
4. **Offline Behavior**: What happens to gauge/deadlines when offline?
5. **Admin Features**: Do league creators get additional drawer content?

---

*Wireframe Version: 1.0*
*Last Updated: 2025-12-30*
*Designer: Claude (UI/UX Specialist)*
