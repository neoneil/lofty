--
-- PostgreSQL database dump
--

\restrict WPhrhtoAbeO5Cvr6XVSdrBnpWkF1haZLMwDQznQj9Ln00c5PSRuz5VuwUFyuY1i

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9 (Ubuntu 17.9-1.pgdg22.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pte; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pte;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: views; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA views;


--
-- Name: asq_search_trigger(); Type: FUNCTION; Schema: pte; Owner: -
--

CREATE FUNCTION pte.asq_search_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

begin

    new.search_text :=

        coalesce(new.question_text, '') || ' ' ||

        coalesce(new.answer_text, '');

    new.search_vector :=

        setweight(
            to_tsvector(
                'english',
                coalesce(new.question_text, '')
            ),
            'A'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                coalesce(new.answer_text, '')
            ),
            'B'
        );

    return new;

end;

$$;


--
-- Name: di_search_trigger(); Type: FUNCTION; Schema: pte; Owner: -
--

CREATE FUNCTION pte.di_search_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

begin

    new.search_text :=

        coalesce(new.title, '') || ' ' ||

        coalesce(new.question_text, '') || ' ' ||

        coalesce(new.answer_info, '') || ' ' ||

        coalesce(new.ai_keywords, '');

    new.search_vector :=

        setweight(
            to_tsvector(
                'english',
                coalesce(new.title, '')
            ),
            'A'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                coalesce(new.ai_keywords, '')
            ),
            'A'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                coalesce(new.answer_info, '')
            ),
            'B'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                coalesce(new.question_text, '')
            ),
            'C'
        );

    return new;

end;

$$;


--
-- Name: fibr_search_trigger(); Type: FUNCTION; Schema: pte; Owner: -
--

CREATE FUNCTION pte.fibr_search_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

begin

    new.search_text :=

        coalesce(new.question_title, '') || ' ' ||

        coalesce(new.question_body_text, '');

    new.search_vector :=

        setweight(
            to_tsvector(
                'english',
                coalesce(new.question_title, '')
            ),
            'A'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                coalesce(new.question_body_text, '')
            ),
            'B'
        );

    return new;

end;

$$;


--
-- Name: fibrw_search_trigger(); Type: FUNCTION; Schema: pte; Owner: -
--

CREATE FUNCTION pte.fibrw_search_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

begin

    new.search_text :=

        coalesce(new.question_title, '') || ' ' ||

        coalesce(new.question_body_text, '');

    new.search_vector :=

        setweight(
            to_tsvector(
                'english',
                coalesce(new.question_title, '')
            ),
            'A'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                coalesce(new.question_body_text, '')
            ),
            'B'
        );

    return new;

end;

$$;


--
-- Name: hiw_search_trigger(); Type: FUNCTION; Schema: pte; Owner: -
--

CREATE FUNCTION pte.hiw_search_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

begin

    new.search_text :=

        coalesce(new.question_text, '') || ' ' ||

        coalesce(new.display_text, '') || ' ' ||

        coalesce(new.transcript_text, '') || ' ' ||

        coalesce(new.question_body_text, '');

    new.search_vector :=

        setweight(
            to_tsvector(
                'english',
                coalesce(new.question_text, '')
            ),
            'A'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                coalesce(new.transcript_text, '')
            ),
            'B'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                coalesce(new.display_text, '')
            ),
            'C'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                coalesce(new.question_body_text, '')
            ),
            'C'
        );

    return new;

end;

$$;


--
-- Name: ra_search_trigger(); Type: FUNCTION; Schema: pte; Owner: -
--

CREATE FUNCTION pte.ra_search_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

begin

    new.search_text :=

        coalesce(new.question_title, '') || ' ' ||

        coalesce(new.question_body_text, '');

    new.search_vector :=

        setweight(
            to_tsvector(
                'english',
                coalesce(new.question_title, '')
            ),
            'A'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                coalesce(new.question_body_text, '')
            ),
            'B'
        );

    return new;

end;

$$;


--
-- Name: rl_search_trigger(); Type: FUNCTION; Schema: pte; Owner: -
--

CREATE FUNCTION pte.rl_search_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

begin

    new.search_text :=

        coalesce(new.title, '') || ' ' ||

        coalesce(new.question_title, '') || ' ' ||

        coalesce(new.question_text, '');

    new.search_vector :=

        setweight(
            to_tsvector(
                'english',
                coalesce(new.title, '')
            ),
            'A'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                coalesce(new.question_title, '')
            ),
            'A'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                coalesce(new.question_text, '')
            ),
            'B'
        );

    return new;

end;

$$;


--
-- Name: ro_search_trigger(); Type: FUNCTION; Schema: pte; Owner: -
--

CREATE FUNCTION pte.ro_search_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

begin

    new.search_text :=

        coalesce(new.question_title, '') || ' ' ||

        coalesce(new.question_body_text::text, '');

    new.search_vector :=

        setweight(
            to_tsvector(
                'english',
                coalesce(new.question_title, '')
            ),
            'A'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                coalesce(new.question_body_text::text, '')
            ),
            'B'
        );

    return new;

end;

$$;


--
-- Name: rs_search_trigger(); Type: FUNCTION; Schema: pte; Owner: -
--

CREATE FUNCTION pte.rs_search_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

begin

    new.search_text :=

        coalesce(new.question_text, '') || ' ' ||

        coalesce(new.answer_info, '') || ' ' ||

        coalesce(new.variant_text, '');

    new.search_vector :=

        setweight(
            to_tsvector(
                'english',
                coalesce(new.question_text, '')
            ),
            'A'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                coalesce(new.variant_text, '')
            ),
            'B'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                coalesce(new.answer_info, '')
            ),
            'C'
        );

    return new;

end;

$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: pte; Owner: -
--

CREATE FUNCTION pte.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: sst_search_trigger(); Type: FUNCTION; Schema: pte; Owner: -
--

CREATE FUNCTION pte.sst_search_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

begin

    new.search_text :=

        coalesce(new.question_text, '') || ' ' ||

        coalesce(new.transcript_text, '') || ' ' ||

        coalesce(new.answer_text, '');

    new.search_vector :=

        setweight(
            to_tsvector(
                'english',
                coalesce(new.question_text, '')
            ),
            'A'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                coalesce(new.transcript_text, '')
            ),
            'B'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                coalesce(new.answer_text, '')
            ),
            'C'
        );

    return new;

end;

$$;


--
-- Name: wfd_search_trigger(); Type: FUNCTION; Schema: pte; Owner: -
--

CREATE FUNCTION pte.wfd_search_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin

    new.search_text :=
        coalesce(new.question_text, '');

    new.search_vector :=
        to_tsvector(
            'english',
            coalesce(new.search_text, '')
        );

    return new;

end;
$$;


