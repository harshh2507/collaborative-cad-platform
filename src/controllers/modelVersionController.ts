import { Request, Response } from "express";
import { createModelVersion, getModelVersions } from "../services/modelVersionService";
import { getProjectMemberRole } from "../services/projectService";

export const createModelVersionController = async (
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
    const modelId = Number(req.params.modelId);

    if (Number.isNaN(projectId) || Number.isNaN(modelId)) {
      return res.status(400).json({
        message: "Invalid project ID or model ID"
      });
    }

    // Check whether the user belongs to the project
    const userRole = await getProjectMemberRole(
      projectId,
      user.user_id
    );

    if (!userRole) {
      return res.status(403).json({
        message: "You are not a member of this project"
      });
    }

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "CAD file is required"
      });
    }

    const version = await createModelVersion(
      modelId,
      file.path,
      user.user_id
    );

    return res.status(201).json({
      message: "CAD model version created successfully",
      version
    });
  } catch (error) {
    console.error("Create model version error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

export const getModelVersionsController = async (
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
    const modelId = Number(req.params.modelId);

    if (Number.isNaN(projectId) || Number.isNaN(modelId)) {
      return res.status(400).json({
        message: "Invalid project ID or model ID"
      });
    }

    // Check whether the user belongs to the project
    const userRole = await getProjectMemberRole(
      projectId,
      user.user_id
    );

    if (!userRole) {
      return res.status(403).json({
        message: "You are not a member of this project"
      });
    }

    const versions = await getModelVersions(modelId);

    return res.status(200).json({
      versions
    });
  } catch (error) {
    console.error("Get model versions error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};