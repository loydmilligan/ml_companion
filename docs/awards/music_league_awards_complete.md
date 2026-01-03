# Music League Awards

A collection of 53 weekly awards for Music League, with objective measurement criteria and AI image generation prompts for trophies.

---

## Categories

| Category | Description |
|----------|-------------|
| **Performance** | Based on how tracks placed in the rankings |
| **Voting Behavior** | Based on how a voter distributed their points |
| **Submission Style** | Based on track/artist/comment choices |
| **Social** | Based on engagement, comments, and interaction |
| **Timing** | Based on when submissions and votes were cast |
| **Relationship** | Based on voting patterns between couples, siblings, and family |

---

## Relationships

**Couples:** missmara112/Mashew, mmariani13/Kristin, gregamariani/margs

**Siblings:** jellydru/Sasha Mariana

**Parent-Child:** lorimariani → mmariani13, Mashew, gregamariani

---

## Performance Awards

### 1. The Landslide
**Description:** For the track that won by the largest margin. Dominant performance, no contest.

| Criteria | Details |
|----------|---------|
| Qualifies | Winning track's margin over 2nd place >= 5 points |
| Calculation | `margin = points_1st - points_2nd` |

**Trophy:** Miniature snow globe containing a mountain with rocks mid-avalanche, dramatic frozen motion, collectible figurine style, white background

---

### 2. Photo Finish
**Description:** For the closest race of the week. When 1-2 points separate the top spots.

| Criteria | Details |
|----------|---------|
| Qualifies | Margin between 1st and 2nd place <= 2 points |
| Calculation | `margin = points_1st - points_2nd <= 2` |

**Trophy:** Vintage polaroid camera with a photo emerging showing a tie, metallic gold finish, collectible object style, white background

---

### 3. The Underdog
**Description:** Lowest average vote that still cracked the top 3. Nobody saw it coming.

| Criteria | Details |
|----------|---------|
| Qualifies | Track finished top 3 AND had lowest avg points-per-vote among top 3 |
| Calculation | `avg_vote = sum(points) / count(votes)` for each top-3 track; pick min |

**Trophy:** Small scrappy terrier dog figurine wearing a golden crown, standing proud, ceramic collectible style, white background

---

### 4. Zero to Hero
**Description:** Track that received at least one 0-point vote but still finished strong.

| Criteria | Details |
|----------|---------|
| Qualifies | Received at least one 0-point vote AND finished in top half |
| Calculation | `has_zero = any(votes.points == 0)` AND `rank <= ceil(num_tracks / 2)` |

**Trophy:** Enamel pin of a zero digit wearing a tiny superhero cape, bold colors, pin badge style, white background

---

### 5. Universal Appeal
**Description:** Track that received points from every single voter. Everyone found something to love.

| Criteria | Details |
|----------|---------|
| Qualifies | Every voter gave this track > 0 points |
| Calculation | `min(points_received_per_voter) > 0` |

**Trophy:** Golden magnet attracting colorful music notes from all directions, 3D render style, white background

---

### 21. The Bridesmaid
**Description:** Always close, never wins. Finished 2nd or 3rd again.

| Criteria | Details |
|----------|---------|
| Qualifies | Finished 2nd/3rd this round AND 2nd/3rd in >= 2 of last 3 rounds |
| Calculation | Check rolling 3-round history for same submitter |

**Trophy:** Slightly wilted bouquet of flowers with a silver '2nd' ribbon, bittersweet beauty, romantic illustration style, white background

---

### 22. The Comeback Kid
**Description:** Went from last place one week to top 3 the next.

| Criteria | Details |
|----------|---------|
| Qualifies | Ranked last in round N-1 AND ranked 1-3 in round N |
| Calculation | Compare rank across consecutive rounds |

**Trophy:** Phoenix bird rising from ashes shaped like broken vinyl records, flames in gold and orange, dramatic rebirth energy, white background

---

### 23. Stuck in the Middle With...Me
**Description:** Finished in the exact middle of the pack.

| Criteria | Details |
|----------|---------|
| Qualifies | Rank equals `ceil(num_submissions / 2)` |
| Calculation | True median position |

**Trophy:** A perfectly level balance scale with a shrug emoji in the middle, beige and taupe colors, aggressively average energy, white background

---

### 24. The Wooden Spoon
**Description:** Last place, but with dignity. Still got meaningful points.

