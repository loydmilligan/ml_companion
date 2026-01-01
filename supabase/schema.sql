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
  email_notify_enabled boolean default true,
  can_toggle_chat_notify boolean default true,
  can_toggle_email_notify boolean default true,
  ai_image_traits text,
  created_at timestamptz default now()
);

create table family_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references profiles(id),
  created_at timestamptz default now()
);

create table group_settings (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id) on delete cascade,
  round_summary_model_key text,
  round_story_image_model_key text,
  round_theme_image_model_key text,
  awards_model_key text,
  trophy_image_model_key text,
  logo_palette text,
  updated_at timestamptz default now(),
  unique (group_id)
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
  season_number integer not null,
  created_at timestamptz default now()
);

create table rounds (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  theme text not null,
  theme_description text,
  theme_author text,
  external_round_id text,
  external_created_at timestamptz,
  external_playlist_url text,
  playlist_url text,
  season_number integer,
  round_number integer,
  status text check (status in ('open','voting','revealed','archived')) default 'open',
  submission_deadline timestamptz,
  voting_deadline timestamptz,
  theme_image_url text,
  winners_image_url text,
  winners_image_visible boolean default true,
  created_at timestamptz default now()
);

create table round_awards (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  award_id integer,
  award_name text not null,
  award_description text,
  trophy_url text,
  winner_name text,
  winner_profile_id uuid references profiles(id),
  winner_submission_id uuid references submissions(id),
  visible boolean default true,
  created_at timestamptz default now()
);

create table player_connections (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id) on delete cascade,
  source_profile_id uuid references profiles(id) on delete cascade,
  target_profile_id uuid references profiles(id) on delete cascade,
  relation_type text not null,
  created_at timestamptz default now(),
  unique (group_id, source_profile_id, target_profile_id, relation_type)
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  submitter_id uuid references profiles(id),
  title text not null,
  album text,
  artist text,
  link text,
  submitter_name text,
  artwork_url text,
  source_uri text,
  external_round_id text,
  external_submitter_id text,
  external_created_at timestamptz,
  external_comment text,
  external_visible_to_voters boolean,
  release_year integer,
  genres text,
  created_at timestamptz default now()
);

create table votes (
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

create table round_chats (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  author_id uuid references profiles(id),
  body text not null,
  created_at timestamptz default now()
);

create table season_competitors (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id) on delete cascade,
  external_id text,
  name text not null,
  profile_id uuid references profiles(id),
  ai_image_traits text,
  created_at timestamptz default now()
);

create table round_imports (
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

create table season_round_comments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id) on delete cascade,
  round_external_id text not null,
  author_id uuid references profiles(id),
  body text not null,
  created_at timestamptz default now()
);
