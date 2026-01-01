# Chat-First UI Wireframes
## Mobile Music League Companion App

**Design Philosophy**: Chat dominates. Round info floats unobtrusively until needed.

---

## State 1: Normal Chat View (No Urgency)
### Deadline > 6 hours remaining

```
┌─────────────────────────────────────┐
│ [≡]  Family League Chat    [•••]   │ ← Top bar (minimal)
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────┐           │
│  │ Sarah M.        10:24│           │
│  │ OMG this theme!! 🔥  │           │
│  │                      │           │
│  │ [👍 2] [🔥 1]        │           │
│  └──────────────────────┘           │
│                    ┌────────────┐   │ ← Floating round card
│           ┌────────┤ ⏱ 2d 14h  │   │   (compact, top-right)
│           │ [🎵]   │  Submit    │   │
│           │ Retro  └────────────┘   │
│           │ Vibes                   │
│           └────────────────────────┐│
│  ┌──────────────────────┐          ││ ← Tap to expand
│  │ Dad             10:26│          ││
│  │ Already submitted my │          ││
│  │ secret weapon 😎     │          ││
│  │                      │          ││
│  │ [😎 1] [+]           │          ││
│  └──────────────────────┘          ││
│                                    ││
│  ┌──────────────────────┐          ││
│  │ Mom             10:27│          ││
│  │ Can't decide between │          ││
│  │ two songs...         │          ││
│  └──────────────────────┘          ││
│                                     │
│                                     │
│  ┌──────────────────────┐           │
│  │ You             10:28│           │
│  │ @Mom what vibe are   │           │
│  │ you going for?       │           │
│  │                      │           │
│  │ [+]                  │           │
│  └──────────────────────┘           │
│                                     │
│ ⋮ (scroll for history)              │
│                                     │
├─────────────────────────────────────┤
│ [😊] Type a message...      [Send] │ ← Always-visible compose
└─────────────────────────────────────┘
```

**Annotations**:
- **Floating Card** (top-right):
  - Circular timer shows countdown (green ring = healthy time)
  - Small theme thumbnail (🎵 icon placeholder)
  - Theme name truncated if needed
  - Semi-transparent background
  - Subtle drop shadow for depth

- **Message Bubbles**:
  - Author + timestamp
  - Reaction row (existing + add button)
  - Left-aligned for others, right-aligned for self

- **Compose Bar**:
  - Emoji picker button
  - Text input
  - Send button (activates when text present)

---

## State 2: Urgent Chat View (High Alert)
### Deadline < 6 hours remaining

```
┌─────────────────────────────────────┐
│ [≡]  Family League Chat    [•••]   │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────┐           │
│  │ Sarah M.        10:24│           │
│  │ OMG this theme!! 🔥  │           │
│  │ [👍 2] [🔥 1]        │           │
│  └──────────────────────┘           │
│                    ╔════════════╗   │ ← URGENT floating card
│           ┌────────║ ⏱ 3h 42m  ║   │   (pulsing red glow)
│           │ [🎵]   ║  Submit ⚠ ║   │
│           │ Retro  ╚════════════╝   │
│           │ Vibes     ▓▓▓▓         │ ← Pulsing animation
│           └────────────────────────┐│   (border pulses)
│  ┌──────────────────────┐          ││
│  │ You             14:15│          ││
│  │ Ahh need to submit!! │          ││
│  │ [😰 1] [+]           │          ││
│  └──────────────────────┘          ││
│                                    ││
│  ┌──────────────────────┐          ││
│  │ Dad             14:17│          ││
│  │ 3 hours left people! │          ││
│  │ [⏰ 2] [+]           │          ││
│  └──────────────────────┘          ││
│                                     │
│  ┌──────────────────────┐           │
│  │ Mom             14:20│           │
│  │ Just submitted! ✅   │           │
│  │ [🎉 3] [+]           │           │
│  └──────────────────────┘           │
│                                     │
│ ⋮                                   │
│                                     │
├─────────────────────────────────────┤
│ [😊] Type a message...      [Send] │
└─────────────────────────────────────┘
```

**Annotations**:
- **Urgent Card Visual Cues**:
  - Red circular timer (red ring = danger zone)
  - Double-line border (╔═╗ vs ┌─┐)
  - Warning icon (⚠) next to deadline type
  - Pulsing glow animation (▓ = pulse effect)
  - Higher z-index, more prominent shadow

