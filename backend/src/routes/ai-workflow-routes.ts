import { Router } from "express";
import {
  createScriptWorkflowController,
  createVideoWorkflowController,
  getGeneratedScriptController,
  getWorkflowByIdController,
} from "../controller/ai-workflow-controller.js";
import authMiddleware from "../middleware/auth-middleware.js";
import currentUserMiddleware from "../middleware/current-user-middleware.js";

const aiWorkflowRouter: Router = Router();

aiWorkflowRouter.post(
  "/workflows",
  authMiddleware,
  currentUserMiddleware,
  createScriptWorkflowController,
);

aiWorkflowRouter.post(
    "/video-workflows",
    authMiddleware,
    currentUserMiddleware,
    createVideoWorkflowController,
);

aiWorkflowRouter.get(
  "/workflows/:workflowId/script",
  authMiddleware,
  currentUserMiddleware,
  getGeneratedScriptController,
);

aiWorkflowRouter.get(
  "/workflows/:workflowId",
  authMiddleware,
  currentUserMiddleware,
  getWorkflowByIdController,
);

export default aiWorkflowRouter;
