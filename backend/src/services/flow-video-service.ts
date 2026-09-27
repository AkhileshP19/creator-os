import type {
  GeneratedVideoResult,
  VideoGenerationInput,
} from "../types/ai-workflow-types.js";
import { buildVideoPrompt } from "./video-prompt-service.js";
import {
  Agent,
  fetch,
} from "undici";

interface GenerateFlowVideoInput {
  workflowId: string;
  userId: string;
  projectId: string;
  videoInput: VideoGenerationInput;
}

interface FlowWorkerVideoResult {
  workflowId: string;
  fileName: string;
  localFilePath: string;
  objectKey: string;
}

interface FlowWorkerSuccessResponse {
  status: "SUCCESS";
  message: string;
  data: {
    responseData: FlowWorkerVideoResult;
  };
}

interface FlowWorkerErrorResponse {
  status: "ERROR";
  message: string;
}

const flowWorkerDispatcher =
  new Agent({
    headersTimeout:
      15 * 60 * 1000,
    bodyTimeout:
      15 * 60 * 1000,
  });

const browserWorkerUrl =
  process.env.BROWSER_WORKER_URL ??
  "http://localhost:5100";

function isFlowWorkerSuccessResponse(
  value: unknown,
): value is FlowWorkerSuccessResponse {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const response =
    value as Record<string, unknown>;

  if (
    response.status !== "SUCCESS" ||
    typeof response.data !== "object" ||
    response.data === null
  ) {
    return false;
  }

  const data =
    response.data as Record<
      string,
      unknown
    >;

  if (
    typeof data.responseData !==
    "object" ||
    data.responseData === null
  ) {
    return false;
  }

  const result =
    data.responseData as Record<
      string,
      unknown
    >;

  return (
    typeof result.workflowId === "string" &&
    typeof result.fileName === "string" &&
    typeof result.localFilePath === "string" &&
    typeof result.objectKey === "string"
  );
}

function getWorkerErrorMessage(
  value: unknown,
): string | null {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const response =
    value as Partial<
      FlowWorkerErrorResponse
    >;

  return typeof response.message ===
    "string"
    ? response.message
    : null;
}

export async function generateVideo(
  input: GenerateFlowVideoInput,
): Promise<GeneratedVideoResult> {
  const {
    workflowId,
    userId,
    projectId,
    videoInput,
  } = input;

  const prompt =
    buildVideoPrompt(videoInput);

  const response = await fetch(
    `${browserWorkerUrl}/generate-video`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        workflowId,
        userId,
        projectId,
        prompt,
        durationSeconds:
          videoInput.durationSeconds,
        aspectRatio:
          videoInput.aspectRatio,
      }),
      dispatcher:
        flowWorkerDispatcher,
    },
  );

  const responseBody: unknown =
    await response.json();

  if (!response.ok) {
    const workerMessage =
      getWorkerErrorMessage(
        responseBody,
      );

    throw new Error(
      workerMessage ??
      `Flow browser worker failed with HTTP ${response.status}`,
    );
  }

  if (
    !isFlowWorkerSuccessResponse(
      responseBody,
    )
  ) {
    throw new Error(
      "Flow browser worker returned an invalid response.",
    );
  }

  const result =
    responseBody.data.responseData;

  if (
    result.workflowId !== workflowId
  ) {
    throw new Error(
      "Flow browser worker returned a mismatched workflow ID.",
    );
  }

  return {
    fileName:
      result.fileName,
    localFilePath:
      result.localFilePath,
    objectKey:
      result.objectKey,
  };
}