- **Color Coding** (timer ring):
  - Green: > 24 hours
  - Yellow: 6-24 hours
  - Red: < 6 hours
  - Pulsing Red: < 3 hours

---

## State 3: Expanded Round Overlay
### User tapped floating card to see full details

```
┌─────────────────────────────────────┐
│ [≡]  Family League Chat    [•••]   │
├─────────────────────────────────────┤
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ ← Chat continues
│░░┌──────────────────────┐░░░░░░░░░░│   scrolling behind
│░░│ Sarah M.        10:24│░░░░░░░░░░│   (dimmed, semi-
│░░│ OMG this theme!! 🔥  │░░░░░░░░░░│    transparent)
│░░└──────────────────────┘░░░░░░░░░░│
│┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓│
││ ╔════════════╗         [✕] Close ││ ← Modal overlay
││ ║  RETRO     ║                   ││   (full round info)
││ ║  VIBES     ║                   ││
││ ║            ║                   ││
││ ║  [🎵🎸📻]  ║                   ││
││ ╚════════════╝                   ││
││                                  ││
││ Songs that make you feel like   ││
││ you're in a vintage record shop ││
││ or cruising in a '67 Mustang.   ││
││                                  ││
││ Posted by: Dad                  ││
││                                  ││
││ ┌──────────────┬──────────────┐ ││
││ │   SUBMIT     │    VOTE      │ ││
││ │              │              │ ││
││ │    ⏱ 2d     │    ⏱ 5d     │ ││
││ │  ◕◔◔◔◔◔     │  ◔◔◔◔◔◔     │ ││
││ │   14h left   │   Not open   │ ││
││ │              │              │ ││
││ │  🟢 Healthy  │  ⚪ Pending  │ ││
││ └──────────────┴──────────────┘ ││
││                                  ││
││ ─────────────────────────────── ││
││                                  ││
││ 📝 Submitted Songs (4/6):       ││
││                                  ││
││ • "Electric Feel" - MGMT        ││
││   by Sarah M.                   ││
││                                  ││
││ • "Take On Me" - a-ha           ││
││   by Dad                        ││
││                                  ││
││ • "September" - Earth Wind...   ││
││   by Mom                        ││
││                                  ││
││ • "Superstition" - Stevie...    ││
││   by Uncle Rick                 ││
││                                  ││
││ 💬 Tap song to @ mention        ││
││                                  ││
│┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────────────────┤
│ [😊] Type a message...      [Send] │ ← Compose still visible
└─────────────────────────────────────┘
```

**Annotations**:
- **Overlay Structure**:
  - Heavy border (┏━━┓) for modal emphasis
  - Close button (✕) top-right
  - Background chat dimmed with ░ pattern
  - Scrollable content within overlay

- **Theme Banner**:
  - Full-width image/gradient placeholder
  - Theme title prominent
  - Decorative icons relevant to theme

- **Dual Deadline Display**:
  - Two side-by-side cards
  - Circular arc progress indicators (◕◔◔◔◔◔)
  - Time remaining + status label
  - Color-coded status icons

- **Song List**:
  - Shows submitted songs (visible to family)
  - Song title + artist (truncated)
  - Submitter name
  - Interactive: tap to insert @ mention

- **Status Indicators**:
  - 🟢 Green = healthy time remaining
  - 🟡 Yellow = getting close
  - 🔴 Red = urgent
  - ⚪ White = not yet active

---

## State 4: Reaction Picker Active
### User long-pressed a message or tapped [+]

