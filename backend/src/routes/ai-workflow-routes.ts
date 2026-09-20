import { Router } from "express";
import {
    createScriptWorkflowController,
    getWorkflowByIdController,
} from "../controller/ai-workflow-controller.js";

const aiWorkflowRouter: Router = Router();

aiWorkflowRouter.post("/workflows", createScriptWorkflowController);

aiWorkflowRouter.get("/workflows/:workflowId", getWorkflowByIdController);

export default aiWorkflowRouter;