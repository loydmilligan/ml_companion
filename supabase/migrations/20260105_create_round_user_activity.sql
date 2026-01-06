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
