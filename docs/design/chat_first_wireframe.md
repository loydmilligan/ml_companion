# Chat-First Mobile Wireframe
## Music League Family Companion App - Stories-Style Header Design

**Design Philosophy:** Transform the chat experience from information-dense to conversation-first. The current round and league context become ambient, accessible via Instagram/Snapchat-style story circles. This prioritizes human connection while keeping game state visible but unobtrusive.

---

## 1. MAIN CHAT VIEW (iOS/Android Native Messaging Feel)

```
┌─────────────────────────────────────────┐
│  9:41         Family League      ●●●    │ ← System status bar
├─────────────────────────────────────────┤
│                                         │
│  ╭─────╮  ╭─────╮  ╭─────╮  ╭─────╮   │ ← Stories row
│  │ ███ │  │ ♫♫♫ │  │ 🏆  │  │ +   │   │   (horizontal scroll)
│  │█████│  │♫███♫│  │ ▓▓▓ │  │     │   │
│  │ ███ │  │ ♫♫♫ │  │ ▓▓▓ │  │     │   │
│  ╰─────╯  ╰─────╯  ╰─────╯  ╰─────╯   │
│   ●●●●●     🎵      PAST    ADD         │
│  "80s"   PLAYLIST  ROUNDS   MORE        │
│  2d left                                │
│  ⚠️ URGENT                               │
├─────────────────────────────────────────┤
│                                         │
│  ┌────────────────────────┐            │ ← Chat thread
│  │  Mom                   │ 10:23 AM    │   starts here
│  │  Just submitted my     │            │
│  │  song! 🎸              │            │
│  └────────────────────────┘            │
│         ❤️ 😂 2                        │ ← Reactions
│                                         │
│            ┌────────────────────────┐  │
│   9:45 AM  │ I found the PERFECT    │  │
│            │ track for this one     │  │
│            │ @"Bohemian Rhapsody"   │  │ ← @ mention
│            │ by Queen 🎭            │  │   of song
│            └────────────────────────┘  │
│                                    You  │
│                  👍 😍 3                │
│                                         │
│  ┌────────────────────────┐            │
│  │  Dad                   │ 11:02 AM   │
│  │  @Mom what genre did   │            │
│  │  you pick? I'm torn... │            │
│  └────────────────────────┘            │
│         💭 1                           │
│                                         │
│  ┌────────────────────────┐            │
│  │  Sarah (sis)           │ 11:15 AM   │
│  │  Voting closes in 48h! │            │
│  │  Don't forget 🔔       │            │
│  └────────────────────────┘            │
│                                         │
│            ┌────────────────────────┐  │
│  Yesterday │ Anyone else notice     │  │ ← Date separator
│            │ we always pick the     │  │
│            │ same songs for 80s?    │  │
│            └────────────────────────┘  │
│                                    You  │
│                                         │
│  ┌────────────────────────┐            │
│  │  Mom                   │            │
│  │  Guilty 😅 I default to│            │
│  │  New Wave every time   │            │
│  └────────────────────────┘            │
│                                         │
├─────────────────────────────────────────┤
│  ┌───┬─────────────────────────┬───┐  │ ← Compose bar
│  │ + │  Message...             │ @ │  │
│  │ 😊│                         │ ♫ │  │
│  └───┴─────────────────────────┴───┘  │
├─────────────────────────────────────────┤
│   CHAT     HISTORY     ⚙️              │ ← Bottom nav
│   ████                                  │   (CHAT active)
└─────────────────────────────────────────┘
```

### Annotations - Main Chat View:

**Stories Row (Top Horizontal Scroll):**
- **Current Round Circle:** Theme image with urgency ring
  - Green ring: >3 days until deadline
  - Yellow ring: 1-3 days
  - Red ring + pulsing animation: <24 hours
  - Tap to open full round modal
  - Badge shows "2d left" and urgency icon

- **Playlist Circle:** Available when voting opens
  - Music note icon with round theme
  - Tap to open in Spotify/Apple Music
  - Shows when playable

- **Past Rounds Circle:** Trophy/archive icon
  - Tap to browse history
  - Quick access to completed rounds

- **Add More Circle:** Plus icon
  - Add new discussion topics
  - Share external playlists
  - Future features

**Chat Thread:**
- Native messaging feel (iOS/Android patterns)
- Left-aligned bubbles: other family members
- Right-aligned bubbles: current user
- Timestamps on first message in time group
- Date separators for clarity

**Reactions:**
- Emoji reactions below messages
- Tap to react, long-press for more options
- Count shows number of reactors

