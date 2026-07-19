alter table pte.rs
add column if not exists audio_duration_seconds integer,
add column if not exists ai_voice text,
add column if not exists usage_count integer not null default 0,
add column if not exists audio_status text not null default 'pending',
add column if not exists audio_generated_at timestamptz null,
add column if not exists audio_error text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rs_ai_voice_check'
      and conrelid = 'pte.rs'::regclass
  ) then
    alter table pte.rs
    add constraint rs_ai_voice_check
    check (ai_voice is null or ai_voice in ('marin', 'cedar', 'alloy', 'ash')) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'wfd_ai_voice_check'
      and conrelid = 'pte.wfd'::regclass
  ) then
    alter table pte.wfd
    add constraint wfd_ai_voice_check
    check (ai_voice is null or ai_voice in ('marin', 'cedar', 'alloy', 'ash')) not valid;
  end if;
end $$;

create or replace view views.v_pte_rs_with_user_status
with (security_invoker = true)
as
select
  q.id,
  q.question_text,
  q.question_type,
  q.source_question_id,
  q.difficulty_level,
  q.is_prediction,
  q.audio_url,
  q.audio_duration_seconds,
  q.created_at,
  q.updated_at,
  q.is_real_exam,
  coalesce(s.is_practiced, false) as is_practiced,
  coalesce(s.attempt_count, 0) as attempt_count,
  coalesce(s.correct_count, 0) as correct_count,
  coalesce(s.wrong_count, 0) as wrong_count,
  s.last_attempt_at,
  s.latest_score,
  s.best_score,
  case
    when w.id is not null and w.is_resolved = false then true
    else false
  end as is_wrong_question,
  q.ai_voice,
  q.usage_count
from pte.rs q
left join public.student_question_stats s
  on s.question_source = 'rs'
  and s.question_id = q.id::text
  and s.user_id = auth.uid()
left join public.student_wrong_questions w
  on w.question_source = 'rs'
  and w.question_id = q.id::text
  and w.user_id = auth.uid();
