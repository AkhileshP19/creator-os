import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { db } from "../prisma/db.js";
import authorize from "./authorization-middleware.js";

// Find the existing CreatorOS user and attach it to the request.
const currentUserMiddleware = async(
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const auth = getAuth(req);
    const clerkUserId = auth.userId;
    const dbUser = await db.orm.public.User
        .where({ clerkUserId })
        .first();
    req.currentUser = dbUser;
    next();
};

export default currentUserMiddleware;