--
-- Name: admin_dashboard_active_students(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_dashboard_active_students() RETURNS TABLE(user_id uuid, display_name text, email text, avatar_url text, latest_question_source text, attempts bigint, last_submitted_at timestamp with time zone)
    LANGUAGE sql STABLE
    AS $$
  with latest_attempt as (
    select
      sa.user_id,
      sa.question_source,
      sa.submitted_at,
      row_number() over (
        partition by sa.user_id
        order by sa.submitted_at desc
      ) as rn
    from public.student_attempts sa
  )
  select
    sa.user_id,
    coalesce(
      nullif(p.full_name, ''),
      nullif(p.email, ''),
      sa.user_id::text
    ) as display_name,
    nullif(p.email, '') as email,
    nullif(p.avatar_url, '') as avatar_url,
    la.question_source::text as latest_question_source,
    count(*) as attempts,
    max(sa.submitted_at) as last_submitted_at
  from public.student_attempts sa
  left join public.profiles p
    on p.id = sa.user_id
  left join latest_attempt la
    on la.user_id = sa.user_id
   and la.rn = 1
  group by
    sa.user_id,
    p.full_name,
    p.email,
    p.avatar_url,
    la.question_source
  order by attempts desc, last_submitted_at desc
  limit 10;
$$;


--
-- Name: admin_dashboard_daily_trend(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_dashboard_daily_trend() RETURNS TABLE(day date, attempts bigint)
    LANGUAGE sql STABLE
    AS $$
  select
    date(submitted_at) as day,
    count(*) as attempts
  from public.student_attempts
  where submitted_at >= current_date - interval '6 days'
  group by date(submitted_at)
  order by day asc;
$$;


--
-- Name: admin_dashboard_overview(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_dashboard_overview() RETURNS TABLE(total_attempts bigint, today_attempts bigint, last_7_days_attempts bigint, total_students bigint)
    LANGUAGE sql STABLE
    AS $$
  select
    count(*) as total_attempts,
    count(*) filter (
      where submitted_at >= date_trunc('day', now())
    ) as today_attempts,
    count(*) filter (
      where submitted_at >= now() - interval '7 days'
    ) as last_7_days_attempts,
    count(distinct user_id) as total_students
  from public.student_attempts;
$$;


--
-- Name: admin_dashboard_source_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_dashboard_source_stats() RETURNS TABLE(question_source text, attempts bigint)
    LANGUAGE sql STABLE
    AS $$
  select
    question_source::text,
    count(*) as attempts
  from public.student_attempts
  group by question_source
  order by attempts desc;
$$;


--
-- Name: admin_pte_type_active_students(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_pte_type_active_students(p_type text) RETURNS TABLE(user_id uuid, display_name text, email text, avatar_url text, attempts bigint, last_submitted_at timestamp with time zone)
    LANGUAGE sql STABLE
    AS $$
  select
    sa.user_id,
    coalesce(
      nullif(p.full_name, ''),
      nullif(p.email, ''),
      sa.user_id::text
    ) as display_name,
    nullif(p.email, '') as email,
    nullif(p.avatar_url, '') as avatar_url,
    count(*) as attempts,
    max(sa.submitted_at) as last_submitted_at
  from public.student_attempts sa
  left join public.profiles p
    on p.id = sa.user_id
  where lower(sa.question_source) = lower(p_type)
  group by sa.user_id, p.full_name, p.email, p.avatar_url
  order by attempts desc, last_submitted_at desc
  limit 10;
$$;


--
-- Name: admin_pte_type_daily_trend(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_pte_type_daily_trend(p_type text) RETURNS TABLE(day date, attempts bigint)
    LANGUAGE sql STABLE
    AS $$
  select
    date(submitted_at) as day,
    count(*) as attempts
  from public.student_attempts
  where lower(question_source) = lower(p_type)
    and submitted_at >= current_date - interval '6 days'
  group by date(submitted_at)
  order by day asc;
$$;


--
-- Name: admin_pte_type_overview(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_pte_type_overview(p_type text) RETURNS TABLE(total_attempts bigint, total_students bigint, last_7_days_attempts bigint)
    LANGUAGE sql STABLE
    AS $$
  select
    count(*) as total_attempts,
    count(distinct user_id) as total_students,
    count(*) filter (
      where submitted_at >= now() - interval '7 days'
    ) as last_7_days_attempts
  from public.student_attempts
  where lower(question_source) = lower(p_type);
$$;


--
-- Name: admin_pte_type_top_questions(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_pte_type_top_questions(p_type text) RETURNS TABLE(question_id text, attempts bigint)
    LANGUAGE sql STABLE
    AS $$
  select
    sa.question_id::text as question_id,
    count(*) as attempts
  from public.student_attempts sa
  where lower(sa.question_source) = lower(p_type)
  group by sa.question_id
  order by attempts desc
  limit 10;
$$;


--
-- Name: admin_student_daily_detail_last_7_days(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_student_daily_detail_last_7_days(p_user_id uuid) RETURNS TABLE(day text, question_source text, attempts bigint, correct_count bigint, incorrect_count bigint)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select
    to_char(date_trunc('day', sa.submitted_at), 'YYYY-MM-DD') as day,
    sa.question_source::text as question_source,
    count(*)::bigint as attempts,
    count(*) filter (where sa.is_correct = true)::bigint as correct_count,
    count(*) filter (where sa.is_correct = false)::bigint as incorrect_count
  from public.student_attempts sa
  where sa.user_id = p_user_id
    and sa.submitted_at >= date_trunc('day', now()) - interval '6 day'
  group by date_trunc('day', sa.submitted_at), sa.question_source
  order by date_trunc('day', sa.submitted_at) desc, attempts desc, sa.question_source asc;
$$;


--
-- Name: admin_student_type_summary_last_7_days(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_student_type_summary_last_7_days(p_user_id uuid) RETURNS TABLE(question_source text, attempts bigint, correct_count bigint, incorrect_count bigint)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select
    sa.question_source::text as question_source,
    count(*)::bigint as attempts,
    count(*) filter (where sa.is_correct = true)::bigint as correct_count,
    count(*) filter (where sa.is_correct = false)::bigint as incorrect_count
  from public.student_attempts sa
  where sa.user_id = p_user_id
    and sa.submitted_at >= date_trunc('day', now()) - interval '6 day'
  group by sa.question_source
  order by attempts desc, sa.question_source asc;
$$;


--
-- Name: handle_new_ai_user_limit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_ai_user_limit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$begin
  insert into public.ai_user_limits (
    user_id,
    daily_limit,
    monthly_limit,
    is_unlimited
  )
  values (
    new.id,
    5,
    100,
    false
  )
  on conflict (user_id) do nothing;

  return new;
end;$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin

    new.updated_at = now();

    return new;

end;
$$;


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


--
-- Name: search_pte_questions(text, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_pte_questions(search_query text, result_limit integer DEFAULT 30, question_type_filter text DEFAULT NULL::text) RETURNS TABLE(question_type text, question_id text, title text, preview text, highlight text, url text, rank real)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'views', 'pte'
    AS $$

select

    v.question_type,

    v.question_id,

    v.title,

    v.preview,

    ts_headline(
        'english',
        v.search_text,
        websearch_to_tsquery(
            'english',
            search_query
        ),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=20, MinWords=10'
    ) as highlight,

    v.url,

    ts_rank(
        v.search_vector,
        websearch_to_tsquery(
            'english',
            search_query
        )
    ) as rank

from views.v_pte_global_search v

where

    (
        question_type_filter is null
        or
        v.question_type = question_type_filter
    )

    and

    v.search_vector @@
    websearch_to_tsquery(
        'english',
        search_query
    )

order by rank desc

limit result_limit;

$$;


--
-- Name: set_courses_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_courses_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: set_current_timestamp_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: update_search_vector(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    new.search_vector :=
        to_tsvector(
            'english',
            coalesce(new.search_text, '')
        );

    return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: asq; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.asq (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_text text NOT NULL,
    answer_text text NOT NULL,
    question_type text DEFAULT 'ASQ'::text NOT NULL,
    is_prediction boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    search_text text,
    search_vector tsvector
);


--
-- Name: di; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.di (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_type text DEFAULT 'DI'::text NOT NULL,
    source_platform text DEFAULT 'firefly'::text NOT NULL,
    title text,
    question_text text,
    image_url text,
    answer_info text,
    video_url text,
    ai_keywords text,
    difficulty_level text,
    difficulty_raw integer,
    is_prediction boolean DEFAULT false,
    is_real_exam boolean DEFAULT false,
    is_active boolean DEFAULT true,
    tag1 integer,
    tag2 integer,
    tag3 integer,
    tag4 integer,
    raw_json jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    search_text text,
    search_vector tsvector,
    CONSTRAINT di_difficulty_level_check CHECK (((difficulty_level IS NULL) OR (difficulty_level = ANY (ARRAY['简'::text, '普'::text, '难'::text])))),
    CONSTRAINT di_question_type_check CHECK ((question_type = 'DI'::text))
);


--
-- Name: essay_answer; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.essay_answer (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    we_id uuid NOT NULL,
    answer_text text NOT NULL,
    thesis text,
    score_target numeric DEFAULT 90,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: essay_sentence; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.essay_sentence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    we_id uuid,
    essay_answer_id uuid,
    sentence_text text NOT NULL,
    chinese_explanation text,
    tag1 text,
    tag2 text,
    sentence_type text DEFAULT 'argument'::text,
    source_type text DEFAULT 'essay'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    position_type text,
    argument_pattern text,
    peel_role text,
    difficulty_level integer,
    is_featured boolean DEFAULT false
);


--
-- Name: fibr; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.fibr (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_title text NOT NULL,
    question_body_text text NOT NULL,
    question_type text DEFAULT 'FIBR'::text NOT NULL,
    source_platform text DEFAULT 'firefly'::text NOT NULL,
    difficulty_level integer,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    is_prediction boolean DEFAULT false NOT NULL,
    is_real_exam boolean DEFAULT false NOT NULL,
    blanks_json jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    search_text text,
    search_vector tsvector
);


--
-- Name: TABLE fibr; Type: COMMENT; Schema: pte; Owner: -
--

COMMENT ON TABLE pte.fibr IS 'PTE Reading Fill In The Blanks Reorder / Drag dataset';


--
-- Name: COLUMN fibr.difficulty_level; Type: COMMENT; Schema: pte; Owner: -
--

COMMENT ON COLUMN pte.fibr.difficulty_level IS '1=简 2=普 3=难';


--
-- Name: COLUMN fibr.is_prediction; Type: COMMENT; Schema: pte; Owner: -
--

COMMENT ON COLUMN pte.fibr.is_prediction IS 'Prediction tag from Firefly';


--
-- Name: COLUMN fibr.blanks_json; Type: COMMENT; Schema: pte; Owner: -
--

COMMENT ON COLUMN pte.fibr.blanks_json IS 'blank_index + answer + options';


--
-- Name: fibrw; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.fibrw (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_title text NOT NULL,
    question_body_text text NOT NULL,
    question_type text DEFAULT 'FIBRW'::text NOT NULL,
    source_platform text DEFAULT 'firefly'::text NOT NULL,
    difficulty_level text,
    tags text[] DEFAULT '{}'::text[],
    is_prediction boolean DEFAULT true,
    is_real_exam boolean DEFAULT false,
    blanks_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    search_text text,
    search_vector tsvector
);


--
-- Name: TABLE fibrw; Type: COMMENT; Schema: pte; Owner: -
--

COMMENT ON TABLE pte.fibrw IS 'PTE Reading Fill In The Blanks Dropdown (FIB-RW / FIB-D) question bank scraped from Firefly';


--
-- Name: hiw; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.hiw (
    id bigint NOT NULL,
    source_question_id text,
    question_category text DEFAULT 'LISTENING'::text NOT NULL,
    question_type text DEFAULT 'HIW'::text NOT NULL,
    question_text text NOT NULL,
    display_text text,
    transcript_text text,
    incorrect_words_json jsonb,
    is_prediction boolean,
    difficulty_level text,
    is_real_exam boolean,
    has_original_audio boolean,
    has_similar_audio boolean,
    audio_url text,
    audio_duration_seconds integer,
    raw_block_text text,
    source_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    instruction_text text,
    question_body_text text,
    detail_url text,
    search_text text,
    search_vector tsvector
);


--
-- Name: hiw_id_seq; Type: SEQUENCE; Schema: pte; Owner: -
--

CREATE SEQUENCE pte.hiw_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hiw_id_seq; Type: SEQUENCE OWNED BY; Schema: pte; Owner: -
--

ALTER SEQUENCE pte.hiw_id_seq OWNED BY pte.hiw.id;


--
-- Name: sst; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.sst (
    id bigint NOT NULL,
    question_text text NOT NULL,
    source_question_id character varying(20),
    question_type character varying(10) DEFAULT 'SST'::character varying,
    is_prediction boolean DEFAULT false,
    difficulty_level character varying(10),
    is_real_exam boolean DEFAULT false,
    has_original_audio boolean DEFAULT false,
    has_similar_audio boolean DEFAULT false,
    is_practiced boolean,
    answer_text text,
    transcript_text text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    audio_url text,
    teacher_video_url text,
    source_audio_url text,
    storage_path text,
    search_text text,
    search_vector tsvector
);


--
-- Name: pte_sst_questions_id_seq; Type: SEQUENCE; Schema: pte; Owner: -
--

CREATE SEQUENCE pte.pte_sst_questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pte_sst_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: pte; Owner: -
--

ALTER SEQUENCE pte.pte_sst_questions_id_seq OWNED BY pte.sst.id;


--
-- Name: ra; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.ra (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_type text DEFAULT 'RA'::text NOT NULL,
    source_platform text DEFAULT 'firefly'::text,
    source_question_id text,
    question_number integer,
    question_title text,
    question_body_text text NOT NULL,
    instruction_text text,
    difficulty_level text,
    is_prediction boolean DEFAULT false,
    is_real_exam boolean DEFAULT false,
    tags text[] DEFAULT '{}'::text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    search_text text,
    search_vector tsvector,
    CONSTRAINT ra_difficulty_check CHECK (((difficulty_level IS NULL) OR (difficulty_level = ANY (ARRAY['简'::text, '普'::text, '难'::text])))),
    CONSTRAINT ra_question_type_check CHECK ((question_type = 'RA'::text))
);


--
-- Name: rl; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.rl (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_type text DEFAULT 'RL'::text NOT NULL,
    source_platform text DEFAULT 'firefly'::text NOT NULL,
    source_question_id text,
    question_num text,
    page_no integer,
    internal_id text,
    title text,
    question_title text,
    question_text text,
    audio_url text,
    source_audio_url text,
    storage_path text,
    question_record_url text,
    image_url text,
    source_image_url text,
    image_storage_path text,
    question_image_url text,
    original_text text,
    answer_info text,
    answer_info_2 text,
    question_info text,
    answer text,
    sub_json jsonb DEFAULT '[]'::jsonb,
    sub_count integer DEFAULT 0,
    ai_keywords text,
    keywords text,
    difficulty_level text,
    difficulty_raw integer,
    is_prediction boolean DEFAULT false,
    is_real_exam boolean DEFAULT false,
    is_available boolean DEFAULT true,
    has_similar_audio boolean DEFAULT false,
    is_active boolean DEFAULT true,
    q_type text,
    question_type_raw text,
    tag1 integer,
    tag2 integer,
    tag3 integer,
    tag4 integer,
    remark text,
    raw_json jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    search_text text,
    search_vector tsvector,
    CONSTRAINT rl_difficulty_level_check CHECK (((difficulty_level IS NULL) OR (difficulty_level = ANY (ARRAY['简'::text, '普'::text, '难'::text])))),
    CONSTRAINT rl_question_type_check CHECK ((question_type = 'RL'::text))
);


--
-- Name: ro; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.ro (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_title text NOT NULL,
    source_question_id text NOT NULL,
    difficulty_level integer,
    is_prediction boolean DEFAULT false,
    sentence_count integer DEFAULT 0 NOT NULL,
    question_body_text jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    search_text text,
    search_vector tsvector
);


--
-- Name: rs; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.rs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_type text DEFAULT 'RS'::text NOT NULL,
    source_platform text DEFAULT 'firefly'::text NOT NULL,
    source_question_id text,
    question_num text,
    page_no integer,
    internal_id text,
    question_text text NOT NULL,
    answer_info text,
    answer_info_2 text,
    audio_url text,
    question_audio_url text,
    audio_variants_json jsonb DEFAULT '[]'::jsonb,
    audio_variant_count integer DEFAULT 0,
    difficulty_level text,
    difficulty_raw integer,
    is_prediction boolean DEFAULT false,
    is_real_exam boolean DEFAULT false,
    is_active boolean DEFAULT true,
    tag_sentence text,
    tag1 integer,
    tag2 integer,
    tag3 integer,
    tag4 integer,
    remark text,
    raw_json jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    has_variant boolean DEFAULT false,
    variant_text text,
    source_audio_url text,
    storage_path text,
    search_text text,
    search_vector tsvector,
    CONSTRAINT rs_difficulty_level_check CHECK (((difficulty_level IS NULL) OR (difficulty_level = ANY (ARRAY['简'::text, '普'::text, '难'::text])))),
    CONSTRAINT rs_question_type_check CHECK ((question_type = 'RS'::text))
);


--
-- Name: rts; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.rts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_type text DEFAULT 'RTS'::text NOT NULL,
    source_platform text DEFAULT 'firefly'::text NOT NULL,
    source_question_id text,
    question_num text,
    page_no integer,
    internal_id text,
    title text,
    question_title text,
    question_text text,
    question_info text,
    question_info_2 text,
    answer_info text,
    audio_url text,
    source_audio_url text,
    storage_path text,
    audio_variants_json jsonb DEFAULT '[]'::jsonb,
    audio_variant_count integer DEFAULT 0,
    ai_keywords text,
    tag_topic text,
    difficulty_level text,
    difficulty_raw integer,
    is_prediction boolean DEFAULT false,
    is_real_exam boolean DEFAULT false,
    is_available boolean DEFAULT true,
    has_similar_audio boolean DEFAULT false,
    is_active boolean DEFAULT true,
    tag1 integer,
    tag2 integer,
    tag3 integer,
    tag4 integer,
    remark text,
    raw_json jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT rts_difficulty_level_check CHECK (((difficulty_level IS NULL) OR (difficulty_level = ANY (ARRAY['简'::text, '普'::text, '难'::text])))),
    CONSTRAINT rts_question_type_check CHECK ((question_type = 'RTS'::text))
);


--
-- Name: sgd; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.sgd (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_type text DEFAULT 'SGD'::text NOT NULL,
    source_platform text DEFAULT 'firefly'::text NOT NULL,
    source_question_id text,
    question_num text,
    page_no integer,
    internal_id text,
    title text,
    question_title text,
    question_text text,
    audio_url text,
    source_audio_url text,
    storage_path text,
    audio_variants_json jsonb DEFAULT '[]'::jsonb,
    audio_variant_count integer DEFAULT 0,
    answer_info text,
    answer_info_html text,
    original_text text,
    question_info text,
    ai_keywords text,
    keywords text,
    tag_topic text,
    difficulty_level text,
    difficulty_raw integer,
    is_prediction boolean DEFAULT false,
    is_real_exam boolean DEFAULT false,
    is_available boolean DEFAULT true,
    has_similar_audio boolean DEFAULT false,
    is_active boolean DEFAULT true,
    tag1 integer,
    tag2 integer,
    tag3 integer,
    tag4 integer,
    remark text,
    raw_json jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sgd_difficulty_level_check CHECK (((difficulty_level IS NULL) OR (difficulty_level = ANY (ARRAY['简'::text, '普'::text, '难'::text])))),
    CONSTRAINT sgd_question_type_check CHECK ((question_type = 'SGD'::text))
);


--
-- Name: speaking_attempts; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.speaking_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    question_type text NOT NULL,
    question_id uuid NOT NULL,
    audio_url text,
    transcript text,
    overall_score numeric,
    content_score numeric,
    fluency_score numeric,
    pronunciation_score numeric,
    feedback_json jsonb,
    created_at timestamp with time zone DEFAULT now(),
    accuracy_score numeric,
    completeness_score numeric,
    azure_result_json jsonb DEFAULT '{}'::jsonb
);


--
-- Name: swt; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.swt (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_title text,
    question_text text NOT NULL,
    question_type text DEFAULT 'SWT'::text NOT NULL,
    difficulty_level text,
    is_prediction boolean DEFAULT false NOT NULL,
    is_real_exam boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source_question_id text,
    answer text
);


--
-- Name: swt_answer; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.swt_answer (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    swt_id uuid NOT NULL,
    answer_text text NOT NULL,
    chinese_explanation text,
    word_count integer,
    score_target numeric DEFAULT 90,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: swt_component; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.swt_component (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    swt_id uuid,
    swt_answer_id uuid,
    component_text text NOT NULL,
    chinese_explanation text,
    component_role text,
    grammar_pattern text,
    source_idea text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: we; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.we (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_text text NOT NULL,
    question_type text DEFAULT 'WE'::text NOT NULL,
    is_prediction boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    response_type text DEFAULT 'Argumentation'::text
);


--
-- Name: wfd; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.wfd (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_text text NOT NULL,
    question_type text DEFAULT 'WFD'::text NOT NULL,
    source_platform text DEFAULT 'firefly'::text,
    source_question_id text,
    difficulty_level text,
    tags text[],
    is_prediction boolean DEFAULT false,
    audio_url text,
    audio_duration_seconds integer,
    ai_voice text,
    usage_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_real_exam boolean,
    audio_status text DEFAULT 'pending'::text,
    audio_generated_at timestamp with time zone,
    audio_error text,
    search_text text,
    search_vector tsvector
);


--
-- Name: wfd_temp; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.wfd_temp (
    id uuid,
    question_text text,
    question_type text,
    source_platform text,
    source_question_id text,
    difficulty_level text,
    tags text[],
    is_prediction boolean,
    audio_url text,
    audio_duration_seconds integer,
    ai_voice text,
    usage_count integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    is_real_exam boolean,
    audio_status text,
    audio_generated_at timestamp with time zone,
    audio_error text,
    search_text text,
    search_vector tsvector
);


--
-- Name: wfd_vocabulary; Type: TABLE; Schema: pte; Owner: -
--

CREATE TABLE pte.wfd_vocabulary (
    id bigint NOT NULL,
    word text NOT NULL,
    frequency integer DEFAULT 0 NOT NULL,
    question_ids uuid[] DEFAULT '{}'::uuid[],
    category text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_stopword boolean DEFAULT false
);


--
-- Name: wfd_vocabulary_id_seq; Type: SEQUENCE; Schema: pte; Owner: -
--

CREATE SEQUENCE pte.wfd_vocabulary_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wfd_vocabulary_id_seq; Type: SEQUENCE OWNED BY; Schema: pte; Owner: -
--

ALTER SEQUENCE pte.wfd_vocabulary_id_seq OWNED BY pte.wfd_vocabulary.id;


--
-- Name: ai_usage_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_usage_logs (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    feature text NOT NULL,
    model text NOT NULL,
    prompt_tokens integer DEFAULT 0 NOT NULL,
    completion_tokens integer DEFAULT 0 NOT NULL,
    total_tokens integer DEFAULT 0 NOT NULL,
    estimated_cost numeric(12,6) DEFAULT 0 NOT NULL,
    status text DEFAULT 'success'::text NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_usage_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.ai_usage_logs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ai_usage_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ai_user_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_user_limits (
    user_id uuid NOT NULL,
    daily_limit integer DEFAULT 10 NOT NULL,
    monthly_limit integer DEFAULT 100 NOT NULL,
    is_unlimited boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: all_question_info; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.all_question_info (
    id bigint NOT NULL,
    info text,
    questions text,
    contributing text,
    examiner text,
    suggestion text,
    hitting_rate numeric,
    stability numeric,
    importance numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    screen_instruction text,
    official_requirements text
);


--
-- Name: all_question_info_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.all_question_info ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.all_question_info_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    sender text NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_messages_sender_check CHECK ((sender = ANY (ARRAY['user'::text, 'admin'::text, 'ai'::text])))
);


--
-- Name: chat_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_sessions_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])))
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    category text DEFAULT 'ted'::text NOT NULL,
    level text,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    speaker text,
    source_name text,
    source_url text,
    license text,
    video_url text NOT NULL,
    poster_url text,
    thumbnail_url text,
    subtitle_en_url text,
    subtitle_zh_url text,
    transcript_json_url text,
    metadata_url text,
    duration_seconds integer,
    language text DEFAULT 'en'::text NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    published_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text,
    content text NOT NULL,
    cover_image text,
    status text DEFAULT 'draft'::text NOT NULL,
    author_id uuid NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    category text NOT NULL,
    pinned_order integer DEFAULT 0,
    CONSTRAINT posts_category_check CHECK ((category = ANY (ARRAY['PTE'::text, '雅思'::text, '词汇'::text, '语法'::text]))),
    CONSTRAINT posts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    full_name text,
    avatar_url text,
    role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    selective_access boolean DEFAULT false NOT NULL,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'editor'::text, 'user'::text])))
);


--
-- Name: student_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    exam_type text NOT NULL,
    module_type text NOT NULL,
    question_source text NOT NULL,
    question_id text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    submitted_at timestamp with time zone,
    duration_seconds integer,
    user_answer text,
    correct_answer text,
    is_correct boolean,
    accuracy numeric(5,2),
    score numeric(6,2),
    status text DEFAULT 'completed'::text NOT NULL,
    ai_feedback jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: student_question_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_question_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    exam_type text NOT NULL,
    module_type text NOT NULL,
    question_source text NOT NULL,
    question_id text NOT NULL,
    attempt_count integer DEFAULT 0 NOT NULL,
    completed_count integer DEFAULT 0 NOT NULL,
    correct_count integer DEFAULT 0 NOT NULL,
    wrong_count integer DEFAULT 0 NOT NULL,
    total_duration_seconds integer DEFAULT 0 NOT NULL,
    last_attempt_at timestamp with time zone,
    last_correct_at timestamp with time zone,
    last_wrong_at timestamp with time zone,
    is_practiced boolean DEFAULT false NOT NULL,
    is_in_wrong_book boolean DEFAULT false NOT NULL,
    best_score numeric(6,2),
    latest_score numeric(6,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: student_recordings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_recordings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    question_source text NOT NULL,
    question_id text NOT NULL,
    audio_url text NOT NULL,
    duration_seconds integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: student_wrong_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_wrong_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    exam_type text NOT NULL,
    module_type text NOT NULL,
    question_source text NOT NULL,
    question_id text NOT NULL,
    first_wrong_at timestamp with time zone DEFAULT now() NOT NULL,
    last_wrong_at timestamp with time zone DEFAULT now() NOT NULL,
    wrong_count integer DEFAULT 1 NOT NULL,
    is_resolved boolean DEFAULT false NOT NULL,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: study_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    exam_type text NOT NULL,
    overall_target numeric(4,1) NOT NULL,
    overall_current numeric(4,1),
    listening_target numeric(4,1) NOT NULL,
    listening_current numeric(4,1),
    reading_target numeric(4,1) NOT NULL,
    reading_current numeric(4,1),
    writing_target numeric(4,1) NOT NULL,
    writing_current numeric(4,1),
    speaking_target numeric(4,1) NOT NULL,
    speaking_current numeric(4,1),
    exam_deadline date NOT NULL,
    study_goal text NOT NULL,
    daily_study_hours text NOT NULL,
    additional_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT study_plans_daily_study_hours_check CHECK ((daily_study_hours = ANY (ARRAY['0-1 Hours'::text, '1-2 Hours'::text, '2-4 Hours'::text, '4+ Hours'::text]))),
    CONSTRAINT study_plans_exam_type_check CHECK ((exam_type = ANY (ARRAY['PTE'::text, 'IELTS'::text]))),
    CONSTRAINT study_plans_study_goal_check CHECK ((study_goal = ANY (ARRAY['485 Work Visa'::text, '190 State Nomination'::text, 'Employer Sponsorship'::text, 'Skills Assessment'::text, 'University Admission'::text, 'Other'::text])))
);


--
-- Name: v_pte_ra_with_user_status; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_pte_ra_with_user_status WITH (security_invoker='true') AS
 SELECT q.id,
    q.question_body_text AS question_text,
    q.question_type,
    q.source_platform,
    q.source_question_id,
    q.difficulty_level,
    q.tags,
    q.is_prediction,
    NULL::text AS audio_url,
    NULL::integer AS audio_duration_seconds,
    NULL::text AS ai_voice,
    q.created_at,
    q.updated_at,
    q.is_real_exam,
    COALESCE(s.is_practiced, false) AS is_practiced,
    COALESCE(s.attempt_count, 0) AS attempt_count,
    COALESCE(s.correct_count, 0) AS correct_count,
    COALESCE(s.wrong_count, 0) AS wrong_count,
    s.last_attempt_at,
    s.latest_score,
    s.best_score,
        CASE
            WHEN ((w.id IS NOT NULL) AND (w.is_resolved = false)) THEN true
            ELSE false
        END AS is_wrong_question
   FROM ((pte.ra q
     LEFT JOIN public.student_question_stats s ON (((s.question_source = 'ra'::text) AND (s.question_id = (q.id)::text) AND (s.user_id = auth.uid()))))
     LEFT JOIN public.student_wrong_questions w ON (((w.question_source = 'ra'::text) AND (w.question_id = (q.id)::text) AND (w.user_id = auth.uid()))));


--
-- Name: v_pte_sst_with_user_status; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_pte_sst_with_user_status WITH (security_invoker='true') AS
 SELECT q.id,
    q.question_text,
    q.source_question_id,
    q.question_type,
    q.is_prediction,
    q.difficulty_level,
    q.is_real_exam,
    q.has_original_audio,
    q.has_similar_audio,
    q.answer_text,
    q.transcript_text,
    q.created_at,
    q.updated_at,
    q.audio_url,
    q.teacher_video_url,
    q.source_audio_url,
    q.storage_path,
    COALESCE(s.is_practiced, false) AS is_practiced,
    COALESCE(s.attempt_count, 0) AS attempt_count,
    COALESCE(s.correct_count, 0) AS correct_count,
    COALESCE(s.wrong_count, 0) AS wrong_count,
    s.last_attempt_at,
    s.latest_score,
    s.best_score,
        CASE
            WHEN ((w.id IS NOT NULL) AND (w.is_resolved = false)) THEN true
            ELSE false
        END AS is_wrong_question
   FROM ((pte.sst q
     LEFT JOIN public.student_question_stats s ON (((s.question_source = 'sst'::text) AND (s.question_id = (q.id)::text) AND (s.user_id = auth.uid()))))
     LEFT JOIN public.student_wrong_questions w ON (((w.question_source = 'sst'::text) AND (w.question_id = (q.id)::text) AND (w.user_id = auth.uid()))));


--
-- Name: v_pte_wfd_with_user_status; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_pte_wfd_with_user_status WITH (security_invoker='true') AS
 SELECT q.id,
    q.question_text,
    q.question_type,
    q.source_platform,
    q.source_question_id,
    q.difficulty_level,
    q.tags,
    q.is_prediction,
    q.audio_url,
    q.audio_duration_seconds,
    q.ai_voice,
    q.usage_count,
    q.created_at,
    q.updated_at,
    q.is_real_exam,
    COALESCE(s.is_practiced, false) AS is_practiced,
    COALESCE(s.attempt_count, 0) AS attempt_count,
    COALESCE(s.correct_count, 0) AS correct_count,
    COALESCE(s.wrong_count, 0) AS wrong_count,
    s.last_attempt_at,
    s.latest_score,
    s.best_score,
        CASE
            WHEN ((w.id IS NOT NULL) AND (w.is_resolved = false)) THEN true
            ELSE false
        END AS is_wrong_question
   FROM ((pte.wfd q
     LEFT JOIN public.student_question_stats s ON (((s.question_source = 'wfd'::text) AND (s.question_id = (q.id)::text) AND (s.user_id = auth.uid()))))
     LEFT JOIN public.student_wrong_questions w ON (((w.question_source = 'wfd'::text) AND (w.question_id = (q.id)::text) AND (w.user_id = auth.uid()))));


--
-- Name: v_pte_asq_with_user_status; Type: VIEW; Schema: views; Owner: -
--

CREATE VIEW views.v_pte_asq_with_user_status WITH (security_invoker='true') AS
 SELECT q.id,
    q.question_text,
    q.answer_text,
    q.question_type,
    q.is_prediction,
    q.created_at,
    q.updated_at,
    q.search_text,
    q.search_vector,
    COALESCE(s.is_practiced, false) AS is_practiced,
    COALESCE(s.attempt_count, 0) AS attempt_count,
    COALESCE(s.correct_count, 0) AS correct_count,
    COALESCE(s.wrong_count, 0) AS wrong_count,
    s.last_attempt_at,
    s.latest_score,
    s.best_score,
        CASE
            WHEN ((w.id IS NOT NULL) AND (w.is_resolved = false)) THEN true
            ELSE false
        END AS is_wrong_question
   FROM ((pte.asq q
     LEFT JOIN public.student_question_stats s ON (((s.question_source = 'asq'::text) AND (s.question_id = (q.id)::text) AND (s.user_id = auth.uid()))))
     LEFT JOIN public.student_wrong_questions w ON (((w.question_source = 'asq'::text) AND (w.question_id = (q.id)::text) AND (w.user_id = auth.uid()))));


--
-- Name: v_pte_di_with_user_status; Type: VIEW; Schema: views; Owner: -
--

CREATE VIEW views.v_pte_di_with_user_status WITH (security_invoker='true') AS
 SELECT q.id,
    q.question_type,
    q.source_platform,
    q.title,
    q.question_text,
    q.image_url,
    q.answer_info,
    q.video_url,
    q.ai_keywords,
    q.difficulty_level,
    q.difficulty_raw,
    q.is_prediction,
    q.is_real_exam,
    q.is_active,
    q.tag1,
    q.tag2,
    q.tag3,
    q.tag4,
    q.raw_json,
    q.created_at,
    q.updated_at,
    q.search_text,
    COALESCE(s.is_practiced, false) AS is_practiced,
    COALESCE(s.attempt_count, 0) AS attempt_count,
    COALESCE(s.correct_count, 0) AS correct_count,
    COALESCE(s.wrong_count, 0) AS wrong_count,
    s.last_attempt_at,
    s.latest_score,
    s.best_score,
        CASE
            WHEN ((w.id IS NOT NULL) AND (w.is_resolved = false)) THEN true
            ELSE false
        END AS is_wrong_question
   FROM ((pte.di q
     LEFT JOIN public.student_question_stats s ON (((s.question_source = 'di'::text) AND (s.question_id = (q.id)::text) AND (s.user_id = auth.uid()))))
     LEFT JOIN public.student_wrong_questions w ON (((w.question_source = 'di'::text) AND (w.question_id = (q.id)::text) AND (w.user_id = auth.uid()))));


--
-- Name: v_pte_fibr_with_user_status; Type: VIEW; Schema: views; Owner: -
--

CREATE VIEW views.v_pte_fibr_with_user_status WITH (security_invoker='true') AS
 SELECT q.id,
    q.question_title,
    q.question_body_text,
    q.question_type,
    q.source_platform,
    q.difficulty_level,
    q.tags,
    q.is_prediction,
    q.is_real_exam,
    q.blanks_json,
    q.created_at,
    q.updated_at,
    COALESCE(s.is_practiced, false) AS is_practiced,
    COALESCE(s.attempt_count, 0) AS attempt_count,
    COALESCE(s.correct_count, 0) AS correct_count,
    COALESCE(s.wrong_count, 0) AS wrong_count,
    COALESCE(s.completed_count, 0) AS completed_count,
    s.last_attempt_at,
    s.latest_score,
    s.best_score,
        CASE
            WHEN ((w.id IS NOT NULL) AND (w.is_resolved = false)) THEN true
            ELSE false
        END AS is_wrong_question
   FROM ((pte.fibr q
     LEFT JOIN public.student_question_stats s ON (((s.question_source = 'fibr'::text) AND (s.question_id = (q.id)::text) AND (s.user_id = auth.uid()))))
     LEFT JOIN public.student_wrong_questions w ON (((w.question_source = 'fibr'::text) AND (w.question_id = (q.id)::text) AND (w.user_id = auth.uid()))));


--
-- Name: v_pte_fibrw_with_user_status; Type: VIEW; Schema: views; Owner: -
--

CREATE VIEW views.v_pte_fibrw_with_user_status WITH (security_invoker='true') AS
 SELECT q.id,
    q.question_title,
    q.question_body_text,
    q.question_type,
    q.source_platform,
    q.difficulty_level,
    q.tags,
    q.is_prediction,
    q.is_real_exam,
    q.blanks_json,
    q.created_at,
    q.updated_at,
    q.search_text,
    q.search_vector,
    COALESCE(s.attempt_count, 0) AS attempt_count,
    COALESCE(s.completed_count, 0) AS completed_count,
    COALESCE(s.correct_count, 0) AS correct_count,
    COALESCE(s.wrong_count, 0) AS wrong_count,
    COALESCE(s.total_duration_seconds, 0) AS total_duration_seconds,
    s.last_attempt_at,
    s.last_correct_at,
    s.last_wrong_at,
        CASE
            WHEN (COALESCE(s.completed_count, 0) > 0) THEN true
            ELSE false
        END AS is_practiced,
        CASE
            WHEN ((w.id IS NOT NULL) AND (w.is_resolved = false)) THEN true
            ELSE false
        END AS is_wrong_question,
        CASE
            WHEN (COALESCE(s.attempt_count, 0) = 0) THEN (0)::numeric
            ELSE round((((COALESCE(s.correct_count, 0))::numeric / (NULLIF(s.attempt_count, 0))::numeric) * (100)::numeric), 1)
        END AS accuracy_percentage
   FROM ((pte.fibrw q
     LEFT JOIN public.student_question_stats s ON (((s.question_source = 'fibrw'::text) AND (s.question_id = (q.id)::text) AND (s.user_id = auth.uid()))))
     LEFT JOIN public.student_wrong_questions w ON (((w.question_source = 'fibrw'::text) AND (w.question_id = (q.id)::text) AND (w.user_id = auth.uid()) AND (w.is_resolved = false))));


--
-- Name: VIEW v_pte_fibrw_with_user_status; Type: COMMENT; Schema: views; Owner: -
--

COMMENT ON VIEW views.v_pte_fibrw_with_user_status IS 'FIBRW questions with per-user practice statistics and wrong-question status';


--
-- Name: v_pte_global_search; Type: VIEW; Schema: views; Owner: -
--

CREATE VIEW views.v_pte_global_search WITH (security_invoker='on') AS
 SELECT 'RA'::text AS question_type,
    (ra.id)::text AS question_id,
    ra.question_title AS title,
    "left"(ra.question_body_text, 200) AS preview,
    ('/pte/speaking/ra/'::text || (ra.id)::text) AS url,
    ra.search_text,
    ra.search_vector
   FROM pte.ra
UNION ALL
 SELECT 'RS'::text AS question_type,
    (rs.id)::text AS question_id,
    "left"(rs.question_text, 80) AS title,
    "left"(rs.question_text, 200) AS preview,
    ('/pte/speaking/rs/'::text || (rs.id)::text) AS url,
    rs.search_text,
    rs.search_vector
   FROM pte.rs
UNION ALL
 SELECT 'RL'::text AS question_type,
    (rl.id)::text AS question_id,
    COALESCE(rl.title, rl.question_title) AS title,
    "left"(rl.question_text, 200) AS preview,
    ('/pte/speaking/rl/'::text || (rl.id)::text) AS url,
    rl.search_text,
    rl.search_vector
   FROM pte.rl
UNION ALL
 SELECT 'DI'::text AS question_type,
    (di.id)::text AS question_id,
    di.title,
    "left"(di.answer_info, 200) AS preview,
    ('/pte/speaking/di/'::text || (di.id)::text) AS url,
    di.search_text,
    di.search_vector
   FROM pte.di
UNION ALL
 SELECT 'HIW'::text AS question_type,
    (hiw.id)::text AS question_id,
    "left"(hiw.question_text, 80) AS title,
    "left"(hiw.transcript_text, 200) AS preview,
    ('/pte/listening/hiw/'::text || (hiw.id)::text) AS url,
    hiw.search_text,
    hiw.search_vector
   FROM pte.hiw
UNION ALL
 SELECT 'WFD'::text AS question_type,
    (wfd.id)::text AS question_id,
    "left"(wfd.question_text, 80) AS title,
    "left"(wfd.question_text, 200) AS preview,
    ('/pte/listening/wfd/'::text || (wfd.id)::text) AS url,
    wfd.search_text,
    wfd.search_vector
   FROM pte.wfd
UNION ALL
 SELECT 'SST'::text AS question_type,
    (sst.id)::text AS question_id,
    "left"(sst.question_text, 80) AS title,
    "left"(sst.transcript_text, 200) AS preview,
    ('/pte/listening/sst/'::text || (sst.id)::text) AS url,
    sst.search_text,
    sst.search_vector
   FROM pte.sst
UNION ALL
 SELECT 'ASQ'::text AS question_type,
    (asq.id)::text AS question_id,
    "left"(asq.question_text, 80) AS title,
    "left"(asq.answer_text, 200) AS preview,
    ('/pte/speaking/asq/'::text || (asq.id)::text) AS url,
    asq.search_text,
    asq.search_vector
   FROM pte.asq
UNION ALL
 SELECT 'FIB-R'::text AS question_type,
    (fibr.id)::text AS question_id,
    fibr.question_title AS title,
    "left"(fibr.question_body_text, 200) AS preview,
    ('/pte/reading/fibr/'::text || (fibr.id)::text) AS url,
    fibr.search_text,
    fibr.search_vector
   FROM pte.fibr
UNION ALL
 SELECT 'FIB-RW'::text AS question_type,
    (fibrw.id)::text AS question_id,
    fibrw.question_title AS title,
    "left"(fibrw.question_body_text, 200) AS preview,
    ('/pte/reading/fibrw/'::text || (fibrw.id)::text) AS url,
    fibrw.search_text,
    fibrw.search_vector
   FROM pte.fibrw
UNION ALL
 SELECT 'RO'::text AS question_type,
    (ro.id)::text AS question_id,
    ro.question_title AS title,
    "left"((ro.question_body_text)::text, 200) AS preview,
    ('/pte/reading/ro/'::text || (ro.id)::text) AS url,
    ro.search_text,
    ro.search_vector
   FROM pte.ro;


--
-- Name: v_pte_ra_with_user_status; Type: VIEW; Schema: views; Owner: -
--

CREATE VIEW views.v_pte_ra_with_user_status WITH (security_invoker='true') AS
 SELECT q.id,
    q.question_body_text AS question_text,
    q.question_type,
    q.source_platform,
    q.source_question_id,
    q.difficulty_level,
    q.tags,
    q.is_prediction,
    NULL::text AS audio_url,
    NULL::integer AS audio_duration_seconds,
    NULL::text AS ai_voice,
    q.created_at,
    q.updated_at,
    q.is_real_exam,
    COALESCE(s.is_practiced, false) AS is_practiced,
    COALESCE(s.attempt_count, 0) AS attempt_count,
    COALESCE(s.correct_count, 0) AS correct_count,
    COALESCE(s.wrong_count, 0) AS wrong_count,
    s.last_attempt_at,
    s.latest_score,
    s.best_score,
        CASE
            WHEN ((w.id IS NOT NULL) AND (w.is_resolved = false)) THEN true
            ELSE false
        END AS is_wrong_question
   FROM ((pte.ra q
     LEFT JOIN public.student_question_stats s ON (((s.question_source = 'ra'::text) AND (s.question_id = (q.id)::text) AND (s.user_id = auth.uid()))))
     LEFT JOIN public.student_wrong_questions w ON (((w.question_source = 'ra'::text) AND (w.question_id = (q.id)::text) AND (w.user_id = auth.uid()))));


--
-- Name: v_pte_rl_with_user_status; Type: VIEW; Schema: views; Owner: -
--

CREATE VIEW views.v_pte_rl_with_user_status WITH (security_invoker='true') AS
 SELECT q.id,
    q.question_type,
    q.source_platform,
    q.source_question_id,
    q.question_num,
    q.page_no,
    q.internal_id,
    q.title,
    q.question_title,
    q.question_text,
    q.audio_url,
    q.source_audio_url,
    q.storage_path,
    q.question_record_url,
    q.image_url,
    q.source_image_url,
    q.image_storage_path,
    q.question_image_url,
    q.original_text,
    q.answer_info,
    q.answer_info_2,
    q.question_info,
    q.answer,
    q.sub_json,
    q.sub_count,
    q.ai_keywords,
    q.keywords,
    q.difficulty_level,
    q.difficulty_raw,
    q.is_prediction,
    q.is_real_exam,
    q.is_available,
    q.has_similar_audio,
    q.is_active,
    q.q_type,
    q.question_type_raw,
    q.tag1,
    q.tag2,
    q.tag3,
    q.tag4,
    q.remark,
    q.raw_json,
    q.created_at,
    q.updated_at,
    q.search_text,
    q.search_vector,
    COALESCE(s.is_practiced, false) AS is_practiced,
    COALESCE(s.attempt_count, 0) AS attempt_count,
    COALESCE(s.correct_count, 0) AS correct_count,
    COALESCE(s.wrong_count, 0) AS wrong_count,
    s.last_attempt_at,
    s.latest_score,
    s.best_score,
        CASE
            WHEN ((w.id IS NOT NULL) AND (w.is_resolved = false)) THEN true
            ELSE false
        END AS is_wrong_question
   FROM ((pte.rl q
     LEFT JOIN public.student_question_stats s ON (((s.question_source = 'rl'::text) AND (s.question_id = (q.id)::text) AND (s.user_id = auth.uid()))))
     LEFT JOIN public.student_wrong_questions w ON (((w.question_source = 'rl'::text) AND (w.question_id = (q.id)::text) AND (w.user_id = auth.uid()))));


--
-- Name: v_pte_ro_with_user_status; Type: VIEW; Schema: views; Owner: -
--

CREATE VIEW views.v_pte_ro_with_user_status WITH (security_invoker='true') AS
 SELECT q.id,
    q.question_title,
    q.source_question_id,
    q.difficulty_level,
    q.is_prediction,
    q.sentence_count,
    q.question_body_text,
    q.created_at,
    q.updated_at,
    COALESCE(s.is_practiced, false) AS is_practiced,
    COALESCE(s.attempt_count, 0) AS attempt_count,
    COALESCE(s.correct_count, 0) AS correct_count,
    COALESCE(s.wrong_count, 0) AS wrong_count,
    COALESCE(s.completed_count, 0) AS completed_count,
    s.last_attempt_at,
    s.latest_score,
    s.best_score,
        CASE
            WHEN ((w.id IS NOT NULL) AND (w.is_resolved = false)) THEN true
            ELSE false
        END AS is_wrong_question
   FROM ((pte.ro q
     LEFT JOIN public.student_question_stats s ON (((s.question_source = 'ro'::text) AND (s.question_id = (q.id)::text) AND (s.user_id = auth.uid()))))
     LEFT JOIN public.student_wrong_questions w ON (((w.question_source = 'ro'::text) AND (w.question_id = (q.id)::text) AND (w.user_id = auth.uid()))));


--
-- Name: v_pte_rs_with_user_status; Type: VIEW; Schema: views; Owner: -
--

CREATE VIEW views.v_pte_rs_with_user_status WITH (security_invoker='true') AS
 SELECT q.id,
    q.question_text,
    q.question_type,
    q.source_question_id,
    q.difficulty_level,
    q.is_prediction,
    q.audio_url,
    NULL::integer AS audio_duration_seconds,
    q.created_at,
    q.updated_at,
    q.is_real_exam,
    COALESCE(s.is_practiced, false) AS is_practiced,
    COALESCE(s.attempt_count, 0) AS attempt_count,
    COALESCE(s.correct_count, 0) AS correct_count,
    COALESCE(s.wrong_count, 0) AS wrong_count,
    s.last_attempt_at,
    s.latest_score,
    s.best_score,
        CASE
            WHEN ((w.id IS NOT NULL) AND (w.is_resolved = false)) THEN true
            ELSE false
        END AS is_wrong_question
   FROM ((pte.rs q
     LEFT JOIN public.student_question_stats s ON (((s.question_source = 'rs'::text) AND (s.question_id = (q.id)::text) AND (s.user_id = auth.uid()))))
     LEFT JOIN public.student_wrong_questions w ON (((w.question_source = 'rs'::text) AND (w.question_id = (q.id)::text) AND (w.user_id = auth.uid()))));


--
-- Name: v_pte_rts_with_user_status; Type: VIEW; Schema: views; Owner: -
--

CREATE VIEW views.v_pte_rts_with_user_status WITH (security_invoker='true') AS
 SELECT q.id,
    q.question_type,
    q.source_platform,
    q.source_question_id,
    q.question_num,
    q.page_no,
    q.internal_id,
    q.title,
    q.question_title,
    q.question_text,
    q.question_info,
    q.question_info_2,
    q.answer_info,
    q.audio_url,
    q.source_audio_url,
    q.storage_path,
    q.audio_variants_json,
    q.audio_variant_count,
    q.ai_keywords,
    q.tag_topic,
    q.difficulty_level,
    q.difficulty_raw,
    q.is_prediction,
    q.is_real_exam,
    q.is_available,
    q.has_similar_audio,
    q.is_active,
    q.tag1,
    q.tag2,
    q.tag3,
    q.tag4,
    q.remark,
    q.raw_json,
    q.created_at,
    q.updated_at,
    COALESCE(s.is_practiced, false) AS is_practiced,
    COALESCE(s.attempt_count, 0) AS attempt_count,
    COALESCE(s.correct_count, 0) AS correct_count,
    COALESCE(s.wrong_count, 0) AS wrong_count,
    s.last_attempt_at,
    s.latest_score,
    s.best_score,
        CASE
            WHEN ((w.id IS NOT NULL) AND (w.is_resolved = false)) THEN true
            ELSE false
        END AS is_wrong_question
   FROM ((pte.rts q
     LEFT JOIN public.student_question_stats s ON (((s.question_source = 'rts'::text) AND (s.question_id = (q.id)::text) AND (s.user_id = auth.uid()))))
     LEFT JOIN public.student_wrong_questions w ON (((w.question_source = 'rts'::text) AND (w.question_id = (q.id)::text) AND (w.user_id = auth.uid()))));


--
-- Name: v_pte_sgd_with_user_status; Type: VIEW; Schema: views; Owner: -
--

CREATE VIEW views.v_pte_sgd_with_user_status WITH (security_invoker='true') AS
 SELECT q.id,
    q.question_type,
    q.source_platform,
    q.source_question_id,
    q.question_num,
    q.page_no,
    q.internal_id,
    q.title,
    q.question_title,
    q.question_text,
    q.audio_url,
    q.source_audio_url,
    q.storage_path,
    q.audio_variants_json,
    q.audio_variant_count,
    q.answer_info,
    q.answer_info_html,
    q.original_text,
    q.question_info,
    q.ai_keywords,
    q.keywords,
    q.tag_topic,
    q.difficulty_level,
    q.difficulty_raw,
    q.is_prediction,
    q.is_real_exam,
    q.is_available,
    q.has_similar_audio,
    q.is_active,
    q.tag1,
    q.tag2,
    q.tag3,
    q.tag4,
    q.remark,
    q.raw_json,
    q.created_at,
    q.updated_at,
    COALESCE(s.is_practiced, false) AS is_practiced,
    COALESCE(s.attempt_count, 0) AS attempt_count,
    COALESCE(s.correct_count, 0) AS correct_count,
    COALESCE(s.wrong_count, 0) AS wrong_count,
    s.last_attempt_at,
    s.latest_score,
    s.best_score,
        CASE
            WHEN ((w.id IS NOT NULL) AND (w.is_resolved = false)) THEN true
            ELSE false
        END AS is_wrong_question
   FROM ((pte.sgd q
     LEFT JOIN public.student_question_stats s ON (((s.question_source = 'sgd'::text) AND (s.question_id = (q.id)::text) AND (s.user_id = auth.uid()))))
     LEFT JOIN public.student_wrong_questions w ON (((w.question_source = 'sgd'::text) AND (w.question_id = (q.id)::text) AND (w.user_id = auth.uid()))));


--
-- Name: v_pte_sst_with_user_status; Type: VIEW; Schema: views; Owner: -
--

CREATE VIEW views.v_pte_sst_with_user_status WITH (security_invoker='true') AS
 SELECT q.id,
    q.question_text,
    q.source_question_id,
    q.question_type,
    q.is_prediction,
    q.difficulty_level,
    q.is_real_exam,
    q.has_original_audio,
    q.has_similar_audio,
    q.answer_text,
    q.transcript_text,
    q.created_at,
    q.updated_at,
    q.audio_url,
    q.teacher_video_url,
    q.source_audio_url,
    q.storage_path,
    COALESCE(s.is_practiced, false) AS is_practiced,
    COALESCE(s.attempt_count, 0) AS attempt_count,
    COALESCE(s.correct_count, 0) AS correct_count,
    COALESCE(s.wrong_count, 0) AS wrong_count,
    s.last_attempt_at,
    s.latest_score,
    s.best_score,
        CASE
            WHEN ((w.id IS NOT NULL) AND (w.is_resolved = false)) THEN true
            ELSE false
        END AS is_wrong_question
   FROM ((pte.sst q
     LEFT JOIN public.student_question_stats s ON (((s.question_source = 'sst'::text) AND (s.question_id = (q.id)::text) AND (s.user_id = auth.uid()))))
     LEFT JOIN public.student_wrong_questions w ON (((w.question_source = 'sst'::text) AND (w.question_id = (q.id)::text) AND (w.user_id = auth.uid()))));


--
-- Name: v_pte_swt_with_user_status; Type: VIEW; Schema: views; Owner: -
--

CREATE VIEW views.v_pte_swt_with_user_status WITH (security_invoker='true') AS
 SELECT q.id,
    q.source_question_id,
    q.question_title,
    q.question_text,
    q.answer,
    q.question_type,
    q.difficulty_level,
    q.is_prediction,
    q.is_real_exam,
    q.created_at,
    q.updated_at,
    COALESCE(s.is_practiced, false) AS is_practiced,
    COALESCE(s.attempt_count, 0) AS attempt_count,
    COALESCE(s.correct_count, 0) AS correct_count,
    COALESCE(s.wrong_count, 0) AS wrong_count,
    s.last_attempt_at,
    s.latest_score,
    s.best_score,
        CASE
            WHEN ((w.id IS NOT NULL) AND (w.is_resolved = false)) THEN true
            ELSE false
        END AS is_wrong_question
   FROM ((pte.swt q
     LEFT JOIN public.student_question_stats s ON (((s.question_source = 'swt'::text) AND (s.question_id = (q.id)::text) AND (s.user_id = auth.uid()))))
     LEFT JOIN public.student_wrong_questions w ON (((w.question_source = 'swt'::text) AND (w.question_id = (q.id)::text) AND (w.user_id = auth.uid()))));


--
-- Name: v_pte_we_with_user_status; Type: VIEW; Schema: views; Owner: -
--

CREATE VIEW views.v_pte_we_with_user_status WITH (security_invoker='true') AS
 SELECT q.id,
    q.question_text,
    q.question_type,
    q.is_prediction,
    q.created_at,
    q.updated_at,
    q.response_type,
    COALESCE(s.is_practiced, false) AS is_practiced,
    COALESCE(s.attempt_count, 0) AS attempt_count,
    COALESCE(s.correct_count, 0) AS correct_count,
    COALESCE(s.wrong_count, 0) AS wrong_count,
    s.last_attempt_at,
    s.latest_score,
    s.best_score,
        CASE
            WHEN ((w.id IS NOT NULL) AND (w.is_resolved = false)) THEN true
            ELSE false
        END AS is_wrong_question
   FROM ((pte.we q
     LEFT JOIN public.student_question_stats s ON (((s.question_source = 'we'::text) AND (s.question_id = (q.id)::text) AND (s.user_id = auth.uid()))))
     LEFT JOIN public.student_wrong_questions w ON (((w.question_source = 'we'::text) AND (w.question_id = (q.id)::text) AND (w.user_id = auth.uid()))));


--
-- Name: v_pte_wfd_with_user_status; Type: VIEW; Schema: views; Owner: -
--

CREATE VIEW views.v_pte_wfd_with_user_status WITH (security_invoker='true') AS
 SELECT q.id,
    q.question_text,
    q.question_type,
    q.source_platform,
    q.source_question_id,
    q.difficulty_level,
    q.tags,
    q.is_prediction,
    q.audio_url,
    q.audio_duration_seconds,
    q.ai_voice,
    q.usage_count,
    q.created_at,
    q.updated_at,
    q.is_real_exam,
    COALESCE(s.is_practiced, false) AS is_practiced,
    COALESCE(s.attempt_count, 0) AS attempt_count,
    COALESCE(s.correct_count, 0) AS correct_count,
    COALESCE(s.wrong_count, 0) AS wrong_count,
    s.last_attempt_at,
    s.latest_score,
    s.best_score,
        CASE
            WHEN ((w.id IS NOT NULL) AND (w.is_resolved = false)) THEN true
            ELSE false
        END AS is_wrong_question
   FROM ((pte.wfd q
     LEFT JOIN public.student_question_stats s ON (((s.question_source = 'wfd'::text) AND (s.question_id = (q.id)::text) AND (s.user_id = auth.uid()))))
     LEFT JOIN public.student_wrong_questions w ON (((w.question_source = 'wfd'::text) AND (w.question_id = (q.id)::text) AND (w.user_id = auth.uid()))));


--
-- Name: hiw id; Type: DEFAULT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.hiw ALTER COLUMN id SET DEFAULT nextval('pte.hiw_id_seq'::regclass);


--
-- Name: sst id; Type: DEFAULT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.sst ALTER COLUMN id SET DEFAULT nextval('pte.pte_sst_questions_id_seq'::regclass);


--
-- Name: wfd_vocabulary id; Type: DEFAULT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.wfd_vocabulary ALTER COLUMN id SET DEFAULT nextval('pte.wfd_vocabulary_id_seq'::regclass);


--
-- Name: asq asq_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.asq
    ADD CONSTRAINT asq_pkey PRIMARY KEY (id);


--
-- Name: di di_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.di
    ADD CONSTRAINT di_pkey PRIMARY KEY (id);


--
-- Name: essay_answer essay_answer_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.essay_answer
    ADD CONSTRAINT essay_answer_pkey PRIMARY KEY (id);


--
-- Name: essay_sentence essay_sentence_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.essay_sentence
    ADD CONSTRAINT essay_sentence_pkey PRIMARY KEY (id);


--
-- Name: fibr fibr_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.fibr
    ADD CONSTRAINT fibr_pkey PRIMARY KEY (id);


--
-- Name: fibrw fibrw_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.fibrw
    ADD CONSTRAINT fibrw_pkey PRIMARY KEY (id);


--
-- Name: hiw hiw_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.hiw
    ADD CONSTRAINT hiw_pkey PRIMARY KEY (id);


--
-- Name: hiw hiw_source_question_id_key; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.hiw
    ADD CONSTRAINT hiw_source_question_id_key UNIQUE (source_question_id);


--
-- Name: sst pte_sst_questions_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.sst
    ADD CONSTRAINT pte_sst_questions_pkey PRIMARY KEY (id);


--
-- Name: sst pte_sst_questions_source_question_id_key; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.sst
    ADD CONSTRAINT pte_sst_questions_source_question_id_key UNIQUE (source_question_id);


--
-- Name: wfd pte_wfd_questions_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.wfd
    ADD CONSTRAINT pte_wfd_questions_pkey PRIMARY KEY (id);


--
-- Name: wfd pte_wfd_questions_question_text_key; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.wfd
    ADD CONSTRAINT pte_wfd_questions_question_text_key UNIQUE (question_text);


--
-- Name: ra ra_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.ra
    ADD CONSTRAINT ra_pkey PRIMARY KEY (id);


--
-- Name: rl rl_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.rl
    ADD CONSTRAINT rl_pkey PRIMARY KEY (id);


--
-- Name: ro ro_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.ro
    ADD CONSTRAINT ro_pkey PRIMARY KEY (id);


--
-- Name: ro ro_source_question_id_key; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.ro
    ADD CONSTRAINT ro_source_question_id_key UNIQUE (source_question_id);


--
-- Name: rs rs_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.rs
    ADD CONSTRAINT rs_pkey PRIMARY KEY (id);


--
-- Name: rts rts_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.rts
    ADD CONSTRAINT rts_pkey PRIMARY KEY (id);


--
-- Name: sgd sgd_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.sgd
    ADD CONSTRAINT sgd_pkey PRIMARY KEY (id);


--
-- Name: speaking_attempts speaking_attempts_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.speaking_attempts
    ADD CONSTRAINT speaking_attempts_pkey PRIMARY KEY (id);


--
-- Name: swt_answer swt_answer_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.swt_answer
    ADD CONSTRAINT swt_answer_pkey PRIMARY KEY (id);


--
-- Name: swt_component swt_component_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.swt_component
    ADD CONSTRAINT swt_component_pkey PRIMARY KEY (id);


--
-- Name: swt swt_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.swt
    ADD CONSTRAINT swt_pkey PRIMARY KEY (id);


--
-- Name: we we_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.we
    ADD CONSTRAINT we_pkey PRIMARY KEY (id);


--
-- Name: wfd_vocabulary wfd_vocabulary_pkey; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.wfd_vocabulary
    ADD CONSTRAINT wfd_vocabulary_pkey PRIMARY KEY (id);


--
-- Name: wfd_vocabulary wfd_vocabulary_word_key; Type: CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.wfd_vocabulary
    ADD CONSTRAINT wfd_vocabulary_word_key UNIQUE (word);


--
-- Name: ai_usage_logs ai_usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_pkey PRIMARY KEY (id);


--
-- Name: ai_user_limits ai_user_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_user_limits
    ADD CONSTRAINT ai_user_limits_pkey PRIMARY KEY (user_id);


--
-- Name: all_question_info all_question_info_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.all_question_info
    ADD CONSTRAINT all_question_info_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_sessions chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: courses courses_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_slug_key UNIQUE (slug);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: posts posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_key UNIQUE (slug);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: student_attempts student_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_attempts
    ADD CONSTRAINT student_attempts_pkey PRIMARY KEY (id);


--
-- Name: student_question_stats student_question_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_question_stats
    ADD CONSTRAINT student_question_stats_pkey PRIMARY KEY (id);


--
-- Name: student_question_stats student_question_stats_user_id_question_source_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_question_stats
    ADD CONSTRAINT student_question_stats_user_id_question_source_question_id_key UNIQUE (user_id, question_source, question_id);


--
-- Name: student_recordings student_recordings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_recordings
    ADD CONSTRAINT student_recordings_pkey PRIMARY KEY (id);


--
-- Name: student_wrong_questions student_wrong_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_wrong_questions
    ADD CONSTRAINT student_wrong_questions_pkey PRIMARY KEY (id);


--
-- Name: student_wrong_questions student_wrong_questions_user_id_question_source_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_wrong_questions
    ADD CONSTRAINT student_wrong_questions_user_id_question_source_question_id_key UNIQUE (user_id, question_source, question_id);


--
-- Name: study_plans study_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_plans
    ADD CONSTRAINT study_plans_pkey PRIMARY KEY (id);


--
-- Name: study_plans study_plans_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_plans
    ADD CONSTRAINT study_plans_user_id_key UNIQUE (user_id);


--
-- Name: di_created_at_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX di_created_at_idx ON pte.di USING btree (created_at DESC);


--
-- Name: di_difficulty_level_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX di_difficulty_level_idx ON pte.di USING btree (difficulty_level);


--
-- Name: di_is_prediction_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX di_is_prediction_idx ON pte.di USING btree (is_prediction);


--
-- Name: di_is_real_exam_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX di_is_real_exam_idx ON pte.di USING btree (is_real_exam);


--
-- Name: idx_asq_created_at; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_asq_created_at ON pte.asq USING btree (created_at DESC);


--
-- Name: idx_asq_is_prediction; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_asq_is_prediction ON pte.asq USING btree (is_prediction);


--
-- Name: idx_asq_question_type; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_asq_question_type ON pte.asq USING btree (question_type);


--
-- Name: idx_asq_search_vector; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_asq_search_vector ON pte.asq USING gin (search_vector);


--
-- Name: idx_di_search_vector; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_di_search_vector ON pte.di USING gin (search_vector);


--
-- Name: idx_essay_answer_we_id; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_essay_answer_we_id ON pte.essay_answer USING btree (we_id);


--
-- Name: idx_essay_sentence_answer_id; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_essay_sentence_answer_id ON pte.essay_sentence USING btree (essay_answer_id);


--
-- Name: idx_essay_sentence_tag1; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_essay_sentence_tag1 ON pte.essay_sentence USING btree (tag1);


--
-- Name: idx_essay_sentence_tag2; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_essay_sentence_tag2 ON pte.essay_sentence USING btree (tag2);


--
-- Name: idx_essay_sentence_we_id; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_essay_sentence_we_id ON pte.essay_sentence USING btree (we_id);


--
-- Name: idx_fibr_blanks_json; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibr_blanks_json ON pte.fibr USING gin (blanks_json);


--
-- Name: idx_fibr_created_at; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibr_created_at ON pte.fibr USING btree (created_at DESC);


--
-- Name: idx_fibr_difficulty; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibr_difficulty ON pte.fibr USING btree (difficulty_level);


--
-- Name: idx_fibr_prediction; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibr_prediction ON pte.fibr USING btree (is_prediction);


--
-- Name: idx_fibr_question_type; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibr_question_type ON pte.fibr USING btree (question_type);


--
-- Name: idx_fibr_search_vector; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibr_search_vector ON pte.fibr USING gin (search_vector);


--
-- Name: idx_fibr_tags; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibr_tags ON pte.fibr USING gin (tags);


--
-- Name: idx_fibr_title; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibr_title ON pte.fibr USING btree (question_title);


--
-- Name: idx_fibrw_blanks_json; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibrw_blanks_json ON pte.fibrw USING gin (blanks_json);


--
-- Name: idx_fibrw_created_at; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibrw_created_at ON pte.fibrw USING btree (created_at DESC);


--
-- Name: idx_fibrw_fts; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibrw_fts ON pte.fibrw USING gin (to_tsvector('english'::regconfig, ((COALESCE(question_title, ''::text) || ' '::text) || COALESCE(question_body_text, ''::text))));


--
-- Name: idx_fibrw_is_prediction; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibrw_is_prediction ON pte.fibrw USING btree (is_prediction);


--
-- Name: idx_fibrw_is_real_exam; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibrw_is_real_exam ON pte.fibrw USING btree (is_real_exam);


--
-- Name: idx_fibrw_question_title; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibrw_question_title ON pte.fibrw USING btree (question_title);


--
-- Name: idx_fibrw_question_type; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibrw_question_type ON pte.fibrw USING btree (question_type);


--
-- Name: idx_fibrw_search_vector; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibrw_search_vector ON pte.fibrw USING gin (search_vector);


--
-- Name: idx_fibrw_source_platform; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibrw_source_platform ON pte.fibrw USING btree (source_platform);


--
-- Name: idx_fibrw_tags; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_fibrw_tags ON pte.fibrw USING gin (tags);


--
-- Name: idx_hiw_search_vector; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_hiw_search_vector ON pte.hiw USING gin (search_vector);


--
-- Name: idx_ra_search_vector; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_ra_search_vector ON pte.ra USING gin (search_vector);


--
-- Name: idx_rl_search_vector; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_rl_search_vector ON pte.rl USING gin (search_vector);


--
-- Name: idx_ro_created_at; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_ro_created_at ON pte.ro USING btree (created_at DESC);


--
-- Name: idx_ro_difficulty_level; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_ro_difficulty_level ON pte.ro USING btree (difficulty_level);


--
-- Name: idx_ro_is_prediction; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_ro_is_prediction ON pte.ro USING btree (is_prediction);


--
-- Name: idx_ro_question_body_text; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_ro_question_body_text ON pte.ro USING gin (question_body_text);


--
-- Name: idx_ro_search_vector; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_ro_search_vector ON pte.ro USING gin (search_vector);


--
-- Name: idx_ro_source_question_id; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_ro_source_question_id ON pte.ro USING btree (source_question_id);


--
-- Name: idx_rs_search_vector; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_rs_search_vector ON pte.rs USING gin (search_vector);


--
-- Name: idx_speaking_attempts_created_at; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_speaking_attempts_created_at ON pte.speaking_attempts USING btree (created_at DESC);


--
-- Name: idx_speaking_attempts_question; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_speaking_attempts_question ON pte.speaking_attempts USING btree (question_type, question_id);


--
-- Name: idx_speaking_attempts_user_id; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_speaking_attempts_user_id ON pte.speaking_attempts USING btree (user_id);


--
-- Name: idx_sst_search_vector; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_sst_search_vector ON pte.sst USING gin (search_vector);


--
-- Name: idx_swt_answer_swt_id; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_swt_answer_swt_id ON pte.swt_answer USING btree (swt_id);


--
-- Name: idx_swt_component_answer_id; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_swt_component_answer_id ON pte.swt_component USING btree (swt_answer_id);


--
-- Name: idx_swt_component_grammar_pattern; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_swt_component_grammar_pattern ON pte.swt_component USING btree (grammar_pattern);


--
-- Name: idx_swt_component_role; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_swt_component_role ON pte.swt_component USING btree (component_role);


--
-- Name: idx_swt_component_swt_id; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_swt_component_swt_id ON pte.swt_component USING btree (swt_id);


--
-- Name: idx_swt_created_at; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_swt_created_at ON pte.swt USING btree (created_at DESC);


--
-- Name: idx_swt_is_prediction; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_swt_is_prediction ON pte.swt USING btree (is_prediction);


--
-- Name: idx_swt_is_real_exam; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_swt_is_real_exam ON pte.swt USING btree (is_real_exam);


--
-- Name: idx_swt_question_type; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_swt_question_type ON pte.swt USING btree (question_type);


--
-- Name: idx_we_created_at; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_we_created_at ON pte.we USING btree (created_at DESC);


--
-- Name: idx_we_is_prediction; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_we_is_prediction ON pte.we USING btree (is_prediction);


--
-- Name: idx_we_question_type; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_we_question_type ON pte.we USING btree (question_type);


--
-- Name: idx_wfd_search_vector; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX idx_wfd_search_vector ON pte.wfd USING gin (search_vector);


--
-- Name: idx_wfd_temp_question_text_unique; Type: INDEX; Schema: pte; Owner: -
--

CREATE UNIQUE INDEX idx_wfd_temp_question_text_unique ON pte.wfd_temp USING btree (question_text);


--
-- Name: ra_created_at_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX ra_created_at_idx ON pte.ra USING btree (created_at DESC);


--
-- Name: ra_difficulty_level_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX ra_difficulty_level_idx ON pte.ra USING btree (difficulty_level);


--
-- Name: ra_is_prediction_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX ra_is_prediction_idx ON pte.ra USING btree (is_prediction);


--
-- Name: ra_is_real_exam_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX ra_is_real_exam_idx ON pte.ra USING btree (is_real_exam);


--
-- Name: ra_question_number_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX ra_question_number_idx ON pte.ra USING btree (question_number);


--
-- Name: ra_source_question_id_unique; Type: INDEX; Schema: pte; Owner: -
--

CREATE UNIQUE INDEX ra_source_question_id_unique ON pte.ra USING btree (source_platform, source_question_id) WHERE (source_question_id IS NOT NULL);


--
-- Name: rl_created_at_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rl_created_at_idx ON pte.rl USING btree (created_at DESC);


--
-- Name: rl_difficulty_level_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rl_difficulty_level_idx ON pte.rl USING btree (difficulty_level);


--
-- Name: rl_internal_id_unique; Type: INDEX; Schema: pte; Owner: -
--

CREATE UNIQUE INDEX rl_internal_id_unique ON pte.rl USING btree (internal_id) WHERE (internal_id IS NOT NULL);


--
-- Name: rl_is_prediction_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rl_is_prediction_idx ON pte.rl USING btree (is_prediction);


--
-- Name: rl_is_real_exam_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rl_is_real_exam_idx ON pte.rl USING btree (is_real_exam);


--
-- Name: rl_page_no_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rl_page_no_idx ON pte.rl USING btree (page_no);


--
-- Name: rl_question_num_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rl_question_num_idx ON pte.rl USING btree (question_num);


--
-- Name: rl_source_question_id_unique; Type: INDEX; Schema: pte; Owner: -
--

CREATE UNIQUE INDEX rl_source_question_id_unique ON pte.rl USING btree (source_platform, source_question_id) WHERE (source_question_id IS NOT NULL);


--
-- Name: rs_created_at_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rs_created_at_idx ON pte.rs USING btree (created_at DESC);


--
-- Name: rs_difficulty_level_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rs_difficulty_level_idx ON pte.rs USING btree (difficulty_level);


--
-- Name: rs_internal_id_unique; Type: INDEX; Schema: pte; Owner: -
--

CREATE UNIQUE INDEX rs_internal_id_unique ON pte.rs USING btree (internal_id) WHERE (internal_id IS NOT NULL);


--
-- Name: rs_is_prediction_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rs_is_prediction_idx ON pte.rs USING btree (is_prediction);


--
-- Name: rs_is_real_exam_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rs_is_real_exam_idx ON pte.rs USING btree (is_real_exam);


--
-- Name: rs_page_no_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rs_page_no_idx ON pte.rs USING btree (page_no);


--
-- Name: rs_question_num_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rs_question_num_idx ON pte.rs USING btree (question_num);


--
-- Name: rs_source_question_id_unique; Type: INDEX; Schema: pte; Owner: -
--

CREATE UNIQUE INDEX rs_source_question_id_unique ON pte.rs USING btree (source_platform, source_question_id) WHERE (source_question_id IS NOT NULL);


--
-- Name: rts_created_at_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rts_created_at_idx ON pte.rts USING btree (created_at DESC);


--
-- Name: rts_difficulty_level_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rts_difficulty_level_idx ON pte.rts USING btree (difficulty_level);


--
-- Name: rts_internal_id_unique; Type: INDEX; Schema: pte; Owner: -
--

CREATE UNIQUE INDEX rts_internal_id_unique ON pte.rts USING btree (internal_id) WHERE (internal_id IS NOT NULL);


--
-- Name: rts_is_prediction_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rts_is_prediction_idx ON pte.rts USING btree (is_prediction);


--
-- Name: rts_is_real_exam_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rts_is_real_exam_idx ON pte.rts USING btree (is_real_exam);


--
-- Name: rts_page_no_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rts_page_no_idx ON pte.rts USING btree (page_no);


--
-- Name: rts_question_num_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rts_question_num_idx ON pte.rts USING btree (question_num);


--
-- Name: rts_source_question_id_unique; Type: INDEX; Schema: pte; Owner: -
--

CREATE UNIQUE INDEX rts_source_question_id_unique ON pte.rts USING btree (source_platform, source_question_id) WHERE (source_question_id IS NOT NULL);


--
-- Name: rts_tag_topic_idx; Type: INDEX; Schema: pte; Owner: -
--

CREATE INDEX rts_tag_topic_idx ON pte.rts USING btree (tag_topic);


--
-- Name: sgd_internal_id_unique; Type: INDEX; Schema: pte; Owner: -
--

CREATE UNIQUE INDEX sgd_internal_id_unique ON pte.sgd USING btree (internal_id) WHERE (internal_id IS NOT NULL);


--
-- Name: sgd_source_question_id_unique; Type: INDEX; Schema: pte; Owner: -
--

CREATE UNIQUE INDEX sgd_source_question_id_unique ON pte.sgd USING btree (source_platform, source_question_id) WHERE (source_question_id IS NOT NULL);


--
-- Name: idx_ai_usage_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs USING btree (created_at DESC);


--
-- Name: idx_ai_usage_logs_feature; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_usage_logs_feature ON public.ai_usage_logs USING btree (feature);


--
-- Name: idx_ai_usage_logs_user_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_usage_logs_user_created_at ON public.ai_usage_logs USING btree (user_id, created_at DESC);


--
-- Name: idx_ai_usage_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_usage_logs_user_id ON public.ai_usage_logs USING btree (user_id);


--
-- Name: idx_courses_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_category ON public.courses USING btree (category);


--
-- Name: idx_courses_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_created_at ON public.courses USING btree (created_at DESC);


--
-- Name: idx_courses_is_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_is_featured ON public.courses USING btree (is_featured);


--
-- Name: idx_courses_is_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_is_published ON public.courses USING btree (is_published);


--
-- Name: idx_courses_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_published_at ON public.courses USING btree (published_at DESC);


--
-- Name: idx_courses_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_sort_order ON public.courses USING btree (sort_order);


--
-- Name: idx_courses_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_tags ON public.courses USING gin (tags);


--
-- Name: idx_student_attempts_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_attempts_created ON public.student_attempts USING btree (created_at DESC);


--
-- Name: idx_student_attempts_question; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_attempts_question ON public.student_attempts USING btree (question_source, question_id);


--
-- Name: idx_student_attempts_submitted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_attempts_submitted_at ON public.student_attempts USING btree (submitted_at DESC);


--
-- Name: idx_student_attempts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_attempts_user ON public.student_attempts USING btree (user_id);


--
-- Name: idx_student_attempts_user_question; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_attempts_user_question ON public.student_attempts USING btree (user_id, question_source, question_id);


--
-- Name: idx_student_question_stats_fibrw; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_question_stats_fibrw ON public.student_question_stats USING btree (user_id, question_source, question_id);


--
-- Name: idx_student_stats_practiced; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_stats_practiced ON public.student_question_stats USING btree (user_id, is_practiced);


--
-- Name: idx_student_stats_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_stats_user ON public.student_question_stats USING btree (user_id);


--
-- Name: idx_student_wrong_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_wrong_active ON public.student_wrong_questions USING btree (user_id, is_resolved);


--
-- Name: idx_student_wrong_questions_fibrw; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_wrong_questions_fibrw ON public.student_wrong_questions USING btree (user_id, question_source, question_id, is_resolved);


--
-- Name: idx_student_wrong_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_wrong_user ON public.student_wrong_questions USING btree (user_id);


--
-- Name: di set_di_updated_at; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER set_di_updated_at BEFORE UPDATE ON pte.di FOR EACH ROW EXECUTE FUNCTION pte.set_updated_at();


--
-- Name: hiw set_hiw_updated_at; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER set_hiw_updated_at BEFORE UPDATE ON pte.hiw FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: ra set_ra_updated_at; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER set_ra_updated_at BEFORE UPDATE ON pte.ra FOR EACH ROW EXECUTE FUNCTION pte.set_updated_at();


--
-- Name: rl set_rl_updated_at; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER set_rl_updated_at BEFORE UPDATE ON pte.rl FOR EACH ROW EXECUTE FUNCTION pte.set_updated_at();


--
-- Name: rs set_rs_updated_at; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER set_rs_updated_at BEFORE UPDATE ON pte.rs FOR EACH ROW EXECUTE FUNCTION pte.set_updated_at();


--
-- Name: rts set_rts_updated_at; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER set_rts_updated_at BEFORE UPDATE ON pte.rts FOR EACH ROW EXECUTE FUNCTION pte.set_updated_at();


--
-- Name: asq trg_asq_search_vector; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER trg_asq_search_vector BEFORE INSERT OR UPDATE ON pte.asq FOR EACH ROW EXECUTE FUNCTION pte.asq_search_trigger();


--
-- Name: asq trg_asq_updated_at; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER trg_asq_updated_at BEFORE UPDATE ON pte.asq FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: di trg_di_search_vector; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER trg_di_search_vector BEFORE INSERT OR UPDATE ON pte.di FOR EACH ROW EXECUTE FUNCTION pte.di_search_trigger();


--
-- Name: fibr trg_fibr_search_vector; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER trg_fibr_search_vector BEFORE INSERT OR UPDATE ON pte.fibr FOR EACH ROW EXECUTE FUNCTION pte.fibr_search_trigger();


--
-- Name: fibr trg_fibr_updated_at; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER trg_fibr_updated_at BEFORE UPDATE ON pte.fibr FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: fibrw trg_fibrw_search_vector; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER trg_fibrw_search_vector BEFORE INSERT OR UPDATE ON pte.fibrw FOR EACH ROW EXECUTE FUNCTION pte.fibrw_search_trigger();


--
-- Name: fibrw trg_fibrw_updated_at; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER trg_fibrw_updated_at BEFORE UPDATE ON pte.fibrw FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: hiw trg_hiw_search_vector; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER trg_hiw_search_vector BEFORE INSERT OR UPDATE ON pte.hiw FOR EACH ROW EXECUTE FUNCTION pte.hiw_search_trigger();


--
-- Name: ra trg_ra_search_vector; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER trg_ra_search_vector BEFORE INSERT OR UPDATE ON pte.ra FOR EACH ROW EXECUTE FUNCTION pte.ra_search_trigger();


--
-- Name: rl trg_rl_search_vector; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER trg_rl_search_vector BEFORE INSERT OR UPDATE ON pte.rl FOR EACH ROW EXECUTE FUNCTION pte.rl_search_trigger();


--
-- Name: ro trg_ro_search_vector; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER trg_ro_search_vector BEFORE INSERT OR UPDATE ON pte.ro FOR EACH ROW EXECUTE FUNCTION pte.ro_search_trigger();


--
-- Name: ro trg_ro_updated_at; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER trg_ro_updated_at BEFORE UPDATE ON pte.ro FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: rs trg_rs_search_vector; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER trg_rs_search_vector BEFORE INSERT OR UPDATE ON pte.rs FOR EACH ROW EXECUTE FUNCTION pte.rs_search_trigger();


--
-- Name: sst trg_sst_search_vector; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER trg_sst_search_vector BEFORE INSERT OR UPDATE ON pte.sst FOR EACH ROW EXECUTE FUNCTION pte.sst_search_trigger();


--
-- Name: swt trg_swt_updated_at; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER trg_swt_updated_at BEFORE UPDATE ON pte.swt FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: we trg_we_updated_at; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER trg_we_updated_at BEFORE UPDATE ON pte.we FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: wfd trg_wfd_search_vector; Type: TRIGGER; Schema: pte; Owner: -
--

CREATE TRIGGER trg_wfd_search_vector BEFORE INSERT OR UPDATE ON pte.wfd FOR EACH ROW EXECUTE FUNCTION pte.wfd_search_trigger();


--
-- Name: profiles on_profile_created_create_ai_limit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_profile_created_create_ai_limit AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_ai_user_limit();


--
-- Name: ai_user_limits trg_ai_user_limits_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ai_user_limits_updated_at BEFORE UPDATE ON public.ai_user_limits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: chat_sessions trg_chat_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: courses trg_courses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.set_courses_updated_at();


--
-- Name: student_attempts trg_student_attempts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_student_attempts_updated_at BEFORE UPDATE ON public.student_attempts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: student_question_stats trg_student_stats_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_student_stats_updated_at BEFORE UPDATE ON public.student_question_stats FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: student_wrong_questions trg_student_wrong_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_student_wrong_updated_at BEFORE UPDATE ON public.student_wrong_questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: essay_answer essay_answer_we_id_fkey; Type: FK CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.essay_answer
    ADD CONSTRAINT essay_answer_we_id_fkey FOREIGN KEY (we_id) REFERENCES pte.we(id) ON DELETE CASCADE;


--
-- Name: essay_sentence essay_sentence_essay_answer_id_fkey; Type: FK CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.essay_sentence
    ADD CONSTRAINT essay_sentence_essay_answer_id_fkey FOREIGN KEY (essay_answer_id) REFERENCES pte.essay_answer(id) ON DELETE SET NULL;


--
-- Name: essay_sentence essay_sentence_we_id_fkey; Type: FK CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.essay_sentence
    ADD CONSTRAINT essay_sentence_we_id_fkey FOREIGN KEY (we_id) REFERENCES pte.we(id) ON DELETE SET NULL;


--
-- Name: swt_answer swt_answer_swt_id_fkey; Type: FK CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.swt_answer
    ADD CONSTRAINT swt_answer_swt_id_fkey FOREIGN KEY (swt_id) REFERENCES pte.swt(id) ON DELETE CASCADE;


--
-- Name: swt_component swt_component_swt_answer_id_fkey; Type: FK CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.swt_component
    ADD CONSTRAINT swt_component_swt_answer_id_fkey FOREIGN KEY (swt_answer_id) REFERENCES pte.swt_answer(id) ON DELETE CASCADE;


--
-- Name: swt_component swt_component_swt_id_fkey; Type: FK CONSTRAINT; Schema: pte; Owner: -
--

ALTER TABLE ONLY pte.swt_component
    ADD CONSTRAINT swt_component_swt_id_fkey FOREIGN KEY (swt_id) REFERENCES pte.swt(id) ON DELETE SET NULL;


--
-- Name: ai_usage_logs ai_usage_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_user_limits ai_user_limits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_user_limits
    ADD CONSTRAINT ai_user_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE;


--
-- Name: chat_sessions chat_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: courses courses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: posts posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: student_attempts student_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_attempts
    ADD CONSTRAINT student_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: student_question_stats student_question_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_question_stats
    ADD CONSTRAINT student_question_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: student_wrong_questions student_wrong_questions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_wrong_questions
    ADD CONSTRAINT student_wrong_questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: study_plans study_plans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_plans
    ADD CONSTRAINT study_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: essay_answer Admins can manage essay answers; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Admins can manage essay answers" ON pte.essay_answer TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));


--
-- Name: essay_sentence Admins can manage essay sentences; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Admins can manage essay sentences" ON pte.essay_sentence TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));


--
-- Name: swt_answer Admins can manage swt answers; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Admins can manage swt answers" ON pte.swt_answer TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));


--
-- Name: swt_component Admins can manage swt components; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Admins can manage swt components" ON pte.swt_component TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));


--
-- Name: fibr Anyone can read fibr; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Anyone can read fibr" ON pte.fibr FOR SELECT USING (true);


--
-- Name: fibr Authenticated can delete fibr; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Authenticated can delete fibr" ON pte.fibr FOR DELETE TO authenticated USING (true);


--
-- Name: fibr Authenticated can insert fibr; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Authenticated can insert fibr" ON pte.fibr FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fibr Authenticated can update fibr; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Authenticated can update fibr" ON pte.fibr FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fibrw Authenticated users can delete fibrw; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Authenticated users can delete fibrw" ON pte.fibrw FOR DELETE TO authenticated USING (true);


--
-- Name: fibrw Authenticated users can insert fibrw; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Authenticated users can insert fibrw" ON pte.fibrw FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: wfd_vocabulary Authenticated users can read wfd vocabulary; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Authenticated users can read wfd vocabulary" ON pte.wfd_vocabulary FOR SELECT TO authenticated USING (true);


--
-- Name: fibrw Authenticated users can update fibrw; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Authenticated users can update fibrw" ON pte.fibrw FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: essay_answer Public can read essay answers; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Public can read essay answers" ON pte.essay_answer FOR SELECT TO authenticated, anon USING (true);


--
-- Name: essay_sentence Public can read essay sentences; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Public can read essay sentences" ON pte.essay_sentence FOR SELECT TO authenticated, anon USING (true);


--
-- Name: fibrw Public can read fibrw; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Public can read fibrw" ON pte.fibrw FOR SELECT USING (true);


--
-- Name: swt_answer Public can read swt answers; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Public can read swt answers" ON pte.swt_answer FOR SELECT TO authenticated, anon USING (true);


--
-- Name: swt_component Public can read swt components; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Public can read swt components" ON pte.swt_component FOR SELECT TO authenticated, anon USING (true);


--
-- Name: ra RA: allow authenticated read; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "RA: allow authenticated read" ON pte.ra FOR SELECT TO authenticated USING (true);


--
-- Name: speaking_attempts Service role full access speaking attempts; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Service role full access speaking attempts" ON pte.speaking_attempts TO service_role USING (true) WITH CHECK (true);


--
-- Name: speaking_attempts Users can delete own speaking attempts; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Users can delete own speaking attempts" ON pte.speaking_attempts FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: speaking_attempts Users can insert own speaking attempts; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Users can insert own speaking attempts" ON pte.speaking_attempts FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: speaking_attempts Users can update own speaking attempts; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Users can update own speaking attempts" ON pte.speaking_attempts FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: speaking_attempts Users can view own speaking attempts; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "Users can view own speaking attempts" ON pte.speaking_attempts FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: di admin can delete di; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can delete di" ON pte.di FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: ra admin can delete ra; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can delete ra" ON pte.ra FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: rl admin can delete rl; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can delete rl" ON pte.rl FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: rs admin can delete rs; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can delete rs" ON pte.rs FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: rts admin can delete rts; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can delete rts" ON pte.rts FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: sgd admin can delete sgd; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can delete sgd" ON pte.sgd FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: di admin can insert di; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can insert di" ON pte.di FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: ra admin can insert ra; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can insert ra" ON pte.ra FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: rl admin can insert rl; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can insert rl" ON pte.rl FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: rs admin can insert rs; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can insert rs" ON pte.rs FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: rts admin can insert rts; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can insert rts" ON pte.rts FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: sgd admin can insert sgd; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can insert sgd" ON pte.sgd FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: di admin can update di; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can update di" ON pte.di FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: ra admin can update ra; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can update ra" ON pte.ra FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: rl admin can update rl; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can update rl" ON pte.rl FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: rs admin can update rs; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can update rs" ON pte.rs FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: rts admin can update rts; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can update rts" ON pte.rts FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: sgd admin can update sgd; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "admin can update sgd" ON pte.sgd FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: asq; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.asq ENABLE ROW LEVEL SECURITY;

--
-- Name: asq asq_admin_all; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY asq_admin_all ON pte.asq TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: asq asq_authenticated_read; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY asq_authenticated_read ON pte.asq FOR SELECT TO authenticated USING (true);


--
-- Name: di authenticated can read di; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "authenticated can read di" ON pte.di FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: hiw authenticated can read hiw; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "authenticated can read hiw" ON pte.hiw FOR SELECT TO authenticated USING (true);


--
-- Name: sst authenticated can read pte sst; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "authenticated can read pte sst" ON pte.sst FOR SELECT TO authenticated USING (true);


--
-- Name: ra authenticated can read ra; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "authenticated can read ra" ON pte.ra FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: rl authenticated can read rl; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "authenticated can read rl" ON pte.rl FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: rs authenticated can read rs; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "authenticated can read rs" ON pte.rs FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: rts authenticated can read rts; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "authenticated can read rts" ON pte.rts FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: sgd authenticated can read sgd; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "authenticated can read sgd" ON pte.sgd FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: ro authenticated_can_read_ro; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY authenticated_can_read_ro ON pte.ro FOR SELECT TO authenticated USING (true);


--
-- Name: di; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.di ENABLE ROW LEVEL SECURITY;

--
-- Name: essay_answer; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.essay_answer ENABLE ROW LEVEL SECURITY;

--
-- Name: essay_sentence; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.essay_sentence ENABLE ROW LEVEL SECURITY;

--
-- Name: fibr; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.fibr ENABLE ROW LEVEL SECURITY;

--
-- Name: fibrw; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.fibrw ENABLE ROW LEVEL SECURITY;

--
-- Name: fibrw fibrw_delete_policy; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY fibrw_delete_policy ON pte.fibrw FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: fibrw fibrw_insert_policy; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY fibrw_insert_policy ON pte.fibrw FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: fibrw fibrw_select_policy; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY fibrw_select_policy ON pte.fibrw FOR SELECT TO authenticated USING (true);


--
-- Name: fibrw fibrw_update_policy; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY fibrw_update_policy ON pte.fibrw FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: hiw; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.hiw ENABLE ROW LEVEL SECURITY;

--
-- Name: wfd public read wfd questions; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "public read wfd questions" ON pte.wfd FOR SELECT TO authenticated, anon USING (true);


--
-- Name: ra; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.ra ENABLE ROW LEVEL SECURITY;

--
-- Name: rl; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.rl ENABLE ROW LEVEL SECURITY;

--
-- Name: ro; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.ro ENABLE ROW LEVEL SECURITY;

--
-- Name: rs; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.rs ENABLE ROW LEVEL SECURITY;

--
-- Name: rts; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.rts ENABLE ROW LEVEL SECURITY;

--
-- Name: wfd service delete wfd questions; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "service delete wfd questions" ON pte.wfd FOR DELETE TO service_role USING (true);


--
-- Name: wfd service insert wfd questions; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "service insert wfd questions" ON pte.wfd FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: hiw service role can manage hiw; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "service role can manage hiw" ON pte.hiw TO service_role USING (true) WITH CHECK (true);


--
-- Name: wfd service update wfd questions; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY "service update wfd questions" ON pte.wfd FOR UPDATE TO service_role USING (true) WITH CHECK (true);


--
-- Name: ro service_role_can_manage_ro; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY service_role_can_manage_ro ON pte.ro TO service_role USING (true) WITH CHECK (true);


--
-- Name: asq service_role_manage_asq; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY service_role_manage_asq ON pte.asq TO service_role USING (true) WITH CHECK (true);


--
-- Name: swt service_role_manage_swt; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY service_role_manage_swt ON pte.swt TO service_role USING (true) WITH CHECK (true);


--
-- Name: we service_role_manage_we; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY service_role_manage_we ON pte.we TO service_role USING (true) WITH CHECK (true);


--
-- Name: sgd; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.sgd ENABLE ROW LEVEL SECURITY;

--
-- Name: speaking_attempts; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.speaking_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: sst; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.sst ENABLE ROW LEVEL SECURITY;

--
-- Name: swt; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.swt ENABLE ROW LEVEL SECURITY;

--
-- Name: swt swt_admin_all; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY swt_admin_all ON pte.swt TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: swt_answer; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.swt_answer ENABLE ROW LEVEL SECURITY;

--
-- Name: swt swt_authenticated_read; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY swt_authenticated_read ON pte.swt FOR SELECT TO authenticated USING (true);


--
-- Name: swt_component; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.swt_component ENABLE ROW LEVEL SECURITY;

--
-- Name: we; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.we ENABLE ROW LEVEL SECURITY;

--
-- Name: we we_admin_all; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY we_admin_all ON pte.we TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: we we_authenticated_read; Type: POLICY; Schema: pte; Owner: -
--

CREATE POLICY we_authenticated_read ON pte.we FOR SELECT TO authenticated USING (true);


--
-- Name: wfd; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.wfd ENABLE ROW LEVEL SECURITY;

--
-- Name: wfd_temp; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.wfd_temp ENABLE ROW LEVEL SECURITY;

--
-- Name: wfd_vocabulary; Type: ROW SECURITY; Schema: pte; Owner: -
--

ALTER TABLE pte.wfd_vocabulary ENABLE ROW LEVEL SECURITY;

--
-- Name: courses Admins can delete courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete courses" ON public.courses FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));


--
-- Name: chat_messages Admins can insert admin or ai messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert admin or ai messages" ON public.chat_messages FOR INSERT WITH CHECK (((sender = ANY (ARRAY['admin'::text, 'ai'::text])) AND (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text])))))));


--
-- Name: courses Admins can insert courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert courses" ON public.courses FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));


--
-- Name: ai_usage_logs Admins can manage all ai usage logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all ai usage logs" ON public.ai_usage_logs TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));


--
-- Name: ai_user_limits Admins can manage all ai user limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all ai user limits" ON public.ai_user_limits TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));


--
-- Name: courses Admins can read all courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read all courses" ON public.courses FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));


--
-- Name: courses Admins can update courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update courses" ON public.courses FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));


--
-- Name: chat_messages Admins can update messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update messages" ON public.chat_messages FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: chat_sessions Admins can view all chat sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all chat sessions" ON public.chat_sessions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: chat_messages Admins can view all messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all messages" ON public.chat_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: posts Authenticated users can create posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create posts" ON public.posts FOR SELECT USING ((auth.uid() = author_id));


--
-- Name: courses Authenticated users can read published courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read published courses" ON public.courses FOR SELECT TO authenticated USING ((is_published = true));


--
-- Name: posts Authors can delete their posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can delete their posts" ON public.posts FOR DELETE USING ((auth.uid() = author_id));


--
-- Name: posts Authors can update their posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can update their posts" ON public.posts FOR UPDATE USING ((auth.uid() = author_id)) WITH CHECK ((auth.uid() = author_id));


--
-- Name: posts Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.posts FOR INSERT WITH CHECK (true);


--
-- Name: profiles Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: posts Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.posts FOR SELECT USING (true);


--
-- Name: posts Public can view published posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view published posts" ON public.posts FOR SELECT USING ((status = 'published'::text));


--
-- Name: chat_sessions Users can create own chat sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own chat sessions" ON public.chat_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: chat_messages Users can insert ai messages in own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert ai messages in own sessions" ON public.chat_messages FOR INSERT WITH CHECK (((sender = 'ai'::text) AND (EXISTS ( SELECT 1
   FROM public.chat_sessions s
  WHERE ((s.id = chat_messages.session_id) AND (s.user_id = auth.uid()))))));


--
-- Name: chat_messages Users can insert messages in own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert messages in own sessions" ON public.chat_messages FOR INSERT WITH CHECK (((sender = 'user'::text) AND (EXISTS ( SELECT 1
   FROM public.chat_sessions s
  WHERE ((s.id = chat_messages.session_id) AND (s.user_id = auth.uid()))))));


