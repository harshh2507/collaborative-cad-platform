import { Request, Response } from "express";
import { createProject,getProjects,getProjectById,addProjectMember,getProjectMemberRole } from "../services/projectService";

export const createProjectController = async (
  req: Request,
  res: Response
) => {
  try {
    const { project_name, description } = req.body;

    if (!project_name) {
      return res.status(400).json({
        message: "Project name is required"
      });
    }

    const user = (req as any).user;

    if (!user || !user.user_id) {
      return res.status(401).json({
        message: "User authentication required"
      });
    }

    const project = await createProject(
      project_name,
      description || "",
      user.user_id
    );

    return res.status(201).json({
      message: "Project created successfully",
      project
    });
  } catch (error) {
    console.error("Create project error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

export const getProjectsController = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;

    if (!user || !user.user_id) {
      return res.status(401).json({
        message: "User authentication required"
      });
    }

    const projects = await getProjects(user.user_id);

    return res.status(200).json({
      projects
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
export const getProjectByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;

    if (!user || !user.user_id) {
      return res.status(401).json({
        message: "User authentication required"
      });
    }

    const projectId = Number(req.params.projectId);

    if (Number.isNaN(projectId)) {
      return res.status(400).json({
        message: "Invalid project ID"
      });
    }

    const project = await getProjectById(
      projectId,
      user.user_id
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not a member"
      });
    }

    return res.status(200).json({
      project
    });
  } catch (error) {
    console.error("Get project error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
export const addProjectMemberController = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;

    if (!user || !user.user_id) {
      return res.status(401).json({
        message: "User authentication required"
      });
    }

    const projectId = Number(req.params.projectId);
    const { user_id, role } = req.body;

    if (Number.isNaN(projectId)) {
      return res.status(400).json({
        message: "Invalid project ID"
      });
    }

    if (!user_id || !role) {
      return res.status(400).json({
        message: "User ID and role are required"
      });
    }

    const currentUserRole = await getProjectMemberRole(
  projectId,
  user.user_id
);

if (!currentUserRole) {
  return res.status(403).json({
    message: "You are not a member of this project"
  });
}

if (
  currentUserRole !== "owner" &&
  currentUserRole !== "editor"
) {
  return res.status(403).json({
    message: "You do not have permission to add members"
  });
}

    const member = await addProjectMember(
      projectId,
      user_id,
      role
    );

    return res.status(201).json({
      message: "Project member added successfully",
      member
    });
  } catch (error) {
    console.error("Add project member error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};