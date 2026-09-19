import { Request, Response } from "express";
import { createAnnotation,getAnnotations,updateAnnotation,deleteAnnotation,getAnnotationDetails } from "../services/annotationService";
import { getProjectMemberRole,hasProjectRole } from "../services/projectService";
import {
  getModelVersionDetails
} from "../services/modelVersionService";
import { AuthenticatedUser } from "../types/auth";
export const createAnnotationController = async (
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

    if (
      Number.isNaN(projectId) ||
      Number.isNaN(modelId) ||
      Number.isNaN(versionId)
    ) {
      return res.status(400).json({
        message: "Invalid project, model, or version ID"
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
    if (!hasProjectRole(userRole, ["owner", "editor", "reviewer"])) {
  return res.status(403).json({
    message: "You do not have permission to create annotations"
  });
}
    const versionDetails = await getModelVersionDetails(
  versionId
);

if (!versionDetails) {
  return res.status(404).json({
    message: "Model version not found"
  });
}

if (
  versionDetails.project_id !== projectId ||
  versionDetails.model_id !== modelId
) {
  return res.status(400).json({
    message: "Model version does not belong to this project and model"
  });
}

    const { x, y, z, comment } = req.body;

    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      typeof z !== "number" ||
      !comment
    ) {
      return res.status(400).json({
        message: "x, y, z and comment are required"
      });
    }

    const annotation = await createAnnotation(
      versionId,
      user.user_id,
      x,
      y,
      z,
      comment
    );

    return res.status(201).json({
      message: "Annotation created successfully",
      annotation
    });
  } catch (error) {
    console.error("Create annotation error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
export const getAnnotationsController = async (
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

    if (
      Number.isNaN(projectId) ||
      Number.isNaN(modelId) ||
      Number.isNaN(versionId)
    ) {
      return res.status(400).json({
        message: "Invalid project, model, or version ID"
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
    const versionDetails = await getModelVersionDetails(
  versionId
);

if (!versionDetails) {
  return res.status(404).json({
    message: "Model version not found"
  });
}

if (
  versionDetails.project_id !== projectId ||
  versionDetails.model_id !== modelId
) {
  return res.status(400).json({
    message: "Model version does not belong to this project and model"
  });
}

    const annotations = await getAnnotations(
      versionId
    );

    return res.status(200).json({
      annotations
    });
  } catch (error) {
    console.error("Get annotations error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
export const updateAnnotationController = async (
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
    if (!hasProjectRole(userRole, ["owner", "editor", "reviewer"])) {
  return res.status(403).json({
    message: "You do not have permission to update annotations"
  });
}
    const annotationDetails = await getAnnotationDetails(
  annotationId
);

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
    message: "Annotation does not belong to this project, model, and version"
  });
}
    const versionDetails = await getModelVersionDetails(
  versionId
);

if (!versionDetails) {
  return res.status(404).json({
    message: "Model version not found"
  });
}

if (
  versionDetails.project_id !== projectId ||
  versionDetails.model_id !== modelId
) {
  return res.status(400).json({
    message: "Model version does not belong to this project and model"
  });
}

    const { comment, status } = req.body;

    if (!comment || !status) {
      return res.status(400).json({
        message: "Comment and status are required"
      });
    }

    const allowedStatuses = [
      "open",
      "in_progress",
      "resolved"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid annotation status"
      });
    }

    const annotation = await updateAnnotation(
      annotationId,
      comment,
      status
    );

    if (!annotation) {
      return res.status(404).json({
        message: "Annotation not found"
      });
    }

    return res.status(200).json({
      message: "Annotation updated successfully",
      annotation
    });
  } catch (error) {
    console.error("Update annotation error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
export const deleteAnnotationController = async (
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
    if (!hasProjectRole(userRole, ["owner", "editor"])) {
  return res.status(403).json({
    message: "You do not have permission to delete annotations"
  });
}
    const versionDetails = await getModelVersionDetails(
  versionId
);

if (!versionDetails) {
  return res.status(404).json({
    message: "Model version not found"
  });
}

if (
  versionDetails.project_id !== projectId ||
  versionDetails.model_id !== modelId
) {
  return res.status(400).json({
    message: "Model version does not belong to this project and model"
  });
}

const annotationDetails = await getAnnotationDetails(
  annotationId
);

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
    message: "Annotation does not belong to this project, model, and version"
  });
}

    const annotation = await deleteAnnotation(
      annotationId
    );

    if (!annotation) {
      return res.status(404).json({
        message: "Annotation not found"
      });
    }

    return res.status(200).json({
      message: "Annotation deleted successfully",
      annotation
    });
  } catch (error) {
    console.error("Delete annotation error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
