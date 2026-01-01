# Stats Dashboard Visual Mockup

## Overview

The Stats Dashboard is a comprehensive analytics screen designed with a modern, card-based interface that emphasizes visual data representation through progress bars, charts, badges, and ranking displays.

## Design System Integration

### Color Palette

```
Primary Navy:     #0A1A2F (text, accents, headings)
Accent Blue:      #11C1EC (highlights, gradients, charts)
Coral Accent:     #FF6F61 (secondary gradient color)
Success Green:    #2ECC71 (achievements, earned badges)
Warning Yellow:   #FFD700 (podium highlights, medals)

Neutrals:
- Background:     #F7FAFC (light gray-blue)
- Surface:        #FFFFFF (cards, panels)
- Border:         rgba(10, 26, 47, 0.08) (subtle borders)
- Muted Text:     rgba(10, 26, 47, 0.6) (secondary text)
```

### Typography

```
Font Family:      System font stack (San Francisco, Segoe UI, Roboto)

Headings:
- H1 (Page Title):     2rem (32px), weight 700
- H2 (Section):        1.5rem (24px), weight 700
- H3 (Card Title):     1.125rem (18px), weight 600

Body:
- Regular:             1rem (16px), weight 400
- Small:               0.875rem (14px), weight 400
- Tiny:                0.75rem (12px), weight 600 (labels, badges)

Stats Display:
- Large Numbers:       2.5rem (40px), weight 700
- Medium Numbers:      2rem (32px), weight 700
```

### Spacing System

```
Base Unit: 4px

Gap Sizes:
- XS: 4px   (tight inline elements)
- S:  8px   (related items)
- M:  12px  (default gap)
- L:  16px  (card padding)
- XL: 24px  (section spacing)
- XXL: 32px (major sections)

Card Padding:
- Default: 24px
- Compact: 18px
- Dense:   16px
```

### Border Radius

```
- Small:    8px   (buttons, badges)
- Medium:   12px  (cards, inputs)
- Large:    16px  (major containers)
- Pill:     999px (tab buttons, badges)
```

## Screen Layout

```
┌─────────────────────────────────────────────────────────────┐
│ TOP BAR (optional, depends on app shell)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Stats Dashboard                                          │
│  Your Music League analytics and achievements                │
│                                                              │
│  ┌──────────┬──────────────┬─────────────┬───────────────┐ │
│  │ Overview │ Achievements │ Leaderboard │ Hall of Fame  │ │
│  └──────────┴──────────────┴─────────────┴───────────────┘ │
│                                                              │
│  [ACTIVE TAB CONTENT AREA]                                   │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ BOTTOM NAVIGATION                                            │
│  💬 Chat    📊 Stats    📚 History    👤 Profile            │
└─────────────────────────────────────────────────────────────┘
```

## Tab 1: Overview Panel

### Personal Stats Grid (4 Cards)

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│      🎯         │ │      🏆         │ │      📊         │ │      🎵         │
│                 │ │                 │ │                 │ │                 │
│      245        │ │       3         │ │      3.4        │ │       12        │
│  TOTAL POINTS   │ │      WINS       │ │  AVG PLACEMENT  │ │  ROUNDS PLAYED  │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
  Gradient BG          Gradient BG         White BG            White BG
```

**Visual Details:**
- First two cards have gradient background: `linear-gradient(135deg, rgba(17, 193, 236, 0.12), rgba(255, 111, 97, 0.12))`
- Large emoji icon at top (2.5rem)
- Stat value in navy, 2.5rem, bold
- Label in uppercase, small, muted color
- Hover effect: translateY(-4px) + shadow
- Subtle border on all cards

### Favorite Genres Card

```
┌───────────────────────────────────────────────────────────┐
│ Your Favorite Genres                                       │
│                                                            │
│ #1  Indie Rock      ████████████████████████████  12      │
│ #2  Synth Pop       █████████████████  8                  │
│ #3  Alternative     ████████████  6                       │
│ #4  Electronic      █████████  5                          │
│ #5  Jazz            ██████  4                             │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

**Visual Details:**
- White card background, 24px padding
- Each row: rank number (bold navy) | genre name (semibold) | progress bar | count
- Progress bars:
  - Container: light gray background, 32px height, rounded
  - Fill: gradient from accent to navy
  - Shimmer animation overlay
  - Smooth width transition (0.6s ease)
- Grid layout: `auto 1fr auto` with 16px gaps

### Performance Over Time Chart