**@ Mentions:**
- @Username mentions for people
- @"Song Title" by Artist for song mentions
  - Tappable, opens song preview
  - Auto-complete when typing @

**Compose Bar:**
- Left: Emoji picker + attachments
- Center: Text input
- Right: @ mention button, ♫ song search button
- Auto-expands for multi-line messages

**Bottom Navigation:**
- CHAT: Current view (primary destination)
- HISTORY: Past rounds and stats
- Settings/Profile: Gear icon

---

## 2. ROUND DETAIL MODAL (Stories-Style Full Screen)

**Triggered by:** Tapping current round story circle

```
┌─────────────────────────────────────────┐
│                                      ✕  │ ← Close button
│                                         │
│         ████████████████████            │ ← Round theme
│         ████████████████████            │   image/artwork
│         ████  "BEST OF"  ████           │   (full bleed)
│         ████   THE 80s   ████           │
│         ████████████████████            │
│         ████████████████████            │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  SUBMISSION DEADLINE              │ │ ← Dual deadline
│  │  ▓▓▓▓▓▓▓░░░░░░░░░░░░░  42%       │ │   gauges
│  │  Ends in 2 days 6 hours           │ │
│  │                                   │ │
│  │  VOTING DEADLINE                  │ │
│  │  ░░░░░░░░░░░░░░░░░░░░  Not open  │ │
│  │  Opens after submissions close    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  📋 ROUND DETAILS                 │ │
│  │                                   │ │
│  │  Theme: Best of the 80s           │ │
│  │  Round 7 of 12                    │ │
│  │                                   │ │
│  │  Description:                     │ │
│  │  Submit your favorite song from   │ │
│  │  the 1980s. Any genre welcome!    │ │
│  │  Bonus points for deep cuts 🎸    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  👥 FAMILY PROGRESS               │ │
│  │                                   │ │
│  │  ✓ Mom (submitted)                │ │
│  │  ✓ You (submitted)                │ │
│  │  ⏳ Dad (pending)                 │ │
│  │  ⏳ Sarah (pending)               │ │
│  │                                   │ │
│  │  2 of 4 submitted                 │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  SUBMIT YOUR SONG →             │  │ ← Primary action
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  VIEW IN MUSIC LEAGUE           │  │ ← External link
│  └─────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Annotations - Round Detail Modal:

**Layout:**
- Full-screen modal overlay
- Swipe down to dismiss (native gesture)
- X button in top-right for explicit close

**Theme Image:**
- Full-width hero image
- Could be: AI-generated, theme-specific stock, or custom
- Text overlay with round theme name

**Dual Deadline Gauges:**
- **Submission Phase:** Active progress bar
  - Fill color changes: Green → Yellow → Red
  - Percentage complete
  - Countdown timer (days + hours)

- **Voting Phase:** Disabled until submissions close
  - Gray/disabled state
  - "Not open" indicator
  - Explanatory text

**Round Details:**
- Theme, round number, description
- Scrollable if content is long
- Markdown support for formatted descriptions

**Family Progress:**
- Real-time status of each member
- ✓ Checkmark: Submitted
- ⏳ Clock: Pending
- Shows fraction completed (2 of 4)

**Action Buttons:**
- Primary: Submit song (if not submitted)
- Secondary: View in Music League web
- Could add: Share round, Copy theme

---

## 3. @ MENTION FLOW - SONG SEARCH

**Triggered by:** Tapping ♫ button in compose bar OR typing @ in message

```
┌─────────────────────────────────────────┐
│  ← Back        Add Song Mention         │
├─────────────────────────────────────────┤
│  🔍  Search for a song...               │ ← Search input
├─────────────────────────────────────────┤
│                                         │
│  FAMILY SUBMISSIONS THIS ROUND          │ ← Contextual
│                                         │   suggestions
│  ♫ Bohemian Rhapsody                    │
│    Queen                                │
│    Submitted by You                     │
│    ────────────────────────────────     │
│                                         │
│  ♫ Take On Me                           │
│    A-ha                                 │
│    Submitted by Mom                     │
│    ────────────────────────────────     │
│                                         │
│  ♫ Don't Stop Believin'                 │
│    Journey                              │
│    Submitted by Dad                     │
│    ────────────────────────────────     │
│                                         │
├─────────────────────────────────────────┤
│  SEARCH SPOTIFY / APPLE MUSIC           │ ← Search all
│                                         │   music
└─────────────────────────────────────────┘
```

**When song is selected:**

```
┌─────────────────────────────────────────┐
│  + │  Check out @"Bohemian Rhapsody"  │ │ ← Compose bar
│  😊│  by Queen! Perfect for this...  │ │   with mention
│    │                                  │ │
│    │  [Song Preview Card]             │ │ ← Rich preview
│    │  🎵 Bohemian Rhapsody            │ │
│    │  Queen · 1975                    │ │
│    │  [▶️ Preview]                    │ │
└────┴──────────────────────────────────┴─┘
```

**Sent message with song mention:**

```
│            ┌────────────────────────┐  │
│  11:32 AM  │ Check out @"Bohemian   │  │
│            │ Rhapsody" by Queen!    │  │
│            │ Perfect for this...    │  │
│            │                        │  │
│            │ ┌──────────────────┐  │  │
│            │ │ ♫ Bohemian R...  │  │  │ ← Embedded
│            │ │ Queen · 1975     │  │  │   song card
│            │ │ [▶️ Play]        │  │  │   (tappable)
│            │ └──────────────────┘  │  │
│            └────────────────────────┘  │
│                                    You  │
```

### Annotations - @ Mention Flow:

**Search Sheet:**
- Bottom sheet modal (native iOS/Android pattern)
- Search input with auto-complete
- Prioritizes family submissions from current/past rounds
- Falls back to full music service search

**Contextual Suggestions:**
- Shows songs already in the family's league
- Displays submitter name
- Tap to select and insert mention

**Rich Song Cards:**
- Embedded preview in message
- Tappable to play 30s preview
- Long-press to open in Spotify/Apple Music
- Visual distinction from plain text

---

## 4. EMOJI REACTIONS INTERACTION

**Long-press on any message:**

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌────────────────────────┐            │
│  │  Mom                   │            │
│  │  Just submitted! 🎸    │←──────┐   │
│  └────────────────────────┘       │   │
│         ❤️ 😂 2                   │   │
│                                    │   │
│    ╭───────────────────────────╮  │   │ ← Reaction
│    │  ❤️  👍  😂  😮  😢  🔥  │←─┘   │   picker
│    │                           │      │   (appears
│    │  🎵  🎸  🎹  🎤  🏆  ⭐  │      │   on long-
│    ╰───────────────────────────╯      │   press)
│                                         │
│            ┌────────────────────────┐  │
│            │ I found the PERFECT    │  │
│            └────────────────────────┘  │
```

