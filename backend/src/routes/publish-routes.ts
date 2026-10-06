import { Router } from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import currentUserMiddleware from "../middleware/current-user-middleware.js";
import {
  createPublishJob,
  listPublishJobs,
  getPublishJob,
  retryPublishJob,
} from "../controller/publish-controller.js";
const router = Router();
router.use(authMiddleware, currentUserMiddleware);
router.post("/", createPublishJob);
router.get("/", listPublishJobs);
router.get("/:publishJobId", getPublishJob);
router.post("/:publishJobId/retry", retryPublishJob);
export default router;
