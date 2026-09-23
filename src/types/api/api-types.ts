export const ApiEndPoint = {
  GET_DASHBOARD_OVERVIEW: "api/dashboard/overview",
  GET_DASHBOARD_PROJECTS: "/api/projects",
  GET_AI_ACTIVITY: "api/dashboard/ai-activity",
  GET_PENDING_REVIEWS: "api/dashboard/reviews",
  GET_AUTOMATION_ACTIVITY: "api/dashboard/automation",
  GET_AUTH_ME: "/api/auth/me",

  CREATE_PROJECT: "/api/projects",
  UPDATE_PROJECT: "/api/projects/{id}",
  DELETE_PROJECT: "/api/projects/delete/{id}",
  GET_ALL_PROJECTS: "/api/projects/all",

  GET_PROJECT_SETTINGS: "/api/projects/{id}/settings",
  CREATE_PROJECT_SETTINGS: "/api/projects/{id}/settings",
  UPDATE_PROJECT_SETTINGS: "/api/projects/{id}/settings",

  CREATE_CONTENT_IDEA: "/api/content-ideas",
  UPDATE_CONTENT_IDEA: "/api/content-ideas/{id}",
  DELETE_CONTENT_IDEA: "/api/content-ideas/delete/{id}",

  GENERATE_SCRIPT: "/api/ai/workflows",
  GET_WORKFLOW: "/api/ai/workflws/{id}",
  GET_SCRIPT: "/api/ai/workflows/{id}/script",

  GENERATE_VIDEO: "/api/ai/video-workflows",
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
