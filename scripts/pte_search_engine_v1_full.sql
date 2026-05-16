
-- =========================================================
-- PTE SEARCH ENGINE V1
-- Production Full Text Search Migration
-- =========================================================

-- =========================================================
-- SECTION 1
-- GLOBAL SEARCH RPC
-- =========================================================

DROP FUNCTION IF EXISTS public.search_pte_questions(
    text,
    integer,
    text
);

CREATE FUNCTION public.search_pte_questions(

    search_query text,

    result_limit integer DEFAULT 30,

    question_type_filter text DEFAULT NULL

)

RETURNS TABLE (

    question_type text,

    question_id text,

    title text,

    preview text,

    highlight text,

    url text,

    rank real

)

LANGUAGE sql

STABLE

SECURITY DEFINER

SET search_path = public, views, pte

AS $$

SELECT

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
    ) AS highlight,

    v.url,

    ts_rank(
        v.search_vector,
        websearch_to_tsquery(
            'english',
            search_query
        )
    ) AS rank

FROM views.v_pte_global_search v

WHERE

    (
        question_type_filter IS NULL
        OR
        v.question_type = question_type_filter
    )

    AND

    v.search_vector @@
    websearch_to_tsquery(
        'english',
        search_query
    )

ORDER BY rank DESC

LIMIT result_limit;

$$;

GRANT EXECUTE
ON FUNCTION public.search_pte_questions(
    text,
    integer,
    text
)
TO anon, authenticated;

-- =========================================================
-- SECTION 2
-- RA SEARCH
-- =========================================================

ALTER TABLE pte.ra
ADD COLUMN IF NOT EXISTS search_text text;

ALTER TABLE pte.ra
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_ra_search_vector
ON pte.ra
USING gin(search_vector);

DROP FUNCTION IF EXISTS pte.ra_search_trigger CASCADE;

CREATE FUNCTION pte.ra_search_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN

    NEW.search_text :=

        COALESCE(NEW.question_title, '') || ' ' ||

        COALESCE(NEW.question_body_text, '');

    NEW.search_vector :=

        setweight(
            to_tsvector(
                'english',
                COALESCE(NEW.question_title, '')
            ),
            'A'
        )

        ||

        setweight(
            to_tsvector(
                'english',
                COALESCE(NEW.question_body_text, '')
            ),
            'B'
        );

    RETURN NEW;

END;
$$;

DROP TRIGGER IF EXISTS trg_ra_search_vector
ON pte.ra;

CREATE TRIGGER trg_ra_search_vector
BEFORE INSERT OR UPDATE
ON pte.ra
FOR EACH ROW
EXECUTE FUNCTION pte.ra_search_trigger();

UPDATE pte.ra
SET updated_at = now();

-- =========================================================
-- SECTION 3
-- RS SEARCH
-- =========================================================

ALTER TABLE pte.rs
ADD COLUMN IF NOT EXISTS search_text text;

ALTER TABLE pte.rs
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_rs_search_vector
ON pte.rs
USING gin(search_vector);

DROP FUNCTION IF EXISTS pte.rs_search_trigger CASCADE;

CREATE FUNCTION pte.rs_search_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN

    NEW.search_text :=

        COALESCE(NEW.question_text, '') || ' ' ||
        COALESCE(NEW.answer_info, '') || ' ' ||
        COALESCE(NEW.variant_text, '');

    NEW.search_vector :=

        setweight(
            to_tsvector('english', COALESCE(NEW.question_text, '')),
            'A'
        )

        ||

        setweight(
            to_tsvector('english', COALESCE(NEW.variant_text, '')),
            'B'
        )

        ||

        setweight(
            to_tsvector('english', COALESCE(NEW.answer_info, '')),
            'C'
        );

    RETURN NEW;

END;
$$;

DROP TRIGGER IF EXISTS trg_rs_search_vector
ON pte.rs;

CREATE TRIGGER trg_rs_search_vector
BEFORE INSERT OR UPDATE
ON pte.rs
FOR EACH ROW
EXECUTE FUNCTION pte.rs_search_trigger();

UPDATE pte.rs
SET updated_at = now();

