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
import approvalRouter from "./routes/approval-routes.js";
import integrationRouter from "./routes/integration-routes.js";
import publishRouter from "./routes/publish-routes.js";
import dashboardRouter from "./routes/dashboard-routes.js";

const app: Application = express();

const localFrontendOrigin = "http://localhost:3000";

const configuredFrontendOrigin =
  process.env.FRONTEND_URL?.trim();

if (
  process.env.NODE_ENV === "production" &&
  !configuredFrontendOrigin
) {
  throw new Error(
    "FRONTEND_URL must be configured in production.",
  );
}

const allowedOrigins = new Set<string>();

if (configuredFrontendOrigin) {
  allowedOrigins.add(configuredFrontendOrigin);
}

if (process.env.NODE_ENV !== "production") {
  allowedOrigins.add(localFrontendOrigin);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.has(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          `Origin ${origin} is not allowed by CORS`,
        ),
      );
    },
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  }),
);

app.use(clerkMiddleware());

app.use(express.json());

app.use(
  "/generated-videos",
  express.static(
    path.resolve(
      process.cwd(),
      "generated-videos",
    ),
  ),
);

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use(
  "/api/content-ideas",
  contentIdeaRouter,
);
app.use("/api/ai", aiWorkflowRouter);
app.use(
  "/api/projects",
  projectSettingsRouter,
);
app.use("/api/approvals", approvalRouter);
app.use(
  "/api/integrations",
  integrationRouter,
);
app.use(
  "/api/publish-jobs",
  publishRouter,
);
app.use("/api/dashboard", dashboardRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;