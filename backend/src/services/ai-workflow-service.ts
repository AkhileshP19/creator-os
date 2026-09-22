import { Temporal } from "temporal-polyfill";
import { db } from "../prisma/db.js";

export type WorkflowType =
  | "SCRIPT_GENERATION"
  | "VIDEO_GENERATION"
  | "AUDIO_GENERATION"
  | "IMAGE_GENERATION";

export type WorkflowStatus =
  "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export type AIProvider = "GEMINI" | "OPENAI" | "CLAUDE" | "CUSTOM";

interface CreateAIWorkflowInput {
  contentId: string;
  currentUserId: string;
  workflowType: WorkflowType;
  provider?: AIProvider;
  model?: string;
}

interface UpdateWorkflowStateInput {
  status?: WorkflowStatus;
  startedAt?: Temporal.Instant | null;
  completedAt?: Temporal.Instant | null;
  retryCount?: number;
  executionTime?: number | null;
  currentStep?: string | null;
  errorMessage?: string | null;
}

const geminiModel = process.env.GEMINI_MODEL;

if (!geminiModel) {
  throw new Error("GEMINI_MODEL is not configured");
}

const aiWorkflowService = {
  createWorkflow: async ({
    contentId,
    currentUserId,
    workflowType,
    provider = "GEMINI",
    model = geminiModel,
  }: CreateAIWorkflowInput) => {
    // Verify that the ContentIdea exists, is active,
    // and belongs to the currently authenticated user.
    const contentIdea = await db.orm.public.ContentIdea.where({
      id: contentId,
      createdById: currentUserId,
      deletedAt: null,
    }).first();

    if (!contentIdea) {
      const error = new Error(
        "Content idea not found or you do not have access to it",
      );

      Object.assign(error, { statusCode: 404 });

      throw error;
    }

    const workflow = await db.orm.public.AIWorkflow.create({
      contentId,
      workflowType,
      status: "QUEUED",
      provider,
      model,
      startedAt: null,
      completedAt: null,
      retryCount: 0,
      executionTime: null,
      currentStep: null,
      errorMessage: null,
    });

    return workflow;
  },

  getWorkflowById: async (workflowId: string, currentUserId: string) => {
    const workflow = await db.orm.public.AIWorkflow.where({
      id: workflowId,
    }).first();

    if (!workflow) {
      const error = new Error("AI workflow not found");

      Object.assign(error, { statusCode: 404 });

      throw error;
    }

    // AIWorkflow does not directly contain a user/owner field,
    // so ownership is resolved through its ContentIdea.
    const contentIdea = await db.orm.public.ContentIdea.where({
      id: workflow.contentId,
      createdById: currentUserId,
      deletedAt: null,
    }).first();

    if (!contentIdea) {
      const error = new Error(
        "AI workflow not found or you do not have access to it",
      );

      Object.assign(error, { statusCode: 404 });

      throw error;
    }

    return workflow;
  },

  getWorkflowsByContentId: async (contentId: string, currentUserId: string) => {
    // Verify ownership before exposing workflows associated
    // with the ContentIdea.
    const contentIdea = await db.orm.public.ContentIdea.where({
      id: contentId,
      createdById: currentUserId,
      deletedAt: null,
    }).first();

    if (!contentIdea) {
      const error = new Error(
        "Content idea not found or you do not have access to it",
      );

      Object.assign(error, { statusCode: 404 });

      throw error;
    }

    const workflows = await db.orm.public.AIWorkflow.where({
      contentId,
    })
      .orderBy((workflow) => workflow.createdAt.desc())
      .all();

    return workflows;
  },

  getGeneratedScript: async (workflowId: string, currentUserId: string) => {
    const workflow = await aiWorkflowService.getWorkflowById(
      workflowId,
      currentUserId,
    );

    if (workflow.workflowType !== "SCRIPT_GENERATION") {
      const error = new Error("Workflow is not a script generation workflow");

      Object.assign(error, { statusCode: 400 });

      throw error;
    }

    if (workflow.status !== "COMPLETED") {
      const error = new Error("Script generation has not been completed");

      Object.assign(error, { statusCode: 400 });

      throw error;
    }

    const aiRequest = await db.orm.public.AIRequest.where({
      workflowId,
    })
      .orderBy((request) => request.createdAt.desc())
      .first();

    if (!aiRequest?.output) {
      const error = new Error("Generated script not found");

      Object.assign(error, { statusCode: 404 });

      throw error;
    }

    return aiRequest.output;
  },

  updateWorkflowState: async (
    workflowId: string,
    updateData: UpdateWorkflowStateInput,
  ) => {
    const workflow = await db.orm.public.AIWorkflow.where({
      id: workflowId,
    }).first();

    if (!workflow) {
      const error = new Error("AI workflow not found");

      Object.assign(error, { statusCode: 404 });

      throw error;
    }

    const updatedWorkflow = await db.orm.public.AIWorkflow.where({
      id: workflowId,
    }).update(updateData);

    return updatedWorkflow;
  },
};

export default aiWorkflowService;
