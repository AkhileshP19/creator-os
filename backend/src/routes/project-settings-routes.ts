import { Router } from "express";

import {
  createProjectSettingsController,
  getProjectSettingsController,
  updateProjectSettingsController,
} from "../controller/project-settings-controller.js";
import authMiddleware from "../middleware/auth-middleware.js";
import currentUserMiddleware from "../middleware/current-user-middleware.js";

const projectSettingsRouter: Router = Router();

projectSettingsRouter.post(
  "/:projectId/settings",
  authMiddleware,
  currentUserMiddleware,
  createProjectSettingsController,
);

projectSettingsRouter.get(
  "/:projectId/settings",
  authMiddleware,
  currentUserMiddleware,
  getProjectSettingsController,
);

projectSettingsRouter.patch(
  "/:projectId/settings",
  authMiddleware,
  currentUserMiddleware,
  updateProjectSettingsController,
);

export default projectSettingsRouter;
