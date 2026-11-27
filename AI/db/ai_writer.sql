-- psql -v writer_user=... -v writer_password=... -f ai_writer.sql   (as the database owner)
-- The AI service's own tables live in schema "ai": chat history, documents and their chunks.
-- ai_readonly keeps reading the gym data in "public"; this second role writes only here.

SET client_min_messages = warning;  -- re-running prints no "already exists" notices

SELECT format('CREATE ROLE %I LOGIN', :'writer_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'writer_user')
\gexec

ALTER ROLE :"writer_user" PASSWORD :'writer_password';
-- its default schema is ai, so pgvector's vector type and <=> operator are found
ALTER ROLE :"writer_user" SET search_path = ai;

CREATE SCHEMA IF NOT EXISTS ai;
-- pgvector, kept in schema ai so the backend's public schema stays untouched
CREATE EXTENSION IF NOT EXISTS vector SCHEMA ai;

CREATE TABLE IF NOT EXISTS ai.messages (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    thread_id  uuid NOT NULL,
    user_id    text NOT NULL,
    role       text NOT NULL CHECK (role IN ('user', 'model')),
    text       text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_thread ON ai.messages (thread_id, user_id);
CREATE INDEX IF NOT EXISTS messages_user ON ai.messages (user_id);

CREATE TABLE IF NOT EXISTS ai.documents (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_id   text NOT NULL,
    filename   text NOT NULL,
    visibility text NOT NULL CHECK (visibility IN ('member', 'staff')),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (admin_id, filename)
);

-- no vector index: the search reads every chunk of one club, exact and fast at this size
CREATE TABLE IF NOT EXISTS ai.chunks (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document_id bigint NOT NULL REFERENCES ai.documents (id) ON DELETE CASCADE,
    position    int NOT NULL,
    text        text NOT NULL,
    embedding   ai.vector(768) NOT NULL
);
CREATE INDEX IF NOT EXISTS chunks_document ON ai.chunks (document_id);

-- start from zero, so re-running never leaves an old grant behind
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM :"writer_user";
REVOKE ALL ON SCHEMA public FROM :"writer_user";
REVOKE ALL ON ALL TABLES IN SCHEMA ai FROM :"writer_user";

GRANT CONNECT ON DATABASE :"DBNAME" TO :"writer_user";
GRANT USAGE ON SCHEMA ai TO :"writer_user";
GRANT SELECT, INSERT, DELETE ON ai.messages, ai.documents, ai.chunks TO :"writer_user";
