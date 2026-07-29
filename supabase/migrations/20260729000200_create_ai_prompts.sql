create table if not exists public.ai_prompts (
  id text primary key,
  title text not null,
  category text not null default 'Custom',
  scope text not null default 'user' check (scope in ('system', 'user', 'input')),
  description text,
  used_by text[] not null default '{}',
  variables jsonb not null default '[]'::jsonb,
  content text not null,
  default_content text,
  is_active boolean not null default true,
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create index if not exists ai_prompts_category_idx on public.ai_prompts (category);
create index if not exists ai_prompts_active_idx on public.ai_prompts (is_active);
create index if not exists ai_prompts_updated_at_idx on public.ai_prompts (updated_at desc);

alter table public.ai_prompts enable row level security;

drop policy if exists "ai_prompts_staff_select" on public.ai_prompts;
create policy "ai_prompts_staff_select"
on public.ai_prompts
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'editor')
  )
);

drop policy if exists "ai_prompts_admin_insert" on public.ai_prompts;
create policy "ai_prompts_admin_insert"
on public.ai_prompts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "ai_prompts_admin_update" on public.ai_prompts;
create policy "ai_prompts_admin_update"
on public.ai_prompts
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);