**After adding reaction:**

```
│  ┌────────────────────────┐            │
│  │  Mom                   │ 10:23 AM   │
│  │  Just submitted! 🎸    │            │
│  └────────────────────────┘            │
│         ❤️ 😂 👍 3   ← You reacted     │ ← Reactions
│                                         │   update
│                                         │   in real-time
```

### Annotations - Emoji Reactions:

**Interaction:**
- Long-press message to open reaction picker
- Tap emoji to add/remove your reaction
- Tap existing reaction to see who reacted
- Music-specific emojis included

**Display:**
- Shows unique reactions + count
- Your reaction highlighted (if applicable)
- Stacks horizontally below message
- Max 6 unique reactions before "..."

---

## 5. URGENCY RING ANIMATION STATES

**Stories row urgency indicators:**

```
GREEN (3+ days):
╭─────╮
│ ███ │  ← Solid green ring
│█████│     No animation
│ ███ │
╰─────╯
 "80s"
 4d left


YELLOW (1-3 days):
╭─────╮
│ ███ │  ← Solid yellow ring
│█████│     Gentle pulse 1x/min
│ ███ │
╰─────╯
 "80s"
 2d left
 ⚠️


RED URGENT (<24 hours):
╭─────╮
│ ███ │  ← Red ring
│█████│     Pulsing animation
│ ███ │     Every 3 seconds
╰─────╯     Glow effect
 "80s"
12h left
⚠️ URGENT
```

**Animation Specifications:**

```
GREEN RING:
- Color: #34C759 (iOS green)
- Width: 3px
- Animation: None
- Badge: Days remaining

YELLOW RING:
- Color: #FFCC00 (iOS yellow)
- Width: 4px
- Animation: Subtle scale pulse
  - Scale: 1.0 → 1.05 → 1.0
  - Duration: 2s
  - Frequency: Every 60s
- Badge: Days + warning icon

RED URGENT RING:
- Color: #FF3B30 (iOS red)
- Width: 5px
- Animation: Continuous pulse + glow
  - Scale: 1.0 → 1.1 → 1.0
  - Opacity: 0.8 → 1.0 → 0.8
  - Glow: 0 → 8px blur → 0
  - Duration: 1.5s
  - Continuous (no delay)
- Badge: Hours + "URGENT"
```

