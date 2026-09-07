import type { User } from "../prisma/contract.js";

declare global {
    namespace Express {
        interface Request {
            currentUser: User;
        }
    }
}

export {};