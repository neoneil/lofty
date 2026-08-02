alter table public.user_devices
  add column if not exists current_path text,
  add column if not exists current_title text,
  add column if not exists current_path_seen_at timestamptz;

create index if not exists user_devices_current_path_seen_idx
on public.user_devices (user_id, current_path_seen_at desc);

create table if not exists public.user_activity_daily (
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_date date not null,
  active_seconds integer not null default 0 check (active_seconds >= 0 and active_seconds <= 86400),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, activity_date)
);

create index if not exists user_activity_daily_date_idx
on public.user_activity_daily (activity_date desc);

create or replace function public.record_user_activity_heartbeat(
  p_user_id uuid,
  p_device_id text,
  p_current_path text,
  p_current_title text,
  p_active_seconds integer,
  p_seen_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_active_seconds integer := greatest(0, least(coalesce(p_active_seconds, 0), 120));
  v_activity_date date := (p_seen_at at time zone 'Australia/Sydney')::date;
begin
  update public.user_devices
  set
    last_seen_at = p_seen_at,
    current_path = nullif(left(coalesce(p_current_path, ''), 500), ''),
    current_title = nullif(left(coalesce(p_current_title, ''), 180), ''),
    current_path_seen_at = p_seen_at
  where user_id = p_user_id
    and device_id = p_device_id
    and revoked_at is null
    and is_blocked = false;

  insert into public.user_activity_daily (
    user_id,
    activity_date,
    active_seconds,
    last_seen_at
  )
  values (
    p_user_id,
    v_activity_date,
    v_active_seconds,
    p_seen_at
  )
  on conflict (user_id, activity_date)
  do update set
    active_seconds = least(86400, public.user_activity_daily.active_seconds + excluded.active_seconds),
    last_seen_at = greatest(public.user_activity_daily.last_seen_at, excluded.last_seen_at),
    updated_at = now();
end;
$$;

alter table public.user_activity_daily enable row level security;

drop policy if exists "Users can read own daily activity" on public.user_activity_daily;
create policy "Users can read own daily activity"
on public.user_activity_daily
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can read daily activity" on public.user_activity_daily;
create policy "Admins can read daily activity"
on public.user_activity_daily
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

revoke execute on function public.record_user_activity_heartbeat(uuid, text, text, text, integer, timestamptz) from public;
revoke execute on function public.record_user_activity_heartbeat(uuid, text, text, text, integer, timestamptz) from anon;
revoke execute on function public.record_user_activity_heartbeat(uuid, text, text, text, integer, timestamptz) from authenticated;
grant execute on function public.record_user_activity_heartbeat(uuid, text, text, text, integer, timestamptz) to service_role;
