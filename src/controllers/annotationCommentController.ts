import { Request, Response } from "express";
import { createAnnotationComment,getAnnotationComments } from "../services/annotationCommentService";
import {
  getAnnotationDetails
} from "../services/annotationService";
import { getProjectMemberRole,hasProjectRole } from "../services/projectService";
import { AuthenticatedUser } from "../types/auth";
export const createAnnotationCommentController = async (
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
    const modelId = Number(req.params.modelId);
    const versionId = Number(req.params.versionId);
    const annotationId = Number(req.params.annotationId);

    if (
      Number.isNaN(projectId) ||
      Number.isNaN(modelId) ||
      Number.isNaN(versionId) ||
      Number.isNaN(annotationId)
    ) {
      return res.status(400).json({
        message: "Invalid project, model, version, or annotation ID"
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
    const annotationDetails =
  await getAnnotationDetails(annotationId);

if (!annotationDetails) {
  return res.status(404).json({
    message: "Annotation not found"
  });
}

if (
  annotationDetails.project_id !== projectId ||
  annotationDetails.model_id !== modelId ||
  annotationDetails.version_id !== versionId
) {
  return res.status(400).json({
    message:
      "Annotation does not belong to the requested resource"
  });
}
    if (!hasProjectRole(userRole, ["owner", "editor", "reviewer"])) {
  return res.status(403).json({
    message: "You do not have permission to add comments"
  });
}

    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        message: "Comment is required"
      });
    }

    const annotationComment = await createAnnotationComment(
      annotationId,
      user.user_id,
      comment
    );

    return res.status(201).json({
      message: "Annotation comment created successfully",
      comment: annotationComment
    });
  } catch (error) {
    console.error("Create annotation comment error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
export const getAnnotationCommentsController = async (
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
    const modelId = Number(req.params.modelId);
    const versionId = Number(req.params.versionId);
    const annotationId = Number(req.params.annotationId);

    if (
      Number.isNaN(projectId) ||
      Number.isNaN(modelId) ||
      Number.isNaN(versionId) ||
      Number.isNaN(annotationId)
    ) {
      return res.status(400).json({
        message: "Invalid project, model, version, or annotation ID"
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

    const comments = await getAnnotationComments(
      annotationId
    );

    return res.status(200).json({
      comments
    });
  } catch (error) {
    console.error("Get annotation comments error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};