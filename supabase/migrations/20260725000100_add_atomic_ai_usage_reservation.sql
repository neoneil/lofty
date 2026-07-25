CREATE OR REPLACE FUNCTION public.reserve_ai_usage(
  p_user_id uuid,
  p_feature text,
  p_reservation_model text DEFAULT 'reserved'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_my_student boolean;
  v_limit record;
  v_today_start timestamptz := date_trunc('day', now());
  v_month_start timestamptz := date_trunc('month', now());
  v_reserved_cutoff timestamptz := now() - interval '30 minutes';
  v_today_used integer := 0;
  v_month_used integer := 0;
  v_log_id bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  SELECT profiles.is_my_student
  INTO v_is_my_student
  FROM public.profiles
  WHERE profiles.id = p_user_id;

  IF COALESCE(v_is_my_student, false) THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'userId', p_user_id,
      'feature', p_feature,
      'isUnlimited', true,
      'todayUsed', 0,
      'monthUsed', 0,
      'dailyLimit', 0,
      'monthlyLimit', 0,
      'unlimitedUntil', NULL,
      'usageLogId', NULL
    );
  END IF;

  SELECT daily_limit, monthly_limit, is_unlimited, unlimited_until
  INTO v_limit
  FROM public.ai_user_limits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'code', 'AI_LIMIT_RECORD_NOT_FOUND',
      'message', 'AI usage limit record was not found for this user.',
      'userId', p_user_id,
      'feature', p_feature,
      'todayUsed', 0,
      'monthUsed', 0,
      'dailyLimit', NULL,
      'monthlyLimit', NULL,
      'isUnlimited', false,
      'unlimitedUntil', NULL
    );
  END IF;

  IF v_limit.is_unlimited AND v_limit.unlimited_until IS NOT NULL AND v_limit.unlimited_until <= now() THEN
    UPDATE public.ai_user_limits
    SET is_unlimited = false, unlimited_until = NULL
    WHERE user_id = p_user_id;

    v_limit.is_unlimited := false;
    v_limit.unlimited_until := NULL;
  END IF;

  IF v_limit.is_unlimited THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'userId', p_user_id,
      'feature', p_feature,
      'isUnlimited', true,
      'todayUsed', 0,
      'monthUsed', 0,
      'dailyLimit', v_limit.daily_limit,
      'monthlyLimit', v_limit.monthly_limit,
      'unlimitedUntil', v_limit.unlimited_until,
      'usageLogId', NULL
    );
  END IF;

  SELECT COUNT(*)
  INTO v_today_used
  FROM public.ai_usage_logs
  WHERE user_id = p_user_id
    AND created_at >= v_today_start
    AND (
      status = 'success'
      OR (status = 'reserved' AND created_at >= v_reserved_cutoff)
    );

  SELECT COUNT(*)
  INTO v_month_used
  FROM public.ai_usage_logs
  WHERE user_id = p_user_id
    AND created_at >= v_month_start
    AND (
      status = 'success'
      OR (status = 'reserved' AND created_at >= v_reserved_cutoff)
    );

  IF v_today_used >= v_limit.daily_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'code', 'AI_DAILY_LIMIT_REACHED',
      'message', 'Daily AI usage limit reached.',
      'userId', p_user_id,
      'feature', p_feature,
      'todayUsed', v_today_used,
      'monthUsed', v_month_used,
      'dailyLimit', v_limit.daily_limit,
      'monthlyLimit', v_limit.monthly_limit,
      'isUnlimited', false,
      'unlimitedUntil', NULL
    );
  END IF;

  IF v_month_used >= v_limit.monthly_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'code', 'AI_MONTHLY_LIMIT_REACHED',
      'message', 'Monthly AI usage limit reached.',
      'userId', p_user_id,
      'feature', p_feature,
      'todayUsed', v_today_used,
      'monthUsed', v_month_used,
      'dailyLimit', v_limit.daily_limit,
      'monthlyLimit', v_limit.monthly_limit,
      'isUnlimited', false,
      'unlimitedUntil', NULL
    );
  END IF;

  INSERT INTO public.ai_usage_logs (
    user_id,
    feature,
    model,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    estimated_cost,
    status
  )
  VALUES (
    p_user_id,
    p_feature,
    p_reservation_model,
    0,
    0,
    0,
    0,
    'reserved'
  )
  RETURNING id INTO v_log_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'userId', p_user_id,
    'feature', p_feature,
    'isUnlimited', false,
    'todayUsed', v_today_used,
    'monthUsed', v_month_used,
    'dailyLimit', v_limit.daily_limit,
    'monthlyLimit', v_limit.monthly_limit,
    'unlimitedUntil', NULL,
    'usageLogId', v_log_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_ai_usage(uuid, text, text) TO service_role;
