# Awards System Roadmap

This document captures planned enhancements to the awards system for future implementation.

---

## 1. Trophy Modal Info by Category

### Goal
Each award modal should display only information pertinent to that award type. Currently modals show generic info; we want contextual data.

### Approach: Category-Based Modal Templates

| Category | Modal Info to Display |
|----------|----------------------|
| **performance** | Track name, artist, final rank, total points, margin over next place |
| **voting_behavior** | Voter name, their vote breakdown (which tracks, how many points each), comparison to average |
| **submission_style** | Track details (release year, genre, comment length), comparison to round average |
| **social** | Comment count, comment excerpts, engagement metrics |
| **timing** | Timestamp of action, time relative to deadline, comparison to others |
| **relationship** | Both parties involved, points exchanged, their averages for context |
| **theme** | Theme creator, theme description, relevant timing or ranking stats |

### Database Changes Needed

```sql
-- Option A: Add modal_context JSONB to round_awards table
ALTER TABLE round_awards ADD COLUMN modal_context JSONB;

-- Example stored data:
-- For Kingmaker: {"voted_for": "Song Name", "points_given": 8, "winner_margin": 2, "tooltip": "Without this vote, 2nd place would have won"}
-- For Underdog: {"final_rank": 3, "season_standing": 8, "standing_percentile": "bottom 40%"}
```

### Implementation Steps
1. Update award calculation logic to capture context data
2. Store context in `modal_context` JSONB field when award is assigned
3. Update TrophyModal component to render category-specific templates
4. Add tooltip support for "qualifier" explanations

---

## 2. The Underdog - Criterion Update

### Current
"Lowest average vote that still cracked the top 3"

### Proposed
"Someone from the bottom half of season standings who made the podium (1st, 2nd, or 3rd)"

### Implementation
- Requires checking cumulative season standings at time of round
- Calculate standing_rank / total_players to get percentile
- Qualify if standing_percentile > 0.5 AND round_rank <= 3

---

## 3. Season-Long Awards (20+ Awards)

These are calculated at season end (or live during season for "Current Season" card).

### Performance Awards

| # | Name | Description | Calculation |
|---|------|-------------|-------------|
| 1 | **The Champion** | Season winner by total points | `max(sum(points))` |
| 2 | **The Bridesmaid** | 2nd place overall | `rank(sum(points)) == 2` |
| 3 | **The Dark Horse** | Biggest jump from first half to second half standings | Compare mid-season rank to final rank |
| 4 | **The Frontrunner** | Led standings the most weeks | `max(count(weeks_in_first))` |
| 5 | **The Closer** | Won the most rounds in the back half | `count(wins WHERE round > midpoint)` |
| 6 | **Mr./Ms. Consistent** | Lowest standard deviation in round rankings | `min(stdev(ranks))` - always middle of pack |
| 7 | **The Rollercoaster** | Highest variance in round rankings | `max(stdev(ranks))` - wild swings |
| 8 | **Most Improved** | Biggest positive trend line in rankings over season | Linear regression on weekly rankings |
| 9 | **The Veteran** | Participated in most rounds | `max(count(submissions))` |
| 10 | **Podium Regular** | Most top-3 finishes | `max(count(rank <= 3))` |

### Voting Awards

| # | Name | Description | Calculation |
|---|------|-------------|-------------|
| 11 | **The Kingmaker (Season)** | Most times their vote decided the winner | `count(kingmaker_awards)` |
| 12 | **The Prophet (Season)** | Highest accuracy predicting winners | `count(gave_max_to_winner) / rounds` |
| 13 | **The Generous Soul (Season)** | Highest total points given all season | `sum(all_votes)` |
| 14 | **The Critic (Season)** | Most vote comments written | `count(vote_comments)` |
| 15 | **The Silent Voter** | Fewest comments all season | `min(count(comments))` |

### Submission Awards

| # | Name | Description | Calculation |
|---|------|-------------|-------------|
| 16 | **The Archaeologist (Season)** | Oldest average track release year | `min(avg(release_year))` |
| 17 | **The Trendsetter** | Newest average track release year | `max(avg(release_year))` |
| 18 | **Genre Explorer** | Most unique genres submitted | `max(count(distinct(genres)))` |
| 19 | **The Loyalist** | Most repeat artists submitted | `max(count(repeat_artists))` |
| 20 | **The Novelist (Season)** | Highest total word count in submission comments | `max(sum(word_count(comments)))` |

