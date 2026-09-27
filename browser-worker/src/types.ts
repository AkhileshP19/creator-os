export type FlowAspectRatio = "9:16";

export interface FlowVideoGenerationInput {
  workflowId: string;
  userId: string;
  projectId: string;
  prompt: string;
  durationSeconds: number;
  aspectRatio: FlowAspectRatio;
}

export interface FlowVideoGenerationResult {
  workflowId: string;
  fileName: string;
  localFilePath: string;
  objectKey: string;
}