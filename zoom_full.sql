--
-- PostgreSQL database dump
--

\restrict pvWXlWYwegTQEmSl3JADW9PdZenfYlGbzsgg6U99Ksuu5Yl1PUNN3vPeEyYnb2D

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
-- Name: zoom; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA zoom;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: classrooms; Type: TABLE; Schema: zoom; Owner: -
--

CREATE TABLE zoom.classrooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    teacher_id uuid NOT NULL,
    student_id uuid NOT NULL,
    zoom_meeting_id text NOT NULL,
    zoom_password text,
    zoom_join_url text,
    zoom_start_url text,
    status text DEFAULT 'created'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title text,
    started_at timestamp with time zone,
    ended_at timestamp with time zone
);


--
-- Name: notifications; Type: TABLE; Schema: zoom; Owner: -
--

CREATE TABLE zoom.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text DEFAULT 'zoom_classroom'::text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    classroom_id uuid,
    meeting_id text,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    meeting_password text
);


--
-- Name: teacher_rooms; Type: TABLE; Schema: zoom; Owner: -
--

CREATE TABLE zoom.teacher_rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    teacher_id uuid NOT NULL,
    zoom_meeting_id text NOT NULL,
    zoom_password text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Data for Name: classrooms; Type: TABLE DATA; Schema: zoom; Owner: -
--

COPY zoom.classrooms (id, teacher_id, student_id, zoom_meeting_id, zoom_password, zoom_join_url, zoom_start_url, status, created_at, updated_at, title, started_at, ended_at) FROM stdin;
6a27b981-410b-464b-a659-98d346416dd9	f54bfb5e-19aa-4317-b678-d6ca6a41f5ce	444fdf02-06c4-49a8-91c4-6572c8003a1f	6393443655	\N	\N	\N	created	2026-05-30 03:40:56.560733+00	2026-05-30 03:40:56.560733+00	Chi “Neil” Ma / John Doe Classroom	\N	\N
74cfce73-e19a-49ed-8b53-c1cc14284c26	f54bfb5e-19aa-4317-b678-d6ca6a41f5ce	444fdf02-06c4-49a8-91c4-6572c8003a1f	6393443655	\N	\N	\N	created	2026-05-30 03:44:52.807992+00	2026-05-30 03:44:52.807992+00	Chi “Neil” Ma / John Doe Classroom	\N	\N
3c7be439-632a-47b0-8a45-d49ee859834d	f54bfb5e-19aa-4317-b678-d6ca6a41f5ce	444fdf02-06c4-49a8-91c4-6572c8003a1f	6393443655	\N	\N	\N	created	2026-05-30 03:47:56.62861+00	2026-05-30 03:47:56.62861+00	Chi “Neil” Ma / John Doe Classroom	\N	\N
d09afd10-a030-4c04-b32e-e5d207867b70	f54bfb5e-19aa-4317-b678-d6ca6a41f5ce	444fdf02-06c4-49a8-91c4-6572c8003a1f	6393443655	\N	\N	\N	created	2026-05-30 04:41:22.437178+00	2026-05-30 04:41:22.437178+00	Chi “Neil” Ma / John Doe Classroom	\N	\N
fbe8076a-0225-458b-b49d-dec0e3af09a5	f54bfb5e-19aa-4317-b678-d6ca6a41f5ce	444fdf02-06c4-49a8-91c4-6572c8003a1f	6393443655	\N	\N	\N	created	2026-05-30 07:09:44.091766+00	2026-05-30 07:09:44.091766+00	Chi “Neil” Ma / John Doe Classroom	\N	\N
34308b8b-6ea9-4767-9c1a-430365276526	f54bfb5e-19aa-4317-b678-d6ca6a41f5ce	444fdf02-06c4-49a8-91c4-6572c8003a1f	6393443655	\N	\N	\N	created	2026-05-30 07:24:18.644066+00	2026-05-30 07:24:18.644066+00	Chi “Neil” Ma / John Doe Classroom	\N	\N
ccd69de8-f297-4473-b32a-c2d831a0f831	f54bfb5e-19aa-4317-b678-d6ca6a41f5ce	444fdf02-06c4-49a8-91c4-6572c8003a1f	6393443655	\N	\N	\N	created	2026-05-30 07:42:35.517207+00	2026-05-30 07:42:35.517207+00	Chi “Neil” Ma / John Doe Classroom	\N	\N
88b65737-a123-4d09-943f-1573d14f97ff	f54bfb5e-19aa-4317-b678-d6ca6a41f5ce	ea236391-63c0-4be0-8e3b-39f336a03c90	6393443655	\N	\N	\N	created	2026-05-30 07:45:06.945183+00	2026-05-30 07:45:06.945183+00	Chi “Neil” Ma / Wanying zhang Classroom	\N	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: zoom; Owner: -
--