```
┌─────────────────────────────────────┐
│ [≡]  Family League Chat    [•••]   │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────┐           │
│  │ Sarah M.        10:24│           │
│  │ OMG this theme!! 🔥  │           │
│  │ [👍 2] [🔥 1]        │           │
│  └──────────────────────┘           │
│                    ┌────────────┐   │
│           ┌────────┤ ⏱ 2d 14h  │   │
│           │ [🎵]   │  Submit    │   │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓    │   │
│  ┃ 😀 😂 😍 🔥 👍 🎵 🎉 ⚡ ┃    │   │ ← Reaction picker
│  ┃                          ┃    │   │   (appears above msg)
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛    │   │
│  ┌──────────────────────┐          ││
│  │ Dad             10:26│          ││
│  │ Already submitted my │          ││ ← Selected message
│  │ secret weapon 😎     │          ││   (highlighted)
│  │                      │          ││
│  │ [😎 1] [+] ← active  │          ││
│  └──────────────────────┘          ││
│                                    ││
│  ┌──────────────────────┐          ││
│  │ Mom             10:27│          ││
│  │ Can't decide between │          ││
│  │ two songs...         │          ││
│  └──────────────────────┘          ││
│                                     │
│ ⋮                                   │
│                                     │
├─────────────────────────────────────┤
│ [😊] Type a message...      [Send] │
└─────────────────────────────────────┘
```

**Annotations**:
- **Reaction Picker**:
  - Floating panel above target message
  - Quick access to common emoji
  - Horizontally scrollable for more options
  - Tap emoji to add/remove reaction
  - Tap outside to dismiss

- **Interaction Flow**:
  1. Long-press message OR tap [+] button
  2. Picker appears with animation
  3. Tap emoji to react
  4. Picker auto-dismisses
  5. Reaction appears in message footer

---

## State 5: @ Mention Flow
### Composing with song mention auto-complete

```
┌─────────────────────────────────────┐
│ [≡]  Family League Chat    [•••]   │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────┐           │
│  │ Mom             10:27│           │
│  │ Can't decide between │           │
│  │ two songs...         │           │
│  └──────────────────────┘           │
│                    ┌────────────┐   │
│           ┌────────┤ ⏱ 2d 14h  │   │
│           │ [🎵]   │  Submit    │   │
│           │ Retro  └────────────┘   │
│           │ Vibes                   │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│  ┃ 🎵 Song Mentions:           ┃   │ ← Auto-complete
│  ┃                             ┃   │   suggestion panel
│  ┃ • "Electric Feel" - MGMT   ┃   │
│  ┃   by Sarah M.               ┃   │
│  ┃                             ┃   │
│  ┃ • "Take On Me" - a-ha      ┃   │
│  ┃   by Dad                    ┃   │
│  ┃                             ┃   │
│  ┃ • "September" - Earth...   ┃   │
│  ┃   by Mom                    ┃   │
│  ┃                             ┃   │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│  ┌──────────────────────┐           │
│  │ You             10:30│           │
│  │ @Mom I love          │           │
│  │ [🎵 "September"]!    │           │ ← Inserted mention
│  │                      │           │   (rendered as chip)
│  │ [+]                  │           │
│  └──────────────────────┘           │
│                                     │
├─────────────────────────────────────┤
│ [😊] I love @               [Send] │ ← Typing "@" triggers
│      └─────┘                        │   auto-complete
│        ↑                            │
│     Cursor after @                  │
└─────────────────────────────────────┘
```

**Annotations**:
- **Auto-complete Trigger**:
  - Type "@" in compose field
  - Suggestion panel appears above keyboard
  - Shows people AND submitted songs

- **Song Mention Display**:
  - In compose: shows as chip/bubble [🎵 "Song Name"]
  - In sent message: rendered as tappable link
  - Tapping opens song in Music League or streaming service

- **Suggestion Panel**:
  - Two sections: People, Songs
  - Tap suggestion to insert
  - Dismisses on selection or ESC
  - Filters as you continue typing

---

## State 6: Multi-Round View (Future State)
### Multiple active rounds (rare but possible)

```
┌─────────────────────────────────────┐
│ [≡]  Family League Chat    [•••]   │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────┐           │
│  │ Sarah M.        10:24│           │
│  │ Two themes?! 😱      │           │
│  │ [😱 3] [+]           │           │
│  └──────────────────────┘           │
│                    ┌────────────┐   │ ← Round 1 (urgent)
│           ┌────────║ ⏱ 4h 20m  ║   │   (red, pulsing)
│           │ [🎵]   ║  Submit ⚠ ║   │
│           │ Retro  ╚════════════╝   │
│           │                         │
│           │        ┌────────────┐   │ ← Round 2 (healthy)
│           │  [🌴]  │ ⏱ 3d 08h  │   │   (green, normal)
│           │ Summer │  Submit    │   │
│           └────────┴────────────────│
│  ┌──────────────────────┐           │
│  │ Dad             10:26│           │
│  │ Double trouble! Let's│           │
│  │ gooooo 🔥🔥          │           │
│  │ [🔥 4] [+]           │           │
│  └──────────────────────┘           │
│                                     │
│ ⋮                                   │
│                                     │
├─────────────────────────────────────┤
│ [😊] Type a message...      [Send] │
└─────────────────────────────────────┘
```

