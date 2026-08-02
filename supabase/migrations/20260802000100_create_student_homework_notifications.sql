create table if not exists public.student_homework_assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  exam_type text not null default 'General' check (exam_type in ('IELTS', 'PTE', 'General')),
  content text not null check (char_length(trim(content)) > 0),
  status text not null default 'assigned' check (status in ('assigned', 'seen', 'completed', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  email_sent_at timestamptz,
  email_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'homework',
  title text not null,
  message text not null,
  href text,
  homework_id uuid references public.student_homework_assignments(id) on delete cascade,
  is_read boolean not null default false,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists student_homework_assignments_student_created_idx
  on public.student_homework_assignments (student_id, created_at desc);

create index if not exists student_homework_assignments_teacher_created_idx
  on public.student_homework_assignments (teacher_id, created_at desc);

create index if not exists student_notifications_user_created_idx
  on public.student_notifications (user_id, created_at desc);

create index if not exists student_notifications_user_unread_idx
  on public.student_notifications (user_id, is_read, created_at desc);

create or replace function public.touch_student_homework_assignments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_student_homework_assignments_updated_at on public.student_homework_assignments;
create trigger touch_student_homework_assignments_updated_at
before update on public.student_homework_assignments
for each row
execute function public.touch_student_homework_assignments_updated_at();

alter table public.student_homework_assignments enable row level security;
alter table public.student_notifications enable row level security;

drop policy if exists "Users can read own homework assignments" on public.student_homework_assignments;
create policy "Users can read own homework assignments"
on public.student_homework_assignments
for select
to authenticated
using (auth.uid() = student_id);

drop policy if exists "Admins can manage homework assignments" on public.student_homework_assignments;
create policy "Admins can manage homework assignments"
on public.student_homework_assignments
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'editor')
  )
);

drop policy if exists "Users can read own notifications" on public.student_notifications;
create policy "Users can read own notifications"
on public.student_notifications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can update own notification read state" on public.student_notifications;
create policy "Users can update own notification read state"
on public.student_notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Admins can manage notifications" on public.student_notifications;
create policy "Admins can manage notifications"
on public.student_notifications
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'editor')
  )
);
