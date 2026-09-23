import { type Application } from "express";
import cors from "cors";
import express from "express";
import healthRouter from "./routes/health-routes.js";
import errorMiddleware from "./middleware/error-middleware.js";
import notFoundMiddleware from "./middleware/not-found-middleware.js";
import { clerkMiddleware } from "@clerk/express";
import authRouter from "./routes/auth-routes.js";
import projectRouter from "./routes/project-routes.js";
import contentIdeaRouter from "./routes/content-idea-routes.js";
import aiWorkflowRouter from "./routes/ai-workflow-routes.js";
import projectSettingsRouter from "./routes/project-settings-routes.js";
import path from "node:path";

const app: Application = express();

const frontendOrigin =
  process.env.FRONTEND_URL ??
  "https://3000-cs-b0a3eeed-73e8-4ee2-8e5d-ac3dd27f7294.cs-asia-southeast1-bool.cloudshell.dev";
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
  }),
);

// app.use(cors());
app.use(clerkMiddleware());

app.use(express.json());

app.use(
    "/generated-videos",
    express.static(
        path.resolve(process.cwd(), "generated-videos"),
    ),
);

app.use("/api/health", healthRouter);

app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/content-ideas", contentIdeaRouter);
app.use("/api/ai", aiWorkflowRouter);
app.use("/api/projects", projectSettingsRouter);
app.use(notFoundMiddleware);

app.use(errorMiddleware);

export default app;
