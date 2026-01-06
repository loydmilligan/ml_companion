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
alter table profiles add column if not exists ai_image_traits text;

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
alter table rounds add column if not exists theme_image_url text;
alter table rounds add column if not exists winners_image_url text;
alter table rounds add column if not exists winners_image_visible boolean default true;
alter table rounds add column if not exists narrative text;

-- Leagues columns
alter table leagues add column if not exists narrative text;
alter table leagues add column if not exists current_story_intro text;
alter table leagues add column if not exists current_round_riff text;
alter table leagues add column if not exists current_minigame_summary text;
alter table leagues add column if not exists current_story_updated_at timestamptz;
alter table leagues add column if not exists current_story_round_id uuid references rounds(id);

-- Round awards table
create table if not exists round_awards (
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
alter table round_awards add column if not exists visible boolean default true;

-- Round user activity (email-driven tracking)
create table if not exists round_user_activity (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  actor_name text not null,
  profile_id uuid references profiles(id),
  activity_type text not null check (activity_type in ('submitted', 'voted')),
  event_id text,
  action_at timestamptz,
  created_at timestamptz default now()
);

DO $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'round_user_activity_unique'
  ) then
    alter table round_user_activity
      add constraint round_user_activity_unique unique (round_id, actor_name, activity_type);
  end if;
end $$;

-- Player connections table
create table if not exists player_connections (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id) on delete cascade,
  source_profile_id uuid references profiles(id) on delete cascade,
  target_profile_id uuid references profiles(id) on delete cascade,
  relation_type text not null,
  created_at timestamptz default now()
);

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
  ai_image_traits text,
  created_at timestamptz default now()
);
alter table season_competitors add column if not exists ai_image_traits text;

-- Group settings table
create table if not exists group_settings (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id) on delete cascade,
  round_summary_model_key text,
  round_story_image_model_key text,
  round_theme_image_model_key text,
  awards_model_key text,
  trophy_image_model_key text,
  logo_palette text,
  updated_at timestamptz default now()
);
alter table group_settings add column if not exists logo_palette text;

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
    where conname = 'group_settings_group_unique'
  ) then
    alter table group_settings
      add constraint group_settings_group_unique unique (group_id);
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

DO $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'round_awards_round_award_unique'
  ) then
    alter table round_awards
      add constraint round_awards_round_award_unique unique (round_id, award_id);
  end if;
end $$;

DO $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'player_connections_unique'
  ) then
    alter table player_connections
      add constraint player_connections_unique unique (group_id, source_profile_id, target_profile_id, relation_type);
  end if;
end $$;

-- Round Challenge game tables
create table if not exists round_challenges (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  group_id uuid references family_groups(id) on delete cascade,
  song1_title text,
  song1_artist text,
  song1_spotify_url text,
  song1_youtube_url text,
  song1_correct_theme text,
  song2_title text,
  song2_artist text,
  song2_spotify_url text,
  song2_youtube_url text,
  song2_correct_theme text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists challenge_guesses (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references round_challenges(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  song_number integer check (song_number in (1, 2)),
  guessed_theme text not null,
  is_correct boolean not null,
  created_at timestamptz default now()
);

create table if not exists challenge_bonus_points (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  points integer default 0,
  reason text,
  awarded_by uuid references profiles(id),
  created_at timestamptz default now()
);

DO $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'challenge_guesses_unique'
  ) then
    alter table challenge_guesses
      add constraint challenge_guesses_unique unique (challenge_id, user_id, song_number);
  end if;
end $$;

-- AI Assistant feature toggles in group_settings
alter table group_settings add column if not exists ai_explain_enabled boolean default true;
alter table group_settings add column if not exists ai_validate_enabled boolean default true;
alter table group_settings add column if not exists ai_hint_enabled boolean default true;
alter table group_settings add column if not exists ai_assistant_enabled boolean default true;
alter table group_settings add column if not exists ai_validate_daily_limit integer default 5;
alter table group_settings add column if not exists ai_chat_enabled boolean default true;

-- Round AI cache for explain/hints (generated once per round, shared by all)
create table if not exists round_ai_cache (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  group_id uuid references family_groups(id) on delete cascade,
  cache_type text not null check (cache_type in ('explain', 'hint')),
  content text not null,
  created_at timestamptz default now()
);

DO $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'round_ai_cache_unique'
  ) then
    alter table round_ai_cache
      add constraint round_ai_cache_unique unique (round_id, group_id, cache_type);
  end if;
end $$;

-- User AI usage tracking for daily limits
create table if not exists user_ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  group_id uuid references family_groups(id) on delete cascade,
  usage_type text not null,
  usage_date date not null default current_date,
  count integer default 1,
  created_at timestamptz default now()
);

DO $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_ai_usage_unique'
  ) then
    alter table user_ai_usage
      add constraint user_ai_usage_unique unique (user_id, group_id, usage_type, usage_date);
  end if;
end $$;
