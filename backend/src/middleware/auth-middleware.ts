import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import currentUserMiddleware from "./current-user-middleware.js";

const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const auth = getAuth(req);

    if (!auth.userId) {
        return res.status(401).json({
            status: "ERROR",
            message: "Unauthorized",
            data: null,
        });
    }
    next();
};

export default authMiddleware;