**Annotations**:
- **Stacked Cards**:
  - Most urgent round on top
  - Slightly overlapping (z-index layering)
  - Each maintains individual timer + urgency state
  - Tap any card to expand that round's overlay

- **Visual Hierarchy**:
  - Urgent round gets red treatment
  - Healthy round stays green/normal
  - Size priority: urgent > newest > oldest

---

## Component Specifications

### Floating Round Card (Compact)
```
┌────────────────────┐
│ [Icon] ⏱ Time     │  → Icon: theme thumbnail or emoji
│ Theme  Deadline   │  → Theme: truncate at ~12 chars
└────────────────────┘  → Deadline: most urgent phase

Dimensions: ~140x60px
Position: Fixed top-right, 8px margins
Background: Semi-transparent white (rgba(255,255,255,0.95))
Shadow: 0 2px 8px rgba(0,0,0,0.15)
Border-radius: 12px
```

### Circular Timer Visualization
```
    Normal (Green)         Warning (Yellow)        Urgent (Red)

      ◕◔◔◔◔◔                ◕◕◕◔◔◔                ◕◕◕◕◕◔
     2d 14h                  8h 30m                 2h 15m

    🟢 Healthy              🟡 Soon                🔴 Urgent
```

**Timer Ring States**:
- Filled portion = time elapsed
- Empty portion = time remaining
- Color transitions smoothly
- Pulsing animation when < 3 hours

### Message Bubble Layout
```
Left-aligned (others):          Right-aligned (self):

┌──────────────────────┐         ┌──────────────────────┐
│ Name           Time  │         │ Time            You  │
│ Message text here    │         │    Message text here │
│ continues...         │         │         continues... │
│                      │         │                      │
│ [👍 2] [🔥 1] [+]    │         │    [👍 2] [🔥 1] [+] │
└──────────────────────┘         └──────────────────────┘

Background: #F0F0F0             Background: #007AFF (iOS blue)
Text: #000000                   Text: #FFFFFF
Max-width: 75% of screen        Max-width: 75% of screen
```

