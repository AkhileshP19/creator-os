import { db } from "../prisma/db.js";
import { Temporal } from "temporal-polyfill";


interface CreateUserInput {
    clerkUserId: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
}

const getOrCreateUser = async ({
    clerkUserId,
    fullName,
    email,
    avatarUrl,
}: CreateUserInput) => {
    const existingUser = await db.orm.public.User
        .where({ clerkUserId })
        .first();

    if (existingUser) {
        return existingUser;
    }

    const newUser = await db.orm.public.User.create({
        clerkUserId,
        fullName,
        email,
        avatarUrl,
        role: "CREATOR",
        isVerified: false,
        lastLogin: Temporal.Now.instant(),
    });

    return newUser;
};

export default getOrCreateUser;