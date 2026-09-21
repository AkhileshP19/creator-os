export interface GeneratedScriptScene {
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
  scenes: GeneratedScriptScene[];
  keywords: string[];
  callToAction: string;
}

export interface GenerateScriptRequest {
  contentId: string;
}

export interface GenerateScriptResponse {
  status: "SUCCESS" | "ERROR";
  message: string;
  data: {
    responseData: {
      workflowId: string;
      generatedScript: GeneratedScript;
    };
    totalCount: number;
    totalPages: number;
    currentPage: number;
  } | null;
}
