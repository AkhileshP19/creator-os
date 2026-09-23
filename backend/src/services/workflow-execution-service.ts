import { Temporal } from "temporal-polyfill";
import { db } from "../prisma/db.js";
import aiWorkflowService from "./ai-workflow-service.js";
import { generateScript } from "./gemini-service.js";
import type {
  GeneratedScript,
  ScriptGenerationInput,
  VideoGenerationInput,
} from "../types/ai-workflow-types.js";
import type { JsonValue } from "@prisma/orm-postgres/target/codec-types";
import { generatedScriptSchema } from "../schema/validation-schemas/ai-workflow-validation.js";
import { buildVideoPrompt, generateVideo } from "./gemini-video-service.js";

const workflowExecutionService = {
  executeScriptGeneration: async (
    workflowId: string,
    currentUserId: string,
  ): Promise<GeneratedScript> => {
    const workflow = await aiWorkflowService.getWorkflowById(
      workflowId,
      currentUserId,
    );

    if (workflow.workflowType !== "SCRIPT_GENERATION") {
      const error = new Error("Workflow is not a script generation workflow");
      Object.assign(error, { statusCode: 400 });
      throw error;
    }

    if (workflow.status !== "QUEUED") {
      const error = new Error(
        `Workflow cannot be executed from status ${workflow.status}`,
      );
      Object.assign(error, { statusCode: 400 });
      throw error;
    }

    const contentIdea = await db.orm.public.ContentIdea.where({
      id: workflow.contentId,
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

    if (!contentIdea.description?.trim()) {
      const error = new Error(
        "Content idea description is required for script generation",
      );
      Object.assign(error, { statusCode: 400 });
      throw error;
    }

    const project = await db.orm.public.Project.where({
      id: contentIdea.projectId,
      ownerId: currentUserId,
      deletedAt: null,
    }).first();

    if (!project) {
      const error = new Error(
        "Project not found or you do not have access to it",
      );
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    const projectSettings = await db.orm.public.ProjectSettings.where({
      projectId: project.id,
    }).first();

    if (!projectSettings) {
      const error = new Error(
        "Project settings are required before generating a script",
      );
      Object.assign(error, { statusCode: 400 });
      throw error;
    }

    if (projectSettings.defaultAspectRatio !== "9:16") {
      const error = new Error(
        "Script generation currently supports only the 9:16 aspect ratio",
      );
      Object.assign(error, { statusCode: 400 });
      throw error;
    }

    const scriptInput: ScriptGenerationInput = {
      topic: contentIdea.title,
      fact: contentIdea.description,
      brandName: projectSettings.brandName,
      durationSeconds: projectSettings.defaultDuration,
      aspectRatio: "9:16",
    };

    const scriptInputJson: JsonValue = {
      topic: scriptInput.topic,
      fact: scriptInput.fact,
      brandName: scriptInput.brandName,
      durationSeconds: scriptInput.durationSeconds,
      aspectRatio: scriptInput.aspectRatio,
    };

    const startedAt = Temporal.Now.instant();
    const startTime = Date.now();

    await aiWorkflowService.updateWorkflowState(workflow.id, {
      status: "RUNNING",
      startedAt,
      currentStep: "GENERATING_SCRIPT",
      errorMessage: null,
    });

    try {
      const generatedScript = await generateScript(scriptInput);

      const generatedScriptJson: JsonValue = {
        title: generatedScript.title,
        hook: generatedScript.hook,
        narration: generatedScript.narration,
        durationSeconds: generatedScript.durationSeconds,
        aspectRatio: generatedScript.aspectRatio,
        scenes: generatedScript.scenes.map((scene) => ({
          sceneNumber: scene.sceneNumber,
          durationSeconds: scene.durationSeconds,
          visualDescription: scene.visualDescription,
          voiceover: scene.voiceover,
          onScreenText: scene.onScreenText,
        })),
        keywords: generatedScript.keywords,
        callToAction: generatedScript.callToAction,
      };

      const response = JSON.stringify(generatedScript);

      await db.orm.public.AIRequest.create({
        workflowId: workflow.id,
        provider: workflow.provider,
        model: workflow.model,
        prompt: JSON.stringify(scriptInput),
        response,
        input: scriptInputJson,
        output: generatedScriptJson,
        tokenUsage: null,
        errorMessage: null,
      });

      const completedAt = Temporal.Now.instant();
      const executionTime = Date.now() - startTime;

      await aiWorkflowService.updateWorkflowState(workflow.id, {
        status: "COMPLETED",
        completedAt,
        executionTime,
        currentStep: "SCRIPT_GENERATED",
        errorMessage: null,
      });

      return generatedScript;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown script generation error";

      const completedAt = Temporal.Now.instant();
      const executionTime = Date.now() - startTime;

      await db.orm.public.AIRequest.create({
        workflowId: workflow.id,
        provider: workflow.provider,
        model: workflow.model,
        prompt: JSON.stringify(scriptInput),
        response: null,
        input: scriptInputJson,
        output: null,
        tokenUsage: null,
        errorMessage,
      });

      await aiWorkflowService.updateWorkflowState(workflow.id, {
        status: "FAILED",
        completedAt,
        executionTime,
        currentStep: "SCRIPT_GENERATION_FAILED",
        errorMessage,
      });

      throw error;
    }
  },

  executeVideoGeneration: async (workflowId: string, currentUserId: string) => {
    const workflow = await aiWorkflowService.getWorkflowById(
      workflowId,
      currentUserId,
    );

    if (workflow.workflowType !== "VIDEO_GENERATION") {
      const error = new Error("Workflow is not a video generation workflow");

      Object.assign(error, { statusCode: 400 });

      throw error;
    }

    if (workflow.status !== "QUEUED") {
      const error = new Error(
        `Workflow cannot be executed from status ${workflow.status}`,
      );

      Object.assign(error, { statusCode: 400 });

      throw error;
    }

    const contentIdea = await db.orm.public.ContentIdea.where({
      id: workflow.contentId,
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

    /*
     * Find the latest successfully generated script.
     */
    const scriptWorkflow = await db.orm.public.AIWorkflow.where({
      contentId: contentIdea.id,
      workflowType: "SCRIPT_GENERATION",
      status: "COMPLETED",
    })
      .orderBy((item) => item.createdAt.desc())
      .first();

    if (!scriptWorkflow) {
      const error = new Error(
        "A completed script is required before generating a video",
      );

      Object.assign(error, { statusCode: 400 });

      throw error;
    }

    /*
     * Retrieve the AIRequest containing the actual generated script.
     */
    const scriptRequest = await db.orm.public.AIRequest.where({
      workflowId: scriptWorkflow.id,
    })
      .orderBy((request) => request.createdAt.desc())
      .first();

    if (!scriptRequest?.output) {
      const error = new Error("Generated script output could not be found");

      Object.assign(error, { statusCode: 404 });

      throw error;
    }

    /*
     * Runtime validation converts Prisma JsonValue into our
     * strongly typed GeneratedScript.
     */
    const generatedScript: GeneratedScript = generatedScriptSchema.parse(
      scriptRequest.output,
    );

    if (
      generatedScript.durationSeconds < 3 ||
      generatedScript.durationSeconds > 10
    ) {
      const error = new Error(
        "Video generation currently supports durations between 3 and 10 seconds",
      );

      Object.assign(error, {
        statusCode: 400,
      });

      throw error;
    }

    const videoInput: VideoGenerationInput = {
      title: generatedScript.title,
      hook: generatedScript.hook,
      narration: generatedScript.narration,
      durationSeconds: generatedScript.durationSeconds,
      aspectRatio: generatedScript.aspectRatio,
      scenes: generatedScript.scenes,
      keywords: generatedScript.keywords,
      callToAction: generatedScript.callToAction,
    };

    const videoInputJson: JsonValue = {
      title: videoInput.title,
      hook: videoInput.hook,
      narration: videoInput.narration,
      durationSeconds: videoInput.durationSeconds,
      aspectRatio: videoInput.aspectRatio,

      scenes: videoInput.scenes.map((scene) => ({
        sceneNumber: scene.sceneNumber,
        durationSeconds: scene.durationSeconds,
        visualDescription: scene.visualDescription,
        voiceover: scene.voiceover,
        onScreenText: scene.onScreenText,
      })),

      keywords: videoInput.keywords,
      callToAction: videoInput.callToAction,
    };

    const prompt = buildVideoPrompt(videoInput);

    const startedAt = Temporal.Now.instant();
    const startTime = Date.now();

    await aiWorkflowService.updateWorkflowState(workflow.id, {
      status: "RUNNING",
      startedAt,
      currentStep: "GENERATING_VIDEO",
      errorMessage: null,
    });

    try {
      const generatedVideo = await generateVideo(videoInput, workflow.id);

      /*
       * DEV-ONLY storage URL.
       *
       * Later this becomes the permanent S3/R2/etc. URL.
       */
      const storageUrl = `/generated-videos/${generatedVideo.fileName}`;

      const videoOutputJson: JsonValue = {
        fileName: generatedVideo.fileName,
        storageUrl,
      };

      await db.orm.public.AIRequest.create({
        workflowId: workflow.id,
        provider: workflow.provider,
        model: workflow.model,
        prompt,
        response: JSON.stringify({
          fileName: generatedVideo.fileName,
          storageUrl,
        }),
        input: videoInputJson,
        output: videoOutputJson,
        tokenUsage: null,
        errorMessage: null,
      });

      /*
       * Store the generated media reference.
       *
       * We store the URL/path, NOT the MP4 binary itself.
       */
      const asset = await db.orm.public.Asset.create({
        workflowId: workflow.id,
        storageUrl,
        assetType: "VIDEO",
      });

      const completedAt = Temporal.Now.instant();
      const executionTime = Date.now() - startTime;

      await aiWorkflowService.updateWorkflowState(workflow.id, {
        status: "COMPLETED",
        completedAt,
        executionTime,
        currentStep: "VIDEO_GENERATED",
        errorMessage: null,
      });

      return {
        workflowId: workflow.id,
        assetId: asset.id,
        storageUrl,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown video generation error";

      const completedAt = Temporal.Now.instant();
      const executionTime = Date.now() - startTime;

      await db.orm.public.AIRequest.create({
        workflowId: workflow.id,
        provider: workflow.provider,
        model: workflow.model,
        prompt,
        response: null,
        input: videoInputJson,
        output: null,
        tokenUsage: null,
        errorMessage,
      });

      await aiWorkflowService.updateWorkflowState(workflow.id, {
        status: "FAILED",
        completedAt,
        executionTime,
        currentStep: "VIDEO_GENERATION_FAILED",
        errorMessage,
      });

      throw error;
    }
  },
};

export default workflowExecutionService;
