export interface GenerateVideoRequest {
  contentId: string;
}

export interface GenerateVideoResponse {
  responseData: {
    workflowId: string;
    status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  };
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface GeneratedVideo {
  workflowId: string;
  assetId: string;
  videoUrl: string;
}