```
┌───────────────────────────────────────────────────────────┐
│ Performance Over Time                                      │
│                                                            │
│  ┃    ┃    ┃                                              │
│  ┃    ┃    ┃    ┃    ┃    ┃         ┃    ┃         ┃    │
│  ┃    ┃    ┃    ┃    ┃    ┃    ┃    ┃    ┃    ┃    ┃    │
│ ▂┃▁  ▂┃▁  ▂┃▁  ▂┃▁  ▂┃▁  ▂┃▁  ▂┃▁  ▂┃▁  ▂┃▁  ▂┃▁  ▂┃▁  │
│  R1   R2   R3   R4   R5   R6   R7   R8   R9   R10  R11   │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

**Visual Details:**
- Horizontal scrollable area (mobile-friendly)
- Chart bars:
  - Gradient fill: accent to navy (top to bottom)
  - Max width: 48px
  - Border radius: 8px on top
  - Drop shadow for depth
  - Hover: scaleY(1.05) + stronger shadow
- Tooltip on hover:
  - Dark navy background
  - White text
  - Shows: Round number, points, placement
  - Triangle pointer at bottom
  - Smooth opacity transition
- Round labels below bars (small, muted)

## Tab 2: Achievements Panel

### Header Section

```
┌───────────────────────────────────────────────────────────┐
│ Your Achievements                          ┌──────────────┐│
│                                            │ 3 / 6 Earned ││
│                                            └──────────────┘│
└───────────────────────────────────────────────────────────┘
```

### Achievement Cards Grid

```
┌────────────────────────────┐ ┌────────────────────────────┐
│ 🏆  First Victory          │ │ 🔥  Hot Streak             │
│     Win your first round   │ │     Top 3 in 3 consecutive │
│                            │ │                            │
│     MILESTONE              │ │     PERFORMANCE            │
│     Progress: 0%           │ │     ████████████░░  66%    │
│     ▱▱▱▱▱▱▱▱▱▱  0%        │ │                            │
└────────────────────────────┘ └────────────────────────────┘
  Locked (grayscale icon)        Locked (in progress)

┌────────────────────────────┐ ┌────────────────────────────┐
│ 🎨  Creative Mind          │ │ 🌍  Genre Explorer         │
│     Receive 10+ creative   │ │     Submit 10 genres       │
│     comments               │ │                            │
│     SOCIAL                 │ │     DISCOVERY              │
│     ✓ Earned  2024-12-15   │ │     ███████░░░  70%        │
│     ████████████  100%     │ │                            │
└────────────────────────────┘ └────────────────────────────┘
  Earned (green accent)          Locked (in progress)
