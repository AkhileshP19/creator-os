import { Router } from "express";

import authMiddleware from "../middleware/auth-middleware.js";
import currentUserMiddleware from "../middleware/current-user-middleware.js";
import { getProjectsController, projectController } from "../controller/project-controller.js";

const projectRouter: Router = Router();

projectRouter.post(
    "/",
    authMiddleware,
    currentUserMiddleware,
    projectController
);

projectRouter.get(
    "/",
    authMiddleware,
    currentUserMiddleware,
    getProjectsController
);

export default projectRouter;