-- =========================================================
-- SECTION 4
-- RL SEARCH
-- =========================================================

ALTER TABLE pte.rl
ADD COLUMN IF NOT EXISTS search_text text;

ALTER TABLE pte.rl
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_rl_search_vector
ON pte.rl
USING gin(search_vector);

DROP FUNCTION IF EXISTS pte.rl_search_trigger CASCADE;

CREATE FUNCTION pte.rl_search_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN

    NEW.search_text :=

        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.question_title, '') || ' ' ||
        COALESCE(NEW.question_text, '');

    NEW.search_vector :=

        setweight(
            to_tsvector('english', COALESCE(NEW.title, '')),
            'A'
        )

        ||

        setweight(
            to_tsvector('english', COALESCE(NEW.question_title, '')),
            'A'
        )

        ||

        setweight(
            to_tsvector('english', COALESCE(NEW.question_text, '')),
            'B'
        );

    RETURN NEW;

END;
$$;

DROP TRIGGER IF EXISTS trg_rl_search_vector
ON pte.rl;

CREATE TRIGGER trg_rl_search_vector
BEFORE INSERT OR UPDATE
ON pte.rl
FOR EACH ROW
EXECUTE FUNCTION pte.rl_search_trigger();

UPDATE pte.rl
SET updated_at = now();

-- =========================================================
-- SECTION 5
-- DI SEARCH
-- =========================================================

ALTER TABLE pte.di
ADD COLUMN IF NOT EXISTS search_text text;

ALTER TABLE pte.di
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_di_search_vector
ON pte.di
USING gin(search_vector);

DROP FUNCTION IF EXISTS pte.di_search_trigger CASCADE;

CREATE FUNCTION pte.di_search_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN

    NEW.search_text :=

        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.question_text, '') || ' ' ||
        COALESCE(NEW.answer_info, '') || ' ' ||
        COALESCE(NEW.ai_keywords, '');

    NEW.search_vector :=

        setweight(
            to_tsvector('english', COALESCE(NEW.title, '')),
            'A'
        )

        ||

        setweight(
            to_tsvector('english', COALESCE(NEW.ai_keywords, '')),
            'A'
        )

        ||

        setweight(
            to_tsvector('english', COALESCE(NEW.answer_info, '')),
            'B'
        )

        ||

        setweight(
            to_tsvector('english', COALESCE(NEW.question_text, '')),
            'C'
        );

    RETURN NEW;

END;
$$;

DROP TRIGGER IF EXISTS trg_di_search_vector
ON pte.di;

CREATE TRIGGER trg_di_search_vector
BEFORE INSERT OR UPDATE
ON pte.di
FOR EACH ROW
EXECUTE FUNCTION pte.di_search_trigger();

UPDATE pte.di
SET updated_at = now();

-- =========================================================
-- SECTION 6
-- HIW SEARCH
-- =========================================================

ALTER TABLE pte.hiw
ADD COLUMN IF NOT EXISTS search_text text;

ALTER TABLE pte.hiw
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_hiw_search_vector
ON pte.hiw
USING gin(search_vector);

-- =========================================================
-- SECTION 7
-- WFD SEARCH
-- =========================================================

ALTER TABLE pte.wfd
ADD COLUMN IF NOT EXISTS search_text text;

ALTER TABLE pte.wfd
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_wfd_search_vector
ON pte.wfd
USING gin(search_vector);

-- =========================================================
-- SECTION 8
-- ASQ SEARCH
-- =========================================================

ALTER TABLE pte.asq
ADD COLUMN IF NOT EXISTS search_text text;

ALTER TABLE pte.asq
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_asq_search_vector
ON pte.asq
USING gin(search_vector);

-- =========================================================
-- SECTION 9
-- FIB-R SEARCH
-- =========================================================

ALTER TABLE pte.fibr
ADD COLUMN IF NOT EXISTS search_text text;

ALTER TABLE pte.fibr
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_fibr_search_vector
ON pte.fibr
USING gin(search_vector);

-- =========================================================
-- SECTION 10
-- FIB-RW SEARCH
-- =========================================================

