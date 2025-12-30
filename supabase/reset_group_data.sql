-- Reset data for a specific group_id.
-- Replace '22163578-46a3-4efa-a8ed-c4323b92066b' with the UUID of the family group you want to reset.

-- Core chat/messages
delete from group_messages where group_id = '22163578-46a3-4efa-a8ed-c4323b92066b';

-- Season 1 / history
delete from season_round_comments where group_id = '22163578-46a3-4efa-a8ed-c4323b92066b';
delete from season_competitors where group_id = '22163578-46a3-4efa-a8ed-c4323b92066b';
delete from round_imports where group_id = '22163578-46a3-4efa-a8ed-c4323b92066b';
delete from round_chats
using rounds r
join leagues l on l.id = r.league_id
where l.group_id = '22163578-46a3-4efa-a8ed-c4323b92066b' and round_chats.round_id = r.id;

-- Invites
delete from invites where group_id = '22163578-46a3-4efa-a8ed-c4323b92066b';

-- League/round data (cascading down)
-- Remove votes/comments/submissions first to avoid FK issues.
delete from votes
using submissions s
join rounds r on r.id = s.round_id
join leagues l on l.id = r.league_id
where l.group_id = '22163578-46a3-4efa-a8ed-c4323b92066b' and votes.submission_id = s.id;

delete from comments
using submissions s
join rounds r on r.id = s.round_id
join leagues l on l.id = r.league_id
where l.group_id = '22163578-46a3-4efa-a8ed-c4323b92066b' and comments.submission_id = s.id;

delete from submissions
using rounds r
join leagues l on l.id = r.league_id
where l.group_id = '22163578-46a3-4efa-a8ed-c4323b92066b' and submissions.round_id = r.id;

delete from rounds
using leagues l
where l.group_id = '22163578-46a3-4efa-a8ed-c4323b92066b' and rounds.league_id = l.id;

delete from leagues where group_id = '22163578-46a3-4efa-a8ed-c4323b92066b';

-- Optional: remove members (uncomment if you want a full wipe of membership)
-- delete from group_members where group_id = '22163578-46a3-4efa-a8ed-c4323b92066b';

-- Optional: remove the group itself (uncomment if you want full deletion)
-- delete from family_groups where id = '22163578-46a3-4efa-a8ed-c4323b92066b';
