-- Run this migration against the same PostgreSQL database used by the root backend.
CREATE TABLE IF NOT EXISTS public.project_scenes (
  project_id INTEGER PRIMARY KEY REFERENCES public.projects(project_id) ON DELETE CASCADE,
  scene_data JSONB NOT NULL DEFAULT '{"model": null, "primitives": [], "annotations": []}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
