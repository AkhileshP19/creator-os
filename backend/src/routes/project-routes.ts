import { Router } from "express";

import authMiddleware from "../middleware/auth-middleware.js";
import currentUserMiddleware from "../middleware/current-user-middleware.js";
import {
  deleteProjectByIdController,
  getProjectByIdController,
  getProjectsController,
  projectController,
  updateProjectByIdController,
} from "../controller/project-controller.js";

const projectRouter: Router = Router();

projectRouter.post(
  "/",
  authMiddleware,
  currentUserMiddleware,
  projectController,
);

projectRouter.get(
  "/",
  authMiddleware,
  currentUserMiddleware,
  getProjectsController,
);

projectRouter.post(
  "/delete/:projectId",
  authMiddleware,
  currentUserMiddleware,
  deleteProjectByIdController,
);

projectRouter.patch(
  "/:projectId",
  authMiddleware,
  currentUserMiddleware,
  updateProjectByIdController,
);

projectRouter.get(
  "/:projectId",
  authMiddleware,
  currentUserMiddleware,
  getProjectByIdController  ,
);

export default projectRouter;
