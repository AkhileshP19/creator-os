
import { GoogleGenAI } from "@google/genai";
import type {
    GeneratedScript,
    ScriptGenerationInput,
} from "../types/ai-workflow-types.js";
import { generatedScriptSchema } from "../schema/validation-schemas/ai-workflow-validation.js";

const apiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL;

if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
}

if (!geminiModel) {
    throw new Error("GEMINI_MODEL is not configured");
}

const model: string = geminiModel;

const geminiClient = new GoogleGenAI({
    apiKey,
});

const scriptSchema = {
    type: "object",
    properties: {
        title: { type: "string" },
        hook: { type: "string" },
        narration: { type: "string" },
        durationSeconds: { type: "number" },
        aspectRatio: { type: "string" },
        scenes: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    sceneNumber: { type: "integer" },
                    durationSeconds: { type: "number" },
                    visualDescription: { type: "string" },
                    voiceover: { type: "string" },
                    onScreenText: { type: "string" },
                },
                required: [
                    "sceneNumber",
                    "durationSeconds",
                    "visualDescription",
                    "voiceover",
                    "onScreenText",
                ],
            },
        },
        keywords: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 2,
        },
        callToAction: { type: "string" },
    },
    required: [
        "title",
        "hook",
        "narration",
        "durationSeconds",
        "aspectRatio",
        "scenes",
        "keywords",
        "callToAction",
    ],
} as const;

export async function generateScript(
    input: ScriptGenerationInput,
): Promise<GeneratedScript> {
    const prompt = `
Create a highly engaging short-form factual video script.

Brand: ${input.brandName}
Topic: ${input.topic}
Fact: ${input.fact}
Duration: ${input.durationSeconds} seconds
Aspect ratio: ${input.aspectRatio}

Requirements:
- Create an attention-grabbing hook.
- Keep the narration concise and suitable for the requested duration.
- Divide the video into clear visual scenes.
- Generate exactly 1 or 2 important keywords for the keywords array.
- Never generate more than 2 keywords.
- Make the visuals creative and factually relevant.
- Return only valid JSON matching the provided schema.
`;

    const response = await geminiClient.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: scriptSchema,
        },
    });

    const responseText = response.text;

    if (!responseText) {
        throw new Error("Gemini returned an empty response");
    }

    const parsedResponse: unknown = JSON.parse(responseText);

    return generatedScriptSchema.parse(parsedResponse);
}