BEGIN;
ALTER TABLE public.annotations
  ADD COLUMN IF NOT EXISTS annotation_type varchar(20) NOT NULL DEFAULT 'point',
  ADD COLUMN IF NOT EXISTS object_id varchar(160),
  ADD COLUMN IF NOT EXISTS anchor_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS category varchar(80) NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS assigned_to integer REFERENCES public.users(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS entity_version integer NOT NULL DEFAULT 1;
DO $$ BEGIN
  ALTER TABLE public.annotations ADD CONSTRAINT annotations_type_check CHECK (annotation_type IN ('point','surface','text'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE public.annotation_comments ADD COLUMN IF NOT EXISTS parent_comment_id integer REFERENCES public.annotation_comments(comment_id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_annotations_assigned_status ON public.annotations(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_annotations_version_category ON public.annotations(version_id, category);
CREATE INDEX IF NOT EXISTS idx_annotation_comments_parent ON public.annotation_comments(parent_comment_id, created_at);
COMMIT;
