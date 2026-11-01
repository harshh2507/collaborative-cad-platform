CREATE TABLE IF NOT EXISTS public.project_chat_messages (
  message_id BIGSERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  message_text VARCHAR(2000) NOT NULL CHECK (length(btrim(message_text)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_chat_messages_project_created
  ON public.project_chat_messages (project_id, created_at DESC, message_id DESC);
