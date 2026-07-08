-- IELTS content library for authorized Cambridge-style practice materials.
-- Storage note: Supabase Storage folders are virtual. The ielts bucket is expected
-- to already exist. Uploading objects such as 21/.keep or 21/test-1/.keep will
-- make those folders appear in the Storage UI.

create schema if not exists ielts;

create or replace function ielts.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function ielts.is_admin()
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
      and p.role = 'admin'
  );
$$;

create table if not exists ielts.cambridge_books (
  id uuid primary key default gen_random_uuid(),
  book_number integer not null unique,
  title text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ielts.tests (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references ielts.cambridge_books(id) on delete cascade,
  test_number integer not null,
  title text not null,
  source_name text,
  source_url text,
  license text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(book_id, test_number)
);

create table if not exists ielts.test_modules (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references ielts.tests(id) on delete cascade,
  module_type text not null check (module_type in ('listening', 'reading', 'writing', 'speaking')),
  title text not null,
  duration_minutes integer,
  sort_order integer not null default 0,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(test_id, module_type)
);

create table if not exists ielts.sections (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references ielts.test_modules(id) on delete cascade,
  section_number integer not null,
  title text,
  instruction text,
  passage_title text,
  passage_text text,
  sort_order integer not null default 0,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module_id, section_number)
);

create table if not exists ielts.questions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references ielts.sections(id) on delete cascade,
  question_number_start integer not null,
  question_number_end integer,
  question_type text not null,
  prompt text,
  instruction text,
  content jsonb not null default '{}'::jsonb,
  options jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ielts.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references ielts.questions(id) on delete cascade,
  answer_data jsonb not null default '{}'::jsonb,
  explanation text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(question_id)
);

create table if not exists ielts.assets (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references ielts.cambridge_books(id) on delete cascade,
  test_id uuid references ielts.tests(id) on delete cascade,
  module_id uuid references ielts.test_modules(id) on delete cascade,
  section_id uuid references ielts.sections(id) on delete cascade,
  question_id uuid references ielts.questions(id) on delete cascade,
  asset_type text not null check (asset_type in ('audio', 'image', 'pdf', 'json', 'other')),
  bucket text not null default 'ielts',
  storage_path text not null,
  public_url text,
  mime_type text,
  duration_seconds integer,
  width integer,
  height integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(bucket, storage_path)
);

drop trigger if exists trg_cambridge_books_updated_at on ielts.cambridge_books;
create trigger trg_cambridge_books_updated_at
before update on ielts.cambridge_books
for each row
execute function ielts.set_updated_at();

drop trigger if exists trg_tests_updated_at on ielts.tests;
create trigger trg_tests_updated_at
before update on ielts.tests
for each row
execute function ielts.set_updated_at();

drop trigger if exists trg_test_modules_updated_at on ielts.test_modules;
create trigger trg_test_modules_updated_at
before update on ielts.test_modules
for each row
execute function ielts.set_updated_at();

drop trigger if exists trg_sections_updated_at on ielts.sections;
create trigger trg_sections_updated_at
before update on ielts.sections
for each row
execute function ielts.set_updated_at();

drop trigger if exists trg_questions_updated_at on ielts.questions;
create trigger trg_questions_updated_at
before update on ielts.questions
for each row
execute function ielts.set_updated_at();

drop trigger if exists trg_answers_updated_at on ielts.answers;
create trigger trg_answers_updated_at
before update on ielts.answers
for each row
execute function ielts.set_updated_at();

create index if not exists idx_ielts_tests_book_id on ielts.tests(book_id);
create index if not exists idx_ielts_modules_test_id on ielts.test_modules(test_id);
create index if not exists idx_ielts_sections_module_id on ielts.sections(module_id);
create index if not exists idx_ielts_questions_section_id on ielts.questions(section_id);
create index if not exists idx_ielts_questions_number on ielts.questions(section_id, question_number_start, question_number_end);
create index if not exists idx_ielts_assets_lookup on ielts.assets(book_id, test_id, module_id, asset_type);
create index if not exists idx_ielts_questions_content_gin on ielts.questions using gin(content);
create index if not exists idx_ielts_questions_raw_data_gin on ielts.questions using gin(raw_data);

alter table ielts.cambridge_books enable row level security;
alter table ielts.tests enable row level security;
alter table ielts.test_modules enable row level security;
alter table ielts.sections enable row level security;
alter table ielts.questions enable row level security;
alter table ielts.answers enable row level security;
alter table ielts.assets enable row level security;

drop policy if exists "Authenticated users can read IELTS books" on ielts.cambridge_books;
create policy "Authenticated users can read IELTS books"
on ielts.cambridge_books
for select
to authenticated
using (true);

drop policy if exists "Admins can manage IELTS books" on ielts.cambridge_books;
create policy "Admins can manage IELTS books"
on ielts.cambridge_books
for all
to authenticated
using (ielts.is_admin())
with check (ielts.is_admin());

