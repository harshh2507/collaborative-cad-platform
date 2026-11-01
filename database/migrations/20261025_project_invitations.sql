-- One-time migration for project invitation links.
-- Run this against the same PostgreSQL database used by the backend.

CREATE TABLE IF NOT EXISTS public.project_invitations (
    invitation_id BIGSERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL
        REFERENCES public.projects(project_id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('editor', 'reviewer', 'viewer')),
    created_by INTEGER NOT NULL
        REFERENCES public.users(user_id) ON DELETE CASCADE,
    accepted_by INTEGER
        REFERENCES public.users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    CONSTRAINT project_invitations_expiry_after_creation
        CHECK (expires_at > created_at),
    CONSTRAINT project_invitations_acceptance_consistent
        CHECK ((accepted_at IS NULL AND accepted_by IS NULL)
            OR (accepted_at IS NOT NULL AND accepted_by IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_project_invitations_project_created
    ON public.project_invitations(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_invitations_active_expiry
    ON public.project_invitations(expires_at)
    WHERE accepted_at IS NULL AND revoked_at IS NULL;