ALTER TABLE pte.fibrw
ADD COLUMN IF NOT EXISTS search_text text;

ALTER TABLE pte.fibrw
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_fibrw_search_vector
ON pte.fibrw
USING gin(search_vector);

-- =========================================================
-- SECTION 11
-- RO SEARCH
-- =========================================================

ALTER TABLE pte.ro
ADD COLUMN IF NOT EXISTS search_text text;

ALTER TABLE pte.ro
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_ro_search_vector
ON pte.ro
USING gin(search_vector);

-- =========================================================
-- SECTION 12
-- SST SEARCH
-- =========================================================

ALTER TABLE pte.sst
ADD COLUMN IF NOT EXISTS search_text text;

ALTER TABLE pte.sst
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_sst_search_vector
ON pte.sst
USING gin(search_vector);

-- =========================================================
-- SECTION 13
-- FINAL GLOBAL SEARCH VIEW
-- =========================================================

DROP VIEW IF EXISTS views.v_pte_global_search;

CREATE VIEW views.v_pte_global_search AS

SELECT
    'RA' AS question_type,
    id::text AS question_id,
    question_title AS title,
    left(question_body_text, 200) AS preview,
    '/pte/speaking/ra/' || id::text AS url,
    search_text,
    search_vector
FROM pte.ra

UNION ALL

SELECT
    'RS' AS question_type,
    id::text AS question_id,
    left(question_text, 80) AS title,
    left(question_text, 200) AS preview,
    '/pte/speaking/rs/' || id::text AS url,
    search_text,
    search_vector
FROM pte.rs

UNION ALL

SELECT
    'RL' AS question_type,
    id::text AS question_id,
    coalesce(title, question_title) AS title,
    left(question_text, 200) AS preview,
    '/pte/speaking/rl/' || id::text AS url,
    search_text,
    search_vector
FROM pte.rl

UNION ALL

SELECT
    'DI' AS question_type,
    id::text AS question_id,
    title,
    left(answer_info, 200) AS preview,
    '/pte/speaking/di/' || id::text AS url,
    search_text,
    search_vector
FROM pte.di

UNION ALL

SELECT
    'HIW' AS question_type,
    id::text AS question_id,
    left(question_text, 80) AS title,
    left(transcript_text, 200) AS preview,
    '/pte/listening/hiw/' || id::text AS url,
    search_text,
    search_vector
FROM pte.hiw

UNION ALL

SELECT
    'WFD' AS question_type,
    id::text AS question_id,
    left(question_text, 80) AS title,
    left(question_text, 200) AS preview,
    '/pte/listening/wfd/' || id::text AS url,
    search_text,
    search_vector
FROM pte.wfd

UNION ALL

SELECT
    'SST' AS question_type,
    id::text AS question_id,
    left(question_text, 80) AS title,
    left(transcript_text, 200) AS preview,
    '/pte/listening/sst/' || id::text AS url,
    search_text,
    search_vector
FROM pte.sst

UNION ALL

SELECT
    'ASQ' AS question_type,
    id::text AS question_id,
    left(question_text, 80) AS title,
    left(answer_text, 200) AS preview,
    '/pte/speaking/asq/' || id::text AS url,
    search_text,
    search_vector
FROM pte.asq

UNION ALL

SELECT
    'FIB-R' AS question_type,
    id::text AS question_id,
    question_title AS title,
    left(question_body_text, 200) AS preview,
    '/pte/reading/fibr/' || id::text AS url,
    search_text,
    search_vector
FROM pte.fibr

UNION ALL

SELECT
    'FIB-RW' AS question_type,
    id::text AS question_id,
    question_title AS title,
    left(question_body_text, 200) AS preview,
    '/pte/reading/fibrw/' || id::text AS url,
    search_text,
    search_vector
FROM pte.fibrw

UNION ALL

SELECT
    'RO' AS question_type,
    id::text AS question_id,
    question_title AS title,
    left(question_body_text::text, 200) AS preview,
    '/pte/reading/ro/' || id::text AS url,
    search_text,
    search_vector
FROM pte.ro;

-- =========================================================
-- END
-- =========================================================
