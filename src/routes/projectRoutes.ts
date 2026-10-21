import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import upload from "../config/upload";
import versionUpload from "../config/versionUpload";
import { handleUploadError } from "../middleware/uploadMiddleware";

import {
  createProjectController,
  getProjectsController,
  getProjectByIdController,
  addProjectMemberController,
<<<<<<< HEAD
   deleteProjectController
=======
  addProjectCollaboratorController,
  getProjectCollaboratorsController,
>>>>>>> ec5588a (Updated backend with routes connection)
} from "../controllers/projectController";

import {
  createCadModelController,
  getCadModelsController
} from "../controllers/cadModelController";
import {
  createModelVersionController,
  getModelVersionsController
} from "../controllers/modelVersionController";
import {
  createAnnotationController,
  getAnnotationsController,
  updateAnnotationController,
  deleteAnnotationController
} from "../controllers/annotationController";
import {
  createAnnotationCommentController,
  getAnnotationCommentsController
} from "../controllers/annotationCommentController";
import {
  createTaskController,
  getAnnotationTasksController,
  updateTaskController,
  deleteTaskController
} from "../controllers/taskController";

const router = Router();

router.post(
  "/",
  authenticateToken,
  createProjectController
);

router.get(
  "/",
  authenticateToken,
  getProjectsController
);

// Collaborator routes for sharing access by email
router.post(
  "/:projectId/collaborators",
  authenticateToken,
  addProjectCollaboratorController
);

router.get(
  "/:projectId/collaborators",
  authenticateToken,
  getProjectCollaboratorsController
);

router.post(
  "/:projectId/members",
  authenticateToken,
  addProjectMemberController
);

router.post(
  "/:projectId/models",
  authenticateToken,
  upload.single("file"),
  handleUploadError,
  createCadModelController
);
router.post(
  "/:projectId/models/:modelId/versions",
  authenticateToken,
  versionUpload.single("file"),
  createModelVersionController
);
router.get(
  "/:projectId/models/:modelId/versions",
  authenticateToken,
  getModelVersionsController
);
router.post(
  "/:projectId/models/:modelId/versions/:versionId/annotations",
  authenticateToken,
  createAnnotationController
);
router.get(
  "/:projectId/models/:modelId/versions/:versionId/annotations",
  authenticateToken,
  getAnnotationsController
);
router.put(
  "/:projectId/models/:modelId/versions/:versionId/annotations/:annotationId",
  authenticateToken,
  updateAnnotationController
);
router.delete(
  "/:projectId/models/:modelId/versions/:versionId/annotations/:annotationId",
  authenticateToken,
  deleteAnnotationController
);
router.post(
  "/:projectId/models/:modelId/versions/:versionId/annotations/:annotationId/comments",
  authenticateToken,
  createAnnotationCommentController
);
router.get(
  "/:projectId/models/:modelId/versions/:versionId/annotations/:annotationId/comments",
  authenticateToken,
  getAnnotationCommentsController
);
router.post(
  "/:projectId/models/:modelId/versions/:versionId/annotations/:annotationId/tasks",
  authenticateToken,
  createTaskController
);
router.get(
  "/:projectId/models/:modelId/versions/:versionId/annotations/:annotationId/tasks",
  authenticateToken,
  getAnnotationTasksController
);
router.put(
  "/:projectId/models/:modelId/versions/:versionId/annotations/:annotationId/tasks/:taskId",
  authenticateToken,
  updateTaskController
);
router.delete(
  "/:projectId/models/:modelId/versions/:versionId/annotations/:annotationId/tasks/:taskId",
  authenticateToken,
  deleteTaskController
);
router.get(
  "/:projectId/models",
  authenticateToken,
  getCadModelsController
);
router.delete(
  "/:projectId",
  authenticateToken,
  deleteProjectController
);
router.get(
  "/:projectId",
  authenticateToken,
  getProjectByIdController
);

export default router;