COPY zoom.notifications (id, user_id, type, title, message, classroom_id, meeting_id, is_read, created_at, meeting_password) FROM stdin;
f7401ef2-1415-4cac-86f8-8b497867ee6b	444fdf02-06c4-49a8-91c4-6572c8003a1f	zoom_classroom	New Zoom Classroom	Your teacher has created a Zoom classroom. Meeting ID: 6393443655	6a27b981-410b-464b-a659-98d346416dd9	\N	f	2026-05-30 03:40:56.707864+00	\N
5de2cc9b-dc4e-4ba5-b2b4-e91b975ed666	444fdf02-06c4-49a8-91c4-6572c8003a1f	zoom_classroom	New Zoom Classroom	Your teacher has created a Zoom classroom. Meeting ID: 6393443655	74cfce73-e19a-49ed-8b53-c1cc14284c26	6393443655	f	2026-05-30 03:44:53.071644+00	\N
50c6acc1-d103-4856-91fb-126d2a8f53a2	444fdf02-06c4-49a8-91c4-6572c8003a1f	zoom_classroom	New Zoom Classroom	Your teacher has created a Zoom classroom. Meeting ID: 6393443655	3c7be439-632a-47b0-8a45-d49ee859834d	6393443655	f	2026-05-30 03:47:56.689432+00	\N
3431dd80-3447-4edb-9c8a-f44f3917c8a4	444fdf02-06c4-49a8-91c4-6572c8003a1f	zoom_classroom	New Zoom Classroom	Your teacher has created a Zoom classroom. Meeting ID: 6393443655	d09afd10-a030-4c04-b32e-e5d207867b70	6393443655	f	2026-05-30 04:41:22.64352+00	\N
1795d971-c91a-4503-9104-98b3cdf524d8	444fdf02-06c4-49a8-91c4-6572c8003a1f	zoom_classroom	New Zoom Classroom	Your teacher has created an online meeting portal. Meeting ID: 6393443655	fbe8076a-0225-458b-b49d-dec0e3af09a5	6393443655	f	2026-05-30 07:09:44.895279+00	\N
20c2c44c-6741-4446-8489-6f81c2e6dde0	444fdf02-06c4-49a8-91c4-6572c8003a1f	zoom_classroom	New Zoom Classroom	Your teacher has created an online meeting portal. Meeting ID: 6393443655	34308b8b-6ea9-4767-9c1a-430365276526	6393443655	f	2026-05-30 07:24:18.951767+00	\N
bce61a5b-eacf-4124-bb34-cc6b2fccc016	444fdf02-06c4-49a8-91c4-6572c8003a1f	zoom_classroom	New Zoom Classroom	Your teacher has created an online meeting portal. Meeting ID: 6393443655	ccd69de8-f297-4473-b32a-c2d831a0f831	6393443655	f	2026-05-30 07:42:35.772921+00	\N
b3702021-7224-468c-862d-f1f267bfdbe1	ea236391-63c0-4be0-8e3b-39f336a03c90	zoom_classroom	New Zoom Classroom	Your teacher has created an online meeting portal. Meeting ID: 6393443655	88b65737-a123-4d09-943f-1573d14f97ff	6393443655	f	2026-05-30 07:45:07.104581+00	\N
\.


--
-- Data for Name: teacher_rooms; Type: TABLE DATA; Schema: zoom; Owner: -
--

COPY zoom.teacher_rooms (id, teacher_id, zoom_meeting_id, zoom_password, is_active, created_at, updated_at) FROM stdin;
503d5ca4-b4be-4cb0-b27c-05ffe3d62ad2	f54bfb5e-19aa-4317-b678-d6ca6a41f5ce	6393443655	\N	t	2026-05-30 03:20:58.035881+00	2026-05-30 03:20:58.035881+00
\.


--
-- Name: classrooms classrooms_pkey; Type: CONSTRAINT; Schema: zoom; Owner: -
--

ALTER TABLE ONLY zoom.classrooms
    ADD CONSTRAINT classrooms_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: zoom; Owner: -
--

ALTER TABLE ONLY zoom.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: teacher_rooms teacher_rooms_pkey; Type: CONSTRAINT; Schema: zoom; Owner: -
--

ALTER TABLE ONLY zoom.teacher_rooms
    ADD CONSTRAINT teacher_rooms_pkey PRIMARY KEY (id);


--
-- Name: classrooms classrooms_student_id_fkey; Type: FK CONSTRAINT; Schema: zoom; Owner: -
--

ALTER TABLE ONLY zoom.classrooms
    ADD CONSTRAINT classrooms_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: classrooms classrooms_teacher_id_fkey; Type: FK CONSTRAINT; Schema: zoom; Owner: -
--

ALTER TABLE ONLY zoom.classrooms
    ADD CONSTRAINT classrooms_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_classroom_id_fkey; Type: FK CONSTRAINT; Schema: zoom; Owner: -
--

ALTER TABLE ONLY zoom.notifications
    ADD CONSTRAINT notifications_classroom_id_fkey FOREIGN KEY (classroom_id) REFERENCES zoom.classrooms(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: zoom; Owner: -
--

ALTER TABLE ONLY zoom.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: teacher_rooms teacher_rooms_teacher_id_fkey; Type: FK CONSTRAINT; Schema: zoom; Owner: -
--

ALTER TABLE ONLY zoom.teacher_rooms
    ADD CONSTRAINT teacher_rooms_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: classrooms; Type: ROW SECURITY; Schema: zoom; Owner: -
--

ALTER TABLE zoom.classrooms ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: zoom; Owner: -
--

ALTER TABLE zoom.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: teacher_rooms; Type: ROW SECURITY; Schema: zoom; Owner: -
--

ALTER TABLE zoom.teacher_rooms ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict pvWXlWYwegTQEmSl3JADW9PdZenfYlGbzsgg6U99Ksuu5Yl1PUNN3vPeEyYnb2D

