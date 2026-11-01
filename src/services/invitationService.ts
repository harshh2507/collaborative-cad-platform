
import crypto from "crypto";
import pool from "../config/database";

export type InvitationRole = "editor" | "reviewer" | "viewer";

const INVITATION_EXPIRY_HOURS = 72;

const generateToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Create an invitation link for a project.
export const createInvitation = async (
  projectId: number,
  createdBy: number,
  role: InvitationRole
) => {
  const token = generateToken();
  const tokenHash = hashToken(token);

  const result = await pool.query(
    `INSERT INTO project_invitations
       (project_id, token_hash, role, created_by, expires_at)
     VALUES (
       $1, $2, $3, $4,
       NOW() + ($5 * INTERVAL '1 hour')
     )
     RETURNING invitation_id, project_id, role, expires_at, created_at`,
    [projectId, tokenHash, role, createdBy, INVITATION_EXPIRY_HOURS]
  );

  return {
    invitation: result.rows[0],
    token
  };
};

// Retrieve an invitation only if it is still valid.
export const getValidInvitation = async (token: string) => {
  const tokenHash = hashToken(token);

  const result = await pool.query(
    `SELECT
       invitation_id,
       project_id,
       role,
       created_by,
       expires_at
     FROM project_invitations
     WHERE token_hash = $1
       AND expires_at > NOW()
       AND accepted_at IS NULL
       AND revoked_at IS NULL`,
    [tokenHash]
  );

  return result.rows[0] || null;
};

// Accept an invitation and add the authenticated user to the project.
export const acceptInvitation = async (
  token: string,
  userId: number
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tokenHash = hashToken(token);

    // Lock the invitation to prevent simultaneous acceptance.
    const invitationResult = await client.query(
      `SELECT invitation_id, project_id, role
       FROM project_invitations
       WHERE token_hash = $1
         AND expires_at > NOW()
         AND accepted_at IS NULL
         AND revoked_at IS NULL
       FOR UPDATE`,
      [tokenHash]
    );

    if (invitationResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { status: "invalid" as const };
    }

    const invitation = invitationResult.rows[0];

    // Add membership only if the user is not already a member.
    const existingMember = await client.query(
      `SELECT project_member_id, role
       FROM project_members
       WHERE project_id = $1 AND user_id = $2`,
      [invitation.project_id, userId]
    );

    if (existingMember.rows.length > 0) {
      await client.query("ROLLBACK");
      return { status: "already_member" as const };
    }

    await client.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [invitation.project_id, userId, invitation.role]
    );

    await client.query(
      `UPDATE project_invitations
       SET accepted_by = $1, accepted_at = NOW()
       WHERE invitation_id = $2`,
      [userId, invitation.invitation_id]
    );

    await client.query("COMMIT");

    return {
      status: "accepted" as const,
      projectId: invitation.project_id,
      role: invitation.role
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getProjectInvitations = async (projectId: number) => {
  const result = await pool.query(
    `SELECT
       pi.invitation_id,
       pi.project_id,
       p.project_name,
       pi.role,
       pi.created_at,
       pi.expires_at,
       pi.accepted_at,
       pi.revoked_at,
       creator.name AS created_by_name
     FROM project_invitations pi
     JOIN projects p ON p.project_id = pi.project_id
     JOIN users creator ON creator.user_id = pi.created_by
     WHERE pi.project_id = $1
       AND pi.accepted_at IS NULL
       AND pi.revoked_at IS NULL
       AND pi.expires_at > NOW()
     ORDER BY pi.created_at DESC`,
    [projectId]
  );

  return result.rows;
};
