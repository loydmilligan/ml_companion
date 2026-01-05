# Current Season Card – Content & Prompt Guide

This document defines the structure, content ideas, and AI prompt patterns for the **Current Season Card** in the Music League Companion App.

The goal of the Current Season Card is to present a **living, narrative-driven snapshot of the season so far** — blending stats, social dynamics, and storytelling in a way that feels fun, personal, and debate‑worthy.

---

## 1. Purpose of the Current Season Card

The Current Season Card should:
- Update after every round
- Be skimmable at a glance, but rewarding when expanded
- Emphasize **momentum and story**, not just raw points
- Feel like a mix of sports recap, group‑chat gossip, and inside jokes

Think: **“Season So Far: The Headlines.”**

---

## 2. Core Sections to Include

### A. Season Snapshot (Always Visible)
**Purpose:** Immediate context in under 10 seconds.

**Suggested Fields**
- 🏆 **Current Leader** (total points + lead margin)
- 📈 **Biggest Mover This Round** (rank change)
- 🪵 **Last Place (For Now)**
- 🆕 **New Player Watch** (if applicable)
- 🎵 **Dominant Genre / Decade** this season

**Example Copy**
> “After 4 rounds, Greg holds a 27‑point lead — but last season taught us that no lead is ever safe.”

---

### B. Momentum Tracker
**Purpose:** Show trends instead of static rankings.

**What to Highlight**
- 🔥 **Hot Streaks** – multiple top‑3 finishes in a row
- ❄️ **Cooling Off** – early leaders losing steam
- 🚀 **Comebacks** – big week‑over‑week jumps

This section pairs naturally with awards like *Comeback Kid*, *Bridesmaid*, *Wooden Spoon*, and historical comparisons.

---

### C. Rotating Narrative Section
**Purpose:** This is the heart of the card — where AI storytelling shines.

Each round, surface **1–2 dominant storylines**, such as:
- A shocking landslide or photo finish
- A rivalry forming (or escalating)
- A theme that exposed people’s taste
- A voting scandal (snubs, kingmakers, contrarians)

**Example Angles**
- “This was the week the league turned on Sasha.”
- “Despite winning, Kristin may have revealed too much about herself.”
- “Lori once again proved that blood is not thicker than music.”

---

### D. AI Power Rankings (Not the Same as the Leaderboard)
**Purpose:** Spark debate.

Power Rankings should **not mirror total points**.

**Inputs to Consider**
- Recent performance (weighted heavily)
- Margin of wins and losses
- Awards signaling dominance, chaos, or consistency
- Historical performance from last season
- Theme‑creator advantages or struggles

**Example**
> “Mashew is 4th in points but ranked #2 here thanks to two dominant wins and zero wooden‑spoon energy.”

---

### E. Social & Relationship Dynamics
**Purpose:** Highlight the human side of the league.

Use:
- Relationship‑based voting patterns
- Mutual support or brutal honesty
- Guess‑the‑submitter accuracy (who is obvious vs unreadable)

**Examples**
- “Kristin and Mike continue to perfectly cancel each other out.”
- “Everyone thinks they know Greg’s taste. They are consistently wrong.”

---

### F. Season Awards Watch
**Purpose:** Make weekly awards feel cumulative and meaningful.

Track who is *on pace* to dominate certain categories:
- ⏰ Timing awards (early bird vs procrastinator)
- 🎭 Controversy & variance awards
- 🧠 Guess‑the‑submitter accuracy
- ❤️ Relationship‑based awards

This creates long‑term stakes beyond individual rounds.

---

### G. Historical Callback (One‑Liner)
**Purpose:** Add weight and continuity.

Examples:
- “At this point last season, the eventual winner was in 6th place.”
- “Only one player has ever recovered from a 40‑point deficit.”

---

## 3. Narrative Lenses (Rotate Weekly)

To avoid repetition, rotate the storytelling lens:

1. **Sports Broadcast** – analytical, hype‑driven
2. **Reality TV Confessional** – dramatic, personal
3. **Data Analyst** – stats‑forward, pattern‑focused
4. **Family Group Chat** – chaotic, affectionate roasting
5. **Myth‑Making** – legends, curses, turning points

You can explicitly pass a `narrative_mode` parameter to the AI.

---

## 4. Reusable AI Prompt Templates

### A. Current Season Card – Master Prompt
```
You are generating the "Current Season Card" for a private Music League.

Tone: witty, insightful, lightly roasting but affectionate.
Audience: close friends and family who know each other well.

You have access to:
- Current season cumulative scores and rankings
- Week-by-week results
- All awards won this season and historically
- Voting behavior, timing data, and relationships
- Last season’s full results
- Guess-the-submitter accuracy

Your task:
1. Summarize the current state of the season in 2–3 short sections.
2. Highlight momentum, not just rankings.
3. Identify 1–2 dominant storylines from the most recent round.
4. Include at least one historical comparison to last season.
5. Call out at least one relationship or social dynamic if relevant.
6. Keep it skimmable. No more than 250 words total.

Avoid generic phrases. Be specific.
```

---

### B. AI Power Rankings Prompt
```
Generate AI Power Rankings for the current season.

Do NOT simply mirror the points leaderboard.

Consider:
- Recent round performance (weighted higher)
- Average margin of victory or loss
- Awards indicating dominance, controversy, or consistency
- Historical performance from last season
- Voting behavior patterns

For each player:
- Rank them 1–10
- Include one sentence explaining why they are placed there
- Use confident, sports-analyst language
```

---

### C. Storyline Detection Prompt
```
From the most recent round, identify the top 2 storylines worth highlighting.

A storyline must be:
- Surprising OR
- Emotionally charged OR
- Socially awkward OR
- Statistically extreme

For each storyline:
- Give it a headline (max 8 words)
- Write a 2–3 sentence explanation
- Reference specific players, votes, or awards
```

---

### D. Season Awards Watch Prompt
```
Based on cumulative season data so far, identify which players are on pace to dominate end-of-season awards.

Focus on:
- Timing awards
- Voting behavior awards
- Relationship awards
- Controversial / variance-based awards

List up to 5 award races with short commentary.
```

---

## 5. UX Recommendation

Make the Current Season Card **collapsible**:
- **Default view:** Snapshot + one headline storyline
- **Expanded view:** Power rankings, awards watch, deeper stats

This keeps casual users engaged while rewarding power users.

---

*This document is intended to be implementation-ready and can be referenced directly by the AI system responsible for generating weekly season summaries.*

