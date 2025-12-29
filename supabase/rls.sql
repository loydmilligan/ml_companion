alter table profiles enable row level security;
alter table family_groups enable row level security;
alter table group_members enable row level security;
alter table leagues enable row level security;
alter table rounds enable row level security;
alter table submissions enable row level security;
alter table votes enable row level security;
alter table comments enable row level security;
alter table reactions enable row level security;
alter table invites enable row level security;
alter table group_messages enable row level security;
alter table season_competitors enable row level security;
alter table season_round_comments enable row level security;

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from group_members
    where group_id = p_group_id
      and member_id = auth.uid()
  );
$$;

create or replace function public.is_group_owner(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from family_groups
    where id = p_group_id
      and owner_id = auth.uid()
  );
$$;

create or replace function public.accept_invite(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite invites%rowtype;
begin
  select * into v_invite from invites where code = p_code;
  if not found then
    raise exception 'Invite not found';
  end if;

  if v_invite.used_at is not null then
    raise exception 'Invite already used';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    raise exception 'Invite expired';
  end if;

  insert into group_members (group_id, member_id, role)
  values (v_invite.group_id, auth.uid(), 'member')
  on conflict do nothing;

  update invites
  set used_by = auth.uid(), used_at = now()
  where id = v_invite.id;

  return jsonb_build_object('group_id', v_invite.group_id);
end;
$$;

grant execute on function public.accept_invite(text) to authenticated;

drop policy if exists "Profiles viewable by group members" on profiles;
create policy "Profiles viewable by group members" on profiles
  for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from group_members gm
      where gm.member_id = profiles.id
        and public.is_group_member(gm.group_id)
    )
  );

drop policy if exists "Profiles insert own" on profiles;
create policy "Profiles insert own" on profiles
  for insert
  with check (id = auth.uid());

drop policy if exists "Profiles update own" on profiles;
create policy "Profiles update own" on profiles
  for update
  using (id = auth.uid());

drop policy if exists "Family groups viewable by members" on family_groups;
create policy "Family groups viewable by members" on family_groups
  for select
  using (
    owner_id = auth.uid()
    or public.is_group_member(family_groups.id)
  );

drop policy if exists "Family groups insert by owner" on family_groups;
create policy "Family groups insert by owner" on family_groups
  for insert
  with check (owner_id = auth.uid());

drop policy if exists "Family groups update by owner" on family_groups;
create policy "Family groups update by owner" on family_groups
  for update
  using (owner_id = auth.uid());

drop policy if exists "Family groups delete by owner" on family_groups;
create policy "Family groups delete by owner" on family_groups
  for delete
  using (owner_id = auth.uid());

drop policy if exists "Group members viewable by members" on group_members;
create policy "Group members viewable by members" on group_members
  for select
  using (
    member_id = auth.uid()
    or public.is_group_member(group_members.group_id)
  );

drop policy if exists "Group members managed by owner" on group_members;
create policy "Group members managed by owner" on group_members
  for insert
  with check (
    exists (
      select 1 from family_groups fg
      where fg.id = group_members.group_id and fg.owner_id = auth.uid()
    )
  );

drop policy if exists "Group members update by owner" on group_members;
create policy "Group members update by owner" on group_members
  for update
  using (
    exists (
      select 1 from family_groups fg
      where fg.id = group_members.group_id and fg.owner_id = auth.uid()
    )
  );

drop policy if exists "Group members delete by owner" on group_members;
create policy "Group members delete by owner" on group_members
  for delete
  using (
    exists (
      select 1 from family_groups fg
      where fg.id = group_members.group_id and fg.owner_id = auth.uid()
    )
  );

drop policy if exists "Leagues viewable by group members" on leagues;
create policy "Leagues viewable by group members" on leagues
  for select
  using (
    exists (
      select 1 from group_members gm
      where gm.group_id = leagues.group_id and gm.member_id = auth.uid()
    )
  );

drop policy if exists "Leagues managed by owner" on leagues;
create policy "Leagues managed by owner" on leagues
  for insert
  with check (
    public.is_group_owner(leagues.group_id)
  );

drop policy if exists "Leagues update by owner" on leagues;
create policy "Leagues update by owner" on leagues
  for update
  using (
    public.is_group_owner(leagues.group_id)
  );

