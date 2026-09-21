type ScriptGenerationStatus =
  | "NOT_GENERATED"
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface ContentIdea {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[]; // Or JsonValue if your API raw returns generic json
  status: "DRAFT" | "ARCHIVED" | "PENDING" | "IN_PROGRESS" | "COMPLETED";
  scheduledDate: string | null;
  priority: "P0" | "P1" | "P2" | "P3";
  createdById: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  script: {
    status: ScriptGenerationStatus;
    workflowId: string;
  };
}

export interface CreateContentIdeaRequest {
  projectId: string;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[]; // Or JsonValue if your API raw returns generic json
  status: "DRAFT" | "ARCHIVED" | "PENDING" | "IN_PROGRESS" | "COMPLETED";
  scheduledDate: string | null;
  priority: "P0" | "P1" | "P2" | "P3";
}

export interface CreateContentIdeaResponse {
  status: "SUCCESS" | "ERROR";
  message: string;
  data: {
    responseData: ContentIdea;
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
}
