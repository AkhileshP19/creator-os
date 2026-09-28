export interface GenerateVideoRequest {
  contentId: string;
}

export interface GeneratedVideo {
  workflowId: string;
  assetId: string;
  objectKey: string;
  videoUrl: string;
}
