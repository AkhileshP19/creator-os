export interface ScriptScene {
  sceneNumber: number;
  durationSeconds: number;
  visualDescription: string;
  voiceover: string;
  onScreenText: string;
}

export interface GeneratedScript {
  title: string;
  hook: string;
  narration: string;
  durationSeconds: number;
  aspectRatio: "9:16";
  scenes: ScriptScene[];
  keywords: string[];
  callToAction: string;
}

export interface ScriptGenerationInput {
  topic: string;
  fact: string;
  brandName: string;
  durationSeconds: number;
  aspectRatio: "9:16";
}

export interface VideoGenerationInput {
  title: string;
  hook: string;
  narration: string;
  durationSeconds: number;
  aspectRatio: "9:16";
  scenes: ScriptScene[];
  keywords: string[];
  callToAction: string;
}

export interface GeneratedVideoResult {
  localFilePath: string;
  fileName: string;
}
