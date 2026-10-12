import type { NextFunction, Request, Response } from "express";

type UserRole = "ADMIN" | "CREATOR" | "REVIEWER";

const authorize = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const currentUser = req.currentUser;

        if (!currentUser) {
            return res.status(401).json({
                status: "ERROR",
                message: "Unauthorized",
                data: null,
            });
        }

        if (!allowedRoles.includes(currentUser.role)) {
            return res.status(403).json({
                status: "ERROR",
                message: "Forbidden",
                data: null,
            });
        }

        next();
    };
};

export default authorize;