# Talking Music League - UI Wireframe (Current Build)

## ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TM  Talking Music League   Your family's league, connected.       [Avatar]   │
│                                                           Settings  Sign out │
└──────────────────────────────────────────────────────────────────────────────┘

┌───────────────┐   ┌───────────────────────────────────────────────────────┐
│ Dashboard     │   │ Welcome back                                          │
│ Group Chat    │   │ Keep the league moving with the next best action.     │
│ Leaderboard   │   │ [Generate Invite]* [Add Round]* [Link League]*         │
│               │   └───────────────────────────────────────────────────────┘
│ Profile       │
│ Settings      │   ┌───────────────────────┐  ┌───────────────────────────┐
└───────────────┘   │ Current Round         │  │ Group Chat (Preview)       │
                    │ Theme + status pill   │  │ last 3 messages            │
                    │ deadlines + link      │  │ [Open group chat]          │
                    └───────────────────────┘  └───────────────────────────┘

                    ┌───────────────────────┐  ┌───────────────────────────┐
                    │ League Snapshot       │  │ Getting Started            │
                    │ linked league name    │  │ steps checklist            │
                    └───────────────────────┘  └───────────────────────────┘

                    ┌───────────────────────┐  ┌───────────────────────────┐
                    │ Season Competitors*   │  │ Import Current Season*     │
                    │ chips + add/import    │  │ CSV upload (4 files)       │
                    └───────────────────────┘  └───────────────────────────┘

                    ┌───────────────────────────────────────────────────────┐
                    │ Song Connection (admin button: Regenerate)            │
                    │ Round + two songs + OpenRouter connection             │
                    └───────────────────────────────────────────────────────┘

                    ┌───────────────────────────────────────────────────────┐
                    │ Season 1 Recap                                          │
                    │ stats pills: rounds / submissions / votes              │
                    │ Top Submitters | Top Tracks | Vote Tendencies | Decades│
                    └───────────────────────────────────────────────────────┘

                    ┌───────────────────────────────────────────────────────┐
                    │ Your Season 1 Picks                                    │
                    │ list of your songs + who you voted most/least for     │
                    └───────────────────────────────────────────────────────┘

                    ┌───────────────────────────────────────────────────────┐
                    │ Season 1 Rounds                                        │
                    │ round card w/ submissions + Round Chat at bottom       │
                    └───────────────────────────────────────────────────────┘
```

Legend:
- `*` = admin-only controls (lead role)

## Mermaid UI Flow

```mermaid
flowchart TD
  A[Login / Sign Up] -->|Google| B[Onboarding]
  A -->|Email/Password| B
  B --> C[Dashboard]

  C --> D[Current Round]
  C --> E[Group Chat Preview]
  C --> F[League Snapshot]
  C --> G[Getting Started]
  C --> H[Season Competitors]*
  C --> I[Import Current Season]*
  C --> J[Song Connection]*
  C --> K[Season 1 Recap]
  C --> L[Your Season 1 Picks]
  C --> M[Season 1 Rounds]

  D --> N[Round Detail]
  N --> O[Submissions]
  N --> P[Round Comments]

  E --> Q[Group Chat]

  C --> R[Profile]
  C --> S[Settings]

  classDef adminOnly fill:#FF6F61,stroke:#0A1A2F,color:#0A1A2F;
  class H,I,J adminOnly;
```
