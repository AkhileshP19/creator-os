export const ApiEndPoint = {
  GET_DASHBOARD_OVERVIEW: "api/dashboard/overview",
  GET_DASHBOARD_PROJECTS: "api/dashboard/projects",
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