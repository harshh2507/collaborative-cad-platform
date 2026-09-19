import { Request, Response } from "express";

import {
  createTask,
  getAnnotationTasks,
  updateTask,
  deleteTask,
  getTaskDetails
} from "../services/taskService";

import {
  getProjectMemberRole,
  hasProjectRole,
  isUserProjectMember
} from "../services/projectService";
import {
  getAnnotationDetails
} from "../services/annotationService";
import { AuthenticatedUser } from "../types/auth";

export const createTaskController = async (
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

    if (
      !hasProjectRole(
        userRole,
        ["owner", "editor", "reviewer"]
      )
    ) {
      return res.status(403).json({
        message: "You do not have permission to create tasks"
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

    const {
      assigned_to,
      title,
      description,
      priority,
      due_date
    } = req.body;

    if (
      !assigned_to ||
      !title ||
      !priority
    ) {
      return res.status(400).json({
        message: "assigned_to, title and priority are required"
      });
    }

    const assignedUserId = Number(assigned_to);

    if (Number.isNaN(assignedUserId)) {
      return res.status(400).json({
        message: "Invalid assigned user ID"
      });
    }

    const assignedUserIsMember =
      await isUserProjectMember(
        projectId,
        assignedUserId
      );

    if (!assignedUserIsMember) {
      return res.status(400).json({
        message: "Assigned user is not a member of this project"
      });
    }

    const allowedPriorities = [
      "low",
      "medium",
      "high"
    ];

    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        message: "Invalid task priority"
      });
    }

    const task = await createTask(
      annotationId,
      assignedUserId,
      title,
      description || "",
      priority,
      due_date || null
    );

    return res.status(201).json({
      message: "Task created successfully",
      task
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


export const getAnnotationTasksController = async (
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
    const tasks = await getAnnotationTasks(
      annotationId
    );

    return res.status(200).json({
      tasks
    });
  } catch (error) {
    console.error("Get annotation tasks error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


export const updateTaskController = async (
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
    const taskId = Number(req.params.taskId);

    if (
      Number.isNaN(projectId) ||
      Number.isNaN(modelId) ||
      Number.isNaN(versionId) ||
      Number.isNaN(annotationId) ||
      Number.isNaN(taskId)
    ) {
      return res.status(400).json({
        message:
          "Invalid project, model, version, annotation, or task ID"
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

    if (
      !hasProjectRole(
        userRole,
        ["owner", "editor", "reviewer"]
      )
    ) {
      return res.status(403).json({
        message: "You do not have permission to update tasks"
      });
    }
    const taskDetails = await getTaskDetails(taskId);

if (!taskDetails) {
  return res.status(404).json({
    message: "Task not found"
  });
}

if (
  taskDetails.project_id !== projectId ||
  taskDetails.model_id !== modelId ||
  taskDetails.version_id !== versionId ||
  taskDetails.annotation_id !== annotationId
) {
  return res.status(400).json({
    message: "Task does not belong to the requested resource"
  });
}

    const {
      assigned_to,
      description,
      status,
      priority,
      due_date
    } = req.body;

    if (
      !assigned_to ||
      !status ||
      !priority
    ) {
      return res.status(400).json({
        message:
          "assigned_to, status and priority are required"
      });
    }

    const assignedUserId = Number(assigned_to);

    if (Number.isNaN(assignedUserId)) {
      return res.status(400).json({
        message: "Invalid assigned user ID"
      });
    }

    const assignedUserIsMember =
      await isUserProjectMember(
        projectId,
        assignedUserId
      );

    if (!assignedUserIsMember) {
      return res.status(400).json({
        message:
          "Assigned user is not a member of this project"
      });
    }

    const allowedStatuses = [
      "open",
      "in_progress",
      "completed"
    ];

    const allowedPriorities = [
      "low",
      "medium",
      "high"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid task status"
      });
    }

    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        message: "Invalid task priority"
      });
    }

    const task = await updateTask(
      taskId,
      assignedUserId,
      description || "",
      status,
      priority,
      due_date || null
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    return res.status(200).json({
      message: "Task updated successfully",
      task
    });
  } catch (error) {
    console.error("Update task error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


export const deleteTaskController = async (
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
    const taskId = Number(req.params.taskId);

    if (
      Number.isNaN(projectId) ||
      Number.isNaN(modelId) ||
      Number.isNaN(versionId) ||
      Number.isNaN(annotationId) ||
      Number.isNaN(taskId)
    ) {
      return res.status(400).json({
        message:
          "Invalid project, model, version, annotation, or task ID"
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

    if (
      !hasProjectRole(
        userRole,
        ["owner", "editor"]
      )
    ) {
      return res.status(403).json({
        message:
          "You do not have permission to delete tasks"
      });
    }
    const taskDetails = await getTaskDetails(taskId);

if (!taskDetails) {
  return res.status(404).json({
    message: "Task not found"
  });
}

if (
  taskDetails.project_id !== projectId ||
  taskDetails.model_id !== modelId ||
  taskDetails.version_id !== versionId ||
  taskDetails.annotation_id !== annotationId
) {
  return res.status(400).json({
    message: "Task does not belong to the requested resource"
  });
}
    const task = await deleteTask(
      taskId
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    return res.status(200).json({
      message: "Task deleted successfully",
      task
    });
  } catch (error) {
    console.error("Delete task error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
