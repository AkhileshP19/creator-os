import type { ApiResponse } from "@/types/api/api-types";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "REGENERATE";
export type ReviewStatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
export type WorkflowStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";
export type PublishStatus =
  | "QUEUED"
  | "UPLOADING"
  | "SCHEDULED"
  | "PUBLISHED"
  | "FAILED";
export interface ApprovalListItem {
  approvalId: string;
  status: ApprovalStatus;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  contentId: string;
  title: string;
  tags: unknown;
  description: string | null;
  category: string | null;
  scheduledDate: string | null;
  projectId: string;
  projectName: string;
  workflowId: string | null;
  workflowStatus: WorkflowStatus | null;
  assetId: string | null;
  generatedAt: string | null;
  durationSeconds: number | null;
  videoUrl: string | null;
  playbackError: string | null;
  regenerationWorkflowId: string | null;
  regenerationStatus: WorkflowStatus | null;
  regenerationError: string | null;
  publishJobId: string | null;
  publishStatus: PublishStatus | null;
  externalVideoUrl: string | null;
  publishError: string | null;
}
export type ApprovalDetail = ApprovalListItem;
export interface ApprovalFilters {
  status: ReviewStatusFilter;
  projectId: string;
  scheduledDateFilter: "ALL" | "TODAY" | "NEXT_7_DAYS" | "UNSCHEDULED";
  sortBy: "scheduledDate" | "generatedAt";
  sortOrder: "ASC" | "DESC";
  timezone: string;
}
export interface ApprovalQueryParams extends ApprovalFilters {
  pageNo: number;
  pageSize: number;
  search: string;
}
export type ApproveRequest = Record<string, never>;
export interface RejectRequest {
  comments?: string;
}
export type ApproveResponse = ApiResponse<ApprovalDetail>;
export type RejectResponse = ApiResponse<ApprovalDetail>;
export interface RegenerateResponse {
  responseData: {
    approvalId: string;
    workflowId: string;
    status: WorkflowStatus;
  };
}
