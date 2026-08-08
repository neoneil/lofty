alter table mock_exam.attempts
drop constraint if exists attempts_status_check;

alter table mock_exam.attempts
add constraint attempts_status_check
check (status in ('in_progress', 'submitted', 'scored', 'needs_review', 'abandoned', 'cancelled'));

alter table mock_exam.attempts
add column if not exists admin_report_note text,
add column if not exists score_email_sent_at timestamptz,
add column if not exists score_email_error text,
add column if not exists student_report_published_at timestamptz,
add column if not exists student_report_published_by uuid references public.profiles(id) on delete set null;

create index if not exists idx_mock_attempts_score_email
on mock_exam.attempts(exam_type, status, score_email_sent_at, created_at desc);

create index if not exists idx_mock_attempts_student_report_published
on mock_exam.attempts(exam_type, status, student_report_published_at, created_at desc);