| Criteria | Details |
|----------|---------|
| Qualifies | Ranked last AND received >= 50% of average points |
| Calculation | `rank == max AND points >= 0.5 * avg(all_points)` |

**Trophy:** Elegant hand-carved wooden spoon with a tiny golden music note inlay, artisanal craftwork style, white background

---

### 25. The Anchor
**Description:** Every voter gave this track their lowest points. Sinking peacefully to the bottom.

| Criteria | Details |
|----------|---------|
| Qualifies | Each voter gave this track their minimum points |
| Calculation | For all voters: `vote.points == voter_min_points` |

**Trophy:** Anchor sinking to ocean floor with bubbles rising, peaceful descent vibes, nautical illustration style, white background

---

## Voting Behavior Awards

### 6. The Kingmaker
**Description:** Voter whose points made the biggest difference in determining the winner.

| Criteria | Details |
|----------|---------|
| Qualifies | Removing this voter's votes would change the winner |
| Calculation | Recalculate rankings without each voter; check if 1st changes |

**Trophy:** Ornate chess king piece with a tiny crown being placed on top by a hand, bronze metallic finish, white background

---

### 7. The Spread
**Description:** Voter who distributed points most evenly. Democracy in action.

| Criteria | Details |
|----------|---------|
| Qualifies | Lowest standard deviation in points assigned |
| Calculation | `min(stdev(points_assigned))` across voters |
| Threshold | Must have voted on >= 5 tracks |

**Trophy:** Butter knife spreading golden butter perfectly evenly on toast, satisfying smoothness, food illustration style, white background

---

### 8. All In
**Description:** Voter who concentrated points most heavily on one track. Ride or die.

| Criteria | Details |
|----------|---------|
| Qualifies | Gave >= 50% of total points to a single track |
| Calculation | `max_single_vote / sum(all_votes) >= 0.5` |

**Trophy:** Stack of casino poker chips all pushed forward, dramatic betting gesture frozen in time, metallic and felt textures, white background

---

### 9. The Snub
**Description:** Biggest gap between final ranking and one voter's opinion.

| Criteria | Details |
|----------|---------|
| Qualifies | Track finished 1st/2nd AND at least one voter gave 0-1 points |
| Calculation | `final_rank <= 2 AND min(individual_vote) <= 1` |

**Trophy:** Cold shoulder - a tiny figurine of a person looking away with arms crossed, frosty ice crystals on one shoulder, white background

---

### 10. Cold Blooded
**Description:** Most zero-point votes cast by one voter.

| Criteria | Details |
|----------|---------|
| Qualifies | Gave 0 points to more tracks than anyone else |
| Calculation | `max(count(votes WHERE points == 0))` |
| Threshold | Minimum 2 zeros to qualify |

**Trophy:** Realistic snake coiled around a frozen ice heart, scales glistening, dark elegant style, white background

---

### 26. The Contrarian
**Description:** Voted opposite to the crowd.

| Criteria | Details |
|----------|---------|
| Qualifies | Max points → bottom-3 track AND min points → top-3 track |
| Calculation | Check voter's extremes vs final rankings |

**Trophy:** Salmon swimming upstream against a current of other fish going downstream, determined expression, nature documentary style, white background

---

### 27. The Prophet
**Description:** Correctly predicted the winner by giving them max points.

| Criteria | Details |
|----------|---------|
| Qualifies | Voter's highest-pointed track finished 1st |
| Calculation | `track(max(voter_points)) == track(rank == 1)` |

**Trophy:** Crystal ball on an ornate stand with a tiny vinyl record visible inside glowing, mystical purple fog, fortune teller aesthetic, white background

---

### 28. The Participation Trophy
**Description:** Voted on every track, even giving out zeros.

| Criteria | Details |
|----------|---------|
| Qualifies | Voted on all eligible tracks AND gave at least one 0 |
| Calculation | `count(votes) == count(tracks) - 1 AND min(points) == 0` |

**Trophy:** Tiny plastic trophy with 'I tried' engraved on it, slightly crooked, elementary school awards day energy, white background

---

### 29. The Generous Soul
**Description:** Gave the highest total points of any voter.

| Criteria | Details |
|----------|---------|
| Qualifies | `sum(points)` is maximum among all voters |
| Calculation | `rank(sum(points)) == 1` |

**Trophy:** Overflowing cornucopia spilling out golden coins and music notes, abundant harvest energy, thanksgiving illustration style, white background

