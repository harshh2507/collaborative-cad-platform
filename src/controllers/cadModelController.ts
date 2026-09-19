import { Request, Response } from "express";
import {
  createCadModel,
  getCadModels
} from "../services/cadModelService";
import {
  getProjectMemberRole,
  hasProjectRole
} from "../services/projectService";
import { AuthenticatedUser } from "../types/auth";
export const createCadModelController = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as Request & { user: AuthenticatedUser }).user;

    if (!user || !user.user_id) {
      return res.status(401).json({
        message: "User authentication required"
      });
    }

    const projectId = Number(req.params.projectId);
    const file = req.file;

if (!file) {
  return res.status(400).json({
    message: "CAD file is required"
  });
}
    if (Number.isNaN(projectId)) {
      return res.status(400).json({
        message: "Invalid project ID"
      });
    }
    const userRole = await getProjectMemberRole(
  projectId,
  user.user_id
);

if (!userRole) {
  return res.status(403).json({
    message: "You are not a member of this project"
  });
}
if (!hasProjectRole(userRole, ["owner", "editor"])) {
  return res.status(403).json({
    message: "You do not have permission to upload CAD models"
  });
}

    const model = await createCadModel(
  projectId,
  file.originalname,
  file.path,
  user.user_id
);

    return res.status(201).json({
      message: "CAD model created successfully",
      model
    });
  } catch (error) {
    console.error("Create CAD model error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
export const getCadModelsController = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as Request & { user: AuthenticatedUser }).user;
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

    const userRole = await getProjectMemberRole(
      projectId,
      user.user_id
    );

    if (!userRole) {
      return res.status(403).json({
        message: "You are not a member of this project"
      });
    }

    const models = await getCadModels(projectId);

    return res.status(200).json({
      models
    });
  } catch (error) {
    console.error("Get CAD models error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};