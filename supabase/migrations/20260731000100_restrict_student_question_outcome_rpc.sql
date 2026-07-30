REVOKE EXECUTE ON FUNCTION public.record_student_question_outcome(uuid, text, text, text, text, integer, boolean, numeric, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_student_question_outcome(uuid, text, text, text, text, integer, boolean, numeric, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_student_question_outcome(uuid, text, text, text, text, integer, boolean, numeric, boolean) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.record_student_question_outcome(uuid, text, text, text, text, integer, boolean, numeric, boolean) TO service_role;
