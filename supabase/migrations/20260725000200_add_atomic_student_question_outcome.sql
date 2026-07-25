CREATE OR REPLACE FUNCTION public.record_student_question_outcome(
  p_user_id uuid,
  p_exam_type text,
  p_module_type text,
  p_question_source text,
  p_question_id text,
  p_duration_seconds integer DEFAULT 0,
  p_is_correct boolean DEFAULT false,
  p_score numeric DEFAULT NULL,
  p_update_wrong_book boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_duration integer := greatest(coalesce(p_duration_seconds, 0), 0);
  v_stat_id public.student_question_stats.id%TYPE;
  v_wrong_id public.student_wrong_questions.id%TYPE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text || ':' || p_question_source || ':' || p_question_id));

  SELECT id
  INTO v_stat_id
  FROM public.student_question_stats
  WHERE user_id = p_user_id
    AND question_source = p_question_source
    AND question_id = p_question_id
  LIMIT 1;

  IF v_stat_id IS NULL THEN
    INSERT INTO public.student_question_stats (
      user_id,
      exam_type,
      module_type,
      question_source,
      question_id,
      attempt_count,
      completed_count,
      correct_count,
      wrong_count,
      total_duration_seconds,
      last_attempt_at,
      last_correct_at,
      last_wrong_at,
      is_practiced,
      is_in_wrong_book,
      best_score,
      latest_score
    )
    VALUES (
      p_user_id,
      p_exam_type,
      p_module_type,
      p_question_source,
      p_question_id,
      1,
      1,
      CASE WHEN p_update_wrong_book AND p_is_correct THEN 1 ELSE 0 END,
      CASE WHEN p_update_wrong_book AND NOT p_is_correct THEN 1 ELSE 0 END,
      v_duration,
      v_now,
      CASE WHEN p_update_wrong_book AND p_is_correct THEN v_now ELSE NULL END,
      CASE WHEN p_update_wrong_book AND NOT p_is_correct THEN v_now ELSE NULL END,
      true,
      CASE WHEN p_update_wrong_book THEN NOT p_is_correct ELSE false END,
      p_score,
      p_score
    );
  ELSE
    UPDATE public.student_question_stats
    SET
      attempt_count = attempt_count + 1,
      completed_count = completed_count + 1,
      correct_count = correct_count + CASE WHEN p_update_wrong_book AND p_is_correct THEN 1 ELSE 0 END,
      wrong_count = wrong_count + CASE WHEN p_update_wrong_book AND NOT p_is_correct THEN 1 ELSE 0 END,
      total_duration_seconds = total_duration_seconds + v_duration,
      last_attempt_at = v_now,
      last_correct_at = CASE WHEN p_update_wrong_book AND p_is_correct THEN v_now ELSE last_correct_at END,
      last_wrong_at = CASE WHEN p_update_wrong_book AND NOT p_is_correct THEN v_now ELSE last_wrong_at END,
      is_practiced = true,
      is_in_wrong_book = CASE WHEN p_update_wrong_book THEN NOT p_is_correct ELSE is_in_wrong_book END,
      latest_score = coalesce(p_score, latest_score),
      best_score = CASE
        WHEN p_score IS NULL THEN best_score
        WHEN best_score IS NULL THEN p_score
        ELSE greatest(best_score, p_score)
      END,
      updated_at = v_now
    WHERE id = v_stat_id;
  END IF;

  IF NOT p_update_wrong_book THEN
    RETURN;
  END IF;

  SELECT id
  INTO v_wrong_id
  FROM public.student_wrong_questions
  WHERE user_id = p_user_id
    AND question_source = p_question_source
    AND question_id = p_question_id
  LIMIT 1;

  IF p_is_correct THEN
    IF v_wrong_id IS NOT NULL THEN
      UPDATE public.student_wrong_questions
      SET is_resolved = true, resolved_at = v_now, updated_at = v_now
      WHERE id = v_wrong_id;
    END IF;
  ELSE
    IF v_wrong_id IS NULL THEN
      INSERT INTO public.student_wrong_questions (
        user_id,
        exam_type,
        module_type,
        question_source,
        question_id,
        first_wrong_at,
        last_wrong_at,
        wrong_count,
        is_resolved
      )
      VALUES (
        p_user_id,
        p_exam_type,
        p_module_type,
        p_question_source,
        p_question_id,
        v_now,
        v_now,
        1,
        false
      );
    ELSE
      UPDATE public.student_wrong_questions
      SET
        last_wrong_at = v_now,
        wrong_count = wrong_count + 1,
        is_resolved = false,
        resolved_at = NULL,
        updated_at = v_now
      WHERE id = v_wrong_id;
    END IF;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_student_question_outcome(uuid, text, text, text, text, integer, boolean, numeric, boolean) TO authenticated, service_role;
