-- Unified IELTS / PTE mock-exam schema.
-- This schema stores exam templates, generated question snapshots, student
-- attempts, answers, scores, and event logs. It is intentionally separate from
-- the existing IELTS and PTE content schemas so future question-bank changes do
-- not break historical mock-test reports.

create schema if not exists mock_exam;

create or replace function mock_exam.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function mock_exam.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'editor')
  );
$$;

create table if not exists mock_exam.blueprints (
  id uuid primary key default gen_random_uuid(),
  exam_type text not null check (exam_type in ('ielts', 'pte')),
  code text not null unique,
  title text not null,
  description text,
  delivery_mode text not null default 'computer' check (delivery_mode in ('computer', 'paper', 'practice')),
  duration_minutes integer,
  section_plan jsonb not null default '[]'::jsonb,
  question_plan jsonb not null default '{}'::jsonb,
  scoring_plan jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mock_exam.exams (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid references mock_exam.blueprints(id) on delete set null,
  exam_type text not null check (exam_type in ('ielts', 'pte')),
  code text not null unique,
  title text not null,
  description text,
  source_name text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  delivery_mode text not null default 'computer' check (delivery_mode in ('computer', 'paper', 'practice')),
  duration_minutes integer,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mock_exam.exam_sections (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references mock_exam.exams(id) on delete cascade,
  section_key text not null,
  section_type text not null,
  title text not null,
  instructions text,
  duration_seconds integer,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(exam_id, section_key)
);

create table if not exists mock_exam.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references mock_exam.exams(id) on delete cascade,
  section_id uuid not null references mock_exam.exam_sections(id) on delete cascade,
  question_key text not null,
  question_type text not null,
  question_number_start integer,
  question_number_end integer,
  title text,
  prompt text,
  instructions text,
  content jsonb not null default '{}'::jsonb,
  options jsonb not null default '[]'::jsonb,
  assets jsonb not null default '[]'::jsonb,
  source_schema text,
  source_table text,
  source_id text,
  sort_order integer not null default 0,
  is_required boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(exam_id, question_key)
);

create table if not exists mock_exam.exam_answer_keys (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references mock_exam.exam_questions(id) on delete cascade,
  answer_key jsonb not null default '{}'::jsonb,
  explanation text,
  scoring jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(question_id)
);

create table if not exists mock_exam.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exam_id uuid references mock_exam.exams(id) on delete set null,
  blueprint_id uuid references mock_exam.blueprints(id) on delete set null,
  exam_type text not null check (exam_type in ('ielts', 'pte')),
  title text not null,
  delivery_mode text not null default 'computer' check (delivery_mode in ('computer', 'paper', 'practice')),
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'scored', 'needs_review', 'abandoned', 'cancelled')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  scored_at timestamptz,
  expires_at timestamptz,
  duration_seconds integer,
  time_spent_seconds integer not null default 0,
  current_section_key text,
  current_question_key text,
  question_count integer not null default 0,
  answered_count integer not null default 0,
  correct_count integer not null default 0,
  max_score numeric,
  raw_score numeric,
  overall_score numeric,
  overall_band numeric,
  pte_overall_score numeric,
  section_scores jsonb not null default '{}'::jsonb,
  score_summary jsonb not null default '{}'::jsonb,
  admin_report_note text,
  score_email_sent_at timestamptz,
  score_email_error text,
  student_report_published_at timestamptz,
  student_report_published_by uuid references public.profiles(id) on delete set null,
  device_info jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mock_exam.attempt_sections (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references mock_exam.attempts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  exam_section_id uuid references mock_exam.exam_sections(id) on delete set null,
  section_key text not null,
  section_type text not null,
  title text not null,
  instructions text,
  sort_order integer not null default 0,
  duration_seconds integer,
  time_spent_seconds integer not null default 0,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'submitted', 'scored', 'skipped')),
  started_at timestamptz,
  submitted_at timestamptz,
  score numeric,
  max_score numeric,
  correct_count integer not null default 0,
  answered_count integer not null default 0,
  question_count integer not null default 0,
  section_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(attempt_id, section_key)
);

create table if not exists mock_exam.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references mock_exam.attempts(id) on delete cascade,
  attempt_section_id uuid references mock_exam.attempt_sections(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  exam_question_id uuid references mock_exam.exam_questions(id) on delete set null,
  section_key text not null,
  section_type text not null,
  question_key text not null,
  question_type text not null,
  question_number_start integer,
  question_number_end integer,
  source_schema text,
  source_table text,
  source_id text,
  title text,
  prompt text,
  instructions text,
  question_snapshot jsonb not null default '{}'::jsonb,
  response jsonb not null default '{}'::jsonb,
  response_text text,
  response_files jsonb not null default '[]'::jsonb,
  duration_seconds integer not null default 0,
  flagged boolean not null default false,
  answered_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(attempt_id, question_key)
);

