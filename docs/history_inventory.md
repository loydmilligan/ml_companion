# History Content Inventory

Concise list of everything currently shown in the History section, with generated vs. static content called out.

## Round Review (Round spotlight)
- **Theme banner image** (generated). Round theme image for the selected round.
- **Theme details** (static). Theme name, description, author, round number, status.
- **Round selection controls** (static). Season selector, round selector, random round button.
- **Story + art panel** (generated). Narrative text and winners image for the round; includes admin controls to generate/hide/show/regenerate.
- **AI JSON payload** (generated inputs). Toggle showing the round + songs + votes payload used for the story.
- **Round awards panel** (generated + stored). Award name/description/winner and trophy image; admin controls to generate/regenerate/hide/show.
- **Round listening** (static data). Up to 6 songs with artwork, title, artist, year, genre, listen link.
- **Points leaders** (computed). Bar chart of songs by points.
- **Release year mix** (computed). Year distribution bars + genre pills from submission metadata.
- **Round chat** (stored). Historical chat thread seeded from the round week.

## Season Snapshot
- **Season totals** (computed). Total rounds, submissions, votes.
- **Top tracks** (computed). Highest scoring tracks with points.
- **Completed rounds list** (static data). Theme + round number with review button.
