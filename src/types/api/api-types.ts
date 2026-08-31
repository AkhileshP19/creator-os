export const ApiEndPoint = {
  GET_DASHBOARD_OVERVIEW: "api/dashboard/overview",
  GET_DASHBOARD_PROJECTS: "api/dashboard/projects",
  GET_AI_ACTIVITY: "api/dashboard/ai-activity",
  GET_PENDING_REVIEWS: "api/dashboard/reviews",
  GET_AUTOMATION_ACTIVITY: "api/dashboard/automation"
} as const;

// Define API response structure
export type ApiResponse<T> = {
  responseData: T;
};

// Define paginated API response
export type PaginatedApiResponse<T> = {
  responseData: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

// Define API error type
export type ApiError = {
  statusCode?: number;
  message?: string;
};

export type ApiEndPoint = (typeof ApiEndPoint)[keyof typeof ApiEndPoint];