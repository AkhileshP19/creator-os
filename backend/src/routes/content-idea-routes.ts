import { Router } from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import currentUserMiddleware from "../middleware/current-user-middleware.js";
import {
  createContentIdeaController,
  deleteContentIdeaController,
  getContentIdeaByIdController,
  getContentIdeasController,
  updateContentIdeaController,
} from "../controller/content-idea-controller.js";

const contentIdeaRouter: Router = Router();

contentIdeaRouter.post(
  "/",
  authMiddleware,
  currentUserMiddleware,
  createContentIdeaController,
);

contentIdeaRouter.get(
  "/",
  authMiddleware,
  currentUserMiddleware,
  getContentIdeasController,
);

contentIdeaRouter.post(
  "/delete/:contentId",
  authMiddleware,
  currentUserMiddleware,
  deleteContentIdeaController,
);

contentIdeaRouter.patch(
  "/:contentId",
  authMiddleware,
  currentUserMiddleware,
  updateContentIdeaController,
);

contentIdeaRouter.post(
  "/delete/:contentId",
  authMiddleware,
  currentUserMiddleware,
  deleteContentIdeaController,
);

contentIdeaRouter.get(
  "/:projectId",
  authMiddleware,
  currentUserMiddleware,
  getContentIdeaByIdController,
);

export default contentIdeaRouter;