drop policy if exists "Leagues delete by owner" on leagues;
create policy "Leagues delete by owner" on leagues
  for delete
  using (
    public.is_group_owner(leagues.group_id)
  );

drop policy if exists "Rounds viewable by group members" on rounds;
create policy "Rounds viewable by group members" on rounds
  for select
  using (
    exists (
      select 1
      from leagues l
      join group_members gm on gm.group_id = l.group_id
      where l.id = rounds.league_id and gm.member_id = auth.uid()
    )
  );

drop policy if exists "Rounds managed by owner" on rounds;
create policy "Rounds managed by owner" on rounds
  for insert
  with check (
    exists (
      select 1 from leagues l
      where l.id = rounds.league_id and public.is_group_owner(l.group_id)
    )
  );

drop policy if exists "Rounds update by owner" on rounds;
create policy "Rounds update by owner" on rounds
  for update
  using (
    exists (
      select 1 from leagues l
      where l.id = rounds.league_id and public.is_group_owner(l.group_id)
    )
  );

drop policy if exists "Rounds delete by owner" on rounds;
create policy "Rounds delete by owner" on rounds
  for delete
  using (
    exists (
      select 1 from leagues l
      where l.id = rounds.league_id and public.is_group_owner(l.group_id)
    )
  );

drop policy if exists "Submissions viewable by group members" on submissions;
create policy "Submissions viewable by group members" on submissions
  for select
  using (
    exists (
      select 1
      from rounds r
      join leagues l on l.id = r.league_id
      join group_members gm on gm.group_id = l.group_id
      where r.id = submissions.round_id and gm.member_id = auth.uid()
    )
  );

drop policy if exists "Submissions insert by members" on submissions;
create policy "Submissions insert by members" on submissions
  for insert
  with check (
    exists (
      select 1
      from rounds r
      join leagues l on l.id = r.league_id
      where r.id = submissions.round_id and public.is_group_owner(l.group_id)
    )
  );

drop policy if exists "Submissions update by owner" on submissions;
create policy "Submissions update by owner" on submissions
  for update
  using (
    exists (
      select 1
      from rounds r
      join leagues l on l.id = r.league_id
      where r.id = submissions.round_id and public.is_group_owner(l.group_id)
    )
  );

drop policy if exists "Submissions delete by owner" on submissions;
create policy "Submissions delete by owner" on submissions
  for delete
  using (
    exists (
      select 1
      from rounds r
      join leagues l on l.id = r.league_id
      where r.id = submissions.round_id and public.is_group_owner(l.group_id)
    )
  );

drop policy if exists "Votes viewable by group members" on votes;
create policy "Votes viewable by group members" on votes
  for select
  using (
    exists (
      select 1
      from submissions s
      join rounds r on r.id = s.round_id
      join leagues l on l.id = r.league_id
      join group_members gm on gm.group_id = l.group_id
      where s.id = votes.submission_id and gm.member_id = auth.uid()
    )
  );

drop policy if exists "Votes insert by members" on votes;
create policy "Votes insert by members" on votes
  for insert
  with check (
    exists (
      select 1
      from submissions s
      join rounds r on r.id = s.round_id
      join leagues l on l.id = r.league_id
      where s.id = votes.submission_id and public.is_group_owner(l.group_id)
    )
  );

drop policy if exists "Votes update by voter" on votes;
create policy "Votes update by voter" on votes
  for update
  using (voter_id = auth.uid() or public.is_group_owner((select l.group_id from submissions s join rounds r on r.id = s.round_id join leagues l on l.id = r.league_id where s.id = votes.submission_id limit 1)));

drop policy if exists "Votes delete by voter" on votes;
create policy "Votes delete by voter" on votes
  for delete
  using (voter_id = auth.uid() or public.is_group_owner((select l.group_id from submissions s join rounds r on r.id = s.round_id join leagues l on l.id = r.league_id where s.id = votes.submission_id limit 1)));

drop policy if exists "Comments viewable by group members" on comments;
create policy "Comments viewable by group members" on comments
  for select
  using (
    exists (
      select 1
      from submissions s
      join rounds r on r.id = s.round_id
      join leagues l on l.id = r.league_id
      join group_members gm on gm.group_id = l.group_id
      where s.id = comments.submission_id and gm.member_id = auth.uid()
    )
  );