---

## 6. BOTTOM NAVIGATION STATES

```
┌─────────────────────────────────────────┐
│                                         │
│         [ MAIN CONTENT AREA ]           │
│                                         │
├─────────────────────────────────────────┤
│   💬       📊        ⚙️                 │ ← Tab icons
│  CHAT    HISTORY   SETTINGS              │
│  ████                                    │ ← Active indicator
└─────────────────────────────────────────┘

STATE: CHAT (Active)
- Icon: 💬 filled/bold
- Label: "CHAT"
- Indicator bar: Full width under tab
- Badge: None (real-time updates visible)


STATE: HISTORY
- Icon: 📊 outline/regular
- Label: "HISTORY"
- Badge: May show "NEW" for results reveal


STATE: SETTINGS
- Icon: ⚙️ outline/regular
- Label: "SETTINGS"
- Badge: Red dot for notifications/updates
```

---

## 7. ACCESSIBILITY & RESPONSIVE NOTES

### Touch Targets:
- All interactive elements minimum 44x44 pts (iOS) / 48x48 dp (Android)
- Stories circles: 80x80 pts with tap area
- Reaction emojis: 32x32 pts minimum
- Message bubbles: Full width tappable for reactions

### Typography:
- System fonts (San Francisco iOS, Roboto Android)
- Message text: 16pt / 16sp (body)
- Timestamps: 12pt / 12sp (caption)
- Names: 14pt / 14sp (semibold)
- Deadline text: 14pt / 14sp (medium)

### Color Contrast:
- Message bubbles: Follow platform defaults
  - iOS: Light gray / Blue
  - Android: Light gray / Material You primary
- Text: WCAG AA minimum (4.5:1)
- Urgency colors: Sufficient contrast on white

### Dark Mode:
- Respect system theme preference
- Invert bubble colors
- Adjust urgency ring colors for visibility
- Reduce glow intensity in dark mode

### Haptics:
- Light haptic on message send
- Medium haptic on reaction add
- Heavy haptic on urgent deadline (when app opens)

### VoiceOver / TalkBack:
- Stories circles: "Current round: Best of the 80s. 2 days remaining. Urgent. Double-tap to view details."
- Messages: "Mom, 10:23 AM: Just submitted my song. Guitar emoji. 2 reactions: heart, laughing."
- Reactions: "Add reaction. Double-tap to open emoji picker."

---

## 8. USER FLOW WALKTHROUGH

### Scenario: Family member checks app during submission phase

1. **App Opens → Chat View**
   - User sees stories row at top
   - Current round has yellow urgency ring (2 days left)
   - Unread messages visible in chat thread
   - Badge notification shows "3 new messages"

2. **User taps Current Round story circle**
   - Modal slides up from bottom
   - Shows theme image, submission deadline at 42%
   - Family progress: 2 of 4 submitted
   - User has already submitted (checkmark)

3. **User swipes down to close modal**
   - Returns to chat view
   - Scrolls through new messages

4. **User wants to mention their song**
   - Taps ♫ button in compose bar
   - Bottom sheet appears with family submissions
   - Selects "Bohemian Rhapsody" from list
   - Song card appears in compose preview
   - Types: "Check out my pick! Think it's a winner 🏆"
   - Taps send

