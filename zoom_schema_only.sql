--
-- PostgreSQL database dump
--

\restrict ajK3APjD0oG6m5hcpwn5g27O9b7rgaDmsDJ8Y18QfX40Vx5NAD7RWsOR3YEj5rt

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

\unrestrict ajK3APjD0oG6m5hcpwn5g27O9b7rgaDmsDJ8Y18QfX40Vx5NAD7RWsOR3YEj5rt