### Social/Engagement Awards

| # | Name | Description | Calculation |
|---|------|-------------|-------------|
| 21 | **The Hype Man (Season)** | Most total vote comments | `max(count(vote_comments))` |
| 22 | **The Polarizer** | Most "Controversial Pick" awards | Track with highest total variance |
| 23 | **Fan Favorite** | Most "Universal Appeal" awards | Track that got points from everyone most often |

### Timing Awards

| # | Name | Description | Calculation |
|---|------|-------------|-------------|
| 24 | **The Early Bird (Season)** | Most "first to vote" awards | `count(early_bird_awards)` |
| 25 | **The Procrastinator (Season)** | Most "last to submit" awards | `count(procrastinator_awards)` |

### Relationship Awards

| # | Name | Description | Calculation |
|---|------|-------------|-------------|
| 26 | **The Supporter (Season)** | Gave partner/family highest points relative to baseline | Avg points to family vs avg overall |
| 27 | **Keeping It Honest (Season)** | Most fair voter to family (closest to their baseline) | Smallest deviation when voting family |

### Fun/Unique Awards

| # | Name | Description | Calculation |
|---|------|-------------|-------------|
| 28 | **The Comeback King/Queen** | Most dramatic single-round improvement | `max(prev_rank - current_rank)` |
| 29 | **Zero to Hero (Season)** | Most times getting 0s but still finishing strong | `count(zero_to_hero_awards)` |
| 30 | **The Wildcard** | Hardest voting pattern to predict | Lowest correlation with group average |

---

## 4. Current Season Card Implementation

### Features
- Display on History page above round cards
- Show current standings (top 5)
- Show "live" season awards that update after each round
- Encourage users to aim for specific awards

### Awards to Show Live
- Current leader (The Frontrunner)
- Most wins so far
- Most top-3 finishes
- Most "X" awards accumulated
- Trending awards (who's on track to win what)

### UI Concept
```
┌─────────────────────────────────────────┐
│  SEASON 3 - IN PROGRESS                 │
│  Round 7 of 12                          │
├─────────────────────────────────────────┤
│  🏆 Current Leader: Matt (142 pts)      │
│  📈 Most Wins: Sarah (3)                │
│  🎯 Podium Regular: Greg (5 top-3s)     │
│  🔮 Prophet Leader: Kristin (71% acc)   │
├─────────────────────────────────────────┤
│  AWARDS IN REACH                        │
│  • Dark Horse: You're 2 spots from it   │
│  • Genre Explorer: Submit 1 more genre  │
└─────────────────────────────────────────┘
```

---

## 5. Database Schema Additions

```sql
-- Season awards table
CREATE TABLE season_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  award_id INTEGER NOT NULL,
  award_name TEXT NOT NULL,
  recipient_id UUID REFERENCES profiles(id),
  recipient_name TEXT,
  context JSONB, -- award-specific data
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Track award counts for season aggregation
CREATE TABLE award_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  award_id INTEGER NOT NULL,
  count INTEGER DEFAULT 0,
  UNIQUE(league_id, user_id, award_id)
);
```

---

## 6. Implementation Priority Order

1. **Phase 1: Modal Context** - Add `modal_context` to round_awards, update calculation to populate it
2. **Phase 2: Category Templates** - Update TrophyModal to render based on category
3. **Phase 3: Underdog Fix** - Update criterion to use season standings
4. **Phase 4: Season Awards Schema** - Add tables for season-level awards
5. **Phase 5: Season Award Calculations** - Implement the 30 season awards
6. **Phase 6: Current Season Card** - UI component showing live season progress
7. **Phase 7: "Awards in Reach"** - Gamification showing what users can still win

---

## Notes

- Season awards should regenerate after each round finishes
- Consider caching award calculations for performance
- Trophy images: Can reuse round award trophies where applicable, create new ones for season-specific awards
- The "Awards in Reach" feature is optional gamification that could drive engagement
