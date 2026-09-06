import { type Application } from "express";
import cors from "cors";
import express from "express";
import healthRouter from "./routes/health-routes.js";
import errorMiddleware from "./middleware/error-middleware.js";
import notFoundMiddleware from "./middleware/not-found-middleware.js"
import { clerkMiddleware } from "@clerk/express";
import authMiddleware from "./middleware/auth-middleware.js";
import authRouter from "./routes/auth-routes.js";

const app: Application = express();

app.use(cors());
app.use(clerkMiddleware());

app.use(express.json());

app.use("/api/health", healthRouter);

app.use("/api/auth", authRouter);
app.use(notFoundMiddleware);

app.use(errorMiddleware)

export default app;