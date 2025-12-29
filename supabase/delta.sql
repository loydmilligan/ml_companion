-- Schema deltas (post-initial schema)

-- Profiles columns
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists season1_competitor_id text;
alter table profiles add column if not exists music_league_username text;
alter table profiles add column if not exists ntfy_topic text;
alter table profiles add column if not exists chat_notify_enabled boolean default true;

-- Submissions columns
alter table submissions add column if not exists submitter_name text;
alter table submissions add column if not exists artwork_url text;
alter table submissions add column if not exists source_uri text;

-- Votes table
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  voter_id uuid references profiles(id),
  voter_name text,
  points integer not null default 0,
  comment text,
  created_at timestamptz default now()
);

-- Season competitors table
create table if not exists season_competitors (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id) on delete cascade,
  external_id text,
  name text not null,
  created_at timestamptz default now()
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
