import { Router } from "express";

import {
    createProjectSettingsController,
    getProjectSettingsController,
    updateProjectSettingsController,
} from "../controller/project-settings-controller.js";

const projectSettingsRouter: Router = Router();

projectSettingsRouter.post(
    "/:projectId/settings",
    createProjectSettingsController,
);

projectSettingsRouter.get(
    "/:projectId/settings",
    getProjectSettingsController,
);

projectSettingsRouter.patch(
    "/:projectId/settings",
    updateProjectSettingsController,
);

export default projectSettingsRouter;