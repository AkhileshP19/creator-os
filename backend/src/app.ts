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

const frontendOrigin = process.env.FRONTEND_URL ?? "https://fluffy-fiesta-7q5xpp46x9pfrrrr-3000.app.github.dev";
const allowedOrigins = new Set([frontendOrigin, "http://localhost:3000"]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(clerkMiddleware());

app.use(express.json());

app.use("/api/health", healthRouter);

app.use("/api/auth", authRouter);
app.use(notFoundMiddleware);

app.use(errorMiddleware)

export default app;