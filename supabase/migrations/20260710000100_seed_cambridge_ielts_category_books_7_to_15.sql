-- Seed Cambridge IELTS category-library shell rows for books 7-15.
-- These books are imported from the WinIELTS category practice endpoints and
-- currently include listening and reading modules only.

with book_seed(book_number, title) as (
  values
    (15, 'Cambridge IELTS 15'),
    (14, 'Cambridge IELTS 14'),
    (13, 'Cambridge IELTS 13'),
    (12, 'Cambridge IELTS 12'),
    (11, 'Cambridge IELTS 11'),
    (10, 'Cambridge IELTS 10'),
    (9, 'Cambridge IELTS 9'),
    (8, 'Cambridge IELTS 8'),
    (7, 'Cambridge IELTS 7')
)
insert into ielts.cambridge_books (book_number, title, is_active)
select book_number, title, true
from book_seed
on conflict (book_number) do update
set
  title = excluded.title,
  is_active = excluded.is_active,
  updated_at = now();

with target_books as (
  select id, book_number
  from ielts.cambridge_books
  where book_number between 7 and 15
),
test_seed(test_number) as (
  values (1), (2), (3), (4)
)
insert into ielts.tests (book_id, test_number, title, source_name, source_url, license)
select
  target_books.id,
  test_seed.test_number,
  'Cambridge IELTS ' || target_books.book_number || ' Test ' || test_seed.test_number,
  'WinIELTS Category Library',
  'https://www.winielts.com/question/category',
  'Authorized use'
from target_books
cross join test_seed
on conflict (book_id, test_number) do update
set
  title = excluded.title,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  license = excluded.license,
  updated_at = now();

with target_tests as (
  select
    tests.id,
    tests.test_number,
    cambridge_books.book_number
  from ielts.tests
  join ielts.cambridge_books on cambridge_books.id = tests.book_id
  where cambridge_books.book_number between 7 and 15
),
module_seed(module_type, title_suffix, duration_minutes, sort_order) as (
  values
    ('listening', 'Listening', 30, 1),
    ('reading', 'Reading', 60, 2)
)
insert into ielts.test_modules (test_id, module_type, title, duration_minutes, sort_order, raw_data)
select
  target_tests.id,
  module_seed.module_type,
  'Cambridge IELTS ' || target_tests.book_number || ' Test ' || target_tests.test_number || ' ' || module_seed.title_suffix,
  module_seed.duration_minutes,
  module_seed.sort_order,
  jsonb_build_object('source', 'ieltsCategory')
from target_tests
cross join module_seed
on conflict (test_id, module_type) do update
set
  title = excluded.title,
  duration_minutes = excluded.duration_minutes,
  sort_order = excluded.sort_order,
  raw_data = excluded.raw_data,
  updated_at = now();