---

### 30. The Scrooge
**Description:** Gave the lowest total points of any voter.

| Criteria | Details |
|----------|---------|
| Qualifies | `sum(points)` is minimum among all voters |
| Calculation | `rank(sum(points)) == last` |

**Trophy:** Tiny coin purse snapped tightly shut with a padlock, single coin trying to escape, dickensian miserly energy, white background

---

### 31. Hive Mind
**Description:** Two or more voters had nearly identical point distributions.

| Criteria | Details |
|----------|---------|
| Qualifies | Two voters' correlation >= 0.9 OR exact match |
| Calculation | `corr(voter_a, voter_b) >= 0.9` |

**Trophy:** Two bees wearing headphones sharing a single music note between them, honeycomb pattern background element, cute insect illustration, white background

---

### 32. The Sniper
**Description:** Only gave points to a small number of tracks.

| Criteria | Details |
|----------|---------|
| Qualifies | Gave >0 to <= 3 tracks when >= 7 available |
| Calculation | `count(points > 0) <= 3 AND count(tracks) >= 7` |

**Trophy:** Single golden bullet standing upright with a music note engraved on it, precision and focus energy, military medal style, white background

---

## Submission Style Awards

### 11. The Archaeologist
**Description:** Oldest track submitted this round. Digging in the crates.

| Criteria | Details |
|----------|---------|
| Qualifies | Track has earliest `release_year` in round |
| Calculation | `min(release_year)` |

**Trophy:** Tiny golden shovel stuck in dirt with a vinyl record partially unearthed, archaeological dig style, white background

---

### 12. Fresh Pressed
**Description:** Newest track submitted. Keeping it current.

| Criteria | Details |
|----------|---------|
| Qualifies | Track has latest `release_year` in round |
| Calculation | `max(release_year)` |

**Trophy:** Steaming hot vinyl record fresh out of a record press, heat waves rising, industrial chic style, white background

---

### 13. The Deep Cut
**Description:** Least-known track, based on unfamiliarity comments.

| Criteria | Details |
|----------|---------|
| Qualifies | Most vote comments indicating unfamiliarity ("never heard", "new to me", etc.) |
| Calculation | Keyword search in vote comments |
| Fallback | Not awarded if no such comments exist |

**Trophy:** Iceberg with only tip visible above water, a music note hidden in the massive underwater portion, cross-section view, white background

---

### 14. Genre Bender
**Description:** Submission furthest from the round's typical genre. The wildcard.

| Criteria | Details |
|----------|---------|
| Qualifies | Primary genre shared by fewest other tracks |
| Calculation | `min(count(same_primary_genre))` |

**Trophy:** Pretzel twisted into the shape of a music note, golden baked finish, quirky food art style, white background

---

### 15. The Oversharer
**Description:** Longest submission comment. We appreciate the context.

| Criteria | Details |
|----------|---------|
| Qualifies | Longest comment by character count |
| Calculation | `max(len(comment))` |
| Threshold | Minimum 75 characters |

**Trophy:** Overflowing diary with pages spilling out, tiny handwritten text visible, golden lock broken open, white background

---

### 33. Time Traveler
**Description:** Submitted a track from a decade nobody else touched.

| Criteria | Details |
|----------|---------|
| Qualifies | Track's decade has no other submissions |
| Calculation | `count(same_decade) == 1` |

**Trophy:** Pocket watch with vinyl record as the clock face, hands pointing to different decades, steampunk time travel aesthetic, white background

---

### 34. Genre Orphan
**Description:** Submitted the only track of its primary genre.

| Criteria | Details |
|----------|---------|
| Qualifies | First-listed genre appears in no other submission |
| Calculation | Parse genres, take first; check uniqueness |

**Trophy:** Single different-colored puzzle piece that doesn't fit with the grey pieces around it, standing proud, misfit toy energy, white background

---

### 35. The Repeat Offender
**Description:** Submitted an artist they've submitted before.

| Criteria | Details |
|----------|---------|
| Qualifies | Artist appears in submitter's past submissions |
| Calculation | Check historical submissions for same artist |

**Trophy:** Rubber stamp pressing down leaving multiple identical marks, ink splatter, bureaucratic repetition energy, white background

---

### 36. The Novelist
**Description:** Longest submission comment of the round.

