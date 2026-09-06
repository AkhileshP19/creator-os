import { clerkClient, getAuth } from "@clerk/express";
import type { Request, Response } from "express";

import getOrCreateUser from "../services/user-service.js";

export const userController = async (
    req: Request,
    res: Response
) => {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({
                status: "ERROR",
                message: "Unauthorized",
                data: null,
            });
        }

        const clerkUser = await clerkClient.users.getUser(userId);

        const fullName = [
            clerkUser.firstName,
            clerkUser.lastName,
        ]
            .filter(Boolean)
            .join(" ");

        const email = clerkUser.emailAddresses[0]?.emailAddress;

        if (!email) {
            return res.status(400).json({
                status: "ERROR",
                message: "User email is not available",
                data: null,
            });
        }

        const user = await getOrCreateUser({
            clerkUserId: clerkUser.id,
            fullName: fullName || "Creator",
            email,
            avatarUrl: clerkUser.imageUrl,
        });

        return res.status(200).json({
            status: "SUCCESS",
            message: "User fetched successfully",
            data: {
                user,
            },
        });
    } catch (error) {
        console.error("Failed to get or create user:", error);

        return res.status(500).json({
            status: "ERROR",
            message: "Failed to fetch user",
            data: null,
        });
    }
};

export default userController;