create table if not exists mock_exam.attempt_answer_scores (
  id uuid primary key default gen_random_uuid(),
  attempt_answer_id uuid not null references mock_exam.attempt_answers(id) on delete cascade,
  attempt_id uuid not null references mock_exam.attempts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answer_key_snapshot jsonb not null default '{}'::jsonb,
  is_correct boolean,
  score numeric,
  max_score numeric,
  score_detail jsonb not null default '{}'::jsonb,
  feedback jsonb not null default '{}'::jsonb,
  needs_manual_review boolean not null default false,
  scored_by text,
  scored_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(attempt_answer_id)
);

create table if not exists mock_exam.attempt_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references mock_exam.attempts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

drop trigger if exists trg_mock_blueprints_updated_at on mock_exam.blueprints;
create trigger trg_mock_blueprints_updated_at
before update on mock_exam.blueprints
for each row execute function mock_exam.set_updated_at();

drop trigger if exists trg_mock_exams_updated_at on mock_exam.exams;
create trigger trg_mock_exams_updated_at
before update on mock_exam.exams
for each row execute function mock_exam.set_updated_at();

drop trigger if exists trg_mock_exam_sections_updated_at on mock_exam.exam_sections;
create trigger trg_mock_exam_sections_updated_at
before update on mock_exam.exam_sections
for each row execute function mock_exam.set_updated_at();

drop trigger if exists trg_mock_exam_questions_updated_at on mock_exam.exam_questions;
create trigger trg_mock_exam_questions_updated_at
before update on mock_exam.exam_questions
for each row execute function mock_exam.set_updated_at();

drop trigger if exists trg_mock_exam_answer_keys_updated_at on mock_exam.exam_answer_keys;
create trigger trg_mock_exam_answer_keys_updated_at
before update on mock_exam.exam_answer_keys
for each row execute function mock_exam.set_updated_at();

drop trigger if exists trg_mock_attempts_updated_at on mock_exam.attempts;
create trigger trg_mock_attempts_updated_at
before update on mock_exam.attempts
for each row execute function mock_exam.set_updated_at();

drop trigger if exists trg_mock_attempt_sections_updated_at on mock_exam.attempt_sections;
create trigger trg_mock_attempt_sections_updated_at
before update on mock_exam.attempt_sections
for each row execute function mock_exam.set_updated_at();

drop trigger if exists trg_mock_attempt_answers_updated_at on mock_exam.attempt_answers;
create trigger trg_mock_attempt_answers_updated_at
before update on mock_exam.attempt_answers
for each row execute function mock_exam.set_updated_at();

drop trigger if exists trg_mock_attempt_answer_scores_updated_at on mock_exam.attempt_answer_scores;
create trigger trg_mock_attempt_answer_scores_updated_at
before update on mock_exam.attempt_answer_scores
for each row execute function mock_exam.set_updated_at();

create index if not exists idx_mock_blueprints_type_active on mock_exam.blueprints(exam_type, is_active);
create index if not exists idx_mock_exams_type_status on mock_exam.exams(exam_type, status, is_active);
create index if not exists idx_mock_exam_sections_exam_order on mock_exam.exam_sections(exam_id, sort_order);
create index if not exists idx_mock_exam_questions_exam_order on mock_exam.exam_questions(exam_id, sort_order);
create index if not exists idx_mock_exam_questions_section_order on mock_exam.exam_questions(section_id, sort_order);
create index if not exists idx_mock_exam_questions_source on mock_exam.exam_questions(source_schema, source_table, source_id);
create index if not exists idx_mock_attempts_user_created on mock_exam.attempts(user_id, created_at desc);
create index if not exists idx_mock_attempts_exam_created on mock_exam.attempts(exam_type, created_at desc);
create index if not exists idx_mock_attempts_status on mock_exam.attempts(status, created_at desc);
create index if not exists idx_mock_attempts_score_email on mock_exam.attempts(exam_type, status, score_email_sent_at, created_at desc);
create index if not exists idx_mock_attempts_student_report_published on mock_exam.attempts(exam_type, status, student_report_published_at, created_at desc);
create index if not exists idx_mock_attempt_sections_attempt_order on mock_exam.attempt_sections(attempt_id, sort_order);
create index if not exists idx_mock_attempt_answers_attempt_question on mock_exam.attempt_answers(attempt_id, question_key);
create index if not exists idx_mock_attempt_answers_user_created on mock_exam.attempt_answers(user_id, created_at desc);
create index if not exists idx_mock_attempt_answers_source on mock_exam.attempt_answers(source_schema, source_table, source_id);
create index if not exists idx_mock_attempt_answer_scores_attempt on mock_exam.attempt_answer_scores(attempt_id);
create index if not exists idx_mock_attempt_events_attempt_created on mock_exam.attempt_events(attempt_id, created_at);
create index if not exists idx_mock_attempts_section_scores_gin on mock_exam.attempts using gin(section_scores);
create index if not exists idx_mock_attempt_answers_snapshot_gin on mock_exam.attempt_answers using gin(question_snapshot);