| Criteria | Details |
|----------|---------|
| Qualifies | `max(len(comment))` AND >= 50 chars |
| Calculation | Same as Oversharer; lower threshold |

**Trophy:** Tiny quill pen writing on an endless scroll that trails off the page, ink bottle nearby, epic storytelling energy, white background

---

### 37. The One-Worder
**Description:** Submitted a comment that was 3 words or fewer.

| Criteria | Details |
|----------|---------|
| Qualifies | Non-empty comment with <= 3 words |
| Calculation | `len(comment.split()) <= 3 AND comment != ''` |

**Trophy:** Single Scrabble tile with a music note on it, simple and minimal, less is more energy, white background

---

## Social/Engagement Awards

### 16. The Hype Man
**Description:** Most comments left on votes. They had thoughts.

| Criteria | Details |
|----------|---------|
| Qualifies | Highest count of non-empty vote comments |
| Calculation | `max(count(vote_comments))` |
| Threshold | Minimum 3 comments |

**Trophy:** Miniature megaphone covered in gold glitter with speech bubbles exploding out, energetic style, white background

---

### 17. Anonymous No More
**Description:** Set 'Visible to Voters' when their pick was obviously them.

| Criteria | Details |
|----------|---------|
| Qualifies | `visible = 'Yes'` AND artist matches submitter's historical pattern |
| Calculation | Check if artist appears in >1 past submission |
| Fallback | Can be awarded manually by group consensus |

**Trophy:** Masquerade mask falling off to reveal a winking face underneath, theatrical gold and black, white background

---

### 18. The Recluse
**Description:** Submitted with no comment, received votes with no comments. A mystery.

| Criteria | Details |
|----------|---------|
| Qualifies | Submission comment empty AND all vote comments empty |
| Calculation | `submission.comment IS NULL AND count(vote_comments) == 0` |

**Trophy:** Hermit crab in a beautiful shell with a tiny 'do not disturb' sign, peaceful solitude vibes, white background

---

### 19. Controversial Pick
**Description:** Highest variance in points received. Loved and hated.

| Criteria | Details |
|----------|---------|
| Qualifies | Highest `stdev(points_received)` among tracks |
| Calculation | `max(stdev(points))` |
| Threshold | Min 5 votes AND stdev >= 2.0 |

**Trophy:** Marmite jar with a vinyl record label, 'love it or hate it' energy, iconic British product style, white background

---

### 20. The Echo Chamber
**Description:** Two or more voters gave nearly identical points.

| Criteria | Details |
|----------|---------|
| Qualifies | Correlation >= 0.9 OR exact match |
| Calculation | `corr(voter_a, voter_b) >= 0.9` |

**Trophy:** Two parrots facing each other on a perch, mirror image poses, speech bubbles with identical music notes, white background

---

### 38. The Critic
**Description:** Left the most vote comments this round.

| Criteria | Details |
|----------|---------|
| Qualifies | Highest count of non-empty vote comments |
| Calculation | `max(count(vote_comments WHERE comment != ''))` |
| Threshold | Minimum 3 comments |

**Trophy:** Fancy monocle with a tiny notepad and pencil attached by a chain, snooty reviewer energy, film critic aesthetic, white background

---

### 39. The Ghost
**Description:** Voted without leaving a single comment.

| Criteria | Details |
|----------|---------|
| Qualifies | Cast >= 5 votes AND 0 comments |
| Calculation | `count(votes) >= 5 AND count(comments) == 0` |

**Trophy:** Friendly cartoon ghost wearing headphones, finger over lips in 'shh' gesture, translucent and floating, cute spooky style, white background

---

## Timing Awards

### 40. Early Bird
**Description:** First person to cast their vote this round.

| Criteria | Details |
|----------|---------|
| Qualifies | Earliest vote timestamp among all voters |
| Calculation | `min(vote.created)` → find voter |

**Trophy:** Cute bird holding a worm that's shaped like a music note, sunrise colors in background, cheerful morning energy, white background

---

### 41. The Eager Beaver
**Description:** First to submit their track this round.

| Criteria | Details |
|----------|---------|
| Qualifies | Submission has earliest `Created` timestamp in round |
| Calculation | `min(submission.Created)` |

**Trophy:** Beaver in a hard hat eagerly placing a vinyl record like a construction brick, busy worker energy, cute animal illustration, white background

---

### 42. The Procrastinator
**Description:** Last to submit their track this round. Deadlines are suggestions.