drop policy if exists "Comments insert by members" on comments;
create policy "Comments insert by members" on comments
  for insert
  with check (
    exists (
      select 1
      from submissions s
      join rounds r on r.id = s.round_id
      join leagues l on l.id = r.league_id
      join group_members gm on gm.group_id = l.group_id
      where s.id = comments.submission_id and gm.member_id = auth.uid()
    )
  );

drop policy if exists "Comments update by owner" on comments;
create policy "Comments update by owner" on comments
  for update
  using (author_id = auth.uid());

drop policy if exists "Comments delete by owner" on comments;
create policy "Comments delete by owner" on comments
  for delete
  using (author_id = auth.uid());

drop policy if exists "Reactions viewable by group members" on reactions;
create policy "Reactions viewable by group members" on reactions
  for select
  using (
    exists (
      select 1
      from comments c
      join submissions s on s.id = c.submission_id
      join rounds r on r.id = s.round_id
      join leagues l on l.id = r.league_id
      join group_members gm on gm.group_id = l.group_id
      where c.id = reactions.comment_id and gm.member_id = auth.uid()
    )
  );

drop policy if exists "Reactions insert by members" on reactions;
create policy "Reactions insert by members" on reactions
  for insert
  with check (
    exists (
      select 1
      from comments c
      join submissions s on s.id = c.submission_id
      join rounds r on r.id = s.round_id
      join leagues l on l.id = r.league_id
      join group_members gm on gm.group_id = l.group_id
      where c.id = reactions.comment_id and gm.member_id = auth.uid()
    )
  );

drop policy if exists "Reactions delete by owner" on reactions;
create policy "Reactions delete by owner" on reactions
  for delete
  using (reactor_id = auth.uid());

drop policy if exists "Invites viewable by group members" on invites;
create policy "Invites viewable by group members" on invites
  for select
  using (
    public.is_group_member(invites.group_id)
    or created_by = auth.uid()
  );

drop policy if exists "Invites managed by owner" on invites;
create policy "Invites managed by owner" on invites
  for insert
  with check (
    exists (
      select 1 from family_groups fg
      where fg.id = invites.group_id and fg.owner_id = auth.uid()
    )
  );

drop policy if exists "Group messages viewable by members" on group_messages;
create policy "Group messages viewable by members" on group_messages
  for select
  using (
    public.is_group_member(group_messages.group_id)
  );

drop policy if exists "Group messages insert by members" on group_messages;
create policy "Group messages insert by members" on group_messages
  for insert
  with check (
    public.is_group_member(group_messages.group_id)
  );

drop policy if exists "Group messages update by author" on group_messages;
create policy "Group messages update by author" on group_messages
  for update
  using (author_id = auth.uid());

drop policy if exists "Group messages delete by author" on group_messages;
create policy "Group messages delete by author" on group_messages
  for delete
  using (author_id = auth.uid());

drop policy if exists "Season competitors viewable by members" on season_competitors;
create policy "Season competitors viewable by members" on season_competitors
  for select
  using (public.is_group_member(season_competitors.group_id));

drop policy if exists "Season competitors managed by owner" on season_competitors;
create policy "Season competitors managed by owner" on season_competitors
  for insert
  with check (
    public.is_group_owner(season_competitors.group_id)
  );

drop policy if exists "Season competitors update by owner" on season_competitors;
create policy "Season competitors update by owner" on season_competitors
  for update
  using (
    public.is_group_owner(season_competitors.group_id)
  );

drop policy if exists "Season competitors delete by owner" on season_competitors;
create policy "Season competitors delete by owner" on season_competitors
  for delete
  using (
    public.is_group_owner(season_competitors.group_id)
  );

drop policy if exists "Season round comments viewable by members" on season_round_comments;
create policy "Season round comments viewable by members" on season_round_comments
  for select
  using (public.is_group_member(season_round_comments.group_id));

drop policy if exists "Season round comments insert by members" on season_round_comments;
create policy "Season round comments insert by members" on season_round_comments
  for insert
  with check (public.is_group_member(season_round_comments.group_id));

drop policy if exists "Season round comments update by author" on season_round_comments;
create policy "Season round comments update by author" on season_round_comments
  for update
  using (author_id = auth.uid());

drop policy if exists "Season round comments delete by author" on season_round_comments;
create policy "Season round comments delete by author" on season_round_comments
  for delete
  using (author_id = auth.uid());
