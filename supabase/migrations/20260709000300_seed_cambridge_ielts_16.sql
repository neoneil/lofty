-- Seed Cambridge IELTS 16 shell rows so the shared importer can attach content.

insert into ielts.cambridge_books (book_number, title, is_active)
values (16, 'Cambridge IELTS 16', true)
on conflict (book_number) do update
set
  title = excluded.title,
  is_active = excluded.is_active,
  updated_at = now();

with book as (
  select id
  from ielts.cambridge_books
  where book_number = 16
),
test_seed(test_number, title) as (
  values
    (1, 'Cambridge IELTS 16 Test 1'),
    (2, 'Cambridge IELTS 16 Test 2'),
    (3, 'Cambridge IELTS 16 Test 3'),
    (4, 'Cambridge IELTS 16 Test 4')
),
upserted_tests as (
  insert into ielts.tests (book_id, test_number, title, source_name, source_url, license)
  select
    book.id,
    test_seed.test_number,
    test_seed.title,
    'WinIELTS',
    'https://www.winielts.com/ielts-cbt',
    'Authorized use'
  from book
  cross join test_seed
  on conflict (book_id, test_number) do update
  set
    title = excluded.title,
    source_name = excluded.source_name,
    source_url = excluded.source_url,
    license = excluded.license,
    updated_at = now()
  returning id, test_number
),
module_seed(module_type, title_suffix, duration_minutes, sort_order) as (
  values
    ('listening', 'Listening', 30, 1),
    ('reading', 'Reading', 60, 2),
    ('writing', 'Writing', 60, 3)
)
insert into ielts.test_modules (test_id, module_type, title, duration_minutes, sort_order, raw_data)
select
  upserted_tests.id,
  module_seed.module_type,
  'Cambridge IELTS 16 Test ' || upserted_tests.test_number || ' ' || module_seed.title_suffix,
  module_seed.duration_minutes,
  module_seed.sort_order,
  '{}'::jsonb
from upserted_tests
cross join module_seed
on conflict (test_id, module_type) do update
set
  title = excluded.title,
  duration_minutes = excluded.duration_minutes,
  sort_order = excluded.sort_order,
  updated_at = now();