alter table mock_exam.blueprints enable row level security;
alter table mock_exam.exams enable row level security;
alter table mock_exam.exam_sections enable row level security;
alter table mock_exam.exam_questions enable row level security;
alter table mock_exam.exam_answer_keys enable row level security;
alter table mock_exam.attempts enable row level security;
alter table mock_exam.attempt_sections enable row level security;
alter table mock_exam.attempt_answers enable row level security;
alter table mock_exam.attempt_answer_scores enable row level security;
alter table mock_exam.attempt_events enable row level security;

drop policy if exists "Students can read active mock blueprints" on mock_exam.blueprints;
create policy "Students can read active mock blueprints"
on mock_exam.blueprints
for select
to authenticated
using (is_active or mock_exam.is_staff());

drop policy if exists "Staff can manage mock blueprints" on mock_exam.blueprints;
create policy "Staff can manage mock blueprints"
on mock_exam.blueprints
for all
to authenticated
using (mock_exam.is_staff())
with check (mock_exam.is_staff());

drop policy if exists "Students can read published mock exams" on mock_exam.exams;
create policy "Students can read published mock exams"
on mock_exam.exams
for select
to authenticated
using ((status = 'published' and is_active) or mock_exam.is_staff());

drop policy if exists "Staff can manage mock exams" on mock_exam.exams;
create policy "Staff can manage mock exams"
on mock_exam.exams
for all
to authenticated
using (mock_exam.is_staff())
with check (mock_exam.is_staff());

drop policy if exists "Students can read published mock sections" on mock_exam.exam_sections;
create policy "Students can read published mock sections"
on mock_exam.exam_sections
for select
to authenticated
using (
  exists (
    select 1 from mock_exam.exams e
    where e.id = exam_id
      and ((e.status = 'published' and e.is_active) or mock_exam.is_staff())
  )
);

drop policy if exists "Staff can manage mock sections" on mock_exam.exam_sections;
create policy "Staff can manage mock sections"
on mock_exam.exam_sections
for all
to authenticated
using (mock_exam.is_staff())
with check (mock_exam.is_staff());

drop policy if exists "Staff can read mock questions" on mock_exam.exam_questions;
create policy "Staff can read mock questions"
on mock_exam.exam_questions
for select
to authenticated
using (mock_exam.is_staff());

drop policy if exists "Staff can manage mock questions" on mock_exam.exam_questions;
create policy "Staff can manage mock questions"
on mock_exam.exam_questions
for all
to authenticated
using (mock_exam.is_staff())
with check (mock_exam.is_staff());

drop policy if exists "Staff can manage mock answer keys" on mock_exam.exam_answer_keys;
create policy "Staff can manage mock answer keys"
on mock_exam.exam_answer_keys
for all
to authenticated
using (mock_exam.is_staff())
with check (mock_exam.is_staff());

drop policy if exists "Users can read own mock attempts" on mock_exam.attempts;
create policy "Users can read own mock attempts"
on mock_exam.attempts
for select
to authenticated
using (auth.uid() = user_id or mock_exam.is_staff());

drop policy if exists "Users can insert own mock attempts" on mock_exam.attempts;
create policy "Users can insert own mock attempts"
on mock_exam.attempts
for insert
to authenticated
with check (auth.uid() = user_id or mock_exam.is_staff());

drop policy if exists "Users can update own mock attempts" on mock_exam.attempts;
create policy "Users can update own mock attempts"
on mock_exam.attempts
for update
to authenticated
using (auth.uid() = user_id or mock_exam.is_staff())
with check (auth.uid() = user_id or mock_exam.is_staff());

drop policy if exists "Staff can delete mock attempts" on mock_exam.attempts;
create policy "Staff can delete mock attempts"
on mock_exam.attempts
for delete
to authenticated
using (mock_exam.is_staff());

drop policy if exists "Users can read own mock attempt sections" on mock_exam.attempt_sections;
create policy "Users can read own mock attempt sections"
on mock_exam.attempt_sections
for select
to authenticated
using (auth.uid() = user_id or mock_exam.is_staff());

drop policy if exists "Users can manage own mock attempt sections" on mock_exam.attempt_sections;
create policy "Users can manage own mock attempt sections"
on mock_exam.attempt_sections
for all
to authenticated
using (auth.uid() = user_id or mock_exam.is_staff())
with check (auth.uid() = user_id or mock_exam.is_staff());

