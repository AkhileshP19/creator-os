import "dotenv/config";

import express from "express";

import {
  generateVideoWithFlow,
} from "./flow-service.js";

import type {
  FlowVideoGenerationInput,
} from "./types.js";

const app = express();

const port =
  Number(
    process.env.PORT ?? 5100,
  );

let generationInProgress = false;

app.use(
  express.json({
    limit: "1mb",
  }),
);

function isFlowVideoGenerationInput(
  value: unknown,
): value is FlowVideoGenerationInput {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const input =
    value as Record<
      string,
      unknown
    >;

  return (
    typeof input.workflowId ===
    "string" &&
    input.workflowId.trim().length >
    0 &&
    typeof input.prompt ===
    "string" &&
    input.prompt.trim().length > 0 &&
    typeof input.durationSeconds ===
    "number" &&
    Number.isFinite(
      input.durationSeconds,
    ) &&
    input.durationSeconds > 0 &&
    input.aspectRatio === "9:16" &&
    typeof input.userId === "string" &&
    input.userId.trim().length > 0 &&
    typeof input.projectId === "string" &&
    input.projectId.trim().length > 0
  );
}

app.get(
  "/health",
  (_req, res) => {
    res.status(200).json({
      status: "SUCCESS",
      message:
        "Browser worker is running",
      data: {
        responseData: {
          generationInProgress,
        },
      },
    });
  },
);

app.post(
  "/generate-video",
  async (req, res) => {
    if (
      !isFlowVideoGenerationInput(
        req.body,
      )
    ) {
      res.status(400).json({
        status: "ERROR",
        message: "Invalid video generation request. workflowId, userId, projectId, prompt, durationSeconds, and aspectRatio 9:16 are required."
      });

      return;
    }

    if (generationInProgress) {
      res.status(409).json({
        status: "ERROR",
        message:
          "The browser worker is already processing another video generation job.",
      });

      return;
    }

    generationInProgress = true;

    try {
      const result =
        await generateVideoWithFlow(
          req.body,
        );

      res.status(200).json({
        status: "SUCCESS",
        message:
          "Video generated successfully",
        data: {
          responseData:
            result,
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown browser worker error";

      console.error(
        "Flow generation failed:",
        error,
      );

      res.status(500).json({
        status: "ERROR",
        message: errorMessage,
      });
    } finally {
      generationInProgress =
        false;
    }
  },
);

app.listen(
  port,
  () => {
    console.log(
      `Browser worker running on http://localhost:${port}`,
    );
  },
);