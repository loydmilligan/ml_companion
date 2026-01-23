# Complete Settings Inventory

## Current State

### User Settings (SettingsPage.tsx - 480 lines)

| Section | Setting | Type | Notes |
|---------|---------|------|-------|
| **UI** | Theme | Select (Ocean/Sunset/Evergreen) | Local storage |
| | Dark Mode | Toggle | Local storage |
| **Music Links** | Preferred Provider | Select (Spotify/Apple/YouTube) | Profile DB |
| | Show YouTube Video | Toggle | Profile DB |
| **Notification Types** | Email | Toggle | Profile DB |
| | Push (Admin only) | Toggle | Profile DB |
| | ntfy (If enabled) | Toggle + Topic | Profile DB |
| **What to Notify** | Chat messages | Toggle | Profile DB |
| | Reactions | Toggle | Profile DB |
| | DMs | Toggle | Profile DB |
| **Test** | Test message input | Action | Dev/debug |

### Profile (ProfileDrawer.tsx - 135 lines)

| Setting | Type | Notes |
|---------|------|-------|
| Avatar | Image upload | Storage bucket |
| Display Name | View only | Set during onboarding |

### Admin Settings (AdminPage.tsx - 5,158 lines)

#### Users Tab (~200 lines content)
| Setting | Type | Notes |
|---------|------|-------|
| View all members | List | Read only |
| Role (lead/member) | Toggle | Per user |
| Email notify permission | Toggle | Per user |
| Chat notify permission | Toggle | Per user |
| Reaction notify permission | Toggle | Per user |
| ntfy permission | Toggle | Per user |
| Push permission | Toggle | Per user |
| Timeline tester | Toggle | Per user |

#### Invites Tab (~70 lines content)
| Setting | Type | Notes |
|---------|------|-------|
| View invite codes | List | With status |
| Create invite | Action | Generates code |
| Send email invite | Action | Email + code |

#### Leagues Tab (~130 lines content)
| Setting | Type | Notes |
|---------|------|-------|
| View leagues | List | With season # |
| League narrative | Text | Per league |

#### Rounds Tab (~330 lines content)
| Setting | Type | Notes |
|---------|------|-------|
| View rounds | List | Grouped by league |
| Round status | Select | open/voting/revealed/archived |
| Theme image | Image upload | Per round |
| Winners image | Image upload | Per round |
| YouTube playlist URL | Text | Per round |
| Round narrative | Text | Per round |

#### Competitors Tab (~100 lines content)
| Setting | Type | Notes |
|---------|------|-------|
| View competitors | List | Per season |
| Link to profile | Select | Maps external to internal user |

#### Imports Tab (~350 lines content)
| Setting | Type | Notes |
|---------|------|-------|
| Import submissions CSV | File upload | With preview |
| Import votes CSV | File upload | With preview |
| Import rounds CSV | File upload | With preview |
| Process emails | Action | Manual trigger |

#### AI Settings Tab (~400 lines content)
| Setting | Type | Notes |
|---------|------|-------|
| **AI Features** | | |
| AI Assistant (master) | Toggle | Disables all below |
| Explain Theme | Toggle | |
| Get Hint | Toggle | |
| Check Song | Toggle | |
| Check Song daily limit | Number | Per user |
| Chat @AI Replies | Toggle | |
| **AI Image** | | |
| Theme image generation | Toggle | |
| Winners image generation | Toggle | |
| AI Model | Select | gpt-4o-mini/gpt-4o/claude |
| Logo palette | Select | Color scheme |

#### Minigames (in AI Settings - ~200 lines)
| Setting | Type | Notes |
|---------|------|-------|
| **Guess the Submitter** | | |
| Enabled | Toggle | |
| Available phase | Select | voting/revealed/both |
| **Timeline Game** | | |
| Enabled | Toggle | |
| Available phase | Select | voting/revealed/both |
| Manage release years | Sub-section | Per round |
| **Round Challenge** | | |
| Enabled | Toggle | |
| Available phase | Select | open/voting/both |

#### Bonus Tab (~200 lines content)
| Setting | Type | Notes |
|---------|------|-------|
| Award points | Form | User + points + reason |
| Select round | Select | For context |
| View recent awards | List | History |

#### Testing Tab (~150 lines content)
| Setting | Type | Notes |
|---------|------|-------|
| Seed test data | Action | Creates test users |
| Clear test data | Action | Removes test users |

---

## Proposed Consolidated Structure

### User-Facing Settings (3 sections)

```
┌─────────────────────────────────────────────────────────────┐
│ ⚙️ Settings                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 👤 Profile                                                  │
│ ├─ Avatar (tap to change)                                   │
│ ├─ Display Name                                             │
│ └─ Email (view only)                                        │
│                                                             │
│ 🎨 Appearance                                               │
│ ├─ Theme: [Ocean ▼]                                         │
│ └─ Dark Mode: [●]                                           │
│                                                             │
│ 🎵 Music                                                    │
│ ├─ Preferred Service: [Spotify ▼]                           │
│ └─ Show YouTube link: [✓]                                   │
│                                                             │
│ 🔔 Notifications                                            │
│ ├─ How to notify                                            │
│ │   ├─ Email: [✓]                                           │
│ │   ├─ Push: [✓] (if available)                             │
│ │   └─ ntfy: [✓] (if enabled)                               │
│ └─ What to notify                                           │
│     ├─ Chat messages: [✓]                                   │
│     ├─ Reactions: [✓]                                       │
│     └─ DMs: [✓]                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Estimated:** ~300 lines (down from 480 + 135 = 615)

---

### Admin Panel (4 main tabs)

```
┌─────────────────────────────────────────────────────────────┐
│ 🛠️ Admin Panel                                              │
├────────┬────────┬────────┬────────┬─────────────────────────┤
│ 👥     │ 📋     │ 🎮     │ ⚙️      │                         │
│ People │ Content│ Games  │ System │                         │
├────────┴────────┴────────┴────────┴─────────────────────────┤
```

#### Tab 1: 👥 People (~400 lines)

Combines: Users + Invites + Competitors

```
▼ 👥 Members                                    [12 members]
  ├─ [Search/filter]
  └─ [Member cards with role toggles]

