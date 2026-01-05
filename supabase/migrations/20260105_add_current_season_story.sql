alter table leagues add column if not exists current_story_intro text;
alter table leagues add column if not exists current_round_riff text;
alter table leagues add column if not exists current_minigame_summary text;
alter table leagues add column if not exists current_story_updated_at timestamptz;
alter table leagues add column if not exists current_story_round_id uuid references rounds(id);
