import { Temporal } from "temporal-polyfill";
import { db } from "../prisma/db.js";
import aiWorkflowService from "./ai-workflow-service.js";
import { generateScript } from "./gemini-service.js";
import type {
    GeneratedScript,
    ScriptGenerationInput,
} from "../types/ai-workflow-types.js";
import type { JsonValue } from "@prisma/orm-postgres/target/codec-types";

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
            const error = new Error(
                "Workflow is not a script generation workflow",
            );
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
};

export default workflowExecutionService;