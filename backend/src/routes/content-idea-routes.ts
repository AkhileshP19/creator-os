import { Router } from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import currentUserMiddleware from "../middleware/current-user-middleware.js";
import { createContentIdeaController } from "../controller/content-idea-controller.js";

const contentIdeaRouter: Router = Router();

contentIdeaRouter.post(
  "/",
  authMiddleware,
  currentUserMiddleware,
  createContentIdeaController,
);

export default contentIdeaRouter;