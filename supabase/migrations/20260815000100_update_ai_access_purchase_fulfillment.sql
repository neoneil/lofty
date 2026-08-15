create or replace function public.fulfill_ai_access_purchase(
  p_user_id uuid,
  p_package_code text,
  p_access_days integer,
  p_stripe_checkout_session_id text,
  p_stripe_customer_id text default null,
  p_stripe_payment_intent_id text default null,
  p_amount_total integer default null,
  p_amount_subtotal integer default null,
  p_currency text default 'aud',
  p_payment_status text default 'paid',
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.ai_access_purchases%rowtype;
  v_limit public.ai_user_limits%rowtype;
  v_now timestamptz := now();
  v_start_at timestamptz;
  v_until timestamptz;
begin
  if p_access_days not in (30, 60, 90, 180) then
    raise exception 'Invalid AI access days: %', p_access_days;
  end if;

  if p_package_code not in ('ai_30_days', 'ai_60_days', 'ai_90_days', 'ai_180_days') then
    raise exception 'Invalid AI package code: %', p_package_code;
  end if;

  if p_stripe_checkout_session_id is null or length(trim(p_stripe_checkout_session_id)) = 0 then
    raise exception 'Missing Stripe Checkout Session ID';
  end if;

  insert into public.ai_access_purchases (
    user_id,
    package_code,
    access_days,
    status,
    currency,
    amount_total,
    amount_subtotal,
    stripe_customer_id,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    stripe_payment_status,
    metadata
  )
  values (
    p_user_id,
    p_package_code,
    p_access_days,
    'paid',
    lower(coalesce(p_currency, 'aud')),
    p_amount_total,
    p_amount_subtotal,
    p_stripe_customer_id,
    p_stripe_checkout_session_id,
    p_stripe_payment_intent_id,
    p_payment_status,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (stripe_checkout_session_id)
  do update set
    stripe_payment_status = excluded.stripe_payment_status,
    stripe_payment_intent_id = coalesce(public.ai_access_purchases.stripe_payment_intent_id, excluded.stripe_payment_intent_id),
    amount_total = coalesce(public.ai_access_purchases.amount_total, excluded.amount_total),
    amount_subtotal = coalesce(public.ai_access_purchases.amount_subtotal, excluded.amount_subtotal),
    stripe_customer_id = coalesce(public.ai_access_purchases.stripe_customer_id, excluded.stripe_customer_id),
    metadata = public.ai_access_purchases.metadata || excluded.metadata
  returning * into v_purchase;

  if v_purchase.status = 'fulfilled' then
    return jsonb_build_object(
      'ok', true,
      'alreadyFulfilled', true,
      'purchaseId', v_purchase.id,
      'userId', v_purchase.user_id,
      'accessUntil', v_purchase.access_until
    );
  end if;

  insert into public.ai_user_limits (
    user_id,
    daily_limit,
    monthly_limit,
    is_unlimited,
    unlimited_until
  )
  values (
    p_user_id,
    5,
    100,
    false,
    null
  )
  on conflict (user_id) do nothing;

  select *
  into v_limit
  from public.ai_user_limits
  where user_id = p_user_id
  for update;

  v_start_at := greatest(coalesce(v_limit.unlimited_until, v_now), v_now);
  v_until := v_start_at + make_interval(days => p_access_days);

  update public.ai_user_limits
  set
    is_unlimited = true,
    unlimited_until = v_until,
    updated_at = v_now
  where user_id = p_user_id;

  update public.ai_access_purchases
  set
    status = 'fulfilled',
    access_started_at = v_start_at,
    access_until = v_until
  where id = v_purchase.id
  returning * into v_purchase;

  return jsonb_build_object(
    'ok', true,
    'purchaseId', v_purchase.id,
    'userId', p_user_id,
    'accessStartedAt', v_start_at,
    'accessUntil', v_until,
    'accessDays', p_access_days
  );
end;
$$;

grant execute on function public.fulfill_ai_access_purchase(
  uuid,
  text,
  integer,
  text,
  text,
  text,
  integer,
  integer,
  text,
  text,
  jsonb
) to service_role;
