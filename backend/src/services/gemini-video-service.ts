

import { GoogleGenAI } from "@google/genai";
import fs from "node:fs/promises";
import path from "node:path";

import type {
  GeneratedVideoResult,
  VideoGenerationInput,
} from "../types/ai-workflow-types.js";

const apiKey = process.env.GEMINI_API_KEY;
const geminiVideoModel = process.env.GEMINI_VIDEO_MODEL;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

if (!geminiVideoModel) {
  throw new Error("GEMINI_VIDEO_MODEL is not configured");
}

const model: string = geminiVideoModel;

const geminiClient = new GoogleGenAI({
  apiKey,
});

const generatedVideosDirectory = path.resolve(
  process.cwd(),
  "generated-videos",
);

export function buildVideoPrompt(input: VideoGenerationInput): string {
  const scenes = input.scenes
    .map(
      (scene) => `
Scene ${scene.sceneNumber}
Duration: ${scene.durationSeconds} seconds
Visual: ${scene.visualDescription}
Voiceover: ${scene.voiceover}
On-screen text: ${scene.onScreenText}
`,
    )
    .join("\n");

  return `
Create a highly engaging vertical short-form factual video.

Title: ${input.title}
Hook: ${input.hook}
Narration: ${input.narration}

Target duration: ${input.durationSeconds} seconds
Aspect ratio: ${input.aspectRatio}

Scenes:
${scenes}

Important keywords:
${input.keywords.join(", ")}

Call to action:
${input.callToAction}

Requirements:
- Create a polished vertical social-media video.
- Keep the pacing fast and engaging.
- Follow the visual descriptions closely.
- Preserve subject consistency across scenes.
- Use realistic cinematic visuals.
- Use natural camera movement.
- Optimize everything for 9:16 mobile viewing.
- Include appropriate native audio.
`;
}

export async function generateVideo(
  input: VideoGenerationInput,
  workflowId: string,
): Promise<GeneratedVideoResult> {
  const prompt = buildVideoPrompt(input);

  await fs.mkdir(generatedVideosDirectory, {
    recursive: true,
  });

  const fileName = `${workflowId}.mp4`;

  const localFilePath = path.join(generatedVideosDirectory, fileName);

  const interaction = await geminiClient.interactions.create({
    model,
    input: prompt,
    response_format: {
      type: "video",
      aspect_ratio: "9:16",
      resolution: "720p",
    },
  });

  const videoData = interaction.output_video?.data;

  if (!videoData) {
    throw new Error("Gemini Omni did not return generated video data");
  }

  const videoBuffer = Buffer.from(videoData, "base64");

  await fs.writeFile(localFilePath, videoBuffer);

  return {
    localFilePath,
    fileName,
  };
}
