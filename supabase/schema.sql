create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  avatar_url text,
  season1_competitor_id text,
  music_league_username text,
  ntfy_topic text,
  chat_notify_enabled boolean default true,
  created_at timestamptz default now()
);

create table family_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references profiles(id),
  created_at timestamptz default now()
);

create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id) on delete cascade,
  member_id uuid references profiles(id) on delete cascade,
  role text check (role in ('lead','member')) not null default 'member',
  created_at timestamptz default now()
);

alter table group_members
  add constraint group_members_unique unique (group_id, member_id);

create table leagues (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table rounds (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  theme text not null,
  status text check (status in ('open','voting','revealed','archived')) default 'open',
  submission_deadline timestamptz,
  voting_deadline timestamptz,
  created_at timestamptz default now()
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  submitter_id uuid references profiles(id),
  title text not null,
  artist text,
  link text,
  submitter_name text,
  artwork_url text,
  source_uri text,
  created_at timestamptz default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  voter_id uuid references profiles(id),
  voter_name text,
  points integer not null default 0,
  comment text,
  created_at timestamptz default now()
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  author_id uuid references profiles(id),
  body text not null,
  is_anonymous boolean default false,
  created_at timestamptz default now()
);

create table reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid references comments(id) on delete cascade,
  reactor_id uuid references profiles(id),
  emoji text not null,
  created_at timestamptz default now()
);

create table invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id) on delete cascade,
  code text unique not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  expires_at timestamptz,
  used_by uuid references profiles(id),
  used_at timestamptz
);

create table group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id) on delete cascade,
  author_id uuid references profiles(id),
  body text not null,
  created_at timestamptz default now()
);

create table season_competitors (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id) on delete cascade,
  external_id text,
  name text not null,
  created_at timestamptz default now()
);

create table season_round_comments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id) on delete cascade,
  round_external_id text not null,
  author_id uuid references profiles(id),
  body text not null,
  created_at timestamptz default now()
);