5. **Message appears in thread**
   - Right-aligned bubble (user's message)
   - Embedded song card with play button
   - Other family members can react or reply

6. **User receives reaction notification**
   - Push: "Mom ❤️ your message"
   - In-app: Reaction appears below message
   - Haptic feedback (if enabled)

---

## 9. DESIGN RATIONALE

### Why Stories-Style Header?

**Problem:**
Current design front-loads round information, making it feel like a task manager rather than a family chat app. Users want connection first, context second.

**Solution:**
Stories pattern provides:
- **Ambient awareness:** Round status is visible but not intrusive
- **Familiar interaction:** Users already know how to interact with stories
- **Urgency communication:** Colored rings + animation convey time pressure
- **Progressive disclosure:** Tap to see details only when needed
- **Scalability:** Can add playlist, past rounds, other features as circles

### Why Chat-First?

**User Research Insights:**
- "I want to talk ABOUT the music, not just submit songs"
- "We text about Music League anyway, why not in one place?"
- "The current app feels like homework, not fun"

**Design Principles:**
- **Social-first:** Conversation drives engagement
- **Native patterns:** Feels like iMessage/WhatsApp
- **Context-aware:** @ mentions connect chat to songs
- **Ephemeral urgency:** Time pressure without anxiety

### Key Interactions:

1. **Stories tap:** Full-screen modal with all round details
2. **@ mentions:** Song search and rich embedding
3. **Reactions:** Quick feedback without typing
4. **Urgency rings:** Visual deadline awareness
5. **Swipe gestures:** Native modal dismissal

---

## 10. IMPLEMENTATION PRIORITIES

### Phase 1: MVP (Chat Foundation)
- [ ] Basic chat thread with real-time messages
- [ ] Stories row with current round circle
- [ ] Single deadline display (submission OR voting)
- [ ] @ mentions for people only
- [ ] Bottom navigation (Chat, History, Settings)

### Phase 2: Enhanced Round Context
- [ ] Dual deadline gauges in modal
- [ ] Urgency ring states (green/yellow/red)
- [ ] Family progress tracking
- [ ] @ song mentions with search

### Phase 3: Rich Interactions
- [ ] Emoji reactions on messages
- [ ] Song card embeds with preview
- [ ] Pulsing animation for urgent deadlines
- [ ] Haptic feedback

### Phase 4: Additional Stories
- [ ] Playlist story circle
- [ ] Past rounds story circle
- [ ] Dark mode support
- [ ] Accessibility audit

---

## 11. TECHNICAL SPECIFICATIONS

### Component Architecture:

```
<ChatPage>
  <StoriesHeader>
    <StoryCircle type="current-round" urgency="yellow" />
    <StoryCircle type="playlist" />
    <StoryCircle type="past-rounds" />
  </StoriesHeader>

  <ChatThread>
    <Message sender="mom" timestamp={...}>
      <MessageBubble>Just submitted! 🎸</MessageBubble>
      <ReactionBar reactions={[...]} />
    </Message>

    <Message sender="current-user" timestamp={...}>
      <MessageBubble>
        Check out my pick!
        <SongCard song={...} />
      </MessageBubble>
    </Message>
  </ChatThread>

  <ComposeBar>
    <EmojiButton />
    <TextInput placeholder="Message..." />
    <MentionButton />
    <SongSearchButton />
  </ComposeBar>

  <BottomNav activeTab="chat" />
</ChatPage>
```

### State Management:

```typescript
interface ChatState {
  messages: Message[]
  currentRound: Round | null
  urgencyLevel: 'green' | 'yellow' | 'red'
  familyMembers: FamilyMember[]
  unreadCount: number
}

interface Round {
  id: string
  theme: string
  imageUrl: string
  submissionDeadline: Date
  votingDeadline: Date
  submissionProgress: number
  votingProgress: number
  familyProgress: {
    memberId: string
    submitted: boolean
  }[]
}

interface Message {
  id: string
  senderId: string
  content: string
  timestamp: Date
  mentions: Mention[]
  reactions: Reaction[]
}

interface Mention {
  type: 'user' | 'song'
  id: string
  displayName: string
  metadata?: {
    artist?: string
    albumArt?: string
    previewUrl?: string
  }
}
```

### Real-Time Subscriptions:

```typescript
// Supabase real-time for messages
supabase
  .channel('family-chat')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `family_id=eq.${familyId}`
  }, handleNewMessage)
  .subscribe()

// Supabase real-time for reactions
supabase
  .channel('message-reactions')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'reactions',
    filter: `message_id=eq.${messageId}`
  }, handleNewReaction)
  .subscribe()
```

---

## SUMMARY

This chat-first design transforms the Music League companion from a task-oriented interface to a conversation-first family space. The stories-style header keeps round context accessible without overwhelming the primary interaction: talking about music with people you love.

**Key Innovations:**
1. Stories pattern for round context (familiar, scalable)
2. Urgency rings for deadline awareness (visual, non-intrusive)
3. @ mentions for songs (rich, contextual)
4. Native messaging patterns (comfortable, fast)
5. Progressive disclosure (context when needed)

**Next Steps:**
1. Review wireframes with stakeholders
2. Create interactive prototype in Figma
3. User test with 3-5 family groups
4. Refine based on feedback
5. Begin Phase 1 implementation

---

**Files Referenced:**
- `/home/mmariani/Projects/ml_companion/docs/requirements/feature_specification.md`
- `/home/mmariani/Projects/ml_companion/docs/design/ui_specification.md`
- `/home/mmariani/Projects/ml_companion/docs/README.md`

**Related Documentation:**
- See `docs/design/ui_specification.md` for existing UI patterns
- See `docs/requirements/feature_specification.md` for feature requirements
- See `docs/planning/project_plan.md` for implementation roadmap
