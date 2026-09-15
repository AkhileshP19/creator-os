import { Router } from "express";

import authMiddleware from "../middleware/auth-middleware.js";
import userController from "../controller/user-controller.js";

const authRouter: Router = Router();

authRouter.get("/me", authMiddleware, userController);

export default authRouter;