### Overlay Modal Structure
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
│ [Hero Image / Banner]       [✕] │  → Header
│                                  │
│ Title                            │  → Content
│ Description text...              │  → (scrollable)
│                                  │
│ [Deadline Cards]                 │
│                                  │
│ [Song List]                      │
│                                  │
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Dimensions: 90% width, max 80% height
Position: Centered, slides up from bottom
Background: Solid white (#FFFFFF)
Backdrop: Semi-transparent black (rgba(0,0,0,0.5))
Animation: 200ms ease-out
```

---

## Interaction Patterns

### Tap Targets
- Minimum touch target: 44x44px (iOS HIG)
- Floating card: entire card is tappable
- Message reactions: each emoji + [+] button
- Compose bar: emoji picker, input field, send button

### Gestures
- **Tap**: Select, activate, send
- **Long-press**: Contextual menu (copy, react, etc.)
- **Swipe down**: Dismiss overlay
- **Scroll**: Chat history (infinite scroll up)
- **Pull-to-refresh**: Sync new messages (top of chat)

### Animations
- **Card pulse**: 1s ease-in-out, infinite loop when urgent
- **Overlay enter**: Slide up + fade in (200ms)
- **Overlay exit**: Slide down + fade out (150ms)
- **Message send**: Fade in + slight scale (150ms)
- **Reaction add**: Pop animation (100ms)

### Focus States
- Active input: Blue border (iOS) / accent color (Android)
- Floating card hover: Slight scale (1.05x)
- Tapped message: Light grey background highlight

---

## Accessibility Considerations

### Screen Reader Support
- Floating card: "Round: [Theme], [Time] until [Deadline Type], Tap to view details"
- Timer urgency: "Warning: Less than 3 hours remaining" when red
- Message reactions: "2 people reacted with thumbs up, 1 person reacted with fire"
- Song mentions: "Song link: [Title] by [Artist], submitted by [Name]"

### Color & Contrast
- Text on white: minimum 4.5:1 contrast ratio
- Timer colors paired with icons/text (not color-only)
- Urgent state uses animation + border + icon (not just color)

### Focus Management
- Overlay opens: focus moves to close button
- Overlay closes: focus returns to floating card
- Reaction picker: keyboard navigable (tab through emojis)
- Compose field: always accessible via keyboard

### Motion Sensitivity
- Respect `prefers-reduced-motion` media query
- When enabled: disable pulse animation, use static border instead
- Overlay transitions reduced to simple fade

---

## Technical Notes

### Z-Index Layers (Bottom to Top)
1. Chat messages (z-index: 1)
2. Floating card (z-index: 100)
3. Reaction picker (z-index: 200)
4. Overlay backdrop (z-index: 900)
5. Overlay modal (z-index: 1000)

### Performance
- Chat: Virtualized scrolling for 100+ messages
- Floating card: CSS transform for smooth animations
- Overlay: Render on-demand, unmount on close
- Images: Lazy load theme banners, use placeholders

### Responsive Breakpoints
- Mobile: 320px - 428px (primary target)
- Tablet: 429px - 768px (expand to 60% width bubbles)
- Desktop: 769px+ (max-width 480px container, centered)

---

## Design Rationale

### Why Chat-First?
- **Primary Use Case**: Family stays connected through conversation
- **Music League is Social**: Discussion > data visualization
- **Mobile Context**: Small screens demand focus, not dashboards
- **Engagement**: Chat drives daily opens, round info is periodic

### Why Floating Card?
- **Non-Intrusive**: Always visible but never blocks conversation
- **Contextual**: Shows urgency when needed, quiet otherwise
- **Quick Glance**: See countdown without leaving chat
- **Expandable**: Full details on-demand via tap

### Why Circular Timer?
- **Universal Symbol**: Clock metaphor is immediately understood
- **Visual Urgency**: Ring fill = progress, color = severity
- **Compact**: Fits in small floating card
- **Accessible**: Paired with numeric time and text labels

### Why Overlay vs. New Screen?
- **Context Preservation**: Chat visible behind overlay
- **Faster Interaction**: Modal = lighter cognitive load than navigation
- **Dismissible**: Swipe-down gesture feels natural on mobile
- **Consistent**: Users stay in "chat mode" mentally

---

## Future Enhancements

### Phase 2 (Post-MVP)
- **Voting Interface**: Similar overlay for active voting rounds
- **Song Previews**: Inline 30s preview player in chat bubbles
- **Rich Embeds**: Automatic unfurling of Spotify/Apple Music links
- **Voice Messages**: Record audio reactions to songs

### Phase 3 (Advanced)
- **Live Listening Party**: Synchronized playback + live reactions
- **Song Recommendations**: AI suggests songs based on theme + chat context
- **Photo Themes**: Upload images to complement text themes
- **Collaborative Playlists**: Export round results to Spotify

---

## Appendix: Color Palette

```
Primary Colors:
  - Music League Blue: #007AFF (iOS system blue)
  - Success Green: #34C759
  - Warning Yellow: #FFCC00
  - Urgent Red: #FF3B30

Neutral Colors:
  - Background: #FFFFFF
  - Surface: #F2F2F7 (iOS grouped background)
  - Border: #C6C6C8
  - Text Primary: #000000
  - Text Secondary: #8E8E93

Overlay Colors:
  - Backdrop: rgba(0, 0, 0, 0.5)
  - Card Background: rgba(255, 255, 255, 0.95)
  - Pulse Glow (urgent): rgba(255, 59, 48, 0.3)
```

---

## Appendix: Typography

```
Font Family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell

Sizes:
  - Heading 1 (Theme Title): 22px, Bold
  - Heading 2 (Section): 17px, Semibold
  - Body (Messages): 15px, Regular
  - Caption (Timestamps): 13px, Regular
  - Timer: 14px, Medium
  - Button: 16px, Semibold

Line Heights:
  - Headings: 1.2
  - Body: 1.4
  - Compact (Timer/Labels): 1.1
```

---

**END OF WIREFRAMES**

Generated: 2025-12-30
For: ML Companion App - Chat-First UI Redesign
