import { Router } from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import currentUserMiddleware from "../middleware/current-user-middleware.js";
import {
  getDashboardOverviewController,
  getPendingReviewsController,
} from "../controller/dashboard-controller.js";

const dashboardRouter: Router = Router();

dashboardRouter.use(authMiddleware, currentUserMiddleware);

dashboardRouter.get("/overview", getDashboardOverviewController);
dashboardRouter.get("/reviews", getPendingReviewsController);

export default dashboardRouter;
