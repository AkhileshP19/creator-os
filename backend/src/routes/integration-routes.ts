import { Router } from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import currentUserMiddleware from "../middleware/current-user-middleware.js";
import {
  connectYouTube,
  youtubeCallback,
  youtubeStatus,
  disconnectYouTube,
} from "../controller/integration-controller.js";
const router = Router();
router.get("/youtube/callback", youtubeCallback);
router.use(authMiddleware, currentUserMiddleware);
router.get("/youtube/connect", connectYouTube);
router.get("/youtube/status", youtubeStatus);
router.delete("/youtube", disconnectYouTube);
export default router;
