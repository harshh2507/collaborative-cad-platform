-- DTIE collaboration and annotation expansion. Safe to run more than once.
BEGIN;
CREATE TABLE IF NOT EXISTS collaboration_events (
  event_id BIGSERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  actor_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  event_uuid UUID NOT NULL,
  entity_type VARCHAR(32) NOT NULL,
  entity_id VARCHAR(160) NOT NULL,
  operation VARCHAR(32) NOT NULL,
  entity_version BIGINT NOT NULL DEFAULT 1,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, event_uuid)
);
CREATE INDEX IF NOT EXISTS idx_collab_events_project_sequence ON collaboration_events(project_id,event_id);
CREATE INDEX IF NOT EXISTS idx_collab_events_entity ON collaboration_events(project_id,entity_type,entity_id,entity_version);

ALTER TABLE annotations ADD COLUMN IF NOT EXISTS annotation_type VARCHAR(16) NOT NULL DEFAULT 'point';
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS object_id VARCHAR(160);
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS surface_normal JSONB;
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS anchor_data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS title VARCHAR(200);
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS category VARCHAR(80) NOT NULL DEFAULT 'general';
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS entity_version BIGINT NOT NULL DEFAULT 1;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'annotations_type_check') THEN
    ALTER TABLE annotations ADD CONSTRAINT annotations_type_check CHECK (annotation_type IN ('point','surface','text'));
  END IF;
END $$;

ALTER TABLE annotation_comments ADD COLUMN IF NOT EXISTS parent_comment_id INTEGER REFERENCES annotation_comments(comment_id) ON DELETE CASCADE;
ALTER TABLE annotation_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_annotation_comments_thread ON annotation_comments(annotation_id,parent_comment_id,created_at);
CREATE INDEX IF NOT EXISTS idx_annotations_assignee_status ON annotations(assigned_to,status);
COMMIT;
