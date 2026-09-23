import type { RequestHandler } from "express";

import aiWorkflowService from "../services/ai-workflow-service.js";
import workflowExecutionService from "../services/workflow-execution-service.js";

export const createScriptWorkflowController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { contentId } = req.body;
    const currentUserId = req.currentUser.id;

    if (!contentId || typeof contentId !== "string") {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid content ID",
        data: null,
      });
    }

    const workflow = await aiWorkflowService.createWorkflow({
      contentId,
      currentUserId,
      workflowType: "SCRIPT_GENERATION",
    });

    const generatedScript =
      await workflowExecutionService.executeScriptGeneration(
        workflow.id,
        currentUserId,
      );

    return res.status(201).json({
      status: "SUCCESS",
      message: "Script generated successfully",
      data: {
        responseData: {
          workflowId: workflow.id,
          generatedScript,
        },
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
      },
    });
  } catch (error) {
    console.error("Failed to generate script:", error);

    return res.status(500).json({
      status: "ERROR",
      message: "Failed to generate script",
      data: null,
    });
  }
};

export const getWorkflowByIdController: RequestHandler = async (req, res) => {
  try {
    const workflowId = req.params.workflowId;

    if (!workflowId || Array.isArray(workflowId)) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid workflow ID",
        data: null,
      });
    }

    const currentUserId = req.currentUser.id;

    const workflow = await aiWorkflowService.getWorkflowById(
      workflowId,
      currentUserId,
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: "AI workflow retrieved successfully",
      data: {
        responseData: workflow,
      },
    });
  } catch (error) {
    console.error("Failed to fetch AI workflow:", error);

    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch AI workflow",
      data: null,
    });
  }
};

export const getGeneratedScriptController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const workflowId = req.params.workflowId;

    if (!workflowId || Array.isArray(workflowId)) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid workflow ID",
        data: null,
      });
    }

    const currentUserId = req.currentUser.id;

    const generatedScript = await aiWorkflowService.getGeneratedScript(
      workflowId,
      currentUserId,
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: "Generated script retrieved successfully",
      data: {
        responseData: generatedScript,
      },
    });
  } catch (error) {
    console.error("Failed to fetch generated script:", error);

    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch generated script",
      data: null,
    });
  }
};

export const createVideoWorkflowController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { contentId } = req.body;
    const currentUserId = req.currentUser.id;

    if (!contentId || typeof contentId !== "string") {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid content ID",
        data: null,
      });
    }

    const workflow = await aiWorkflowService.createWorkflow({
      contentId,
      currentUserId,
      workflowType: "VIDEO_GENERATION",
    });

    /*
     * Don't wait for Veo.
     *
     * For our current MVP this runs in the Express process.
     * Later this gets moved into a proper worker/queue.
     */
    void workflowExecutionService
      .executeVideoGeneration(workflow.id, currentUserId)
      .catch((error: unknown) => {
        console.error("Background video generation failed:", error);
      });

    return res.status(202).json({
      status: "SUCCESS",
      message: "Video generation started",
      data: {
        responseData: {
          workflowId: workflow.id,
          status: workflow.status,
        },
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
      },
    });
  } catch (error) {
    console.error("Failed to start video generation:", error);

    return res.status(500).json({
      status: "ERROR",
      message: "Failed to start video generation",
      data: null,
    });
  }
};
