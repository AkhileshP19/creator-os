import { Temporal } from "temporal-polyfill";
import { db } from "../prisma/db.js";
import { lockOwnedContent, workflowError } from "./video-review-service.js";

import { getB2SignedUrl } from "./b2-storage-service.js";

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
  regenerationApprovalId?: string;
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
const geminiVideoModel = process.env.GEMINI_VIDEO_MODEL;

if (!geminiModel) {
  throw new Error("GEMINI_MODEL is not configured");
}

const aiWorkflowService = {
  createWorkflow: async ({
    contentId,
    currentUserId,
    workflowType,
    provider = "GEMINI",
    model,
    regenerationApprovalId,
  }: CreateAIWorkflowInput) => {
    const resolvedModel =
      model ??
      (workflowType === "VIDEO_GENERATION" ? geminiVideoModel : geminiModel);

    if (!resolvedModel) {
      throw new Error(
        `AI model is not configured for workflow type ${workflowType}`,
      );
    }

    if (regenerationApprovalId && workflowType !== "VIDEO_GENERATION") {
      workflowError(
        "Regeneration approval can only be used for video generation",
        400,
      );
    }

    return db.transaction(async (tx) => {
      await lockOwnedContent(tx, contentId, currentUserId);
      if (workflowType === "VIDEO_GENERATION") {
        const active = await tx.orm.public.AIWorkflow.where({
          contentId,
          workflowType,
        })
          .where((w) => w.status.in(["QUEUED", "RUNNING"]))
          .first();
        if (active)
          workflowError(
            "Video generation is already running for this content",
            409,
          );
      }
      if (regenerationApprovalId) {
        const approval = await tx.orm.public.Approval.where({
          id: regenerationApprovalId,
          contentId,
        }).first();
        if (!approval) workflowError("Approval not found", 404);
        if (approval.decision !== "REJECTED")
          workflowError("Only rejected videos can be regenerated", 409);
        if (!approval.assetId) workflowError("Video asset not found", 404);
        const asset = await tx.orm.public.Asset.where({
          id: approval.assetId,
          assetType: "VIDEO",
          deletedAt: null,
        }).first();
        if (!asset?.storageUrl) workflowError("Video asset not found", 404);
        const source = await tx.orm.public.AIWorkflow.where({
          id: asset.workflowId,
          contentId,
          workflowType: "VIDEO_GENERATION",
          status: "COMPLETED",
        }).first();
        if (!source)
          workflowError("Source video generation is not complete", 409);
      }
      const workflow = await tx.orm.public.AIWorkflow.create({
        contentId,
        workflowType,
        status: "QUEUED",
        provider,
        model: resolvedModel,
        startedAt: null,
        completedAt: null,
        retryCount: 0,
        executionTime: null,
        currentStep: null,
        errorMessage: null,
      });
      if (regenerationApprovalId) {
        await tx.orm.public.Approval.where({
          id: regenerationApprovalId,
        }).update({
          decision: "REGENERATE",
          regenerationWorkflowId: workflow.id,
          updatedAt: Temporal.Now.instant(),
        });
        await tx.orm.public.WorkflowLog.create({
          workflowId: workflow.id,
          stepName: "REGENERATION_REQUESTED",
          response: {
            approvalId: regenerationApprovalId,
            requestedById: currentUserId,
          },
        });
      }
      return workflow;
    });
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
      deletedAt: null,
    }).first();

    if (!contentIdea) {
      const error = new Error(
        "AI workflow not found or you do not have access to it",
      );

      Object.assign(error, { statusCode: 404 });

      throw error;
    }

    const project = await db.orm.public.Project.where({
      id: contentIdea.projectId,
      ownerId: currentUserId,
      deletedAt: null,
    }).first();
    if (!project)
      workflowError("Workflow not found or you do not have access to it", 404);
    return workflow;
  },

  getWorkflowsByContentId: async (contentId: string, currentUserId: string) => {
    // Verify ownership before exposing workflows associated
    // with the ContentIdea.
    const contentIdea = await db.orm.public.ContentIdea.where({
      id: contentId,
      deletedAt: null,
    }).first();

    if (!contentIdea) {
      const error = new Error(
        "Content idea not found or you do not have access to it",
      );

      Object.assign(error, { statusCode: 404 });

      throw error;
    }

    const project = await db.orm.public.Project.where({
      id: contentIdea.projectId,
      ownerId: currentUserId,
      deletedAt: null,
    }).first();
    if (!project) workflowError("Project not found", 404);
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

  getGeneratedVideo: async (workflowId: string, currentUserId: string) => {
    const workflow = await aiWorkflowService.getWorkflowById(
      workflowId,
      currentUserId,
    );

    if (workflow.workflowType !== "VIDEO_GENERATION") {
      const error = new Error("Workflow is not a video generation workflow");

      Object.assign(error, { statusCode: 400 });

      throw error;
    }

    if (workflow.status !== "COMPLETED") {
      const error = new Error("Video generation has not been completed");

      Object.assign(error, { statusCode: 400 });

      throw error;
    }

    const asset = await db.orm.public.Asset.where({
      workflowId,
      assetType: "VIDEO",
      deletedAt: null,
    })
      .orderBy((a) => a.createdAt.desc())
      .first();

    if (!asset || !asset.storageUrl) {
      const error = new Error("Generated video asset not found");

      Object.assign(error, { statusCode: 404 });

      throw error;
    }

    const videoUrl = await getB2SignedUrl(asset.storageUrl);
    if (!/^https?:\/\//.test(videoUrl))
      workflowError("Video playback is temporarily unavailable", 503);

    return {
      workflowId: workflow.id,
      assetId: asset.id,

      videoUrl,
    };
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
