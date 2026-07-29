create table if not exists ielts.speaking_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null,
  part text not null check (part in ('part1', 'part2', 'part3')),
  question_context jsonb not null default '{}'::jsonb,
  audio_url text,
  transcript text,
  overall_band numeric,
  fluency_score numeric,
  lexical_score numeric,
  grammar_score numeric,
  pronunciation_score numeric,
  duration_seconds integer,
  azure_result_json jsonb,
  feedback_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ielts_speaking_attempts_user_question
on ielts.speaking_attempts(user_id, question_id, created_at desc);

create index if not exists idx_ielts_speaking_attempts_user_part
on ielts.speaking_attempts(user_id, part, created_at desc);

alter table ielts.speaking_attempts enable row level security;

drop policy if exists "Users can read own IELTS speaking attempts" on ielts.speaking_attempts;
create policy "Users can read own IELTS speaking attempts"
on ielts.speaking_attempts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own IELTS speaking attempts" on ielts.speaking_attempts;
create policy "Users can insert own IELTS speaking attempts"
on ielts.speaking_attempts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Admins can manage IELTS speaking attempts" on ielts.speaking_attempts;
create policy "Admins can manage IELTS speaking attempts"
on ielts.speaking_attempts
for all
to authenticated
using (ielts.is_admin())
with check (ielts.is_admin());
