import "dotenv/config";

import express from "express";

import { generateVideoWithFlow } from "./flow-service.js";
import type { FlowVideoGenerationInput } from "./types.js";

const app = express();

const port = Number(process.env.PORT ?? 5100);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "SUCCESS",
    message: "Browser worker is running",
  });
});

app.post("/generate-video", async (req, res) => {
  try {
    const input = req.body as FlowVideoGenerationInput;

    if (!input.workflowId || !input.prompt) {
      res.status(400).json({
        status: "ERROR",
        message: "workflowId and prompt are required",
      });

      return;
    }

    const result = await generateVideoWithFlow(input);

    res.status(200).json({
      status: "SUCCESS",
      message: "Video generated successfully",
      data: {
        responseData: result,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown browser worker error";

    console.error("Flow generation failed:", error);

    res.status(500).json({
      status: "ERROR",
      message: errorMessage,
    });
  }
});

app.listen(port, () => {
  console.log(`Browser worker running on http://localhost:${port}`);
});