drop policy if exists "Authenticated users can read IELTS tests" on ielts.tests;
create policy "Authenticated users can read IELTS tests"
on ielts.tests
for select
to authenticated
using (true);

drop policy if exists "Admins can manage IELTS tests" on ielts.tests;
create policy "Admins can manage IELTS tests"
on ielts.tests
for all
to authenticated
using (ielts.is_admin())
with check (ielts.is_admin());

drop policy if exists "Authenticated users can read IELTS modules" on ielts.test_modules;
create policy "Authenticated users can read IELTS modules"
on ielts.test_modules
for select
to authenticated
using (true);

drop policy if exists "Admins can manage IELTS modules" on ielts.test_modules;
create policy "Admins can manage IELTS modules"
on ielts.test_modules
for all
to authenticated
using (ielts.is_admin())
with check (ielts.is_admin());

drop policy if exists "Authenticated users can read IELTS sections" on ielts.sections;
create policy "Authenticated users can read IELTS sections"
on ielts.sections
for select
to authenticated
using (true);

drop policy if exists "Admins can manage IELTS sections" on ielts.sections;
create policy "Admins can manage IELTS sections"
on ielts.sections
for all
to authenticated
using (ielts.is_admin())
with check (ielts.is_admin());

drop policy if exists "Authenticated users can read IELTS questions" on ielts.questions;
create policy "Authenticated users can read IELTS questions"
on ielts.questions
for select
to authenticated
using (true);

drop policy if exists "Admins can manage IELTS questions" on ielts.questions;
create policy "Admins can manage IELTS questions"
on ielts.questions
for all
to authenticated
using (ielts.is_admin())
with check (ielts.is_admin());

drop policy if exists "Authenticated users can read IELTS answers" on ielts.answers;
create policy "Authenticated users can read IELTS answers"
on ielts.answers
for select
to authenticated
using (true);

drop policy if exists "Admins can manage IELTS answers" on ielts.answers;
create policy "Admins can manage IELTS answers"
on ielts.answers
for all
to authenticated
using (ielts.is_admin())
with check (ielts.is_admin());

drop policy if exists "Authenticated users can read IELTS assets" on ielts.assets;
create policy "Authenticated users can read IELTS assets"
on ielts.assets
for select
to authenticated
using (true);

drop policy if exists "Admins can manage IELTS assets" on ielts.assets;
create policy "Admins can manage IELTS assets"
on ielts.assets
for all
to authenticated
using (ielts.is_admin())
with check (ielts.is_admin());

drop policy if exists "Authenticated users can read IELTS storage objects" on storage.objects;
create policy "Authenticated users can read IELTS storage objects"
on storage.objects
for select
to authenticated
using (bucket_id = 'ielts');

drop policy if exists "Admins can upload IELTS storage objects" on storage.objects;
create policy "Admins can upload IELTS storage objects"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'ielts' and ielts.is_admin());

drop policy if exists "Admins can update IELTS storage objects" on storage.objects;
create policy "Admins can update IELTS storage objects"
on storage.objects
for update
to authenticated
using (bucket_id = 'ielts' and ielts.is_admin())
with check (bucket_id = 'ielts' and ielts.is_admin());

drop policy if exists "Admins can delete IELTS storage objects" on storage.objects;
create policy "Admins can delete IELTS storage objects"
on storage.objects
for delete
to authenticated
using (bucket_id = 'ielts' and ielts.is_admin());

grant usage on schema ielts to authenticated;
grant execute on function ielts.is_admin() to authenticated;
grant select, insert, update, delete on all tables in schema ielts to authenticated;
alter default privileges in schema ielts grant select, insert, update, delete on tables to authenticated;

insert into ielts.cambridge_books (book_number, title)
values
  (21, 'Cambridge IELTS 21'),
  (20, 'Cambridge IELTS 20'),
  (19, 'Cambridge IELTS 19'),
  (18, 'Cambridge IELTS 18'),
  (17, 'Cambridge IELTS 17')
on conflict (book_number) do nothing;

insert into ielts.tests (book_id, test_number, title)
select
  b.id,
  test_number,
  'Cambridge IELTS ' || b.book_number || ' Test ' || test_number
from ielts.cambridge_books b
cross join generate_series(1, 4) as test_number
where b.book_number in (21, 20, 19, 18, 17)
on conflict (book_id, test_number) do nothing;

insert into ielts.test_modules (test_id, module_type, title, duration_minutes, sort_order)
select
  t.id,
  module.module_type,
  module.title,
  module.duration_minutes,
  module.sort_order
from ielts.tests t
cross join (
  values
    ('listening', 'Listening', 31, 1),
    ('reading', 'Reading', 60, 2),
    ('writing', 'Writing', 60, 3)
) as module(module_type, title, duration_minutes, sort_order)
on conflict (test_id, module_type) do nothing;