| Criteria | Details |
|----------|---------|
| Qualifies | Submission has latest `Created` timestamp in round |
| Calculation | `max(submission.Created)` |

**Trophy:** Alarm clock showing 11:59 with a vinyl record being frantically slid under a closing door, last-minute panic energy, white background

---

### 43. The Night Owl
**Description:** Last to cast their votes this round.

| Criteria | Details |
|----------|---------|
| Qualifies | Latest first-vote timestamp among all voters |
| Calculation | `max(min(vote.Created) GROUP BY voter)` |

**Trophy:** Wise owl wearing reading glasses, perched on a crescent moon, tiny headphones on, starry night vibes, white background

---

### 44. Serial Early Bird
**Description:** Consistently first to submit or vote across multiple rounds.

| Criteria | Details |
|----------|---------|
| Qualifies | First to submit OR vote in >= 3 rounds total |
| Calculation | Historical count of first-place timing |

**Trophy:** Rooster standing on a stack of vinyl records crowing at sunrise, golden morning light, farm meets music energy, white background

---

### 45. Serial Procrastinator
**Description:** Consistently last to submit or vote across multiple rounds.

| Criteria | Details |
|----------|---------|
| Qualifies | Last to submit OR vote in >= 3 rounds total |
| Calculation | Historical count of last-place timing |

**Trophy:** Sloth hanging from a tree branch, lazily holding a vinyl record, 'mañana' vibes, chill tropical energy, white background

---

### 46. Down to the Wire
**Description:** Submitted AND voted last in the same round. Living dangerously.

| Criteria | Details |
|----------|---------|
| Qualifies | Same person was last to submit AND last to vote |
| Calculation | `last_submitter == last_voter` for a given round |

**Trophy:** Tightrope walker balancing on a guitar string over a canyon, dramatic tension, circus daredevil energy, white background

---

### 47. First In, First Out
**Description:** Submitted first AND voted first in the same round. Efficiency goals.

| Criteria | Details |
|----------|---------|
| Qualifies | Same person was first to submit AND first to vote |
| Calculation | `first_submitter == first_voter` for a given round |

**Trophy:** Checkmark bursting through a finish line ribbon, speed lines, productivity guru energy, corporate achievement style, white background

---

### 48. The Flip-Flopper
**Description:** Went from submitting first one round to submitting last the next (or vice versa).

| Criteria | Details |
|----------|---------|
| Qualifies | First in round N and last in N+1, or vice versa |
| Calculation | Compare consecutive round submission ranks |

**Trophy:** Flip flop sandal with one side gold (first) and one side wooden (last), beach meets competition energy, white background

---

## Relationship Awards

### 49. Dominizing
**Description:** Both partners gave each other 3+ points in the same round. The gift exchange energy is strong.

| Criteria | Details |
|----------|---------|
| Qualifies | Partner A gave B >= 3 pts AND Partner B gave A >= 3 pts, same round |
| Calculation | Check both votes exist AND both >= 3 |
| Couples | missmara112/Mashew, mmariani13/Kristin, gregamariani/margs |
| Note | Named after a legendary white elephant gift exchange strategy |

**Trophy:** Two wrapped gift boxes exchanging themselves mid-air, ribbons intertwined forming a heart, white elephant party energy, white background

---

### 50. The Supporter
**Description:** Gave your partner/family member significantly more points than your average vote this round.

| Criteria | Details |
|----------|---------|
| Qualifies | Vote to partner/family >= 2x your average this round |
| Calculation | `vote_to_partner >= 2 * avg(your_votes)` |

**Trophy:** Foam finger pointing up with a heart on it, sports fan cheering for family energy, stadium crowd style, white background

---

### 51. Keeping It Honest
**Description:** Voted your partner/family member BELOW your average. No special treatment here.

| Criteria | Details |
|----------|---------|
| Qualifies | Vote to partner/family < your average this round |
| Calculation | `vote_to_partner < avg(your_votes)` |
| Note | Lori is queen of this award |

**Trophy:** Judge's gavel with a blindfold wrapped around it, scales of justice nearby, impartial fairness energy, courtroom drama style, white background

---

### 52. Sibling Rivalry
**Description:** Siblings voted each other below average. Blood is thicker than water, but music taste isn't.