```

**Visual Details:**

**Earned Achievements:**
- Background: `linear-gradient(135deg, rgba(46, 204, 113, 0.08), rgba(52, 211, 153, 0.08))`
- Border: 2px solid green
- Top border accent: 4px green gradient bar
- Icon: full color, full opacity
- Badge: green background, dark green text, "✓ Earned"
- Date: small, muted

**Locked Achievements:**
- Background: light gray
- Border: subtle gray
- Icon: grayscale filter, 40% opacity
- Progress bar: gradient fill, gray container
- Percentage label below bar

**Layout:**
- Grid: `repeat(auto-fill, minmax(280px, 1fr))`
- Card padding: 24px
- Icon size: 3rem
- Hover: translateY(-4px) + shadow

## Tab 3: Leaderboard Panel

```
┌───────────────────────────────────────────────────────────────────────┐
│ Family Rankings                                                        │
│                                                                        │
│ ┌──────┬─────────────────┬────────┬──────┬───────────┬─────────────┐│
│ │ RANK │ MEMBER          │ POINTS │ WINS │ AVG PLACE │ ROUNDS      ││
│ ├──────┼─────────────────┼────────┼──────┼───────────┼─────────────┤│
│ │  🥇  │ Sarah Johnson   │  342   │  5   │   2.1     │     15      ││
│ │  🥈  │ Mike Thompson   │  318   │  3   │   2.8     │     15      ││
│ │  🥉  │ Emma Davis      │  297   │  2   │   3.2     │     14      ││
│ │  #4  │ Alex Chen       │  245   │  1   │   3.9     │     12      ││
│ │  #5  │ Jordan Lee      │  223   │  0   │   4.5     │     13      ││
│ └──────┴─────────────────┴────────┴──────┴───────────┴─────────────┘│
└───────────────────────────────────────────────────────────────────────┘
```

**Visual Details:**
- White card with no internal padding
- Header row:
  - Gray background
  - Bold, uppercase, small text
  - 2px bottom border
- Data rows:
  - Hover: light gray background
  - Bottom border separator (subtle)
  - Alternating row colors optional
- Podium rows (top 3):
  - Gold gradient background (very subtle)
  - Medal emojis: 2rem size
- Regular rows:
  - Rank as #4, #5, etc.
  - Smaller font weight
- Points column:
  - Bold, larger font
  - Navy color
- Member names:
  - Bold, 1.125rem
  - Navy color

## Tab 4: Hall of Fame Panel

```
┌───────────────────────────────────────────────────────────┐
│ Hall of Fame                                               │
│ Top-scoring songs across all rounds                        │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ 🥇  Bohemian Rhapsody                         ┌────┐  ││
│ │     Queen                                     │ 45 │  ││
│ │     Submitted by Sarah • Classic Rock Anthems│ pts│  ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ 🥈  Don't Stop Me Now                         ┌────┐  ││
│ │     Queen                                     │ 42 │  ││
│ │     Submitted by Mike • Feel-Good Songs      │ pts│  ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ 🥉  Mr. Blue Sky                              ┌────┐  ││
│ │     Electric Light Orchestra                 │ 38 │  ││
│ │     Submitted by Emma • Songs That Make You Happy│  ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ #4  Come Together                             ┌────┐  ││
│ │     The Beatles                               │ 35 │  ││
│ │     Submitted by Alex • Groove Central       │ pts│  ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
└───────────────────────────────────────────────────────────┘
```

**Visual Details:**

**Top 3 Cards:**
- Background: gold gradient (very subtle)
- Left border accent: 4px gold gradient
- Medal emoji: 2.5rem, drop shadow
- Enhanced hover effect

**Regular Cards:**
- White background
- Subtle border
- Rank number: large, gray, muted

**Card Layout:**
- Grid: `60px 1fr auto`
- Medal/Rank | Content | Points
- 20-24px padding
- 16px gap between sections

**Content Section:**
- Song title: 1.25rem, bold, navy
- Artist: 1rem, regular, dark gray
- Meta info: 0.875rem, muted
- Submitter bold, theme normal
- Dot separator between items

**Points Badge:**
- Large number: 2rem, bold, navy
- Background: gradient box with border
- Rounded corners: 12px
- "pts" label below in small uppercase

**Interactions:**
- Hover: translateX(8px) to the right
- Shadow increases on hover
- Smooth all transitions (0.3s ease)

## Responsive Breakpoints

### Mobile (< 480px)
```
- Stats grid: 1 column
- Genre items: stack vertically
- Chart bars: 32px max width
- Achievements: 1 column
- Leaderboard: hide avg placement and rounds columns
- Hall of Fame: points badge below content
- Tab text: 0.875rem
```

### Tablet (481px - 768px)
```
- Stats grid: 2x2
- Genre items: horizontal layout
- Chart bars: 40px max width
- Achievements: 2 columns
- Leaderboard: hide rounds column
- Hall of Fame: 2-column grid on larger tablets
```

### Desktop (> 768px)
```
- Stats grid: 4 columns
- Full feature display
- Chart bars: 48px max width
- Achievements: 3+ columns
- Leaderboard: all columns visible
- Hall of Fame: single column, wider cards
```

## Animations & Transitions

### Page Load
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Applied to tab panels */
animation: fadeIn 0.3s ease-in;
```

### Progress Bars
```css
/* Width transitions */
transition: width 0.6s ease;

/* Shimmer effect */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### Hover States
```css
/* Cards */
transform: translateY(-4px);
box-shadow: 0 8px 24px rgba(10, 26, 47, 0.12);
transition: all 0.3s ease;

/* Hall of Fame */
transform: translateX(8px);

/* Chart bars */
transform: scaleY(1.05);
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

## Accessibility Highlights

### Color Contrast
- All text meets WCAG AA (4.5:1 for normal text)
- Interactive elements meet AAA when possible
- Icons not the sole indicator (text labels always present)

### Focus Indicators
```css
:focus-visible {
  outline: 3px solid var(--navy);
  outline-offset: 4px;
  border-radius: 4px;
}
```

### Screen Reader Support
- Semantic HTML (`<nav>`, `<main>`, `<section>`)
- ARIA labels on all interactive elements
- Progress bars with `aria-valuenow/min/max`
- Table semantics for leaderboard
- Live regions for dynamic updates

## Dark Mode Consideration

While not implemented in current version, the color system is designed to support dark mode:

```css
@media (prefers-color-scheme: dark) {
  --background: #0A1A2F;
  --surface: #1A2A3F;
  --text-primary: #F7FAFC;
  --border: rgba(255, 255, 255, 0.1);
  /* Adjust gradients and shadows */
}
```

## Print Styles

```css
@media print {
  .stats-tabs { display: none; }
  .stats-panel { display: block !important; }
  .stat-card,
  .achievement-card,
  .hall-of-fame-card {
    page-break-inside: avoid;
  }
}
```

This ensures the dashboard can be printed for offline reference or sharing.