--
-- Name: ai_usage_logs Users can insert own ai usage logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own ai usage logs" ON public.ai_usage_logs FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: study_plans Users can insert own study plan; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own study plan" ON public.study_plans FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: ai_usage_logs Users can read own ai usage logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own ai usage logs" ON public.ai_usage_logs FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: ai_user_limits Users can read own ai user limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own ai user limits" ON public.ai_user_limits FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: study_plans Users can update own study plan; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own study plan" ON public.study_plans FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: chat_messages Users can view messages in own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in own sessions" ON public.chat_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.chat_sessions s
  WHERE ((s.id = chat_messages.session_id) AND (s.user_id = auth.uid())))));


--
-- Name: chat_sessions Users can view own chat sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: study_plans Users can view own study plan; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own study plan" ON public.study_plans FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: ai_usage_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_user_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_user_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: all_question_info; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.all_question_info ENABLE ROW LEVEL SECURITY;

--
-- Name: all_question_info authenticated users can read all_question_info; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "authenticated users can read all_question_info" ON public.all_question_info FOR SELECT TO authenticated USING (true);


--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

--
-- Name: posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated USING ((id = auth.uid()));


--
-- Name: profiles profiles_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));


--
-- Name: student_recordings recordings: user can insert own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "recordings: user can insert own" ON public.student_recordings FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: student_recordings recordings: user can read own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "recordings: user can read own" ON public.student_recordings FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: student_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: student_attempts student_attempts_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_attempts_delete_own ON public.student_attempts FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: student_attempts student_attempts_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_attempts_insert_own ON public.student_attempts FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: student_attempts student_attempts_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_attempts_select_own ON public.student_attempts FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: student_attempts student_attempts_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_attempts_update_own ON public.student_attempts FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: student_question_stats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_question_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: student_recordings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_recordings ENABLE ROW LEVEL SECURITY;

--
-- Name: student_question_stats student_stats_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_stats_delete_own ON public.student_question_stats FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: student_question_stats student_stats_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_stats_insert_own ON public.student_question_stats FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: student_question_stats student_stats_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_stats_select_own ON public.student_question_stats FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: student_question_stats student_stats_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_stats_update_own ON public.student_question_stats FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: student_wrong_questions student_wrong_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_wrong_delete_own ON public.student_wrong_questions FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: student_wrong_questions student_wrong_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_wrong_insert_own ON public.student_wrong_questions FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: student_wrong_questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_wrong_questions ENABLE ROW LEVEL SECURITY;

--
-- Name: student_wrong_questions student_wrong_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_wrong_select_own ON public.student_wrong_questions FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: student_wrong_questions student_wrong_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_wrong_update_own ON public.student_wrong_questions FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: study_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: student_wrong_questions wrong: user can read own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "wrong: user can read own" ON public.student_wrong_questions FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- PostgreSQL database dump complete
--

\unrestrict WPhrhtoAbeO5Cvr6XVSdrBnpWkF1haZLMwDQznQj9Ln00c5PSRuz5VuwUFyuY1i

