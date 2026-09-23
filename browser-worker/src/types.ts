export interface FlowVideoGenerationInput {
  workflowId: string;
  prompt: string;
  durationSeconds: number;
  aspectRatio: "9:16";
}

export interface FlowVideoGenerationResult {
  workflowId: string;
  fileName: string;
  localFilePath: string;
}
