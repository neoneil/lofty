create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_id text not null,
  device_label text,
  device_type text not null default 'unknown'
    check (device_type in ('desktop', 'mobile', 'tablet', 'unknown')),
  os_name text,
  os_version text,
  browser_name text,
  browser_version text,
  user_agent text,
  ip_address inet,
  country text,
  region text,
  city text,
  timezone text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_login_at timestamptz,
  is_trusted boolean not null default false,
  is_blocked boolean not null default false,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_devices_user_device_unique unique (user_id, device_id)
);

create index if not exists user_devices_user_last_seen_idx
on public.user_devices (user_id, last_seen_at desc);

create index if not exists user_devices_device_id_idx
on public.user_devices (device_id);

create index if not exists user_devices_blocked_idx
on public.user_devices (is_blocked)
where is_blocked = true;

create table if not exists public.login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  user_device_id uuid references public.user_devices(id) on delete set null,
  device_id text,
  event_type text not null default 'login'
    check (event_type in ('login', 'logout', 'session_refresh', 'device_seen')),
  login_method text not null default 'email'
    check (login_method in ('email', 'google', 'magic_link', 'unknown')),
  result text not null default 'success'
    check (result in ('success', 'failed', 'blocked')),
  is_new_device boolean not null default false,
  attempted_email text,
  ip_address inet,
  country text,
  region text,
  city text,
  timezone text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists login_events_user_created_idx
on public.login_events (user_id, created_at desc);

create index if not exists login_events_device_created_idx
on public.login_events (device_id, created_at desc);

create index if not exists login_events_created_idx
on public.login_events (created_at desc);

create index if not exists login_events_result_idx
on public.login_events (result, created_at desc);

create or replace function public.set_user_devices_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_devices_updated_at on public.user_devices;

create trigger set_user_devices_updated_at
before update on public.user_devices
for each row
execute function public.set_user_devices_updated_at();

alter table public.user_devices enable row level security;
alter table public.login_events enable row level security;

drop policy if exists "Users can read own devices" on public.user_devices;
create policy "Users can read own devices"
on public.user_devices
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can update own device trust label" on public.user_devices;

drop policy if exists "Admins can manage user devices" on public.user_devices;
create policy "Admins can manage user devices"
on public.user_devices
for all
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

drop policy if exists "Users can read own login events" on public.login_events;
create policy "Users can read own login events"
on public.login_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can read login events" on public.login_events;
create policy "Admins can read login events"
on public.login_events
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Admins can insert login events" on public.login_events;
create policy "Admins can insert login events"
on public.login_events
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
