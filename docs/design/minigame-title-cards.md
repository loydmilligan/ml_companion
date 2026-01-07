# Minigame Title Cards - Design Brief

## Project Context

**App:** Talking Music League - A companion app for Music League (a social music sharing game where friends submit songs to themed rounds and vote on each other's picks)

**Purpose:** The app enhances the Music League experience with chat, round tracking, and **minigames** that add fun competitive elements during voting/reveal phases.

**Visual Style:** Modern, dark-themed UI with accent colors. Think Spotify meets Discord.

---

## The Minigames

We have 3 minigames that need title card graphics:

### 1. Timeline Game
- **What it is:** Players arrange songs from the current round in chronological order by release year (oldest to newest)
- **Gameplay:** Drag-and-drop sorting interface, 2 attempts allowed
- **When shown:** During voting and revealed phases
- **Vibe:** Historical, chronological, time-based puzzle

### 2. Round Challenge
- **What it is:** AI picks 2 random songs from previous rounds and players guess which theme/round each song was from
- **Gameplay:** Multiple choice guessing game
- **When shown:** During submission phase (open)
- **Vibe:** Trivia, memory challenge, "name that round"

### 3. Guess the Submitter
- **What it is:** Players guess who submitted each song before results are revealed
- **Gameplay:** Dropdown selector per song, scored on accuracy
- **When shown:** During voting and revealed phases
- **Vibe:** Detective work, social deduction, "who picked this?"

---

## Current Implementation

### Container Dimensions
The minigame cards appear inside a collapsible "Minigames" section in a slide-out panel.

**Panel width:**
- Mobile: `85vw` (e.g., ~320px on a 375px phone)
- Desktop max: `400px`

**Content area** (after padding):
- Usable width: ~260-340px depending on viewport

**Current card height:** ~48-80px (varies by game)

### Current Code Structure

```tsx
{/* Inside CollapsibleSection id="minigames" */}

{/* Timeline Game - currently a button */}
<div className="minigame-item">
  <button className="timeline-game-button">
    <span className="timeline-game-icon">📅</span>
    <span>Timeline Game</span>
  </button>
</div>

{/* Round Challenge - renders its own component */}
<div className="minigame-item">
  <RoundChallenge ... />
</div>

{/* Guess the Submitter - header with score */}
<div className="minigame-item submitter-guess-header-section">
  <div className="submitter-guess-header">
    <h4><span>🔍</span> Guess the Submitter</h4>
    <span className="submitter-guess-score">10/10 guessed</span>
  </div>
  ...
</div>
```

### Current Styling

```css
.minigame-item {
  margin-bottom: 12px;
}

.timeline-game-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}
```

---

## Recommended Title Card Specifications

### Image Dimensions

**Generate at 3x resolution:** `1020 x 300px`

We'll create a responsive image set from the 3x source:

| Version | Dimensions | Use Case |
|---------|------------|----------|
| 1x | 340 x 100px | Standard displays |
| 2x | 680 x 200px | Retina displays |
| 3x | 1020 x 300px | High-DPI mobile (iPhone Pro, Pixel, etc.) |

**Aspect ratio:** 3.4:1 (stays consistent across all sizes)

**Safe area:** Keep important visual elements away from edges (~60px margin at 3x)

### File Format
- **Format:** PNG with transparency OR JPG with dark background
- **Optimization:** Run through ImageOptim or similar
- **Target sizes:**
  - 3x: <80KB
  - 2x: <50KB
  - 1x: <25KB

### Responsive Implementation

```tsx
<img
  src="/images/minigames/timeline-game.png"
  srcSet="/images/minigames/timeline-game.png 1x,
          /images/minigames/timeline-game@2x.png 2x,
          /images/minigames/timeline-game@3x.png 3x"
  alt="Timeline Game"
/>
```

### Color Palette (Dark Theme)
```
Background:     #1a1a2e (dark navy)
Surface:        #16213e (slightly lighter navy)
Accent Primary: #6366f1 (indigo/purple)
Accent Alt:     #22c55e (green for success states)
Text Primary:   #f8fafc (near white)
Text Muted:     #94a3b8 (gray)
```

---

## Implementation Approach

### Option A: Background Image with Text Overlay (Recommended)
Keep the title text in code for accessibility/flexibility, use image as background.

```tsx
<button
  className="minigame-card timeline-game"
  style={{ backgroundImage: 'url(/images/minigames/timeline-bg.png)' }}
>
  <span className="minigame-card-title">Timeline Game</span>
  <span className="minigame-card-subtitle">Arrange by release year</span>
</button>
```

```css
.minigame-card {
  width: 100%;
  height: 100px;
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 16px 20px;
  position: relative;
  overflow: hidden;
}

.minigame-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.3));
}

.minigame-card-title {
  position: relative;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.minigame-card-subtitle {
  position: relative;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.8);
  margin-top: 4px;
}
```

### Option B: Full Title Card Images
Generate complete cards with text baked in. Simpler but less flexible.

```tsx
<button className="minigame-card">
  <img src="/images/minigames/timeline-card.png" alt="Timeline Game" />
</button>
```

---

## Design Direction for AI Image Generation

### General Style
- **Aesthetic:** Modern, sleek, game-like but not childish
- **Mood:** Fun but sophisticated (adults playing music games)
- **Inspiration:** Spotify Wrapped cards, Discord Nitro banners, mobile game UI

### Timeline Game
**Prompt ideas:**
- Vinyl records floating through time, clock elements, timeline/arrow motifs
- Musical notes on a horizontal timeline
- Retro-to-modern gradient with music iconography
- Colors: Purple/blue gradients, gold accents for "classic" feel

### Round Challenge
**Prompt ideas:**
- Quiz show aesthetic, question marks, spotlights
- Two cards/choices being weighed
- Brain/lightbulb with music notes
- Colors: Bright, energetic, quiz-show gold and purple

### Guess the Submitter
**Prompt ideas:**
- Silhouettes of people with question marks
- Detective/mystery aesthetic (magnifying glass, fingerprints)
- Social/connection imagery with hidden identities
- Colors: Mysterious blues, subtle greens

---

## File Locations

Place generated images in:
```
web/public/images/minigames/
  timeline-bg.png
  round-challenge-bg.png
  guess-submitter-bg.png
```

---

---

## Ready-to-Use Prompts

Copy and paste these directly into your AI image generator.

---

### Timeline Game

```
Create a horizontal banner image for a music game UI.

CONCEPT: "Timeline Game" - players arrange songs by release year, oldest to newest

VISUAL ELEMENTS:
- Vinyl records or album covers floating/arranged horizontally
- Subtle timeline or arrow motif suggesting chronological order
- Clock hands, hourglasses, or calendar elements as accents
- Musical notes scattered tastefully

STYLE:
- Modern, sleek, game-like but sophisticated (for adults)
- Dark navy background (#1a1a2e)
- Purple/indigo (#6366f1) and blue gradient accents
- Subtle gold highlights for "classic/vintage" feel
- Slight glow effects, polished aesthetic

SPECS:
- Dimensions: 1020 x 300 pixels (3.4:1 aspect ratio)
- NO TEXT - leave space for text overlay
- Keep main visual interest in center, fade to darker at edges
- Safe margins: 60px from all edges

OUTPUT: PNG with slight transparency at edges, or solid dark background
```

---

### Round Challenge

```
Create a horizontal banner image for a music trivia game UI.

CONCEPT: "Round Challenge" - players guess which themed round a song came from

VISUAL ELEMENTS:
- Quiz show / trivia aesthetic
- Two cards or choices being presented/compared
- Spotlights or stage lighting effects
- Question mark motifs (subtle, not cartoonish)
- Musical notes and sound wave elements
- Brain or lightbulb imagery (optional)

STYLE:
- Energetic but sophisticated game show vibe
- Dark navy background (#1a1a2e)
- Purple (#6366f1) and gold/amber accent colors
- Dramatic lighting, slight lens flare effects
- Modern and polished, not retro game show

SPECS:
- Dimensions: 1020 x 300 pixels (3.4:1 aspect ratio)
- NO TEXT - leave space for text overlay
- Keep main visual interest in center, fade to darker at edges
- Safe margins: 60px from all edges

OUTPUT: PNG with slight transparency at edges, or solid dark background
```

---

### Guess the Submitter

```
Create a horizontal banner image for a social deduction music game UI.

CONCEPT: "Guess the Submitter" - players guess which friend submitted each song

VISUAL ELEMENTS:
- Silhouettes of people with question marks over faces
- Magnifying glass or detective aesthetic
- Fingerprint or identity-hint imagery
- Musical notes connecting silhouettes
- Mystery/reveal visual metaphor (curtain, spotlight on hidden figure)

STYLE:
- Mysterious, intriguing, social/detective vibe
- Dark navy background (#1a1a2e)
- Cool blues and teals with hints of green (#22c55e)
- Subtle fog or mist effects
- Sophisticated mystery, not cartoon detective

SPECS:
- Dimensions: 1020 x 300 pixels (3.4:1 aspect ratio)
- NO TEXT - leave space for text overlay
- Keep main visual interest in center, fade to darker at edges
- Safe margins: 60px from all edges

OUTPUT: PNG with slight transparency at edges, or solid dark background
```

---

## Quick Reference Card

For AI tools that need shorter prompts:

| Game | Short Prompt |
|------|--------------|
| Timeline | `Dark navy banner 1020x300, vinyl records on horizontal timeline, purple/blue gradients, modern sleek game UI, no text` |
| Round Challenge | `Dark navy banner 1020x300, quiz show spotlights with musical notes, purple/gold accents, trivia game aesthetic, no text` |
| Guess the Submitter | `Dark navy banner 1020x300, silhouettes with question marks, magnifying glass, mystery detective music theme, teal accents, no text` |

---

## Notes

- Keep images abstract enough that they work across different themes/rounds
- Avoid any copyrighted album art or specific artist imagery
- Test at both mobile and desktop sizes before finalizing
- Consider generating a few variants to A/B test with users
