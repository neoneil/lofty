create table if not exists ielts.writing_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_type text not null default 'task2',
  prompt_question text not null,
  essay_text text not null,
  target_band numeric,
  overall_band numeric,
  word_count integer,
  scores_json jsonb not null default '{}'::jsonb,
  feedback_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ielts_writing_attempts_user_created
on ielts.writing_attempts(user_id, created_at desc);

alter table ielts.writing_attempts enable row level security;

drop policy if exists "Users can read own IELTS writing attempts" on ielts.writing_attempts;
create policy "Users can read own IELTS writing attempts"
on ielts.writing_attempts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own IELTS writing attempts" on ielts.writing_attempts;
create policy "Users can insert own IELTS writing attempts"
on ielts.writing_attempts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Admins can manage IELTS writing attempts" on ielts.writing_attempts;
create policy "Admins can manage IELTS writing attempts"
on ielts.writing_attempts
for all
to authenticated
using (ielts.is_admin())
with check (ielts.is_admin());
