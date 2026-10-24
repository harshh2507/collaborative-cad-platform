
import { Request, Response } from "express";
import {
  acceptInvitation,
  createInvitation,
  getValidInvitation,
  getProjectInvitations,
  InvitationRole
} from "../services/invitationService";
import { getProjectMemberRole } from "../services/projectService";
import { AuthenticatedUser } from "../types/auth";
const allowedRoles: InvitationRole[] = [
  "editor",
  "reviewer",
  "viewer"
];

const getAuthenticatedUser = (req: Request) =>
  (req as Request & { user: AuthenticatedUser }).user;

// POST /api/projects/:projectId/invitations
export const createInvitationController = async (
  req: Request,
  res: Response
) => {
  try {
    const user = getAuthenticatedUser(req);

    if (!user?.user_id) {
      return res.status(401).json({
        message: "User authentication required"
      });
    }

    const projectId = Number(req.params.projectId);
    const role = String(req.body.role || "").toLowerCase();

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        message: "Invalid project ID"
      });
    }

    if (!allowedRoles.includes(role as InvitationRole)) {
      return res.status(400).json({
        message: "Role must be editor, reviewer, or viewer"
      });
    }

    const currentRole = await getProjectMemberRole(
      projectId,
      user.user_id
    );

    // Only the project owner can generate invitations.
    if (currentRole !== "owner") {
      return res.status(403).json({
        message: "Only the project owner can generate invitations"
      });
    }

    const { invitation, token } = await createInvitation(
      projectId,
      user.user_id,
      role as InvitationRole
    );

    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/+$/, "");

    const inviteLink =
      `${frontendUrl}/invite?token=${encodeURIComponent(token)}`;

    return res.status(201).json({
      message: "Invitation created successfully",
      invitation,
      inviteLink
    });
  } catch (error) {
    console.error("Create invitation error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// GET /api/projects/invitations/:token
// Returns invitation details without accepting it.
export const getInvitationController = async (
  req: Request,
  res: Response
) => {
  try {
    const token = String(req.params.token ?? "");

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        message: "Invalid invitation token"
      });
    }

    const invitation = await getValidInvitation(token);

    if (!invitation) {
      return res.status(404).json({
        message: "Invitation is invalid, expired, revoked, or already used"
      });
    }

    return res.status(200).json({
      invitation: {
        project_id: invitation.project_id,
        role: invitation.role,
        expires_at: invitation.expires_at
      }
    });
  } catch (error) {
    console.error("Get invitation error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// POST /api/projects/invitations/:token/accept
export const acceptInvitationController = async (
  req: Request,
  res: Response
) => {
  try {
    const user = getAuthenticatedUser(req);

    if (!user?.user_id) {
      return res.status(401).json({
        message: "Please log in to accept this invitation"
      });
    }

    const token = String(req.params.token ?? "");

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        message: "Invalid invitation token"
      });
    }

    const result = await acceptInvitation(token, user.user_id);

    if (result.status === "invalid") {
      return res.status(404).json({
        message: "Invitation is invalid, expired, revoked, or already used"
      });
    }

    if (result.status === "already_member") {
      return res.status(409).json({
        message: "You are already a member of this project"
      });
    }

    return res.status(200).json({
      message: "Invitation accepted successfully",
      project_id: result.projectId,
      role: result.role
    });
  } catch (error) {
    console.error("Accept invitation error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

export const getProjectInvitationsController = async (
  req: Request,
  res: Response
) => {
  try {
    const user = getAuthenticatedUser(req);

    if (!user?.user_id) {
      return res.status(401).json({
        message: "User authentication required"
      });
    }

    const projectId = Number(req.params.projectId);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        message: "Invalid project ID"
      });
    }

    const currentRole = await getProjectMemberRole(
      projectId,
      user.user_id
    );

    if (!currentRole) {
      return res.status(403).json({
        message: "You are not a member of this project"
      });
    }

    const invitations = await getProjectInvitations(projectId);

    return res.status(200).json({ invitations });
  } catch (error) {
    console.error("Get project invitations error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
