-- Schema deltas (post-initial schema)

-- Profiles columns
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists season1_competitor_id text;
alter table profiles add column if not exists music_league_username text;
alter table profiles add column if not exists ntfy_topic text;
alter table profiles add column if not exists chat_notify_enabled boolean default true;
alter table profiles add column if not exists email_notify_enabled boolean default true;
alter table profiles add column if not exists can_toggle_chat_notify boolean default true;
alter table profiles add column if not exists can_toggle_email_notify boolean default true;

-- Submissions columns
alter table submissions add column if not exists submitter_name text;
alter table submissions add column if not exists artwork_url text;
alter table submissions add column if not exists source_uri text;
alter table submissions add column if not exists album text;
alter table submissions add column if not exists external_round_id text;
alter table submissions add column if not exists external_submitter_id text;
alter table submissions add column if not exists external_created_at timestamptz;
alter table submissions add column if not exists external_comment text;
alter table submissions add column if not exists external_visible_to_voters boolean;
alter table submissions add column if not exists release_year integer;
alter table submissions add column if not exists genres text;

-- Rounds columns
alter table rounds add column if not exists theme_description text;
alter table rounds add column if not exists theme_author text;
alter table rounds add column if not exists season_number integer;
alter table rounds add column if not exists round_number integer;
alter table rounds add column if not exists external_round_id text;
alter table rounds add column if not exists external_created_at timestamptz;
alter table rounds add column if not exists external_playlist_url text;
alter table rounds add column if not exists playlist_url text;

-- Leagues columns
alter table leagues add column if not exists season_number integer;
update leagues set season_number = 1 where season_number is null;

-- Votes table
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  voter_id uuid references profiles(id),
  voter_name text,
  voter_external_id text,
  points integer not null default 0,
  comment text,
  external_round_id text,
  external_spotify_uri text,
  external_created_at timestamptz,
  created_at timestamptz default now()
);

-- Season competitors table
create table if not exists season_competitors (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id) on delete cascade,
  external_id text,
  name text not null,
  profile_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- Round imports table
create table if not exists round_imports (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id) on delete cascade,
  league_id uuid references leagues(id) on delete cascade,
  external_round_id text not null,
  name text not null,
  description text,
  playlist_url text,
  external_created_at timestamptz,
  round_id uuid references rounds(id),
  imported_at timestamptz default now()
);

-- Season round comments table
create table if not exists season_round_comments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id) on delete cascade,
  round_external_id text not null,
  author_id uuid references profiles(id),
  body text not null,
  created_at timestamptz default now()
);

-- Round chats table
create table if not exists round_chats (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  author_id uuid references profiles(id),
  body text not null,
  created_at timestamptz default now()
);

-- Group members uniqueness
DO $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'group_members_unique'
  ) then
    alter table group_members
      add constraint group_members_unique unique (group_id, member_id);
  end if;
end $$;

-- Uniqueness for season numbers per group
DO $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'leagues_group_season_unique'
  ) then
    alter table leagues
      add constraint leagues_group_season_unique unique (group_id, season_number);
  end if;
end $$;

-- Unique external IDs per group/league
DO $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'season_competitors_group_external_unique'
  ) then
    alter table season_competitors
      add constraint season_competitors_group_external_unique unique (group_id, external_id);
  end if;
end $$;

DO $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'round_imports_group_external_unique'
  ) then
    alter table round_imports
      add constraint round_imports_group_external_unique unique (league_id, external_round_id);
  end if;
end $$;

DO $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rounds_league_external_unique'
  ) then
    alter table rounds
      add constraint rounds_league_external_unique unique (league_id, external_round_id);
  end if;
end $$;

DO $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'submissions_round_source_unique'
  ) then
    alter table submissions
      add constraint submissions_round_source_unique unique (round_id, source_uri);
  end if;
end $$;

DO $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'votes_submission_voter_external_unique'
  ) then
    alter table votes
      add constraint votes_submission_voter_external_unique unique (submission_id, voter_external_id);
  end if;
end $$;
