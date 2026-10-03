import { Router } from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import currentUserMiddleware from "../middleware/current-user-middleware.js";
import {
  listApprovalsController,
  getApprovalController,
  approveController,
  rejectController,
  regenerateController,
} from "../controller/approval-controller.js";

const approvalRouter: Router = Router();
approvalRouter.use(authMiddleware, currentUserMiddleware);
approvalRouter.get("/", listApprovalsController);
approvalRouter.get("/:approvalId", getApprovalController);
approvalRouter.post("/:approvalId/approve", approveController);
approvalRouter.post("/:approvalId/reject", rejectController);
approvalRouter.post("/:approvalId/regenerate", regenerateController);
export default approvalRouter;