drop policy if exists "Users can read own mock answers" on mock_exam.attempt_answers;
create policy "Users can read own mock answers"
on mock_exam.attempt_answers
for select
to authenticated
using (auth.uid() = user_id or mock_exam.is_staff());

drop policy if exists "Users can manage own mock answers" on mock_exam.attempt_answers;
create policy "Users can manage own mock answers"
on mock_exam.attempt_answers
for all
to authenticated
using (auth.uid() = user_id or mock_exam.is_staff())
with check (auth.uid() = user_id or mock_exam.is_staff());

drop policy if exists "Users can read own mock answer scores" on mock_exam.attempt_answer_scores;
create policy "Users can read own mock answer scores"
on mock_exam.attempt_answer_scores
for select
to authenticated
using (auth.uid() = user_id or mock_exam.is_staff());

drop policy if exists "Staff can manage mock answer scores" on mock_exam.attempt_answer_scores;
create policy "Staff can manage mock answer scores"
on mock_exam.attempt_answer_scores
for all
to authenticated
using (mock_exam.is_staff())
with check (mock_exam.is_staff());

drop policy if exists "Users can read own mock events" on mock_exam.attempt_events;
create policy "Users can read own mock events"
on mock_exam.attempt_events
for select
to authenticated
using (auth.uid() = user_id or mock_exam.is_staff());

drop policy if exists "Users can insert own mock events" on mock_exam.attempt_events;
create policy "Users can insert own mock events"
on mock_exam.attempt_events
for insert
to authenticated
with check (auth.uid() = user_id or mock_exam.is_staff());

drop policy if exists "Staff can manage mock events" on mock_exam.attempt_events;
create policy "Staff can manage mock events"
on mock_exam.attempt_events
for all
to authenticated
using (mock_exam.is_staff())
with check (mock_exam.is_staff());

grant usage on schema mock_exam to authenticated, service_role;
grant select, insert, update, delete on all tables in schema mock_exam to authenticated, service_role;
grant usage, select on all sequences in schema mock_exam to authenticated, service_role;

insert into mock_exam.blueprints (
  exam_type,
  code,
  title,
  description,
  delivery_mode,
  duration_minutes,
  section_plan,
  question_plan,
  scoring_plan
)
values
(
  'pte',
  'pte-current-36',
  'PTE Academic Mock Test - Current 36 Questions',
  '当前系统已有 PTE 题型的 36 题模考蓝图。后续补充单选、多选等题型时可更新 question_plan。',
  'computer',
  null,
  '[
    {"section_key":"speaking","section_type":"speaking","title":"Speaking","sort_order":1},
    {"section_key":"writing","section_type":"writing","title":"Writing","sort_order":2},
    {"section_key":"reading","section_type":"reading","title":"Reading","sort_order":3},
    {"section_key":"listening","section_type":"listening","title":"Listening","sort_order":4}
  ]'::jsonb,
  '{
    "speaking":{"RA":3,"RS":3,"DI":3,"RL":3,"ASQ":3,"SGD":3,"RTS":3},
    "writing":{"SWT":1,"ESSAY":1},
    "reading":{"RO":2,"FIBRW":2,"FIBR":2},
    "listening":{"SST":1,"HIW":3,"WFD":3},
    "total_questions":36
  }'::jsonb,
  '{"score_scale":"pte_10_90","auto_score_objective_items":true,"manual_or_ai_review_for_speaking_writing":true}'::jsonb
),
(
  'ielts',
  'ielts-academic-computer-lrw',
  'IELTS Academic Computer Mock Test - Listening Reading Writing',
  'IELTS 机考流程蓝图：听力、阅读、写作。口语通常单独安排，可后续新增 speaking section。',
  'computer',
  165,
  '[
    {"section_key":"listening","section_type":"listening","title":"Listening","duration_seconds":2400,"sort_order":1},
    {"section_key":"reading","section_type":"reading","title":"Reading","duration_seconds":3600,"sort_order":2},
    {"section_key":"writing","section_type":"writing","title":"Writing","duration_seconds":3600,"sort_order":3}
  ]'::jsonb,
  '{
    "listening":{"question_count":40},
    "reading":{"question_count":40},
    "writing":{"task1":1,"task2":1},
    "total_questions":82
  }'::jsonb,
  '{"score_scale":"ielts_band_0_9","listening_reading_auto_score":true,"writing_manual_or_ai_review":true}'::jsonb
)
on conflict (code) do update
set
  title = excluded.title,
  description = excluded.description,
  duration_minutes = excluded.duration_minutes,
  section_plan = excluded.section_plan,
  question_plan = excluded.question_plan,
  scoring_plan = excluded.scoring_plan,
  is_active = true,
  updated_at = now();
