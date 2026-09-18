import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import upload from "../config/upload";
import versionUpload from "../config/versionUpload";

import {
  createProjectController,
  getProjectsController,
  getProjectByIdController,
  addProjectMemberController
} from "../controllers/projectController";

import {
  createCadModelController,
  getCadModelsController
} from "../controllers/cadModelController";
import {
  createModelVersionController,
  getModelVersionsController
} from "../controllers/modelVersionController";

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

router.post(
  "/:projectId/members",
  authenticateToken,
  addProjectMemberController
);

router.post(
  "/:projectId/models",
  authenticateToken,
  upload.single("file"),
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
router.get(
  "/:projectId/models",
  authenticateToken,
  getCadModelsController
);
router.get(
  "/:projectId",
  authenticateToken,
  getProjectByIdController
);

export default router;