▼ ✉️ Invitations                               [3 pending]
  ├─ [Active invite codes]
  └─ [Create/send invite]

▼ 🎤 Competitors                               [Season 3]
  ├─ [Link external names to profiles]
  └─ [View all competitors]
```

#### Tab 2: 📋 Content (~500 lines)

Combines: Leagues + Rounds + Imports

```
▼ 🏆 Leagues                                   [2 leagues]
  ├─ [League cards with narrative editing]
  └─ [Season management]

▼ 🎵 Rounds                                    [Round 3 active]
  ├─ [Round status selector]
  ├─ [Theme/Winners image upload]
  ├─ [Playlist URLs]
  └─ [Narrative editing]

▼ 📥 Import Data
  ├─ [Import submissions]
  ├─ [Import votes]
  └─ [Process emails]
```

#### Tab 3: 🎮 Games & AI (~600 lines)

Combines: AI Settings + Minigames + Bonus

```
▼ 🎯 Guess the Submitter                      [Enabled ●]
  ├─ Available during: [Voting ▼]
  └─ Show leaderboard: [✓]

▼ ⏱️ Timeline Game                            [Enabled ●]
  ├─ Available during: [Voting ▼]
  ├─ Beta testers only: [✓]
  └─ [Manage Release Years →]

▼ 🏆 Round Challenge                          [Enabled ●]
  ├─ Available during: [Both ▼]
  └─ AI generates challenges: [✓]

▼ 🤖 AI Assistant                             [Enabled ●]
  ├─ Explain Theme: [✓]
  ├─ Get Hint: [✓]
  ├─ Check Song: [✓] (limit: 5/day)
  └─ Chat @AI Replies: [✓]

▼ 🎨 AI Images                                [Enabled ●]
  ├─ Theme images: [✓]
  ├─ Winners images: [✓]
  ├─ Model: [GPT-4o ▼]
  └─ Logo palette: [Ocean ▼]

▼ ⭐ Bonus Points
  ├─ [Award points form]
  └─ [Recent awards list]
```

#### Tab 4: ⚙️ System (~200 lines)

New tab for dev/testing/advanced

```
▼ 🧪 Testing (Dev only)
  ├─ Seed test data
  └─ Clear test data

▼ 📊 Diagnostics
  ├─ Email processing status
  └─ API health check

▼ 🔧 Advanced
  └─ [Future: export data, etc.]
```

---

## Summary

### Before
| Area | Files | Lines | Tabs |
|------|-------|-------|------|
| User Settings | 2 | 615 | 5 cards |
| Admin Panel | 1 | 5,158 | 9 tabs |
| **Total** | **3** | **5,773** | **14 sections** |

### After
| Area | Files | Lines | Tabs |
|------|-------|-------|------|
| User Settings | 3-4 | ~300 | 4 sections |
| Admin Panel | 8-10 | ~1,700 | 4 tabs |
| Shared Components | 6 | ~400 | - |
| **Total** | **~18** | **~2,400** | **8 sections** |

**Net reduction:** ~3,400 lines (59% smaller)
**Better organization:** 4 admin tabs (down from 9)

---

## Color Coding Proposal

| Tab/Section | Color | Reasoning |
|-------------|-------|-----------|
| 👥 People | Blue | Trust, community |
| 📋 Content | Green | Growth, content |
| 🎮 Games | Purple | Fun, creativity |
| ⚙️ System | Gray | Utility, technical |
| 🔔 Notifications | Orange | Attention |
| 🎵 Music | Coral/Red | Energy, music |

Applied as subtle left border or header tint, not overwhelming.

---

## Migration Path

1. **Phase 0:** Build shared components (AdminSection, AdminToggle, etc.)
2. **Phase 1:** Create new user Settings page with consolidated sections
3. **Phase 2:** Create Admin /admin-v2 route with 4-tab structure
4. **Phase 3:** Migrate content tab-by-tab (People first, then Content, etc.)
5. **Phase 4:** Add feature flag to switch between old/new
6. **Phase 5:** Polish, test, launch
7. **Phase 6:** Remove old AdminPage

---

## Decisions Made

1. **Release Years** → Move to Timeline Game section in Games tab ✓
2. **Test Notifications** → Keep for each user (they may want to test their own topics) ✓
3. **Mobile-first design** → Design for mobile, adapt to desktop ✓
4. **Competitor linking** → Will redesign/simplify ✓

## Features Being Removed

### 1. Relationship/Connections UI (Users tab)
- **What:** Complex UI for defining relationships between members
- **Options:** 24 types (Partner, Spouse, Sibling, Parent, Child, etc.)
- **Why remove:** Only used for a few "couple" type awards, adds significant complexity
- **Impact:** Some awards may need alternative data source or be retired
- **Lines saved:** ~150

### 2. AI Image Traits JSON (Competitors tab)
- **What:** Textarea for entering JSON descriptions per competitor
- **Example:** `{"Age":"27","Gender":"NB","Hair style":"cropped blonde"}`
- **Why remove:** Clunky UX, AI image results aren't producing interesting output anyway
- **Impact:** AI images will use simpler/default prompts
- **Lines saved:** ~100

### Total lines removed by feature cuts: ~250
