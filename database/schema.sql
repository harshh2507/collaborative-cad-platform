--
-- PostgreSQL database dump
--

\restrict 3ZGPhQRDH3peNWSShYE958OiFEvJu1hVSX5huexxCYHUOHF2lk6sYAU6TPtZqpG

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: annotation_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.annotation_comments (
    comment_id integer NOT NULL,
    annotation_id integer NOT NULL,
    user_id integer NOT NULL,
    comment text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: annotation_comments_comment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.annotation_comments_comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: annotation_comments_comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.annotation_comments_comment_id_seq OWNED BY public.annotation_comments.comment_id;


--
-- Name: annotations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.annotations (
    annotation_id integer NOT NULL,
    version_id integer NOT NULL,
    user_id integer NOT NULL,
    x double precision NOT NULL,
    y double precision NOT NULL,
    z double precision NOT NULL,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_annotation_status CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'in_progress'::character varying, 'resolved'::character varying])::text[])))
);


--
-- Name: annotations_annotation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.annotations_annotation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: annotations_annotation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.annotations_annotation_id_seq OWNED BY public.annotations.annotation_id;


--
-- Name: cad_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cad_models (
    model_id integer NOT NULL,
    project_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path text NOT NULL,
    uploaded_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: cad_models_model_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cad_models_model_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cad_models_model_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cad_models_model_id_seq OWNED BY public.cad_models.model_id;


--
-- Name: model_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_version (
    version_id integer NOT NULL,
    model_id integer NOT NULL,
    version_number integer NOT NULL,
    file_path text NOT NULL,
    uploaded_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT valid_version_number CHECK ((version_number > 0))
);


--
-- Name: model_version_version_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.model_version_version_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: model_version_version_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.model_version_version_id_seq OWNED BY public.model_version.version_id;


--
-- Name: project_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_members (
    project_member_id integer NOT NULL,
    project_id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(20) DEFAULT 'viewer'::character varying NOT NULL,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_project_member_role CHECK (((role)::text = ANY ((ARRAY['owner'::character varying, 'editor'::character varying, 'reviewer'::character varying, 'viewer'::character varying])::text[])))
);


--
-- Name: project_members_project_member_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_members_project_member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_members_project_member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_members_project_member_id_seq OWNED BY public.project_members.project_member_id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    project_id integer NOT NULL,
    project_name character varying(150) NOT NULL,
    description text,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: projects_project_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.projects_project_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: projects_project_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.projects_project_id_seq OWNED BY public.projects.project_id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    task_id integer NOT NULL,
    annotation_id integer NOT NULL,
    assigned_to integer,
    title character varying NOT NULL,
    description text,
    status character varying DEFAULT 'open'::character varying NOT NULL,
    priority character varying DEFAULT 'medium'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone,
    due_date timestamp with time zone,
    CONSTRAINT valid_task_priority CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[]))),
    CONSTRAINT valid_task_status CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'in_progress'::character varying, 'completed'::character varying])::text[])))
);


--
-- Name: tasks_task_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tasks_task_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tasks_task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tasks_task_id_seq OWNED BY public.tasks.task_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(200) NOT NULL,
    password character varying(200) NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: annotation_comments comment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annotation_comments ALTER COLUMN comment_id SET DEFAULT nextval('public.annotation_comments_comment_id_seq'::regclass);


--
-- Name: annotations annotation_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annotations ALTER COLUMN annotation_id SET DEFAULT nextval('public.annotations_annotation_id_seq'::regclass);


--
-- Name: cad_models model_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cad_models ALTER COLUMN model_id SET DEFAULT nextval('public.cad_models_model_id_seq'::regclass);


--
-- Name: model_version version_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_version ALTER COLUMN version_id SET DEFAULT nextval('public.model_version_version_id_seq'::regclass);


--
-- Name: project_members project_member_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members ALTER COLUMN project_member_id SET DEFAULT nextval('public.project_members_project_member_id_seq'::regclass);


--
-- Name: projects project_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects ALTER COLUMN project_id SET DEFAULT nextval('public.projects_project_id_seq'::regclass);


--
-- Name: tasks task_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks ALTER COLUMN task_id SET DEFAULT nextval('public.tasks_task_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: annotation_comments annotation_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annotation_comments
    ADD CONSTRAINT annotation_comments_pkey PRIMARY KEY (comment_id);


--
-- Name: annotations annotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annotations
    ADD CONSTRAINT annotations_pkey PRIMARY KEY (annotation_id);


--
-- Name: cad_models cad_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cad_models
    ADD CONSTRAINT cad_models_pkey PRIMARY KEY (model_id);


--
-- Name: model_version model_version_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_version
    ADD CONSTRAINT model_version_pkey PRIMARY KEY (version_id);


--
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (project_member_id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (project_id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (task_id);


--
-- Name: model_version unique_model_version; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_version
    ADD CONSTRAINT unique_model_version UNIQUE (model_id, version_number);


--
-- Name: project_members unique_project_member; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT unique_project_member UNIQUE (project_id, user_id);


--
-- Name: users unique_user_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_user_email UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: fki_cad_models_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fki_cad_models_project ON public.cad_models USING btree (project_id);


--
-- Name: fki_cad_models_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fki_cad_models_user ON public.cad_models USING btree (uploaded_by);


--
-- Name: fki_model_version_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fki_model_version_user ON public.model_version USING btree (uploaded_by);


--
-- Name: fki_model_versions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fki_model_versions ON public.model_version USING btree (model_id);


--
-- Name: annotations annotations_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annotations
    ADD CONSTRAINT annotations_user FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: annotations annotations_version; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annotations
    ADD CONSTRAINT annotations_version FOREIGN KEY (version_id) REFERENCES public.model_version(version_id);


--
-- Name: cad_models cad_models_project; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cad_models
    ADD CONSTRAINT cad_models_project FOREIGN KEY (project_id) REFERENCES public.projects(project_id);


--
-- Name: cad_models cad_models_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cad_models
    ADD CONSTRAINT cad_models_user FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id);


--
-- Name: annotation_comments fk_annotation_comments_annotation; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annotation_comments
    ADD CONSTRAINT fk_annotation_comments_annotation FOREIGN KEY (annotation_id) REFERENCES public.annotations(annotation_id) ON DELETE CASCADE;


--
-- Name: annotation_comments fk_annotation_comments_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annotation_comments
    ADD CONSTRAINT fk_annotation_comments_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: project_members fk_project_members_project; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT fk_project_members_project FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- Name: project_members fk_project_members_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT fk_project_members_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: model_version model_version_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_version
    ADD CONSTRAINT model_version_user FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id);


--
-- Name: model_version model_versions; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_version
    ADD CONSTRAINT model_versions FOREIGN KEY (model_id) REFERENCES public.cad_models(model_id);


--
-- Name: projects projects_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: tasks tasks_annotation; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_annotation FOREIGN KEY (annotation_id) REFERENCES public.annotations(annotation_id);


--
-- Name: tasks tasks_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_user FOREIGN KEY (assigned_to) REFERENCES public.users(user_id);


--
-- PostgreSQL database dump complete
--

\unrestrict 3ZGPhQRDH3peNWSShYE958OiFEvJu1hVSX5huexxCYHUOHF2lk6sYAU6TPtZqpG