| Criteria | Details |
|----------|---------|
| Qualifies | Both siblings gave each other below-average points, same round |
| Calculation | `sib_A_to_B < avg AND sib_B_to_A < avg` |
| Siblings | jellydru/Sasha Mariana |

**Trophy:** Two kids in a backseat of a car with an invisible line drawn between them, 'don't cross' energy, nostalgic family road trip vibes, white background

---

### 53. Family Feud
**Description:** A family member gave another family member 0 points. Thanksgiving is going to be awkward.

| Criteria | Details |
|----------|---------|
| Qualifies | Vote from family member to family member = 0 pts |
| Calculation | `vote.points == 0 AND (voter, submitter) in family_relationships` |

**Trophy:** Turkey dinner table with one chair dramatically knocked over, single dinner roll mid-flight, thanksgiving disaster energy, white background

---

## Theme Awards

### 54. The Muse
**Description:** Theme creator whose prompt inspired the fastest submissions. Everyone knew exactly what to pick.

| Criteria | Details |
|----------|---------|
| Qualifies | Round has the shortest average time from creation to submission |
| Calculation | `avg(submission.Created - round.Created)` per round; find minimum |
| Requires | Track which competitor created each round's theme |

**Trophy:** Greek muse statue holding a lightbulb instead of a lyre, inspiration striking, classical meets modern style, white background

---

### 55. The Stumper
**Description:** Theme creator whose prompt left everyone scratching their heads. Submissions came in slow.

| Criteria | Details |
|----------|---------|
| Qualifies | Round has the longest average time from creation to submission |
| Calculation | `avg(submission.Created - round.Created)` per round; find maximum |
| Requires | Track which competitor created each round's theme |

**Trophy:** Question mark made of tangled headphone cords, confused energy, puzzle aesthetic, white background

---

### 56. Home Field Advantage
**Description:** Theme creator who won (or placed top 3) in the round they created. Knew the assignment because they wrote it.

| Criteria | Details |
|----------|---------|
| Qualifies | Theme creator's submission ranked 1st, 2nd, or 3rd in their own round |
| Calculation | `theme_creator == submitter AND rank <= 3` |
| Requires | Track which competitor created each round's theme |

**Trophy:** Referee blowing whistle while simultaneously holding up a gold medal, suspicious side-eye, sports corruption humor, white background

---

### 57. Hoisted by Their Own Petard
**Description:** Theme creator who finished last in the round they created. The irony is palpable.

| Criteria | Details |
|----------|---------|
| Qualifies | Theme creator's submission ranked last in their own round |
| Calculation | `theme_creator == submitter AND rank == max(rank)` |
| Requires | Track which competitor created each round's theme |

**Trophy:** Person stepping on a rake that's shaped like a music note, cartoon bonk moment, slapstick comedy style, white background

---

### 58. The Overcomplicator
**Description:** Theme with the longest description. We needed a paragraph to explain this one.

| Criteria | Details |
|----------|---------|
| Qualifies | Round description has the most words (or characters) |
| Calculation | `max(word_count(round.Description))` or `max(len(round.Description))` |

**Trophy:** Instruction manual thick as a phone book with "How To Pick A Song" on the cover, bureaucratic nightmare energy, white background

---

### 59. The Simpleton
**Description:** Theme with the shortest description. Brief. Clear. Done.

| Criteria | Details |
|----------|---------|
| Qualifies | Round description has the fewest words (minimum 1 word) |
| Calculation | `min(word_count(round.Description)) where word_count >= 1` |

**Trophy:** Single sticky note with one word on it, minimalist zen energy, clean design aesthetic, white background

---

## Usage Notes

1. **Per-Round vs Historical:** Most awards evaluate a single round. Some (Bridesmaid, Comeback Kid, Repeat Offender, Serial Early Bird/Procrastinator) require data from previous rounds.

2. **Thresholds:** Adjust minimums based on your group size. A 5-person league needs different thresholds than a 15-person league.

3. **Mutual Exclusivity:** Some awards conflict (Landslide vs Photo Finish, Eager Beaver vs Procrastinator for same person). Only award one per round.

4. **Ties:** When multiple people qualify, either award to all or pick randomly.

5. **Manual Override:** Some awards (Anonymous No More, Deep Cut) may need human judgment if data isn't conclusive.

6. **Trophy Prompts:** All prompts designed for AI image generation. Add style modifiers like "3D render", "flat illustration", "pixel art" to taste. White backgrounds specified for easy compositing.
