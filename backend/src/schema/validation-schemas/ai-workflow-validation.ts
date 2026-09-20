import { z } from "zod";

export const scriptSceneSchema = z.object({
  sceneNumber: z.number().int().positive(),
  durationSeconds: z.number().positive(),
  visualDescription: z.string().min(1),
  voiceover: z.string().min(1),
  onScreenText: z.string(),
});

export const generatedScriptSchema = z.object({
  title: z.string().min(1),
  hook: z.string().min(1),
  narration: z.string().min(1),
  durationSeconds: z.number().min(9).max(15),
  aspectRatio: z.literal("9:16"),
  scenes: z.array(scriptSceneSchema).min(1),
  keywords: z.array(z.string()).min(1).max(2),
  callToAction: z.string(),
});